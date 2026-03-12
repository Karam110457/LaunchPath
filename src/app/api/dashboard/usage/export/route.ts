/**
 * Usage CSV Export API
 * GET /api/dashboard/usage/export?period=30d&clientId=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get("period") ?? "30d";
  const clientId = req.nextUrl.searchParams.get("clientId");

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from("usage_logs")
    .select(
      "created_at, agent_id, client_id, model, model_tier, credits_consumed, input_tokens, output_tokens"
    )
    .eq("user_id", user.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data: logs } = await query;

  // Fetch agent and client names for display
  const [{ data: agents }, { data: clients }] = await Promise.all([
    supabase.from("ai_agents").select("id, name").eq("user_id", user.id),
    supabase.from("clients").select("id, name").eq("user_id", user.id),
  ]);

  const agentMap = new Map(
    (agents ?? []).map((a: { id: string; name: string }) => [a.id, a.name])
  );
  const clientMap = new Map(
    (clients ?? []).map((c: { id: string; name: string }) => [c.id, c.name])
  );

  // Build CSV
  const headers = [
    "Date",
    "Agent",
    "Client",
    "Model",
    "Tier",
    "Credits",
    "Input Tokens",
    "Output Tokens",
  ];

  const rows = (logs ?? []).map((log) => [
    new Date(log.created_at).toISOString(),
    agentMap.get(log.agent_id) ?? log.agent_id ?? "",
    log.client_id ? (clientMap.get(log.client_id) ?? log.client_id) : "",
    log.model,
    log.model_tier,
    String(log.credits_consumed),
    String(log.input_tokens ?? 0),
    String(log.output_tokens ?? 0),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const dateStr = new Date().toISOString().slice(0, 10);

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="usage-export-${dateStr}.csv"`,
    },
  });
}

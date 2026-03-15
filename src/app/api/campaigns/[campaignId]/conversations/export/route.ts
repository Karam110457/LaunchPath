/**
 * Campaign Conversation Export API (Agency-side)
 * GET /api/campaigns/[campaignId]/conversations/export?format=csv|json
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const format = req.nextUrl.searchParams.get("format") ?? "json";
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify campaign ownership
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Get channel(s) for this campaign
  const { data: channels } = await supabase
    .from("agent_channels")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id);

  const channelIds = (channels ?? []).map((c) => c.id);
  if (channelIds.length === 0) {
    if (format === "csv") {
      return new Response("No conversations found", {
        headers: { "Content-Type": "text/csv" },
      });
    }
    return NextResponse.json({ conversations: [] });
  }

  const { data: conversations } = await supabase
    .from("channel_conversations")
    .select("*")
    .in("channel_id", channelIds)
    .order("created_at", { ascending: false });

  const rows = (conversations ?? []).map((conv) => {
    const row = conv as Record<string, unknown>;
    const messages = (row.messages ?? []) as Array<{
      role: string;
      content: string;
      timestamp?: string;
    }>;
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      session_id: row.session_id,
      status: row.status ?? "active",
      message_count: messages.length,
      visitor_name: metadata.visitor_name ?? null,
      visitor_email: metadata.visitor_email ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      total_credits: row.total_credits ?? 0,
      messages: format === "json" ? messages : undefined,
    };
  });

  if (format === "csv") {
    const headers = [
      "id", "session_id", "status", "message_count",
      "visitor_name", "visitor_email", "total_credits",
      "created_at", "updated_at",
    ];
    const csvLines = [headers.join(",")];
    for (const row of rows) {
      const values = headers.map((h) => {
        const val = (row as Record<string, unknown>)[h];
        if (val == null) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      });
      csvLines.push(values.join(","));
    }

    return new Response(csvLines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="conversations-${campaignId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ conversations: rows });
}

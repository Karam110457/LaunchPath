/**
 * Portal Conversation Export API
 * GET /api/portal/conversations/export?campaignId=X&format=csv|json
 *
 * Exports conversation data as CSV or JSON for compliance/analytics.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClientAuth } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  const { clientId } = await requireClientAuth();
  const campaignId = request.nextUrl.searchParams.get("campaignId");
  const format = request.nextUrl.searchParams.get("format") ?? "json";

  const supabase = await createClient();

  // Get campaigns for this client
  let campaignFilter: string[] = [];
  if (campaignId) {
    // Verify this campaign belongs to the client
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("client_id", clientId)
      .single();
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    campaignFilter = [campaignId];
  } else {
    // Get all campaigns for this client
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id")
      .eq("client_id", clientId);
    campaignFilter = (campaigns ?? []).map((c) => c.id);
  }

  if (campaignFilter.length === 0) {
    return NextResponse.json({ error: "No campaigns found" }, { status: 404 });
  }

  // Get channels for these campaigns
  const { data: channels } = await supabase
    .from("agent_channels")
    .select("id")
    .in("campaign_id", campaignFilter);

  const channelIds = (channels ?? []).map((c) => c.id);
  if (channelIds.length === 0) {
    return NextResponse.json({ conversations: [] });
  }

  // Get conversations
  const { data: conversations } = await supabase
    .from("channel_conversations")
    .select("*")
    .in("channel_id", channelIds)
    .order("created_at", { ascending: false });

  const rows = (conversations ?? []).map((conv) => {
    const row = conv as Record<string, unknown>;
    const messages = (row.messages ?? []) as Array<{ role: string; content: string }>;
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      session_id: row.session_id,
      status: row.status ?? "active",
      message_count: messages.length,
      visitor_name: metadata.visitor_name ?? null,
      visitor_email: metadata.visitor_email ?? null,
      csat_rating: metadata.csat_rating ?? null,
      csat_feedback: metadata.csat_feedback ?? null,
      escalation_reason: metadata.escalation_reason ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

  if (format === "csv") {
    const headers = [
      "id", "session_id", "status", "message_count",
      "visitor_name", "visitor_email", "csat_rating", "csat_feedback",
      "escalation_reason", "created_at", "updated_at",
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
        "Content-Disposition": `attachment; filename="conversations-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ conversations: rows });
}

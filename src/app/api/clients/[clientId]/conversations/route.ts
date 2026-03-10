/**
 * Dashboard Client Conversations API
 * GET /api/clients/[clientId]/conversations — list conversations for a client
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // Get campaigns for this client owned by the authenticated user
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("client_id", clientId)
    .eq("user_id", user.id);

  const campaignIds = (campaigns ?? []).map((c) => c.id);
  if (campaignIds.length === 0) {
    return NextResponse.json({ conversations: [] });
  }

  const campaignNameMap = new Map(
    (campaigns ?? []).map((c) => [c.id, c.name])
  );

  // Get channels for these campaigns
  const { data: channels } = await supabase
    .from("agent_channels")
    .select("id, campaign_id")
    .in("campaign_id", campaignIds);

  const channelIds = (channels ?? []).map((ch) => ch.id);
  if (channelIds.length === 0) {
    return NextResponse.json({ conversations: [] });
  }

  const channelCampaignMap = new Map(
    (channels ?? []).map((ch) => [ch.id, ch.campaign_id])
  );

  // Fetch conversations
  const { data: conversations } = await supabase
    .from("channel_conversations")
    .select("*")
    .in("channel_id", channelIds)
    .order("updated_at", { ascending: false })
    .limit(100);

  const shaped = (conversations ?? []).map((conv) => {
    const row = conv as typeof conv & { status?: string };
    const messages = (row.messages ?? []) as Array<{ role: string; content: string }>;
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const campaignId = channelCampaignMap.get(row.channel_id);

    return {
      id: row.id,
      session_id: row.session_id,
      status: row.status ?? "active",
      message_count: messages.length,
      last_message: lastUserMessage?.content?.slice(0, 100) ?? null,
      campaign_name: campaignId ? campaignNameMap.get(campaignId) ?? null : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

  return NextResponse.json({ conversations: shaped });
}

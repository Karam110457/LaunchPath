/**
 * Portal Conversations API
 * GET /api/portal/conversations — list with filters and pagination
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClientAuth } from "@/lib/auth/guards";
import { logger } from "@/lib/security/logger";

export async function GET(request: NextRequest) {
  const { clientId } = await requireClientAuth();
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const campaignId = searchParams.get("campaignId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  // Get channel IDs for this client's campaigns
  let campaignQuery = supabase
    .from("campaigns")
    .select("id")
    .eq("client_id", clientId);

  if (campaignId) {
    campaignQuery = campaignQuery.eq("id", campaignId);
  }

  const { data: campaigns } = await campaignQuery;
  const campaignIds = (campaigns ?? []).map((c) => c.id);

  if (campaignIds.length === 0) {
    return NextResponse.json({ conversations: [], total: 0 });
  }

  const { data: channels } = await supabase
    .from("agent_channels")
    .select("id, campaign_id, name")
    .in("campaign_id", campaignIds);

  const channelIds = (channels ?? []).map((ch) => ch.id);
  if (channelIds.length === 0) {
    return NextResponse.json({ conversations: [], total: 0 });
  }

  // Build conversation maps
  const channelMap = new Map(
    (channels ?? []).map((ch) => [ch.id, ch])
  );
  const campaignMap = new Map(
    (campaigns ?? []).map((c) => [c.id, c])
  );

  // Build conversation query
  let query = supabase
    .from("channel_conversations")
    .select("id, channel_id, agent_id, session_id, messages, metadata, status, created_at, updated_at", { count: "exact" })
    .in("channel_id", channelIds)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }
  if (from) {
    query = query.gte("created_at", from);
  }
  if (to) {
    query = query.lte("created_at", to);
  }

  const { data: conversations, count, error } = await query;

  if (error) {
    logger.error("Portal: failed to fetch conversations", { error, clientId });
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }

  // Shape with campaign/channel info and filter by search if needed
  let shaped = (conversations ?? []).map((conv) => {
    const channel = channelMap.get(conv.channel_id);
    const messages = (conv.messages ?? []) as Array<{ role: string; content: string }>;
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

    return {
      id: conv.id,
      session_id: conv.session_id,
      channel_id: conv.channel_id,
      channel_name: channel?.name ?? null,
      campaign_id: (channel as Record<string, unknown>)?.campaign_id ?? null,
      status: conv.status,
      message_count: messages.length,
      last_message: lastUserMessage?.content?.slice(0, 100) ?? null,
      metadata: conv.metadata,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
    };
  });

  // Client-side search filter (searches last message)
  if (search) {
    const term = search.toLowerCase();
    shaped = shaped.filter(
      (c) =>
        c.last_message?.toLowerCase().includes(term) ||
        c.session_id?.toLowerCase().includes(term)
    );
  }

  return NextResponse.json({
    conversations: shaped,
    total: count ?? shaped.length,
  });
}

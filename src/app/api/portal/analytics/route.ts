/**
 * Portal Analytics API
 * GET /api/portal/analytics?period=7d|30d|90d
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClientAuth } from "@/lib/auth/guards";
import { logger } from "@/lib/security/logger";

export async function GET(request: NextRequest) {
  const { clientId } = await requireClientAuth();
  const supabase = await createClient();

  const period = request.nextUrl.searchParams.get("period") ?? "7d";
  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[period] ?? 7;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  // Get all campaigns for this client
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status")
    .eq("client_id", clientId);

  const campaignIds = (campaigns ?? []).map((c) => c.id);

  if (campaignIds.length === 0) {
    return NextResponse.json({
      total_conversations: 0,
      new_conversations: 0,
      conversations_by_day: [],
      conversations_by_campaign: [],
      average_messages: 0,
      human_takeover_count: 0,
      active_campaigns: 0,
    });
  }

  // Get channels for these campaigns
  const { data: channels } = await supabase
    .from("agent_channels")
    .select("id, campaign_id")
    .in("campaign_id", campaignIds);

  const channelIds = (channels ?? []).map((ch) => ch.id);
  const channelToCampaign = new Map(
    (channels ?? []).map((ch) => [ch.id, ch.campaign_id])
  );

  if (channelIds.length === 0) {
    return NextResponse.json({
      total_conversations: 0,
      new_conversations: 0,
      conversations_by_day: [],
      conversations_by_campaign: [],
      average_messages: 0,
      human_takeover_count: 0,
      active_campaigns: (campaigns ?? []).filter((c) => c.status === "active").length,
    });
  }

  // Get all conversations
  const { data: allConversations } = await supabase
    .from("channel_conversations")
    .select("id, channel_id, messages, status, created_at")
    .in("channel_id", channelIds);

  const conversations = allConversations ?? [];

  // Total
  const total = conversations.length;

  // New in period
  const newConvos = conversations.filter((c) => c.created_at >= sinceISO);
  const newCount = newConvos.length;

  // Human takeover count
  const takeoverCount = conversations.filter((c) => c.status === "human_takeover").length;

  // Average messages
  const totalMessages = conversations.reduce((sum, c) => {
    const msgs = c.messages as unknown[];
    return sum + (Array.isArray(msgs) ? msgs.length : 0);
  }, 0);
  const avgMessages = total > 0 ? Math.round(totalMessages / total) : 0;

  // Conversations by day (for the period)
  const byDay: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay[d.toISOString().split("T")[0]] = 0;
  }
  for (const c of newConvos) {
    const day = c.created_at.split("T")[0];
    if (day in byDay) byDay[day]++;
  }
  const conversationsByDay = Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Conversations by campaign
  const byCampaign: Record<string, number> = {};
  for (const c of conversations) {
    const campId = channelToCampaign.get(c.channel_id) ?? "unknown";
    byCampaign[campId] = (byCampaign[campId] ?? 0) + 1;
  }
  const campaignNameMap = new Map(
    (campaigns ?? []).map((c) => [c.id, c.name])
  );
  const conversationsByCampaign = Object.entries(byCampaign).map(
    ([campaignId, count]) => ({
      campaign_id: campaignId,
      campaign_name: campaignNameMap.get(campaignId) ?? "Unknown",
      count,
    })
  );

  return NextResponse.json({
    total_conversations: total,
    new_conversations: newCount,
    conversations_by_day: conversationsByDay,
    conversations_by_campaign: conversationsByCampaign,
    average_messages: avgMessages,
    human_takeover_count: takeoverCount,
    active_campaigns: (campaigns ?? []).filter((c) => c.status === "active").length,
  });
}

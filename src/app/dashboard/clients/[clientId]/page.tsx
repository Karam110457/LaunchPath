import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ConversationList } from "@/components/conversations/ConversationList";
import Link from "next/link";
import { Megaphone, MessageSquare } from "lucide-react";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // Get campaigns for this client
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("client_id", clientId)
    .eq("user_id", user.id);

  const activeCampaigns = campaigns?.filter((c) => c.status === "active").length ?? 0;
  const totalCampaigns = campaigns?.length ?? 0;
  const campaignIds = campaigns?.map((c) => c.id) ?? [];

  // Get channels for those campaigns
  const { data: channels } = campaignIds.length > 0
    ? await supabase
        .from("agent_channels")
        .select("id, campaign_id")
        .in("campaign_id", campaignIds)
    : { data: [] as { id: string; campaign_id: string | null }[] };

  const channelIds = channels?.map((ch) => ch.id) ?? [];

  // Get conversation counts
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

  let totalConversations = 0;
  let todayConversations = 0;
  let weekConversations = 0;

  if (channelIds.length > 0) {
    const [totalRes, todayRes, weekRes] = await Promise.all([
      supabase
        .from("channel_conversations")
        .select("id", { count: "exact", head: true })
        .in("channel_id", channelIds),
      supabase
        .from("channel_conversations")
        .select("id", { count: "exact", head: true })
        .in("channel_id", channelIds)
        .gte("created_at", todayStart),
      supabase
        .from("channel_conversations")
        .select("id", { count: "exact", head: true })
        .in("channel_id", channelIds)
        .gte("created_at", weekStart),
    ]);
    totalConversations = totalRes.count ?? 0;
    todayConversations = todayRes.count ?? 0;
    weekConversations = weekRes.count ?? 0;
  }

  const stats = [
    { label: "Active Campaigns", value: activeCampaigns },
    { label: "Conversations Today", value: todayConversations },
    { label: "This Week", value: weekConversations },
    { label: "Total Conversations", value: totalConversations },
  ];

  // Get recent conversations (last 5)
  const channelCampaignMap = new Map(
    channels?.map((ch) => [ch.id, ch.campaign_id]) ?? []
  );
  const campaignNameMap = new Map<string, string>();

  if (campaignIds.length > 0) {
    const { data: campaignNames } = await supabase
      .from("campaigns")
      .select("id, name")
      .in("id", campaignIds);
    campaignNames?.forEach((c) => campaignNameMap.set(c.id, c.name));
  }

  const { data: recentConversations } = channelIds.length > 0
    ? await supabase
        .from("channel_conversations")
        .select("id, channel_id, session_id, messages, metadata, updated_at")
        .in("channel_id", channelIds)
        .order("updated_at", { ascending: false })
        .limit(5)
    : { data: [] };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-enter">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            style={{ '--stagger': i } as React.CSSProperties}
            className="rounded-lg border bg-card p-5 space-y-1"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          href={`/dashboard/clients/${clientId}/campaigns`}
          className="text-sm text-primary hover:underline"
        >
          View all campaigns ({totalCampaigns})
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          href={`/dashboard/clients/${clientId}/conversations`}
          className="text-sm text-primary hover:underline"
        >
          View all conversations
        </Link>
      </div>

      {/* Recent conversations */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Recent Conversations
        </h2>
        <ConversationList
          conversations={recentConversations ?? []}
          basePath={`/dashboard/clients/${clientId}/conversations`}
          campaignMap={campaignNameMap}
          channelCampaignMap={channelCampaignMap}
          emptyMessage="No conversations yet. Deploy a campaign to start receiving conversations."
        />
      </div>
    </div>
  );
}

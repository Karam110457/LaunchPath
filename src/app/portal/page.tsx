import { requireClientAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  MessageSquare,
  Megaphone,
  TrendingUp,
  Hand,
  Plus,
  UserPlus,
} from "lucide-react";

export default async function PortalDashboard() {
  const { clientId, role } = await requireClientAuth();
  const supabase = await createClient();

  // Get campaigns for this client
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status")
    .eq("client_id", clientId);

  const activeCampaigns = campaigns?.filter((c) => c.status === "active").length ?? 0;
  const campaignIds = campaigns?.map((c) => c.id) ?? [];

  // Get channels for those campaigns
  const { data: channels } = campaignIds.length > 0
    ? await supabase
        .from("agent_channels")
        .select("id, is_enabled, campaign_id")
        .in("campaign_id", campaignIds)
    : { data: [] };

  const channelIds = channels?.map((ch) => ch.id) ?? [];
  const activeWidgets = channels?.filter((ch) => ch.is_enabled).length ?? 0;

  // Get conversation counts + recent conversations
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

  let totalConversations = 0;
  let todayConversations = 0;
  let weekConversations = 0;
  let takeoverCount = 0;
  let recentConversations: Array<{
    id: string;
    session_id: string;
    status: string;
    messages: Array<{ role: string; content: string }>;
    updated_at: string;
    channel_id: string;
  }> = [];

  if (channelIds.length > 0) {
    const [totalRes, todayRes, weekRes, takeoverRes, recentRes] = await Promise.all([
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
      supabase
        .from("channel_conversations")
        .select("id", { count: "exact", head: true })
        .in("channel_id", channelIds)
        .eq("status", "human_takeover"),
      supabase
        .from("channel_conversations")
        .select("id, session_id, status, messages, updated_at, channel_id")
        .in("channel_id", channelIds)
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);
    totalConversations = totalRes.count ?? 0;
    todayConversations = todayRes.count ?? 0;
    weekConversations = weekRes.count ?? 0;
    takeoverCount = takeoverRes.count ?? 0;
    recentConversations = (recentRes.data ?? []) as typeof recentConversations;
  }

  // Build channel→campaign map for recent conversations
  const channelToCampaign = new Map(
    (channels ?? []).map((ch) => [ch.id, ch.campaign_id])
  );
  const campaignNameMap = new Map(
    (campaigns ?? []).map((c) => [c.id, c.name])
  );

  const stats = [
    { label: "Today", value: todayConversations, icon: MessageSquare },
    { label: "This Week", value: weekConversations, icon: TrendingUp },
    { label: "Total Conversations", value: totalConversations, icon: MessageSquare },
    { label: "Active Campaigns", value: activeCampaigns, icon: Megaphone },
    { label: "Live Widgets", value: activeWidgets, icon: Megaphone },
    { label: "Human Takeovers", value: takeoverCount, icon: Hand },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your campaigns and conversations</p>
        </div>
        {role === "admin" && (
          <div className="flex items-center gap-2">
            <Link
              href="/portal/campaigns/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full gradient-accent-bg text-white hover:scale-[1.02] transition-transform transition-colors duration-150 shadow-sm"
            >
              <Plus className="size-4" />
              New Campaign
            </Link>
            <Link
              href="/portal/settings"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full border border-border/40 bg-card/60 backdrop-blur-md hover:bg-muted/50 transition-colors duration-150"
            >
              <UserPlus className="size-4" />
              Invite
            </Link>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-4 space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="rounded-2xl border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
            <h2 className="text-sm font-semibold">Recent Conversations</h2>
            <Link
              href="/portal/conversations"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border/30">
            {recentConversations.length === 0 ? (
              <p className="px-5 py-10 text-sm text-muted-foreground text-center">
                No conversations yet
              </p>
            ) : (
              recentConversations.map((conv) => {
                const msgs = conv.messages ?? [];
                const lastUserMsg = [...msgs].reverse().find((m) => m.role === "user");
                const campId = channelToCampaign.get(conv.channel_id);
                const campName = campId ? campaignNameMap.get(campId) : null;

                return (
                  <Link
                    key={conv.id}
                    href={`/portal/conversations/${conv.id}`}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors duration-150"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {conv.session_id.slice(0, 8)}
                        </span>
                        {conv.status !== "active" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            conv.status === "human_takeover"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : conv.status === "paused"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-zinc-500/10 text-zinc-500"
                          }`}>
                            {conv.status === "human_takeover" ? "Takeover" : conv.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {lastUserMsg?.content ?? "No messages"}
                      </p>
                      {campName && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{campName}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Campaign Status */}
        <div className="rounded-2xl border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
            <h2 className="text-sm font-semibold">Campaigns</h2>
            <Link
              href="/portal/campaigns"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border/30">
            {(campaigns ?? []).length === 0 ? (
              <p className="px-5 py-10 text-sm text-muted-foreground text-center">
                No campaigns yet
              </p>
            ) : (
              (campaigns ?? []).slice(0, 5).map((camp) => (
                <Link
                  key={camp.id}
                  href={`/portal/campaigns/${camp.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors duration-150"
                >
                  <span className="text-sm font-medium">{camp.name}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    camp.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : camp.status === "paused"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-zinc-500/10 text-zinc-500"
                  }`}>
                    {camp.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

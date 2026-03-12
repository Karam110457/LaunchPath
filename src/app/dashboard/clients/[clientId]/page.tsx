import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Megaphone, MessageSquare, TrendingUp, Rocket } from "lucide-react";

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
    .select("id, name, status")
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
    { label: "Active Campaigns", value: activeCampaigns, icon: Megaphone },
    { label: "Today", value: todayConversations, icon: MessageSquare },
    { label: "This Week", value: weekConversations, icon: TrendingUp },
    { label: "Total Conversations", value: totalConversations, icon: Rocket },
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
        .select("id, channel_id, session_id, status, messages, updated_at")
        .in("channel_id", channelIds)
        .order("updated_at", { ascending: false })
        .limit(5)
    : { data: [] };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-enter">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            style={{ '--stagger': i } as React.CSSProperties}
            className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-5 space-y-1"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="size-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </div>
            <p className="text-3xl font-semibold leading-none tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/clients/${clientId}/campaigns`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full border border-border/40 bg-card/60 backdrop-blur-md hover:bg-muted/50 transition-colors duration-150"
        >
          <Megaphone className="size-4" />
          Campaigns ({totalCampaigns})
        </Link>
        <Link
          href={`/dashboard/clients/${clientId}/conversations`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full border border-border/40 bg-card/60 backdrop-blur-md hover:bg-muted/50 transition-colors duration-150"
        >
          <MessageSquare className="size-4" />
          Conversations
        </Link>
      </div>

      {/* Recent conversations */}
      <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <h2 className="text-sm font-semibold">Recent Conversations</h2>
          <Link
            href={`/dashboard/clients/${clientId}/conversations`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-border/30">
          {(!recentConversations || recentConversations.length === 0) ? (
            <div className="px-6 py-14 text-center">
              <MessageSquare className="size-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No conversations yet. Deploy a campaign to start receiving conversations.
              </p>
            </div>
          ) : (
            recentConversations.map((conv) => {
              const msgs = (conv.messages ?? []) as Array<{ role: string; content: string }>;
              const lastUserMsg = [...msgs].reverse().find((m) => m.role === "user");
              const campId = channelCampaignMap.get(conv.channel_id);
              const campName = campId ? campaignNameMap.get(campId) : null;

              return (
                <Link
                  key={conv.id}
                  href={`/dashboard/clients/${clientId}/conversations?id=${conv.id}`}
                  className="flex items-start gap-3 px-6 py-3.5 hover:bg-muted/30 transition-colors duration-150"
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
    </div>
  );
}

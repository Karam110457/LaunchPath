import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Megaphone,
  TrendingUp,
  Hand,
} from "lucide-react";

export default async function PortalPreviewDashboard({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify ownership
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();
  if (!client) notFound();

  const basePath = `/portal/preview/${clientId}`;

  // Get campaigns for this client
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status")
    .eq("client_id", clientId);

  const activeCampaigns = campaigns?.filter((c) => c.status === "active").length ?? 0;
  const campaignIds = campaigns?.map((c) => c.id) ?? [];

  const { data: channels } = campaignIds.length > 0
    ? await supabase
        .from("agent_channels")
        .select("id, is_enabled, campaign_id")
        .in("campaign_id", campaignIds)
    : { data: [] };

  const channelIds = channels?.map((ch) => ch.id) ?? [];
  const activeWidgets = channels?.filter((ch) => ch.is_enabled).length ?? 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

  let totalConversations = 0;
  let todayConversations = 0;
  let weekConversations = 0;
  let takeoverCount = 0;
  let recentConversations: Array<{
    id: string; session_id: string; status: string;
    messages: Array<{ role: string; content: string }>;
    updated_at: string; channel_id: string;
  }> = [];

  if (channelIds.length > 0) {
    const [totalRes, todayRes, weekRes, takeoverRes, recentRes] = await Promise.all([
      supabase.from("channel_conversations").select("id", { count: "exact", head: true }).in("channel_id", channelIds),
      supabase.from("channel_conversations").select("id", { count: "exact", head: true }).in("channel_id", channelIds).gte("created_at", todayStart),
      supabase.from("channel_conversations").select("id", { count: "exact", head: true }).in("channel_id", channelIds).gte("created_at", weekStart),
      supabase.from("channel_conversations").select("id", { count: "exact", head: true }).in("channel_id", channelIds).eq("status", "human_takeover"),
      supabase.from("channel_conversations").select("id, session_id, status, messages, updated_at, channel_id").in("channel_id", channelIds).order("updated_at", { ascending: false }).limit(5),
    ]);
    totalConversations = totalRes.count ?? 0;
    todayConversations = todayRes.count ?? 0;
    weekConversations = weekRes.count ?? 0;
    takeoverCount = takeoverRes.count ?? 0;
    recentConversations = (recentRes.data ?? []) as typeof recentConversations;
  }

  const channelToCampaign = new Map((channels ?? []).map((ch) => [ch.id, ch.campaign_id]));
  const campaignNameMap = new Map((campaigns ?? []).map((c) => [c.id, c.name]));

  const stats = [
    { label: "Today", value: todayConversations },
    { label: "This Week", value: weekConversations },
    { label: "Total Conversations", value: totalConversations },
    { label: "Active Campaigns", value: activeCampaigns },
    { label: "Live Widgets", value: activeWidgets },
    { label: "Human Takeovers", value: takeoverCount },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-sm font-semibold">Recent Conversations</h2>
            <Link href={`${basePath}/conversations`} className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </div>
          <div className="divide-y">
            {recentConversations.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No conversations yet</p>
            ) : recentConversations.map((conv) => {
              const msgs = conv.messages ?? [];
              const lastUserMsg = [...msgs].reverse().find((m) => m.role === "user");
              const campId = channelToCampaign.get(conv.channel_id);
              const campName = campId ? campaignNameMap.get(campId) : null;
              return (
                <Link key={conv.id} href={`${basePath}/conversations/${conv.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{conv.session_id.slice(0, 8)}</span>
                      {conv.status !== "active" && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${conv.status === "human_takeover" ? "bg-blue-500/10 text-blue-600" : conv.status === "paused" ? "bg-amber-500/10 text-amber-600" : "bg-zinc-500/10 text-zinc-500"}`}>
                          {conv.status === "human_takeover" ? "Takeover" : conv.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{lastUserMsg?.content ?? "No messages"}</p>
                    {campName && <p className="text-xs text-muted-foreground/70 mt-0.5">{campName}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(conv.updated_at).toLocaleDateString()}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-sm font-semibold">Campaigns</h2>
            <Link href={`${basePath}/campaigns`} className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </div>
          <div className="divide-y">
            {(campaigns ?? []).length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No campaigns yet</p>
            ) : (campaigns ?? []).slice(0, 5).map((camp) => (
              <Link key={camp.id} href={`${basePath}/campaigns/${camp.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium">{camp.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${camp.status === "active" ? "bg-emerald-500/10 text-emerald-600" : camp.status === "paused" ? "bg-amber-500/10 text-amber-600" : "bg-zinc-500/10 text-zinc-500"}`}>{camp.status}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

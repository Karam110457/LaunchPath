import { requireClientAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function PortalDashboard() {
  const { clientId } = await requireClientAuth();
  const supabase = await createClient();

  // Get campaigns for this client
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("client_id", clientId);

  const activeCampaigns = campaigns?.filter((c) => c.status === "active").length ?? 0;
  const campaignIds = campaigns?.map((c) => c.id) ?? [];

  // Get channels for those campaigns
  const { data: channels } = campaignIds.length > 0
    ? await supabase
        .from("agent_channels")
        .select("id")
        .in("campaign_id", campaignIds)
    : { data: [] };

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
    { label: "Conversations Today", value: todayConversations },
    { label: "Conversations This Week", value: weekConversations },
    { label: "Total Conversations", value: totalConversations },
    { label: "Active Campaigns", value: activeCampaigns },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-card p-5 space-y-1"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

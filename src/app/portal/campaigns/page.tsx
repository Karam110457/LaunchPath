import { requireClientAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function PortalCampaigns() {
  const { clientId, role } = await requireClientAuth();
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, ai_agents(name), agent_channels(id, is_enabled, channel_type)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  // Get conversation counts per campaign
  const channelIds = (campaigns ?? []).flatMap((c) => {
    const channels = (c as Record<string, unknown>).agent_channels as Array<{ id: string }> ?? [];
    return channels.map((ch) => ch.id);
  });

  let convCounts: Record<string, number> = {};
  if (channelIds.length > 0) {
    const { data: convos } = await supabase
      .from("channel_conversations")
      .select("channel_id")
      .in("channel_id", channelIds);

    for (const conv of convos ?? []) {
      convCounts[conv.channel_id] = (convCounts[conv.channel_id] ?? 0) + 1;
    }
  }

  const statusTabs = ["all", "active", "paused", "draft"] as const;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your active campaigns and deployments</p>
        </div>
        {role === "admin" && (
          <Link
            href="/portal/campaigns/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 shadow-sm"
          >
            <Plus className="size-4" />
            New Campaign
          </Link>
        )}
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-14 text-center">
          <p className="text-muted-foreground mb-4">No campaigns linked to your account yet.</p>
          {role === "admin" && (
            <Link
              href="/portal/campaigns/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 shadow-sm"
            >
              <Plus className="size-4" />
              Create your first campaign
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {campaigns.map((campaign, i) => {
            const raw = campaign as Record<string, unknown>;
            const agent = raw.ai_agents as { name: string } | null;
            const channels = (raw.agent_channels ?? []) as Array<{ id: string; is_enabled: boolean; channel_type: string }>;
            const hasActiveWidget = channels.some((ch) => ch.channel_type === "widget" && ch.is_enabled);
            const totalConvs = channels.reduce((sum, ch) => sum + (convCounts[ch.id] ?? 0), 0);

            return (
              <Link
                key={campaign.id}
                href={`/portal/campaigns/${campaign.id}`}
                className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 hover:border-primary/30 hover:bg-card/80 transition-all duration-150 space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      campaign.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : campaign.status === "paused"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-zinc-500/10 text-zinc-500"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
                {agent?.name && (
                  <p className="text-sm text-muted-foreground">
                    Agent: {agent.name}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{totalConvs} conversation{totalConvs !== 1 ? "s" : ""}</span>
                  {hasActiveWidget && (
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Widget live
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

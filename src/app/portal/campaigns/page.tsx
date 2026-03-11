import { requireClientAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Megaphone } from "lucide-react";

export default async function PortalCampaigns() {
  const { clientId } = await requireClientAuth();
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

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground text-lg">View your active campaigns and deployments</p>
      </div>

      <div className="w-full h-px bg-border/40" />

      {!campaigns || campaigns.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-[32px] border border-dashed border-border/60 bg-card/30">
          <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No campaigns yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
            No campaigns have been set up for your account yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-enter">
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
                style={{ '--stagger': i } as React.CSSProperties}
                className="group rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-6 hover:bg-white dark:hover:bg-[#252525] hover:shadow-md hover:-translate-y-1 transition-[transform,box-shadow,background-color] duration-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xl text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                    {campaign.name}
                  </h3>
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
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Agent: {agent.name}
                  </p>
                )}
                <div className="flex items-center gap-4 pt-3 border-t border-border/40 text-xs text-muted-foreground font-medium">
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

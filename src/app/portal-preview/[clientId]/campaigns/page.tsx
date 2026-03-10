import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function PreviewCampaigns({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();
  if (!client) notFound();

  const basePath = `/portal-preview/${clientId}`;

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, ai_agents(name), agent_channels(id, is_enabled, channel_type)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  // Get conversation counts per campaign
  const channelIds = (campaigns ?? []).flatMap((c) => {
    const raw = c as Record<string, unknown>;
    const channels = (raw.agent_channels ?? []) as Array<{ id: string }>;
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <Link
          href={`${basePath}/campaigns/new`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          New Campaign
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">No campaigns linked to this client yet.</p>
          <Link
            href={`${basePath}/campaigns/new`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Create first campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {campaigns.map((campaign) => {
            const raw = campaign as Record<string, unknown>;
            const agent = raw.ai_agents as { name: string } | null;
            const channels = (raw.agent_channels ?? []) as Array<{ id: string; is_enabled: boolean; channel_type: string }>;
            const hasActiveWidget = channels.some((ch) => ch.channel_type === "widget" && ch.is_enabled);
            const totalConvs = channels.reduce((sum, ch) => sum + (convCounts[ch.id] ?? 0), 0);

            return (
              <Link
                key={campaign.id}
                href={`${basePath}/campaigns/${campaign.id}`}
                className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      campaign.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : campaign.status === "paused"
                          ? "bg-amber-500/10 text-amber-600"
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
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
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

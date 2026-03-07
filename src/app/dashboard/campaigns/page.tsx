import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import Link from "next/link";
import { Megaphone } from "lucide-react";

export default async function CampaignsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, created_at, client_id, client_name, ai_agents(name, personality), clients(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const shaped = (campaigns ?? []).map((c) => {
    const agent = c.ai_agents as unknown as {
      name: string;
      personality: Record<string, unknown> | null;
    } | null;
    const client = c.clients as unknown as { name: string } | null;
    const emoji = (agent?.personality as Record<string, unknown>)?.avatar_emoji as string | undefined;

    return {
      id: c.id,
      name: c.name,
      status: c.status,
      agentName: agent?.name ?? null,
      agentEmoji: emoji ?? null,
      clientName: client?.name ?? c.client_name ?? null,
      clientId: c.client_id,
    };
  });

  const hasCampaigns = shaped.length > 0;

  return (
    <PageShell
      title="Campaigns"
      description="All campaigns across your clients and agents."
    >
      {hasCampaigns ? (
        <div className="rounded-lg border bg-card divide-y">
          {shaped.map((campaign) => {
            const href = campaign.clientId
              ? `/dashboard/clients/${campaign.clientId}/campaigns/${campaign.id}`
              : "#";

            return (
              <Link
                key={campaign.id}
                href={href}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Megaphone className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{campaign.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {campaign.agentName && (
                        <span className="truncate">
                          {campaign.agentEmoji && `${campaign.agentEmoji} `}
                          {campaign.agentName}
                        </span>
                      )}
                      {campaign.agentName && campaign.clientName && (
                        <span className="text-border">|</span>
                      )}
                      {campaign.clientName && (
                        <span className="truncate">{campaign.clientName}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    campaign.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : campaign.status === "paused"
                        ? "bg-yellow-500/10 text-yellow-600"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {campaign.status}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No campaigns yet. Create a campaign from a client&apos;s page to get started.
        </div>
      )}
    </PageShell>
  );
}

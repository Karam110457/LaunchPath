import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ClientCampaignsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, ai_agents(name, personality)")
    .eq("client_id", clientId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Campaigns</h2>
        <Link
          href={`/dashboard/clients/${clientId}/campaigns/new`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-md gradient-accent-bg text-white hover:scale-[1.02] transition-transform border-0"
        >
          <Plus className="size-4" />
          New Campaign
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No campaigns yet. Create one to deploy an AI agent for this client.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => {
            const agent = campaign.ai_agents as unknown as {
              name: string;
              personality: Record<string, unknown> | null;
            } | null;

            return (
              <Link
                key={campaign.id}
                href={`/dashboard/clients/${clientId}/campaigns/${campaign.id}`}
                className="rounded-lg border bg-card p-5 hover:border-primary/30 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm truncate">{campaign.name}</h3>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      campaign.status === "active"
                        ? "bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 text-neutral-900 dark:text-neutral-100 border border-[#FF8C00]/20"
                        : campaign.status === "paused"
                          ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </div>
                {agent?.name && (
                  <p className="text-xs text-muted-foreground">
                    {agent.name}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

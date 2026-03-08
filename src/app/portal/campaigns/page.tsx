import { requireClientAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PortalCampaigns() {
  const { clientId } = await requireClientAuth();
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, ai_agents(name, personality)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>

      {!campaigns || campaigns.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No campaigns linked to your account yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {campaigns.map((campaign) => {
            const agent = campaign.ai_agents as {
              name: string;
              personality: Record<string, unknown> | null;
            } | null;

            return (
              <Link
                key={campaign.id}
                href={`/portal/campaigns/${campaign.id}`}
                className="rounded-lg border bg-card p-5 hover:border-primary/30 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{campaign.name}</h3>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      campaign.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : campaign.status === "paused"
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-muted text-muted-foreground"
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

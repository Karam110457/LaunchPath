import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Megaphone } from "lucide-react";
import { AssignClientDropdown } from "@/components/clients/AssignClientDropdown";

export default async function ClientsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*, campaigns(id)")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const shaped = (clients ?? []).map((c) => {
    const raw = c as Record<string, unknown> & {
      campaigns: { id: string }[] | null;
    };
    return {
      id: raw.id as string,
      name: raw.name as string,
      email: raw.email as string | null,
      website: raw.website as string | null,
      logo_url: raw.logo_url as string | null,
      status: raw.status as string,
      campaign_count: raw.campaigns?.length ?? 0,
    };
  });

  // Fetch campaigns not linked to any client
  const { data: unlinkedCampaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, ai_agents(name, personality)")
    .eq("user_id", user.id)
    .is("client_id", null)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          New Client
        </Link>
      </div>

      {shaped.length === 0 && (!unlinkedCampaigns || unlinkedCampaigns.length === 0) ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No clients yet. Create your first client to start deploying campaigns.
        </div>
      ) : (
        <>
          {shaped.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shaped.map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="rounded-lg border bg-card p-5 hover:border-primary/30 transition-colors space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {client.logo_url ? (
                      <img
                        src={client.logo_url}
                        alt={client.name}
                        className="size-8 rounded object-cover"
                      />
                    ) : (
                      <span className="size-8 rounded bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{client.name}</h3>
                      {client.website && (
                        <p className="text-xs text-muted-foreground truncate">
                          {client.website}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${client.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : client.status === "paused"
                            ? "bg-yellow-500/10 text-yellow-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {client.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {client.campaign_count} campaign{client.campaign_count !== 1 ? "s" : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* Unlinked campaigns — campaigns not yet assigned to a client */}
          {unlinkedCampaigns && unlinkedCampaigns.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Unlinked Campaigns
              </h2>
              <p className="text-xs text-muted-foreground">
                These campaigns aren&apos;t linked to a client yet. Assign them to a client to manage them.
              </p>
              <div className="rounded-lg border bg-card divide-y">
                {unlinkedCampaigns.map((campaign) => {
                  const agent = campaign.ai_agents as unknown as {
                    name: string;
                    personality: Record<string, unknown> | null;
                  } | null;

                  return (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Megaphone className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{campaign.name}</p>
                          {agent?.name && (
                            <p className="text-xs text-muted-foreground">
                              {agent.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${campaign.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : campaign.status === "paused"
                                ? "bg-yellow-500/10 text-yellow-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {campaign.status}
                        </span>
                        {shaped.length > 0 && (
                          <AssignClientDropdown
                            campaignId={campaign.id}
                            clients={shaped.map((c) => ({ id: c.id, name: c.name }))}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

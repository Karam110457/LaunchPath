import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Megaphone } from "lucide-react";
import { AssignClientDropdown } from "@/components/clients/AssignClientDropdown";
import { TopNav } from "@/components/layout/TopNav";
import { GlobalBackground } from "@/components/layout/GlobalBackground";

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
    <div className="min-h-screen bg-background flex flex-col antialiased relative overflow-hidden">
      <GlobalBackground />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <TopNav />
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-lg">Manage your deployed AI campaigns and clients.</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-full shadow-md gradient-accent-bg text-white hover:scale-[1.02] transition-transform border-0"
        >
          <Plus className="size-4" />
          New Client
        </Link>
      </div>

      <div className="w-full h-px bg-border/40" />

      {shaped.length === 0 && (!unlinkedCampaigns || unlinkedCampaigns.length === 0) ? (
        <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-border/60 bg-card/30">
          <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No clients yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
            Create your first client to start deploying campaigns.
          </p>
        </div>
      ) : (
        <>
          {shaped.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-enter">
              {shaped.map((client, i) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  style={{ '--stagger': i } as React.CSSProperties}
                  className="group relative cursor-pointer outline-none overflow-hidden rounded-[32px] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border border-black/5 dark:border-[#2A2A2A] hover:bg-white dark:hover:bg-[#252525] hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[220px]"
                >
                  <div className="p-6 flex flex-col h-full">
                    {/* Top section */}
                    <div className="flex items-start justify-between mb-4">
                      {client.logo_url ? (
                        <div className="w-[52px] h-[52px] rounded-[18px] bg-white dark:bg-[#252525] flex items-center justify-center shrink-0 border border-black/5 dark:border-[#333333] shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                          <img
                            src={client.logo_url}
                            alt={client.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-[52px] h-[52px] rounded-[18px] bg-white dark:bg-[#252525] flex items-center justify-center shrink-0 border border-black/5 dark:border-[#333333] shadow-sm group-hover:scale-105 transition-transform">
                          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF8C00] to-[#9D50BB]">
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${client.status === "active"
                            ? "bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 text-neutral-900 dark:text-neutral-100 border border-[#FF8C00]/20"
                            : client.status === "paused"
                              ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                      >
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </div>

                    {/* Middle section */}
                    <div className="flex-1 min-w-0 mb-4 px-1">
                      <h3 className="font-semibold text-xl mb-1 truncate text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                        {client.name}
                      </h3>
                      {client.website ? (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                          {client.website}
                        </p>
                      ) : (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                          No website provided
                        </p>
                      )}
                    </div>

                    {/* Bottom section */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-auto">
                      <div className="text-xs text-muted-foreground font-medium">
                        {client.campaign_count} campaign{client.campaign_count !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
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
                          className={`text-xs px-3 py-1 rounded-full font-medium ${campaign.status === "active"
                              ? "bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 text-neutral-900 dark:text-neutral-100 border border-[#FF8C00]/20"
                              : campaign.status === "paused"
                                ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                        >
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
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
      </div>
    </div>
  );
}

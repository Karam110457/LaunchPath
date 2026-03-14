import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Megaphone } from "lucide-react";

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
    .select("id, name, status, channel_type, ai_agents(name, personality)")
    .eq("client_id", clientId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Campaigns</h2>
        <Link
          href={`/dashboard/clients/${clientId}/campaigns/new`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform duration-150"
        >
          <Plus className="size-4" />
          New Campaign
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-[32px] border border-dashed border-border/60 bg-card/30">
          <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No campaigns yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
            Create one to deploy an AI agent for this client.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-enter">
          {campaigns.map((campaign, i) => {
            const agent = campaign.ai_agents as unknown as {
              name: string;
              personality: Record<string, unknown> | null;
            } | null;

            return (
              <Link
                key={campaign.id}
                href={`/dashboard/clients/${clientId}/campaigns/${campaign.id}`}
                style={{ '--stagger': i } as React.CSSProperties}
                className="group rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-6 hover:bg-white dark:hover:bg-[#252525] hover:shadow-md hover:-translate-y-1 transition-[transform,box-shadow,background-color] duration-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base truncate text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                    {campaign.name}
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      campaign.status === "active"
                        ? "bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 text-neutral-900 dark:text-neutral-100 border border-[#FF8C00]/20"
                        : campaign.status === "paused"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </div>
                {agent?.name && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
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

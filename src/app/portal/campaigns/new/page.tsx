import { requireClientAuth } from "@/lib/auth/guards";
import { canPerform } from "@/lib/auth/portal-permissions";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalNewCampaignForm } from "@/components/portal/PortalNewCampaignForm";

export default async function PortalNewCampaign() {
  const { clientId, role } = await requireClientAuth();

  if (!canPerform(role, "campaign.create")) {
    redirect("/portal/campaigns");
  }

  const supabase = await createClient();

  // Get assigned agents for this client
  const { data: assignments } = await supabase
    .from("client_agents")
    .select("agent_id, ai_agents(id, name)")
    .eq("client_id", clientId);

  const agents = (assignments ?? []).map((a) => {
    const agent = (a as Record<string, unknown>).ai_agents as { id: string; name: string } | null;
    return agent ? { id: agent.id, name: agent.name } : null;
  }).filter(Boolean) as Array<{ id: string; name: string }>;

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Campaign</h1>
        <p className="text-muted-foreground mt-1">Create a new campaign for your workspace</p>
      </div>
      <PortalNewCampaignForm agents={agents} />
    </div>
  );
}

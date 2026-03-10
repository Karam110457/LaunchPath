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
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">New Campaign</h1>
      <PortalNewCampaignForm agents={agents} />
    </div>
  );
}

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

  // Get the agency owner's ID via the client record
  const { data: client } = await supabase
    .from("clients")
    .select("user_id")
    .eq("id", clientId)
    .single();

  // Fetch all agents belonging to the agency owner
  const { data: agentRows } = client
    ? await supabase
        .from("ai_agents")
        .select("id, name")
        .eq("user_id", client.user_id)
        .order("name")
    : { data: [] };

  const agents = (agentRows ?? []).map((a) => ({ id: a.id, name: a.name }));

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

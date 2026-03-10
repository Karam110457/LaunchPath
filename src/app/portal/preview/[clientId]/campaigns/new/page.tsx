import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PortalNewCampaignForm } from "@/components/portal/PortalNewCampaignForm";

export default async function PreviewNewCampaign({
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

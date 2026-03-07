import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { NewCampaignForm } from "@/components/campaigns/NewCampaignForm";

export default async function ClientNewCampaignPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: agents } = await supabase
    .from("ai_agents")
    .select("id, name, personality")
    .eq("user_id", user.id)
    .is("parent_agent_id", null)
    .order("name", { ascending: true });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h2 className="text-lg font-semibold">New Campaign</h2>
      <NewCampaignForm
        agents={agents ?? []}
        lockedClientId={clientId}
        redirectBase={`/dashboard/clients/${clientId}/campaigns`}
      />
    </div>
  );
}

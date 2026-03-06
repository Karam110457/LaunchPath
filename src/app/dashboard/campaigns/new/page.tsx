import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { NewCampaignForm } from "@/components/campaigns/NewCampaignForm";

export default async function NewCampaignPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: agents } = await supabase
    .from("ai_agents")
    .select("id, name, personality")
    .eq("user_id", user.id)
    .is("parent_agent_id", null)
    .order("name", { ascending: true });

  return (
    <PageShell
      title="New Campaign"
      description="Deploy an AI agent to a client's website."
    >
      <NewCampaignForm agents={agents ?? []} />
    </PageShell>
  );
}

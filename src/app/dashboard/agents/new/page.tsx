import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { NewAgentForm } from "@/components/agents/NewAgentForm";

export default async function NewAgentPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Fetch user's complete businesses for the optional "link to business" selector
  const { data: systems } = await supabase
    .from("user_systems")
    .select("id, chosen_recommendation, offer, status")
    .eq("user_id", user.id)
    .eq("status", "complete")
    .order("created_at", { ascending: false });

  const businesses = (systems ?? []).map((s) => {
    const rec = s.chosen_recommendation as { niche?: string } | null;
    const offer = s.offer as { segment?: string } | null;
    return {
      id: s.id,
      name: rec?.niche ?? offer?.segment ?? "Business",
    };
  });

  return (
    <PageShell
      title="New Agent"
      description="Choose a template or describe the agent you want to build."
    >
      <NewAgentForm businesses={businesses} />
    </PageShell>
  );
}

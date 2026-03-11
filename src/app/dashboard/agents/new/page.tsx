import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AgentCreationLanding } from "@/components/agents/AgentCreationLanding";

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
    <div className="container py-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      <AgentCreationLanding businesses={businesses} />
    </div>
  );
}

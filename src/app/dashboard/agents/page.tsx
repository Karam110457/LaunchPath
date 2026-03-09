import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AgentsList } from "@/components/agents/AgentsList";
import { EmptyAgents } from "@/components/agents/EmptyAgents";
import { TopNav } from "@/components/layout/TopNav";
import { GlobalBackground } from "@/components/layout/GlobalBackground";

export default async function AgentsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: agents } = await supabase
    .from("ai_agents")
    .select(
      "id, name, description, status, personality, template_id, created_at",
    )
    .eq("user_id", user.id)
    .is("parent_agent_id", null)
    .order("created_at", { ascending: false });

  const hasAgents = agents && agents.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased relative overflow-hidden">
      <GlobalBackground />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <TopNav />
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
          {hasAgents ? <AgentsList agents={agents} userFullName={user.user_metadata?.full_name || user.email?.split("@")[0] || "there"} /> : <EmptyAgents />}
        </div>
      </div>
    </div>
  );
}

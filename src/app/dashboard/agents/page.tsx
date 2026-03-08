import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AgentsList } from "@/components/agents/AgentsList";
import { EmptyAgents } from "@/components/agents/EmptyAgents";
import { AgentsTopNav } from "@/components/agents/AgentsTopNav";

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
      {/* Minimalistic ambient background glow (dark mode only) */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-transparent dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_60%)]" />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <AgentsTopNav />
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
          {hasAgents ? <AgentsList agents={agents} userFullName={user.user_metadata?.full_name || user.email?.split("@")[0] || "there"} /> : <EmptyAgents />}
        </div>
      </div>
    </div>
  );
}

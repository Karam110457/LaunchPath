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
      {/* Ambient glassmorphic background spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF8C00] rounded-full mix-blend-screen filter blur-[120px] opacity-15 dark:opacity-20 animate-pulse pointer-events-none z-0" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#9D50BB] rounded-full mix-blend-screen filter blur-[120px] opacity-15 dark:opacity-20 animate-pulse pointer-events-none z-0" style={{ animationDuration: '10s' }} />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <AgentsTopNav />
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
          {hasAgents ? <AgentsList agents={agents} userFullName={user.user_metadata?.full_name || user.email?.split("@")[0] || "there"} /> : <EmptyAgents />}
        </div>
      </div>
    </div>
  );
}

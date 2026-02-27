import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { AgentsList } from "@/components/agents/AgentsList";
import { EmptyAgents } from "@/components/agents/EmptyAgents";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function AgentsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: agents } = await supabase
    .from("ai_agents")
    .select(
      "id, name, description, status, personality, template_id, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const hasAgents = agents && agents.length > 0;

  return (
    <PageShell
      title="Agents"
      description="Create and manage AI agents for your business."
      action={
        hasAgents ? (
          <Button asChild>
            <Link href="/dashboard/agents/new">
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Link>
          </Button>
        ) : undefined
      }
    >
      {hasAgents ? <AgentsList agents={agents} /> : <EmptyAgents />}
    </PageShell>
  );
}

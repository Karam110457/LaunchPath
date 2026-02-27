import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { AgentDetail } from "@/components/agents/AgentDetail";

interface Props {
  params: Promise<{ agentId: string }>;
}

export default async function AgentDetailPage({ params }: Props) {
  const { agentId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: agent } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) notFound();

  const personality = agent.personality as {
    tone?: string;
    greeting_message?: string;
    avatar_emoji?: string;
  } | null;

  const tools = (agent.enabled_tools ?? []) as Array<{
    tool_id: string;
    label: string;
    description: string;
  }>;

  return (
    <PageShell
      title={agent.name}
      description={agent.description ?? undefined}
    >
      <AgentDetail
        agent={agent}
        personality={personality}
        tools={tools}
      />
    </PageShell>
  );
}

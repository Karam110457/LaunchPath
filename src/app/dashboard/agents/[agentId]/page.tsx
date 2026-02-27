import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { AgentDetail } from "@/components/agents/AgentDetail";
import { AgentChatPanel } from "@/components/agents/AgentChatPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AgentConversationMessage } from "@/lib/chat/agent-chat-types";

interface Props {
  params: Promise<{ agentId: string }>;
}

export default async function AgentDetailPage({ params }: Props) {
  const { agentId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // Fetch agent + conversation in parallel
  const [agentResult, conversationResult] = await Promise.all([
    supabase
      .from("ai_agents")
      .select("*")
      .eq("id", agentId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("agent_conversations")
      .select("messages")
      .eq("agent_id", agentId)
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!agentResult.data) notFound();
  const agent = agentResult.data;

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

  const initialChatMessages = Array.isArray(conversationResult.data?.messages)
    ? (conversationResult.data.messages as unknown as AgentConversationMessage[])
    : [];

  return (
    <PageShell
      title={agent.name}
      description={agent.description ?? undefined}
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">Test Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AgentDetail
            agent={agent}
            personality={personality}
            tools={tools}
          />
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <AgentChatPanel
            agentId={agent.id}
            agentName={agent.name}
            greetingMessage={personality?.greeting_message}
            initialMessages={initialChatMessages}
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

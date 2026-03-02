import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AgentCanvasPage } from "@/components/agents/canvas/AgentCanvasPage";

interface Props {
  params: Promise<{ agentId: string }>;
}

export default async function AgentDetailPage({ params }: Props) {
  const { agentId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // Fetch agent + knowledge docs in parallel (chat loads client-side)
  const [agentResult, knowledgeResult] = await Promise.all([
    supabase
      .from("ai_agents")
      .select("*")
      .eq("id", agentId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("agent_knowledge_documents")
      .select("id, source_type, source_name, content, chunk_count, status, error_message, created_at")
      .eq("agent_id", agentId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!agentResult.data) notFound();
  const agent = agentResult.data;

  const personality = agent.personality as {
    tone?: string;
    greeting_message?: string;
    avatar_emoji?: string;
  } | null;

  const initialDocuments = (knowledgeResult.data ?? []) as Array<{
    id: string;
    source_type: "file" | "website" | "faq";
    source_name: string;
    content: string | null;
    chunk_count: number;
    status: "processing" | "ready" | "error";
    error_message: string | null;
    created_at: string;
  }>;

  return (
    <AgentCanvasPage
      agent={{
        ...agent,
        canvas_layout: (agent.canvas_layout as Record<string, { x: number; y: number }> | null) ?? null,
      }}
      personality={personality}
      initialDocuments={initialDocuments}
    />
  );
}

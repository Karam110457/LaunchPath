/**
 * Agent Test Chat API route (authenticated).
 * POST /api/agents/[agentId]/chat
 *
 * Accepts a user message + conversation history.
 * Returns SSE stream with text deltas, tool events, and conversation state.
 *
 * This is the dashboard/owner chat. For public channel chat, see
 * /api/channels/[agentId]/chat which uses the same shared runAgentChat() logic.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAgentChat } from "@/lib/chat/run-agent-chat";
import type { AgentConversationMessage } from "@/lib/chat/agent-chat-types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as {
    messages: AgentConversationMessage[];
    userMessage: string;
    conversationId?: string;
  };

  const {
    messages: conversationHistory = [],
    userMessage,
    conversationId,
  } = body;

  if (!userMessage || typeof userMessage !== "string") {
    return NextResponse.json(
      { error: "userMessage is required" },
      { status: 400 }
    );
  }

  // Verify ownership (RLS also enforces this, but explicit check gives a clear 404)
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return runAgentChat({
    agentId,
    userMessage,
    conversationHistory,
    supabase,
    composioUserId: user.id,
    onConversationSave: async ({ updatedHistory }) => {
      let finalConversationId = conversationId;

      if (finalConversationId) {
        await supabase
          .from("agent_conversations")
          .update({
            messages:
              updatedHistory as unknown as Record<string, unknown>[],
          })
          .eq("id", finalConversationId)
          .eq("user_id", user.id);
      } else {
        const autoTitle =
          userMessage.length > 50
            ? userMessage.slice(0, 47) + "..."
            : userMessage;

        const { data: newConv } = await supabase
          .from("agent_conversations")
          .insert({
            agent_id: agentId,
            user_id: user.id,
            title: autoTitle,
            messages:
              updatedHistory as unknown as Record<string, unknown>[],
          })
          .select("id")
          .single();

        finalConversationId = newConv?.id;
      }

      return finalConversationId;
    },
  });
}

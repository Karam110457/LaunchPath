/**
 * Agent Test Chat API route.
 * POST /api/agents/[agentId]/chat
 *
 * Accepts a user message + conversation history.
 * Returns SSE stream with text deltas, tool events, and conversation state.
 */

import { NextRequest, NextResponse } from "next/server";
import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/security/logger";
import { retrieveContext } from "@/lib/knowledge/rag";
import { buildAgentTools } from "@/lib/tools/builder";
import type { AgentToolRecord } from "@/lib/tools/types";
import type {
  AgentServerEvent,
  AgentConversationMessage,
} from "@/lib/chat/agent-chat-types";

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

  const { messages: conversationHistory = [], userMessage, conversationId } = body;

  if (!userMessage || typeof userMessage !== "string") {
    return NextResponse.json(
      { error: "userMessage is required" },
      { status: 400 }
    );
  }

  // Fetch agent with ownership check
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // ---------------------------------------------------------------------------
  // Load enabled tools
  // ---------------------------------------------------------------------------

  const { data: toolRecords } = await supabase
    .from("agent_tools")
    .select("*")
    .eq("agent_id", agentId)
    .eq("is_enabled", true);

  const agentToolRecords = (toolRecords ?? []) as AgentToolRecord[];

  // Build a display-name map for tool events (toolName → displayName)
  const toolDisplayNames: Record<string, string> = {};
  for (const t of agentToolRecords) {
    // Map expected tool names to display names
    const key =
      t.tool_type === "calendly"
        ? "book_appointment"
        : t.tool_type === "ghl"
        ? "create_crm_contact"
        : t.tool_type === "hubspot"
        ? "create_crm_contact"
        : t.tool_type === "human-handoff"
        ? "transfer_to_human"
        : t.display_name
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_")
            .replace(/_+/g, "_")
            .slice(0, 60);
    toolDisplayNames[key] = t.display_name;
  }

  const tools = await buildAgentTools(agentToolRecords);
  const hasTools = Object.keys(tools).length > 0;

  // ---------------------------------------------------------------------------
  // RAG: retrieve relevant knowledge if the agent has documents
  // ---------------------------------------------------------------------------

  const { count: docCount } = await supabase
    .from("agent_knowledge_documents")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .eq("status", "ready");

  let systemPrompt = agent.system_prompt;

  if (docCount && docCount > 0) {
    const recentUserMsgs = conversationHistory
      .filter((m) => m.role === "user")
      .slice(-2)
      .map((m) => m.content);
    recentUserMsgs.push(userMessage);
    const retrievalQuery = recentUserMsgs.join("\n");

    const ragContext = await retrieveContext(agentId, retrievalQuery, supabase);
    if (ragContext) {
      systemPrompt = `${agent.system_prompt}\n\n${ragContext}`;
    }
  }

  // ---------------------------------------------------------------------------
  // Set up SSE stream
  // ---------------------------------------------------------------------------

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const emit = (event: AgentServerEvent) => {
    try {
      writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch {
      // Writer may be closed if client disconnected
    }
  };

  // ---------------------------------------------------------------------------
  // Build AI messages from conversation history
  // ---------------------------------------------------------------------------

  type AIMessage = { role: "user" | "assistant"; content: string };

  const MAX_HISTORY_MESSAGES = 20;
  const recentHistory = conversationHistory
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-MAX_HISTORY_MESSAGES);

  const aiMessages: AIMessage[] = recentHistory.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  aiMessages.push({ role: "user", content: userMessage });

  // ---------------------------------------------------------------------------
  // Run agent in background
  // ---------------------------------------------------------------------------

  void (async () => {
    try {
      const streamOptions: Parameters<typeof streamText>[0] = {
        model: anthropic(agent.model),
        system: systemPrompt,
        messages: aiMessages,
        maxOutputTokens: 2048,
        providerOptions: {
          anthropic: {
            thinking: { type: "disabled" },
          },
        },
        async onFinish({ response }) {
          const assistantText = response.messages
            .filter((m) => m.role === "assistant")
            .map((m) => {
              if (typeof m.content === "string") return m.content;
              if (Array.isArray(m.content)) {
                return m.content
                  .filter((p) => p.type === "text")
                  .map((p) => (p as { type: "text"; text: string }).text)
                  .join("");
              }
              return "";
            })
            .map((t) => t.trim())
            .filter(Boolean)
            .join(" ");

          const fullContent = assistantText.trim() || "";

          const updatedHistory: AgentConversationMessage[] = [
            ...conversationHistory,
            {
              role: "user",
              content: userMessage,
              timestamp: new Date().toISOString(),
            },
            {
              role: "assistant",
              content: fullContent,
              timestamp: new Date().toISOString(),
            },
          ];

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

          emit({
            type: "done",
            assistantContent: fullContent,
            conversationId: finalConversationId,
          });
        },
      };

      // Add tools if any are configured
      if (hasTools) {
        streamOptions.tools = tools as Parameters<typeof streamText>[0]["tools"];
        streamOptions.stopWhen = stepCountIs(5);
      }

      const result = streamText(streamOptions);

      let wasThinking = false;
      let hasUnfinishedText = false;

      for await (const chunk of result.fullStream) {
        if (chunk.type === "reasoning-delta") {
          if (!wasThinking) wasThinking = true;
          emit({ type: "thinking", text: chunk.text });
        } else if (chunk.type === "reasoning-end") {
          if (wasThinking) {
            wasThinking = false;
            emit({ type: "thinking-done" });
          }
        } else if (chunk.type === "text-delta") {
          if (wasThinking) {
            wasThinking = false;
            emit({ type: "thinking-done" });
          }
          hasUnfinishedText = true;
          emit({ type: "text-delta", delta: chunk.text });
        } else if (chunk.type === "tool-call") {
          emit({
            type: "tool-call",
            toolName: chunk.toolName,
            displayName: toolDisplayNames[chunk.toolName] ?? chunk.toolName,
          });
        } else if (chunk.type === "tool-result") {
          const output = chunk.output as { success?: boolean; message?: string } | null;
          emit({
            type: "tool-result",
            toolName: chunk.toolName,
            success: output?.success !== false,
            message: output?.message,
          });
        }
      }

      if (hasUnfinishedText) {
        emit({ type: "text-done" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("Agent chat stream failed", {
        agentId,
        userId: user.id,
        error: message,
      });
      emit({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      try {
        writer.close();
      } catch {
        // Already closed
      }
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

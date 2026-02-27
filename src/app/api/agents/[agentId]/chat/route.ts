/**
 * Agent Test Chat API route.
 * POST /api/agents/[agentId]/chat
 *
 * Accepts a user message + conversation history.
 * Returns SSE stream with text deltas from the agent's system prompt + model.
 * No tools, no cards — text-only for v1.
 */

import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/security/logger";
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
  };

  const { messages: conversationHistory = [], userMessage } = body;

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

  const aiMessages: AIMessage[] = conversationHistory
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  aiMessages.push({ role: "user", content: userMessage });

  // ---------------------------------------------------------------------------
  // Run agent in background (don't await — we return the stream immediately)
  // ---------------------------------------------------------------------------

  void (async () => {
    try {
      const result = streamText({
        model: anthropic(agent.model),
        system: agent.system_prompt,
        messages: aiMessages,
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
            .filter(Boolean)
            .join("\n");

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

          // Upsert conversation (unique per agent+user)
          await supabase.from("agent_conversations").upsert(
            {
              agent_id: agentId,
              user_id: user.id,
              messages:
                updatedHistory as unknown as Record<string, unknown>[],
            },
            { onConflict: "agent_id,user_id" }
          );

          emit({ type: "done", assistantContent: fullContent });
        },
      });

      // Process the stream — emit text deltas + thinking events
      let wasThinking = false;
      let wasStreamingText = false;

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
          wasStreamingText = true;
          emit({ type: "text-delta", delta: chunk.text });
        } else {
          if (wasStreamingText) {
            wasStreamingText = false;
            emit({ type: "text-done" });
          }
        }
      }

      if (wasStreamingText) {
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

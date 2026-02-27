/**
 * Chat API route — Business Strategist conversation.
 * POST /api/chat/[systemId]
 *
 * Accepts a user message + conversation history.
 * Returns a Server-Sent Events stream with text deltas, progress events,
 * and interactive cards emitted directly by tools.
 *
 * The agent uses streamText (Vercel AI SDK) with tools defined as closures
 * that share the SSE writer, enabling tools to stream progress events mid-execution.
 */

import { NextRequest, NextResponse } from "next/server";
import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { buildBusinessStrategistPrompt } from "@/lib/ai/business-strategist-prompt";
import { createChatTools } from "@/lib/chat/tools";
import { logger } from "@/lib/security/logger";
import type { ServerEvent, ConversationMessage } from "@/lib/chat/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
  const { systemId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json() as {
    messages: ConversationMessage[];
    userMessage: string;
  };

  const { messages: conversationHistory = [], userMessage } = body;

  if (!userMessage || typeof userMessage !== "string") {
    return NextResponse.json({ error: "userMessage is required" }, { status: 400 });
  }

  // Fetch system + profile
  const [systemResult, profileResult] = await Promise.all([
    supabase.from("user_systems").select("*").eq("id", systemId).eq("user_id", user.id).single(),
    supabase.from("user_profiles").select("*").eq("id", user.id).single(),
  ]);

  if (!systemResult.data) {
    return NextResponse.json({ error: "System not found" }, { status: 404 });
  }
  if (!profileResult.data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const system = systemResult.data;
  const profile = profileResult.data;

  // ---------------------------------------------------------------------------
  // Set up SSE stream
  // ---------------------------------------------------------------------------

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const emit = (event: ServerEvent) => {
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

  // Add the current user message
  aiMessages.push({ role: "user", content: userMessage });

  // ---------------------------------------------------------------------------
  // Run agent in background (don't await — we return the stream immediately)
  // ---------------------------------------------------------------------------

  const systemPrompt = buildBusinessStrategistPrompt(profile, system);
  const tools = createChatTools(emit, systemId, supabase, profile, system);

  void (async () => {
    try {
      const result = streamText({
        model: anthropic("claude-sonnet-4-5-20250929"),
        system: systemPrompt,
        messages: aiMessages,
        tools,
        stopWhen: stepCountIs(20),
        providerOptions: {
          anthropic: {
            // Thinking disabled — enabling it (even at a small budget) causes Claude
            // to offload reasoning into the invisible thinking block, producing terse
            // plain-text output. We want all substance in the visible response text.
            thinking: { type: "disabled" },
          },
        },
        async onFinish({ response }) {
          // Build updated conversation history
          const newUserMessage: ConversationMessage = {
            role: "user",
            content: userMessage,
            timestamp: new Date().toISOString(),
          };

          // Collect assistant text from the response.
          // In multi-step interactions (tool calls) the SDK creates a separate
          // assistant message per step. Join with a single space so text that
          // was split mid-sentence reconnects naturally instead of creating
          // orphaned fragments on reload.
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

          // Don't append tool names to conversation history — the model sees
          // [tools:...] in prior turns and mimics it as literal text output.
          // Session state (describeCollectedState) already tells the model what
          // data has been collected, which is all the context it needs.
          const fullContent = assistantText.trim() || "[card]";

          const newAssistantMessage: ConversationMessage = {
            role: "assistant",
            content: fullContent,
            timestamp: new Date().toISOString(),
          };

          const updatedHistory: ConversationMessage[] = [
            ...conversationHistory,
            newUserMessage,
            newAssistantMessage,
          ];

          // Save conversation history
          await supabase
            .from("user_systems")
            .update({ conversation_history: updatedHistory as unknown as Record<string, unknown>[] })
            .eq("id", systemId)
            .eq("user_id", user.id);

          emit({ type: "done", assistantContent: fullContent });
        },
      });

      // Process the stream — emit text deltas + thinking events to the SSE.
      // IMPORTANT: We do NOT emit "text-done" between steps. When the model
      // calls a tool mid-sentence the text continues in the next step, so
      // emitting text-done would cause the client to split one response into
      // separate bubbles (or create paragraph breaks on reload). We only emit
      // text-done once — right before a card event (so text and cards stay
      // visually separate) or when the entire stream is finished.
      let wasThinking = false;
      let hasUnfinishedText = false;
      for await (const chunk of result.fullStream) {
        if (chunk.type === "reasoning-delta") {
          if (!wasThinking) {
            wasThinking = true;
          }
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
        }
        // tool-call, step-finish, etc. are ignored here — we intentionally
        // do NOT emit text-done between steps so the client keeps
        // accumulating text into the same message bubble.
        // Tool calls are handled within the tool execute functions (emit via closure).
      }
      // Stream is fully done — finalize any remaining text
      if (hasUnfinishedText) {
        emit({ type: "text-done" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("Chat stream failed", { systemId, userId: user.id, error: message });
      emit({ type: "error", message: "Something went wrong. Please try again." });
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

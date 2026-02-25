/**
 * Builder chat API route — Code-generating page builder assistant.
 * POST /api/builder/[systemId]
 *
 * Accepts a user message + current page code.
 * Returns SSE with text deltas and code-update events from tools.
 */

import { NextRequest, NextResponse } from "next/server";
import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { buildBuilderCodePrompt } from "@/lib/ai/builder-code-prompt";
import {
  createBuilderCodeTools,
  type BuilderCodeEvent,
} from "@/lib/chat/builder-code-tools";
import type { DemoConfig } from "@/lib/ai/schemas";
import { logger } from "@/lib/security/logger";

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

  // Verify ownership and load demo_config (needed for system prompt context)
  const { data: system } = await supabase
    .from("user_systems")
    .select("id, user_id, demo_config")
    .eq("id", systemId)
    .eq("user_id", user.id)
    .single();

  if (!system) {
    return NextResponse.json({ error: "System not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    message: string;
    currentCode: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  const { message, currentCode, history = [] } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  if (!currentCode || typeof currentCode !== "string") {
    return NextResponse.json(
      { error: "currentCode is required" },
      { status: 400 }
    );
  }

  const demoConfig = system.demo_config as DemoConfig | null;
  if (!demoConfig) {
    return NextResponse.json(
      { error: "Demo config not found" },
      { status: 400 }
    );
  }

  // Mutable reference so tools always see the latest code
  let liveCode = currentCode;

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const emit = (event: BuilderCodeEvent) => {
    try {
      writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch {
      // Writer may be closed if client disconnected
    }
  };

  // Track code updates so subsequent tool calls see the latest
  const trackingEmit = (event: BuilderCodeEvent) => {
    if (event.type === "code-update") {
      liveCode = event.code;
    }
    emit(event);
  };

  const systemPrompt = buildBuilderCodePrompt(demoConfig, liveCode);
  const tools = createBuilderCodeTools(trackingEmit, () => liveCode);

  // Build messages
  const aiMessages = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  void (async () => {
    try {
      const result = streamText({
        model: anthropic("claude-sonnet-4-5-20250929"),
        system: systemPrompt,
        messages: aiMessages,
        tools,
        stopWhen: stepCountIs(5),
      });

      let wasStreamingText = false;

      for await (const chunk of result.fullStream) {
        if (chunk.type === "text-delta") {
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

      emit({ type: "done" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      logger.error("Builder stream failed", {
        systemId,
        userId: user.id,
        error: msg,
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

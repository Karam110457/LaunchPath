/**
 * Builder chat API route — Demo page customization assistant.
 * POST /api/builder/[systemId]
 *
 * Accepts a user message + current DemoConfig.
 * Returns SSE with text deltas and config-patch events from tools.
 */

import { NextRequest, NextResponse } from "next/server";
import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { buildBuilderAssistantPrompt } from "@/lib/ai/builder-assistant-prompt";
import {
  createBuilderTools,
  type BuilderEvent,
} from "@/lib/chat/builder-tools";
import { demoConfigSchema, type DemoConfig } from "@/lib/ai/schemas";
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

  // Verify ownership
  const { data: system } = await supabase
    .from("user_systems")
    .select("id, user_id")
    .eq("id", systemId)
    .eq("user_id", user.id)
    .single();

  if (!system) {
    return NextResponse.json({ error: "System not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    message: string;
    currentConfig: DemoConfig;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  const { message, currentConfig, history = [] } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  // Validate the config shape
  const parsed = demoConfigSchema.safeParse(currentConfig);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid config" },
      { status: 400 }
    );
  }

  // Mutable reference so tools always see the latest config
  let liveConfig = { ...parsed.data };

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const emit = (event: BuilderEvent) => {
    try {
      writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch {
      // Writer may be closed if client disconnected
    }
  };

  // Apply patches to liveConfig so subsequent tool calls in the same turn see updates
  const originalEmit = emit;
  const patchingEmit = (event: BuilderEvent) => {
    if (event.type === "config-patch" && event.patch) {
      liveConfig = { ...liveConfig, ...event.patch };
    }
    originalEmit(event);
  };

  const systemPrompt = buildBuilderAssistantPrompt(liveConfig);
  const tools = createBuilderTools(patchingEmit, () => liveConfig);

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

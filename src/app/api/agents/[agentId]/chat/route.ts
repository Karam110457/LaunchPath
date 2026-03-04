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
import { makeWebhookToolKey } from "@/lib/tools/integrations/webhook";
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

  // Build a display-name map for tool events (toolName → displayName).
  // Keys must exactly match what buildAgentTools() registers in the tools map.
  const toolDisplayNames: Record<string, string> = {};
  for (const t of agentToolRecords) {
    if (t.tool_type === "webhook") {
      toolDisplayNames[makeWebhookToolKey(t.display_name)] = t.display_name;
    }
    // MCP + composio: tool names resolved after buildAgentTools()
  }

  const tools = await buildAgentTools(agentToolRecords, user.id);
  const hasTools = Object.keys(tools).length > 0;

  // Map composio tool keys (e.g. GMAIL_SEND_EMAIL) to friendly display names.
  // Tool keys are only available after buildAgentTools() runs — they come from the
  // Composio session, not from our config. We match keys by toolkit prefix.
  for (const t of agentToolRecords) {
    if (t.tool_type !== "composio") continue;
    const cfg = t.config as { toolkit?: string; toolkit_name?: string };
    if (!cfg.toolkit) continue;

    // Composio tool keys are UPPER_SNAKE_CASE with the toolkit slug as prefix
    // e.g. toolkit "gmail" → keys like GMAIL_SEND_EMAIL, GMAIL_CREATE_DRAFT
    const prefix = cfg.toolkit.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const displayPrefix = cfg.toolkit_name ?? cfg.toolkit;

    for (const toolKey of Object.keys(tools)) {
      if (toolKey.startsWith(prefix + "_") && !toolDisplayNames[toolKey]) {
        // GMAIL_SEND_EMAIL → Send Email
        const actionPart = toolKey.slice(prefix.length + 1);
        const friendlyName = actionPart
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        toolDisplayNames[toolKey] = `${displayPrefix}: ${friendlyName}`;
      }
    }
  }

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

  // Auto-inject tool instructions so the agent knows when and how to use tools.
  // For Composio tools, we also list the specific action names (tool keys) so
  // the agent can map user requests to the correct tool call.
  if (hasTools && agentToolRecords.length > 0) {
    const toolSections: string[] = [];

    for (const t of agentToolRecords) {
      if (t.tool_type === "composio") {
        const cfg = t.config as { toolkit?: string; toolkit_name?: string; enabled_actions?: string[] };
        const prefix = (cfg.toolkit ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

        // List actual tool keys this toolkit contributes so the agent knows
        // the exact function names it can call
        const actionKeys = Object.keys(tools).filter(
          (k) => k.startsWith(prefix + "_") && !k.startsWith("COMPOSIO_")
        );

        if (actionKeys.length > 0) {
          const actionList = actionKeys
            .map((k) => {
              const friendly = k.slice(prefix.length + 1).toLowerCase().replace(/_/g, " ");
              return `  - \`${k}\` — ${friendly}`;
            })
            .join("\n");
          toolSections.push(
            `- **${t.display_name}** (${cfg.toolkit_name ?? cfg.toolkit}): ${t.description}\n  Available actions:\n${actionList}`
          );
        } else {
          toolSections.push(`- **${t.display_name}**: ${t.description}`);
        }
      } else {
        toolSections.push(`- **${t.display_name}**: ${t.description}`);
      }
    }

    systemPrompt +=
      `\n\n## Tools Available\n` +
      `You have the following tools. Use them proactively — if the user's request matches a tool's purpose, call the tool rather than just describing what you would do.\n\n` +
      toolSections.join("\n") +
      `\n\n### Tool Usage Guidelines\n` +
      `- When a tool returns a result, check the \`successful\` field (not \`success\`). If \`successful\` is false, tell the user what went wrong using the \`error\` field.\n` +
      `- Tool results are in \`data\` — summarize the key information for the user in natural language.\n` +
      `- If a tool fails with an authentication error, tell the user they may need to reconnect the app in their settings.`;
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
        streamOptions.stopWhen = stepCountIs(10);
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
            args: chunk.input as Record<string, unknown> | undefined,
          });
        } else if (chunk.type === "tool-result") {
          // Composio tools return { successful: bool, error: string|null, data: {...} }
          // Our wrapToolExecute returns { success: bool, error: string }
          // Handle both shapes for compatibility
          const output = chunk.output as {
            success?: boolean;
            successful?: boolean;
            error?: string | null;
            message?: string;
            data?: unknown;
          } | null;

          const isSuccess = output?.successful !== false && output?.success !== false;
          const resultMessage = output?.error ?? output?.message ?? undefined;

          emit({
            type: "tool-result",
            toolName: chunk.toolName,
            success: isSuccess,
            message: resultMessage,
            result: chunk.output,
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

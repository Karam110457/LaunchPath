/**
 * Shared agent chat execution logic.
 *
 * Extracted from the authenticated chat route so it can be reused by both:
 * - The authenticated route (dashboard test chat)
 * - The public channel route (widget, voice, SMS)
 *
 * The caller handles authentication, access validation, and rate limiting.
 * This function handles everything else: tool loading, RAG, prompt assembly,
 * LLM streaming, and conversation persistence via a callback.
 */

import { streamText, stepCountIs } from "ai";
import { logger } from "@/lib/security/logger";
import { getModel } from "@/lib/ai/model-provider";
import { getModelTier, estimateCredits, calculateCredits } from "@/lib/ai/model-tiers";
import {
  retrieveContextWithMetadata,
  loadAllChunks,
  SMALL_KB_THRESHOLD,
} from "@/lib/knowledge/rag";
import type { RagChunk } from "@/lib/knowledge/rag";
import { buildAgentTools } from "@/lib/tools/builder";
import { assemblePrompt } from "@/lib/agents/assemble-prompt";
import { makeWebhookToolKey } from "@/lib/tools/integrations/webhook";
import { makeHttpToolKey } from "@/lib/tools/integrations/http";
import { makeSubagentToolKey } from "@/lib/tools/integrations/subagent";
import {
  buildKnowledgeTool,
  KNOWLEDGE_TOOL_DISPLAY_NAME,
} from "@/lib/tools/integrations/knowledge";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentToolRecord } from "@/lib/tools/types";
import type {
  AgentServerEvent,
  AgentConversationMessage,
} from "./agent-chat-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RunAgentChatParams {
  /** Agent UUID. */
  agentId: string;

  /** The current user message. */
  userMessage: string;

  /** Conversation history (caller manages retrieval). */
  conversationHistory: AgentConversationMessage[];

  /** Supabase client — anon (authenticated) or service role (public). */
  supabase: SupabaseClient;

  /**
   * User ID for Composio tools.
   * - Authenticated: the logged-in user's ID.
   * - Public channels: the agent owner's user_id (from agent_channels).
   */
  composioUserId?: string;

  /** Client ID for per-client usage tracking (portal / channel conversations). */
  clientId?: string;

  /** Extra headers to add to the SSE response (e.g. CORS headers). */
  extraHeaders?: Record<string, string>;

  /**
   * Callback to persist conversation after completion.
   * Different for authenticated (agent_conversations) vs public (channel_conversations).
   * Returns the conversationId or undefined.
   */
  onConversationSave: (params: {
    updatedHistory: AgentConversationMessage[];
    assistantContent: string;
    userMessage: string;
  }) => Promise<string | undefined>;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

const MAX_HISTORY_MESSAGES = 30;

export async function runAgentChat(
  params: RunAgentChatParams
): Promise<Response> {
  const {
    agentId,
    userMessage,
    conversationHistory,
    supabase,
    composioUserId,
    clientId,
    extraHeaders,
    onConversationSave,
  } = params;

  // -------------------------------------------------------------------------
  // Fetch agent record (caller already validated access)
  // -------------------------------------------------------------------------

  const { data: agent } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", agentId)
    .single();

  if (!agent) {
    return new Response(JSON.stringify({ error: "Agent not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...extraHeaders },
    });
  }

  // -------------------------------------------------------------------------
  // Credit pre-flight check
  // -------------------------------------------------------------------------

  const estimatedCredits = estimateCredits(agent.model);

  // Ensure user_credits row exists (upsert on first use)
  await supabase
    .from("user_credits")
    .upsert(
      { user_id: agent.user_id, monthly_included: 500, monthly_used: 0, topup_balance: 0 },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

  const { data: credits } = await supabase
    .from("user_credits")
    .select("monthly_included, monthly_used, topup_balance")
    .eq("user_id", agent.user_id)
    .single();

  if (credits) {
    const monthlyRemaining = credits.monthly_included - credits.monthly_used;
    const totalAvailable = Math.max(0, monthlyRemaining) + credits.topup_balance;

    if (totalAvailable < estimatedCredits) {
      return new Response(
        JSON.stringify({
          error: "Insufficient credits",
          credits_available: totalAvailable,
          credits_needed: estimatedCredits,
        }),
        {
          status: 402,
          headers: { "Content-Type": "application/json", ...extraHeaders },
        }
      );
    }
  }

  // -------------------------------------------------------------------------
  // Client credit cap check (when serving a client channel)
  // -------------------------------------------------------------------------

  if (clientId) {
    const { data: clientCap } = await supabase
      .from("clients")
      .select("credit_cap_monthly, credit_cap_used")
      .eq("id", clientId)
      .single();

    if (
      clientCap?.credit_cap_monthly != null &&
      Number(clientCap.credit_cap_used) + estimatedCredits >
        Number(clientCap.credit_cap_monthly)
    ) {
      return new Response(
        JSON.stringify({
          error: "client_cap_exceeded",
          message:
            "This client's monthly credit cap has been reached. Please contact your agency.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...extraHeaders },
        }
      );
    }
  }

  // -------------------------------------------------------------------------
  // Load enabled tools
  // -------------------------------------------------------------------------

  const { data: toolRecords } = await supabase
    .from("agent_tools")
    .select("*")
    .eq("agent_id", agentId)
    .eq("is_enabled", true);

  const agentToolRecords = (toolRecords ?? []) as AgentToolRecord[];

  // Build display-name map for tool events (toolName → displayName).
  const toolDisplayNames: Record<string, string> = {};
  for (const t of agentToolRecords) {
    if (t.tool_type === "webhook") {
      toolDisplayNames[makeWebhookToolKey(t.display_name)] = t.display_name;
    } else if (t.tool_type === "http") {
      toolDisplayNames[makeHttpToolKey(t.display_name)] = t.display_name;
    } else if (t.tool_type === "subagent") {
      toolDisplayNames[makeSubagentToolKey(t.display_name)] = t.display_name;
    }
  }

  const { tools, failures } = await buildAgentTools(
    agentToolRecords,
    composioUserId,
    {
      depth: 0,
      ancestorAgentIds: new Set([agentId]),
      supabase,
    }
  );

  // Map Composio tool keys to friendly display names.
  for (const t of agentToolRecords) {
    if (t.tool_type !== "composio") continue;
    const cfg = t.config as { toolkit?: string; toolkit_name?: string };
    if (!cfg.toolkit) continue;

    const prefix = cfg.toolkit.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const displayPrefix = cfg.toolkit_name ?? cfg.toolkit;

    for (const toolKey of Object.keys(tools)) {
      if (toolKey.startsWith(prefix + "_") && !toolDisplayNames[toolKey]) {
        const actionPart = toolKey.slice(prefix.length + 1);
        const friendlyName = actionPart
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        toolDisplayNames[toolKey] = `${displayPrefix}: ${friendlyName}`;
      }
    }
  }

  // -------------------------------------------------------------------------
  // RAG: retrieve relevant knowledge if the agent has documents
  // -------------------------------------------------------------------------

  let ragContext = "";
  let ragChunks: RagChunk[] = [];

  const { count: docCount } = await supabase
    .from("agent_knowledge_documents")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .eq("status", "ready");

  const hasKnowledgeBase = (docCount ?? 0) > 0;

  if (hasKnowledgeBase) {
    // Check total chunk count to decide retrieval strategy
    const { count: chunkCount } = await supabase
      .from("agent_knowledge_chunks")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId);

    const totalChunks = chunkCount ?? 0;

    if (totalChunks <= SMALL_KB_THRESHOLD && totalChunks > 0) {
      // Small knowledge base — inject ALL chunks directly (no embedding, no threshold)
      const allResult = await loadAllChunks(agentId, supabase);
      ragContext = allResult.contextString;
      ragChunks = allResult.chunks;
    } else {
      // Larger knowledge base — similarity search with embedding
      const recentUserMsgs = conversationHistory
        .filter((m) => m.role === "user")
        .slice(-2)
        .map((m) => m.content);
      recentUserMsgs.push(userMessage);
      const retrievalQuery = recentUserMsgs.join("\n");

      const ragResult = await retrieveContextWithMetadata(
        agentId,
        retrievalQuery,
        supabase
      );
      ragContext = ragResult.contextString;
      ragChunks = ragResult.chunks;
    }

    // Auto-inject knowledge search tool (agent can call explicitly)
    const { toolName, toolDef } = buildKnowledgeTool(agentId, supabase);
    tools[toolName] = toolDef;
    toolDisplayNames[toolName] = KNOWLEDGE_TOOL_DISPLAY_NAME;
  }

  // hasTools must be computed AFTER knowledge tool injection
  const hasTools = Object.keys(tools).length > 0;

  // -------------------------------------------------------------------------
  // Assemble final system prompt
  // -------------------------------------------------------------------------

  const { systemPrompt } = assemblePrompt({
    systemPrompt: agent.system_prompt,
    ragContext,
    toolRecords: agentToolRecords,
    resolvedToolKeys: Object.keys(tools),
    failures,
    hasKnowledgeBase,
    personality: agent.personality as
      | { tone?: string; greeting_message?: string; language?: string }
      | null,
    wizardConfig: agent.wizard_config as
      | {
          templateId?: string;
          qualifyingQuestions?: string[];
          behaviorConfig?: Record<string, unknown>;
        }
      | null,
    toolGuidelines: (agent.tool_guidelines as string | null) ?? undefined,
  });

  // -------------------------------------------------------------------------
  // Set up SSE stream
  // -------------------------------------------------------------------------

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const emit = async (event: AgentServerEvent) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch {
      // Writer may be closed if client disconnected
    }
  };

  // -------------------------------------------------------------------------
  // Build AI messages from conversation history
  // -------------------------------------------------------------------------

  type AIMessage = { role: "user" | "assistant"; content: string };

  const recentHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES);

  const aiMessages: AIMessage[] = [];
  for (const m of recentHistory) {
    if (m.role === "user" || m.role === "assistant") {
      aiMessages.push({ role: m.role, content: m.content });
    } else if (m.role === "tool-call") {
      aiMessages.push({
        role: "assistant",
        content: `[Used tool \`${m.toolName}\`${m.toolArgs ? ` with ${JSON.stringify(m.toolArgs)}` : ""}]`,
      });
    } else if (m.role === "tool-result") {
      const status = m.toolSuccess === false ? "failed" : "succeeded";
      aiMessages.push({
        role: "assistant",
        content: `[Tool \`${m.toolName}\` ${status}: ${m.content}]`,
      });
    }
  }

  aiMessages.push({ role: "user", content: userMessage });

  // -------------------------------------------------------------------------
  // Run agent in background
  // -------------------------------------------------------------------------

  void (async () => {
    const toolEvents: AgentConversationMessage[] = [];

    // Emit RAG sources before LLM stream starts (so UI shows them early)
    if (ragChunks.length > 0) {
      const seen = new Set<string>();
      const uniqueSources: Array<{
        name: string;
        type: string;
        similarity: number;
        documentId: string;
      }> = [];
      for (const chunk of ragChunks) {
        if (!seen.has(chunk.documentId)) {
          seen.add(chunk.documentId);
          uniqueSources.push({
            name: chunk.sourceName,
            type: chunk.sourceType,
            similarity: Math.round(chunk.similarity * 100) / 100,
            documentId: chunk.documentId,
          });
        }
      }
      await emit({ type: "rag-context", sources: uniqueSources });
    }

    // onFinish runs asynchronously after the stream ends — we must wait for
    // it to complete before closing the writer, otherwise the "done" event
    // is emitted to an already-closed writer and the client never receives it.
    let resolveOnFinish: () => void;
    const onFinishComplete = new Promise<void>((r) => { resolveOnFinish = r; });

    try {
      const streamOptions: Parameters<typeof streamText>[0] = {
        model: getModel(agent.model),
        system: systemPrompt,
        messages: aiMessages,
        maxOutputTokens: 2048,
        // Only send Anthropic-specific options for direct Anthropic models
        ...(!agent.model.includes("/") && {
          providerOptions: {
            anthropic: {
              thinking: { type: "disabled" },
            },
          },
        }),
        async onFinish({ response, usage }) {
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

          const now = new Date().toISOString();
          const updatedHistory: AgentConversationMessage[] = [
            ...conversationHistory,
            { role: "user", content: userMessage, timestamp: now },
            ...toolEvents,
            { role: "assistant", content: fullContent, timestamp: now },
          ];

          const finalConversationId = await onConversationSave({
            updatedHistory,
            assistantContent: fullContent,
            userMessage,
          });

          // -----------------------------------------------------------------
          // Usage logging & credit deduction (actual token-based)
          // -----------------------------------------------------------------
          const tier = getModelTier(agent.model);
          const actualCredits = calculateCredits(
            agent.model,
            usage?.inputTokens,
            usage?.outputTokens
          );

          try {
            // Log usage
            await supabase.from("usage_logs").insert({
              user_id: agent.user_id,
              agent_id: agentId,
              client_id: clientId ?? null,
              conversation_id: finalConversationId ?? null,
              model: agent.model,
              model_tier: tier,
              credits_consumed: actualCredits,
              input_tokens: usage?.inputTokens ?? null,
              output_tokens: usage?.outputTokens ?? null,
            });

            // Atomic credit deduction (race-safe via row lock in Postgres)
            await supabase.rpc("deduct_credits", {
              p_user_id: agent.user_id,
              p_amount: actualCredits,
            });

            // Increment client cap usage (if serving a client channel)
            if (clientId) {
              await supabase.rpc("increment_client_cap_used", {
                p_client_id: clientId,
                p_amount: actualCredits,
              });
            }

            // Track cost on the conversation record
            if (finalConversationId) {
              await supabase.rpc("increment_conversation_cost", {
                p_conversation_id: finalConversationId,
                p_credits: actualCredits,
                p_input: usage?.inputTokens ?? 0,
                p_output: usage?.outputTokens ?? 0,
              });
            }
          } catch (usageErr) {
            // Usage logging is non-blocking — don't fail the chat
            logger.error("Failed to log usage or deduct credits", {
              agentId,
              error:
                usageErr instanceof Error
                  ? usageErr.message
                  : "Unknown error",
            });
          }

          await emit({
            type: "done",
            assistantContent: fullContent,
            conversationId: finalConversationId,
          });

          resolveOnFinish!();
        },
      };

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
          await emit({ type: "thinking", text: chunk.text });
        } else if (chunk.type === "reasoning-end") {
          if (wasThinking) {
            wasThinking = false;
            await emit({ type: "thinking-done" });
          }
        } else if (chunk.type === "text-delta") {
          if (wasThinking) {
            wasThinking = false;
            await emit({ type: "thinking-done" });
          }
          hasUnfinishedText = true;
          await emit({ type: "text-delta", delta: chunk.text });
        } else if (chunk.type === "tool-call") {
          toolEvents.push({
            role: "tool-call",
            content: `Called ${chunk.toolName}`,
            timestamp: new Date().toISOString(),
            toolName: chunk.toolName,
            toolArgs: chunk.input as Record<string, unknown> | undefined,
          });

          await emit({
            type: "tool-call",
            toolName: chunk.toolName,
            displayName: toolDisplayNames[chunk.toolName] ?? chunk.toolName,
            args: chunk.input as Record<string, unknown> | undefined,
          });
        } else if (chunk.type === "tool-result") {
          const output = chunk.output as {
            success?: boolean;
            successful?: boolean;
            error?: string | null;
            message?: string;
            data?: unknown;
          } | null;

          const isSuccess =
            output?.successful !== false && output?.success !== false;
          const resultMessage =
            output?.error ?? output?.message ?? undefined;

          const resultSummary = isSuccess
            ? resultMessage ?? "Completed successfully"
            : resultMessage ?? "Failed";
          toolEvents.push({
            role: "tool-result",
            content: resultSummary,
            timestamp: new Date().toISOString(),
            toolName: chunk.toolName,
            toolSuccess: isSuccess,
          });

          await emit({
            type: "tool-result",
            toolName: chunk.toolName,
            success: isSuccess,
            message: resultMessage,
            result: chunk.output,
          });
        }
      }

      if (hasUnfinishedText) {
        await emit({ type: "text-done" });
      }

      // Wait for onFinish to complete (DB saves, credit deduction, "done" emit)
      // before the finally block closes the writer.
      await onFinishComplete;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("Agent chat stream failed", {
        agentId,
        error: message,
      });

      // Surface a more helpful message for known error patterns
      let userMessage = "Something went wrong. Please try again.";
      if (
        message.includes("Invalid schema for function") ||
        message.includes("invalid_function_parameters")
      ) {
        // Extract the tool name if possible
        const toolMatch = message.match(/function '([^']+)'/);
        const toolName = toolMatch?.[1] ?? "a connected tool";
        userMessage = `One of your tools (${toolName}) has an incompatible schema. Try disabling it or selecting specific actions instead of all actions.`;
      } else if (message.includes("401") || message.includes("unauthorized")) {
        userMessage = "Authentication failed with the AI provider. Please check your configuration.";
      } else if (message.includes("429") || message.includes("rate limit")) {
        userMessage = "Rate limit reached. Please wait a moment and try again.";
      }

      await emit({
        type: "error",
        message: userMessage,
      });
      // Resolve in case onFinish never fires (stream errored before completion)
      resolveOnFinish!();
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
      ...extraHeaders,
    },
  });
}

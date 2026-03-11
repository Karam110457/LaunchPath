/**
 * Subagent tool builder.
 *
 * Allows one agent to invoke another agent as a tool. The subagent runs
 * with its own system prompt, tools, and knowledge base, then returns
 * its final response to the parent agent.
 *
 * Uses generateText (not streamText) since the parent agent is already
 * streaming — the subagent runs inside a tool's execute() which must
 * return a value synchronously.
 */

import { generateText, stepCountIs } from "ai";
import { tool } from "ai";
import { getModel } from "@/lib/ai/model-provider";
import { z } from "zod";
import { logger } from "@/lib/security/logger";
import { buildAgentTools } from "../builder";
import { assemblePrompt } from "@/lib/agents/assemble-prompt";
import {
  retrieveContextWithMetadata,
  loadAllChunks,
  SMALL_KB_THRESHOLD,
} from "@/lib/knowledge/rag";
import { buildKnowledgeTool } from "./knowledge";
import type { SubagentConfig, AgentToolRecord } from "../types";
import type { ToolBuildContext } from "../builder";

const MAX_SUBAGENT_DEPTH = 3;
const DEFAULT_MAX_TURNS = 5;
const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_RESPONSE_CHARS = 4000;

/**
 * Derive a stable Claude tool name from the subagent display name.
 * Prefixed with "ask_" to make intent clear.
 */
export function makeSubagentToolKey(displayName: string): string {
  return (
    "ask_" +
    displayName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 56) || "subagent"
  );
}

/**
 * Build a subagent tool definition.
 *
 * Returns { toolName, toolDef, skip, reason } — skip is true if the tool
 * should not be built (circular ref, depth exceeded, etc.).
 */
export function buildSubagentTool(
  config: SubagentConfig,
  displayName: string,
  description: string,
  parentAgentId: string,
  context: ToolBuildContext
): {
  toolName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolDef: any | null;
  skip: boolean;
  reason: string | null;
} {
  const toolName = makeSubagentToolKey(displayName);

  // Pre-flight: depth check
  if (context.depth >= MAX_SUBAGENT_DEPTH) {
    return {
      toolName,
      toolDef: null,
      skip: true,
      reason: `Max subagent depth (${MAX_SUBAGENT_DEPTH}) reached`,
    };
  }

  // Pre-flight: circular reference check
  if (context.ancestorAgentIds.has(config.target_agent_id)) {
    return {
      toolName,
      toolDef: null,
      skip: true,
      reason: "Circular reference detected — this agent is already in the call chain",
    };
  }

  return {
    toolName,
    toolDef: tool({
      description,
      inputSchema: z.object({
        message: z
          .string()
          .describe(
            "The message or question to send to this agent. Be specific about what you need."
          ),
        context: z
          .string()
          .optional()
          .describe(
            "Optional additional context from the current conversation that may help the agent."
          ),
      }),
      execute: async (params) => {
        const timeout = Math.min(
          config.timeout_ms ?? DEFAULT_TIMEOUT_MS,
          DEFAULT_TIMEOUT_MS
        );
        const maxTurns = Math.min(
          config.max_turns ?? DEFAULT_MAX_TURNS,
          10
        );

        try {
          // Load the target agent
          const { data: targetAgent } = await context.supabase
            .from("ai_agents")
            .select("*")
            .eq("id", config.target_agent_id)
            .single();

          if (!targetAgent) {
            return {
              success: false,
              message: "Subagent not found or has been deleted.",
            };
          }

          // Load the target agent's enabled tools
          const { data: targetToolRecords } = await context.supabase
            .from("agent_tools")
            .select("*")
            .eq("agent_id", config.target_agent_id)
            .eq("is_enabled", true);

          const subagentTools = (targetToolRecords ?? []) as AgentToolRecord[];

          // Build tools recursively with updated context
          const childContext: ToolBuildContext = {
            depth: context.depth + 1,
            ancestorAgentIds: new Set([
              ...context.ancestorAgentIds,
              parentAgentId,
            ]),
            supabase: context.supabase,
          };

          const { tools, failures } = await buildAgentTools(
            subagentTools,
            targetAgent.user_id,
            childContext
          );

          // Load RAG context if agent has knowledge documents
          let ragContext = "";
          const { count: docCount } = await context.supabase
            .from("agent_knowledge_documents")
            .select("id", { count: "exact", head: true })
            .eq("agent_id", config.target_agent_id)
            .eq("status", "ready");

          const hasKnowledgeBase = (docCount ?? 0) > 0;

          if (hasKnowledgeBase) {
            // Check total chunk count for small KB optimization
            const { count: chunkCount } = await context.supabase
              .from("agent_knowledge_chunks")
              .select("id", { count: "exact", head: true })
              .eq("agent_id", config.target_agent_id);

            const totalChunks = chunkCount ?? 0;

            if (totalChunks <= SMALL_KB_THRESHOLD && totalChunks > 0) {
              // Small KB — inject all chunks directly
              const allResult = await loadAllChunks(
                config.target_agent_id,
                context.supabase
              );
              ragContext = allResult.contextString;
            } else {
              // Larger KB — similarity search
              const ragResult = await retrieveContextWithMetadata(
                config.target_agent_id,
                params.message,
                context.supabase
              );
              ragContext = ragResult.contextString;
            }

            // Auto-inject knowledge search tool for subagent
            const { toolName, toolDef } = buildKnowledgeTool(
              config.target_agent_id,
              context.supabase
            );
            tools[toolName] = toolDef;
          }

          // Assemble prompt
          const { systemPrompt } = assemblePrompt({
            systemPrompt: targetAgent.system_prompt,
            ragContext,
            toolRecords: subagentTools,
            resolvedToolKeys: Object.keys(tools),
            failures,
            hasKnowledgeBase,
            toolGuidelines: (targetAgent.tool_guidelines as string | null) ?? undefined,
          });

          // Build messages — include optional context
          const userContent = params.context
            ? `${params.message}\n\nAdditional context: ${params.context}`
            : params.message;

          const messages = [
            { role: "user" as const, content: userContent },
          ];

          // Execute with timeout
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeout);

          const hasTools = Object.keys(tools).length > 0;

          const result = await generateText({
            model: getModel(targetAgent.model),
            system: systemPrompt,
            messages,
            maxOutputTokens: 2048,
            abortSignal: controller.signal,
            ...(hasTools
              ? {
                  tools: tools as Parameters<typeof generateText>[0]["tools"],
                  stopWhen: stepCountIs(maxTurns),
                }
              : {}),
          });

          clearTimeout(timer);

          const responseText = result.text?.trim() || "";

          // If the sub-agent used tools but produced no text summary, provide a fallback
          if (!responseText) {
            const lastStepTools = result.steps?.at(-1)?.toolResults;
            if (lastStepTools?.length) {
              return {
                success: true,
                message: `[${targetAgent.name} completed the task using tools but did not provide a text summary.]`,
                agent_name: targetAgent.name,
              };
            }
          }

          const trimmed =
            responseText.length > MAX_RESPONSE_CHARS
              ? responseText.slice(0, MAX_RESPONSE_CHARS) + "... [truncated]"
              : responseText;

          return {
            success: true,
            message: trimmed || `[${targetAgent.name} returned an empty response.]`,
            agent_name: targetAgent.name,
          };
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            return {
              success: false,
              message: `Subagent timed out after ${timeout}ms.`,
            };
          }
          logger.error("Subagent execution failed", {
            targetAgentId: config.target_agent_id,
            error: err instanceof Error ? err.message : String(err),
          });
          return {
            success: false,
            message: "Subagent failed to respond.",
          };
        }
      },
    }),
    skip: false,
    reason: null,
  };
}

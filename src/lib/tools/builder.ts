/**
 * buildAgentTools
 *
 * Given the agent's enabled tool records from the DB, returns a
 * Vercel AI SDK–compatible tools map to pass to streamText(),
 * plus a list of any tools that failed to load (for degradation messaging).
 *
 * Errors from individual tools are caught and logged — one failing
 * tool never prevents the others from working.
 */

import { logger } from "@/lib/security/logger";
import { buildWebhookTool } from "./integrations/webhook";
import { buildMCPTools } from "./integrations/mcp";
import { buildComposioTools } from "./integrations/composio";
import { buildHttpTool } from "./integrations/http";
import type { ToolFailure } from "./integrations/composio";
import type {
  AgentToolRecord,
  WebhookConfig,
  MCPConfig,
  HttpToolConfig,
} from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Context passed through the build chain for subagent depth tracking. */
export interface ToolBuildContext {
  /** Current depth in the subagent chain. Root = 0. */
  depth: number;
  /** Set of agent IDs in the current call chain, for circular reference detection. */
  ancestorAgentIds: Set<string>;
  /** Supabase client for loading subagent configs at runtime. */
  supabase: SupabaseClient;
}

export interface BuildToolsResult {
  tools: Record<string, unknown>;
  failures: ToolFailure[];
}

export async function buildAgentTools(
  agentTools: AgentToolRecord[],
  userId?: string,
  context?: ToolBuildContext
): Promise<BuildToolsResult> {
  const tools: Record<string, unknown> = {};
  const failures: ToolFailure[] = [];
  const composioRecords: AgentToolRecord[] = [];

  for (const agentTool of agentTools) {
    if (!agentTool.is_enabled) continue;

    // Fallback description for the AI SDK tool() definition
    const desc = agentTool.description || `${agentTool.display_name} tool`;

    try {
      switch (agentTool.tool_type) {
        case "webhook": {
          const cfg = agentTool.config as unknown as WebhookConfig;
          if (!cfg.url) {
            failures.push({ displayName: agentTool.display_name, toolkit: "webhook", reason: "Missing webhook URL" });
            break;
          }
          const { toolName, toolDef } = buildWebhookTool(
            cfg,
            agentTool.display_name,
            desc
          );
          // Avoid collisions — append _2, _3 etc.
          let key = toolName;
          let i = 2;
          while (tools[key]) {
            key = `${toolName}_${i++}`;
          }
          tools[key] = toolDef;
          break;
        }

        case "mcp": {
          const cfg = agentTool.config as unknown as MCPConfig;
          if (!cfg.server_url) {
            failures.push({ displayName: agentTool.display_name, toolkit: "mcp", reason: "Missing MCP server URL" });
            break;
          }
          const mcpTools = await buildMCPTools(cfg);
          Object.assign(tools, mcpTools);
          break;
        }

        case "http": {
          const cfg = agentTool.config as unknown as HttpToolConfig;
          if (!cfg.url) {
            failures.push({ displayName: agentTool.display_name, toolkit: "http", reason: "Missing HTTP endpoint URL" });
            break;
          }
          const { toolName, toolDef } = buildHttpTool(
            cfg,
            agentTool.display_name,
            desc
          );
          let httpKey = toolName;
          let httpI = 2;
          while (tools[httpKey]) {
            httpKey = `${toolName}_${httpI++}`;
          }
          tools[httpKey] = toolDef;
          break;
        }

        case "subagent": {
          // Subagent tools require a build context with supabase client
          if (!context?.supabase) {
            logger.warn("Subagent tool skipped — no build context provided", {
              toolId: agentTool.id,
            });
            break;
          }

          // Dynamic import to avoid circular dependency at module level
          const { buildSubagentTool } = await import("./integrations/subagent");
          const subResult = buildSubagentTool(
            agentTool.config as unknown as import("./types").SubagentConfig,
            agentTool.display_name,
            desc,
            agentTool.agent_id,
            context
          );

          if (subResult.skip || !subResult.toolDef) {
            failures.push({
              displayName: agentTool.display_name,
              toolkit: "subagent",
              reason: subResult.reason ?? "Unknown skip reason",
            });
            break;
          }

          let subKey = subResult.toolName;
          let subI = 2;
          while (tools[subKey]) {
            subKey = `${subResult.toolName}_${subI++}`;
          }
          tools[subKey] = subResult.toolDef;
          break;
        }

        case "composio": {
          // Collect composio records — built in a single batch below
          composioRecords.push(agentTool);
          break;
        }
      }
    } catch (err) {
      logger.error("Failed to build tool", {
        toolId: agentTool.id,
        toolType: agentTool.tool_type,
        err,
      });
    }
  }

  // Build all Composio tools in one batch
  if (composioRecords.length > 0 && !userId) {
    for (const rec of composioRecords) {
      failures.push({ displayName: rec.display_name, toolkit: "composio", reason: "Missing user context for Composio tools" });
    }
  }
  if (composioRecords.length > 0 && userId) {
    try {
      const result = await buildComposioTools(userId, composioRecords);
      Object.assign(tools, result.tools);
      failures.push(...result.failures);
    } catch (err) {
      logger.error("Failed to build Composio tools", { userId, err });
    }
  }

  return { tools, failures };
}

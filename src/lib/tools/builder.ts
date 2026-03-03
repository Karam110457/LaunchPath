/**
 * buildAgentTools
 *
 * Given the agent's enabled tool records from the DB, returns a
 * Vercel AI SDK–compatible tools map to pass to streamText().
 *
 * Errors from individual tools are caught and logged — one failing
 * tool never prevents the others from working.
 */

import { logger } from "@/lib/security/logger";
import { buildWebhookTool } from "./integrations/webhook";
import { buildMCPTools } from "./integrations/mcp";
import { buildComposioTools } from "./integrations/composio";
import type {
  AgentToolRecord,
  WebhookConfig,
  MCPConfig,
} from "./types";

export async function buildAgentTools(
  agentTools: AgentToolRecord[],
  userId?: string
): Promise<Record<string, unknown>> {
  const tools: Record<string, unknown> = {};
  const composioRecords: AgentToolRecord[] = [];

  for (const agentTool of agentTools) {
    if (!agentTool.is_enabled) continue;

    try {
      switch (agentTool.tool_type) {
        case "webhook": {
          const cfg = agentTool.config as unknown as WebhookConfig;
          if (!cfg.url) break;
          const { toolName, toolDef } = buildWebhookTool(
            cfg,
            agentTool.display_name,
            agentTool.description
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
          if (!cfg.server_url) break;
          const mcpTools = await buildMCPTools(cfg);
          Object.assign(tools, mcpTools);
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

  // Build all Composio tools in one batch (single session)
  if (composioRecords.length > 0 && userId) {
    try {
      const composioTools = await buildComposioTools(userId, composioRecords);
      Object.assign(tools, composioTools);
    } catch (err) {
      logger.error("Failed to build Composio tools", { userId, err });
    }
  }

  return tools;
}

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
import { buildCalendlyTool } from "./integrations/calendly";
import { buildGHLTool } from "./integrations/ghl";
import { buildHubSpotTool } from "./integrations/hubspot";
import { buildHumanHandoffTool } from "./integrations/human-handoff";
import { buildWebhookTool } from "./integrations/webhook";
import { buildMCPTools } from "./integrations/mcp";
import type {
  AgentToolRecord,
  CalendlyConfig,
  GHLConfig,
  HubSpotConfig,
  HumanHandoffConfig,
  WebhookConfig,
  MCPConfig,
} from "./types";

export async function buildAgentTools(
  agentTools: AgentToolRecord[]
): Promise<Record<string, unknown>> {
  const tools: Record<string, unknown> = {};

  for (const agentTool of agentTools) {
    if (!agentTool.is_enabled) continue;

    try {
      switch (agentTool.tool_type) {
        case "calendly": {
          const cfg = agentTool.config as unknown as CalendlyConfig;
          if (!cfg.booking_url) break;
          tools["book_appointment"] = buildCalendlyTool(cfg, agentTool.description);
          break;
        }

        case "ghl": {
          const cfg = agentTool.config as unknown as GHLConfig;
          if (!cfg.api_key || !cfg.location_id) break;
          tools["create_crm_contact"] = buildGHLTool(cfg, agentTool.description);
          break;
        }

        case "hubspot": {
          const cfg = agentTool.config as unknown as HubSpotConfig;
          if (!cfg.access_token) break;
          // Use different key if GHL is also present
          const key = tools["create_crm_contact"] ? "create_hubspot_contact" : "create_crm_contact";
          tools[key] = buildHubSpotTool(cfg, agentTool.description);
          break;
        }

        case "human-handoff": {
          const cfg = agentTool.config as unknown as HumanHandoffConfig;
          tools["transfer_to_human"] = buildHumanHandoffTool(cfg, agentTool.description);
          break;
        }

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
      }
    } catch (err) {
      logger.error("Failed to build tool", {
        toolId: agentTool.id,
        toolType: agentTool.tool_type,
        err,
      });
    }
  }

  return tools;
}

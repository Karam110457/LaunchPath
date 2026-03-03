/**
 * Composio tool builder.
 *
 * Converts agent_tools records of type "composio" into Vercel AI SDK–compatible
 * tools via the Composio session. The @composio/vercel provider returns tools
 * with built-in execute functions — no manual API calls needed.
 *
 * Errors are caught and logged. One failing toolkit never breaks others.
 */

import { getComposioClient } from "@/lib/composio/client";
import { logger } from "@/lib/security/logger";
import type { AgentToolRecord, ComposioToolConfig } from "../types";

export async function buildComposioTools(
  userId: string,
  records: AgentToolRecord[]
): Promise<Record<string, unknown>> {
  const tools: Record<string, unknown> = {};

  if (records.length === 0) return tools;

  try {
    const composio = getComposioClient();

    // Build session config — toolkit/action filtering happens at session creation
    const toolkitSlugs: string[] = [];
    const toolsFilter: Record<string, string[]> = {};

    for (const record of records) {
      const cfg = record.config as unknown as ComposioToolConfig;
      if (!cfg.toolkit) continue;

      if (!toolkitSlugs.includes(cfg.toolkit)) {
        toolkitSlugs.push(cfg.toolkit);
      }

      if (cfg.enabled_actions && cfg.enabled_actions.length > 0) {
        const existing = toolsFilter[cfg.toolkit] ?? [];
        toolsFilter[cfg.toolkit] = [...existing, ...cfg.enabled_actions];
      }
    }

    // Create session with toolkit and action filters applied
    const session = await composio.create(userId, {
      toolkits: toolkitSlugs,
      ...(Object.keys(toolsFilter).length > 0 ? { tools: toolsFilter } : {}),
    });

    // Fetch all tools in one call — filtering already applied at session level
    const sessionTools = await session.tools();

    if (sessionTools && typeof sessionTools === "object") {
      Object.assign(tools, sessionTools);
    }
  } catch (err) {
    logger.error("Failed to build Composio tools", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return tools;
}

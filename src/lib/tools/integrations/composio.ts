/**
 * Composio tool builder.
 *
 * Converts agent_tools records of type "composio" into Vercel AI SDK–compatible
 * tools via the Composio session. The @composio/vercel provider returns tools
 * with built-in execute functions — no manual API calls needed.
 *
 * Before building tools, validates that the user's connections are still ACTIVE
 * on Composio and attempts token refresh for expired connections.
 *
 * Errors are caught and logged. One failing toolkit never breaks others.
 */

import { getComposioClient } from "@/lib/composio/client";
import { logger } from "@/lib/security/logger";
import type { AgentToolRecord, ComposioToolConfig } from "../types";

type AccountItem = {
  id: string;
  toolkit: { slug: string };
  status: string;
};

/**
 * Verifies that the user's connections for the requested toolkits are still
 * ACTIVE on Composio. Attempts to refresh EXPIRED connections once.
 * Returns the set of toolkit slugs that are confirmed active.
 */
async function getActiveToolkits(
  composio: ReturnType<typeof getComposioClient>,
  userId: string,
  requestedToolkits: string[]
): Promise<Set<string>> {
  const active = new Set<string>();

  try {
    const result = await composio.connectedAccounts.list({
      userIds: [userId],
      toolkitSlugs: requestedToolkits,
    });

    const items = (result as unknown as { items: AccountItem[] }).items ?? [];

    for (const item of items) {
      const slug = item.toolkit?.slug;
      if (!slug || !requestedToolkits.includes(slug)) continue;

      if (item.status === "ACTIVE") {
        active.add(slug);
      } else if (item.status === "EXPIRED") {
        // Attempt token refresh for expired connections
        try {
          await composio.connectedAccounts.refresh(item.id);
          active.add(slug);
          logger.info("Refreshed expired Composio connection", {
            userId,
            toolkit: slug,
          });
        } catch (refreshErr) {
          logger.error("Failed to refresh Composio connection", {
            userId,
            toolkit: slug,
            error: refreshErr instanceof Error ? refreshErr.message : String(refreshErr),
          });
        }
      }
      // INITIATED, INITIALIZING, FAILED — skip (not usable)
    }
  } catch (err) {
    logger.error("Failed to verify Composio connections", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    // Fallback: assume all requested toolkits are active so we don't silently
    // break tools when the connection check itself fails (network blip, etc.)
    for (const t of requestedToolkits) active.add(t);
  }

  return active;
}

/**
 * Wraps a Composio tool's execute function with error context so auth failures
 * produce a user-friendly message the agent can relay, instead of an opaque error.
 */
function wrapToolExecute(
  toolKey: string,
  toolDef: Record<string, unknown>
): Record<string, unknown> {
  const originalExecute = toolDef.execute;
  if (typeof originalExecute !== "function") return toolDef;

  return {
    ...toolDef,
    execute: async (...args: unknown[]) => {
      try {
        return await (originalExecute as (...a: unknown[]) => Promise<unknown>)(...args);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isAuthError =
          message.includes("401") ||
          message.includes("403") ||
          message.includes("auth") ||
          message.includes("token") ||
          message.includes("expired") ||
          message.includes("unauthorized");

        if (isAuthError) {
          logger.error("Composio tool auth failure", { toolKey, error: message });
          return {
            success: false,
            error: `Authentication failed for ${toolKey}. The user may need to reconnect this app in their tool settings.`,
          };
        }

        logger.error("Composio tool execution failed", { toolKey, error: message });
        return {
          success: false,
          error: `Tool ${toolKey} failed: ${message}`,
        };
      }
    },
  };
}

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

    // Validate connections are still active before creating session.
    // Attempts token refresh for expired connections.
    const activeToolkits = await getActiveToolkits(composio, userId, toolkitSlugs);

    // Only build tools for toolkits with active connections
    const validToolkits = toolkitSlugs.filter((t) => activeToolkits.has(t));

    if (validToolkits.length === 0) {
      logger.error("No active Composio connections found", {
        userId,
        requested: toolkitSlugs,
      });
      return tools;
    }

    if (validToolkits.length < toolkitSlugs.length) {
      const skipped = toolkitSlugs.filter((t) => !activeToolkits.has(t));
      logger.error("Some Composio connections inactive, skipping", {
        userId,
        skipped,
      });
      // Also filter the tools filter map
      for (const slug of skipped) {
        delete toolsFilter[slug];
      }
    }

    // Create session with toolkit and action filters applied
    const session = await composio.create(userId, {
      toolkits: validToolkits,
      ...(Object.keys(toolsFilter).length > 0 ? { tools: toolsFilter } : {}),
    });

    // Fetch all tools in one call — filtering already applied at session level
    const sessionTools = await session.tools();

    if (sessionTools && typeof sessionTools === "object") {
      // Filter out Composio internal/meta tools (COMPOSIO_MANAGE_CONNECTIONS,
      // COMPOSIO_MULTI_EXECUTE_TOOL, etc.) — the agent only needs toolkit actions
      for (const [key, value] of Object.entries(sessionTools)) {
        if (!key.startsWith("COMPOSIO_")) {
          // Wrap execute with error context for better user-facing messages
          tools[key] =
            value && typeof value === "object"
              ? wrapToolExecute(key, value as Record<string, unknown>)
              : value;
        }
      }
    }
  } catch (err) {
    logger.error("Failed to build Composio tools", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return tools;
}

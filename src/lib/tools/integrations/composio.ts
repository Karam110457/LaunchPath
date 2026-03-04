/**
 * Composio tool builder.
 *
 * Converts agent_tools records of type "composio" into Vercel AI SDK–compatible
 * tools via composio.tools.get(). The @composio/vercel provider returns tools
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

/** A toolkit that failed to load — surfaced to the agent via system prompt. */
export interface ToolFailure {
  displayName: string;
  toolkit: string;
  reason: string;
}

/** Return type for buildComposioTools — includes both tools and failures. */
export interface ComposioToolsResult {
  tools: Record<string, unknown>;
  failures: ToolFailure[];
}

// Fields to strip from tool results — metadata noise that wastes tokens
const STRIP_FIELDS = new Set([
  "response_headers",
  "raw_response",
  "request_id",
  "status_code",
  "responseHeaders",
  "rawResponse",
  "requestId",
  "statusCode",
]);

/** Max chars for JSON-serialized tool result data before truncation. */
const MAX_RESULT_CHARS = 4000;

/**
 * Verifies that the user's connections for the requested toolkits are still
 * ACTIVE on Composio. Attempts to refresh EXPIRED connections once.
 * Returns the set of toolkit slugs that are confirmed active, plus failures.
 */
async function getActiveToolkits(
  composio: ReturnType<typeof getComposioClient>,
  userId: string,
  requestedToolkits: string[],
  displayNameMap: Map<string, string>
): Promise<{ active: Set<string>; failures: ToolFailure[] }> {
  const active = new Set<string>();
  const failures: ToolFailure[] = [];

  try {
    const result = await composio.connectedAccounts.list({
      userIds: [userId],
      toolkitSlugs: requestedToolkits,
    });

    const items = (result as unknown as { items: AccountItem[] }).items ?? [];

    // Track which toolkits we got results for
    const seen = new Set<string>();

    for (const item of items) {
      const slug = item.toolkit?.slug;
      if (!slug || !requestedToolkits.includes(slug)) continue;
      seen.add(slug);

      if (item.status === "ACTIVE") {
        active.add(slug);
      } else if (item.status === "EXPIRED") {
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
            error:
              refreshErr instanceof Error
                ? refreshErr.message
                : String(refreshErr),
          });
          failures.push({
            displayName: displayNameMap.get(slug) ?? slug,
            toolkit: slug,
            reason: "Connection expired and could not be refreshed",
          });
        }
      } else {
        // INITIATED, INITIALIZING, FAILED — not usable
        failures.push({
          displayName: displayNameMap.get(slug) ?? slug,
          toolkit: slug,
          reason:
            item.status === "FAILED"
              ? "Connection failed — credentials may be invalid"
              : `Connection is ${item.status.toLowerCase()} — not yet ready`,
        });
      }
    }

    // Toolkits with no connected account at all
    for (const slug of requestedToolkits) {
      if (!seen.has(slug)) {
        failures.push({
          displayName: displayNameMap.get(slug) ?? slug,
          toolkit: slug,
          reason: "No connection found — the user needs to connect this app",
        });
      }
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

  return { active, failures };
}

/**
 * Trims a tool execution result to prevent context window bloat.
 * Strips metadata fields and caps data size.
 */
function trimToolResult(result: unknown): unknown {
  if (!result || typeof result !== "object") return result;

  const r = { ...(result as Record<string, unknown>) };

  // Strip metadata noise
  for (const field of STRIP_FIELDS) {
    delete r[field];
  }

  // Trim nested data if present
  if (r.data && typeof r.data === "object") {
    const data = { ...(r.data as Record<string, unknown>) };
    for (const field of STRIP_FIELDS) {
      delete data[field];
    }
    r.data = data;
  }

  // Cap total data size
  try {
    const dataStr = JSON.stringify(r.data ?? r);
    if (dataStr.length > MAX_RESULT_CHARS) {
      // For arrays, include count; for objects, include truncated preview
      const dataVal = r.data;
      if (Array.isArray(dataVal)) {
        r.data = {
          _truncated: true,
          _totalItems: dataVal.length,
          _showing: "first items",
          items: dataVal.slice(0, 5),
          _message: `Result contained ${dataVal.length} items. Showing first 5.`,
        };
      } else {
        r.data = {
          _truncated: true,
          _preview: dataStr.slice(0, MAX_RESULT_CHARS),
          _message:
            "Result was too large and has been truncated. Ask the user to be more specific if needed.",
        };
      }
    }
  } catch {
    // JSON.stringify failed — leave as-is
  }

  return r;
}

/**
 * Wraps a Composio tool's execute function with error context and result
 * trimming so auth failures produce a user-friendly message the agent can
 * relay, and large results don't blow up the context window.
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
        const result = await (
          originalExecute as (...a: unknown[]) => Promise<unknown>
        )(...args);
        return trimToolResult(result);
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
          logger.error("Composio tool auth failure", {
            toolKey,
            error: message,
          });
          return {
            successful: false,
            error: `Authentication failed for ${toolKey}. The user may need to reconnect this app in their tool settings.`,
          };
        }

        logger.error("Composio tool execution failed", {
          toolKey,
          error: message,
        });
        return {
          successful: false,
          error: `Tool ${toolKey} failed: ${message}`,
        };
      }
    },
  };
}

/**
 * Schema modifier passed to tools.get() — cleans up tool descriptions
 * for better LLM comprehension. Cast to `unknown` when passing because
 * the SDK uses an internal Tool type we can't import.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanSchema(context: { toolSlug: string; toolkitSlug: string; schema: any }): any {
  const schema = context.schema;

  // Clean up description whitespace
  if (typeof schema.description === "string") {
    schema.description = schema.description
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return schema;
}

export async function buildComposioTools(
  userId: string,
  records: AgentToolRecord[]
): Promise<ComposioToolsResult> {
  const tools: Record<string, unknown> = {};
  const failures: ToolFailure[] = [];

  if (records.length === 0) return { tools, failures };

  try {
    const composio = getComposioClient();

    // Collect toolkit slugs, action slugs, and display names
    const toolkitSlugs: string[] = [];
    const specificActions: string[] = [];
    const toolkitsWithAllActions: string[] = [];
    const displayNameMap = new Map<string, string>();

    for (const record of records) {
      const cfg = record.config as unknown as ComposioToolConfig;
      if (!cfg.toolkit) continue;

      if (!toolkitSlugs.includes(cfg.toolkit)) {
        toolkitSlugs.push(cfg.toolkit);
      }
      displayNameMap.set(cfg.toolkit, cfg.toolkit_name ?? cfg.toolkit);

      if (cfg.enabled_actions && cfg.enabled_actions.length > 0) {
        specificActions.push(...cfg.enabled_actions);
      } else {
        if (!toolkitsWithAllActions.includes(cfg.toolkit)) {
          toolkitsWithAllActions.push(cfg.toolkit);
        }
      }
    }

    // Validate connections are still active
    const { active: activeToolkits, failures: connFailures } =
      await getActiveToolkits(composio, userId, toolkitSlugs, displayNameMap);
    failures.push(...connFailures);

    // Filter to only active toolkits
    const validSpecificActions = specificActions.filter((action) => {
      // Action slug format: TOOLKIT_ACTION — extract toolkit prefix
      const toolkitPrefix = action.split("_")[0].toLowerCase();
      // Match against active toolkit slugs
      return [...activeToolkits].some(
        (slug) => slug.toLowerCase().replace(/[^a-z0-9]/g, "") === toolkitPrefix
      );
    });

    const validToolkitsForAll = toolkitsWithAllActions.filter((t) =>
      activeToolkits.has(t)
    );

    if (validSpecificActions.length === 0 && validToolkitsForAll.length === 0) {
      logger.error("No active Composio connections found", {
        userId,
        requested: toolkitSlugs,
      });
      return { tools, failures };
    }

    // modifySchema options — cleans descriptions for better LLM comprehension
    const options = {
      modifySchema: cleanSchema,
    };

    // Fetch tools — SDK requires either `tools` or `toolkits`, not both.
    // Make separate calls if we have both specific actions and "all actions" toolkits.
    const fetchPromises: Promise<Record<string, unknown> | null>[] = [];

    if (validSpecificActions.length > 0) {
      fetchPromises.push(
        composio.tools
          .get(userId, { tools: validSpecificActions }, options)
          .then((r) => r as unknown as Record<string, unknown>)
          .catch((err) => {
            logger.error("Failed to fetch specific Composio tools", {
              userId,
              tools: validSpecificActions,
              error: err instanceof Error ? err.message : String(err),
            });
            return null;
          })
      );
    }

    if (validToolkitsForAll.length > 0) {
      fetchPromises.push(
        composio.tools
          .get(
            userId,
            { toolkits: validToolkitsForAll, important: true },
            options
          )
          .then((r) => r as unknown as Record<string, unknown>)
          .catch((err) => {
            logger.error("Failed to fetch Composio toolkit tools", {
              userId,
              toolkits: validToolkitsForAll,
              error: err instanceof Error ? err.message : String(err),
            });
            return null;
          })
      );
    }

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
      if (!result || typeof result !== "object") continue;
      for (const [key, value] of Object.entries(result)) {
        // Wrap execute with error context + result trimming
        tools[key] =
          value && typeof value === "object"
            ? wrapToolExecute(key, value as Record<string, unknown>)
            : value;
      }
    }
  } catch (err) {
    logger.error("Failed to build Composio tools", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { tools, failures };
}

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
import type { ComposioAccountItem } from "@/lib/composio/types";
import { logger } from "@/lib/security/logger";
import { trimToolResult } from "../result-trim";
import type { AgentToolRecord, ComposioToolConfig, ActionConfig } from "../types";

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

    const items = (result as unknown as { items: ComposioAccountItem[] }).items ?? [];

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
 * Recursively fix JSON Schema nodes that have "type": "array" but no "items".
 * OpenAI (via OpenRouter) rejects these schemas.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fixArraySchemas(node: any): any {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map(fixArraySchemas);
  }

  const fixed = { ...node };

  // Fix: array type without items
  if (fixed.type === "array" && !fixed.items) {
    fixed.items = {};
  }

  // Recurse into common JSON Schema keywords
  for (const key of [
    "properties", "items", "additionalProperties",
    "allOf", "anyOf", "oneOf", "not", "then", "else", "if",
  ]) {
    if (fixed[key] !== undefined) {
      if (key === "properties" && typeof fixed[key] === "object" && !Array.isArray(fixed[key])) {
        const props = { ...fixed[key] };
        for (const propName of Object.keys(props)) {
          props[propName] = fixArraySchemas(props[propName]);
        }
        fixed[key] = props;
      } else {
        fixed[key] = fixArraySchemas(fixed[key]);
      }
    }
  }

  return fixed;
}

/**
 * Creates a schema modifier that cleans descriptions, strips pinned (fixed)
 * parameter fields, and annotates default parameter fields.
 */
function makeSchemaModifier(
  pinnedParamsMap: Map<string, Record<string, unknown>>,
  defaultParamsMap: Map<string, Record<string, unknown>>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function modifySchema(context: { toolSlug: string; toolkitSlug: string; schema: any }): any {
    // Clone to avoid mutating any SDK-cached schema objects
    const schema = { ...context.schema };

    // Clean up description whitespace
    if (typeof schema.description === "string") {
      schema.description = schema.description
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\s{2,}/g, " ")
        .trim();
    }

    const origInputSchema =
      schema.inputSchema ?? schema.parameters ?? schema.input;
    if (!origInputSchema || typeof origInputSchema !== "object" || !origInputSchema.properties) {
      return schema;
    }

    // Deep-clone input schema so we don't mutate the original
    const inputSchema = {
      ...origInputSchema,
      properties: { ...origInputSchema.properties },
      required: Array.isArray(origInputSchema.required)
        ? [...origInputSchema.required]
        : origInputSchema.required,
    };

    // Replace the reference in the cloned schema
    if (schema.inputSchema) schema.inputSchema = inputSchema;
    else if (schema.parameters) schema.parameters = inputSchema;
    else if (schema.input) schema.input = inputSchema;

    // Strip pinned (fixed) fields — LLM never sees them
    const pinned = pinnedParamsMap.get(context.toolSlug);
    if (pinned) {
      for (const paramName of Object.keys(pinned)) {
        delete inputSchema.properties[paramName];
        if (Array.isArray(inputSchema.required)) {
          inputSchema.required = inputSchema.required.filter(
            (r: string) => r !== paramName
          );
        }
      }
    }

    // Annotate default fields — LLM sees the field but knows about the fallback
    const defaults = defaultParamsMap.get(context.toolSlug);
    if (defaults) {
      for (const [paramName, defaultValue] of Object.entries(defaults)) {
        const prop = inputSchema.properties[paramName];
        if (prop) {
          // Clone the property to avoid mutating the original
          const clonedProp = { ...prop };
          const valStr = JSON.stringify(defaultValue);
          clonedProp.description = (clonedProp.description ?? paramName) +
            ` (default: ${valStr})`;
          inputSchema.properties[paramName] = clonedProp;
        }
      }
    }

    // Fix malformed Composio schemas (e.g. array without items)
    return fixArraySchemas(schema);
  };
}

/**
 * Creates a tool execute wrapper that injects default and pinned params,
 * and trims results. Merge order: defaults < AI args < pinned.
 */
function makeToolWrapper(
  pinnedParamsMap: Map<string, Record<string, unknown>>,
  defaultParamsMap: Map<string, Record<string, unknown>>
) {
  return function wrapTool(
    toolKey: string,
    toolDef: Record<string, unknown>
  ): Record<string, unknown> {
    const originalExecute = toolDef.execute;
    if (typeof originalExecute !== "function") return toolDef;

    const pinned = pinnedParamsMap.get(toolKey);
    const defaults = defaultParamsMap.get(toolKey);

    return {
      ...toolDef,
      execute: async (...args: unknown[]) => {
        // Merge: defaults fill gaps, AI args override defaults, pinned always wins
        if ((pinned || defaults) && args[0] && typeof args[0] === "object") {
          args[0] = {
            ...(defaults ?? {}),
            ...(args[0] as Record<string, unknown>),
            ...(pinned ?? {}),
          };
        }

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
  };
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

    // Collect toolkit slugs, action slugs, display names, and pinned params
    const toolkitSlugs: string[] = [];
    const specificActions: string[] = [];
    const actionToToolkit = new Map<string, string>();
    const toolkitsWithAllActions: string[] = [];
    const displayNameMap = new Map<string, string>();
    const pinnedParamsMap = new Map<string, Record<string, unknown>>();
    const defaultParamsMap = new Map<string, Record<string, unknown>>();

    for (const record of records) {
      const cfg = record.config as unknown as ComposioToolConfig;
      if (!cfg.toolkit) continue;

      if (!toolkitSlugs.includes(cfg.toolkit)) {
        toolkitSlugs.push(cfg.toolkit);
      }
      displayNameMap.set(cfg.toolkit, cfg.toolkit_name ?? cfg.toolkit);

      if (cfg.enabled_actions && cfg.enabled_actions.length > 0) {
        for (const action of cfg.enabled_actions) {
          specificActions.push(action);
          actionToToolkit.set(action, cfg.toolkit);
        }
      } else {
        if (!toolkitsWithAllActions.includes(cfg.toolkit)) {
          toolkitsWithAllActions.push(cfg.toolkit);
        }
      }

      // Collect pinned and default params from action_configs
      if (cfg.action_configs) {
        for (const [actionSlug, actionCfg] of Object.entries(cfg.action_configs)) {
          if (!actionCfg || typeof actionCfg !== "object") continue;
          const typed = actionCfg as ActionConfig;

          if (typed.pinned_params && Object.keys(typed.pinned_params).length > 0) {
            pinnedParamsMap.set(actionSlug, typed.pinned_params);
          }
          if (typed.default_params && Object.keys(typed.default_params).length > 0) {
            defaultParamsMap.set(actionSlug, typed.default_params);
          }
        }
      }
    }

    // Validate connections are still active
    const { active: activeToolkits, failures: connFailures } =
      await getActiveToolkits(composio, userId, toolkitSlugs, displayNameMap);
    failures.push(...connFailures);

    // Filter to only active toolkits — uses exact mapping built during collection
    const validSpecificActions = specificActions.filter((action) => {
      const toolkit = actionToToolkit.get(action);
      return toolkit ? activeToolkits.has(toolkit) : false;
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

    // Build schema modifier and tool wrapper with pinned + default params
    const modifySchema = makeSchemaModifier(pinnedParamsMap, defaultParamsMap);
    const wrapTool = makeToolWrapper(pinnedParamsMap, defaultParamsMap);
    const options = { modifySchema };

    // Fetch tools — SDK requires either `tools` or `toolkits`, not both.
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
      // Fetch all actions (not just important) so the agent has full access.
      // Users who want a subset should select specific actions in the tool setup.
      fetchPromises.push(
        composio.tools
          .get(
            userId,
            { toolkits: validToolkitsForAll, limit: 50 },
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
        tools[key] =
          value && typeof value === "object"
            ? wrapTool(key, value as Record<string, unknown>)
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

/**
 * Mask sensitive fields in tool configs before returning to the client.
 * Treats api_key, access_token, secret fields as write-only:
 *   raw value → "••••" + last 4 chars  (or "configured" if < 4 chars)
 *
 * Non-sensitive fields (urls, booleans, names) are returned as-is.
 *
 * Also masks sensitive values inside nested Composio configs
 * (action_configs → pinned_params / default_params) where users may
 * store API keys or tokens as hardcoded parameter values.
 */

const SENSITIVE_KEYS = new Set([
  "api_key",
  "access_token",
  "secret",
  "token",
  "api_key_value",
  "password",
]);

/** Patterns that indicate a value is likely a secret even in nested contexts. */
const SENSITIVE_PARAM_PATTERNS = [
  /api[_-]?key/i,
  /access[_-]?token/i,
  /secret/i,
  /password/i,
  /bearer/i,
  /auth[_-]?token/i,
  /private[_-]?key/i,
];

function maskValue(value: string): string {
  return value.length > 4 ? "••••" + value.slice(-4) : "configured";
}

function isSensitiveKey(key: string): boolean {
  if (SENSITIVE_KEYS.has(key)) return true;
  return SENSITIVE_PARAM_PATTERNS.some((p) => p.test(key));
}

/**
 * Deep-mask a params object (pinned_params / default_params).
 * Masks values whose keys look like secrets.
 */
function maskParams(params: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (isSensitiveKey(key) && typeof value === "string" && value.length > 0) {
      masked[key] = maskValue(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export function maskConfig(config: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    // Top-level sensitive fields (webhook api_key, MCP access_token, etc.)
    if (SENSITIVE_KEYS.has(key) && typeof value === "string" && value.length > 0) {
      masked[key] = maskValue(value);
    }
    // Nested HTTP auth_config — mask token, api_key_value, password
    else if (key === "auth_config" && value && typeof value === "object") {
      masked[key] = maskParams(value as Record<string, unknown>);
    }
    // Nested Composio action_configs — mask sensitive pinned/default params
    else if (key === "action_configs" && value && typeof value === "object") {
      const maskedConfigs: Record<string, unknown> = {};
      for (const [actionSlug, actionCfg] of Object.entries(
        value as Record<string, unknown>
      )) {
        if (!actionCfg || typeof actionCfg !== "object") {
          maskedConfigs[actionSlug] = actionCfg;
          continue;
        }
        const cfg = actionCfg as Record<string, unknown>;
        maskedConfigs[actionSlug] = {
          ...cfg,
          ...(cfg.pinned_params && typeof cfg.pinned_params === "object"
            ? { pinned_params: maskParams(cfg.pinned_params as Record<string, unknown>) }
            : {}),
          ...(cfg.default_params && typeof cfg.default_params === "object"
            ? { default_params: maskParams(cfg.default_params as Record<string, unknown>) }
            : {}),
        };
      }
      masked[key] = maskedConfigs;
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

/**
 * Merge an incoming config update with the stored config.
 * Incoming fields that are a masked value ("••••xxxx" or "configured") are
 * treated as "unchanged" — we keep the stored value instead.
 *
 * Also handles nested Composio action_configs: if a pinned/default param
 * value looks masked, the stored value is preserved.
 */
export function mergeConfig(
  stored: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...stored };
  for (const [key, value] of Object.entries(incoming)) {
    if (
      SENSITIVE_KEYS.has(key) &&
      typeof value === "string" &&
      (value.startsWith("••••") || value === "configured")
    ) {
      // Client sent back the masked value — keep stored value unchanged
      continue;
    }

    // Deep-merge auth_config preserving masked values (HTTP tools)
    if (key === "auth_config" && value && typeof value === "object") {
      merged[key] = mergeParams(
        (stored.auth_config ?? {}) as Record<string, unknown>,
        value as Record<string, unknown>
      );
      continue;
    }

    // Deep-merge action_configs preserving masked param values
    if (key === "action_configs" && value && typeof value === "object") {
      const storedConfigs = (stored.action_configs ?? {}) as Record<string, unknown>;
      const incomingConfigs = value as Record<string, unknown>;
      const mergedConfigs: Record<string, unknown> = { ...storedConfigs };

      for (const [actionSlug, actionCfg] of Object.entries(incomingConfigs)) {
        if (!actionCfg || typeof actionCfg !== "object") {
          mergedConfigs[actionSlug] = actionCfg;
          continue;
        }
        const inCfg = actionCfg as Record<string, unknown>;
        const storedCfg = (storedConfigs[actionSlug] ?? {}) as Record<string, unknown>;

        mergedConfigs[actionSlug] = {
          ...inCfg,
          ...(inCfg.pinned_params && typeof inCfg.pinned_params === "object"
            ? {
                pinned_params: mergeParams(
                  (storedCfg.pinned_params ?? {}) as Record<string, unknown>,
                  inCfg.pinned_params as Record<string, unknown>
                ),
              }
            : {}),
          ...(inCfg.default_params && typeof inCfg.default_params === "object"
            ? {
                default_params: mergeParams(
                  (storedCfg.default_params ?? {}) as Record<string, unknown>,
                  inCfg.default_params as Record<string, unknown>
                ),
              }
            : {}),
        };
      }
      merged[key] = mergedConfigs;
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

/** Merge param values, preserving stored values for masked entries. */
function mergeParams(
  stored: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...stored };
  for (const [key, value] of Object.entries(incoming)) {
    if (
      typeof value === "string" &&
      (value.startsWith("••••") || value === "configured")
    ) {
      // Masked — keep stored value
      continue;
    }
    merged[key] = value;
  }
  return merged;
}

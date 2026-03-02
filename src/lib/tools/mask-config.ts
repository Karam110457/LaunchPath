/**
 * Mask sensitive fields in tool configs before returning to the client.
 * Treats api_key, access_token, secret fields as write-only:
 *   raw value → "••••" + last 4 chars  (or "configured" if < 4 chars)
 *
 * Non-sensitive fields (urls, booleans, names) are returned as-is.
 */

const SENSITIVE_KEYS = new Set(["api_key", "access_token", "secret"]);

export function maskConfig(config: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (SENSITIVE_KEYS.has(key) && typeof value === "string" && value.length > 0) {
      masked[key] = value.length > 4 ? "••••" + value.slice(-4) : "configured";
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
    merged[key] = value;
  }
  return merged;
}

/**
 * Shared SSRF (Server-Side Request Forgery) protection.
 *
 * Blocks requests to internal/private network addresses.
 * Used by webhook, HTTP, MCP, and test endpoints.
 */

const BLOCKED_URL_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/0\.0\.0\.0/,
  /^https?:\/\/\[::1\]/,
  /^https?:\/\/169\.254\./, // AWS/cloud metadata endpoint
];

/**
 * Check if a URL targets an internal/private network address.
 */
export function isBlockedUrl(url: string): boolean {
  return BLOCKED_URL_PATTERNS.some((p) => p.test(url));
}

/**
 * Validate that a URL is well-formed and not targeting internal networks.
 * Returns `{ valid: true }` or `{ valid: false, message: "..." }`.
 */
export function validatePublicUrl(url: string): { valid: boolean; message?: string } {
  try {
    new URL(url);
  } catch {
    return { valid: false, message: "URL doesn't look valid. Make sure it starts with https://." };
  }

  if (isBlockedUrl(url)) {
    return { valid: false, message: "Requests to internal network addresses are not allowed." };
  }

  return { valid: true };
}

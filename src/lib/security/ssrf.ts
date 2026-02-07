/**
 * SSRF-safe URL validation for fetches or redirects. Block private IPs and internal hosts.
 */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "169.254.169.254",
]);

const BLOCKED_PREFIXES = ["10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168."];

function isPrivateIp(host: string): boolean {
  if (BLOCKED_HOSTS.has(host.toLowerCase())) return true;
  for (const p of BLOCKED_PREFIXES) {
    if (host.startsWith(p)) return true;
  }
  return false;
}

export type SsrfValidationResult = { ok: true; url: URL } | { ok: false; reason: string };

/**
 * Validate URL for safe outbound fetch. Only allow http/https; reject private IPs and internal hosts.
 */
export function validateUrlForFetch(input: string): SsrfValidationResult {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Only HTTP(S) allowed" };
  }

  const host = url.hostname;
  if (BLOCKED_HOSTS.has(host.toLowerCase())) {
    return { ok: false, reason: "URL not allowed" };
  }
  if (isPrivateIp(host)) {
    return { ok: false, reason: "URL not allowed" };
  }

  return { ok: true, url };
}

/**
 * SSRF-safe URL validation for fetches or redirects.
 * Used when LaunchPath fetches external URLs (e.g. competitor analysis, link previews).
 *
 * Strategy: parse hostname properly, check against known private ranges
 * using numeric comparison (not string prefix), block internal hosts.
 */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
  "169.254.169.254", // AWS/GCP metadata
  "metadata.google.internal",
  "100.100.100.200", // Alibaba metadata
]);

/** Parse IPv4 string into a 32-bit number. Returns null if not a valid IPv4. */
function parseIpv4(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255 || String(num) !== part) return null;
    result = (result << 8) | num;
  }
  return result >>> 0; // unsigned
}

/** Check if numeric IP falls in a CIDR range. */
function inRange(ip: number, base: number, mask: number): boolean {
  return (ip & mask) === (base & mask);
}

/** All RFC 1918, RFC 6598, loopback, link-local, and cloud metadata ranges. */
const PRIVATE_RANGES: Array<{ base: number; mask: number }> = [
  { base: 0x0a000000, mask: 0xff000000 }, // 10.0.0.0/8
  { base: 0xac100000, mask: 0xfff00000 }, // 172.16.0.0/12
  { base: 0xc0a80000, mask: 0xffff0000 }, // 192.168.0.0/16
  { base: 0x7f000000, mask: 0xff000000 }, // 127.0.0.0/8 (loopback)
  { base: 0xa9fe0000, mask: 0xffff0000 }, // 169.254.0.0/16 (link-local)
  { base: 0x64400000, mask: 0xffc00000 }, // 100.64.0.0/10 (Carrier-Grade NAT)
  { base: 0x00000000, mask: 0xffffffff }, // 0.0.0.0/32
];

function isPrivateIpv4(host: string): boolean {
  const ip = parseIpv4(host);
  if (ip === null) return false;
  for (const range of PRIVATE_RANGES) {
    if (inRange(ip, range.base, range.mask)) return true;
  }
  return false;
}

/** Basic IPv6 private check (loopback, link-local, unique local). */
function isPrivateIpv6(host: string): boolean {
  const cleaned = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (cleaned === "::1" || cleaned === "::") return true;
  if (cleaned.startsWith("fe80:")) return true; // link-local
  if (cleaned.startsWith("fc") || cleaned.startsWith("fd")) return true; // unique local
  // IPv4-mapped IPv6 (::ffff:10.0.0.1)
  const v4mapped = cleaned.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4mapped) return isPrivateIpv4(v4mapped[1]);
  return false;
}

function isPrivateHost(host: string): boolean {
  const lower = host.toLowerCase();
  if (BLOCKED_HOSTS.has(lower)) return true;
  if (isPrivateIpv4(lower)) return true;
  if (isPrivateIpv6(lower)) return true;
  // Block any hostname ending in internal TLDs
  if (lower.endsWith(".internal") || lower.endsWith(".local")) return true;
  return false;
}

export type SsrfValidationResult = { ok: true; url: URL } | { ok: false; reason: string };

/**
 * Validate URL for safe outbound fetch.
 * Only allow http/https; reject private IPs, internal hosts, non-standard ports.
 */
export function validateUrlForFetch(
  input: string,
  options?: { allowedDomains?: Set<string> }
): SsrfValidationResult {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Only HTTP(S) allowed" };
  }

  // Block credentials in URL
  if (url.username || url.password) {
    return { ok: false, reason: "Credentials in URL not allowed" };
  }

  const host = url.hostname;

  // If allowlist is provided, only allow those domains
  if (options?.allowedDomains) {
    const lower = host.toLowerCase();
    if (!options.allowedDomains.has(lower)) {
      return { ok: false, reason: "Domain not in allowlist" };
    }
    return { ok: true, url };
  }

  // Block private/internal hosts
  if (isPrivateHost(host)) {
    return { ok: false, reason: "URL not allowed" };
  }

  return { ok: true, url };
}

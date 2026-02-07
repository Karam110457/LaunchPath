/**
 * In-memory rate limiter for API routes. Suitable for single-instance or low-traffic.
 * For production at scale use Vercel KV / Upstash Redis or Vercel's rate limit feature.
 * This provides a fallback and consistent API for per-route limits.
 */

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function getKey(identifier: string, route: string): string {
  return `rl:${route}:${identifier}`;
}

function cleanup() {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) store.delete(key);
  }
}

let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function scheduleCleanup() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS);
  }
}

export type RateLimitResult =
  | { success: true; remaining: number; resetAt: number }
  | { success: false; retryAfter: number };

/**
 * Check rate limit for identifier (e.g. IP or user id). Returns success and remaining count.
 */
export function rateLimit(
  identifier: string,
  route: string,
  maxRequests: number
): RateLimitResult {
  scheduleCleanup();
  const key = getKey(identifier, route);
  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, entry);
    return { success: true, remaining: maxRequests - 1, resetAt: entry.resetAt };
  }

  if (now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, entry);
    return { success: true, remaining: maxRequests - 1, resetAt: entry.resetAt };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return {
      success: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Get client identifier from request (IP or forwarded). */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

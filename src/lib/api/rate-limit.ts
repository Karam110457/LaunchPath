/**
 * Rate limiter with two layers:
 *
 * 1. In-memory fast path — catches most repeated calls within a single
 *    serverless instance. Not authoritative (instances don't share state).
 *
 * 2. DB-backed authoritative check via Supabase RPC — shared across all
 *    instances. Used for machine-to-machine APIs (e.g., ingest) where
 *    accurate enforcement matters.
 *
 * For user-facing routes the in-memory layer is usually sufficient since
 * Vercel tends to route the same client to the same instance.
 */

import { createServiceClient } from "@/lib/supabase/service";

// ── In-memory layer (fast path, single-instance only) ─────────────────

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

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
 * In-memory rate limit check (single-instance, best-effort).
 * Use `rateLimitDb()` when cross-instance accuracy is required.
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

// ── DB-backed layer (cross-instance, authoritative) ───────────────────

/**
 * DB-backed rate limit using atomic INSERT ON CONFLICT in Supabase.
 * Falls back to in-memory if DB call fails (network issue, cold start).
 */
export async function rateLimitDb(
  identifier: string,
  route: string,
  maxRequests: number,
  windowSeconds = 60
): Promise<RateLimitResult> {
  // Fast in-memory pre-check (avoids DB round-trip when clearly within limit)
  const memResult = rateLimit(identifier, route, maxRequests);
  if (!memResult.success) return memResult;

  try {
    const supabase = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("check_rate_limit", {
      p_key: `${route}:${identifier}`,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      // DB unavailable — fall back to in-memory result
      return memResult;
    }

    const result = data as { allowed: boolean; current_count: number; reset_at: string } | null;
    if (!result) return memResult;

    if (!result.allowed) {
      const resetAt = new Date(result.reset_at).getTime();
      return {
        success: false,
        retryAfter: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
      };
    }

    return {
      success: true,
      remaining: maxRequests - result.current_count,
      resetAt: new Date(result.reset_at).getTime(),
    };
  } catch {
    // On any failure, fall back to in-memory
    return memResult;
  }
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

/**
 * Rate-limit-aware retry wrapper for Anthropic API calls.
 *
 * The Vercel AI SDK's built-in retry uses short exponential backoff which
 * isn't enough for per-minute rate limits (30k input tokens/min on Tier 1).
 * This wrapper catches rate limit errors and waits long enough for the
 * window to reset before retrying.
 */

export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 4,
  baseDelayMs = 20_000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit =
        msg.includes("rate_limit") ||
        msg.includes("429") ||
        msg.includes("rate limit");
      if (!isRateLimit) throw err;
      // Exponential backoff: 20s → 40s → 60s
      const delay = baseDelayMs * attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("withRateLimitRetry: unreachable");
}

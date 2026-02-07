/**
 * Next.js instrumentation: runs once when the Node server starts.
 * We validate required env here so the app fails fast instead of at first request.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateRequiredEnv } = await import("./src/lib/env");
    try {
      validateRequiredEnv();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[LaunchPath] Startup env validation failed:", message);
      throw err;
    }
  }
}

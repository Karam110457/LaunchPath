/**
 * CSRF strategy for state-changing operations from the same origin.
 * - SameSite cookie (Supabase Auth already uses this) mitigates many CSRF cases.
 * - For API routes that accept form POST or JSON from same-origin pages, we recommend:
 *   1. Using SameSite=Strict or Lax cookies (default for Supabase).
 *   2. For sensitive actions (e.g. delete account, change email), require a double-submit
 *      or custom header (e.g. X-Requested-With: XMLHttpRequest) and validate origin/referer.
 * This module provides a simple origin/referer check for API routes.
 */

/**
 * Validate that request origin or referer matches the app origin.
 * Use in API route handlers for state-changing methods (POST, PUT, PATCH, DELETE).
 * In production, set NEXT_PUBLIC_APP_ORIGIN or derive from request.
 */
export function validateOrigin(request: Request, allowedOrigin?: string): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Same-origin requests from browser usually send origin (for fetch) or referer
  const appOrigin = allowedOrigin ?? process.env.NEXT_PUBLIC_APP_ORIGIN;
  if (appOrigin) {
    if (origin && origin === appOrigin) return true;
    if (referer && referer.startsWith(appOrigin)) return true;
  }

  // Server-side or server-to-server may have no origin/referer
  if (!origin && !referer) {
    return true; // Allow; combine with auth so only authenticated server calls pass
  }

  if (origin && process.env.NODE_ENV === "development") {
    if (origin === "http://localhost:3000" || origin.startsWith("http://127.0.0.1")) {
      return true;
    }
  }

  return false;
}

/**
 * CSRF protection for LaunchPath API routes.
 *
 * Strategy (layered):
 * 1. SameSite=Lax cookies (Supabase Auth default) block cross-origin POST with cookies.
 * 2. Origin/Referer validation on state-changing requests (POST/PUT/PATCH/DELETE).
 * 3. For highest-risk actions (delete account, change email), also require a custom header.
 *
 * IMPORTANT: Never allow requests with a *wrong* origin. Requests with *no* origin
 * (e.g. same-origin navigation, curl) are allowed only when combined with auth.
 */

/**
 * Validate that request origin matches the app. Returns one of:
 * - "valid": origin matches app
 * - "no-origin": no origin/referer sent (allow with auth)
 * - "invalid": origin present but doesn't match (BLOCK)
 */
export type OriginCheckResult = "valid" | "no-origin" | "invalid";

export function checkOrigin(request: Request, allowedOrigin?: string): OriginCheckResult {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const appOrigin = allowedOrigin ?? process.env.NEXT_PUBLIC_APP_ORIGIN;

  // If neither origin nor referer is present, it could be a server-to-server call
  // or same-origin navigation. Return "no-origin" so caller can decide (require auth).
  if (!origin && !referer) {
    return "no-origin";
  }

  if (appOrigin) {
    if (origin && origin === appOrigin) return "valid";
    if (!origin && referer && referer.startsWith(appOrigin)) return "valid";
  }

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    const devOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
    if (origin && devOrigins.includes(origin)) return "valid";
    if (!origin && referer && devOrigins.some((d) => referer.startsWith(d))) return "valid";
  }

  // Origin/referer was sent but doesn't match → reject
  return "invalid";
}

/**
 * Full CSRF guard for API routes. Use on POST/PUT/PATCH/DELETE handlers.
 * Returns true if the request is safe to process.
 *
 * - If origin is "invalid" → always reject (cross-site request).
 * - If origin is "no-origin" → allow only if user is authenticated (pass isAuthenticated).
 * - If origin is "valid" → allow.
 */
export function csrfGuard(
  request: Request,
  isAuthenticated: boolean,
  allowedOrigin?: string
): { allowed: boolean; reason?: string } {
  const result = checkOrigin(request, allowedOrigin);

  if (result === "invalid") {
    return { allowed: false, reason: "Origin mismatch" };
  }

  if (result === "no-origin" && !isAuthenticated) {
    return { allowed: false, reason: "Unauthenticated request without origin" };
  }

  return { allowed: true };
}

/**
 * For highest-risk actions, require a custom header in addition to origin check.
 * Client must send: X-LaunchPath-Action: <action>
 */
export function requireActionHeader(request: Request, expectedAction: string): boolean {
  return request.headers.get("X-LaunchPath-Action") === expectedAction;
}

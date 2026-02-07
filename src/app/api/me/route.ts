import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsonErrorResponse } from "@/lib/api/validate";
import { getClientIdentifier, rateLimit } from "@/lib/api/rate-limit";
import { logger } from "@/lib/security/logger";

/** Allowed methods for this route. */
const ALLOWED_METHODS = new Set(["GET"]);

/**
 * GET /api/me — returns current user (authenticated). Enforces auth and rate limit.
 * Pattern: use requireAuth equivalent (getUser) and return 401 if missing.
 */
export async function GET(request: Request) {
  if (!ALLOWED_METHODS.has(request.method)) {
    return jsonErrorResponse("Method not allowed", 405);
  }

  const id = getClientIdentifier(request);
  const rl = rateLimit(id, "api/me", 60);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    logger.warn("Auth error in /api/me", { error: error.message });
    return jsonErrorResponse("Unauthorized", 401);
  }
  if (!user) {
    return jsonErrorResponse("Unauthorized", 401);
  }

  return NextResponse.json({
    id: user.id,
    email: user.email ?? undefined,
    role: user.app_metadata?.role ?? "user",
  });
}

import { z, type ZodSchema } from "zod";
import { NextResponse } from "next/server";

/**
 * Validate request body or query with Zod. Returns 400 with safe error message on failure.
 * Never expose internal details or stack traces to the client.
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: NextResponse | null }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      data: null as unknown as T,
      error: jsonErrorResponse("Invalid JSON body", 400),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first ? `${first.path.join(".")}: ${first.message}` : "Validation failed";
    return {
      data: null as unknown as T,
      error: jsonErrorResponse(message, 400),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Validate query params from request.url. Returns 400 on failure.
 */
export function validateQuery<T>(
  request: Request,
  schema: ZodSchema<T>
): { data: T; error: NextResponse | null } {
  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first ? `${first.path.join(".")}: ${first.message}` : "Invalid query";
    return {
      data: null as unknown as T,
      error: jsonErrorResponse(message, 400),
    };
  }
  return { data: parsed.data, error: null };
}

/** Consistent JSON error response; no internal details. */
export function jsonErrorResponse(
  message: string,
  status: number,
  code?: string
): NextResponse {
  return NextResponse.json(
    { error: message, ...(code && { code }) },
    { status }
  );
}

/** Schema for common pagination. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

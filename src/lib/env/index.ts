/**
 * Central env access with Zod validation.
 * - getServerEnv(): server-only, use in Server Components / API / middleware.
 * - getClientEnv(): validated client-safe env; use in Client Components.
 * - validateRequiredEnv(): call at startup (instrumentation) to fail fast if critical vars missing.
 */

import {
  clientEnvSchema,
  requiredEnvSchema,
  serverEnvSchema,
  type ClientEnv,
  type RequiredEnv,
  type ServerEnv,
} from "./schema";

function getRawServerEnv(): Record<string, string | undefined> {
  return {
    NODE_ENV: process.env.NODE_ENV,
    // Add other server-only vars here
  };
}

function getRawClientEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/** Use on server only. Validates and returns server env. */
export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(getRawServerEnv());
  if (!parsed.success) {
    throw new Error(`Invalid server env: ${parsed.error.flatten().fieldErrors}`);
  }
  return parsed.data;
}

/** Use in client or server. Returns validated client-safe env (no secrets). */
export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse(getRawClientEnv());
  if (!parsed.success) {
    throw new Error(
      `Invalid client env: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`
    );
  }
  return parsed.data;
}

/**
 * Call at app startup to prevent running with missing critical env.
 * Used in instrumentation.ts (Node) and optionally in root layout for client.
 */
export function validateRequiredEnv(): RequiredEnv {
  const raw = { ...getRawServerEnv(), ...getRawClientEnv() };
  const parsed = requiredEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((e) => `${String(e.path.join("."))}: ${e.message}`)
      .join("; ");
    throw new Error(`Missing or invalid required env: ${msg}`);
  }
  return parsed.data;
}

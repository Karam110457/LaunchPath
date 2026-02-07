import { z } from "zod";

/**
 * Server-only env: never expose these to the client.
 * Only vars prefixed with NEXT_PUBLIC_ are sent to the browser.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Add server-only secrets here when needed (e.g. CRON_SECRET, WEBHOOK_SECRET)
  // SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Client-exposed env: validated at build/runtime for client bundles.
 * Only use for non-secret configuration (URLs, feature flags).
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/** All env required for the app to run (server + client public vars). */
export const requiredEnvSchema = clientEnvSchema.merge(
  serverEnvSchema.pick({ NODE_ENV: true })
);

export type RequiredEnv = z.infer<typeof requiredEnvSchema>;

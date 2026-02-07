import { z } from "zod";

/**
 * Server-only env: never expose these to the client.
 * These are secrets that must ONLY be available in Server Components, API routes, and middleware.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // --- AI / LLM ---
  // The API key for the AI provider (OpenAI, Anthropic, etc.) powering LaunchPath generations.
  // NEVER expose to client. Only used in server-side API routes.
  OPENAI_API_KEY: z.string().min(1).optional(),

  // --- Payments ---
  // Stripe secret key for credit purchases, subscriptions, webhooks.
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),

  // --- Supabase admin (use sparingly; only for migrations/admin tools) ---
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // --- Cron / internal ---
  CRON_SECRET: z.string().min(16).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Client-exposed env: validated at build/runtime for client bundles.
 * Only use for non-secret configuration. All must start with NEXT_PUBLIC_.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_ORIGIN: z.string().url().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * All env required for the app to run (server + client public vars).
 * Used at startup in instrumentation.ts to fail fast.
 * Only include vars that are REQUIRED (not optional features).
 */
export const requiredEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type RequiredEnv = z.infer<typeof requiredEnvSchema>;

import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getClientEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service role Supabase client — bypasses all RLS policies.
 *
 * Use ONLY in server-side code that needs to read/write data on behalf
 * of unauthenticated callers (e.g. public channel chat endpoints).
 *
 * NEVER import this in client components or expose the key.
 */
export function createServiceClient() {
  if (serviceClient) return serviceClient;

  const { NEXT_PUBLIC_SUPABASE_URL } = getClientEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for the service role client"
    );
  }

  serviceClient = createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serviceClient;
}

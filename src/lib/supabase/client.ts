import { createBrowserClient } from "@supabase/ssr";
import { getClientEnv } from "@/lib/env";

/** Browser Supabase client. Uses validated client env (no server secrets). */
export function createClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getClientEnv();
  return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

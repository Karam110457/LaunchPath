import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Use in Server Components or Server Actions to require an authenticated user.
 * Redirects to /login if not signed in. Returns the Supabase user.
 * Wrapped with React cache() so duplicate calls within the same request are deduped.
 */
export const requireAuth = cache(async (): Promise<User> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?redirectTo=" + encodeURIComponent("/dashboard"));
  }

  return user;
});

/**
 * Optional: get user without redirect. Use when you need to branch on auth state.
 */
export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Role names; extend when you add app_metadata.role in Supabase. */
export type AppRole = "user" | "admin" | "client";

/**
 * Use in Server Components or Server Actions to require a specific role.
 * Redirects to /login if not signed in, or /dashboard (or 403) if wrong role.
 */
export async function requireRole(allowedRoles: AppRole[]): Promise<User> {
  const user = await requireAuth();
  const role = (user.app_metadata?.role as AppRole) ?? "user";

  if (!allowedRoles.includes(role)) {
    redirect("/dashboard?error=forbidden");
  }

  return user;
}

/**
 * Check if current user has admin role. Use after requireAuth() when you need to branch.
 */
export function hasRole(user: User, role: AppRole): boolean {
  const r = (user.app_metadata?.role as AppRole) ?? "user";
  return r === role;
}

/**
 * Use in Portal Server Components to require a client member login.
 * Also supports agency owner impersonation via the `portal-impersonate` cookie.
 * Redirects to /login if not signed in, or /login?error=no_access if not a client member.
 */
export async function requireClientAuth(): Promise<{
  user: User;
  clientId: string;
  role: "admin" | "viewer";
  impersonating?: boolean;
}> {
  const { cookies } = await import("next/headers");
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Check for agency owner impersonation
  const cookieStore = await cookies();
  const impersonateClientId = cookieStore.get("portal-impersonate")?.value;

  if (impersonateClientId) {
    // Verify the user actually owns this client
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", impersonateClientId)
      .eq("user_id", user.id)
      .single();

    if (client) {
      return {
        user,
        clientId: impersonateClientId,
        role: "admin",
        impersonating: true,
      };
    }
    // If verification fails, fall through to normal client member check
  }

  // Get client membership
  const { data: membership } = await supabase
    .from("client_members")
    .select("client_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    redirect("/login?error=no_access");
  }

  return {
    user,
    clientId: membership.client_id,
    role: membership.role as "admin" | "viewer",
  };
}

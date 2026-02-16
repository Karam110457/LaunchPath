import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getClientEnv } from "@/lib/env";
import { applySecurityHeaders } from "@/lib/security/headers";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Apply security headers on every request
  applySecurityHeaders(supabaseResponse);

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getClientEnv();
  const supabase = createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const pathname = request.nextUrl.pathname;

    const isOnboardingRoute = pathname.startsWith("/onboarding");
    const isStartRoute = pathname.startsWith("/start");
    const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
    const isApiRoute = pathname.startsWith("/api");
    const isDemoRoute = pathname.startsWith("/demo");
    const isPublicRoute =
      pathname === "/" ||
      pathname.startsWith("/terms") ||
      pathname.startsWith("/privacy");

    const onboardingCompleted =
      user.user_metadata?.onboarding_completed === true;

    // Force onboarding before any protected route
    if (
      !onboardingCompleted &&
      !isOnboardingRoute &&
      !isAuthRoute &&
      !isApiRoute &&
      !isPublicRoute &&
      !isDemoRoute
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Completed users visiting /onboarding go to dashboard
    if (onboardingCompleted && isOnboardingRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Users who haven't onboarded can't access /start yet
    if (!onboardingCompleted && isStartRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

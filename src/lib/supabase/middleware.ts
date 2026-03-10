import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getClientEnv, isBusinessFlowEnabled } from "@/lib/env";
import { applySecurityHeaders } from "@/lib/security/headers";

export async function updateSession(request: NextRequest) {
  // Skip session handling for public endpoints (token auth / no cookies)
  if (
    request.nextUrl.pathname.startsWith("/api/channels/") ||
    request.nextUrl.pathname.startsWith("/api/widget/")
  ) {
    const response = NextResponse.next({ request });
    applySecurityHeaders(response, request.nextUrl.pathname);
    return response;
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Apply security headers on every request
  applySecurityHeaders(supabaseResponse, request.nextUrl.pathname);

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
    const businessFlowEnabled = isBusinessFlowEnabled();

    const isOnboardingRoute = pathname.startsWith("/onboarding");
    const isStartRoute = pathname.startsWith("/start");
    const isSystemsRoute = pathname.startsWith("/dashboard/systems");
    const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
    const isApiRoute = pathname.startsWith("/api");
    const isDemoRoute = pathname.startsWith("/demo");
    const isPortalRoute = pathname.startsWith("/portal");
    const isDashboardRoute = pathname.startsWith("/dashboard");
    const isPublicRoute =
      pathname === "/" ||
      pathname.startsWith("/terms") ||
      pathname.startsWith("/privacy");

    const onboardingCompleted =
      user.user_metadata?.onboarding_completed === true;
    const isClientRole = user.user_metadata?.role === "client";

    // When business flow is disabled, block business-only routes
    if (!businessFlowEnabled) {
      if (isOnboardingRoute || isStartRoute || isSystemsRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    // Portal preview: agency users can access /portal/preview/[clientId]
    const isPortalPreview = pathname.startsWith("/portal/preview/");

    // Client-role routing: redirect to/from portal
    if (isClientRole && isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }
    if (!isClientRole && isPortalRoute && !isPortalPreview) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Client users skip onboarding — they go straight to portal
    if (isClientRole) {
      if (isOnboardingRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/portal";
        return NextResponse.redirect(url);
      }
      // Let portal routes through without onboarding check
      if (isPortalRoute) {
        return supabaseResponse;
      }
    }

    // Force onboarding before any protected route (agency users)
    // Skip when business flow is disabled — onboarding only serves that flow
    if (
      businessFlowEnabled &&
      !onboardingCompleted &&
      !isOnboardingRoute &&
      !isAuthRoute &&
      !isApiRoute &&
      !isPublicRoute &&
      !isDemoRoute &&
      !isPortalRoute
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

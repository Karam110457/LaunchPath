/**
 * Security headers for production.
 * Applied in middleware so we can vary by route and add nonce later if needed.
 * CSP is strict; document any required exceptions in docs/security/security-hardening-report.md
 */

import { type NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy: strict default. Next.js requires 'unsafe-inline' for style
 * in dev; we allow it for 'self' only. For production consider moving to nonce-based styles.
 * - script-src: 'self' only (no eval; add nonce when using inline scripts).
 * - frame-ancestors: 'none' prevents embedding (same as X-Frame-Options DENY).
 */
function getCsp(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel-insights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }
  return directives.join("; ");
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("Content-Security-Policy", getCsp());

  if (isProduction) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

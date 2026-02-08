/**
 * Security headers for production.
 * Applied in middleware so we can vary by route and add nonce later if needed.
 * CSP is strict; document any required exceptions in docs/security/security-hardening-report.md
 */

import { type NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy: strict default.
 * - script-src: 'self' and 'unsafe-inline' are required for Next.js (hydration and chunk
 *   loading use inline scripts). For stricter CSP use the Proxy convention with nonces
 *   (see Next.js CSP docs). In dev, 'unsafe-eval' is needed for some tooling.
 * - style-src: 'unsafe-inline' required for Tailwind/Next.js.
 * - frame-ancestors: 'none' prevents embedding (same as X-Frame-Options DENY).
 */
function getCsp(): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'", // Next.js inline scripts (hydration, chunks)
    ...(isProduction ? [] : ["'unsafe-eval'"]), // Dev tooling
  ].join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
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

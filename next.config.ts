import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure server-only env are never sent to client (only NEXT_PUBLIC_* are exposed)
  env: {},
  // Security: disable x-powered-by to reduce fingerprinting
  poweredByHeader: false,
  // Mastra needs to be bundled server-side only
  serverExternalPackages: ["@mastra/*"],
  async redirects() {
    return [
      { source: "/test-widget", destination: "/test-widget.html", permanent: false },
    ];
  },
};

export default nextConfig;

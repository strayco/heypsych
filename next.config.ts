import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

// Load article redirects from migration
function loadArticleRedirects(): Array<{ source: string; destination: string; permanent: boolean }> {
  const redirectsPath = path.join(process.cwd(), "_redirects/map.json");
  try {
    if (fs.existsSync(redirectsPath)) {
      const redirectMap = JSON.parse(fs.readFileSync(redirectsPath, "utf-8"));
      return Object.entries(redirectMap).map(([source, destination]) => ({
        source,
        destination: destination as string,
        permanent: true,
      }));
    }
  } catch (error) {
    console.warn("Could not load article redirects:", error);
  }
  return [];
}

// Security headers for production deployment
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
  {
    key: "Cross-Origin-Embedder-Policy",
    value: "require-corp",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  // Content Security Policy - Balanced security vs functionality
  // NOTE: 'unsafe-inline' and 'unsafe-eval' reduce security but are required for Next.js
  // TODO: Implement nonce-based CSP for stricter security (see docs/launch-readiness.md)
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      "img-src 'self' data: https:; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "connect-src 'self' https://*.supabase.co https://*.sentry.io; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "upgrade-insecure-requests",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  eslint: {
    // TODO: Fix 280+ warnings and set to false
    // Temporarily true to allow build during audit
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Suppress the "Critical dependency" warning from OpenTelemetry instrumentation
      // These warnings are harmless - they come from OpenTelemetry's dynamic require() calls
      // We filter out unused database integrations at runtime in sentry.server.config.ts
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /@opentelemetry\/instrumentation/,
          message: /Critical dependency: the request of a dependency is an expression/,
        },
      ];
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    const articleRedirects = loadArticleRedirects();
    return [
      ...articleRedirects,
      // Add additional custom redirects here if needed
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

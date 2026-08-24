import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

// Load article redirects from migration
function loadArticleRedirects(): Array<{
  source: string;
  destination: string;
  permanent: boolean;
}> {
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
      "connect-src 'self' https://*.supabase.co; " +
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

  // Mark Node.js built-ins as external for server components
  // This prevents webpack from trying to bundle them
  serverExternalPackages: ['fs', 'path'],

  // NOTE: eslint config moved to eslint.config.js - no longer in Next.js 16 config
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


  async headers() {
    // Only apply strict security headers in production
    // In development, skip HSTS and upgrade-insecure-requests to allow HTTP on local network
    if (process.env.NODE_ENV !== "production") {
      return [];
    }

    return [
      {
        // Apply security headers to all routes
        // Note: OG image CORS headers are handled in middleware.ts
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    const articleRedirects = loadArticleRedirects();
    return [
      ...articleRedirects,
      // SEO: Remove trailing slashes for URL consistency (canonical = no trailing slash)
      {
        source: "/:path+/",
        destination: "/:path+",
        permanent: true, // 301 redirect
      },
      // SEO: Redirect singular /treatment/ to plural /treatments/
      {
        source: "/treatment/:slug",
        destination: "/treatments/:slug",
        permanent: true, // 301 redirect
      },
      // SEO: Redirect retired /conditions/other/* routes to new top-level categories
      {
        source: "/conditions/other/sleep-disorders",
        destination: "/conditions/sleep-disorders",
        permanent: true,
      },
      {
        source: "/conditions/other/dissociative-disorders",
        destination: "/conditions/dissociative-disorders",
        permanent: true,
      },
      {
        source: "/conditions/other/somatic-disorders",
        destination: "/conditions/somatic-health-anxiety",
        permanent: true,
      },
      {
        source: "/conditions/other/sexual-disorders",
        destination: "/conditions/sexual-health",
        permanent: true,
      },
      {
        source: "/conditions/other/gender-disorders",
        destination: "/conditions/sexual-health",
        permanent: true,
      },
      {
        source: "/conditions/other/paraphilic-disorders",
        destination: "/conditions/sexual-health",
        permanent: true,
      },
      {
        source: "/conditions/other",
        destination: "/conditions",
        permanent: true,
      },
      // SEO: Legacy digital tools redirects → new /tools/ directory
      {
        source: "/resources/digital-tools",
        destination: "/tools",
        permanent: true,
      },
      {
        source: "/resources/digital-tools/:slug",
        destination: "/tools/:slug",
        permanent: true,
      },
      // SEO: Domain canonicalization (www → non-www) handled at Vercel DNS level
      // Canonical domain: heypsych.com (non-www)

      // SEO: Legacy clinician hub redirects → V4 category pages
      // Old 6-category system migrated to new 16-category V4 taxonomy
      {
        source: "/tools/for-clinicians/clinical-answers-evidence",
        destination: "/tools/for-clinicians/clinical-decision-support",
        permanent: true,
      },
      {
        source: "/tools/for-clinicians/ai-scribes-documentation",
        destination: "/tools/for-clinicians/ai-scribe-documentation",
        permanent: true,
      },
      {
        source: "/tools/for-clinicians/billing-coding",
        destination: "/tools/for-clinicians/billing-rcm",
        permanent: true,
      },
      {
        source: "/tools/for-clinicians/prescribing-medication-support",
        destination: "/tools/for-clinicians/prescribing-erx",
        permanent: true,
      },
      {
        source: "/tools/for-clinicians/practice-admin-operations",
        destination: "/tools/for-clinicians/ehr-practice-management",
        permanent: true,
      },
      {
        source: "/tools/for-clinicians/patient-engagement-between-visits",
        destination: "/tools/for-clinicians/patient-engagement",
        permanent: true,
      },
      // SEO: Redirect programmatic-style treatment URLs to canonical treatment pages
      {
        source: "/treatments/electroconvulsive-therapy-for-severe-depression",
        destination: "/treatments/electroconvulsive-therapy",
        permanent: true,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

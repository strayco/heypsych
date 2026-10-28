import type { NextConfig } from "next";
import fs from "fs";
import path from "path";
import { buildClinicianRedirects } from "./src/lib/tools/clinician-redirects";
import { buildPatientRedirects } from "./src/lib/tools/patient-redirects";
import { MERGED_TREATMENTS } from "./src/lib/treatments/merged-treatments";

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

/** Content records read at request time by src/lib/data/local-entities.ts */
const CONTENT_RECORD_FILES = [
  "./data/conditions/**/*.json",
  "./data/resources/**/*.json",
  "./data/treatments/**/*.json",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Search reads data/ records at runtime for match-in-context snippets
  // (src/lib/search/record-files.ts); make sure they ship with the function.
  outputFileTracingIncludes: {
    // Pages, hubs, sitemaps and link validation read condition, resource and
    // treatment records from data/ (src/lib/data/local-entities.ts).
    ...Object.fromEntries(
      [
        "/conditions/**",
        "/resources/**",
        "/treatments/**",
        "/api/markdown/**",
        "/sitemap-conditions.xml",
        "/sitemap-resources.xml",
        "/sitemap-assessments.xml",
        "/sitemap-treatments.xml",
      ].map((route) => [route, CONTENT_RECORD_FILES])
    ),
    // Resource pages render on demand and check crosslink targets against
    // these files (src/domains/articles/experience/targets.ts).
    "/resources/[slug]": [
      "./data/conditions/**/*.json",
      "./data/treatments/**/*.json",
      "./data/learn/*.json",
    ],
    "/api/search": [
      "./data/conditions/**/*.json",
      "./data/treatments/**/*.json",
      "./data/resources/**/*.json",
      "./data/learn/**/*.json",
      "./data/tools-v4/products/**/*.json",
    ],
  },

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
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Keep Vercel preview deployments out of search results. This lived in
        // middleware, which forced middleware to run on every page; as a static
        // header rule it costs nothing per request.
        source: "/(.*)",
        has: [{ type: "host", value: "(?<preview>.*)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  async redirects() {
    const articleRedirects = loadArticleRedirects();
    return [
      ...articleRedirects,
      // Pages served from leftover Supabase rows until condition and resource
      // pages moved to reading data/ files (2026-10-28). Each had no file:
      // old slugs of renamed conditions, directory rows built from index.json,
      // knowledge-hub articles replaced by /learn, and removed resources.
      ...([
        ["/conditions/opioid-use-disorder", "/conditions/opioid"],
        ["/conditions/inhalant-use-disorder", "/conditions/inhalant"],
        ["/conditions/phencyclidine-use-disorder", "/conditions/phencyclidine"],
        ["/resources/immediate-crisis-directory", "/resources/support-community/immediate-crisis"],
        ["/resources/treatment-professional-care-directory", "/resources/support-community"],
        ["/resources/index", "/resources"],
        ["/resources/988-suicide-crisis-lifeline", "/resources/988-lifeline"],
        ["/resources/nami-helpline", "/resources/nami"],
        ["/resources/alcoholics-anonymous", "/resources/aa"],
        ["/resources/deepscribe", "/tools/for-clinicians"],
        ["/resources/adhd-medication-shortage", "/learn"],
        ["/resources/adhd-women-thirties", "/learn/adhd-in-adults"],
        ["/resources/ai-therapy-apps", "/learn/ai-therapy-apps"],
        ["/resources/anxiety-vs-stress", "/learn/anxiety-symptoms-or-something-else"],
        ["/resources/bipolar-diagnosis-journey", "/learn/bipolar-vs-depression"],
        ["/resources/building-daily-mental-health-routine", "/learn"],
        ["/resources/cbt-explained", "/learn/cbt-explained"],
        ["/resources/exercise-antidepressant-study", "/learn/exercise-vs-antidepressants"],
        ["/resources/find-adhd-therapist", "/learn/how-to-find-therapist"],
        ["/resources/finding-a-therapist", "/learn/finding-the-right-therapist"],
        ["/resources/glp-1-diabetes-medicine-mental-health-hope", "/learn/glp1-addiction-treatment"],
        ["/resources/insurance-navigation", "/learn"],
        ["/resources/ketamine-therapy-2024", "/learn/ketamine-depression-guide"],
        ["/resources/manage-anxiety-attacks", "/learn/panic-attack-guide"],
        ["/resources/ocd-intrusive-thoughts", "/learn/intrusive-thoughts-guide"],
        ["/resources/panic-attacks-body-mind", "/learn/panic-attack-guide"],
        ["/resources/psychedelics-depression-study", "/learn/psilocybin-depression-research"],
        ["/resources/sleep-mental-health-link", "/learn/sleep-mental-health-connection"],
        ["/resources/ssri-basics", "/learn/ssri-guide"],
        ["/resources/talk-to-doctor-antidepressants", "/learn/tapering-off-antidepressants"],
        ["/resources/therapy-insurance", "/learn"],
        ["/resources/understanding-therapy-types", "/learn"],
      ] as const).map(([source, destination]) => ({ source, destination, permanent: true })),
      // SEO: Remove trailing slashes for URL consistency (canonical = no trailing slash)
      {
        source: "/:path+/",
        destination: "/:path+",
        permanent: true, // 301 redirect
      },
      // Practice Architect 3.0 consolidation.
      // /architect/{build,audit,demo,my-practice,studio} were five partial
      // builders of the same practice. There is now one, at /architect.
      ...[
        "build",
        "audit",
        "demo",
        "my-practice",
        "studio",
      ].map((legacy) => ({
        source: `/architect/${legacy}`,
        destination: "/architect",
        permanent: true, // 301: these URLs are not coming back
      })),
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

      // Clinician Apps & Tools consolidation: retired landers, audience pages,
      // programmatic guides and legacy hub names. See
      // src/lib/tools/clinician-redirects.ts.
      ...buildClinicianRedirects(process.cwd()),
      ...buildPatientRedirects(process.cwd()),
      // Assessments live at /resources/<slug>. Links (and the inline-link
      // parser) used to point at /resources/assessments-screeners/<slug>,
      // which never existed.
      {
        source: "/resources/assessments-screeners/asrs",
        destination: "/resources/asrs-v1-1",
        permanent: true,
      },
      {
        source: "/resources/assessments-screeners/:slug",
        destination: "/resources/:slug",
        permanent: true,
      },
      // Retired clinician products: send old public URLs to the hub, not a 404.
      // A product that returns to the catalogue must be removed from this list
      // (therapyappointment, claim-md, goodtherapy and rula were, 2026-10-23;
      // theraplatform and the five malpractice programs, 2026-10-26).
      ...[
        "ehr-practice-management/owl-practice",
        "ehr-practice-management/cliniko",
        "ehr-practice-management/practice-better",
        "ehr-practice-management/healthie",
        "ehr-practice-management/zanda",
        "ehr-practice-management/tebra",
        "ehr-practice-management/drchrono",
        "ai-scribe-documentation/autonotes",
        "prescribing-erx/drfirst-iprescribe",
        "analytics-reporting/quickbooks",
        "analytics-reporting/wave-accounting",
      ].flatMap((path) => [
        {
          source: `/tools/for-clinicians/${path}`,
          destination: "/tools/for-clinicians",
          permanent: true,
        },
        {
          source: `/tools/for-clinicians/${path}/`,
          destination: "/tools/for-clinicians",
          permanent: true,
        },
      ]),
      // Thin legacy treatment records that duplicate a researched one
      // (src/lib/treatments/merged-treatments.ts).
      ...Object.entries(MERGED_TREATMENTS).map(([from, to]) => ({
        source: `/treatments/${from}`,
        destination: `/treatments/${to}`,
        permanent: true,
      })),
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

/**
 * SERP Domination Strategy
 *
 * The goal: Own multiple positions on the same SERP.
 * When someone searches "best EHR for therapists", HeyPsych appears in
 * positions 1, 3, 5, 7, and maybe the featured snippet AND People Also Ask.
 *
 * How:
 * 1. Create multiple page TYPES targeting the same core intent
 * 2. Each page type satisfies a different micro-intent
 * 3. Internal linking concentrates authority
 * 4. Schema stacking claims rich results
 *
 * Entry Points per Query:
 * - Main guide page (best-for)
 * - Comparison table page
 * - Pricing breakdown page
 * - Interactive tool (matcher/architect)
 * - Individual product pages with the query in content
 * - FAQ/guide answering related questions
 */

import { siteConfig } from "@/lib/config/site";

const SITE_URL = siteConfig.url;

// ============================================================================
// SERP CLUSTER DEFINITIONS
// ============================================================================

export interface SERPCluster {
  /** Primary target keyword */
  primaryKeyword: string;
  /** Search intent category */
  intent: "transactional" | "commercial" | "informational" | "navigational";
  /** Estimated monthly search volume */
  estimatedVolume: number;
  /** All pages that should rank for this query */
  entryPoints: SERPEntryPoint[];
  /** Target SERP features to claim */
  targetFeatures: SERPFeature[];
}

export interface SERPEntryPoint {
  /** Page URL */
  url: string;
  /** Page type */
  type: "guide" | "comparison" | "pricing" | "tool" | "product" | "faq";
  /** Title targeting the keyword */
  title: string;
  /** Which position this should target (1-10) */
  targetPosition: number;
  /** Why this page deserves to rank */
  rankingJustification: string;
}

export type SERPFeature =
  | "featured-snippet"
  | "people-also-ask"
  | "knowledge-panel"
  | "product-carousel"
  | "faq-rich-result"
  | "how-to-rich-result"
  | "review-snippet"
  | "price-snippet"
  | "sitelinks";

// ============================================================================
// HIGH-VALUE SERP CLUSTERS
// ============================================================================

export const SERP_CLUSTERS: SERPCluster[] = [
  // ============================================================================
  // CLUSTER: Best EHR for Therapists
  // ============================================================================
  {
    primaryKeyword: "best ehr for therapists",
    intent: "commercial",
    estimatedVolume: 1900,
    entryPoints: [
      {
        url: `${SITE_URL}/tools/for-clinicians/guides/best-ehr-for-therapists/`,
        type: "guide",
        title: "Best EHR for Therapists (2026) - Top 7 Compared",
        targetPosition: 1,
        rankingJustification: "Comprehensive comparison with scoring methodology and practice-specific recommendations",
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/`,
        type: "comparison",
        title: "Mental Health EHR Software - Compare All Options",
        targetPosition: 3,
        rankingJustification: "Category hub with filterable comparison table",
      },
      {
        url: `${SITE_URL}/tools/pricing/therapy-ehr/`,
        type: "pricing",
        title: "Therapy EHR Pricing Comparison (2026)",
        targetPosition: 5,
        rankingJustification: "Price-focused content for cost-conscious searchers",
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/match/`,
        type: "tool",
        title: "Find Your Perfect EHR - Free Matching Tool",
        targetPosition: 7,
        rankingJustification: "Interactive tool with personalized results",
      },
      {
        url: `${SITE_URL}/architect/`,
        type: "tool",
        title: "Practice Architect - Build Your Software Stack",
        targetPosition: 9,
        rankingJustification: "Broader tool that includes EHR selection",
      },
    ],
    targetFeatures: [
      "featured-snippet",
      "people-also-ask",
      "faq-rich-result",
      "review-snippet",
    ],
  },

  // ============================================================================
  // CLUSTER: SimplePractice vs TherapyNotes
  // ============================================================================
  {
    primaryKeyword: "simplepractice vs therapynotes",
    intent: "commercial",
    estimatedVolume: 880,
    entryPoints: [
      {
        url: `${SITE_URL}/tools/for-clinicians/compare/simplepractice-vs-therapynotes/`,
        type: "comparison",
        title: "SimplePractice vs TherapyNotes (2026) - Detailed Comparison",
        targetPosition: 1,
        rankingJustification: "Dedicated comparison page with verdict",
      },
      {
        url: `${SITE_URL}/tools/compare/?tools=simplepractice,therapynotes`,
        type: "tool",
        title: "Compare SimplePractice & TherapyNotes Side-by-Side",
        targetPosition: 3,
        rankingJustification: "Interactive comparison tool",
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/simplepractice/`,
        type: "product",
        title: "SimplePractice Review & Pricing (2026)",
        targetPosition: 5,
        rankingJustification: "Product page with competitor mentions",
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/therapynotes/`,
        type: "product",
        title: "TherapyNotes Review & Pricing (2026)",
        targetPosition: 7,
        rankingJustification: "Product page with competitor mentions",
      },
    ],
    targetFeatures: [
      "featured-snippet",
      "faq-rich-result",
      "price-snippet",
    ],
  },

  // ============================================================================
  // CLUSTER: Best AI Scribe for Therapists
  // ============================================================================
  {
    primaryKeyword: "best ai scribe for therapists",
    intent: "commercial",
    estimatedVolume: 720,
    entryPoints: [
      {
        url: `${SITE_URL}/tools/for-clinicians/guides/best-ai-scribe-for-therapists/`,
        type: "guide",
        title: "Best AI Scribe for Therapists (2026) - Top 5 Compared",
        targetPosition: 1,
        rankingJustification: "Comprehensive guide with therapy-specific criteria",
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ai-documentation/`,
        type: "comparison",
        title: "AI Scribes for Mental Health - Compare All Options",
        targetPosition: 3,
        rankingJustification: "Category hub with filters",
      },
      {
        url: `${SITE_URL}/tools/pricing/ai-scribe/`,
        type: "pricing",
        title: "AI Scribe Pricing Comparison (2026)",
        targetPosition: 5,
        rankingJustification: "Price comparison for budget-conscious",
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ai-documentation/freed/`,
        type: "product",
        title: "Freed AI Scribe Review (2026) - Best for Therapists?",
        targetPosition: 7,
        rankingJustification: "Top-ranked product page",
      },
    ],
    targetFeatures: [
      "featured-snippet",
      "people-also-ask",
      "faq-rich-result",
    ],
  },

  // ============================================================================
  // CLUSTER: SimplePractice Pricing
  // ============================================================================
  {
    primaryKeyword: "simplepractice pricing",
    intent: "transactional",
    estimatedVolume: 2400,
    entryPoints: [
      {
        url: `${SITE_URL}/tools/for-clinicians/guides/simplepractice-pricing/`,
        type: "pricing",
        title: "SimplePractice Pricing (2026) - Plans, Costs & Hidden Fees",
        targetPosition: 1,
        rankingJustification: "Deep dive on all pricing aspects",
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/simplepractice/`,
        type: "product",
        title: "SimplePractice Review - Features & Pricing",
        targetPosition: 3,
        rankingJustification: "Product page with pricing section",
      },
      {
        url: `${SITE_URL}/tools/pricing/therapy-ehr/`,
        type: "comparison",
        title: "Therapy EHR Pricing Comparison - SimplePractice & More",
        targetPosition: 5,
        rankingJustification: "Comparative context",
      },
    ],
    targetFeatures: [
      "featured-snippet",
      "price-snippet",
      "faq-rich-result",
    ],
  },

  // ============================================================================
  // CLUSTER: HIPAA Compliant EHR
  // ============================================================================
  {
    primaryKeyword: "hipaa compliant ehr",
    intent: "commercial",
    estimatedVolume: 1300,
    entryPoints: [
      {
        url: `${SITE_URL}/tools/for-clinicians/guides/hipaa-compliant-ehr/`,
        type: "guide",
        title: "HIPAA Compliant EHR Software (2026) - Verified Options",
        targetPosition: 1,
        rankingJustification: "Compliance-focused guide with verification",
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/`,
        type: "comparison",
        title: "Mental Health EHR Software - All HIPAA Compliant",
        targetPosition: 3,
        rankingJustification: "Category with compliance filter",
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/guides/best-ehr-for-therapists/`,
        type: "guide",
        title: "Best EHR for Therapists - All HIPAA Compliant",
        targetPosition: 5,
        rankingJustification: "Related guide with compliance focus",
      },
    ],
    targetFeatures: [
      "featured-snippet",
      "people-also-ask",
    ],
  },
];

// ============================================================================
// INTERNAL LINK AUTHORITY NETWORK
// ============================================================================

/**
 * Get internal links that should exist for a given page to maximize authority flow
 */
export function getAuthorityLinks(pageUrl: string): {
  incoming: string[];
  outgoing: string[];
} {
  // Find which cluster(s) this page belongs to
  const relevantClusters = SERP_CLUSTERS.filter((cluster) =>
    cluster.entryPoints.some((ep) => ep.url === pageUrl)
  );

  const incoming: Set<string> = new Set();
  const outgoing: Set<string> = new Set();

  for (const cluster of relevantClusters) {
    for (const entry of cluster.entryPoints) {
      if (entry.url !== pageUrl) {
        // All pages in cluster should link to each other
        incoming.add(entry.url);
        outgoing.add(entry.url);
      }
    }
  }

  return {
    incoming: Array.from(incoming),
    outgoing: Array.from(outgoing),
  };
}

/**
 * Generate contextual anchor text for internal links
 */
export function generateAnchorText(
  targetUrl: string,
  context: "guide" | "comparison" | "pricing" | "navigation"
): string {
  // Find the page in clusters
  for (const cluster of SERP_CLUSTERS) {
    const entry = cluster.entryPoints.find((ep) => ep.url === targetUrl);
    if (entry) {
      switch (context) {
        case "guide":
          return `our ${entry.type === "comparison" ? "detailed comparison" : entry.type}`;
        case "comparison":
          return entry.type === "pricing" ? "view full pricing breakdown" : "compare side-by-side";
        case "pricing":
          return "see current pricing";
        case "navigation":
          return entry.title.split(" - ")[0];
      }
    }
  }
  return "learn more";
}

// ============================================================================
// SERP FEATURE CLAIM STRATEGIES
// ============================================================================

/**
 * Content structure required to claim specific SERP features
 */
export const SERP_FEATURE_REQUIREMENTS: Record<SERPFeature, {
  contentStructure: string[];
  schemaRequired: string[];
  minWordCount: number;
}> = {
  "featured-snippet": {
    contentStructure: [
      "Direct answer in first 40-60 words",
      "Definition or list format",
      "Clear H2 matching query",
      "Concise paragraphs (2-3 sentences)",
    ],
    schemaRequired: ["WebPage", "FAQPage"],
    minWordCount: 300,
  },
  "people-also-ask": {
    contentStructure: [
      "H2/H3 as questions",
      "Direct answers after each question heading",
      "5-8 related questions covered",
      "Answers 40-60 words each",
    ],
    schemaRequired: ["FAQPage"],
    minWordCount: 500,
  },
  "knowledge-panel": {
    contentStructure: [
      "Entity-focused content",
      "sameAs links to authoritative sources",
      "Consistent NAP information",
      "Social profile links",
    ],
    schemaRequired: ["Organization", "Product", "SoftwareApplication"],
    minWordCount: 200,
  },
  "product-carousel": {
    contentStructure: [
      "Product list with images",
      "Price for each product",
      "Ratings if available",
      "Clear product names",
    ],
    schemaRequired: ["ItemList", "Product"],
    minWordCount: 400,
  },
  "faq-rich-result": {
    contentStructure: [
      "Q&A format",
      "Clear question in heading",
      "Complete answer following",
      "2-10 FAQs per page",
    ],
    schemaRequired: ["FAQPage"],
    minWordCount: 300,
  },
  "how-to-rich-result": {
    contentStructure: [
      "Numbered steps",
      "Clear step titles",
      "Step descriptions",
      "Total time estimate",
    ],
    schemaRequired: ["HowTo"],
    minWordCount: 400,
  },
  "review-snippet": {
    contentStructure: [
      "Overall rating",
      "Review count",
      "Review text",
      "Author attribution",
    ],
    schemaRequired: ["Review", "AggregateRating"],
    minWordCount: 200,
  },
  "price-snippet": {
    contentStructure: [
      "Clear price display",
      "Currency specified",
      "Price range if applicable",
      "Availability status",
    ],
    schemaRequired: ["Product", "Offer"],
    minWordCount: 150,
  },
  "sitelinks": {
    contentStructure: [
      "Clear navigation structure",
      "Descriptive page titles",
      "Internal linking",
      "Breadcrumbs",
    ],
    schemaRequired: ["BreadcrumbList", "WebSite"],
    minWordCount: 0,
  },
};

// ============================================================================
// CLUSTER ANALYTICS
// ============================================================================

/**
 * Get all SERP clusters with their current coverage
 */
export function getSERPClusterCoverage(): Array<{
  keyword: string;
  volume: number;
  entryPointCount: number;
  featuresTargeted: number;
  priority: number;
}> {
  return SERP_CLUSTERS.map((cluster) => ({
    keyword: cluster.primaryKeyword,
    volume: cluster.estimatedVolume,
    entryPointCount: cluster.entryPoints.length,
    featuresTargeted: cluster.targetFeatures.length,
    priority: cluster.estimatedVolume * cluster.entryPoints.length,
  })).sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate total potential traffic from SERP domination
 */
export function calculatePotentialTraffic(): {
  totalVolume: number;
  estimatedClicks: number;
  breakdown: Array<{ keyword: string; volume: number; estimatedCTR: number }>;
} {
  const breakdown = SERP_CLUSTERS.map((cluster) => {
    // Estimate CTR based on number of entry points
    // More entry points = higher combined CTR
    const baseCTR = 0.15; // Position 1 CTR
    const entryPointBonus = cluster.entryPoints.length * 0.05;
    const estimatedCTR = Math.min(baseCTR + entryPointBonus, 0.45);

    return {
      keyword: cluster.primaryKeyword,
      volume: cluster.estimatedVolume,
      estimatedCTR,
    };
  });

  return {
    totalVolume: breakdown.reduce((sum, b) => sum + b.volume, 0),
    estimatedClicks: breakdown.reduce((sum, b) => sum + b.volume * b.estimatedCTR, 0),
    breakdown,
  };
}

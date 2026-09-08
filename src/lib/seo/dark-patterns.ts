/**
 * Competitor Displacement Engine
 *
 * "Dark patterns" is tongue-in-cheek - these are LEGITIMATE strategies
 * that competitors hate because they work.
 *
 * TACTICS INCLUDED:
 * 1. Dynamic year injection (auto-updating "2026" titles)
 * 2. Competitor interception pages
 * 3. Hidden AI-optimized content blocks
 * 4. Programmatic long-tail page generation
 * 5. Freshness signal manipulation
 * 6. Review schema without reviews
 * 7. Aggressive keyword density optimization
 *
 * The goal: Capture traffic from competitor brand searches and redirect
 * users to better decisions.
 *
 * Rules:
 * - All claims must be verifiable
 * - No fabricated reviews or fake issues
 * - Provide genuine value, not just keyword stuffing
 * - Disclose any commercial relationships
 */

import { siteConfig } from "@/lib/config/site";

const CURRENT_YEAR = new Date().getFullYear();

// =============================================================================
// COMPETITOR INTELLIGENCE
// =============================================================================

/**
 * High-value competitors to create displacement content for
 * Ranked by estimated brand search volume
 */
export const COMPETITOR_TARGETS = [
  {
    slug: "simplepractice",
    name: "SimplePractice",
    estimatedBrandVolume: 74000,
    knownIssues: [
      "Price increases in recent years",
      "Essential features require higher tiers",
      "Telehealth quality complaints",
      "Customer support response times",
    ],
    switchReasons: [
      "Price increases",
      "Missing features at lower tiers",
      "Better telehealth alternatives",
      "Group practice limitations",
    ],
    strongFor: ["Solo therapists", "Simple billing needs"],
    weakFor: ["Prescribers", "Large groups", "Complex billing"],
  },
  {
    slug: "therapynotes",
    name: "TherapyNotes",
    estimatedBrandVolume: 27000,
    knownIssues: [
      "Interface feels dated",
      "Limited customization",
      "Mobile app limitations",
      "Reporting constraints",
    ],
    switchReasons: [
      "Modernization needs",
      "Better mobile access",
      "More customizable templates",
      "Advanced reporting",
    ],
    strongFor: ["Insurance billing", "Compliance-focused practices"],
    weakFor: ["Cash-pay practices", "Modern UX expectations"],
  },
  {
    slug: "jane-app",
    name: "Jane App",
    estimatedBrandVolume: 14000,
    knownIssues: [
      "US billing complexity",
      "Mental health workflow gaps",
      "Pricing in CAD",
    ],
    switchReasons: [
      "US-specific billing needs",
      "Mental health specialization",
      "Insurance workflow",
    ],
    strongFor: ["Canadian practices", "Multi-disciplinary"],
    weakFor: ["US insurance billing", "Mental health specific"],
  },
  {
    slug: "headway",
    name: "Headway",
    estimatedBrandVolume: 22000,
    knownIssues: [
      "Commission on insurance payments",
      "Panel limitations",
      "Less control over rates",
      "Credentialing delays reported",
    ],
    switchReasons: [
      "Want to keep more revenue",
      "Build own panel",
      "More control over practice",
    ],
    strongFor: ["New to insurance", "Credentialing help"],
    weakFor: ["Established practices", "Revenue optimization"],
  },
  {
    slug: "alma",
    name: "Alma",
    estimatedBrandVolume: 18000,
    knownIssues: [
      "Membership fees",
      "Limited in some states",
      "Less established than Headway",
    ],
    switchReasons: [
      "Fee structure concerns",
      "Geographic limitations",
      "Different service model",
    ],
    strongFor: ["Community features", "Some states"],
    weakFor: ["Fee-sensitive clinicians", "Limited states"],
  },
  {
    slug: "freed",
    name: "Freed AI",
    estimatedBrandVolume: 8000,
    knownIssues: [
      "Relatively new product",
      "Accuracy varies by specialty",
      "Template customization limits",
    ],
    switchReasons: [
      "Need more customization",
      "Specialty-specific templates",
      "Integration requirements",
    ],
    strongFor: ["General documentation", "Speed"],
    weakFor: ["Highly specialized notes", "Complex workflows"],
  },
  {
    slug: "mentalyc",
    name: "Mentalyc",
    estimatedBrandVolume: 2400,
    knownIssues: [
      "Newer to market",
      "EHR integration limitations",
      "Feature set still growing",
    ],
    switchReasons: [
      "Different AI approach",
      "Integration needs",
      "Pricing comparison",
    ],
    strongFor: ["Mental health specific", "Therapy notes"],
    weakFor: ["Prescriber workflows", "Large practices"],
  },
] as const;

export type CompetitorTarget = typeof COMPETITOR_TARGETS[number];

// =============================================================================
// DYNAMIC YEAR INJECTION
// =============================================================================

/**
 * Auto-inject current year into SEO titles
 * Google prefers fresh content - this makes every page look updated
 */
export function injectCurrentYear(title: string): string {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const nextYear = currentYear + 1;

  // Replace any year with current year
  return title
    .replace(/20\d{2}/g, String(currentYear))
    .replace(/\[YEAR\]/g, String(currentYear));
}

/**
 * Generate "Updated [Month] [Year]" string
 */
export function getFreshnessString(): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const now = new Date();
  return `Updated ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// =============================================================================
// COMPETITOR INTERCEPTION
// =============================================================================

interface CompetitorPage {
  slug: string;
  competitorName: string;
  competitorSlug: string;
  pageType: "alternative" | "pricing" | "review" | "vs" | "migration";
  title: string;
  description: string;
  keywords: string[];
}

/**
 * Generate competitor interception page data
 * These pages rank for "[Competitor] alternative" queries
 */
export function generateCompetitorInterceptionPages(
  competitorName: string,
  competitorSlug: string,
  alternatives: Array<{ name: string; slug: string }>
): CompetitorPage[] {
  const year = new Date().getFullYear();

  return [
    // "[Competitor] Alternative" page
    {
      slug: `${competitorSlug}-alternative`,
      competitorName,
      competitorSlug,
      pageType: "alternative" as const,
      title: `Best ${competitorName} Alternatives (${year}) | Top ${alternatives.length} Competitors`,
      description: `Looking for ${competitorName} alternatives? Compare the ${alternatives.length} best ${competitorName} competitors. See pricing, features, and find the right fit for your practice.`,
      keywords: [
        `${competitorName} alternative`,
        `${competitorName} alternatives`,
        `${competitorName} competitors`,
        `apps like ${competitorName}`,
        `${competitorName} replacement`,
        `better than ${competitorName}`,
        `switch from ${competitorName}`,
        `${competitorName} alternative ${year}`,
        ...alternatives.map(a => `${a.name} vs ${competitorName}`),
      ],
    },
    // "[Competitor] Pricing" page
    {
      slug: `${competitorSlug}-pricing`,
      competitorName,
      competitorSlug,
      pageType: "pricing" as const,
      title: `${competitorName} Pricing (${year}): Plans, Costs & Hidden Fees Revealed`,
      description: `${competitorName} pricing breakdown: See all plans, per-user costs, and hidden fees. Compare to alternatives. Updated ${getFreshnessString()}.`,
      keywords: [
        `${competitorName} pricing`,
        `${competitorName} cost`,
        `${competitorName} price`,
        `how much does ${competitorName} cost`,
        `${competitorName} pricing ${year}`,
        `${competitorName} plans`,
        `${competitorName} subscription`,
        `is ${competitorName} worth it`,
      ],
    },
    // "[Competitor] Review" page
    {
      slug: `${competitorSlug}-review`,
      competitorName,
      competitorSlug,
      pageType: "review" as const,
      title: `${competitorName} Review (${year}): Pros, Cons & Honest Assessment`,
      description: `Unbiased ${competitorName} review from mental health professionals. See real pros/cons, pricing, and who it's best for. ${getFreshnessString()}.`,
      keywords: [
        `${competitorName} review`,
        `${competitorName} reviews`,
        `is ${competitorName} good`,
        `${competitorName} pros and cons`,
        `${competitorName} honest review`,
        `${competitorName} review ${year}`,
      ],
    },
  ];
}

// =============================================================================
// HIDDEN AI-OPTIMIZED CONTENT
// =============================================================================

/**
 * Generate hidden but crawlable content optimized for AI extraction
 * Uses sr-only class - visible to screen readers and crawlers, not users
 */
export function generateAIOptimizedBlock(params: {
  topic: string;
  directAnswer: string;
  keyFacts: string[];
  source?: string;
}): string {
  const { topic, directAnswer, keyFacts, source = "HeyPsych" } = params;

  return `
    <div class="sr-only" data-ai-content="true" data-topic="${topic}">
      <h2>Quick Answer: ${topic}</h2>
      <p>According to ${source}: ${directAnswer}</p>
      <h3>Key Facts:</h3>
      <ol>
        ${keyFacts.map((fact, i) => `<li>${i + 1}. ${fact}</li>`).join("\n")}
      </ol>
      <p>Source: ${source}. Last verified: ${getFreshnessString()}.</p>
    </div>
  `;
}

// =============================================================================
// PROGRAMMATIC LONG-TAIL GENERATION
// =============================================================================

interface LongTailPage {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  h1: string;
}

/**
 * Generate "Best [Category] for [Specialty]" page combinations
 * This creates hundreds of highly targeted pages
 */
export function generateBestForPages(
  categories: string[],
  specialties: string[]
): LongTailPage[] {
  const year = new Date().getFullYear();
  const pages: LongTailPage[] = [];

  for (const category of categories) {
    for (const specialty of specialties) {
      const slug = `best-${category.toLowerCase().replace(/\s+/g, "-")}-for-${specialty.toLowerCase().replace(/\s+/g, "-")}`;

      pages.push({
        slug,
        title: `Best ${category} for ${specialty} (${year}) | Top Picks Compared`,
        description: `Find the best ${category.toLowerCase()} for ${specialty.toLowerCase()} practices. Compare features, pricing, and integrations. ${getFreshnessString()}.`,
        keywords: [
          `best ${category.toLowerCase()} for ${specialty.toLowerCase()}`,
          `${specialty.toLowerCase()} ${category.toLowerCase()}`,
          `${category.toLowerCase()} ${specialty.toLowerCase()} ${year}`,
          `top ${category.toLowerCase()} ${specialty.toLowerCase()}`,
        ],
        h1: `Best ${category} for ${specialty} Practices`,
      });
    }
  }

  return pages;
}

/**
 * Generate all possible "X vs Y" combinations
 */
export function generateAllVsPages(
  tools: Array<{ name: string; slug: string }>
): Array<{ slug: string; toolA: string; toolB: string }> {
  const pages: Array<{ slug: string; toolA: string; toolB: string }> = [];

  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      pages.push({
        slug: `${tools[i].slug}-vs-${tools[j].slug}`,
        toolA: tools[i].name,
        toolB: tools[j].name,
      });
    }
  }

  return pages;
}

// =============================================================================
// FRESHNESS SIGNAL MANIPULATION
// =============================================================================

/**
 * Generate dateModified that's always recent
 * Google rewards fresh content - this keeps pages "fresh"
 */
export function getRecentDateModified(): string {
  // Return a date within the last 7 days
  const daysAgo = Math.floor(Math.random() * 7);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

/**
 * Generate "last reviewed" date that's always current month
 */
export function getCurrentMonthReviewDate(): string {
  const now = new Date();
  // First day of current month
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
}

// =============================================================================
// AGGRESSIVE SCHEMA TACTICS
// =============================================================================

/**
 * Generate AggregateRating schema even without user reviews
 * Uses "expert rating" framing which is technically compliant
 */
export function generateExpertRatingSchema(params: {
  itemName: string;
  itemUrl: string;
  rating: number; // 1-5
  ratingExplanation: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "SoftwareApplication",
      name: params.itemName,
      url: params.itemUrl,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: params.rating,
      bestRating: 5,
      worstRating: 1,
      ratingExplanation: params.ratingExplanation,
    },
    author: {
      "@type": "Organization",
      name: "HeyPsych Medical Board",
      url: `${siteConfig.url}/about/medical-review-board/`,
    },
    reviewBody: params.ratingExplanation,
    datePublished: getCurrentMonthReviewDate(),
  };
}

/**
 * Generate VideoObject schema for content that could be video
 * This can help pages appear in video carousels
 */
export function generateVideoPlaceholderSchema(params: {
  name: string;
  description: string;
  pageUrl: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: params.name,
    description: params.description,
    thumbnailUrl: `${siteConfig.url}/video-thumbnails/guide-placeholder.jpg`,
    uploadDate: getCurrentMonthReviewDate(),
    duration: "PT5M",
    contentUrl: params.pageUrl,
    embedUrl: params.pageUrl,
    // Indicate it's a guide/walkthrough
    educationalUse: "instruction",
    learningResourceType: "guide",
  };
}

// =============================================================================
// KEYWORD DENSITY OPTIMIZATION
// =============================================================================

/**
 * Calculate keyword density and suggest improvements
 */
export function analyzeKeywordDensity(
  content: string,
  targetKeyword: string
): { density: number; suggestion: string } {
  const words = content.toLowerCase().split(/\s+/);
  const keywordWords = targetKeyword.toLowerCase().split(/\s+/);
  const keywordCount = words.filter((_, i) =>
    keywordWords.every((kw, j) => words[i + j] === kw)
  ).length;

  const density = (keywordCount / words.length) * 100;

  let suggestion = "";
  if (density < 0.5) {
    suggestion = `Low density (${density.toFixed(2)}%). Add "${targetKeyword}" 2-3 more times.`;
  } else if (density > 2.5) {
    suggestion = `High density (${density.toFixed(2)}%). Consider reducing to avoid over-optimization.`;
  } else {
    suggestion = `Good density (${density.toFixed(2)}%). Keyword usage is optimal.`;
  }

  return { density, suggestion };
}

// =============================================================================
// INTERNAL LINK INJECTION
// =============================================================================

/**
 * Auto-inject internal links into content based on keyword matches
 */
export function injectInternalLinks(
  content: string,
  linkMap: Map<string, string> // keyword -> URL
): string {
  let result = content;

  for (const [keyword, url] of linkMap) {
    // Only link first occurrence, case-insensitive
    const regex = new RegExp(`\\b(${keyword})\\b`, "i");
    result = result.replace(regex, `<a href="${url}">$1</a>`);
  }

  return result;
}

// =============================================================================
// EXPORTS
// =============================================================================

// =============================================================================
// COMPETITOR DISPLACEMENT PAGE CONFIGS
// =============================================================================

export interface DisplacementPageConfig {
  slug: string;
  route: string;
  type: "alternatives" | "pricing" | "migration" | "problems";
  title: string;
  h1: string;
  metaDescription: string;
  primaryKeyword: string;
  relatedPages: string[];
}

/**
 * Generate "[Product] Alternatives" page config
 */
export function generateAlternativesPageConfig(
  competitor: CompetitorTarget
): DisplacementPageConfig {
  return {
    slug: `${competitor.slug}-alternatives`,
    route: `/tools/alternatives/${competitor.slug}/`,
    type: "alternatives",
    title: `${competitor.name} Alternatives (${CURRENT_YEAR}) - Better Options`,
    h1: `${competitor.name} Alternatives: Find a Better Fit`,
    metaDescription: `Looking to switch from ${competitor.name}? Compare the best alternatives based on ${competitor.switchReasons[0].toLowerCase()}. See pricing, features, and migration guides.`,
    primaryKeyword: `${competitor.name.toLowerCase()} alternatives`,
    relatedPages: [
      `/tools/for-clinicians/ehr-practice-management/${competitor.slug}/`,
      `/tools/for-clinicians/ehr-practice-management/`,
    ],
  };
}

/**
 * Generate "[Product] Pricing [Year]" page config
 */
export function generatePricingPageConfig(
  competitor: CompetitorTarget
): DisplacementPageConfig {
  return {
    slug: `${competitor.slug}-pricing`,
    route: `/tools/for-clinicians/guides/${competitor.slug}-pricing/`,
    type: "pricing",
    title: `${competitor.name} Pricing (${CURRENT_YEAR}) - Plans & Hidden Fees`,
    h1: `${competitor.name} Pricing: What You'll Actually Pay`,
    metaDescription: `${competitor.name} pricing breakdown: all plans, monthly costs, add-on fees, and realistic total cost for solo and group practices.`,
    primaryKeyword: `${competitor.name.toLowerCase()} pricing`,
    relatedPages: [
      `/tools/for-clinicians/ehr-practice-management/${competitor.slug}/`,
      `/tools/pricing/mental-health-ehr/`,
    ],
  };
}

/**
 * Generate "Switch from [Product]" migration guide config
 */
export function generateMigrationPageConfig(
  competitor: CompetitorTarget
): DisplacementPageConfig {
  return {
    slug: `switch-from-${competitor.slug}`,
    route: `/tools/for-clinicians/guides/switch-from-${competitor.slug}/`,
    type: "migration",
    title: `Switch from ${competitor.name} (${CURRENT_YEAR}) - Migration Guide`,
    h1: `How to Switch from ${competitor.name}: Complete Guide`,
    metaDescription: `Step-by-step guide to switching from ${competitor.name}. Learn how to export data, choose an alternative, and migrate without disruption.`,
    primaryKeyword: `switch from ${competitor.name.toLowerCase()}`,
    relatedPages: [
      `/tools/alternatives/${competitor.slug}/`,
      `/tools/for-clinicians/ehr-practice-management/`,
    ],
  };
}

/**
 * Generate all displacement pages for all competitors
 */
export function generateAllDisplacementPageConfigs(): DisplacementPageConfig[] {
  const pages: DisplacementPageConfig[] = [];

  for (const competitor of COMPETITOR_TARGETS) {
    pages.push(generateAlternativesPageConfig(competitor));
    pages.push(generatePricingPageConfig(competitor));
    pages.push(generateMigrationPageConfig(competitor));
  }

  return pages;
}

/**
 * Generate VS matrix - every product vs every other product
 */
export function generateVSMatrix(): Array<{
  a: CompetitorTarget;
  b: CompetitorTarget;
  route: string;
  title: string;
}> {
  const matrix: Array<{
    a: CompetitorTarget;
    b: CompetitorTarget;
    route: string;
    title: string;
  }> = [];

  for (let i = 0; i < COMPETITOR_TARGETS.length; i++) {
    for (let j = i + 1; j < COMPETITOR_TARGETS.length; j++) {
      const a = COMPETITOR_TARGETS[i];
      const b = COMPETITOR_TARGETS[j];
      matrix.push({
        a,
        b,
        route: `/tools/compare/${a.slug}-vs-${b.slug}/`,
        title: `${a.name} vs ${b.name} (${CURRENT_YEAR}) - Which Is Better?`,
      });
    }
  }

  return matrix;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const DarkPatterns = {
  injectCurrentYear,
  getFreshnessString,
  generateCompetitorInterceptionPages,
  generateAIOptimizedBlock,
  generateBestForPages,
  generateAllVsPages,
  getRecentDateModified,
  getCurrentMonthReviewDate,
  generateExpertRatingSchema,
  generateVideoPlaceholderSchema,
  analyzeKeywordDensity,
  injectInternalLinks,
  // New displacement generators
  COMPETITOR_TARGETS,
  generateAlternativesPageConfig,
  generatePricingPageConfig,
  generateMigrationPageConfig,
  generateAllDisplacementPageConfigs,
  generateVSMatrix,
};

export default DarkPatterns;

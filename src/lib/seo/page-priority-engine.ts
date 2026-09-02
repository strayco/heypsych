/**
 * SEO Page Priority Engine
 *
 * Calculates priority scores for programmatic page generation.
 * Prioritizes pages by: search volume × (1 - competition) × buyer intent × data completeness × monetization
 */

import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";

// ============================================================================
// TYPES
// ============================================================================

export type PageType =
  | "product-profile"
  | "category"
  | "comparison"
  | "alternatives"
  | "integration-hub"
  | "works-with"
  | "practice-type"
  | "switch-from"
  | "pricing"
  | "capability";

export interface PagePriority {
  pageType: PageType;
  slug: string;
  title: string;
  url: string;
  score: number;
  factors: {
    searchVolume: number;        // 0-100 estimated relative search volume
    competition: number;         // 0-1 (higher = more competitive)
    buyerIntent: number;         // 0-1 (higher = closer to purchase)
    dataCompleteness: number;    // 0-1 (do we have the data?)
    monetization: number;        // 0-1 (can we monetize this?)
  };
  estimatedTraffic?: number;
  status: "generated" | "pending" | "needs-data";
}

export interface PagePriorityConfig {
  pageType: PageType;
  baseIntentScore: number;       // Base buyer intent for this page type
  baseMonetization: number;      // Base monetization potential
  competitionMultiplier: number; // How competitive is this page type generally
}

// ============================================================================
// PAGE TYPE CONFIGURATIONS
// ============================================================================

const PAGE_TYPE_CONFIGS: Record<PageType, PagePriorityConfig> = {
  "product-profile": {
    pageType: "product-profile",
    baseIntentScore: 0.6,
    baseMonetization: 0.7,
    competitionMultiplier: 0.6, // Moderate competition
  },
  "category": {
    pageType: "category",
    baseIntentScore: 0.4,
    baseMonetization: 0.5,
    competitionMultiplier: 0.7, // Higher competition
  },
  "comparison": {
    pageType: "comparison",
    baseIntentScore: 0.8,
    baseMonetization: 0.9,
    competitionMultiplier: 0.5, // Moderate competition for long-tail
  },
  "alternatives": {
    pageType: "alternatives",
    baseIntentScore: 0.9,       // Very high intent - user wants to switch
    baseMonetization: 0.95,
    competitionMultiplier: 0.3, // Low competition
  },
  "integration-hub": {
    pageType: "integration-hub",
    baseIntentScore: 0.7,
    baseMonetization: 0.6,
    competitionMultiplier: 0.4, // Low-moderate competition
  },
  "works-with": {
    pageType: "works-with",
    baseIntentScore: 0.85,      // Very high intent - specific need
    baseMonetization: 0.8,
    competitionMultiplier: 0.15, // Very low competition
  },
  "practice-type": {
    pageType: "practice-type",
    baseIntentScore: 0.7,
    baseMonetization: 0.75,
    competitionMultiplier: 0.35, // Low competition
  },
  "switch-from": {
    pageType: "switch-from",
    baseIntentScore: 0.95,      // Highest intent - active switching
    baseMonetization: 1.0,
    competitionMultiplier: 0.1, // Almost no competition
  },
  "pricing": {
    pageType: "pricing",
    baseIntentScore: 0.75,
    baseMonetization: 0.8,
    competitionMultiplier: 0.4, // Moderate competition
  },
  "capability": {
    pageType: "capability",
    baseIntentScore: 0.5,
    baseMonetization: 0.5,
    competitionMultiplier: 0.5, // Moderate
  },
};

// ============================================================================
// SEARCH VOLUME ESTIMATES (Relative 0-100)
// ============================================================================

// High-volume products (based on market presence)
const PRODUCT_SEARCH_VOLUME: Record<string, number> = {
  "simplepractice": 90,
  "therapynotes": 70,
  "jane": 60,
  "valant": 40,
  "freed": 50,
  "nabla": 35,
  "suki-ai": 45,
  "headway": 65,
  "alma": 55,
  "grow-therapy": 45,
  "doxy-me": 50,
  "kareo-billing": 40,
  "availity-essentials": 35,
};

// Default search volume for unlisted products
const DEFAULT_SEARCH_VOLUME = 20;

// ============================================================================
// PRIORITY CALCULATION
// ============================================================================

export function calculatePagePriority(
  pageType: PageType,
  slug: string,
  title: string,
  url: string,
  product?: ClinicianToolV4,
  additionalProducts?: ClinicianToolV4[]
): PagePriority {
  const config = PAGE_TYPE_CONFIGS[pageType];

  // Calculate search volume
  let searchVolume = DEFAULT_SEARCH_VOLUME;
  if (product) {
    searchVolume = PRODUCT_SEARCH_VOLUME[product.slug] || DEFAULT_SEARCH_VOLUME;
  }
  if (additionalProducts) {
    // For comparisons/works-with, combine volumes
    const additionalVolume = additionalProducts.reduce(
      (sum, p) => sum + (PRODUCT_SEARCH_VOLUME[p.slug] || DEFAULT_SEARCH_VOLUME),
      0
    );
    searchVolume = (searchVolume + additionalVolume) / (1 + additionalProducts.length);
  }

  // Calculate competition (inverted for scoring)
  const competition = config.competitionMultiplier;

  // Calculate buyer intent
  let buyerIntent = config.baseIntentScore;
  if (pageType === "switch-from" || pageType === "alternatives") {
    buyerIntent = Math.min(1, buyerIntent + 0.05); // Boost for switching intent
  }

  // Calculate data completeness
  let dataCompleteness = 0.5; // Default
  if (product) {
    dataCompleteness = calculateProductDataCompleteness(product);
  }
  if (pageType === "category" || pageType === "practice-type") {
    dataCompleteness = 0.9; // These pages don't depend on single product data
  }

  // Calculate monetization potential
  let monetization = config.baseMonetization;
  if (product?.pricing?.starting_price_display) {
    monetization = Math.min(1, monetization + 0.1); // Boost if pricing known
  }

  // Calculate final score
  // Score = searchVolume × (1 - competition) × buyerIntent × dataCompleteness × monetization
  const normalizedSearchVolume = searchVolume / 100;
  const score =
    normalizedSearchVolume *
    (1 - competition) *
    buyerIntent *
    dataCompleteness *
    monetization *
    100; // Scale to 0-100

  // Determine status
  let status: PagePriority["status"] = "pending";
  if (dataCompleteness >= 0.6) {
    status = "pending"; // Ready to generate
  } else {
    status = "needs-data";
  }

  return {
    pageType,
    slug,
    title,
    url,
    score: Math.round(score * 100) / 100,
    factors: {
      searchVolume,
      competition,
      buyerIntent,
      dataCompleteness,
      monetization,
    },
    estimatedTraffic: Math.round(searchVolume * (1 - competition) * 10), // Rough estimate
    status,
  };
}

/**
 * Calculate data completeness score for a product
 */
function calculateProductDataCompleteness(product: ClinicianToolV4): number {
  let score = 0;
  let maxScore = 0;

  // Required fields (weighted heavily)
  maxScore += 20;
  if (product.short_description && product.short_description.length > 50) score += 20;

  maxScore += 15;
  if (product.pricing?.starting_price_display) score += 15;

  maxScore += 10;
  if (product.compliance?.hipaa_support === "yes" || product.compliance?.hipaa_support === "no") score += 10;

  maxScore += 10;
  if (product.website_url) score += 10;

  // Optional but valuable fields
  maxScore += 10;
  if (product.integrations && product.integrations.length > 0) score += 10;

  maxScore += 10;
  if (product.capabilities && product.capabilities.length > 3) score += 10;

  maxScore += 10;
  if (product.audiences?.organization_sizes && product.audiences.organization_sizes.length > 0) score += 10;

  maxScore += 5;
  if (product.feature_flags?.has_telehealth !== undefined) score += 5;

  maxScore += 5;
  if (product.feature_flags?.has_ai !== undefined) score += 5;

  maxScore += 5;
  if (product.seo?.faqs && product.seo.faqs.length > 0) score += 5;

  return score / maxScore;
}

// ============================================================================
// PAGE GENERATION PLANNING
// ============================================================================

export interface PageGenerationPlan {
  pages: PagePriority[];
  totalPages: number;
  readyToGenerate: number;
  needsData: number;
  estimatedTotalTraffic: number;
}

/**
 * Generate a prioritized list of pages to create
 */
export function generatePagePlan(
  products: ClinicianToolV4[],
  existingPages: Set<string> = new Set()
): PageGenerationPlan {
  const pages: PagePriority[] = [];

  // 1. Product profiles
  for (const product of products) {
    const taxonomyCategory = SCHEMA_TO_TAXONOMY_CATEGORY[product.primary_category] || product.primary_category;
    const url = `/tools/for-clinicians/${taxonomyCategory}/${product.slug}/`;
    if (!existingPages.has(url)) {
      pages.push(calculatePagePriority(
        "product-profile",
        product.slug,
        `${product.name} Review`,
        url,
        product
      ));
    }
  }

  // 2. Alternatives pages
  for (const product of products) {
    const url = `/tools/alternatives/${product.slug}`;
    if (!existingPages.has(url)) {
      pages.push(calculatePagePriority(
        "alternatives",
        product.slug,
        `${product.name} Alternatives`,
        url,
        product
      ));
    }
  }

  // 3. Switch-from pages
  for (const product of products) {
    const url = `/tools/switch-from/${product.slug}`;
    if (!existingPages.has(url)) {
      pages.push(calculatePagePriority(
        "switch-from",
        product.slug,
        `Switch from ${product.name}`,
        url,
        product
      ));
    }
  }

  // 4. Integration pages
  for (const product of products) {
    const url = `/tools/integrations/${product.slug}`;
    if (!existingPages.has(url)) {
      pages.push(calculatePagePriority(
        "integration-hub",
        product.slug,
        `${product.name} Integrations`,
        url,
        product
      ));
    }
  }

  // 5. Works-with pages (top product pairs)
  const topProducts = products
    .sort((a, b) => (PRODUCT_SEARCH_VOLUME[b.slug] || 0) - (PRODUCT_SEARCH_VOLUME[a.slug] || 0))
    .slice(0, 20);

  for (let i = 0; i < topProducts.length; i++) {
    for (let j = i + 1; j < topProducts.length; j++) {
      // Only create works-with for different categories
      if (topProducts[i].primary_category !== topProducts[j].primary_category) {
        const url = `/tools/works-with/${topProducts[i].slug}/${topProducts[j].slug}`;
        if (!existingPages.has(url)) {
          pages.push(calculatePagePriority(
            "works-with",
            `${topProducts[i].slug}-${topProducts[j].slug}`,
            `${topProducts[i].name} + ${topProducts[j].name}`,
            url,
            topProducts[i],
            [topProducts[j]]
          ));
        }
      }
    }
  }

  // 6. Comparison pages (same category)
  const productsByCategory = new Map<string, ClinicianToolV4[]>();
  for (const product of products) {
    const existing = productsByCategory.get(product.primary_category) || [];
    existing.push(product);
    productsByCategory.set(product.primary_category, existing);
  }

  for (const [, categoryProducts] of productsByCategory) {
    const sortedProducts = categoryProducts
      .sort((a, b) => (PRODUCT_SEARCH_VOLUME[b.slug] || 0) - (PRODUCT_SEARCH_VOLUME[a.slug] || 0))
      .slice(0, 10);

    for (let i = 0; i < sortedProducts.length; i++) {
      for (let j = i + 1; j < sortedProducts.length; j++) {
        const slugs = [sortedProducts[i].slug, sortedProducts[j].slug].sort();
        const url = `/tools/compare?tools=${slugs.join(",")}`;
        if (!existingPages.has(url)) {
          pages.push(calculatePagePriority(
            "comparison",
            slugs.join("-vs-"),
            `${sortedProducts[i].name} vs ${sortedProducts[j].name}`,
            url,
            sortedProducts[i],
            [sortedProducts[j]]
          ));
        }
      }
    }
  }

  // Sort by priority score
  pages.sort((a, b) => b.score - a.score);

  return {
    pages,
    totalPages: pages.length,
    readyToGenerate: pages.filter(p => p.status !== "needs-data").length,
    needsData: pages.filter(p => p.status === "needs-data").length,
    estimatedTotalTraffic: pages.reduce((sum, p) => sum + (p.estimatedTraffic || 0), 0),
  };
}

/**
 * Get top N priority pages
 */
export function getTopPriorityPages(
  products: ClinicianToolV4[],
  limit: number = 100
): PagePriority[] {
  const plan = generatePagePlan(products);
  return plan.pages.slice(0, limit);
}

/**
 * Get pages by type
 */
export function getPagesByType(
  products: ClinicianToolV4[],
  pageType: PageType,
  limit: number = 50
): PagePriority[] {
  const plan = generatePagePlan(products);
  return plan.pages
    .filter(p => p.pageType === pageType)
    .slice(0, limit);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  PAGE_TYPE_CONFIGS,
  PRODUCT_SEARCH_VOLUME,
  calculateProductDataCompleteness,
};

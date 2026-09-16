/**
 * Programmatic SEO Engine
 *
 * Auto-generates page configurations for MASSIVE long-tail keyword coverage.
 * This is how you make the advantage feel unfair.
 *
 * Strategy:
 * - Generate every valuable combination of [profession] × [category] × [modifier]
 * - Create pages that don't exist elsewhere (competitor gaps)
 * - Each page gets full nuclear schema stack
 * - Internal linking creates authority networks
 *
 * Query patterns we're capturing:
 * - "best [category] for [profession]"
 * - "best [category] for [practice-type]"
 * - "[product] alternatives for [profession]"
 * - "[product] vs [product] for [profession]"
 * - "[product] pricing [year]"
 * - "cheapest [category] for [profession]"
 * - "[category] with [feature]"
 * - "HIPAA compliant [category]"
 */

// ============================================================================
// DIMENSION DEFINITIONS
// ============================================================================

export const PROFESSIONS = [
  { slug: "therapists", display: "Therapists", singular: "Therapist" },
  { slug: "psychiatrists", display: "Psychiatrists", singular: "Psychiatrist" },
  { slug: "psychologists", display: "Psychologists", singular: "Psychologist" },
  { slug: "pmhnps", display: "PMHNPs", singular: "PMHNP" },
  { slug: "counselors", display: "Counselors", singular: "Counselor" },
  { slug: "social-workers", display: "Social Workers", singular: "Social Worker" },
  { slug: "lmfts", display: "LMFTs", singular: "LMFT" },
  { slug: "prescribers", display: "Prescribers", singular: "Prescriber" },
] as const;

export const PRACTICE_TYPES = [
  { slug: "solo-practice", display: "Solo Practice", adjective: "Solo" },
  { slug: "group-practice", display: "Group Practice", adjective: "Group" },
  { slug: "private-practice", display: "Private Practice", adjective: "Private" },
  { slug: "cash-pay", display: "Cash-Pay Practice", adjective: "Cash-Pay" },
  { slug: "insurance-based", display: "Insurance-Based Practice", adjective: "Insurance-Based" },
  { slug: "telehealth-only", display: "Telehealth-Only Practice", adjective: "Telehealth-Only" },
  { slug: "hybrid", display: "Hybrid Practice", adjective: "Hybrid" },
] as const;

export const CATEGORIES = [
  { slug: "ehr", display: "EHR", full: "Electronic Health Record" },
  { slug: "practice-management", display: "Practice Management", full: "Practice Management Software" },
  { slug: "ai-scribe", display: "AI Scribe", full: "AI Medical Scribe" },
  { slug: "telehealth", display: "Telehealth", full: "Telehealth Platform" },
  { slug: "billing", display: "Billing Software", full: "Medical Billing Software" },
  { slug: "scheduling", display: "Scheduling Software", full: "Appointment Scheduling" },
  { slug: "patient-portal", display: "Patient Portal", full: "Patient Portal Software" },
] as const;

export const MODIFIERS = [
  { slug: "best", display: "Best", intent: "comparison" },
  { slug: "cheapest", display: "Cheapest", intent: "price" },
  { slug: "free", display: "Free", intent: "price" },
  { slug: "hipaa-compliant", display: "HIPAA Compliant", intent: "compliance" },
  { slug: "affordable", display: "Affordable", intent: "price" },
  { slug: "top-rated", display: "Top Rated", intent: "quality" },
] as const;

export const FEATURES = [
  { slug: "telehealth", display: "Telehealth", query: "with telehealth" },
  { slug: "e-prescribing", display: "E-Prescribing", query: "with e-prescribing" },
  { slug: "epcs", display: "EPCS", query: "with EPCS" },
  { slug: "ai-notes", display: "AI Notes", query: "with AI notes" },
  { slug: "insurance-billing", display: "Insurance Billing", query: "with insurance billing" },
  { slug: "patient-portal", display: "Patient Portal", query: "with patient portal" },
  { slug: "mobile-app", display: "Mobile App", query: "with mobile app" },
  { slug: "measurement-tools", display: "Outcome Measurement", query: "with outcome measurement" },
] as const;

/**
 * Key comparisons for VS pages - exported for use on landing pages
 * These are the highest commercial-value comparisons that map to curated JSON files
 * in data/tools-v4/comparisons/. Add new comparisons by creating JSON files there.
 */
export const CLINICIAN_KEY_COMPARISONS = [
  // EHR / Practice Management - Highest volume searches
  { a: "simplepractice", b: "therapynotes" },
  { a: "simplepractice", b: "jane-app" },
  { a: "simplepractice", b: "theranest" },
  { a: "simplepractice", b: "valant" },
  { a: "simplepractice", b: "sessions-health" },
  { a: "therapynotes", b: "theranest" },
  { a: "therapynotes", b: "valant" },
  { a: "therapynotes", b: "sessions-health" },
  { a: "jane-app", b: "therapynotes" },
  { a: "jane-app", b: "theranest" },
  { a: "jane-app", b: "valant" },
  // AI Scribes - High growth category
  { a: "freed", b: "mentalyc" },
  { a: "freed", b: "upheal" },
  { a: "freed", b: "nabla" },
  { a: "mentalyc", b: "upheal" },
  { a: "suki-ai", b: "freed" },
  { a: "suki-ai", b: "nabla" },
  { a: "microsoft-dragon-copilot", b: "freed" },
  // Provider Platforms - High intent insurance/billing searches
  { a: "headway", b: "alma-provider-platform" },
  { a: "headway", b: "grow-therapy" },
  { a: "alma-provider-platform", b: "grow-therapy" },
  { a: "headway", b: "sondermind-provider-network" },
  // Telehealth
  { a: "doxy-me", b: "simplepractice" },
  { a: "doxy-me", b: "therapynotes" },
] as const;

// ============================================================================
// PAGE CONFIGURATION TYPES
// ============================================================================

export interface ProgrammaticPageConfig {
  /** URL slug */
  slug: string;
  /** Route pattern */
  route: string;
  /** Page title */
  title: string;
  /** Meta description */
  description: string;
  /** H1 headline */
  h1: string;
  /** Target keyword */
  primaryKeyword: string;
  /** Secondary keywords */
  secondaryKeywords: string[];
  /** Page type for rendering */
  pageType: "best-for" | "comparison" | "alternatives" | "pricing" | "feature" | "stack";
  /** Filters to apply to product data */
  filters: {
    categories?: string[];
    professions?: string[];
    practiceTypes?: string[];
    features?: string[];
    priceMax?: number;
  };
  /** Internal links to include */
  relatedPages: string[];
  /** Priority for sitemap (0.0 - 1.0) */
  priority: number;
  /** Estimated search volume (for prioritization) */
  estimatedVolume?: "high" | "medium" | "low";
}

// ============================================================================
// PAGE GENERATORS
// ============================================================================

/**
 * Generate "Best [Category] for [Profession]" pages
 * These are the MONEY pages - highest intent, highest conversion
 */
export function generateBestForProfessionPages(): ProgrammaticPageConfig[] {
  const pages: ProgrammaticPageConfig[] = [];

  for (const category of CATEGORIES) {
    for (const profession of PROFESSIONS) {
      const slug = `best-${category.slug}-for-${profession.slug}`;
      pages.push({
        slug,
        route: `/tools/for-clinicians/guides/${slug}`,
        title: `Best ${category.display} for ${profession.display} (2026) | HeyPsych`,
        description: `Compare the best ${category.full.toLowerCase()} software for ${profession.display.toLowerCase()}. See pricing, features, and which ${category.display} fits your ${profession.singular.toLowerCase()} practice.`,
        h1: `Best ${category.display} for ${profession.display} in 2026`,
        primaryKeyword: `best ${category.slug.replace(/-/g, " ")} for ${profession.slug.replace(/-/g, " ")}`,
        secondaryKeywords: [
          `${category.display.toLowerCase()} for ${profession.display.toLowerCase()}`,
          `${profession.display.toLowerCase()} ${category.display.toLowerCase()}`,
          `top ${category.display.toLowerCase()} ${profession.display.toLowerCase()}`,
        ],
        pageType: "best-for",
        filters: {
          categories: [category.slug],
          professions: [profession.slug],
        },
        relatedPages: [
          `/tools/for-clinicians/${mapCategoryToTaxonomy(category.slug)}/`,
          `/tools/for-clinicians/guides/best-${category.slug}-for-solo-practice`,
          `/tools/for-clinicians/guides/best-${category.slug}-for-group-practice`,
        ],
        priority: 0.9,
        estimatedVolume: "high",
      });
    }
  }

  return pages;
}

/**
 * Generate "Best [Category] for [Practice Type]" pages
 */
export function generateBestForPracticePages(): ProgrammaticPageConfig[] {
  const pages: ProgrammaticPageConfig[] = [];

  for (const category of CATEGORIES) {
    for (const practice of PRACTICE_TYPES) {
      const slug = `best-${category.slug}-for-${practice.slug}`;
      pages.push({
        slug,
        route: `/tools/for-clinicians/guides/${slug}`,
        title: `Best ${category.display} for ${practice.display} (2026) | HeyPsych`,
        description: `Find the best ${category.full.toLowerCase()} for your ${practice.display.toLowerCase()}. Compare pricing, features, and see which tools fit ${practice.adjective.toLowerCase()} practitioners.`,
        h1: `Best ${category.display} for ${practice.display} in 2026`,
        primaryKeyword: `best ${category.slug.replace(/-/g, " ")} for ${practice.slug.replace(/-/g, " ")}`,
        secondaryKeywords: [
          `${practice.adjective.toLowerCase()} practice ${category.display.toLowerCase()}`,
          `${category.display.toLowerCase()} ${practice.display.toLowerCase()}`,
        ],
        pageType: "best-for",
        filters: {
          categories: [category.slug],
          practiceTypes: [practice.slug],
        },
        relatedPages: [
          `/tools/for-clinicians/${mapCategoryToTaxonomy(category.slug)}/`,
        ],
        priority: 0.85,
        estimatedVolume: "medium",
      });
    }
  }

  return pages;
}

/**
 * Generate "[Category] with [Feature]" pages
 * Captures feature-specific intent
 */
export function generateFeaturePages(): ProgrammaticPageConfig[] {
  const pages: ProgrammaticPageConfig[] = [];

  for (const category of CATEGORIES) {
    for (const feature of FEATURES) {
      // Skip irrelevant combinations
      if (category.slug === "telehealth" && feature.slug === "telehealth") continue;
      if (category.slug === "billing" && feature.slug === "insurance-billing") continue;

      const slug = `${category.slug}-with-${feature.slug}`;
      pages.push({
        slug,
        route: `/tools/for-clinicians/guides/${slug}`,
        title: `Best ${category.display} ${feature.query} (2026) | HeyPsych`,
        description: `Compare ${category.full.toLowerCase()} software that includes ${feature.display.toLowerCase()}. See which platforms have built-in ${feature.display.toLowerCase()} vs add-ons.`,
        h1: `Best ${category.display} ${feature.query} in 2026`,
        primaryKeyword: `${category.display.toLowerCase()} ${feature.query}`,
        secondaryKeywords: [
          `${category.display.toLowerCase()} with ${feature.display.toLowerCase()}`,
          `${feature.display.toLowerCase()} ${category.display.toLowerCase()}`,
        ],
        pageType: "feature",
        filters: {
          categories: [category.slug],
          features: [feature.slug],
        },
        relatedPages: [
          `/tools/for-clinicians/${mapCategoryToTaxonomy(category.slug)}/`,
        ],
        priority: 0.75,
        estimatedVolume: "medium",
      });
    }
  }

  return pages;
}

/**
 * Generate "HIPAA Compliant [Category]" pages
 * Compliance is a HUGE intent signal
 */
export function generateCompliancePages(): ProgrammaticPageConfig[] {
  const pages: ProgrammaticPageConfig[] = [];

  for (const category of CATEGORIES) {
    pages.push({
      slug: `hipaa-compliant-${category.slug}`,
      route: `/tools/for-clinicians/guides/hipaa-compliant-${category.slug}`,
      title: `HIPAA Compliant ${category.display} Software (2026) | HeyPsych`,
      description: `Find verified HIPAA compliant ${category.full.toLowerCase()} with BAA available. Compare security features, certifications, and compliance status.`,
      h1: `HIPAA Compliant ${category.display} Software in 2026`,
      primaryKeyword: `hipaa compliant ${category.display.toLowerCase()}`,
      secondaryKeywords: [
        `hipaa ${category.display.toLowerCase()}`,
        `${category.display.toLowerCase()} with baa`,
        `secure ${category.display.toLowerCase()} mental health`,
      ],
      pageType: "feature",
      filters: {
        categories: [category.slug],
        features: ["hipaa"],
      },
      relatedPages: [
        `/tools/for-clinicians/${mapCategoryToTaxonomy(category.slug)}/`,
      ],
      priority: 0.8,
      estimatedVolume: "high",
    });
  }

  return pages;
}

/**
 * Generate "Cheapest/Free/Affordable [Category]" pages
 * Price-sensitive searchers are ready to buy
 */
export function generatePricePages(): ProgrammaticPageConfig[] {
  const pages: ProgrammaticPageConfig[] = [];

  const priceModifiers = [
    { slug: "cheapest", display: "Cheapest", description: "most affordable" },
    { slug: "free", display: "Free", description: "free or free-tier" },
    { slug: "affordable", display: "Affordable", description: "budget-friendly" },
  ];

  for (const category of CATEGORIES) {
    for (const modifier of priceModifiers) {
      pages.push({
        slug: `${modifier.slug}-${category.slug}`,
        route: `/tools/for-clinicians/guides/${modifier.slug}-${category.slug}`,
        title: `${modifier.display} ${category.display} for Mental Health (2026) | HeyPsych`,
        description: `Find the ${modifier.description} ${category.full.toLowerCase()} for mental health practices. Compare pricing tiers and see what's actually included.`,
        h1: `${modifier.display} ${category.display} for Mental Health Practices`,
        primaryKeyword: `${modifier.slug} ${category.display.toLowerCase()}`,
        secondaryKeywords: [
          `${modifier.slug} ${category.display.toLowerCase()} for therapists`,
          `${modifier.display.toLowerCase()} ${category.display.toLowerCase()} mental health`,
          `low cost ${category.display.toLowerCase()}`,
        ],
        pageType: "pricing",
        filters: {
          categories: [category.slug],
          priceMax: modifier.slug === "free" ? 0 : modifier.slug === "cheapest" ? 50 : 100,
        },
        relatedPages: [
          `/tools/pricing/${category.slug}/`,
          `/tools/for-clinicians/${mapCategoryToTaxonomy(category.slug)}/`,
        ],
        priority: 0.8,
        estimatedVolume: modifier.slug === "free" ? "high" : "medium",
      });
    }
  }

  return pages;
}

// ============================================================================
// COMPETITOR DISPLACEMENT GENERATORS
// ============================================================================

/**
 * Generate "[Product] Alternatives" pages
 * Captures users ready to switch
 */
export function generateAlternativesPages(productSlugs: string[]): ProgrammaticPageConfig[] {
  return productSlugs.map((slug) => {
    const productName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      slug: `${slug}-alternatives`,
      route: `/tools/for-clinicians/guides/${slug}-alternatives`,
      title: `${productName} Alternatives (2026) - Better Options | HeyPsych`,
      description: `Looking to switch from ${productName}? Compare the best alternatives based on why you're leaving. Find better pricing, features, or workflow fit.`,
      h1: `${productName} Alternatives: Find a Better Fit`,
      primaryKeyword: `${productName.toLowerCase()} alternatives`,
      secondaryKeywords: [
        `switch from ${productName.toLowerCase()}`,
        `${productName.toLowerCase()} competitors`,
        `better than ${productName.toLowerCase()}`,
        `${productName.toLowerCase()} replacement`,
      ],
      pageType: "alternatives",
      filters: {},
      relatedPages: [
        `/tools/for-clinicians/ehr-practice-management/${slug}/`,
      ],
      priority: 0.85,
      estimatedVolume: "high",
    };
  });
}

/**
 * Generate "[Product] Pricing [Year]" pages
 * Captures high-intent pricing research
 */
export function generateProductPricingPages(productSlugs: string[]): ProgrammaticPageConfig[] {
  const year = new Date().getFullYear();

  return productSlugs.map((slug) => {
    const productName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      slug: `${slug}-pricing`,
      route: `/tools/for-clinicians/guides/${slug}-pricing`,
      title: `${productName} Pricing (${year}) - Plans, Costs & Hidden Fees | HeyPsych`,
      description: `${productName} pricing breakdown: monthly costs, annual discounts, add-on fees, and realistic total cost for solo and group practices.`,
      h1: `${productName} Pricing in ${year}: What You'll Actually Pay`,
      primaryKeyword: `${productName.toLowerCase()} pricing`,
      secondaryKeywords: [
        `${productName.toLowerCase()} cost`,
        `${productName.toLowerCase()} price`,
        `how much does ${productName.toLowerCase()} cost`,
        `${productName.toLowerCase()} plans`,
      ],
      pageType: "pricing",
      filters: {},
      relatedPages: [
        `/tools/for-clinicians/ehr-practice-management/${slug}/`,
        `/tools/pricing/mental-health-ehr/`,
      ],
      priority: 0.9,
      estimatedVolume: "high",
    };
  });
}

/**
 * Generate "[Product] vs [Product]" comparison pages
 */
export function generateVsPages(
  comparisons: readonly { readonly a: string; readonly b: string }[]
): ProgrammaticPageConfig[] {
  return comparisons.map(({ a, b }) => {
    const nameA = a.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const nameB = b.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const slug = `${a}-vs-${b}`;

    return {
      slug,
      route: `/tools/compare/${slug}`,
      title: `${nameA} vs ${nameB} (2026) - Which Is Better? | HeyPsych`,
      description: `${nameA} vs ${nameB}: detailed comparison of pricing, features, and who each is best for. See which wins for your practice type.`,
      h1: `${nameA} vs ${nameB}: Which Should You Choose?`,
      primaryKeyword: `${nameA.toLowerCase()} vs ${nameB.toLowerCase()}`,
      secondaryKeywords: [
        `${nameB.toLowerCase()} vs ${nameA.toLowerCase()}`,
        `${nameA.toLowerCase()} or ${nameB.toLowerCase()}`,
        `${nameA.toLowerCase()} compared to ${nameB.toLowerCase()}`,
      ],
      pageType: "comparison",
      filters: {},
      relatedPages: [
        `/tools/for-clinicians/ehr-practice-management/${a}/`,
        `/tools/for-clinicians/ehr-practice-management/${b}/`,
      ],
      priority: 0.9,
      estimatedVolume: "high",
    };
  });
}

// ============================================================================
// MASTER GENERATOR
// ============================================================================

/**
 * Generate ALL programmatic page configurations
 * Returns the full set of pages to be generated
 */
export function generateAllProgrammaticPages(): {
  total: number;
  byType: Record<string, number>;
  pages: ProgrammaticPageConfig[];
} {
  // Top products to generate competitor displacement pages for
  // These get alternatives and pricing pages generated in /tools/for-clinicians/guides/
  const topProducts = [
    // EHR / Practice Management
    "simplepractice",
    "therapynotes",
    "jane-app",
    "theranest",
    "valant",
    "sessions-health",
    "icanotes",
    "cliniko",
    // AI Scribes
    "freed",
    "mentalyc",
    "upheal",
    "nabla",
    "suki-ai",
    "autonotes",
    // Provider Platforms
    "headway",
    "alma-provider-platform",
    "grow-therapy",
    "sondermind-provider-network",
    // Telehealth
    "doxy-me",
    "thera-link",
    // Billing / RCM
    "mentaya",
    "thrizer",
    "heard",
  ];

  const allPages: ProgrammaticPageConfig[] = [
    ...generateBestForProfessionPages(),
    ...generateBestForPracticePages(),
    ...generateFeaturePages(),
    ...generateCompliancePages(),
    ...generatePricePages(),
    ...generateAlternativesPages(topProducts),
    ...generateProductPricingPages(topProducts),
    ...generateVsPages(CLINICIAN_KEY_COMPARISONS),
  ];

  // Calculate stats
  const byType: Record<string, number> = {};
  for (const page of allPages) {
    byType[page.pageType] = (byType[page.pageType] || 0) + 1;
  }

  return {
    total: allPages.length,
    byType,
    pages: allPages,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function mapCategoryToTaxonomy(categorySlug: string): string {
  const mapping: Record<string, string> = {
    "ehr": "ehr-practice-management",
    "practice-management": "ehr-practice-management",
    "ai-scribe": "ai-documentation",
    "telehealth": "telehealth-platforms",
    "billing": "billing-rcm",
    "scheduling": "ehr-practice-management",
    "patient-portal": "ehr-practice-management",
  };
  return mapping[categorySlug] || categorySlug;
}

/**
 * Get high-priority pages for initial implementation
 */
export function getHighPriorityPages(): ProgrammaticPageConfig[] {
  const all = generateAllProgrammaticPages();
  return all.pages
    .filter((p) => p.priority >= 0.85 || p.estimatedVolume === "high")
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get pages for a specific sitemap section
 */
export function getPagesForSitemap(): Array<{ url: string; priority: number; changefreq: string }> {
  const all = generateAllProgrammaticPages();
  return all.pages.map((p) => ({
    url: p.route,
    priority: p.priority,
    changefreq: p.priority >= 0.85 ? "weekly" : "monthly",
  }));
}

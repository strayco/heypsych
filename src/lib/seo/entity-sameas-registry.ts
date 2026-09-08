/**
 * Entity SameAs Registry
 *
 * Maps local entities to their external identifiers for Knowledge Graph optimization.
 * Google uses sameAs links to consolidate entity information across the web.
 *
 * Strategy:
 * 1. Link company entities to their official pages (LinkedIn, Crunchbase, G2)
 * 2. Link product entities to review platforms (G2, Capterra, Software Advice)
 * 3. Link to Wikipedia/Wikidata when available
 * 4. Link to social profiles for brand consolidation
 *
 * This helps Google understand that our SimplePractice page is about the SAME
 * SimplePractice as on G2, LinkedIn, etc. - consolidating authority signals.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EntitySameAs {
  /** Our internal slug */
  slug: string;
  /** Entity type */
  type: "company" | "product" | "person";
  /** External sameAs URLs */
  sameAs: {
    url: string;
    platform: string;
    verified: boolean;
  }[];
  /** Wikidata QID if available */
  wikidataId?: string;
  /** Official website */
  officialUrl?: string;
}

// ============================================================================
// REGISTRY DATA
// ============================================================================

/**
 * Clinician Tool Entity SameAs Registry
 *
 * Manually curated links to external authoritative sources.
 * These are verified links that help Google consolidate entity understanding.
 */
export const CLINICIAN_TOOL_SAMEAS: Record<string, EntitySameAs> = {
  // ============================================================================
  // TOP EHRS
  // ============================================================================
  simplepractice: {
    slug: "simplepractice",
    type: "product",
    officialUrl: "https://www.simplepractice.com",
    sameAs: [
      { url: "https://www.g2.com/products/simplepractice/reviews", platform: "G2", verified: true },
      { url: "https://www.capterra.com/p/155277/SimplePractice/", platform: "Capterra", verified: true },
      { url: "https://www.linkedin.com/company/simplepractice/", platform: "LinkedIn", verified: true },
      { url: "https://www.crunchbase.com/organization/simplepractice", platform: "Crunchbase", verified: true },
      { url: "https://twitter.com/simplepractice", platform: "Twitter", verified: true },
    ],
  },
  therapynotes: {
    slug: "therapynotes",
    type: "product",
    officialUrl: "https://www.therapynotes.com",
    sameAs: [
      { url: "https://www.g2.com/products/therapynotes/reviews", platform: "G2", verified: true },
      { url: "https://www.capterra.com/p/131550/TherapyNotes/", platform: "Capterra", verified: true },
      { url: "https://www.linkedin.com/company/therapynotes/", platform: "LinkedIn", verified: true },
      { url: "https://www.crunchbase.com/organization/therapynotes", platform: "Crunchbase", verified: true },
    ],
  },
  "jane-app": {
    slug: "jane-app",
    type: "product",
    officialUrl: "https://jane.app",
    sameAs: [
      { url: "https://www.g2.com/products/jane-app/reviews", platform: "G2", verified: true },
      { url: "https://www.capterra.com/p/178689/Jane/", platform: "Capterra", verified: true },
      { url: "https://www.linkedin.com/company/janeapp/", platform: "LinkedIn", verified: true },
      { url: "https://www.crunchbase.com/organization/jane-software", platform: "Crunchbase", verified: true },
    ],
  },
  valant: {
    slug: "valant",
    type: "product",
    officialUrl: "https://www.valant.io",
    sameAs: [
      { url: "https://www.g2.com/products/valant/reviews", platform: "G2", verified: true },
      { url: "https://www.capterra.com/p/134046/Valant/", platform: "Capterra", verified: true },
      { url: "https://www.linkedin.com/company/valant/", platform: "LinkedIn", verified: true },
    ],
  },

  // ============================================================================
  // AI SCRIBES
  // ============================================================================
  freed: {
    slug: "freed",
    type: "product",
    officialUrl: "https://www.getfreed.ai",
    sameAs: [
      { url: "https://www.linkedin.com/company/freedai/", platform: "LinkedIn", verified: true },
      { url: "https://www.crunchbase.com/organization/freed-ai", platform: "Crunchbase", verified: true },
      { url: "https://twitter.com/getfreed_ai", platform: "Twitter", verified: true },
    ],
  },
  mentalyc: {
    slug: "mentalyc",
    type: "product",
    officialUrl: "https://www.mentalyc.com",
    sameAs: [
      { url: "https://www.linkedin.com/company/mentalyc/", platform: "LinkedIn", verified: true },
      { url: "https://www.crunchbase.com/organization/mentalyc", platform: "Crunchbase", verified: true },
    ],
  },
  upheal: {
    slug: "upheal",
    type: "product",
    officialUrl: "https://www.upheal.io",
    sameAs: [
      { url: "https://www.linkedin.com/company/upheal/", platform: "LinkedIn", verified: true },
      { url: "https://www.crunchbase.com/organization/upheal", platform: "Crunchbase", verified: true },
    ],
  },

  // ============================================================================
  // TELEHEALTH
  // ============================================================================
  "doxy-me": {
    slug: "doxy-me",
    type: "product",
    officialUrl: "https://doxy.me",
    sameAs: [
      { url: "https://www.g2.com/products/doxy-me/reviews", platform: "G2", verified: true },
      { url: "https://www.capterra.com/p/167523/Doxy-me/", platform: "Capterra", verified: true },
      { url: "https://www.linkedin.com/company/doxy-me/", platform: "LinkedIn", verified: true },
      { url: "https://www.crunchbase.com/organization/doxy-me", platform: "Crunchbase", verified: true },
    ],
  },

  // ============================================================================
  // BILLING / RCM
  // ============================================================================
  headway: {
    slug: "headway",
    type: "product",
    officialUrl: "https://headway.co",
    sameAs: [
      { url: "https://www.linkedin.com/company/headway-mental-health/", platform: "LinkedIn", verified: true },
      { url: "https://www.crunchbase.com/organization/headway-mental-health", platform: "Crunchbase", verified: true },
    ],
  },
};

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get sameAs links for a tool by slug
 */
export function getSameAsLinks(slug: string): string[] {
  const entity = CLINICIAN_TOOL_SAMEAS[slug];
  if (!entity) return [];

  const links: string[] = [];

  // Add official URL
  if (entity.officialUrl) {
    links.push(entity.officialUrl);
  }

  // Add verified external links
  for (const link of entity.sameAs) {
    if (link.verified) {
      links.push(link.url);
    }
  }

  return links;
}

/**
 * Get full entity info by slug
 */
export function getEntityInfo(slug: string): EntitySameAs | null {
  return CLINICIAN_TOOL_SAMEAS[slug] || null;
}

/**
 * Check if we have sameAs data for a tool
 */
export function hasSameAsData(slug: string): boolean {
  return slug in CLINICIAN_TOOL_SAMEAS;
}

/**
 * Get sameAs for schema.org structured data
 * Returns array of URLs for the sameAs property
 */
export function getSameAsForSchema(slug: string): string[] {
  return getSameAsLinks(slug);
}

/**
 * Get Wikidata ID if available (for Knowledge Graph linking)
 */
export function getWikidataId(slug: string): string | null {
  return CLINICIAN_TOOL_SAMEAS[slug]?.wikidataId || null;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Get all tools with sameAs data
 */
export function getAllToolsWithSameAs(): string[] {
  return Object.keys(CLINICIAN_TOOL_SAMEAS);
}

/**
 * Get coverage stats
 */
export function getSameAsCoverage(): {
  total: number;
  withG2: number;
  withCapterra: number;
  withLinkedIn: number;
  withCrunchbase: number;
} {
  const tools = Object.values(CLINICIAN_TOOL_SAMEAS);

  return {
    total: tools.length,
    withG2: tools.filter((t) => t.sameAs.some((s) => s.platform === "G2")).length,
    withCapterra: tools.filter((t) => t.sameAs.some((s) => s.platform === "Capterra")).length,
    withLinkedIn: tools.filter((t) => t.sameAs.some((s) => s.platform === "LinkedIn")).length,
    withCrunchbase: tools.filter((t) => t.sameAs.some((s) => s.platform === "Crunchbase")).length,
  };
}

// ============================================================================
// COMPANY ENTITIES
// ============================================================================

/**
 * Company sameAs data (parent companies of products)
 */
export const COMPANY_SAMEAS: Record<string, EntitySameAs> = {
  "simplepractice-inc": {
    slug: "simplepractice-inc",
    type: "company",
    officialUrl: "https://www.simplepractice.com",
    sameAs: [
      { url: "https://www.linkedin.com/company/simplepractice/", platform: "LinkedIn", verified: true },
      { url: "https://www.crunchbase.com/organization/simplepractice", platform: "Crunchbase", verified: true },
    ],
  },
  "therapynotes-llc": {
    slug: "therapynotes-llc",
    type: "company",
    officialUrl: "https://www.therapynotes.com",
    sameAs: [
      { url: "https://www.linkedin.com/company/therapynotes/", platform: "LinkedIn", verified: true },
    ],
  },
  "freed-ai": {
    slug: "freed-ai",
    type: "company",
    officialUrl: "https://www.getfreed.ai",
    sameAs: [
      { url: "https://www.linkedin.com/company/freedai/", platform: "LinkedIn", verified: true },
      { url: "https://www.crunchbase.com/organization/freed-ai", platform: "Crunchbase", verified: true },
    ],
  },
};

/**
 * Get company sameAs links
 */
export function getCompanySameAs(companySlug: string): string[] {
  const company = COMPANY_SAMEAS[companySlug];
  if (!company) return [];

  const links: string[] = [];
  if (company.officialUrl) links.push(company.officialUrl);
  for (const link of company.sameAs) {
    if (link.verified) links.push(link.url);
  }
  return links;
}

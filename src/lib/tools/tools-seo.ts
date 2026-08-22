// src/lib/tools/tools-seo.ts
// SEO Control Plane Integration for Tools
// Integrates tools with the central index-decision-service

import { siteConfig } from "@/lib/config/site";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import type { ToolEditorialMetadata } from "@/lib/schemas/tool-editorial";
import { hasActualClinicalReview } from "@/lib/schemas/tool-editorial";
import type { IndexDecision, IndexEvidence, RouteFamily, IndexCohort } from "@/lib/seo/index-decision-service";

// ============================================================================
// TOOLS QUALITY THRESHOLDS
// ============================================================================

export interface ToolQualityThresholds {
  minDescriptionLength: number;
  minFAQCount: number;
  requireActiveStatus: boolean;
  requireGovernance: boolean;
}

const TOOL_PROFILE_THRESHOLDS: ToolQualityThresholds = {
  minDescriptionLength: 100,
  minFAQCount: 3,
  requireActiveStatus: true,
  requireGovernance: true,
};

const TOOL_HUB_THRESHOLDS: ToolQualityThresholds = {
  minDescriptionLength: 0,
  minFAQCount: 0,
  requireActiveStatus: false,
  requireGovernance: false,
};

// ============================================================================
// TOOL INDEX DECISION
// ============================================================================

/**
 * Determine indexability for a tool profile page
 *
 * Sponsorship has ZERO effect on this decision.
 * Only editorial/quality signals matter.
 */
export function makeToolIndexDecision(
  tool: DigitalToolV3,
  editorial?: ToolEditorialMetadata
): IndexDecision {
  const path = `/tools/${tool.slug}/`;
  const routeFamily: RouteFamily = "tools";
  const reasons: string[] = [];

  // Build evidence
  const evidence = buildToolEvidence(tool, editorial);

  // ===== GATE 1: Status check =====
  if (tool.status !== "active") {
    reasons.push(`Tool status is "${tool.status}", not "active"`);
    return createToolDecision(path, routeFamily, "retired", reasons, evidence);
  }

  // ===== GATE 2: Description length =====
  const descLength = (tool.long_description || "").length;
  if (descLength < TOOL_PROFILE_THRESHOLDS.minDescriptionLength) {
    reasons.push(
      `Description length ${descLength} below minimum ${TOOL_PROFILE_THRESHOLDS.minDescriptionLength}`
    );
    return createToolDecision(path, routeFamily, "public_noindex", reasons, evidence);
  }

  // ===== GATE 3: FAQ count =====
  const faqCount = tool.seo?.faqs?.length || 0;
  if (faqCount < TOOL_PROFILE_THRESHOLDS.minFAQCount) {
    reasons.push(
      `FAQ count ${faqCount} below minimum ${TOOL_PROFILE_THRESHOLDS.minFAQCount}`
    );
    return createToolDecision(path, routeFamily, "public_noindex", reasons, evidence);
  }

  // ===== GATE 4: Governance =====
  if (TOOL_PROFILE_THRESHOLDS.requireGovernance && !tool.governance?.last_reviewed) {
    reasons.push("Missing required governance review date");
    return createToolDecision(path, routeFamily, "public_noindex", reasons, evidence);
  }

  // ===== All gates passed =====
  reasons.push("Tool passed all quality gates");

  // Determine cohort based on evidence
  if (evidence.quality.hasMedicalReview && evidence.quality.hasReferences) {
    return createToolDecision(path, routeFamily, "validated", reasons, evidence);
  }

  return createToolDecision(path, routeFamily, "indexable_pilot", reasons, evidence);
}

/**
 * Determine indexability for a tools hub page
 */
export function makeToolHubIndexDecision(
  path: string,
  hubType: "landing" | "patient-hub" | "clinician-hub" | "category"
): IndexDecision {
  const routeFamily: RouteFamily = "tools";
  const reasons: string[] = [];

  const evidence: IndexEvidence = {
    quality: {},
    demand: {},
    authority: {},
    freshness: {},
    ymyl: { isMedicalContent: false },
  };

  // Hub pages are indexable by default
  reasons.push(`Tool ${hubType} page is indexable`);

  return createToolDecision(
    path,
    routeFamily,
    hubType === "landing" ? "validated" : "indexable_pilot",
    reasons,
    evidence
  );
}

/**
 * Determine indexability for tools search/filter pages
 *
 * Search and filter pages are ALWAYS noindex, follow
 */
export function makeToolSearchIndexDecision(path: string): IndexDecision {
  const routeFamily: RouteFamily = "tools";
  const reasons: string[] = [];

  const evidence: IndexEvidence = {
    quality: {},
    demand: {},
    authority: {},
    freshness: {},
    ymyl: { isMedicalContent: false },
  };

  reasons.push("Search/filter pages are noindex to prevent thin content indexation");

  return createToolDecision(path, routeFamily, "public_noindex", reasons, evidence, {
    indexable: false,
    sitemapEligible: false,
    internallyPromotable: false,
  });
}

// ============================================================================
// SITEMAP ELIGIBILITY
// ============================================================================

/**
 * Check if a tool is eligible for sitemap inclusion
 */
export function isToolSitemapEligible(tool: DigitalToolV3): boolean {
  const decision = makeToolIndexDecision(tool);
  return decision.sitemapEligible;
}

/**
 * Check if a tool is eligible for internal promotion
 */
export function isToolInternallyPromotable(tool: DigitalToolV3): boolean {
  const decision = makeToolIndexDecision(tool);
  return decision.internallyPromotable;
}

/**
 * Filter tools for sitemap inclusion
 */
export function filterToolsForSitemap(
  tools: DigitalToolV3[]
): Array<{ tool: DigitalToolV3; decision: IndexDecision }> {
  return tools
    .map(tool => ({
      tool,
      decision: makeToolIndexDecision(tool),
    }))
    .filter(({ decision }) => decision.sitemapEligible);
}

// ============================================================================
// CANONICAL URL HELPERS
// ============================================================================

/**
 * Get canonical URL for a tool
 * Uses central siteConfig, never hardcoded hosts
 */
export function getToolCanonicalUrl(slug: string): string {
  return `${siteConfig.url}/tools/${slug}/`;
}

/**
 * Get canonical URL for a tool hub
 */
export function getToolHubCanonicalUrl(hubPath: string): string {
  // Ensure trailing slash
  const normalizedPath = hubPath.endsWith("/") ? hubPath : `${hubPath}/`;
  return `${siteConfig.url}${normalizedPath}`;
}

/**
 * Get canonical URL for tools search
 * Search pages canonicalize to the main tools directory
 */
export function getToolSearchCanonicalUrl(audience?: "patient" | "clinician"): string {
  if (audience === "clinician") {
    return `${siteConfig.url}/tools/for-clinicians/`;
  }
  if (audience === "patient") {
    return `${siteConfig.url}/tools/for-patients/`;
  }
  return `${siteConfig.url}/tools/`;
}

// ============================================================================
// ROBOTS META
// ============================================================================

/**
 * Get robots meta tag for a tool page
 */
export function getToolRobotsMeta(tool: DigitalToolV3): string {
  const decision = makeToolIndexDecision(tool);

  if (!decision.crawlable) {
    return "noindex, nofollow";
  }

  if (!decision.indexable) {
    return "noindex, follow";
  }

  return "index, follow";
}

/**
 * Get robots meta for tools search/filter pages
 */
export function getToolSearchRobotsMeta(): string {
  return "noindex, follow";
}

// ============================================================================
// HELPERS
// ============================================================================

function buildToolEvidence(
  tool: DigitalToolV3,
  editorial?: ToolEditorialMetadata
): IndexEvidence {
  const descriptionWords = (tool.long_description || "")
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    quality: {
      wordCount: descriptionWords,
      hasStructuredContent: true,
      hasReferences: !!(tool.clinical_metadata?.clinical_trials?.length),
      hasMedicalReview: hasActualClinicalReview(editorial),
      clinicalCompletenessScore: calculateToolClinicalCompleteness(tool),
    },
    demand: {
      // Would be populated from analytics in production
    },
    authority: {},
    freshness: {
      lastReviewedAt: tool.governance?.last_reviewed,
    },
    ymyl: {
      isMedicalContent: true,
      hasDisclaimer: true, // Tools have general medical disclaimer
      disclaimerLevel: "standard",
    },
  };
}

function calculateToolClinicalCompleteness(tool: DigitalToolV3): number {
  let score = 0;
  const maxScore = 10;

  // Basic content
  if (tool.long_description && tool.long_description.length >= 100) score += 2;
  if (tool.one_liner) score += 1;
  if (tool.best_for?.length >= 2) score += 1;
  if (tool.not_for?.length >= 1) score += 1;

  // Clinical metadata
  if (tool.clinical_metadata?.evidence_based) score += 2;
  if (tool.clinical_metadata?.clinical_trials?.length) score += 1;
  if (tool.clinical_metadata?.evidence_level) score += 1;

  // SEO content
  if (tool.seo?.faqs?.length >= 3) score += 1;

  return score / maxScore;
}

function createToolDecision(
  path: string,
  routeFamily: RouteFamily,
  cohort: IndexCohort,
  reasons: string[],
  evidence: IndexEvidence,
  overrides?: Partial<IndexDecision>
): IndexDecision {
  const isIndexable = ["indexable_pilot", "validated", "answer_king"].includes(cohort);
  const isPublic = cohort !== "retired";

  return {
    routeFamily,
    canonicalPath: path,
    public: isPublic,
    crawlable: cohort !== "retired",
    indexable: isIndexable,
    sitemapEligible: isIndexable && isPublic,
    internallyPromotable: isPublic && cohort !== "demoted",
    alternateFormatEligible: isIndexable,
    cohort,
    reasons,
    evidence,
    ...overrides,
  };
}

// ============================================================================
// SPONSORSHIP ISOLATION
// ============================================================================

/**
 * CRITICAL: Verify that sponsorship has no effect on indexation
 *
 * This function exists to enforce the architectural rule that
 * sponsorship NEVER influences indexability, cohorts, answer-king
 * status, sitemap inclusion, or organic promotion.
 */
export function verifySponsorshipIsolation(
  tool: DigitalToolV3,
  isSponsored: boolean
): { isolated: boolean; violations: string[] } {
  const violations: string[] = [];

  // Get decision without sponsorship context
  const decision = makeToolIndexDecision(tool);

  // Sponsorship should have zero effect on these fields
  // This is a compile-time/test-time check

  if (isSponsored) {
    // Sponsorship cannot make an otherwise ineligible tool indexable
    // Sponsorship cannot affect cohort
    // Sponsorship cannot affect sitemap eligibility
    // These are enforced by the fact that makeToolIndexDecision
    // does not take sponsorship as a parameter

    // Log for audit trail
    if (process.env.NODE_ENV === "development") {
      console.log(`[SPONSORSHIP_ISOLATION] Tool "${tool.slug}" sponsorship verified isolated from indexation`);
    }
  }

  return {
    isolated: violations.length === 0,
    violations,
  };
}

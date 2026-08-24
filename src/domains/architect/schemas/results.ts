/**
 * Engine Result Types
 *
 * Output types from the deterministic scoring engines.
 * These are pure data structures consumed by UI components.
 */

import { z } from "zod";
import { CapabilityIdZ, type CapabilityId, type LifecycleStageId } from "./lifecycle";
import { type CapabilityStrength, type ProvenanceStatus } from "./product-metadata";
import { type RelevanceLevel } from "./stack";

// ============================================================================
// FIT SCORE RESULT
// ============================================================================

export const FitDimensionZ = z.enum([
  "hard-requirements",
  "capability-alignment",
  "practice-type-size",
  "clinical-payer-fit",
  "stack-integration",
  "priorities",
  "cost-fit",
]);

export type FitDimension = z.infer<typeof FitDimensionZ>;

export const FIT_DIMENSION_WEIGHTS: Record<FitDimension, number> = {
  "hard-requirements": 25,
  "capability-alignment": 20,
  "practice-type-size": 15,
  "clinical-payer-fit": 15,
  "stack-integration": 10,
  "priorities": 10,
  "cost-fit": 5,
};

export const FIT_DIMENSION_LABELS: Record<FitDimension, string> = {
  "hard-requirements": "Hard requirements",
  "capability-alignment": "Capability alignment",
  "practice-type-size": "Practice type & size",
  "clinical-payer-fit": "Clinical & payer fit",
  "stack-integration": "Stack integration",
  "priorities": "Your priorities",
  "cost-fit": "Cost fit",
};

export type FitContribution = {
  dimension: FitDimension;
  weight: number;
  score: number; // 0-1
  evidence: "match" | "partial" | "mismatch" | "unknown";
  reasons: string[];
  provenance?: ProvenanceStatus;
};

export type FitResult = {
  productSlug: string;
  score: number | null; // 0-100, null if insufficient data (alias: fitScore)
  fitScore: number | null; // 0-100, null if insufficient data
  dataConfidence: number; // 0-100
  organicRankingValue: number | null; // For sorting, not display
  contributions: FitContribution[];
  hasHardIncompatibility: boolean;
  incompatibilityReason?: string;
  isLimitedData: boolean;
  isInsufficientData: boolean;
};

// ============================================================================
// COVERAGE RESULT
// ============================================================================

export type CoverageStatus = "unknown" | "missing" | "partial" | "covered" | "strong";

export const COVERAGE_STATUS_LABELS: Record<CoverageStatus, string> = {
  "unknown": "Unknown",
  "missing": "Not covered",
  "partial": "Partial",
  "covered": "Covered",
  "strong": "Strong",
};

export type CapabilityCoverage = {
  capabilityId: CapabilityId;
  status: CoverageStatus;
  numericValue: number; // 0-1
  coveringProducts: Array<{
    slug: string;
    strength: CapabilityStrength;
    isCore: boolean;
    limitation?: string;
  }>;
  relevance: RelevanceLevel;
  isGap: boolean;
  isDataGap: boolean;
};

export type StageCoverage = {
  stageId: LifecycleStageId;
  capabilities: CapabilityCoverage[];
  coverageScore: number; // 0-100
  relevantCapabilityCount: number;
  coveredCount: number;
  partialCount: number;
  missingCount: number;
  unknownCount: number;
};

export type StackCoverageResult = {
  stages: StageCoverage[];
  overallScore: number; // 0-100
  overallConfidence: number; // 0-100
  gaps: CapabilityCoverage[];
  dataGaps: CapabilityCoverage[];
  // Convenience accessors
  capabilityCoverage: CapabilityCoverage[]; // All capability coverage items
  knownCoveragePercent: number; // 0-100
  gapCapabilities: CapabilityId[]; // Just the IDs of gap capabilities
};

// ============================================================================
// OVERLAP RESULT
// ============================================================================

export type OverlapClassification =
  | "useful-specialization"
  | "benign-overlap"
  | "probable-redundancy";

export const OVERLAP_CLASSIFICATION_LABELS: Record<OverlapClassification, string> = {
  "useful-specialization": "Useful specialization",
  "benign-overlap": "Benign overlap",
  "probable-redundancy": "Probable redundancy",
};

export type OverlapAssessment = {
  capabilityId: CapabilityId;
  products: Array<{
    slug: string;
    strength: CapabilityStrength;
    differentiators?: string[];
  }>;
  // Convenience aliases for two-product comparisons
  productA: string;
  productB: string;
  classification: OverlapClassification;
  explanation: string;
  provenance: ProvenanceStatus;
};

// ============================================================================
// COMPATIBILITY RESULT
// ============================================================================

export type CompatibilityStatus = "compatible" | "concern" | "incompatible" | "unknown";

export const COMPATIBILITY_STATUS_LABELS: Record<CompatibilityStatus, string> = {
  "compatible": "Compatible",
  "concern": "Potential concern",
  "incompatible": "Incompatible",
  "unknown": "Unknown",
};

export type CompatibilityAssessment = {
  sourceSlug: string;
  targetSlug: string;
  // Aliases for component usage
  productA: string;
  productB: string;
  status: CompatibilityStatus;
  integrationType?: string;
  direction?: "one-way" | "bidirectional";
  notes?: string;
  provenance: ProvenanceStatus;
  lastVerified?: string;
};

// ============================================================================
// COST ESTIMATE
// ============================================================================

export type CostEstimate = {
  // Known costs
  knownMinMonthlyCents: number | null;
  knownMaxMonthlyCents: number | null;
  knownMinAnnualCents: number | null;
  knownMaxAnnualCents: number | null;

  // Per-clinician costs (when calculable)
  perClinicianMinMonthlyCents: number | null;
  perClinicianMaxMonthlyCents: number | null;

  // Counts
  productCount: number;
  knownPricingCount: number;
  unknownPricingCount: number;
  customQuoteCount: number;

  // Assumptions
  assumptions: string[];

  // Individual product costs
  productCosts: Array<{
    slug: string;
    minMonthlyCents: number | null;
    maxMonthlyCents: number | null;
    basis: string;
    isEstimate: boolean;
    requiresQuote: boolean;
    notes?: string;
  }>;
};

// ============================================================================
// STACK HEALTH RESULT
// ============================================================================

export type HealthSubscore = {
  name: string;
  score: number; // 0-100
  weight: number;
  contribution: number; // Weighted contribution to total
  explanation: string;
  issues?: string[];
  opportunities?: string[];
  hasData?: boolean;
};

export type StackHealthResult = {
  // Overall
  overallScore: number; // 0-100
  healthLevel: "excellent" | "good" | "fair" | "poor";
  summary: string;

  // Subscores array
  subscores: HealthSubscore[];

  // Top concerns for quick display
  topConcerns: string[];

  // Optional legacy structure
  overallConfidence?: number;
  isLimitedData?: boolean;
  importantGapCount?: number;
  overlapByClass?: Record<OverlapClassification, number>;
  compatibilityConcernCount?: number;
  optimizationOpportunityCount?: number;
  automationObservations?: string[];
  scalabilityObservations?: string[];
};

// ============================================================================
// SHORTLIST RESULT
// ============================================================================

export type ShortlistGroup =
  | "best-fit"
  | "works-with-stack"
  | "specialized"
  | "already-covered";

export const SHORTLIST_GROUP_LABELS: Record<ShortlistGroup, string> = {
  "best-fit": "Best fit",
  "works-with-stack": "Works with your stack",
  "specialized": "Specialized options",
  "already-covered": "Already in stack",
};

export type ShortlistItem = {
  slug: string;
  group: ShortlistGroup;
  fitScore: number | null;
  dataConfidence: number;
  organicRank: number;
  fitReasons: string[];
  price?: string;
  idealSize?: string;
  coverageBreadth: number; // Number of capabilities covered
  integrationStatus?: "native" | "api" | "third-party" | "none" | "unknown";
  isVerified: boolean;
  isLimitedData: boolean;
};

export type ShortlistResult = {
  capabilityId: CapabilityId;
  items: ShortlistItem[];
  totalQualified: number;
  sponsoredItems: ShortlistItem[]; // Separate, labeled unit
};

// ============================================================================
// REPLACEMENT PREVIEW
// ============================================================================

export type ReplacementPreview = {
  currentSlug: string;
  replacementSlug: string;

  // Score changes
  currentFitScore: number | null;
  replacementFitScore: number | null;
  fitScoreChange: number | null;

  // Capability changes
  capabilitiesGained: CapabilityId[];
  capabilitiesLost: CapabilityId[];
  capabilitiesMaintained: CapabilityId[];

  // Cost changes
  currentMonthlyCost: number | null;
  replacementMonthlyCost: number | null;
  costChange: number | null;

  // Integration changes
  integrationsGained: string[];
  integrationsLost: string[];

  // Overlap changes
  overlapRemoved: OverlapAssessment[];
  overlapIntroduced: OverlapAssessment[];

  // New gaps
  newGaps: CapabilityId[];

  // Complexity
  implementationComplexity?: "low" | "medium" | "high" | "enterprise" | "unknown";
  migrationComplexity?: "low" | "medium" | "high" | "unknown";
  migrationNotes?: string;
};

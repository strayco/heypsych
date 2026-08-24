/**
 * Product Architecture Metadata Schema
 *
 * Defines the Architect-specific metadata layer that sits on top of
 * the canonical V4 clinician tool schema. This adds:
 * - Detailed capability mapping with strength and provenance
 * - Product-to-product integration details
 * - Practice fit evidence
 * - Structured pricing for calculations
 */

import { z } from "zod";
import { CapabilityIdZ, type CapabilityId } from "./lifecycle";
import {
  PracticeTypeZ,
  PracticeSizeBucketZ,
  ClinicalRoleZ,
  PayerTypeZ,
  PrescribingLevelZ,
  DeliveryModelZ,
  USStateZ,
} from "./fingerprint";

// ============================================================================
// PROVENANCE STATUS
// ============================================================================

/**
 * Provenance indicates the source and verification level of a fact.
 * Aligned with existing V4 editorial vocabulary.
 */
export const ProvenanceStatusZ = z.enum([
  "verified",          // Confirmed by HeyPsych editorial review
  "vendor_provided",   // Claimed by vendor, not independently verified
  "public_source",     // From public documentation, website, or press
  "unverified",        // Added without verification
  "unknown",           // No source information available
]);

export type ProvenanceStatus = z.infer<typeof ProvenanceStatusZ>;

// ============================================================================
// CAPABILITY STRENGTH
// ============================================================================

/**
 * Strength indicates how well a product covers a capability.
 */
export const CapabilityStrengthZ = z.enum([
  "core",             // Primary, deeply integrated feature (1.0)
  "strong",           // Full-featured capability (0.8)
  "partial",          // Limited or basic coverage (0.5)
  "addon",            // Available as paid add-on (0.35)
  "integration-only", // Only via third-party integration (0.2)
]);

export type CapabilityStrength = z.infer<typeof CapabilityStrengthZ>;

export const CAPABILITY_STRENGTH_VALUES: Record<CapabilityStrength, number> = {
  "core": 1.0,
  "strong": 0.8,
  "partial": 0.5,
  "addon": 0.35,
  "integration-only": 0.2,
};

export const CAPABILITY_STRENGTH_LABELS: Record<CapabilityStrength, string> = {
  "core": "Core feature",
  "strong": "Full coverage",
  "partial": "Partial coverage",
  "addon": "Paid add-on",
  "integration-only": "Via integration",
};

// ============================================================================
// PRODUCT CAPABILITY MAPPING
// ============================================================================

export const ProductCapabilityZ = z.object({
  // Product slug is optional when nested inside ProductArchitectureMetadata
  productSlug: z.string().optional(),
  capabilityId: CapabilityIdZ,
  strength: CapabilityStrengthZ,

  // Pricing context
  includedInBase: z.boolean().optional().default(true),
  requiresAddon: z.boolean().optional().default(false),
  addonPriceCents: z.number().int().nonnegative().optional(),

  // Limitations and notes
  limitation: z.string().optional(),
  notes: z.string().optional(),

  // Provenance
  provenance: ProvenanceStatusZ.optional().default("unknown"),
  sourceUrl: z.string().url().optional(),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type ProductCapability = z.infer<typeof ProductCapabilityZ>;
export type ProductCapabilityInput = z.input<typeof ProductCapabilityZ>;

// ============================================================================
// PRODUCT INTEGRATION
// ============================================================================

export const IntegrationTypeZ = z.enum([
  "native",           // Built-in, first-party integration
  "api",              // API-based integration
  "third-party",      // Via third-party connector (e.g., Zapier, Health Gorilla)
  "browser-extension",// Browser extension or plugin
  "import-export",    // File-based import/export
  "manual",           // Manual data transfer required
  "incompatible",     // Known to not work together
  "unknown",          // Integration status unknown
]);

export type IntegrationType = z.infer<typeof IntegrationTypeZ>;

export const IntegrationDirectionZ = z.enum([
  "one-way",
  "bidirectional",
]);

export type IntegrationDirection = z.infer<typeof IntegrationDirectionZ>;

export const ProductIntegrationZ = z.object({
  // Source slug is optional when nested inside ProductArchitectureMetadata
  sourceSlug: z.string().optional(),
  targetSlug: z.string(),
  type: IntegrationTypeZ,
  direction: IntegrationDirectionZ.optional().default("one-way"),
  notes: z.string().optional(),
  provenance: ProvenanceStatusZ.optional().default("unknown"),
  sourceUrl: z.string().url().optional(),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type ProductIntegration = z.infer<typeof ProductIntegrationZ>;
export type ProductIntegrationInput = z.input<typeof ProductIntegrationZ>;

// ============================================================================
// PRACTICE FIT EVIDENCE
// ============================================================================

/**
 * Evidence that a product fits specific practice characteristics
 */
export const PracticeFitEvidenceZ = z.object({
  // Product slug is optional when nested inside ProductArchitectureMetadata
  productSlug: z.string().optional(),

  // Practice type fit
  practiceTypes: z.array(PracticeTypeZ).optional().default([]),
  practiceTypesExcluded: z.array(PracticeTypeZ).optional().default([]),

  // Size fit
  minSize: PracticeSizeBucketZ.optional(),
  maxSize: PracticeSizeBucketZ.optional(),
  idealSizes: z.array(PracticeSizeBucketZ).optional().default([]),

  // Role fit
  clinicalRoles: z.array(ClinicalRoleZ).optional().default([]),
  clinicalRolesExcluded: z.array(ClinicalRoleZ).optional().default([]),

  // Payer fit
  payerTypes: z.array(PayerTypeZ).optional().default([]),
  payerTypesExcluded: z.array(PayerTypeZ).optional().default([]),

  // Prescribing fit
  prescribingLevels: z.array(PrescribingLevelZ).optional().default([]),

  // Delivery fit
  deliveryModels: z.array(DeliveryModelZ).optional().default([]),

  // Geographic fit
  statesSupported: z.array(USStateZ).optional().default([]),
  statesExcluded: z.array(USStateZ).optional().default([]),
  supportsMultiState: z.boolean().optional(),

  // Implementation context
  implementationComplexity: z.enum(["low", "medium", "high", "enterprise"]).optional(),
  typicalImplementationDays: z.number().int().nonnegative().optional(),
  migrationComplexity: z.enum(["low", "medium", "high", "unknown"]).optional(),
  dataExportSupported: z.boolean().optional(),

  // Notes
  idealFor: z.array(z.string()).optional().default([]),
  notIdealFor: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),

  // Provenance
  provenance: ProvenanceStatusZ.optional().default("unknown"),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type PracticeFitEvidence = z.infer<typeof PracticeFitEvidenceZ>;
export type PracticeFitEvidenceInput = z.input<typeof PracticeFitEvidenceZ>;

// ============================================================================
// STRUCTURED PRICING
// ============================================================================

export const PricingBasisZ = z.enum([
  "per-provider-month",
  "per-provider-year",
  "per-practice-month",
  "per-practice-year",
  "per-location-month",
  "per-location-year",
  "per-encounter",
  "per-transaction",
  "percentage-collections",
  "flat-monthly",
  "flat-annual",
  "custom-quote",
  "freemium",
  "free",
]);

export type PricingBasis = z.infer<typeof PricingBasisZ>;

export const CurrencyZ = z.enum(["USD", "CAD", "GBP", "EUR", "AUD"]);
export type Currency = z.infer<typeof CurrencyZ>;

export const PricingTierZ = z.object({
  name: z.string().optional(),
  minUnits: z.number().int().nonnegative().optional(),
  maxUnits: z.number().int().positive().optional(),
  pricePerUnitCents: z.number().int().nonnegative().optional(),
  flatPriceCents: z.number().int().nonnegative().optional(),
  percentageRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export type PricingTier = z.infer<typeof PricingTierZ>;

export const StructuredPricingZ = z.object({
  productSlug: z.string().optional(),
  basis: PricingBasisZ,
  currency: CurrencyZ.optional().default("USD"),

  // Simple pricing
  minPriceCents: z.number().int().nonnegative().optional(),
  maxPriceCents: z.number().int().nonnegative().optional(),
  typicalPriceCents: z.number().int().nonnegative().optional(),

  // Tiered pricing
  tiers: z.array(PricingTierZ).optional().default([]),

  // Additional costs
  implementationFeeCents: z.number().int().nonnegative().optional(),
  minimumCommitmentMonths: z.number().int().positive().optional(),

  // Free options
  freeTierAvailable: z.boolean().optional().default(false),
  freeTrialDays: z.number().int().nonnegative().optional(),

  // Context
  requiresQuote: z.boolean().optional().default(false),
  priceDisplayText: z.string().optional(), // e.g., "Starting at $99/provider/month"
  assumptions: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),

  // Provenance
  provenance: ProvenanceStatusZ.optional().default("unknown"),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type StructuredPricing = z.infer<typeof StructuredPricingZ>;
export type StructuredPricingInput = z.input<typeof StructuredPricingZ>;

// ============================================================================
// PRODUCT ARCHITECTURE METADATA
// ============================================================================

export const CapabilityMapStatusZ = z.enum([
  "reviewed-complete",   // All capabilities have been reviewed and mapped
  "reviewed-partial",    // Some capabilities mapped, others pending
  "unreviewed",          // Not yet reviewed for Architect
]);

export type CapabilityMapStatus = z.infer<typeof CapabilityMapStatusZ>;

export const ProductArchitectureMetadataZ = z.object({
  productSlug: z.string(),

  // Capability mapping status
  capabilityMapStatus: CapabilityMapStatusZ.optional().default("unreviewed"),
  capabilityMapLastReviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  // Individual capability mappings
  capabilities: z.array(ProductCapabilityZ).optional().default([]),

  // Integration mappings
  integrations: z.array(ProductIntegrationZ).optional().default([]),

  // Practice fit evidence
  fitEvidence: PracticeFitEvidenceZ.optional(),

  // Structured pricing
  pricing: StructuredPricingZ.optional(),

  // Metadata
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type ProductArchitectureMetadata = z.infer<typeof ProductArchitectureMetadataZ>;
export type ProductArchitectureMetadataInput = z.input<typeof ProductArchitectureMetadataZ>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get capability strength value
 */
export function getStrengthValue(strength: CapabilityStrength): number {
  return CAPABILITY_STRENGTH_VALUES[strength];
}

/**
 * Get coverage status from strength value
 */
export function getCoverageFromStrength(strength: CapabilityStrength): "strong" | "covered" | "partial" {
  const value = CAPABILITY_STRENGTH_VALUES[strength];
  if (value >= 0.9) return "strong";
  if (value >= 0.75) return "covered";
  return "partial";
}

/**
 * Check if a product capability provides core or strong coverage
 */
export function isStrongCoverage(capability: ProductCapability): boolean {
  return capability.strength === "core" || capability.strength === "strong";
}

/**
 * Create empty product architecture metadata
 */
export function createEmptyMetadata(productSlug: string): ProductArchitectureMetadata {
  return {
    productSlug,
    capabilityMapStatus: "unreviewed",
    capabilities: [],
    integrations: [],
  };
}

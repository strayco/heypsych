// src/lib/schemas/tool-editorial.ts
// Editorial Status Model for Tools
// Provides truthful labeling about review depth without implying uniform review

import { z } from "zod";

// ============================================================================
// EDITORIAL STATUS TYPES
// ============================================================================

/**
 * Editorial status levels for tools
 *
 * listing: Basic directory entry, information may be from public sources
 * vendor_verified: Vendor has verified their own information
 * facts_verified: Key facts have been independently verified
 * editorially_reviewed: Full editorial review completed
 * clinically_reviewed: Clinical review by qualified professional
 * privacy_reviewed: Privacy assessment completed
 */
export const ToolEditorialStatusZ = z.enum([
  "listing",
  "vendor_verified",
  "facts_verified",
  "editorially_reviewed",
  "clinically_reviewed",
  "privacy_reviewed",
]);

/**
 * Verification status for specific facts
 */
export const VerificationStatusZ = z.enum([
  "verified",
  "vendor_provided",
  "public_source",
  "unverified",
  "unknown",
]);

/**
 * Uncertainty-aware boolean values
 */
export const UncertaintyBooleanZ = z.enum([
  "yes",
  "no",
  "unknown",
  "not_applicable",
]);

// ============================================================================
// FIELD-LEVEL PROVENANCE
// ============================================================================

/**
 * Provenance for a verified fact
 */
export const FactProvenanceZ = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]),
  status: VerificationStatusZ,
  source_url: z.string().url().optional(),
  verified_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  verified_by: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Editorial metadata for a tool
 *
 * This is an OPTIONAL extension to the base DigitalToolV3 schema.
 * Tools without this metadata default to "listing" status.
 */
export const ToolEditorialMetadataZ = z.object({
  // Overall status - highest level of review completed
  status: ToolEditorialStatusZ.default("listing"),

  // Multiple review dimensions may be completed
  reviews_completed: z.array(ToolEditorialStatusZ).optional(),

  // When was the editorial review last performed
  last_editorial_review: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  editorial_reviewer: z.string().optional(),

  // When was clinical review performed (if applicable)
  last_clinical_review: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  clinical_reviewer: z.string().optional(),
  clinical_reviewer_credentials: z.string().optional(),

  // When was privacy review performed (if applicable)
  last_privacy_review: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  // Field-level provenance for key facts
  provenance: z.object({
    pricing: FactProvenanceZ.optional(),
    hipaa_compliant: FactProvenanceZ.optional(),
    baa_available: FactProvenanceZ.optional(),
    data_sharing: FactProvenanceZ.optional(),
    fda_status: FactProvenanceZ.optional(),
    insurance_coverage: FactProvenanceZ.optional(),
    integrations: FactProvenanceZ.optional(),
    clinical_evidence: FactProvenanceZ.optional(),
  }).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ToolEditorialStatus = z.infer<typeof ToolEditorialStatusZ>;
export type VerificationStatus = z.infer<typeof VerificationStatusZ>;
export type UncertaintyBoolean = z.infer<typeof UncertaintyBooleanZ>;
export type FactProvenance = z.infer<typeof FactProvenanceZ>;
export type ToolEditorialMetadata = z.infer<typeof ToolEditorialMetadataZ>;

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get user-facing label for editorial status
 */
export function getEditorialStatusLabel(status: ToolEditorialStatus): string {
  const labels: Record<ToolEditorialStatus, string> = {
    listing: "Listing information",
    vendor_verified: "Vendor-provided information",
    facts_verified: "Facts verified",
    editorially_reviewed: "Editorially reviewed",
    clinically_reviewed: "Clinically reviewed",
    privacy_reviewed: "Privacy reviewed",
  };
  return labels[status] || "Listing information";
}

/**
 * Get description for editorial status
 */
export function getEditorialStatusDescription(status: ToolEditorialStatus): string {
  const descriptions: Record<ToolEditorialStatus, string> = {
    listing: "Basic listing compiled from public sources",
    vendor_verified: "Information provided and verified by the vendor",
    facts_verified: "Key facts independently verified",
    editorially_reviewed: "Full editorial review by HeyPsych team",
    clinically_reviewed: "Clinical review by qualified professional",
    privacy_reviewed: "Privacy and security assessment completed",
  };
  return descriptions[status] || descriptions.listing;
}

/**
 * Check if tool has clinical review
 * Does NOT return true for basic "Reviewed by HeyPsych Board" governance
 * which is a baseline requirement, not clinical review evidence
 */
export function hasActualClinicalReview(editorial?: ToolEditorialMetadata): boolean {
  if (!editorial) return false;

  // Must have explicit clinical review metadata
  return !!(
    editorial.status === "clinically_reviewed" ||
    editorial.reviews_completed?.includes("clinically_reviewed") ||
    (editorial.last_clinical_review && editorial.clinical_reviewer)
  );
}

/**
 * Get display badges for tool based on editorial status
 */
export function getEditorialBadges(editorial?: ToolEditorialMetadata): string[] {
  const badges: string[] = [];

  if (!editorial) return badges;

  const completedReviews = editorial.reviews_completed || [editorial.status];

  if (completedReviews.includes("clinically_reviewed")) {
    badges.push("Clinically Reviewed");
  }
  if (completedReviews.includes("privacy_reviewed")) {
    badges.push("Privacy Reviewed");
  }
  if (completedReviews.includes("editorially_reviewed")) {
    badges.push("Editorially Reviewed");
  }
  if (completedReviews.includes("facts_verified")) {
    badges.push("Facts Verified");
  }

  return badges;
}

/**
 * Check if a fact has been verified
 */
export function isFactVerified(provenance?: FactProvenance): boolean {
  return provenance?.status === "verified";
}

/**
 * Get provenance display text
 */
export function getProvenanceLabel(status: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    verified: "Verified",
    vendor_provided: "Vendor-provided",
    public_source: "Public source",
    unverified: "Unverified",
    unknown: "Unknown",
  };
  return labels[status] || "Unknown";
}

// ============================================================================
// COMPLIANCE VALUE HELPERS
// ============================================================================

/**
 * Compliance value can be boolean (legacy) or UncertaintyBoolean (new)
 */
export type ComplianceValue = boolean | UncertaintyBoolean;

/**
 * Check if a compliance value indicates confirmed YES
 */
export function isComplianceConfirmedYes(value: ComplianceValue | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === "boolean") return value === true;
  return value === "yes";
}

/**
 * Check if a compliance value indicates confirmed NO
 */
export function isComplianceConfirmedNo(value: ComplianceValue | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === "boolean") return value === false;
  return value === "no";
}

/**
 * Check if a compliance value is unknown
 */
export function isComplianceUnknown(value: ComplianceValue | undefined): boolean {
  if (value === undefined) return true; // undefined = unknown
  if (typeof value === "boolean") return false; // booleans are always definite
  return value === "unknown";
}

/**
 * Check if compliance is not applicable
 */
export function isComplianceNotApplicable(value: ComplianceValue | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === "boolean") return false;
  return value === "not_applicable";
}

/**
 * Get display text for compliance value
 */
export function getComplianceDisplayText(value: ComplianceValue | undefined): string {
  if (value === undefined || isComplianceUnknown(value)) return "Unknown";
  if (isComplianceConfirmedYes(value)) return "Yes";
  if (isComplianceConfirmedNo(value)) return "No";
  if (isComplianceNotApplicable(value)) return "N/A";
  return "Unknown";
}

/**
 * Get HIPAA badge variant based on compliance value
 * Returns: "compliant" | "not_compliant" | "unknown" | "not_applicable" | null
 */
export function getHipaaBadgeVariant(
  value: ComplianceValue | undefined
): "compliant" | "not_compliant" | "unknown" | "not_applicable" | null {
  if (isComplianceConfirmedYes(value)) return "compliant";
  if (isComplianceConfirmedNo(value)) return "not_compliant";
  if (isComplianceUnknown(value)) return "unknown";
  if (isComplianceNotApplicable(value)) return "not_applicable";
  return null;
}

/**
 * Commercial Relationship Schema
 *
 * Phase 6: Truthful commercial attribution for affiliate and sponsored links.
 *
 * DESIGN PRINCIPLES:
 * - Commercial relationships MUST NOT influence organic rankings
 * - All compensated actions require visible disclosure
 * - Kill switches allow disabling commercial links per-partner or globally
 */

import { z } from "zod";

// ============================================================================
// COMMERCIAL STATUS
// ============================================================================

/**
 * Commercial relationship classification
 */
export const CommercialStatusZ = z.enum([
  "active_affiliate",    // Verified commission agreement in effect
  "inactive_affiliate",  // Previously had agreement, no longer active
  "direct_link",         // No commission, just vendor URL
  "sponsored",           // Paid placement (separate from affiliate)
  "unknown",             // Not yet classified
]);

export type CommercialStatus = z.infer<typeof CommercialStatusZ>;

/**
 * Human-readable labels for commercial status
 */
export const COMMERCIAL_STATUS_LABELS: Record<CommercialStatus, string> = {
  active_affiliate: "Affiliate Partner",
  inactive_affiliate: "Former Partner",
  direct_link: "Direct Link",
  sponsored: "Sponsored",
  unknown: "Not Classified",
};

/**
 * Whether a status indicates active commercial compensation
 */
export function isCompensated(status: CommercialStatus): boolean {
  return status === "active_affiliate" || status === "sponsored";
}

// ============================================================================
// DISCLOSURE REQUIREMENTS
// ============================================================================

/**
 * Disclosure type for different commercial contexts
 */
export const DisclosureTypeZ = z.enum([
  "affiliate",           // Standard affiliate disclosure
  "sponsored_placement", // Paid placement disclosure
  "sponsored_content",   // Sponsored content (future)
  "none",                // No disclosure needed
]);

export type DisclosureType = z.infer<typeof DisclosureTypeZ>;

/**
 * Determine required disclosure type based on commercial status
 */
export function getRequiredDisclosure(status: CommercialStatus): DisclosureType {
  switch (status) {
    case "active_affiliate":
      return "affiliate";
    case "sponsored":
      return "sponsored_placement";
    case "inactive_affiliate":
    case "direct_link":
    case "unknown":
    default:
      return "none";
  }
}

// ============================================================================
// KILL SWITCH CONFIGURATION
// ============================================================================

/**
 * Kill switch configuration for commercial links
 *
 * This allows disabling affiliate/commercial links:
 * - Globally: Disable all commercial links site-wide
 * - Per-partner: Disable specific partners (e.g., during contract renegotiation)
 * - Per-product: Disable commercial links for specific products
 */
export const CommercialKillSwitchZ = z.object({
  // Global kill switch - disables ALL commercial links
  globalDisabled: z.boolean().default(false),

  // Partners whose affiliate links are currently disabled
  disabledPartners: z.array(z.string()).default([]),

  // Products whose affiliate links are currently disabled
  disabledProducts: z.array(z.string()).default([]),

  // Optional reason for audit trail
  disableReason: z.string().optional(),

  // When the kill switch was last updated
  updatedAt: z.string().datetime().optional(),
});

export type CommercialKillSwitch = z.infer<typeof CommercialKillSwitchZ>;

/**
 * Check if commercial links are enabled for a given product
 */
export function isCommercialEnabled(
  config: CommercialKillSwitch,
  productSlug: string,
  partnerSlug?: string
): boolean {
  // Global kill switch
  if (config.globalDisabled) {
    return false;
  }

  // Per-product disable
  if (config.disabledProducts.includes(productSlug)) {
    return false;
  }

  // Per-partner disable
  if (partnerSlug && config.disabledPartners.includes(partnerSlug)) {
    return false;
  }

  return true;
}

// ============================================================================
// COMMERCIAL METADATA
// ============================================================================

/**
 * Full commercial metadata for a product
 */
export const CommercialMetadataZ = z.object({
  // Current commercial status
  status: CommercialStatusZ.default("unknown"),

  // Affiliate/partner network (if applicable)
  partnerNetwork: z.string().optional(), // e.g., "impact", "cj", "shareasale"

  // Partner slug for kill switch matching
  partnerSlug: z.string().optional(),

  // Commission type (for internal reference, not displayed)
  commissionType: z.enum([
    "cpa",          // Cost per acquisition
    "revenue_share", // Percentage of sale
    "flat_rate",    // Fixed amount per referral
    "hybrid",       // Combination
    "unknown",
  ]).optional(),

  // When the commercial relationship was verified
  verifiedAt: z.string().datetime().optional(),

  // Contract expiration (to flag for re-verification)
  expiresAt: z.string().datetime().optional(),

  // Notes (not displayed)
  notes: z.string().optional(),
});

export type CommercialMetadata = z.infer<typeof CommercialMetadataZ>;

/**
 * Default commercial metadata
 */
export const DEFAULT_COMMERCIAL_METADATA: CommercialMetadata = {
  status: "unknown",
};

// ============================================================================
// DISCLOSURE TEXT
// ============================================================================

/**
 * Standard disclosure text for different contexts
 */
export const DISCLOSURE_TEXT = {
  affiliate: {
    short: "Partner link",
    medium: "We may earn a commission if you sign up through this link.",
    long: "HeyPsych may receive compensation from partners when you click certain links or sign up for their services. This does not affect our recommendations, which are based on clinical fit and user needs.",
  },
  sponsored_placement: {
    short: "Sponsored",
    medium: "This is a sponsored placement.",
    long: "This placement is sponsored. Our editorial recommendations are independent of sponsored content.",
  },
  none: {
    short: "",
    medium: "",
    long: "",
  },
} as const;

/**
 * Get appropriate disclosure text for a commercial status
 */
export function getDisclosureText(
  status: CommercialStatus,
  length: "short" | "medium" | "long" = "medium"
): string {
  const disclosureType = getRequiredDisclosure(status);
  if (disclosureType === "none") return "";

  const key = disclosureType === "sponsored_placement" ? "sponsored_placement" : "affiliate";
  return DISCLOSURE_TEXT[key][length];
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate commercial metadata
 */
export function validateCommercialMetadata(
  data: unknown
): { success: boolean; data?: CommercialMetadata; errors?: z.ZodError } {
  const result = CommercialMetadataZ.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Check if a product needs commercial disclosure
 */
export function needsDisclosure(commercial?: CommercialMetadata): boolean {
  if (!commercial) return false;
  return isCompensated(commercial.status);
}

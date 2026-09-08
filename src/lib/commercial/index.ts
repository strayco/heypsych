/**
 * Commercial Module
 *
 * Phase 6: Truthful commercial attribution for affiliate and sponsored links.
 *
 * This module provides:
 * - Schema for commercial relationship classification
 * - Disclosure utilities and text
 * - Kill switch configuration and checking
 */

// Re-export schema types and utilities
export {
  CommercialStatusZ,
  CommercialMetadataZ,
  CommercialKillSwitchZ,
  DisclosureTypeZ,
  DEFAULT_COMMERCIAL_METADATA,
  COMMERCIAL_STATUS_LABELS,
  DISCLOSURE_TEXT,
  isCompensated,
  getRequiredDisclosure,
  getDisclosureText,
  isCommercialEnabled,
  needsDisclosure,
  validateCommercialMetadata,
  type CommercialStatus,
  type CommercialMetadata,
  type CommercialKillSwitch,
  type DisclosureType,
} from "../schemas/commercial";

// Export kill switch utilities
export {
  shouldShowCommercialLink,
  getEffectiveAffiliateUrl,
  isUsingAffiliateTracking,
  getKillSwitchConfig,
  clearKillSwitchCache,
  getKillSwitchSummary,
  hasActiveKillSwitch,
} from "./kill-switch";

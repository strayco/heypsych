/**
 * Commercial Kill Switch Implementation
 *
 * Phase 6: Runtime control over commercial links.
 *
 * IMPLEMENTATION:
 * - Global kill switch via environment variable
 * - Per-partner/product config via JSON config
 * - Server-side check (no client exposure of config)
 *
 * USAGE:
 * ```ts
 * import { shouldShowCommercialLink } from "@/lib/commercial/kill-switch";
 *
 * const showAffiliateLink = await shouldShowCommercialLink(tool.slug, tool.commercial?.partnerSlug);
 * ```
 */

import type { CommercialKillSwitch, CommercialMetadata } from "@/lib/schemas/commercial";
import { isCommercialEnabled } from "@/lib/schemas/commercial";

// ============================================================================
// CONFIGURATION LOADING
// ============================================================================

/**
 * Default kill switch config (all enabled)
 */
const DEFAULT_CONFIG: CommercialKillSwitch = {
  globalDisabled: false,
  disabledPartners: [],
  disabledProducts: [],
};

/**
 * Load kill switch configuration from environment/config
 *
 * Priority:
 * 1. COMMERCIAL_KILL_SWITCH_GLOBAL env var (true = all disabled)
 * 2. COMMERCIAL_DISABLED_PARTNERS env var (comma-separated slugs)
 * 3. COMMERCIAL_DISABLED_PRODUCTS env var (comma-separated slugs)
 */
function loadKillSwitchConfig(): CommercialKillSwitch {
  const globalDisabled = process.env.COMMERCIAL_KILL_SWITCH_GLOBAL === "true";

  const disabledPartnersRaw = process.env.COMMERCIAL_DISABLED_PARTNERS || "";
  const disabledPartners = disabledPartnersRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const disabledProductsRaw = process.env.COMMERCIAL_DISABLED_PRODUCTS || "";
  const disabledProducts = disabledProductsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    globalDisabled,
    disabledPartners,
    disabledProducts,
    disableReason: process.env.COMMERCIAL_DISABLE_REASON,
    updatedAt: new Date().toISOString(),
  };
}

// Cache config for the request lifecycle
let cachedConfig: CommercialKillSwitch | null = null;

/**
 * Get current kill switch configuration
 */
export function getKillSwitchConfig(): CommercialKillSwitch {
  if (!cachedConfig) {
    cachedConfig = loadKillSwitchConfig();
  }
  return cachedConfig;
}

/**
 * Clear config cache (for testing or hot reload)
 */
export function clearKillSwitchCache(): void {
  cachedConfig = null;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Check if commercial/affiliate links should be shown for a product
 *
 * @param productSlug - The product slug
 * @param partnerSlug - Optional partner network slug
 * @returns true if commercial links should be displayed
 */
export function shouldShowCommercialLink(
  productSlug: string,
  partnerSlug?: string
): boolean {
  const config = getKillSwitchConfig();
  return isCommercialEnabled(config, productSlug, partnerSlug);
}

/**
 * Get the effective affiliate URL for a product
 *
 * Returns the affiliate URL if enabled, otherwise falls back to the direct website URL.
 *
 * @param productSlug - The product slug
 * @param affiliateUrl - The affiliate URL
 * @param websiteUrl - The direct website URL (fallback)
 * @param partnerSlug - Optional partner network slug
 * @returns The URL to use
 */
export function getEffectiveAffiliateUrl(
  productSlug: string,
  affiliateUrl?: string,
  websiteUrl?: string,
  partnerSlug?: string
): string | undefined {
  if (!affiliateUrl) {
    return websiteUrl;
  }

  if (!shouldShowCommercialLink(productSlug, partnerSlug)) {
    // Kill switch active - return direct URL instead
    return websiteUrl || affiliateUrl; // Fall back to affiliate if no direct URL
  }

  return affiliateUrl;
}

/**
 * Determine if a tool's link is currently using affiliate tracking
 *
 * @param productSlug - The product slug
 * @param commercial - The tool's commercial metadata
 * @returns true if the link will use affiliate tracking
 */
export function isUsingAffiliateTracking(
  productSlug: string,
  commercial?: CommercialMetadata
): boolean {
  if (!commercial || commercial.status !== "active_affiliate") {
    return false;
  }

  return shouldShowCommercialLink(productSlug, commercial.partnerSlug);
}

// ============================================================================
// ADMIN/DEBUG UTILITIES
// ============================================================================

/**
 * Get a summary of current kill switch state (for admin dashboards)
 */
export function getKillSwitchSummary(): {
  globalDisabled: boolean;
  disabledPartnerCount: number;
  disabledProductCount: number;
  reason?: string;
} {
  const config = getKillSwitchConfig();
  return {
    globalDisabled: config.globalDisabled,
    disabledPartnerCount: config.disabledPartners.length,
    disabledProductCount: config.disabledProducts.length,
    reason: config.disableReason,
  };
}

/**
 * Check if any kill switches are currently active
 */
export function hasActiveKillSwitch(): boolean {
  const config = getKillSwitchConfig();
  return (
    config.globalDisabled ||
    config.disabledPartners.length > 0 ||
    config.disabledProducts.length > 0
  );
}

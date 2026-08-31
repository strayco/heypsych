/**
 * Architect Analytics Events
 *
 * Privacy-safe analytics for the Practice Stack Architect.
 * Uses Vercel Analytics custom events + optional gtag for GA4.
 *
 * KEY METRICS TO TRACK:
 * - Entry mode selection (build-for-me, build-myself, audit)
 * - Fingerprint completion rate
 * - Stack editing actions (add, remove, replace)
 * - Capability gap engagement
 * - Shortlist interactions
 * - Stack save/export actions
 * - Session duration and engagement depth
 *
 * PRIVACY NOTES:
 * - No sensitive practice information is tracked
 * - Geographic data is limited to state-level
 * - Provider counts are bucketed
 * - No product pricing details
 */

import { track } from "@vercel/analytics";

type ArchitectEvent =
  // Entry experience
  | "architect_page_view"
  | "architect_mode_select"
  | "architect_demo_start"
  // Fingerprint / Onboarding
  | "architect_fingerprint_start"
  | "architect_fingerprint_step_complete"
  | "architect_fingerprint_complete"
  | "architect_fingerprint_edit"
  // Practice Areas (new visual experience)
  | "architect_area_view"
  | "architect_item_view"
  | "architect_item_action"
  // Lifecycle navigation (legacy)
  | "architect_stage_view"
  | "architect_capability_view"
  // Stack management
  | "architect_product_add"
  | "architect_product_remove"
  | "architect_product_replace"
  | "architect_stack_undo"
  // Product discovery
  | "architect_shortlist_view"
  | "architect_fit_score_view"
  | "architect_why_fits_open"
  | "architect_replacement_preview"
  | "architect_product_drawer_open"
  | "architect_product_drawer_close"
  // Recommendations
  | "architect_recommendation_shown"
  | "architect_recommendation_accepted"
  | "architect_recommendation_customized"
  // Gap analysis
  | "architect_gap_click"
  | "architect_overlap_review"
  | "architect_compatibility_alert_view"
  // Health & cost
  | "architect_health_view"
  | "architect_cost_view"
  | "architect_advanced_toggle"
  // Commercial funnel
  | "architect_commercial_cta_shown"
  | "architect_commercial_cta_click"
  | "architect_demo_request"
  | "architect_quote_request"
  | "architect_vendor_visit"
  // Persistence
  | "architect_stack_save"
  | "architect_stack_load"
  | "architect_stack_export"
  | "architect_stack_import"
  // Blueprint milestones
  | "architect_blueprint_generated"
  | "architect_blueprint_complete"
  // Session
  | "architect_session_complete"
  | "architect_help_click";

interface ArchitectEventProperties {
  // Entry & mode
  mode?: "build-for-me" | "build-myself" | "audit";
  isDemo?: boolean;
  source?: string;
  // Fingerprint
  stepName?: string;
  stepNumber?: number;
  totalSteps?: number;
  // Practice profile (privacy-safe buckets only)
  practiceType?: string;
  sizeBucket?: string;
  deliveryModel?: string;
  // Practice Areas (new visual experience)
  areaId?: string;
  itemId?: string;
  itemAction?: "mark-complete" | "not-needed" | "add-later" | "open-drawer";
  // Stack
  productSlug?: string;
  productCategory?: string;
  previousProductSlug?: string;
  productCountBucket?: string;
  // Recommendations
  recommendationPosition?: number;
  recommendationCount?: number;
  recommendationType?: "primary" | "simpler" | "advanced" | "other";
  // Lifecycle
  stageId?: string;
  capabilityId?: string;
  // Analysis
  fitScoreBucket?: string;
  healthScoreBucket?: string;
  gapCount?: number;
  overlapCount?: number;
  incompatibilityCount?: number;
  coveragePercent?: number;
  // Cost (bucketed)
  costBucket?: string;
  isWithinBudget?: boolean;
  // Commercial
  ctaType?: "demo" | "quote" | "visit" | "credentialing";
  isSponsored?: boolean;
  // Blueprint
  blueprintReadyPercent?: number;
  productsCount?: number;
  // Persistence
  stackId?: string;
  // Session
  sessionDurationBucket?: string;
  actionsCount?: number;
}

/**
 * Track an Architect event
 *
 * Sends to both Vercel Analytics and GA4 (if available)
 */
export function trackArchitectEvent(
  event: ArchitectEvent,
  properties?: ArchitectEventProperties
): void {
  // Vercel Analytics
  try {
    track(event, properties as Record<string, string | number | boolean | null>);
  } catch {
    // Fail silently
  }

  // GA4 via gtag (if available)
  const windowWithGtag =
    typeof window !== "undefined"
      ? (window as Window & { gtag?: (...args: unknown[]) => void })
      : null;
  if (windowWithGtag?.gtag) {
    try {
      windowWithGtag.gtag("event", event, {
        event_category: "Architect",
        ...properties,
      });
    } catch {
      // Fail silently
    }
  }

  // Console log in development
  if (process.env.NODE_ENV === "development") {
    console.log("🏗️ Architect Event:", event, properties);
  }
}

// ============================================================================
// PRIVACY-SAFE BUCKETING
// ============================================================================

/**
 * Bucket provider count for privacy
 */
function getProviderCountBucket(count: number): string {
  if (count === 1) return "solo";
  if (count <= 5) return "2-5";
  if (count <= 15) return "6-15";
  if (count <= 30) return "16-30";
  if (count <= 100) return "31-100";
  return "100+";
}

/**
 * Bucket fit/health scores (0-100)
 */
export function getScoreBucket(score: number): string {
  if (score >= 80) return "excellent-80-100";
  if (score >= 60) return "good-60-79";
  if (score >= 40) return "fair-40-59";
  if (score >= 20) return "poor-20-39";
  return "critical-0-19";
}

/**
 * Bucket cost for privacy
 */
function getCostBucket(monthlyCents: number): string {
  const dollars = monthlyCents / 100;
  if (dollars < 100) return "under-100";
  if (dollars < 250) return "100-249";
  if (dollars < 500) return "250-499";
  if (dollars < 1000) return "500-999";
  if (dollars < 2500) return "1000-2499";
  if (dollars < 5000) return "2500-4999";
  return "5000+";
}

/**
 * Bucket session duration
 */
function getSessionDurationBucket(seconds: number): string {
  if (seconds < 60) return "under-1m";
  if (seconds < 180) return "1-3m";
  if (seconds < 300) return "3-5m";
  if (seconds < 600) return "5-10m";
  if (seconds < 1200) return "10-20m";
  if (seconds < 1800) return "20-30m";
  return "30m+";
}

// ============================================================================
// CONVENIENCE TRACKING FUNCTIONS
// ============================================================================

// Entry Experience

export function trackArchitectPageView(source?: string): void {
  trackArchitectEvent("architect_page_view", { source });
}

export function trackModeSelect(
  mode: "build-for-me" | "build-myself" | "audit",
  isDemo: boolean
): void {
  trackArchitectEvent("architect_mode_select", { mode, isDemo });
}

export function trackDemoStart(): void {
  trackArchitectEvent("architect_demo_start", { isDemo: true });
}

// Fingerprint

export function trackFingerprintStart(): void {
  trackArchitectEvent("architect_fingerprint_start");
}

export function trackFingerprintStepComplete(
  stepName: string,
  stepNumber: number,
  totalSteps: number
): void {
  trackArchitectEvent("architect_fingerprint_step_complete", {
    stepName,
    stepNumber,
    totalSteps,
  });
}

export function trackFingerprintComplete(
  practiceType: string,
  sizeBucket: string,
  deliveryModel: string
): void {
  trackArchitectEvent("architect_fingerprint_complete", {
    practiceType,
    sizeBucket,
    deliveryModel,
  });
}

export function trackFingerprintEdit(stepName: string): void {
  trackArchitectEvent("architect_fingerprint_edit", { stepName });
}

// Lifecycle Navigation

export function trackStageView(stageId: string): void {
  trackArchitectEvent("architect_stage_view", { stageId });
}

export function trackCapabilityView(capabilityId: string, stageId: string): void {
  trackArchitectEvent("architect_capability_view", { capabilityId, stageId });
}

// Stack Management

export function trackProductAdd(
  productSlug: string,
  productCategory: string,
  productCount: number
): void {
  trackArchitectEvent("architect_product_add", {
    productSlug,
    productCategory,
    productCountBucket: getProviderCountBucket(productCount),
  });
}

export function trackProductRemove(
  productSlug: string,
  productCategory: string,
  productCount: number
): void {
  trackArchitectEvent("architect_product_remove", {
    productSlug,
    productCategory,
    productCountBucket: getProviderCountBucket(productCount),
  });
}

export function trackProductReplace(
  previousProductSlug: string,
  productSlug: string,
  productCategory: string
): void {
  trackArchitectEvent("architect_product_replace", {
    previousProductSlug,
    productSlug,
    productCategory,
  });
}

export function trackStackUndo(): void {
  trackArchitectEvent("architect_stack_undo");
}

// Product Discovery

export function trackShortlistView(capabilityId: string, resultCount: number): void {
  trackArchitectEvent("architect_shortlist_view", {
    capabilityId,
    gapCount: resultCount,
  });
}

export function trackFitScoreView(productSlug: string, fitScore: number): void {
  trackArchitectEvent("architect_fit_score_view", {
    productSlug,
    fitScoreBucket: getScoreBucket(fitScore),
  });
}

export function trackWhyFitsOpen(productSlug: string, fitScore: number): void {
  trackArchitectEvent("architect_why_fits_open", {
    productSlug,
    fitScoreBucket: getScoreBucket(fitScore),
  });
}

export function trackReplacementPreview(
  currentProductSlug: string,
  replacementProductSlug: string
): void {
  trackArchitectEvent("architect_replacement_preview", {
    previousProductSlug: currentProductSlug,
    productSlug: replacementProductSlug,
  });
}

// Gap Analysis

export function trackGapClick(capabilityId: string, stageId: string): void {
  trackArchitectEvent("architect_gap_click", { capabilityId, stageId });
}

export function trackOverlapReview(overlapCount: number): void {
  trackArchitectEvent("architect_overlap_review", { overlapCount });
}

export function trackCompatibilityAlertView(incompatibilityCount: number): void {
  trackArchitectEvent("architect_compatibility_alert_view", {
    incompatibilityCount,
  });
}

// Health & Cost

export function trackHealthView(healthScore: number): void {
  trackArchitectEvent("architect_health_view", {
    healthScoreBucket: getScoreBucket(healthScore),
  });
}

export function trackCostView(
  monthlyCents: number | null,
  isWithinBudget: boolean | null
): void {
  trackArchitectEvent("architect_cost_view", {
    costBucket: monthlyCents !== null ? getCostBucket(monthlyCents) : "unknown",
    isWithinBudget: isWithinBudget ?? undefined,
  });
}

// Persistence

export function trackStackSave(stackId: string): void {
  trackArchitectEvent("architect_stack_save", { stackId });
}

export function trackStackLoad(stackId: string): void {
  trackArchitectEvent("architect_stack_load", { stackId });
}

export function trackStackExport(): void {
  trackArchitectEvent("architect_stack_export");
}

export function trackStackImport(): void {
  trackArchitectEvent("architect_stack_import");
}

// Session

export function trackSessionComplete(
  durationSeconds: number,
  actionsCount: number,
  mode?: "build-for-me" | "build-myself" | "audit"
): void {
  trackArchitectEvent("architect_session_complete", {
    sessionDurationBucket: getSessionDurationBucket(durationSeconds),
    actionsCount,
    mode,
  });
}

export function trackHelpClick(source: string): void {
  trackArchitectEvent("architect_help_click", { source });
}

// ============================================================================
// NEW VISUAL EXPERIENCE EVENTS
// ============================================================================

// Practice Areas

export function trackAreaView(areaId: string): void {
  trackArchitectEvent("architect_area_view", { areaId });
}

export function trackItemView(areaId: string, itemId: string): void {
  trackArchitectEvent("architect_item_view", { areaId, itemId });
}

export function trackItemAction(
  areaId: string,
  itemId: string,
  action: "mark-complete" | "not-needed" | "add-later" | "open-drawer"
): void {
  trackArchitectEvent("architect_item_action", { areaId, itemId, itemAction: action });
}

// Product Drawer

export function trackProductDrawerOpen(
  areaId: string,
  itemId: string,
  recommendationCount: number
): void {
  trackArchitectEvent("architect_product_drawer_open", {
    areaId,
    itemId,
    recommendationCount,
  });
}

export function trackProductDrawerClose(areaId: string, itemId: string): void {
  trackArchitectEvent("architect_product_drawer_close", { areaId, itemId });
}

// Recommendations

export function trackRecommendationShown(
  productSlug: string,
  position: number,
  type: "primary" | "simpler" | "advanced" | "other",
  fitScore: number
): void {
  trackArchitectEvent("architect_recommendation_shown", {
    productSlug,
    recommendationPosition: position,
    recommendationType: type,
    fitScoreBucket: getScoreBucket(fitScore),
  });
}

export function trackRecommendationAccepted(
  productSlug: string,
  position: number,
  count: number
): void {
  trackArchitectEvent("architect_recommendation_accepted", {
    productSlug,
    recommendationPosition: position,
    recommendationCount: count,
  });
}

export function trackRecommendationCustomized(): void {
  trackArchitectEvent("architect_recommendation_customized");
}

// Advanced View

export function trackAdvancedToggle(enabled: boolean): void {
  trackArchitectEvent("architect_advanced_toggle", {
    mode: enabled ? "build-for-me" : "build-myself",
  });
}

// Commercial Funnel

export function trackCommercialCtaShown(
  productSlug: string,
  ctaType: "demo" | "quote" | "visit" | "credentialing",
  isSponsored: boolean
): void {
  trackArchitectEvent("architect_commercial_cta_shown", {
    productSlug,
    ctaType,
    isSponsored,
  });
}

export function trackCommercialCtaClick(
  productSlug: string,
  ctaType: "demo" | "quote" | "visit" | "credentialing",
  isSponsored: boolean
): void {
  trackArchitectEvent("architect_commercial_cta_click", {
    productSlug,
    ctaType,
    isSponsored,
  });
}

export function trackDemoRequest(productSlug: string, isSponsored: boolean): void {
  trackArchitectEvent("architect_demo_request", { productSlug, isSponsored });
}

export function trackQuoteRequest(productSlug: string, isSponsored: boolean): void {
  trackArchitectEvent("architect_quote_request", { productSlug, isSponsored });
}

export function trackVendorVisit(productSlug: string, isSponsored: boolean): void {
  trackArchitectEvent("architect_vendor_visit", { productSlug, isSponsored });
}

/**
 * Track when user clicks to view internal HeyPsych product detail page
 * This is different from vendor_visit which leaves HeyPsych for the vendor's site
 */
export function trackProductDetailView(productSlug: string, productCategory: string): void {
  trackArchitectEvent("architect_fit_score_view", {
    productSlug,
    productCategory,
  });
}

// Blueprint Milestones

export function trackBlueprintGenerated(
  practiceType: string,
  sizeBucket: string,
  recommendationCount: number
): void {
  trackArchitectEvent("architect_blueprint_generated", {
    practiceType,
    sizeBucket,
    recommendationCount,
  });
}

export function trackBlueprintComplete(
  readyPercent: number,
  productsCount: number,
  costBucket: string
): void {
  trackArchitectEvent("architect_blueprint_complete", {
    blueprintReadyPercent: Math.round(readyPercent),
    productsCount,
    costBucket,
  });
}

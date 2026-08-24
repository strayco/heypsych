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
  // Fingerprint
  | "architect_fingerprint_start"
  | "architect_fingerprint_step_complete"
  | "architect_fingerprint_complete"
  | "architect_fingerprint_edit"
  // Lifecycle navigation
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
  // Gap analysis
  | "architect_gap_click"
  | "architect_overlap_review"
  | "architect_compatibility_alert_view"
  // Health & cost
  | "architect_health_view"
  | "architect_cost_view"
  // Persistence
  | "architect_stack_save"
  | "architect_stack_load"
  | "architect_stack_export"
  | "architect_stack_import"
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
  // Stack
  productSlug?: string;
  productCategory?: string;
  previousProductSlug?: string;
  productCountBucket?: string;
  // Lifecycle
  stageId?: string;
  capabilityId?: string;
  // Analysis
  fitScoreBucket?: string;
  healthScoreBucket?: string;
  gapCount?: number;
  overlapCount?: number;
  incompatibilityCount?: number;
  // Cost (bucketed)
  costBucket?: string;
  isWithinBudget?: boolean;
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
function getScoreBucket(score: number): string {
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

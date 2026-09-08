/**
 * Shared Decision Analytics
 *
 * Phase 5: Privacy-safe analytics utilities shared between decision domains.
 *
 * SHARED:
 * - Lifecycle event types
 * - Privacy-safe bucketing utilities
 * - Base tracking interface
 *
 * NOT SHARED:
 * - Domain-specific event names
 * - Domain-specific properties
 * - Domain-specific bucketing logic
 */

import { track } from "@vercel/analytics";

/**
 * Base decision lifecycle events
 * Each domain extends these with domain-specific event names
 */
export type DecisionLifecycleEvent =
  | "decision_started"
  | "decision_step_completed"
  | "decision_result_shown"
  | "decision_action_clicked"
  | "decision_completed"
  | "decision_abandoned";

/**
 * Base event properties shared across all decision events
 */
export interface BaseDecisionEventProperties {
  /** Source of the decision entry (homepage, nav, direct, etc.) */
  source?: string;

  /** Decision type identifier */
  decisionType: string;

  /** Whether this is a demo/test run */
  isDemo?: boolean;
}

/**
 * Step completion event properties
 */
export interface StepCompletedEventProperties extends BaseDecisionEventProperties {
  /** Step identifier */
  stepId: string;

  /** Step number (1-indexed) */
  stepNumber: number;

  /** Total steps in journey */
  totalSteps: number;
}

/**
 * Result shown event properties
 */
export interface ResultShownEventProperties extends BaseDecisionEventProperties {
  /** Primary result identifier */
  primaryResultId: string;

  /** Number of alternatives shown */
  alternativeCount: number;

  /** Confidence level bucket */
  confidenceBucket: "high" | "moderate" | "low";

  /** Whether any safety/urgency signal was present */
  hadSafetySignal?: boolean;
}

/**
 * Action clicked event properties
 */
export interface ActionClickedEventProperties extends BaseDecisionEventProperties {
  /** Action type */
  actionType: string;

  /** Whether this was the primary recommended action */
  isPrimaryAction: boolean;

  /** Associated result ID */
  resultId?: string;
}

/**
 * Decision completed event properties
 */
export interface DecisionCompletedEventProperties extends BaseDecisionEventProperties {
  /** Total steps completed */
  totalSteps: number;

  /** Session duration bucket */
  durationBucket: string;

  /** Primary result selected */
  primaryResultId: string;
}

/**
 * Decision abandoned event properties
 */
export interface DecisionAbandonedEventProperties extends BaseDecisionEventProperties {
  /** Last step completed */
  lastStepId: string;

  /** Session duration bucket */
  durationBucket: string;
}

// ============================================================================
// PRIVACY-SAFE BUCKETING UTILITIES
// ============================================================================

/**
 * Bucket a count into privacy-safe ranges
 */
export function getBucketedCount(count: number): string {
  if (count === 0) return "0";
  if (count === 1) return "1";
  if (count <= 3) return "2-3";
  if (count <= 5) return "4-5";
  if (count <= 10) return "6-10";
  if (count <= 20) return "11-20";
  return "20+";
}

/**
 * Bucket a score (0-100) into named ranges
 */
export function getScoreBucket(score: number): string {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  if (score >= 20) return "poor";
  return "critical";
}

/**
 * Bucket session duration in seconds
 */
export function getDurationBucket(seconds: number): string {
  if (seconds < 30) return "under-30s";
  if (seconds < 60) return "30s-1m";
  if (seconds < 180) return "1-3m";
  if (seconds < 300) return "3-5m";
  if (seconds < 600) return "5-10m";
  if (seconds < 1200) return "10-20m";
  if (seconds < 1800) return "20-30m";
  return "30m+";
}

/**
 * Bucket a percentage into ranges
 */
export function getPercentBucket(percent: number): string {
  if (percent >= 90) return "90-100";
  if (percent >= 75) return "75-89";
  if (percent >= 50) return "50-74";
  if (percent >= 25) return "25-49";
  return "0-24";
}

// ============================================================================
// TRACKING UTILITIES
// ============================================================================

/**
 * Track a decision event to analytics
 * Uses Vercel Analytics + optional gtag for GA4
 */
export function trackDecisionEvent(
  eventName: string,
  properties: Record<string, string | number | boolean | null | undefined>
): void {
  // Filter out undefined values
  const cleanProperties = Object.fromEntries(
    Object.entries(properties).filter(([, v]) => v !== undefined)
  ) as Record<string, string | number | boolean | null>;

  // Vercel Analytics
  try {
    track(eventName, cleanProperties);
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
      windowWithGtag.gtag("event", eventName, {
        event_category: "Decision",
        ...cleanProperties,
      });
    } catch {
      // Fail silently
    }
  }

  // Console log in development
  if (process.env.NODE_ENV === "development") {
    console.log("🎯 Decision Event:", eventName, cleanProperties);
  }
}

/**
 * Generate a privacy-safe session ID
 * Uses random string, not tied to user identity
 */
export function generateSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Calculate session duration bucket from start timestamp
 */
export function getSessionDurationBucket(startedAt: number): string {
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  return getDurationBucket(seconds);
}

// ============================================================================
// DECISION SESSION CONTEXT
// Phase 6: Links decision completion to action clicks for attribution
// ============================================================================

/**
 * Context for a decision session, used to link events together
 * This enables the funnel: decision_started → result_shown → action_clicked
 */
export interface DecisionSessionContext {
  /** Unique session identifier (privacy-safe, not user-identifying) */
  sessionId: string;

  /** Decision type (e.g., "patient-support", "architect") */
  decisionType: string;

  /** Session start timestamp */
  startedAt: number;

  /** Primary result shown (set when result is displayed) */
  primaryResultId?: string;

  /** Whether a safety/urgency signal was triggered */
  hadSafetySignal?: boolean;

  /** Source of entry (homepage, nav, direct, etc.) */
  source?: string;
}

/**
 * Create a new decision session context
 */
export function createDecisionSession(
  decisionType: string,
  source?: string
): DecisionSessionContext {
  return {
    sessionId: generateSessionId(),
    decisionType,
    startedAt: Date.now(),
    source,
  };
}

/**
 * Track when a decision session starts
 */
export function trackDecisionStarted(session: DecisionSessionContext): void {
  trackDecisionEvent("decision_started", {
    sessionId: session.sessionId,
    decisionType: session.decisionType,
    source: session.source,
  });
}

/**
 * Track when a decision result is shown to the user
 */
export function trackDecisionResultShown(
  session: DecisionSessionContext,
  resultId: string,
  alternativeCount: number,
  confidenceBucket: "high" | "moderate" | "low"
): void {
  trackDecisionEvent("decision_result_shown", {
    sessionId: session.sessionId,
    decisionType: session.decisionType,
    resultId,
    alternativeCount,
    confidenceBucket,
    hadSafetySignal: session.hadSafetySignal,
  });
}

/**
 * Track when a user clicks an action from a decision result
 * This is the key event for connecting decisions to conversions
 */
export function trackDecisionActionClicked(
  session: DecisionSessionContext,
  actionType: string,
  isPrimaryAction: boolean,
  metadata?: {
    /** Product or resource slug if applicable */
    targetSlug?: string;
    /** Whether this is a commercial/affiliate action */
    isCommercial?: boolean;
  }
): void {
  trackDecisionEvent("decision_action_clicked", {
    sessionId: session.sessionId,
    decisionType: session.decisionType,
    actionType,
    isPrimaryAction,
    resultId: session.primaryResultId,
    targetSlug: metadata?.targetSlug,
    isCommercial: metadata?.isCommercial,
    durationBucket: getSessionDurationBucket(session.startedAt),
  });
}

/**
 * Track when a decision session is completed
 */
export function trackDecisionCompleted(
  session: DecisionSessionContext,
  totalSteps: number
): void {
  trackDecisionEvent("decision_completed", {
    sessionId: session.sessionId,
    decisionType: session.decisionType,
    primaryResultId: session.primaryResultId,
    totalSteps,
    durationBucket: getSessionDurationBucket(session.startedAt),
    hadSafetySignal: session.hadSafetySignal,
  });
}

/**
 * Track when a decision session is abandoned
 */
export function trackDecisionAbandoned(
  session: DecisionSessionContext,
  lastStepId: string
): void {
  trackDecisionEvent("decision_abandoned", {
    sessionId: session.sessionId,
    decisionType: session.decisionType,
    lastStepId,
    durationBucket: getSessionDurationBucket(session.startedAt),
  });
}

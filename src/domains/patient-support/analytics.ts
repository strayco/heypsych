/**
 * Patient Support Journey Analytics
 *
 * Privacy-safe analytics for the "Find My Support Path" journey.
 * Uses Vercel Analytics custom events.
 *
 * PRIVACY REQUIREMENTS (from PATIENT_PILOT_CONTRACT.md):
 * - NO symptom selections or descriptions
 * - NO assessment answers or scores
 * - NO free-text input of any kind
 * - NO concern category selections (use count only)
 * - NO content that could identify health status
 *
 * Events use session identifiers only, no health content.
 */

import { track } from "@vercel/analytics";
import type { JourneyStep, SupportPathId, ConfidenceLevel } from "./types";

/**
 * Patient support event types
 */
type PatientSupportEvent =
  // Session
  | "support_journey_started"
  | "support_journey_abandoned"
  | "support_journey_completed"
  // Progress (no answer content)
  | "support_urgency_completed"
  | "support_step_completed"
  // Outcome
  | "support_path_shown"
  | "support_action_clicked"
  // Crisis
  | "support_crisis_shown";

/**
 * Allowed property values for analytics
 */
type AnalyticsValue = string | number | boolean | null;

/**
 * Track a patient support event
 */
/** Values that would reveal a crisis. Any event carrying one is not sent. */
const CRISIS_VALUES = new Set(["crisis", "crisis-support", "immediate-crisis"]);

function trackPatientSupportEvent(
  event: PatientSupportEvent,
  data?: Record<string, AnalyticsValue>
): void {
  // Privacy: never send anything that reveals a crisis or the urgency answer.
  if (data && Object.values(data).some((v) => typeof v === "string" && CRISIS_VALUES.has(v))) return;
  try {
    track(event, data);
  } catch {
    // Silently fail if analytics unavailable
  }
}

// ============================================================================
// SESSION EVENTS
// ============================================================================

/**
 * Track when user starts the support journey
 */
export function trackSupportJourneyStarted(source: "homepage" | "nav" | "direct"): void {
  trackPatientSupportEvent("support_journey_started", { source });
}

/**
 * Track when user abandons the journey without completing
 */
export function trackSupportJourneyAbandoned(lastStep: JourneyStep): void {
  trackPatientSupportEvent("support_journey_abandoned", { lastStep });
}

/**
 * Track when user completes the journey
 */
export function trackSupportJourneyCompleted(
  totalSteps: number,
  pathSelected: SupportPathId
): void {
  trackPatientSupportEvent("support_journey_completed", {
    totalSteps,
    pathSelected,
  });
}

// ============================================================================
// PROGRESS EVENTS (NO ANSWER CONTENT)
// ============================================================================

/**
 * Track that the urgency question was answered.
 * PRIVACY: the answer itself (crisis / struggling / planning) is never sent.
 */
export function trackUrgencyCompleted(): void {
  trackPatientSupportEvent("support_urgency_completed");
}

/**
 * Track step completion
 * PRIVACY: Only tracks step name and optional counts, NO content
 */
export function trackStepCompleted(
  step: JourneyStep,
  metadata?: {
    /** For concerns step: number selected (not which ones) */
    count?: number;
    /** For concerns step: whether "not sure" was used */
    usedNotSure?: boolean;
  }
): void {
  trackPatientSupportEvent("support_step_completed", {
    step,
    ...metadata,
  });
}

// ============================================================================
// OUTCOME EVENTS
// ============================================================================

/**
 * Track when support path recommendation is shown
 * PRIVACY: Only tracks path ID and metadata, NOT user answers
 */
export function trackSupportPathShown(
  pathId: SupportPathId,
  alternativeCount: number,
  confidence: ConfidenceLevel
): void {
  // Nothing that reveals a crisis is ever sent: no crisis flag, and no event
  // at all when the path shown is crisis support.
  if (pathId === "crisis-support") return;
  // Map confidence to shorter string for analytics
  const confidenceShort =
    confidence === "clear-path"
      ? "clear"
      : confidence === "reasonable-options"
      ? "reasonable"
      : "exploration";

  trackPatientSupportEvent("support_path_shown", {
    pathId,
    alternativeCount,
    confidence: confidenceShort,
  });
}

/**
 * Track when user clicks a next action
 */
export function trackActionClicked(actionType: string, pathId: SupportPathId): void {
  trackPatientSupportEvent("support_action_clicked", {
    actionType,
    pathId,
  });
}

// ============================================================================
// CRISIS EVENTS
// ============================================================================

/**
 * Track when crisis resources are shown
 * PRIVACY: Only tracks trigger type, NOT user content
 */
export function trackCrisisShown(_trigger: "selection" | "keyword" | "assessment"): void {
  // PRIVACY (2026-11-19): not sent. Reporting that crisis help was shown
  // reveals a crisis; kept as a no-op so callers stay unchanged.
}

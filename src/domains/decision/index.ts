/**
 * Shared Decision Infrastructure
 *
 * Phase 5: Proven shared infrastructure extracted from patient support
 * and architect clinician pilots.
 *
 * This domain provides common types and utilities. Domain-specific logic
 * remains in patient-support/ and architect/ domains.
 */

// Types
export type {
  ConfidenceLevel,
  DataQuality,
  NextAction,
  MissingInfo,
  DecisionVersion,
  EvidenceReference,
  DecisionResultEnvelope,
  SessionStep,
  DecisionSessionState,
  RecommendationReason,
  Tradeoff,
} from "./types";

// Analytics
export {
  trackDecisionEvent,
  generateSessionId,
  getSessionDurationBucket,
  getBucketedCount,
  getScoreBucket,
  getDurationBucket,
  getPercentBucket,
  // Session context (Phase 6: decision-to-action attribution)
  createDecisionSession,
  trackDecisionStarted,
  trackDecisionResultShown,
  trackDecisionActionClicked,
  trackDecisionCompleted,
  trackDecisionAbandoned,
} from "./analytics";

export type {
  DecisionLifecycleEvent,
  BaseDecisionEventProperties,
  StepCompletedEventProperties,
  ResultShownEventProperties,
  ActionClickedEventProperties,
  DecisionCompletedEventProperties,
  DecisionAbandonedEventProperties,
  // Session context type
  DecisionSessionContext,
} from "./analytics";

/**
 * Patient Support Journey Domain
 *
 * "Find My Support Path" - a non-diagnostic care-path decision journey
 * for patients, family members, and caregivers seeking mental health support.
 *
 * @module patient-support
 */

// Types
export type {
  UrgencyLevel,
  PriorSupportLevel,
  InsurancePreference,
  ModalityPreference,
  AgeGroup,
  SymptomDuration,
  SupportGoal,
  SupportPathId,
  ConfidenceLevel,
  PatientJourneyInput,
  CrisisResource,
  SupportPath,
  NextAction,
  SupportPathResult,
  JourneyStep,
  PatientJourneyState,
  PatientJourneyEvents,
} from "./types";

// Path definitions
export {
  CRISIS_RESOURCES,
  SUPPORT_PATHS,
  SUPPORT_PATH_DISCLAIMER,
  getSupportPath,
  PATHS_VERSION,
} from "./paths";

// Evaluator
export { evaluateSupportPath, hasCrisisSignal } from "./evaluator";

// Analytics
export {
  trackSupportJourneyStarted,
  trackSupportJourneyAbandoned,
  trackSupportJourneyCompleted,
  trackUrgencyCompleted,
  trackStepCompleted,
  trackSupportPathShown,
  trackActionClicked,
  trackCrisisShown,
} from "./analytics";

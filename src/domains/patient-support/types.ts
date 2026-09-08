/**
 * Patient Support Journey Domain Types
 *
 * Types for the "Find My Support Path" patient decision journey.
 * This is a non-diagnostic care-path decision system.
 */

import type { SymptomCategory } from "@/domains/symptoms/types";

/**
 * Urgency level from initial safety check
 */
export type UrgencyLevel = "immediate-crisis" | "struggling-now" | "planning-ahead";

/**
 * Prior support experience
 */
export type PriorSupportLevel = "none" | "tried-apps" | "tried-therapy" | "currently-in-care";

/**
 * Insurance preference
 */
export type InsurancePreference = "use-insurance" | "out-of-pocket" | "not-sure";

/**
 * Delivery modality preference
 */
export type ModalityPreference = "in-person" | "telehealth" | "either";

/**
 * Age group (optional input)
 */
export type AgeGroup = "child" | "adolescent" | "adult" | "older-adult";

/**
 * Duration of symptoms affecting daily life
 */
export type SymptomDuration =
  | "less-than-2-weeks"
  | "2-weeks-to-3-months"
  | "more-than-3-months"
  | "on-and-off";

/**
 * Support goals - what the user hopes to achieve
 */
export type SupportGoal =
  | "understand-experience"
  | "learn-coping-strategies"
  | "talk-to-someone-regularly"
  | "professional-evaluation"
  | "explore-medication"
  | "crisis-support";

/**
 * Support path identifiers - clinician-defined care paths
 */
export type SupportPathId =
  | "crisis-support"
  | "therapy-counseling"
  | "psychiatric-eval"
  | "integrated-care"
  | "peer-support"
  | "digital-tools"
  | "primary-care";

/**
 * Confidence level for recommendations
 */
export type ConfidenceLevel = "clear-path" | "reasonable-options" | "needs-exploration";

/**
 * Journey input collected from user
 */
export interface PatientJourneyInput {
  /** Safety/urgency check - ALWAYS FIRST */
  urgencyCheck: UrgencyLevel;

  /** Primary concerns (symptom categories, max 3) */
  primaryConcerns: SymptomCategory[];

  /** How long symptoms have affected daily life */
  duration?: SymptomDuration;

  /** What they hope to achieve from support */
  goals: SupportGoal[];

  /** Prior experience with mental health support */
  priorSupport?: PriorSupportLevel;

  /** Insurance preference */
  insurancePreference?: InsurancePreference;

  /** Delivery modality preference */
  modalityPreference?: ModalityPreference;

  /** Age group (optional) */
  ageGroup?: AgeGroup;

  /** Whether safety keywords were detected */
  safetyKeywordsDetected?: boolean;
}

/**
 * Crisis resource - always available, hardcoded
 */
export interface CrisisResource {
  name: string;
  phone?: string;
  text?: string;
  available: string;
}

/**
 * A support path recommendation
 */
export interface SupportPath {
  /** Path identifier */
  id: SupportPathId;

  /** Display name */
  name: string;

  /** What this path involves */
  description: string;

  /** Reasons this fits based on user input */
  whyThisFits: string[];

  /** Things to consider */
  considerations: string[];

  /** When an alternative might be better */
  whenBetterFit: string;

  /** What to expect as a first step */
  typicalFirst: string;
}

/**
 * Next action the user can take
 */
export interface NextAction {
  /** Action label */
  label: string;

  /** Destination URL or action type */
  href: string;

  /** Action type for analytics */
  type: "navigation" | "in-page" | "reset";
}

/**
 * Complete result from the support path evaluator
 */
export interface SupportPathResult {
  /** Primary recommended path */
  primaryPath: SupportPath;

  /** Alternative paths to consider */
  alternatives: SupportPath[];

  /** Crisis resources (always present if any safety signal) */
  urgentResources?: CrisisResource[];

  /** Confidence level in the recommendation */
  confidence: ConfidenceLevel;

  /** Information that would help refine the recommendation */
  missingInfo: string[];

  /** Available next actions */
  nextActions: NextAction[];

  /** Required disclaimer text */
  disclaimer: string;

  /** Version information for reproducibility */
  versions: {
    definition: string;
    evaluator: string;
  };
}

/**
 * Journey step identifiers for progress tracking
 */
export type JourneyStep =
  | "urgency"
  | "concerns"
  | "duration"
  | "goals"
  | "prior-support"
  | "insurance"
  | "modality"
  | "result";

/**
 * Journey state for persistence and resumability
 */
export interface PatientJourneyState {
  /** Current step in the journey */
  currentStep: JourneyStep;

  /** Collected input so far */
  input: Partial<PatientJourneyInput>;

  /** Whether crisis path was triggered */
  crisisTriggered: boolean;

  /** Timestamp when journey started */
  startedAt: number;

  /** Result if journey is complete */
  result?: SupportPathResult;
}

/**
 * Privacy-safe analytics event types
 */
export interface PatientJourneyEvents {
  support_journey_started: {
    source: "homepage" | "nav" | "direct";
  };

  urgency_check_completed: {
    branch: "crisis" | "struggling" | "planning";
  };

  concerns_selected: {
    count: number;
    usedNotSure: boolean;
  };

  journey_step_completed: {
    step: JourneyStep;
  };

  support_path_shown: {
    pathId: SupportPathId;
    alternativeCount: number;
    confidence: "clear" | "reasonable" | "exploration";
    hadCrisisSignal: boolean;
  };

  next_action_clicked: {
    actionType: string;
    pathId: SupportPathId;
  };

  journey_completed: {
    totalSteps: number;
    pathSelected: SupportPathId;
  };

  journey_abandoned: {
    lastStep: JourneyStep;
  };

  crisis_resources_shown: {
    trigger: "selection" | "keyword" | "assessment";
  };
}

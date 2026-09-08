/**
 * Shared Decision Infrastructure Types
 *
 * Phase 5: Proven shared types extracted from patient support and architect pilots.
 *
 * EXTRACT ONLY:
 * - Versioned decision definitions
 * - Result envelopes
 * - Uncertainty and missing-data representation
 * - Evidence and review references
 *
 * DO NOT MERGE:
 * - Patient clinical and safety policy
 * - Clinician catalog fit logic
 * - Crisis behavior
 * - Architect cost/coverage algorithms
 */

/**
 * Confidence level for decision results
 * Shared between patient support paths and architect recommendations
 */
export type ConfidenceLevel =
  | "high"        // Clear recommendation with strong evidence
  | "moderate"    // Reasonable recommendation with some uncertainty
  | "low";        // Exploratory recommendation, more information needed

/**
 * Data quality indicator for result fields
 */
export type DataQuality =
  | "verified"    // Independently verified
  | "claimed"     // Vendor/self-reported
  | "inferred"    // Derived from other data
  | "unknown";    // No data available

/**
 * Next action a user can take
 * Common structure for both patient and clinician journeys
 */
export interface NextAction {
  /** Display label */
  label: string;

  /** Destination URL or action identifier */
  href: string;

  /** Action type for analytics */
  type: "navigation" | "in-page" | "reset" | "external";

  /** Whether this is the primary/recommended action */
  isPrimary?: boolean;
}

/**
 * Missing information that would improve the recommendation
 */
export interface MissingInfo {
  /** Field or category that's missing */
  field: string;

  /** How this would help */
  impact: string;

  /** How to provide this information */
  resolution?: string;
}

/**
 * Version information for reproducibility
 * Every decision result should include this
 */
export interface DecisionVersion {
  /** Version of the decision definition/rules */
  definition: string;

  /** Version of the evaluator/engine */
  evaluator: string;

  /** Version of the data catalog (if applicable) */
  catalog?: string;

  /** Timestamp when result was computed */
  computedAt?: string;
}

/**
 * Evidence reference for claims made in results
 */
export interface EvidenceReference {
  /** Type of evidence */
  type: "clinical-trial" | "review" | "vendor-claim" | "user-report" | "internal-analysis";

  /** Source identifier or URL */
  source: string;

  /** How recent is this evidence */
  recency?: "current" | "recent" | "dated" | "unknown";

  /** Quality assessment */
  quality: DataQuality;
}

/**
 * Base result envelope shared by all decision types
 *
 * Domain-specific results extend this with their own fields.
 */
export interface DecisionResultEnvelope<TRecommendation, TAlternative = TRecommendation> {
  /** Primary recommendation */
  primary: TRecommendation;

  /** Alternative options */
  alternatives: TAlternative[];

  /** Confidence in the recommendation */
  confidence: ConfidenceLevel;

  /** What information is missing */
  missingInfo: MissingInfo[];

  /** Available next actions */
  nextActions: NextAction[];

  /** Version information for reproducibility */
  versions: DecisionVersion;

  /** Required disclaimer text (if applicable) */
  disclaimer?: string;
}

/**
 * Session step for progress tracking
 * Domain-specific step identifiers extend from their own types
 */
export interface SessionStep<TStepId extends string> {
  /** Step identifier */
  id: TStepId;

  /** Human-readable label */
  label: string;

  /** Whether step is required */
  required: boolean;

  /** Whether step is complete */
  completed: boolean;
}

/**
 * Base session state for resumability
 * Domain-specific sessions extend this
 */
export interface DecisionSessionState<TStepId extends string, TInput, TResult> {
  /** Session identifier for analytics */
  sessionId: string;

  /** Current step in the journey */
  currentStep: TStepId;

  /** Steps completed */
  stepsCompleted: TStepId[];

  /** Collected input so far */
  input: Partial<TInput>;

  /** When session started */
  startedAt: number;

  /** When session was last updated */
  updatedAt: number;

  /** Result if journey is complete */
  result?: TResult;

  /** Whether session is complete */
  isComplete: boolean;

  /** Whether session was abandoned */
  isAbandoned: boolean;
}

/**
 * Reason for a recommendation or exclusion
 */
export interface RecommendationReason {
  /** Short label */
  label: string;

  /** Detailed explanation */
  explanation: string;

  /** Whether this is positive or negative */
  polarity: "positive" | "negative" | "neutral";

  /** Evidence backing this reason */
  evidence?: EvidenceReference;
}

/**
 * Tradeoff to consider
 */
export interface Tradeoff {
  /** What the tradeoff involves */
  factor: string;

  /** Pro side */
  pro?: string;

  /** Con side */
  con?: string;

  /** Importance level */
  importance: "high" | "medium" | "low";
}

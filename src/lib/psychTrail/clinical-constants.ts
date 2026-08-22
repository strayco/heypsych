/**
 * PsychTrails Clinical Constants
 * Canonical mechanism and pattern taxonomies for clinical usefulness
 */

// ============================================================================
// MECHANISM TAXONOMY
// 10 trainable psychological mechanisms
// ============================================================================

export const MECHANISMS = [
  "activation",
  "persistence",
  "recovery",
  "interpretation",
  "self_compassion",
  "directness",
  "distress_tolerance",
  "flexibility",
  "support_seeking",
  "threshold_lowering",
] as const;

export type MechanismId = (typeof MECHANISMS)[number];

export const MECHANISM_DEFINITIONS: Record<MechanismId, { name: string; description: string }> = {
  activation: {
    name: "Activation",
    description: "Starting action despite inertia or resistance",
  },
  persistence: {
    name: "Persistence",
    description: "Continuing effort despite difficulty or discomfort",
  },
  recovery: {
    name: "Recovery",
    description: "Returning to action after setback, avoidance, or failure",
  },
  interpretation: {
    name: "Interpretation",
    description: "Reading ambiguous signals accurately without distortion",
  },
  self_compassion: {
    name: "Self-Compassion",
    description: "Responding to difficulty with kindness instead of attack",
  },
  directness: {
    name: "Directness",
    description: "Communicating or acting clearly instead of indirectly",
  },
  distress_tolerance: {
    name: "Distress Tolerance",
    description: "Staying present with discomfort without escaping",
  },
  flexibility: {
    name: "Flexibility",
    description: "Adjusting approach when current strategy isn't working",
  },
  support_seeking: {
    name: "Support-Seeking",
    description: "Asking for or accepting help when struggling",
  },
  threshold_lowering: {
    name: "Threshold-Lowering",
    description: "Finding smaller workable steps instead of all-or-nothing",
  },
};

export type MechanismStrength = "absent" | "weak" | "partial" | "strong";

export const MECHANISM_STRENGTH_THRESHOLDS = {
  absent: 20,    // normalizedScore < 20
  weak: 40,      // normalizedScore 20-40
  partial: 70,   // normalizedScore 41-70
  strong: 100,   // normalizedScore > 70
} as const;

export function getMechanismStrength(normalizedScore: number): MechanismStrength {
  if (normalizedScore < 20) return "absent";
  if (normalizedScore <= 40) return "weak";
  if (normalizedScore <= 70) return "partial";
  return "strong";
}

// ============================================================================
// PATTERN TAXONOMY
// 15 behavioral patterns tracked across runs
// ============================================================================

export const PATTERNS = [
  "avoidance_at_threshold",
  "premature_exit",
  "overreach_collapse",
  "interpretation_distortion",
  "self_attack_spiral",
  "recovery_success",
  "micro_progress",
  "perfectionism_trap",
  "support_utilized",
  "distress_tolerated",
  "direct_action",
  "compassion_applied",
  "threshold_lowered",
  "safety_behavior",
  "grounded_interpretation",
] as const;

export type PatternId = (typeof PATTERNS)[number];

export type PatternValence = "positive" | "negative";

export const PATTERN_DEFINITIONS: Record<PatternId, { name: string; description: string; valence: PatternValence }> = {
  avoidance_at_threshold: {
    name: "Avoidance at Threshold",
    description: "Exited or collapsed at the last step before goal",
    valence: "negative",
  },
  premature_exit: {
    name: "Premature Exit",
    description: "Left scenario early without attempting main path",
    valence: "negative",
  },
  overreach_collapse: {
    name: "Overreach Collapse",
    description: "Pushed too hard, then crashed",
    valence: "negative",
  },
  interpretation_distortion: {
    name: "Interpretation Distortion",
    description: "Chose mind-reading or catastrophizing interpretations",
    valence: "negative",
  },
  self_attack_spiral: {
    name: "Self-Attack Spiral",
    description: "Engaged self-critical voice, worsened outcome",
    valence: "negative",
  },
  recovery_success: {
    name: "Recovery Success",
    description: "Returned to action after setback",
    valence: "positive",
  },
  micro_progress: {
    name: "Micro-Progress",
    description: "Completed via small incremental steps",
    valence: "positive",
  },
  perfectionism_trap: {
    name: "Perfectionism Trap",
    description: "All-or-nothing thinking blocked partial progress",
    valence: "negative",
  },
  support_utilized: {
    name: "Support Utilized",
    description: "Asked for or accepted help",
    valence: "positive",
  },
  distress_tolerated: {
    name: "Distress Tolerated",
    description: "Stayed through uncomfortable moment without escaping",
    valence: "positive",
  },
  direct_action: {
    name: "Direct Action",
    description: "Took straightforward approach instead of indirect",
    valence: "positive",
  },
  compassion_applied: {
    name: "Compassion Applied",
    description: "Used self-compassion to enable action",
    valence: "positive",
  },
  threshold_lowered: {
    name: "Threshold Lowered",
    description: "Found and used minimum viable step",
    valence: "positive",
  },
  safety_behavior: {
    name: "Safety Behavior Used",
    description: "Used phone, avoidance, or other escape mechanism",
    valence: "negative",
  },
  grounded_interpretation: {
    name: "Grounded Interpretation",
    description: "Interpreted ambiguous moment accurately",
    valence: "positive",
  },
};

// ============================================================================
// STUCK MOMENT DOMAINS
// ============================================================================

export const STUCK_MOMENT_DOMAINS = [
  "depression",
  "anxiety",
  "social-anxiety",
  "adhd",
  "shame",
  "conflict",
  "avoidance",
  "perfectionism",
  "support-seeking",
  "activation",
  "recovery",
  "boundaries",
] as const;

export type StuckMomentDomain = (typeof STUCK_MOMENT_DOMAINS)[number];

// ============================================================================
// CLINICAL VALIDATION REQUIREMENTS
// Minimum requirements for a valid clinical scenario
// ============================================================================

export const CLINICAL_REQUIREMENTS = {
  minPrimaryMechanisms: 1,
  maxPrimaryMechanisms: 3,
  minSecondaryMechanisms: 0,
  maxSecondaryMechanisms: 3,
  minRoutes: 3,
  maxRoutes: 10,
  minPrimaryObjectives: 3,
  minHiddenObjectives: 1,
  minHiddenRoutes: 1,
  minRecoveryRoutes: 1,
  minChallenges: 2,
  requireTransferPromptPerEnding: true,
  requireStuckMoment: true,
  requireRealWorldAnalogs: true,
} as const;

// ============================================================================
// TRANSFER PROMPT CONSTRAINTS
// ============================================================================

export const TRANSFER_PROMPT_CONSTRAINTS = {
  maxSentences: 2,
  maxCharacters: 280,
  mustBeActionable: true,
  mustBeAchievableIn24Hours: true,
} as const;

// ============================================================================
// MECHANISM SCORING
// ============================================================================

export interface MechanismRunScore {
  mechanism: MechanismId;
  rawScore: number;
  normalizedScore: number;
  demonstrated: boolean;
  strength: MechanismStrength;
}

export interface MechanismProgress {
  mechanism: MechanismId;
  totalReps: number;
  strongReps: number;
  lastPracticed: number;
  scenariosContributed: string[];
  trend: "improving" | "stable" | "declining";
}

// ============================================================================
// PATTERN TRACKING
// ============================================================================

export interface PatternDetection {
  pattern: PatternId;
  valence: PatternValence;
  contributingChoices: string[];
  contributingFlags: string[];
}

export interface PatternHistory {
  pattern: PatternId;
  occurrences: number;
  lastOccurred: number;
  recentRuns: Array<{
    scenarioId: string;
    runId: string;
    timestamp: number;
  }>;
  trend: "increasing" | "stable" | "decreasing";
}

// ============================================================================
// MECHANISM FEEDBACK
// ============================================================================

export interface MechanismFeedback {
  mechanism: MechanismId;
  strength: MechanismStrength;
  message: string;
  practiceHint: string | null;
}

export interface PatternFeedback {
  pattern: PatternId;
  valence: PatternValence;
  message: string;
  nextStep: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isMechanismId(value: string): value is MechanismId {
  return MECHANISMS.includes(value as MechanismId);
}

export function isPatternId(value: string): value is PatternId {
  return PATTERNS.includes(value as PatternId);
}

export function isStuckMomentDomain(value: string): value is StuckMomentDomain {
  return STUCK_MOMENT_DOMAINS.includes(value as StuckMomentDomain);
}

export function calculateMechanismStrength(normalizedScore: number): MechanismStrength {
  if (normalizedScore < MECHANISM_STRENGTH_THRESHOLDS.absent) return "absent";
  if (normalizedScore <= MECHANISM_STRENGTH_THRESHOLDS.weak) return "weak";
  if (normalizedScore <= MECHANISM_STRENGTH_THRESHOLDS.partial) return "partial";
  return "strong";
}

export function getMechanismDemonstrated(strength: MechanismStrength): boolean {
  return strength === "partial" || strength === "strong";
}

/**
 * PsychTrails Modular Scenario Authoring Types
 * Domain-agnostic, scalable authoring format with clinical extensions
 */

import type {
  ScenarioDifficulty,
  ScenarioCategory,
  ScoreCategory,
  ObjectiveType,
  ChoiceStyle,
  RiskLevel,
  EndingQuality,
  EndingRouteType,
  NodePresentationType,
  NodeMood,
  NodePacing,
  MasteryTier,
  Grade,
  ComparisonOperator,
} from "../types-v2";
import type { MechanismId, PatternId, StuckMomentDomain, MechanismStrength } from "../clinical-constants";

// ============================================================================
// CLINICAL EXTENSIONS
// ============================================================================

export interface StuckMomentSource {
  description: string;
  domain: StuckMomentDomain;
  trigger: string;
  internalExperience: string;
}

export interface MechanismEffectSource {
  mechanism: MechanismId;
  delta: number;
}

export interface MechanismOutcomeSource {
  demonstrated: boolean;
  strength: MechanismStrength;
  reason?: string;
}

export interface PatternOutcomesSource {
  positive: PatternId[];
  negative: PatternId[];
}

export interface MechanismSignatureSource {
  positive: MechanismId[];
  negative: MechanismId[];
}

export interface RoutePatternAssociationSource {
  positive: PatternId[];
  negative: PatternId[];
}

export interface ChallengeTargetSource {
  targetMechanisms: MechanismId[];
  targetPatterns: {
    trains: PatternId[];
    prevents: PatternId[];
  };
  transferFocus: string;
}

export interface TransferPromptsSource {
  default: string;
  byPattern?: Record<PatternId, string>;
  byRoute?: Record<string, string>;
}

export interface SmallestBetterMoveSource {
  choiceId: string;
  description: string;
}

export interface MechanismCoachingSource {
  whenStrong: string;
  whenWeak: string;
  practiceHint: string;
}

export interface PatternCoachingSource {
  detected: string;
  nextStep: string;
}

// ============================================================================
// METADATA MODULE
// ============================================================================

export interface ScenarioMetadataModule {
  id: string;
  version: string;
  title: string;
  summary: string;
  tags: string[];
  difficulty: ScenarioDifficulty;
  estimatedMinutes: number;
  icon: string;
  category: ScenarioCategory;
  packIds: string[];
  createdAt: string;
  updatedAt: string;
  
  // Clinical extensions (required for clinical usefulness)
  stuckMoment: StuckMomentSource;
  primaryMechanisms: MechanismId[];
  secondaryMechanisms?: MechanismId[];
  realWorldAnalogs: string[];
}

// ============================================================================
// STATE MODULE
// ============================================================================

export interface MetricDefinitionSource {
  key: string;
  label: string;
  min?: number;
  max?: number;
  higherIsBetter?: boolean;
  icon?: string;
}

export interface UnlockRequirementSource {
  type: "always" | "scenario-complete" | "scenario-mastery" | "pack-complete" | "pack-mastery" | "total-stars" | "total-scenarios" | "achievement" | "all-of" | "any-of";
  scenarioId?: string;
  packId?: string;
  achievementId?: string;
  minTier?: MasteryTier;
  count?: number;
  requirements?: UnlockRequirementSource[];
}

export interface ScenarioStateModule {
  startNodeId: string;
  initialMetrics: Record<string, number>;
  initialFlags: Record<string, boolean>;
  unlockRequirements: UnlockRequirementSource[];
  timeConfig: {
    stepLabel: string;
    stepLabelPlural: string;
    maxSteps: number;
  };
  uiConfig: {
    metrics: MetricDefinitionSource[];
    showTimeline: boolean;
    showEventLog: boolean;
    themeColor: string;
  };
}

// ============================================================================
// NODES MODULE
// ============================================================================

export interface NodeSource {
  id: string;
  text: string;
  choiceIds: string[];
  isEnding?: boolean;
  presentation: {
    type: NodePresentationType;
    mood: NodeMood;
    pacing: NodePacing;
  };
  routeMarkers?: string[];
  objectiveTriggers?: Array<{
    objectiveId: string;
    action: "progress" | "complete" | "fail";
  }>;
  isCheckpoint?: boolean;
}

export interface NodesModule {
  nodes: NodeSource[];
}

// ============================================================================
// CHOICES MODULE
// ============================================================================

export interface ConditionSource {
  type: "flag" | "metric" | "inventory" | "step" | "and" | "or" | "not";
  flag?: string;
  value?: boolean | number;
  metric?: string;
  item?: string;
  operator?: ComparisonOperator;
  conditions?: ConditionSource[];
  condition?: ConditionSource;
}

export interface EffectSource {
  type: "metric" | "metric-set" | "flag" | "inventory" | "inventory-set" | "end";
  metric?: string;
  change?: number;
  value?: number | boolean;
  flag?: string;
  item?: string;
  endingId?: string;
}

export interface ScoreEffectSource {
  category: ScoreCategory;
  points: number;
  reason: string;
}

export interface ObjectiveEffectSource {
  objectiveId: string;
  action: "progress" | "complete" | "fail";
}

export interface SkillSignalSource {
  skill: string;
  strength: number;
}

export interface ChoiceSource {
  id: string;
  text: string;
  description?: string;
  resultText?: string;
  condition?: ConditionSource | null;
  effects: EffectSource[];
  nextNodeId: string | null;
  advancesTime?: boolean;
  scoreEffects?: ScoreEffectSource[];
  routeTags?: string[];
  style?: ChoiceStyle;
  riskLevel?: RiskLevel;
  objectiveEffects?: ObjectiveEffectSource[];
  skillSignals?: SkillSignalSource[];
  
  // Clinical extensions
  mechanismEffects?: MechanismEffectSource[];
  patternTags?: PatternId[];

  // Behavioral Move Library reference
  moveId?: string;
}

export interface ChoicesModule {
  choices: ChoiceSource[];
}

// ============================================================================
// ENDINGS MODULE
// ============================================================================

export interface EndingSource {
  id: string;
  title: string;
  text: string;
  quality: EndingQuality;
  grade: Grade;
  rewards: {
    xpBase: number;
    masteryCredits: number;
    achievementTriggers?: string[];
  };
  routeType: EndingRouteType;
  starContribution: {
    baseStars: 0 | 1 | 2 | 3;
    requiresObjectives?: string[];
  };
  
  // Clinical extensions (required for clinical usefulness)
  mechanismOutcomes?: Record<MechanismId, MechanismOutcomeSource>;
  patternOutcomes?: PatternOutcomesSource;
  transferPrompts: TransferPromptsSource;
  reflectionPrompts?: string[];
  smallestBetterMove?: SmallestBetterMoveSource;
}

export interface EndingsModule {
  endings: EndingSource[];
}

// ============================================================================
// OBJECTIVES MODULE
// ============================================================================

export interface ObjectiveConditionSource {
  type: "reach-ending" | "reach-ending-quality" | "reach-node" | "choice-made" | "choice-avoided" | "flag-set" | "metric-threshold" | "steps-under" | "route-taken" | "all-of" | "any-of" | "none-of";
  endingId?: string;
  quality?: EndingQuality;
  nodeId?: string;
  choiceId?: string;
  flag?: string;
  value?: boolean | number;
  metric?: string;
  operator?: ComparisonOperator;
  maxSteps?: number;
  routeId?: string;
  conditions?: ObjectiveConditionSource[];
}

export interface ObjectiveSource {
  id: string;
  type: ObjectiveType;
  title: string;
  description: string;
  condition: ObjectiveConditionSource;
  showPreRun?: boolean;
  showInRun?: boolean;
  revealOnComplete?: boolean;
  reward: {
    xpBonus: number;
    starBonus?: number;
    achievementId?: string | null;
  };
}

export interface ObjectivesModule {
  objectives: ObjectiveSource[];
}

// ============================================================================
// ROUTES MODULE
// ============================================================================

export interface RouteIdentifierSource {
  type: "ending" | "choice-sequence" | "choice-includes" | "node-sequence" | "flag-combination";
  endingId?: string;
  choiceIds?: string[];
  choiceId?: string;
  nodeIds?: string[];
  flags?: Record<string, boolean>;
}

export interface RouteSource {
  id: string;
  name: string;
  description: string;
  identifiedBy: RouteIdentifierSource;
  isHidden?: boolean;
  isRecovery?: boolean;
  discoveryHint?: string | null;
  discoveryReward: {
    xpBonus: number;
    achievementId?: string | null;
  };
  
  // Clinical extensions
  mechanismSignature?: MechanismSignatureSource;
  associatedPatterns?: RoutePatternAssociationSource;
  transferMapping?: string;
}

export interface RoutesModule {
  routes: RouteSource[];
}

// ============================================================================
// CHALLENGES MODULE
// ============================================================================

export interface ChallengeModifierSource {
  type: "forbid-choices" | "forbid-style" | "require-ending-grade" | "max-steps" | "require-route" | "require-objectives";
  choiceIds?: string[];
  styles?: ChoiceStyle[];
  minGrade?: Grade;
  steps?: number;
  routeId?: string;
  objectiveIds?: string[];
}

export interface ChallengeSource {
  id: string;
  title: string;
  description: string;
  unlockRequirements: UnlockRequirementSource[];
  modifiers: ChallengeModifierSource[];
  xpMultiplier: number;
  masteryCredit: MasteryTier;
  achievementId?: string | null;
  
  // Clinical extensions
  targetMechanisms?: MechanismId[];
  targetPatterns?: {
    trains: PatternId[];
    prevents: PatternId[];
  };
  transferFocus?: string;
}

export interface ChallengesModule {
  challenges: ChallengeSource[];
}

// ============================================================================
// SCORING MODULE
// ============================================================================

export interface ScoringModule {
  completionBase: number;
  categoryWeights: Record<ScoreCategory, number>;
  positiveEndingBonus: number;
  mixedEndingBonus: number;
  negativeEndingBonus: number;
  objectiveBonus: number;
  routeDiscoveryBonus: number;
  hiddenRouteBonus: number;
  firstClearBonus: number;
  gradeThresholds: { S: number; A: number; B: number; C: number; D: number };
  maxScoreEstimate: number;
}

// ============================================================================
// HINTS MODULE (LLM + Replay)
// ============================================================================

export interface SkillSignalDefinitionSource {
  skill: string;
  description: string;
}

export interface HintsModule {
  scenarioContext: string;
  coachingFocus: string[];
  debriefPrompts: string[];
  skillSignals?: SkillSignalDefinitionSource[];
  
  // Clinical extensions
  mechanismCoaching?: Record<MechanismId, MechanismCoachingSource>;
  patternCoaching?: Record<PatternId, PatternCoachingSource>;
}

// ============================================================================
// EVENTS MODULE (Optional)
// ============================================================================

export interface GameEventSource {
  id: string;
  text: string;
  probability: number;
  condition?: ConditionSource | null;
  effects: EffectSource[];
}

export interface EventsModule {
  events: GameEventSource[];
}

// ============================================================================
// INTERPRETATION MODULE
// High-resolution post-run interpretation system
// ============================================================================

/**
 * Internal pattern IDs used for clinical modeling.
 * These are the "under the hood" labels that map to user-facing language.
 */
export type InternalPatternId =
  | "catastrophizing"
  | "black_and_white_thinking"
  | "mind_reading"
  | "emotional_reasoning"
  | "safety_behavior"
  | "experiential_avoidance"
  | "self_attack"
  | "threshold_collapse"
  | "perfectionism"
  | "distress_intolerance"
  | "values_aligned_action"
  | "repair_attempt"
  | "recovery_success"
  | "overcontrol"
  | "overforcing"
  | "grounded_interpretation"
  | "micro_step_success"
  | "distress_tolerated"
  | "support_utilized"
  | "direct_communication"
  | "flexible_response"
  | "compassionate_response"
  | "premature_exit"
  | "post_event_processing";

/**
 * Maps internal pattern IDs to user-facing plain-English labels.
 * This is the "translation layer" between clinical modeling and user experience.
 */
export interface PatternLabelMapSource {
  [internalPatternId: string]: string;
}

/**
 * Route-level interpretation authored for each discoverable route.
 */
export interface RouteInterpretationSource {
  /** Route ID this interpretation applies to */
  routeId: string;
  /** Short label for route summary display */
  routeSummaryLabel: string;
  /** One sharp sentence naming what showed up in this route */
  whatShowedUp: string;
  /** Internal pattern IDs active in this route (for cross-reference) */
  dominantInternalPatternIds: InternalPatternId[];
  /** User-facing pattern label (plain English) */
  dominantUserFacingPatternLabel: string;
  /** What this route reinforced in the user's system */
  routeReinforcement: string;
  /** Specific tiny behavioral rep to try next */
  routeNextRep: string;
  /** Why that next rep matters */
  routeWhyItMatters: string;
  /** Realistic consequence if this pattern keeps running */
  routeIfPatternKeepsRunning: string;
  /** Bridge to real-world transfer */
  routeTransferBridge: string;
  /** Display priority (higher = show earlier in lists) */
  priority: number;
}

/**
 * Step-level interpretation for a single turning point.
 */
export interface StepInterpretationSource {
  /** Unique ID for this step interpretation */
  id: string;
  /** Selector: which choice(s) trigger this interpretation */
  choiceIds?: string[];
  /** Selector: which node(s) trigger this interpretation */
  nodeIds?: string[];
  /** Selector: which route(s) this interpretation applies to */
  routeIds?: string[];
  /** Selector: which ending(s) this interpretation applies to */
  endingIds?: string[];
  /** Internal pattern IDs for clinical modeling */
  internalPatternIds: InternalPatternId[];
  /** User-facing pattern label (plain English) */
  userFacingPatternLabel: string;
  /** Short concrete reminder of the actual choice/action (anchors interpretation to move) */
  whatYouChose?: string;
  /** One sharp sentence naming the pattern */
  whatShowedUp: string;
  /** Why the move made sense in the moment */
  functionalIntent: string;
  /** Short-term payoff */
  immediatePayoff: string;
  /** Immediate or downstream cost */
  cost: string;
  /** What gets reinforced if this becomes the default */
  reinforcement: string;
  /** One tiny specific behavioral rep */
  tryNext: string;
  /** What doing that rep would teach */
  whyThisMatters: string;
  /** Realistic consequence if repeated */
  consequenceIfRepeated: string;
  /** Weight for turning point ranking (0-100) */
  turningPointWeight: number;
  /** Priority within same weight (higher = more important) */
  interpretationPriority: number;
  /** Valence: positive, negative, or mixed */
  stepValence: "positive" | "negative" | "mixed";
  /** Which mechanism this primarily affects */
  mechanismContribution?: MechanismId;
  /** Which pattern this primarily contributes to */
  patternContribution?: PatternId;
  /** Conditions for when to show this interpretation */
  displayConditions?: {
    requireFlags?: Record<string, boolean>;
    requireMetricAbove?: { metric: string; value: number };
    requireMetricBelow?: { metric: string; value: number };
  };
}

/**
 * Turning point selection configuration.
 */
export interface TurningPointConfigSource {
  /** Maximum turning points to show (default 3-5) */
  maxTurningPoints: number;
  /** Minimum turning point weight to be considered */
  minWeight: number;
  /** Weights for ranking factors */
  rankingWeights: {
    turningPointWeight: number;
    interpretationPriority: number;
    routeDivergence: number;
    patternContribution: number;
    mechanismShift: number;
  };
}

/**
 * Fallback interpretation blocks for when specific interpretations aren't available.
 */
export interface FallbackInterpretationSource {
  /** ID for this fallback */
  id: string;
  /** When to use this fallback */
  condition: "no_route_match" | "no_step_match" | "default";
  /** Route-level fallback content */
  routeLevel?: {
    whatShowedUp: string;
    reinforcement: string;
    nextRep: string;
    whyItMatters: string;
    ifPatternKeepsRunning: string;
  };
  /** Step-level fallback content */
  stepLevel?: {
    whatShowedUp: string;
    functionalIntent: string;
    immediatePayoff: string;
    cost: string;
    reinforcement: string;
    tryNext: string;
    whyThisMatters: string;
    consequenceIfRepeated: string;
  };
}

/**
 * The full interpretation module for a scenario.
 * This is the source-of-truth file: interpretation.json
 */
export interface InterpretationModule {
  /** Version of interpretation schema */
  version: string;
  /** Pattern label map: internal IDs → user-facing language */
  patternLabelMap: PatternLabelMapSource;
  /** Route-level interpretations */
  routeInterpretations: RouteInterpretationSource[];
  /** Step-level interpretations (turning points) */
  stepInterpretations: StepInterpretationSource[];
  /** Turning point selection configuration */
  turningPointConfig: TurningPointConfigSource;
  /** Fallback interpretations */
  fallbacks: FallbackInterpretationSource[];
  /** Mid-run insight beats (optional) */
  insightBeats?: InsightBeatSource[];
  /** Insight beat configuration (optional) */
  insightBeatConfig?: InsightBeatConfigSource;
}

// ============================================================================
// INSIGHT BEATS - Mid-run psychological realizations
// ============================================================================

/** Category of insight beat */
export type InsightBeatCategory =
  | "safety_behavior"
  | "interpretation"
  | "threshold"
  | "avoidance"
  | "approach"
  | "recovery"
  | "micro_success"
  | "overforcing"
  | "grounding";

/** Internal psychological state the user is experiencing */
export type InternalState =
  | "anxiety_spike"
  | "shutdown"
  | "overcontrol"
  | "self_attack"
  | "uncertainty_spiral"
  | "avoidance_urge"
  | "overwhelm"
  | "collapse_after_pressure"
  | "recovery_window"
  | "grounded_approach"
  | "post_event_rumination";

/** A micro-intervention - immediate action to help in the moment */
export interface MicroInterventionSource {
  /** Unique ID within this beat */
  id: string;
  /** The intervention text - sharp, plain English, immediate */
  text: string;
  /** What internal state this intervention helps with */
  targetState: InternalState;
  /** Optional: very brief "why" */
  why?: string;
}

/** Trigger conditions for an insight beat */
export interface InsightBeatTriggerSource {
  /** Choices that can trigger this beat (any match triggers) */
  choiceIds: string[];
  /** Required flags for beat to trigger (all must match) */
  requireFlags?: Record<string, boolean>;
  /** Flag that must NOT be set */
  requireFlagAbsent?: string;
  /** Metric threshold requirement */
  requireMetricAbove?: { metric: string; value: number };
  /** Metric below threshold requirement */
  requireMetricBelow?: { metric: string; value: number };
  /** Minimum step number (0-indexed) for beat to fire */
  minStep?: number;
  /** Maximum step number for beat to fire */
  maxStep?: number;
  /** Required pattern tags from recent choices */
  requireRecentPatternTags?: PatternId[];
  /** Suppressed if these flags are set */
  suppressIfFlags?: string[];
}

/** A mid-run insight beat source definition */
export interface InsightBeatSource {
  /** Unique identifier */
  id: string;
  /** Trigger conditions */
  trigger: InsightBeatTriggerSource;
  /** Internal pattern IDs this represents */
  internalPatternIds: InternalPatternId[];
  /** User-facing headline label */
  userFacingLabel: string;
  /** The sharp "oh shit" insight text (1-2 sentences) */
  insightText: string;
  /** Optional: why this matters (brief) */
  whyItMatters?: string;
  /** Optional: micro-cue for what to try next time (ultra-brief) - for LATER, not immediate */
  tryNextCue?: string;
  /** Valence of the insight */
  valence: "positive" | "negative" | "mixed";
  /** Priority for selection (higher = more likely) */
  priority: number;
  /** Mechanism this beat relates to */
  mechanismContribution?: MechanismId;
  /** Pattern this beat represents */
  patternContribution?: PatternId;
  /** Category for grouping/analytics */
  category: InsightBeatCategory;
  /** Flag to set when this beat fires */
  setFlagOnTrigger?: string;

  // === MICRO-INTERVENTION LAYER ===

  /** The internal psychological state this beat is surfacing */
  internalState?: InternalState;
  /** 2-3 immediate micro-interventions for staying in the run */
  microInterventions?: MicroInterventionSource[];
  /** Whether to show interventions (default: true if microInterventions present) */
  showInterventions?: boolean;
}

/** Configuration for the insight beat system */
export interface InsightBeatConfigSource {
  /** Maximum beats per run */
  maxBeatsPerRun: number;
  /** Minimum steps between beats */
  cooldownSteps: number;
  /** Global enable/disable */
  enabled: boolean;

  // === INTERVENTION CONFIGURATION ===

  /** Maximum times to show interventions per run */
  maxInterventionShowsPerRun?: number;
  /** Minimum steps between showing interventions */
  interventionCooldownSteps?: number;
  /** Global enable/disable for interventions */
  interventionsEnabled?: boolean;
}

// ============================================================================
// FULL SCENARIO SOURCE (Assembled from modules)
// ============================================================================

export interface ScenarioSource {
  metadata: ScenarioMetadataModule;
  state: ScenarioStateModule;
  nodes: NodesModule;
  choices: ChoicesModule;
  endings: EndingsModule;
  objectives: ObjectivesModule;
  routes: RoutesModule;
  challenges: ChallengesModule;
  scoring: ScoringModule;
  hints: HintsModule;
  events?: EventsModule;
  interpretation?: InterpretationModule;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationError {
  module: string;
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  stats: {
    nodeCount: number;
    choiceCount: number;
    endingCount: number;
    objectiveCount: number;
    routeCount: number;
    challengeCount: number;
  };
}

// ============================================================================
// COMPILE RESULT
// ============================================================================

export interface CompileResult {
  success: boolean;
  scenario: import("../types-v2").ScenarioV2 | null;
  validation: ValidationResult;
  sourceHash: string;
}

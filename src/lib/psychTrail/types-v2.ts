import type { MechanismId, PatternId, StuckMomentDomain, MechanismStrength, MechanismRunScore, PatternDetection, MechanismFeedback, PatternFeedback } from "./clinical-constants";

export type ScoreCategory = "directness" | "persistence" | "recovery" | "exploration" | "clarity" | "resilience";
export type Grade = "S" | "A" | "B" | "C" | "D" | "F";
export type MasteryTier = "none" | "bronze" | "silver" | "gold" | "platinum";
export type Rank = "novice" | "apprentice" | "practitioner" | "adept" | "expert" | "master" | "grandmaster";
export type PackCategory = "starter" | "themed" | "life-stage" | "challenge" | "premium";
export type ScenarioDifficulty = "beginner" | "intermediate" | "advanced";
export type ScenarioCategory = "condition" | "medication" | "therapy" | "life-event" | "system" | "other";
export type ObjectiveType = "primary" | "challenge" | "hidden";
export type ChoiceStyle = "direct" | "indirect" | "recovery" | "avoidant" | "exploratory" | "supportive";
export type RiskLevel = "safe" | "moderate" | "bold";
export type EndingQuality = "positive" | "mixed" | "negative";
export type EndingRouteType = "main" | "alternate" | "hidden";
export type NodePresentationType = "narrative" | "thought" | "dialogue" | "flashback" | "action";
export type NodeMood = "neutral" | "tense" | "hopeful" | "anxious" | "calm" | "confident" | "heavy" | "numb" | "vulnerable";
export type NodePacing = "normal" | "fast" | "slow";
export type ComparisonOperator = ">" | "<" | ">=" | "<=" | "==";
export type AchievementCategory = "progress" | "stars" | "routes" | "mastery" | "challenges" | "performance" | "packs";

// Re-export clinical types for convenience
export type { MechanismId, PatternId, StuckMomentDomain, MechanismStrength, MechanismRunScore, PatternDetection, MechanismFeedback, PatternFeedback };

export interface PackTheme {
  primaryColor: string;
  accentColor: string;
  backgroundGradient: string;
}

export interface PackChallenge {
  id: string;
  title: string;
  description: string;
  condition: PackChallengeCondition;
  reward: { xpBonus: number; achievementId: string | null };
}

export type PackChallengeCondition =
  | { type: "all-scenarios-completed" }
  | { type: "all-scenarios-mastery"; minTier: MasteryTier }
  | { type: "total-stars"; minStars: number }
  | { type: "all-routes-discovered" };

export interface Pack {
  id: string;
  version: string;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  coverImage: string;
  theme: PackTheme;
  scenarioIds: string[];
  unlockRequirements: UnlockRequirement[];
  packChallenges: PackChallenge[];
  category: PackCategory;
  difficulty: ScenarioDifficulty;
  estimatedTotalMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export type UnlockRequirement =
  | { type: "always" }
  | { type: "scenario-complete"; scenarioId: string }
  | { type: "scenario-mastery"; scenarioId: string; minTier: MasteryTier }
  | { type: "pack-complete"; packId: string }
  | { type: "pack-mastery"; packId: string; minTier: MasteryTier }
  | { type: "total-stars"; count: number }
  | { type: "total-scenarios"; count: number }
  | { type: "achievement"; achievementId: string }
  | { type: "all-of"; requirements: UnlockRequirement[] }
  | { type: "any-of"; requirements: UnlockRequirement[] };

export interface ScoringConfig {
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

export type ObjectiveCondition =
  | { type: "reach-ending"; endingId: string }
  | { type: "reach-ending-quality"; quality: EndingQuality }
  | { type: "reach-node"; nodeId: string }
  | { type: "choice-made"; choiceId: string }
  | { type: "choice-avoided"; choiceId: string }
  | { type: "flag-set"; flag: string; value: boolean }
  | { type: "metric-threshold"; metric: string; operator: ComparisonOperator; value: number }
  | { type: "steps-under"; maxSteps: number }
  | { type: "route-taken"; routeId: string }
  | { type: "all-of"; conditions: ObjectiveCondition[] }
  | { type: "any-of"; conditions: ObjectiveCondition[] }
  | { type: "none-of"; conditions: ObjectiveCondition[] };

export interface ObjectiveReward {
  xpBonus: number;
  starBonus: number;
  achievementId: string | null;
}

export interface Objective {
  id: string;
  type: ObjectiveType;
  title: string;
  description: string;
  condition: ObjectiveCondition;
  showPreRun: boolean;
  showInRun: boolean;
  revealOnComplete: boolean;
  reward: ObjectiveReward;
}

export type RouteIdentifier =
  | { type: "ending"; endingId: string }
  | { type: "choice-sequence"; choiceIds: string[] }
  | { type: "choice-includes"; choiceId: string }
  | { type: "node-sequence"; nodeIds: string[] }
  | { type: "flag-combination"; flags: Record<string, boolean> };

export interface MechanismSignature {
  positive: MechanismId[];
  negative: MechanismId[];
}

export interface RoutePatternAssociation {
  positive: PatternId[];
  negative: PatternId[];
}

export interface RouteDefinition {
  id: string;
  name: string;
  description: string;
  identifiedBy: RouteIdentifier;
  isHidden: boolean;
  isRecovery: boolean;
  discoveryHint: string | null;
  discoveryReward: { xpBonus: number; achievementId: string | null };
  
  // Clinical extensions
  mechanismSignature: MechanismSignature;
  associatedPatterns: RoutePatternAssociation;
  transferMapping: string | null;
}

export type ChallengeModifier =
  | { type: "forbid-choices"; choiceIds: string[] }
  | { type: "forbid-style"; styles: ChoiceStyle[] }
  | { type: "require-ending-grade"; minGrade: Grade }
  | { type: "max-steps"; steps: number }
  | { type: "require-route"; routeId: string }
  | { type: "require-objectives"; objectiveIds: string[] };

export interface ChallengeTargetPatterns {
  trains: PatternId[];
  prevents: PatternId[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  unlockRequirements: UnlockRequirement[];
  modifiers: ChallengeModifier[];
  xpMultiplier: number;
  masteryCredit: MasteryTier;
  achievementId: string | null;
  
  // Clinical extensions
  targetMechanisms: MechanismId[];
  targetPatterns: ChallengeTargetPatterns;
  transferFocus: string | null;
}

export interface NodePresentation {
  type: NodePresentationType;
  mood: NodeMood;
  pacing: NodePacing;
}

export interface ObjectiveTrigger {
  objectiveId: string;
  action: "progress" | "complete" | "fail";
}

export interface NodeV2 {
  id: string;
  text: string;
  choiceIds: string[];
  isEnding: boolean;
  presentation: NodePresentation;
  routeMarkers: string[];
  objectiveTriggers: ObjectiveTrigger[];
  isCheckpoint: boolean;
}

export interface ScoreEffect {
  category: ScoreCategory;
  points: number;
  reason: string;
}

export interface ObjectiveEffect {
  objectiveId: string;
  action: "progress" | "complete" | "fail";
}

export interface SkillSignal {
  skill: string;
  strength: number;
}

export interface ConditionV2 {
  type: "flag" | "metric" | "inventory" | "step" | "and" | "or" | "not";
  flag?: string;
  value?: boolean | number;
  metric?: string;
  item?: string;
  operator?: ComparisonOperator;
  conditions?: ConditionV2[];
  condition?: ConditionV2;
}

export interface EffectV2 {
  type: "metric" | "metric-set" | "flag" | "inventory" | "inventory-set" | "end";
  metric?: string;
  change?: number;
  value?: number | boolean;
  flag?: string;
  item?: string;
  endingId?: string;
}

export interface MechanismEffect {
  mechanism: MechanismId;
  delta: number;
}

export interface ChoiceV2 {
  id: string;
  text: string;
  description: string;
  resultText: string;
  condition: ConditionV2 | null;
  effects: EffectV2[];
  nextNodeId: string | null;
  advancesTime: boolean;
  scoreEffects: ScoreEffect[];
  routeTags: string[];
  style: ChoiceStyle;
  riskLevel: RiskLevel;
  objectiveEffects: ObjectiveEffect[];
  skillSignals: SkillSignal[];

  // Clinical extensions
  mechanismEffects: MechanismEffect[];
  patternTags: PatternId[];

  /**
   * Reference to a canonical behavioral move from the move library.
   * When present, the move's behavioral analysis (hidden bargain, cost,
   * reinforcement, consequence, interventions) is available for:
   * - Automatic step interpretation generation
   * - Automatic insight beat generation
   * - Future LLM augmentation payloads
   */
  moveId?: string;
}

export interface EndingRewards {
  xpBase: number;
  masteryCredits: number;
  achievementTriggers: string[];
}

export interface StarContribution {
  baseStars: 0 | 1 | 2 | 3;
  requiresObjectives: string[];
}

export interface MechanismOutcome {
  demonstrated: boolean;
  strength: MechanismStrength;
  reason?: string;
}

export interface PatternOutcomes {
  positive: PatternId[];
  negative: PatternId[];
}

export interface TransferPrompts {
  default: string;
  byPattern: Record<PatternId, string>;
  byRoute: Record<string, string>;
}

export interface SmallestBetterMove {
  choiceId: string;
  description: string;
}

export interface EndingV2 {
  id: string;
  title: string;
  text: string;
  quality: EndingQuality;
  grade: Grade;
  rewards: EndingRewards;
  routeType: EndingRouteType;
  starContribution: StarContribution;
  
  // Clinical extensions
  mechanismOutcomes: Record<MechanismId, MechanismOutcome>;
  patternOutcomes: PatternOutcomes;
  transferPrompts: TransferPrompts;
  reflectionPrompts: string[];
  smallestBetterMove: SmallestBetterMove | null;
}

export interface GameEventV2 {
  id: string;
  text: string;
  probability: number;
  condition: ConditionV2 | null;
  effects: EffectV2[];
}

export interface TimeConfig {
  stepLabel: string;
  stepLabelPlural: string;
  maxSteps: number;
}

export interface MetricDefinition {
  key: string;
  label: string;
  min: number;
  max: number;
  higherIsBetter: boolean;
  icon?: string;
}

export interface UIConfig {
  metrics: MetricDefinition[];
  showTimeline: boolean;
  showEventLog: boolean;
  themeColor: string;
}

export interface SkillSignalDefinition {
  skill: string;
  description: string;
}

export interface MechanismCoaching {
  whenStrong: string;
  whenWeak: string;
  practiceHint: string;
}

export interface PatternCoaching {
  detected: string;
  nextStep: string;
}

export interface LLMHints {
  scenarioContext: string;
  coachingFocus: string[];
  debriefPrompts: string[];
  mechanismCoaching: Record<MechanismId, MechanismCoaching>;
  patternCoaching: Record<PatternId, PatternCoaching>;
}

export interface StuckMoment {
  description: string;
  domain: StuckMomentDomain;
  trigger: string;
  internalExperience: string;
}

export interface ScenarioV2 {
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
  unlockRequirements: UnlockRequirement[];
  timeConfig: TimeConfig;
  uiConfig: UIConfig;
  startNodeId: string;
  initialMetrics: Record<string, number>;
  initialFlags: Record<string, boolean>;
  scoringConfig: ScoringConfig;
  objectives: Objective[];
  routes: RouteDefinition[];
  challenges: Challenge[];
  nodes: NodeV2[];
  choices: ChoiceV2[];
  events: GameEventV2[];
  endings: EndingV2[];
  skillSignals: SkillSignalDefinition[];
  llmHints: LLMHints;
  createdAt: string;
  updatedAt: string;
  
  // Clinical extensions
  stuckMoment: StuckMoment;
  primaryMechanisms: MechanismId[];
  secondaryMechanisms: MechanismId[];
  realWorldAnalogs: string[];

  // Interpretation layer
  interpretation: InterpretationLayer | null;
}

export interface HistoryEntryV2 {
  step: number;
  nodeId: string;
  choiceId: string | null;
  events: string[];
  metricsSnapshot: Record<string, number>;
  scoreSnapshot: Record<ScoreCategory, number>;
}

export interface RunStateV2 {
  scenarioId: string;
  currentStep: number;
  currentNodeId: string;
  metrics: Record<string, number>;
  flags: Record<string, boolean>;
  inventory: Record<string, number>;
  history: HistoryEntryV2[];
  seed: number;
  isEnded: boolean;
  endingId: string | null;
  challengeId: string | null;
  categoryScores: Record<ScoreCategory, number>;
  choiceSequence: string[];
  nodeSequence: string[];
}

export interface TurnInputV2 {
  choiceId: string;
}

export interface ObjectiveUpdate {
  objectiveId: string;
  action: "progress" | "complete" | "fail";
  newStatus: "pending" | "completed" | "failed";
}

export interface TurnResultV2 {
  newState: RunStateV2;
  triggeredEvents: GameEventV2[];
  choice: ChoiceV2;
  scoreGained: Record<ScoreCategory, number>;
  objectiveUpdates: ObjectiveUpdate[];
}

export interface RunScoreResult {
  totalScore: number;
  categoryScores: Record<ScoreCategory, number>;
  grade: Grade;
  percentOfMax: number;
  bonuses: { source: string; points: number; reason: string }[];
}

export interface ObjectiveResult {
  objective: Objective;
  completed: boolean;
  revealed: boolean;
}

export interface RouteDetectionResult {
  routeId: string | null;
  routeName: string | null;
  isNewDiscovery: boolean;
  isHidden: boolean;
  xpBonus: number;
}

export interface MasteryRequirement {
  description: string;
  met: boolean;
}

export interface MasteryProgress {
  currentTier: MasteryTier;
  previousTier: MasteryTier;
  tierAdvanced: boolean;
  routePercentage: number;
  objectivesCompleted: number;
  objectivesTotal: number;
  challengesCompleted: number;
  challengesTotal: number;
  bestStars: number;
  bestGrade: Grade;
  nextTierRequirements: MasteryRequirement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  condition: AchievementCondition;
  xpReward: number;
}

export type AchievementCondition =
  | { type: "scenarios-completed"; count: number }
  | { type: "scenario-completed"; scenarioId: string }
  | { type: "stars-earned"; count: number }
  | { type: "three-stars"; scenarioId?: string }
  | { type: "routes-discovered"; count: number }
  | { type: "hidden-route-discovered"; scenarioId?: string }
  | { type: "all-routes-scenario"; scenarioId: string }
  | { type: "mastery-tier"; tier: MasteryTier; scenarioId?: string }
  | { type: "mastery-count"; tier: MasteryTier; count: number }
  | { type: "challenge-completed"; challengeId?: string }
  | { type: "challenges-completed"; count: number }
  | { type: "grade-achieved"; grade: Grade }
  | { type: "comeback" }
  | { type: "pack-completed"; packId: string }
  | { type: "packs-completed"; count: number };

export interface ScenarioProgress {
  completions: number;
  bestStars: 0 | 1 | 2 | 3;
  bestGrade: Grade;
  bestScore: number;
  masteryTier: MasteryTier;
  completedObjectives: string[];
  completedChallenges: string[];
  firstCompletedAt: number;
  lastPlayedAt: number;
}

export interface PackProgress {
  scenariosCompleted: number;
  totalStars: number;
  masteryTier: MasteryTier;
  firstCompletedAt: number | null;
}

export interface GlobalProgress {
  totalXP: number;
  rank: Rank;
  totalRuns: number;
  totalScenariosCompleted: number;
  totalPacksCompleted: number;
  totalRoutesDiscovered: number;
  firstPlayAt: number;
  lastPlayAt: number;
}

export interface BestRun {
  score: number;
  grade: Grade;
  stars: number;
  routeId: string | null;
  objectivesCompleted: string[];
  challengeId: string | null;
  timestamp: number;
}

export interface ProgressState {
  version: number;
  scenarios: Record<string, ScenarioProgress>;
  routes: Record<string, string[]>;
  bestRuns: Record<string, BestRun>;
  packs: Record<string, PackProgress>;
  achievements: string[];
  unlocks: {
    scenarios: string[];
    packs: string[];
    challenges: Record<string, string[]>;
  };
  global: GlobalProgress;
  _profileId: string | null;
}

// ============================================================================
// INTERPRETATION TYPES (Compiled)
// High-resolution post-run interpretation system
// ============================================================================

/** Internal pattern ID for clinical modeling */
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

/** Pattern label map: internal → user-facing */
export type PatternLabelMap = Record<InternalPatternId, string>;

/** Route-level interpretation (compiled) */
export interface RouteInterpretation {
  routeId: string;
  routeSummaryLabel: string;
  whatShowedUp: string;
  dominantInternalPatternIds: InternalPatternId[];
  dominantUserFacingPatternLabel: string;
  routeReinforcement: string;
  routeNextRep: string;
  routeWhyItMatters: string;
  routeIfPatternKeepsRunning: string;
  routeTransferBridge: string;
  priority: number;
}

/** Step-level interpretation (compiled) */
export interface StepInterpretation {
  id: string;
  choiceIds: string[];
  nodeIds: string[];
  routeIds: string[];
  endingIds: string[];
  internalPatternIds: InternalPatternId[];
  userFacingPatternLabel: string;
  whatYouChose: string | null;
  whatShowedUp: string;
  functionalIntent: string;
  immediatePayoff: string;
  cost: string;
  reinforcement: string;
  tryNext: string;
  whyThisMatters: string;
  consequenceIfRepeated: string;
  turningPointWeight: number;
  interpretationPriority: number;
  stepValence: "positive" | "negative" | "mixed";
  mechanismContribution: MechanismId | null;
  patternContribution: PatternId | null;
  displayConditions: {
    requireFlags: Record<string, boolean>;
    requireMetricAbove: { metric: string; value: number } | null;
    requireMetricBelow: { metric: string; value: number } | null;
  } | null;
}

/** Turning point configuration (compiled) */
export interface TurningPointConfig {
  maxTurningPoints: number;
  minWeight: number;
  rankingWeights: {
    turningPointWeight: number;
    interpretationPriority: number;
    routeDivergence: number;
    patternContribution: number;
    mechanismShift: number;
  };
}

/** Fallback interpretation (compiled) */
export interface FallbackInterpretation {
  id: string;
  condition: "no_route_match" | "no_step_match" | "default";
  routeLevel: {
    whatShowedUp: string;
    reinforcement: string;
    nextRep: string;
    whyItMatters: string;
    ifPatternKeepsRunning: string;
  } | null;
  stepLevel: {
    whatShowedUp: string;
    functionalIntent: string;
    immediatePayoff: string;
    cost: string;
    reinforcement: string;
    tryNext: string;
    whyThisMatters: string;
    consequenceIfRepeated: string;
  } | null;
}

/** Full interpretation layer (compiled into ScenarioV2) */
export interface InterpretationLayer {
  version: string;
  patternLabelMap: Partial<PatternLabelMap>;
  routeInterpretations: RouteInterpretation[];
  stepInterpretations: StepInterpretation[];
  turningPointConfig: TurningPointConfig;
  fallbacks: FallbackInterpretation[];
  /** Mid-run insight beats - rare, sharp realizations during gameplay */
  insightBeats: InsightBeat[];
  /** Configuration for insight beat triggering */
  insightBeatConfig: InsightBeatConfig;
}

// ============================================================================
// INSIGHT BEATS - Mid-run psychological realizations
// ============================================================================

/** Trigger condition for when an insight beat should fire */
export interface InsightBeatTrigger {
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
  /** Suppressed if these flags are set (avoids redundant beats) */
  suppressIfFlags?: string[];
}

/** A mid-run insight beat - surfaced during gameplay at a meaningful moment */
export interface InsightBeat {
  /** Unique identifier for this beat */
  id: string;
  /** When this beat should trigger */
  trigger: InsightBeatTrigger;
  /** Internal pattern IDs this beat represents */
  internalPatternIds: InternalPatternId[];
  /** User-facing label shown as the insight headline */
  userFacingLabel: string;
  /** Short, sharp insight text (the "oh shit" moment) - 1-2 sentences max */
  insightText: string;
  /** Optional: Why this matters (kept very short) */
  whyItMatters?: string;
  /** Optional: Micro-cue for what to try next (ultra-brief) - for LATER, not immediate */
  tryNextCue?: string;
  /** Valence of this insight */
  valence: "positive" | "negative" | "mixed";
  /** Priority for selection when multiple beats could fire (higher = more likely) */
  priority: number;
  /** Mechanism this beat relates to */
  mechanismContribution?: MechanismId;
  /** Pattern this beat represents */
  patternContribution?: PatternId;
  /** Category of insight for grouping/analytics */
  category: InsightBeatCategory;
  /** Flag to set when this beat fires (prevents re-triggering) */
  setFlagOnTrigger?: string;

  // === MICRO-INTERVENTION LAYER ===

  /** The internal psychological state this beat is surfacing */
  internalState?: InternalState;
  /** 2-3 immediate micro-interventions for staying in the run */
  microInterventions?: MicroIntervention[];
  /** Whether to show interventions for this beat (default: true if microInterventions present) */
  showInterventions?: boolean;
}

/** Categories of insight beats */
export type InsightBeatCategory =
  | "safety_behavior"     // Reaching for shield/protection
  | "interpretation"      // How they're reading the situation
  | "threshold"           // Goal size / all-or-nothing
  | "avoidance"           // Pulling back at hard moment
  | "approach"            // Moving toward despite fear
  | "recovery"            // Catching/correcting mid-spiral
  | "micro_success"       // Finding workable small move
  | "overforcing"         // Pushing too hard
  | "grounding";          // Staying present

/**
 * Internal psychological state the user is experiencing.
 * Different from category (what type of insight) - this is what the user feels.
 */
export type InternalState =
  | "anxiety_spike"         // Nervous system activated, fear rising
  | "shutdown"              // System going offline, withdrawing
  | "overcontrol"           // Trying to manage everything, grip tightening
  | "self_attack"           // Turning criticism inward
  | "uncertainty_spiral"    // Mind racing with worst-case scenarios
  | "avoidance_urge"        // Strong pull to escape/bail
  | "overwhelm"             // Too much, can't process
  | "collapse_after_pressure" // Just failed/lost, system deflating
  | "recovery_window"       // Just caught something, opening available
  | "grounded_approach"     // Moving toward with presence
  | "post_event_rumination"; // Replaying, analyzing, picking apart

/**
 * A single micro-intervention - one immediate thing the user can do right now.
 * These are NOT "next time" suggestions. These are for staying in the run.
 */
export interface MicroIntervention {
  /** Unique ID within this beat */
  id: string;
  /** The intervention text - sharp, plain English, immediate */
  text: string;
  /** What internal state this intervention helps with */
  targetState: InternalState;
  /** Optional: very brief "why" (shown on tap/expand) */
  why?: string;
}

/** Configuration for insight beat system */
export interface InsightBeatConfig {
  /** Maximum beats to show per run */
  maxBeatsPerRun: number;
  /** Minimum steps between beats */
  cooldownSteps: number;
  /** Global enable/disable */
  enabled: boolean;

  // === INTERVENTION CONFIGURATION ===

  /** Maximum times to show interventions per run (prevents support fatigue) */
  maxInterventionShowsPerRun?: number;
  /** Minimum steps between showing interventions */
  interventionCooldownSteps?: number;
  /** Global enable/disable for interventions */
  interventionsEnabled?: boolean;
}

/** Triggered insight beat result (emitted by engine) */
export interface TriggeredInsightBeat {
  /** The beat definition that triggered */
  beat: InsightBeat;
  /** Choice that triggered this beat */
  triggeringChoiceId: string;
  /** Step number when triggered */
  stepNumber: number;
  /** Scenario context */
  scenarioId: string;
  /** Current route if detectable */
  routeIdHint: string | null;
  /** Structured payload for future LLM augmentation */
  llmPayload: InsightBeatLLMPayload;
  /** Whether to show interventions for this triggered beat */
  shouldShowInterventions: boolean;
  /** The interventions to show (may be empty) */
  availableInterventions: MicroIntervention[];
}

/** Structured payload for optional future LLM augmentation */
export interface InsightBeatLLMPayload {
  scenarioId: string;
  beatId: string;
  triggerSource: "choice";
  triggeringChoiceId: string;
  stepNumber: number;
  runProgressPercent: number;
  internalPatternIds: InternalPatternId[];
  mechanismId: MechanismId | null;
  patternId: PatternId | null;
  category: InsightBeatCategory;
  valence: "positive" | "negative" | "mixed";
  canonicalInsightText: string;
  canonicalWhyItMatters: string | null;
  canonicalTryNextCue: string | null;
  flagsAtTrigger: Record<string, boolean>;
  metricsAtTrigger: Record<string, number>;
  choiceSequence: string[];
  routeIdHint: string | null;

  // === INTERVENTION CONTEXT FOR FUTURE LLM AUGMENTATION ===

  /** Internal state being surfaced */
  internalState: InternalState | null;
  /** Canonical intervention options shown */
  canonicalInterventions: Array<{
    id: string;
    text: string;
    targetState: InternalState;
  }>;
  /** Whether interventions were shown */
  interventionsShown: boolean;
}

/** Record of a selected intervention (for outcome tracking) */
export interface InterventionSelection {
  beatId: string;
  interventionId: string;
  stepNumber: number;
  timestamp: number;
}

/** Route-level interpretation result (generated at runtime) */
export interface RouteInterpretationResult {
  routeId: string;
  routeSummaryLabel: string;
  whatShowedUp: string;
  userFacingPatternLabel: string;
  reinforcement: string;
  nextRep: string;
  whyItMatters: string;
  ifPatternKeepsRunning: string;
  transferBridge: string;
}

/** Step-level interpretation result (generated at runtime) */
export interface StepInterpretationResult {
  id: string;
  choiceId: string;
  stepNumber: number;
  userFacingPatternLabel: string;
  whatYouChose: string | null;
  whatShowedUp: string;
  functionalIntent: string;
  immediatePayoff: string;
  cost: string;
  reinforcement: string;
  tryNext: string;
  whyThisMatters: string;
  consequenceIfRepeated: string;
  valence: "positive" | "negative" | "mixed";
  turningPointRank: number;
}

/** Complete interpretation result for a run */
export interface InterpretationResult {
  /** Route-level interpretation */
  route: RouteInterpretationResult | null;
  /** Selected turning points (3-5 most meaningful steps) */
  turningPoints: StepInterpretationResult[];
  /** Whether fallbacks were used */
  usedFallbacks: boolean;
  /** Total choice count for context */
  totalChoices: number;
}

export interface StructuredRunSummary {
  scenarioId: string;
  scenarioTitle: string;
  scenarioSummary: string;
  scenarioTags: string[];
  nodeSequence: string[];
  choiceSequence: string[];
  choiceTexts: string[];
  endingId: string;
  endingTitle: string;
  endingQuality: EndingQuality;
  endingText: string;
  totalScore: number;
  categoryScores: Record<ScoreCategory, number>;
  grade: Grade;
  objectivesCompleted: { id: string; title: string }[];
  objectivesFailed: { id: string; title: string }[];
  routeId: string | null;
  routeName: string | null;
  isNewRoute: boolean;
  isHiddenRoute: boolean;
  challengeId: string | null;
  challengeTitle: string | null;
  challengeCompleted: boolean;
  isPersonalBest: boolean;
  attemptNumber: number;
  masteryTierBefore: MasteryTier;
  masteryTierAfter: MasteryTier;
  finalMetrics: Record<string, number>;
  flagsSet: string[];
  llmHints: LLMHints;

  // Clinical extensions
  mechanismScores: MechanismRunScore[];
  patternsDetected: PatternDetection[];
  transferPrompt: string;
  reflectionPrompts: string[];
  mechanismFeedback: MechanismFeedback[];
  patternFeedback: PatternFeedback[];
  smallestBetterMove: SmallestBetterMove | null;

  // Interpretation layer
  interpretation: InterpretationResult | null;
}

export interface RewardGrant {
  type: "xp" | "achievement" | "unlock" | "mastery";
  source: string;
  value: number | string;
  description: string;
}

export interface UnlockGrant {
  type: "scenario" | "pack" | "challenge" | "hint";
  id: string;
  title: string;
}

export interface ClinicalRunResult {
  mechanismScores: MechanismRunScore[];
  patternsDetected: PatternDetection[];
  transferPrompt: string;
  reflectionPrompts: string[];
  mechanismFeedback: MechanismFeedback[];
  patternFeedback: PatternFeedback[];
  smallestBetterMove: SmallestBetterMove | null;
  interpretation: InterpretationResult | null;
}

export interface EndOfRunResult {
  ending: EndingV2;
  score: RunScoreResult;
  starsEarned: 0 | 1 | 2 | 3;
  objectives: ObjectiveResult[];
  route: RouteDetectionResult;
  mastery: MasteryProgress;
  rewards: RewardGrant[];
  totalXPEarned: number;
  achievementsUnlocked: Achievement[];
  newUnlocks: UnlockGrant[];
  isPersonalBest: boolean;
  previousBest: BestRun | null;
  challengeCompleted: boolean;
  structuredSummary: StructuredRunSummary;
  
  // Clinical extensions
  clinical: ClinicalRunResult;
}

export interface ProfileState {
  id: string;
  email: string;
  createdAt: number;
  character: CharacterState | null;
}

export interface CharacterState {
  name: string;
  avatarId: string;
  level: number;
  totalXP: number;
  traits: Record<string, number>;
  activeBuildId: string;
  builds: Build[];
}

export interface Build {
  id: string;
  name: string;
  modifiers: BuildModifier[];
}

export interface BuildModifier {
  type: "starting-metric-bonus" | "score-category-boost" | "unlock-discount";
  target: string;
  value: number;
}

export interface LLMDebrief {
  summary: string;
  strengths: { category: string; observation: string }[];
  growthAreas: { category: string; observation: string; suggestion: string }[];
  nextStepSuggestion: string;
}

export interface LLMCoaching {
  keyInsight: string;
  practicePrompt: string;
  encouragement: string;
}

export interface LLMRecommendation {
  type: "scenario" | "challenge" | "objective" | "route";
  id: string;
  title: string;
  reason: string;
  confidence: number;
}

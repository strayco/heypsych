/**
 * PsychTrails Scenario Compiler
 * Transforms modular source to runtime artifact with clinical extensions
 */

import type {
  ScenarioV2, NodeV2, ChoiceV2, EndingV2, Objective, RouteDefinition, Challenge,
  UnlockRequirement, ObjectiveCondition, RouteIdentifier, ChallengeModifier,
  ConditionV2, EffectV2, MechanismEffect, MechanismOutcome, PatternOutcomes,
  TransferPrompts, SmallestBetterMove, MechanismSignature, RoutePatternAssociation,
  ChallengeTargetPatterns, MechanismCoaching, PatternCoaching, StuckMoment,
  InterpretationLayer, RouteInterpretation, StepInterpretation, TurningPointConfig,
  FallbackInterpretation, InternalPatternId, InsightBeat, InsightBeatConfig, InsightBeatTrigger,
  MicroIntervention, InternalState
} from "../types-v2";
import type {
  ScenarioSource, CompileResult, UnlockRequirementSource, ObjectiveConditionSource,
  RouteIdentifierSource, ChallengeModifierSource, ConditionSource, EffectSource,
  MechanismEffectSource, MechanismOutcomeSource, PatternOutcomesSource,
  TransferPromptsSource, SmallestBetterMoveSource, MechanismSignatureSource,
  RoutePatternAssociationSource, MechanismCoachingSource, PatternCoachingSource,
  StuckMomentSource, InterpretationModule, RouteInterpretationSource,
  StepInterpretationSource, TurningPointConfigSource, FallbackInterpretationSource,
  InsightBeatSource, InsightBeatConfigSource
} from "./types";
import { DEFAULT_INSIGHT_BEAT_CONFIG } from "../insight-beats-engine";
import type { MechanismId, PatternId } from "../clinical-constants";
import { validateScenarioSource } from "./validator";
import { createHash } from "crypto";

export function compileScenario(source: ScenarioSource): CompileResult {
  const validation = validateScenarioSource(source);

  if (!validation.valid) {
    return {
      success: false,
      scenario: null,
      validation,
      sourceHash: "",
    };
  }

  const scenario = assembleScenario(source);
  const sourceHash = hashSource(source);

  return {
    success: true,
    scenario,
    validation,
    sourceHash,
  };
}

function assembleScenario(source: ScenarioSource): ScenarioV2 {
  return {
    id: source.metadata.id,
    version: source.metadata.version,
    title: source.metadata.title,
    summary: source.metadata.summary,
    tags: source.metadata.tags,
    difficulty: source.metadata.difficulty,
    estimatedMinutes: source.metadata.estimatedMinutes,
    icon: source.metadata.icon,
    category: source.metadata.category,
    packIds: source.metadata.packIds,
    unlockRequirements: source.state.unlockRequirements.map(convertUnlockRequirement),
    timeConfig: source.state.timeConfig,
    uiConfig: {
      metrics: source.state.uiConfig.metrics.map((m) => ({
        key: m.key,
        label: m.label,
        min: m.min ?? 0,
        max: m.max ?? 100,
        higherIsBetter: m.higherIsBetter ?? true,
        icon: m.icon,
      })),
      showTimeline: source.state.uiConfig.showTimeline,
      showEventLog: source.state.uiConfig.showEventLog,
      themeColor: source.state.uiConfig.themeColor,
    },
    startNodeId: source.state.startNodeId,
    initialMetrics: source.state.initialMetrics,
    initialFlags: source.state.initialFlags,
    scoringConfig: source.scoring,
    objectives: source.objectives.objectives.map(convertObjective),
    routes: source.routes.routes.map(convertRoute),
    challenges: source.challenges.challenges.map(convertChallenge),
    nodes: source.nodes.nodes.map(convertNode),
    choices: source.choices.choices.map(convertChoice),
    events: (source.events?.events || []).map((e) => ({
      id: e.id,
      text: e.text,
      probability: e.probability,
      condition: e.condition ? convertCondition(e.condition) : null,
      effects: e.effects.map(convertEffect),
    })),
    endings: source.endings.endings.map(convertEnding),
    skillSignals: (source.hints.skillSignals || []).map((s) => ({
      skill: s.skill,
      description: s.description,
    })),
    llmHints: convertLLMHints(source.hints),
    createdAt: source.metadata.createdAt,
    updatedAt: source.metadata.updatedAt,
    
    // Clinical extensions
    stuckMoment: convertStuckMoment(source.metadata.stuckMoment),
    primaryMechanisms: source.metadata.primaryMechanisms,
    secondaryMechanisms: source.metadata.secondaryMechanisms || [],
    realWorldAnalogs: source.metadata.realWorldAnalogs,

    // Interpretation layer
    interpretation: source.interpretation ? convertInterpretation(source.interpretation) : null,
  };
}

function convertStuckMoment(source: StuckMomentSource): StuckMoment {
  return {
    description: source.description,
    domain: source.domain,
    trigger: source.trigger,
    internalExperience: source.internalExperience,
  };
}

function convertLLMHints(hints: import("./types").HintsModule) {
  return {
    scenarioContext: hints.scenarioContext,
    coachingFocus: hints.coachingFocus,
    debriefPrompts: hints.debriefPrompts,
    mechanismCoaching: convertMechanismCoachingMap(hints.mechanismCoaching),
    patternCoaching: convertPatternCoachingMap(hints.patternCoaching),
  };
}

function convertMechanismCoachingMap(
  source: Record<MechanismId, MechanismCoachingSource> | undefined
): Record<MechanismId, MechanismCoaching> {
  if (!source) return {} as Record<MechanismId, MechanismCoaching>;
  const result: Record<string, MechanismCoaching> = {};
  for (const [key, value] of Object.entries(source)) {
    result[key] = {
      whenStrong: value.whenStrong,
      whenWeak: value.whenWeak,
      practiceHint: value.practiceHint,
    };
  }
  return result as Record<MechanismId, MechanismCoaching>;
}

function convertPatternCoachingMap(
  source: Record<PatternId, PatternCoachingSource> | undefined
): Record<PatternId, PatternCoaching> {
  if (!source) return {} as Record<PatternId, PatternCoaching>;
  const result: Record<string, PatternCoaching> = {};
  for (const [key, value] of Object.entries(source)) {
    result[key] = {
      detected: value.detected,
      nextStep: value.nextStep,
    };
  }
  return result as Record<PatternId, PatternCoaching>;
}

function convertNode(node: import("./types").NodeSource): NodeV2 {
  return {
    id: node.id,
    text: node.text,
    choiceIds: node.choiceIds,
    isEnding: node.isEnding ?? false,
    presentation: node.presentation,
    routeMarkers: node.routeMarkers ?? [],
    objectiveTriggers: (node.objectiveTriggers ?? []).map((t) => ({
      objectiveId: t.objectiveId,
      action: t.action,
    })),
    isCheckpoint: node.isCheckpoint ?? false,
  };
}

function convertChoice(choice: import("./types").ChoiceSource): ChoiceV2 {
  return {
    id: choice.id,
    text: choice.text,
    description: choice.description ?? "",
    resultText: choice.resultText ?? "",
    condition: choice.condition ? convertCondition(choice.condition) : null,
    effects: choice.effects.map(convertEffect),
    nextNodeId: choice.nextNodeId,
    advancesTime: choice.advancesTime ?? true,
    scoreEffects: choice.scoreEffects ?? [],
    routeTags: choice.routeTags ?? [],
    style: choice.style ?? "direct",
    riskLevel: choice.riskLevel ?? "safe",
    objectiveEffects: (choice.objectiveEffects ?? []).map((e) => ({
      objectiveId: e.objectiveId,
      action: e.action,
    })),
    skillSignals: (choice.skillSignals ?? []).map((s) => ({
      skill: s.skill,
      strength: s.strength,
    })),
    
    // Clinical extensions
    mechanismEffects: (choice.mechanismEffects ?? []).map((e) => ({
      mechanism: e.mechanism,
      delta: e.delta,
    })),
    patternTags: choice.patternTags ?? [],

    // Behavioral Move Library reference
    moveId: choice.moveId,
  };
}

function convertEnding(ending: import("./types").EndingSource): EndingV2 {
  return {
    id: ending.id,
    title: ending.title,
    text: ending.text,
    quality: ending.quality,
    grade: ending.grade,
    rewards: {
      xpBase: ending.rewards.xpBase,
      masteryCredits: ending.rewards.masteryCredits,
      achievementTriggers: ending.rewards.achievementTriggers ?? [],
    },
    routeType: ending.routeType,
    starContribution: {
      baseStars: ending.starContribution.baseStars,
      requiresObjectives: ending.starContribution.requiresObjectives ?? [],
    },
    
    // Clinical extensions
    mechanismOutcomes: convertMechanismOutcomes(ending.mechanismOutcomes),
    patternOutcomes: convertPatternOutcomes(ending.patternOutcomes),
    transferPrompts: convertTransferPrompts(ending.transferPrompts),
    reflectionPrompts: ending.reflectionPrompts ?? [],
    smallestBetterMove: ending.smallestBetterMove ? {
      choiceId: ending.smallestBetterMove.choiceId,
      description: ending.smallestBetterMove.description,
    } : null,
  };
}

function convertMechanismOutcomes(
  source: Record<MechanismId, MechanismOutcomeSource> | undefined
): Record<MechanismId, MechanismOutcome> {
  if (!source) return {} as Record<MechanismId, MechanismOutcome>;
  const result: Record<string, MechanismOutcome> = {};
  for (const [key, value] of Object.entries(source)) {
    result[key] = {
      demonstrated: value.demonstrated,
      strength: value.strength,
      reason: value.reason,
    };
  }
  return result as Record<MechanismId, MechanismOutcome>;
}

function convertPatternOutcomes(source: PatternOutcomesSource | undefined): PatternOutcomes {
  return {
    positive: source?.positive ?? [],
    negative: source?.negative ?? [],
  };
}

function convertTransferPrompts(source: TransferPromptsSource): TransferPrompts {
  return {
    default: source.default,
    byPattern: (source.byPattern ?? {}) as Record<PatternId, string>,
    byRoute: source.byRoute ?? {},
  };
}

function convertObjective(obj: import("./types").ObjectiveSource): Objective {
  return {
    id: obj.id,
    type: obj.type,
    title: obj.title,
    description: obj.description,
    condition: convertObjectiveCondition(obj.condition),
    showPreRun: obj.showPreRun ?? true,
    showInRun: obj.showInRun ?? true,
    revealOnComplete: obj.revealOnComplete ?? false,
    reward: {
      xpBonus: obj.reward.xpBonus,
      starBonus: obj.reward.starBonus ?? 0,
      achievementId: obj.reward.achievementId ?? null,
    },
  };
}

function convertObjectiveCondition(cond: ObjectiveConditionSource): ObjectiveCondition {
  switch (cond.type) {
    case "reach-ending":
      return { type: "reach-ending", endingId: cond.endingId! };
    case "reach-ending-quality":
      return { type: "reach-ending-quality", quality: cond.quality! };
    case "reach-node":
      return { type: "reach-node", nodeId: cond.nodeId! };
    case "choice-made":
      return { type: "choice-made", choiceId: cond.choiceId! };
    case "choice-avoided":
      return { type: "choice-avoided", choiceId: cond.choiceId! };
    case "flag-set":
      return { type: "flag-set", flag: cond.flag!, value: cond.value as boolean };
    case "metric-threshold":
      return { type: "metric-threshold", metric: cond.metric!, operator: cond.operator!, value: cond.value as number };
    case "steps-under":
      return { type: "steps-under", maxSteps: cond.maxSteps! };
    case "route-taken":
      return { type: "route-taken", routeId: cond.routeId! };
    case "all-of":
      return { type: "all-of", conditions: (cond.conditions || []).map(convertObjectiveCondition) };
    case "any-of":
      return { type: "any-of", conditions: (cond.conditions || []).map(convertObjectiveCondition) };
    case "none-of":
      return { type: "none-of", conditions: (cond.conditions || []).map(convertObjectiveCondition) };
    default:
      throw new Error(`Unknown objective condition type: ${(cond as any).type}`);
  }
}

function convertRoute(route: import("./types").RouteSource): RouteDefinition {
  return {
    id: route.id,
    name: route.name,
    description: route.description,
    identifiedBy: convertRouteIdentifier(route.identifiedBy),
    isHidden: route.isHidden ?? false,
    isRecovery: route.isRecovery ?? false,
    discoveryHint: route.discoveryHint ?? null,
    discoveryReward: {
      xpBonus: route.discoveryReward.xpBonus,
      achievementId: route.discoveryReward.achievementId ?? null,
    },
    
    // Clinical extensions
    mechanismSignature: convertMechanismSignature(route.mechanismSignature),
    associatedPatterns: convertRoutePatternAssociation(route.associatedPatterns),
    transferMapping: route.transferMapping ?? null,
  };
}

function convertMechanismSignature(source: MechanismSignatureSource | undefined): MechanismSignature {
  return {
    positive: source?.positive ?? [],
    negative: source?.negative ?? [],
  };
}

function convertRoutePatternAssociation(source: RoutePatternAssociationSource | undefined): RoutePatternAssociation {
  return {
    positive: source?.positive ?? [],
    negative: source?.negative ?? [],
  };
}

function convertRouteIdentifier(id: RouteIdentifierSource): RouteIdentifier {
  switch (id.type) {
    case "ending":
      return { type: "ending", endingId: id.endingId! };
    case "choice-sequence":
      return { type: "choice-sequence", choiceIds: id.choiceIds! };
    case "choice-includes":
      return { type: "choice-includes", choiceId: id.choiceId! };
    case "node-sequence":
      return { type: "node-sequence", nodeIds: id.nodeIds! };
    case "flag-combination":
      return { type: "flag-combination", flags: id.flags! };
    default:
      throw new Error(`Unknown route identifier type: ${(id as any).type}`);
  }
}

function convertChallenge(challenge: import("./types").ChallengeSource): Challenge {
  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    unlockRequirements: challenge.unlockRequirements.map(convertUnlockRequirement),
    modifiers: challenge.modifiers.map(convertChallengeModifier),
    xpMultiplier: challenge.xpMultiplier,
    masteryCredit: challenge.masteryCredit,
    achievementId: challenge.achievementId ?? null,
    
    // Clinical extensions
    targetMechanisms: challenge.targetMechanisms ?? [],
    targetPatterns: {
      trains: challenge.targetPatterns?.trains ?? [],
      prevents: challenge.targetPatterns?.prevents ?? [],
    },
    transferFocus: challenge.transferFocus ?? null,
  };
}

function convertChallengeModifier(mod: ChallengeModifierSource): ChallengeModifier {
  switch (mod.type) {
    case "forbid-choices":
      return { type: "forbid-choices", choiceIds: mod.choiceIds! };
    case "forbid-style":
      return { type: "forbid-style", styles: mod.styles! };
    case "require-ending-grade":
      return { type: "require-ending-grade", minGrade: mod.minGrade! };
    case "max-steps":
      return { type: "max-steps", steps: mod.steps! };
    case "require-route":
      return { type: "require-route", routeId: mod.routeId! };
    case "require-objectives":
      return { type: "require-objectives", objectiveIds: mod.objectiveIds! };
    default:
      throw new Error(`Unknown challenge modifier type: ${(mod as any).type}`);
  }
}

function convertUnlockRequirement(req: UnlockRequirementSource): UnlockRequirement {
  switch (req.type) {
    case "always":
      return { type: "always" };
    case "scenario-complete":
      return { type: "scenario-complete", scenarioId: req.scenarioId! };
    case "scenario-mastery":
      return { type: "scenario-mastery", scenarioId: req.scenarioId!, minTier: req.minTier! };
    case "pack-complete":
      return { type: "pack-complete", packId: req.packId! };
    case "pack-mastery":
      return { type: "pack-mastery", packId: req.packId!, minTier: req.minTier! };
    case "total-stars":
      return { type: "total-stars", count: req.count! };
    case "total-scenarios":
      return { type: "total-scenarios", count: req.count! };
    case "achievement":
      return { type: "achievement", achievementId: req.achievementId! };
    case "all-of":
      return { type: "all-of", requirements: (req.requirements || []).map(convertUnlockRequirement) };
    case "any-of":
      return { type: "any-of", requirements: (req.requirements || []).map(convertUnlockRequirement) };
    default:
      throw new Error(`Unknown unlock requirement type: ${(req as any).type}`);
  }
}

function convertCondition(cond: ConditionSource): ConditionV2 {
  switch (cond.type) {
    case "flag":
      return { type: "flag", flag: cond.flag, value: cond.value as boolean };
    case "metric":
      return { type: "metric", metric: cond.metric, operator: cond.operator, value: cond.value as number };
    case "inventory":
      return { type: "inventory", item: cond.item, operator: cond.operator, value: cond.value as number };
    case "step":
      return { type: "step", operator: cond.operator, value: cond.value as number };
    case "and":
      return { type: "and", conditions: (cond.conditions || []).map(convertCondition) };
    case "or":
      return { type: "or", conditions: (cond.conditions || []).map(convertCondition) };
    case "not":
      return { type: "not", condition: cond.condition ? convertCondition(cond.condition) : undefined };
    default:
      throw new Error(`Unknown condition type: ${(cond as any).type}`);
  }
}

function convertEffect(eff: EffectSource): EffectV2 {
  return {
    type: eff.type,
    metric: eff.metric,
    change: eff.change,
    value: eff.value,
    flag: eff.flag,
    item: eff.item,
    endingId: eff.endingId,
  };
}

function hashSource(source: ScenarioSource): string {
  const json = JSON.stringify(source, null, 0);
  return createHash("sha256").update(json).digest("hex").slice(0, 16);
}

// ============================================================================
// INTERPRETATION CONVERTERS
// ============================================================================

function convertInterpretation(source: InterpretationModule): InterpretationLayer {
  return {
    version: source.version,
    patternLabelMap: source.patternLabelMap as Partial<Record<InternalPatternId, string>>,
    routeInterpretations: source.routeInterpretations.map(convertRouteInterpretation),
    stepInterpretations: source.stepInterpretations.map(convertStepInterpretation),
    turningPointConfig: convertTurningPointConfig(source.turningPointConfig),
    fallbacks: source.fallbacks.map(convertFallbackInterpretation),
    insightBeats: (source.insightBeats ?? []).map(convertInsightBeat),
    insightBeatConfig: source.insightBeatConfig
      ? convertInsightBeatConfig(source.insightBeatConfig)
      : DEFAULT_INSIGHT_BEAT_CONFIG,
  };
}

function convertRouteInterpretation(source: RouteInterpretationSource): RouteInterpretation {
  return {
    routeId: source.routeId,
    routeSummaryLabel: source.routeSummaryLabel,
    whatShowedUp: source.whatShowedUp,
    dominantInternalPatternIds: source.dominantInternalPatternIds as InternalPatternId[],
    dominantUserFacingPatternLabel: source.dominantUserFacingPatternLabel,
    routeReinforcement: source.routeReinforcement,
    routeNextRep: source.routeNextRep,
    routeWhyItMatters: source.routeWhyItMatters,
    routeIfPatternKeepsRunning: source.routeIfPatternKeepsRunning,
    routeTransferBridge: source.routeTransferBridge,
    priority: source.priority,
  };
}

function convertStepInterpretation(source: StepInterpretationSource): StepInterpretation {
  return {
    id: source.id,
    choiceIds: source.choiceIds ?? [],
    nodeIds: source.nodeIds ?? [],
    routeIds: source.routeIds ?? [],
    endingIds: source.endingIds ?? [],
    internalPatternIds: source.internalPatternIds as InternalPatternId[],
    userFacingPatternLabel: source.userFacingPatternLabel,
    whatYouChose: source.whatYouChose ?? null,
    whatShowedUp: source.whatShowedUp,
    functionalIntent: source.functionalIntent,
    immediatePayoff: source.immediatePayoff,
    cost: source.cost,
    reinforcement: source.reinforcement,
    tryNext: source.tryNext,
    whyThisMatters: source.whyThisMatters,
    consequenceIfRepeated: source.consequenceIfRepeated,
    turningPointWeight: source.turningPointWeight,
    interpretationPriority: source.interpretationPriority,
    stepValence: source.stepValence,
    mechanismContribution: source.mechanismContribution ?? null,
    patternContribution: source.patternContribution ?? null,
    displayConditions: source.displayConditions ? {
      requireFlags: source.displayConditions.requireFlags ?? {},
      requireMetricAbove: source.displayConditions.requireMetricAbove ?? null,
      requireMetricBelow: source.displayConditions.requireMetricBelow ?? null,
    } : null,
  };
}

function convertTurningPointConfig(source: TurningPointConfigSource): TurningPointConfig {
  return {
    maxTurningPoints: source.maxTurningPoints,
    minWeight: source.minWeight,
    rankingWeights: {
      turningPointWeight: source.rankingWeights.turningPointWeight,
      interpretationPriority: source.rankingWeights.interpretationPriority,
      routeDivergence: source.rankingWeights.routeDivergence,
      patternContribution: source.rankingWeights.patternContribution,
      mechanismShift: source.rankingWeights.mechanismShift,
    },
  };
}

function convertFallbackInterpretation(source: FallbackInterpretationSource): FallbackInterpretation {
  return {
    id: source.id,
    condition: source.condition,
    routeLevel: source.routeLevel ? {
      whatShowedUp: source.routeLevel.whatShowedUp,
      reinforcement: source.routeLevel.reinforcement,
      nextRep: source.routeLevel.nextRep,
      whyItMatters: source.routeLevel.whyItMatters,
      ifPatternKeepsRunning: source.routeLevel.ifPatternKeepsRunning,
    } : null,
    stepLevel: source.stepLevel ? {
      whatShowedUp: source.stepLevel.whatShowedUp,
      functionalIntent: source.stepLevel.functionalIntent,
      immediatePayoff: source.stepLevel.immediatePayoff,
      cost: source.stepLevel.cost,
      reinforcement: source.stepLevel.reinforcement,
      tryNext: source.stepLevel.tryNext,
      whyThisMatters: source.stepLevel.whyThisMatters,
      consequenceIfRepeated: source.stepLevel.consequenceIfRepeated,
    } : null,
  };
}

// ============================================================================
// INSIGHT BEAT CONVERTERS
// ============================================================================

function convertInsightBeat(source: InsightBeatSource): InsightBeat {
  return {
    id: source.id,
    trigger: convertInsightBeatTrigger(source.trigger),
    internalPatternIds: source.internalPatternIds as InternalPatternId[],
    userFacingLabel: source.userFacingLabel,
    insightText: source.insightText,
    whyItMatters: source.whyItMatters,
    tryNextCue: source.tryNextCue,
    valence: source.valence,
    priority: source.priority,
    mechanismContribution: source.mechanismContribution,
    patternContribution: source.patternContribution,
    category: source.category,
    setFlagOnTrigger: source.setFlagOnTrigger,
    // Micro-intervention layer
    internalState: source.internalState as InternalState | undefined,
    microInterventions: source.microInterventions?.map(convertMicroIntervention),
    showInterventions: source.showInterventions,
  };
}

function convertMicroIntervention(source: import("./types").MicroInterventionSource): MicroIntervention {
  return {
    id: source.id,
    text: source.text,
    targetState: source.targetState as InternalState,
    why: source.why,
  };
}

function convertInsightBeatTrigger(source: import("./types").InsightBeatTriggerSource): InsightBeatTrigger {
  return {
    choiceIds: source.choiceIds,
    requireFlags: source.requireFlags,
    requireFlagAbsent: source.requireFlagAbsent,
    requireMetricAbove: source.requireMetricAbove,
    requireMetricBelow: source.requireMetricBelow,
    minStep: source.minStep,
    maxStep: source.maxStep,
    requireRecentPatternTags: source.requireRecentPatternTags,
    suppressIfFlags: source.suppressIfFlags,
  };
}

function convertInsightBeatConfig(source: InsightBeatConfigSource): InsightBeatConfig {
  return {
    maxBeatsPerRun: source.maxBeatsPerRun,
    cooldownSteps: source.cooldownSteps,
    enabled: source.enabled,
    // Intervention config
    maxInterventionShowsPerRun: source.maxInterventionShowsPerRun,
    interventionCooldownSteps: source.interventionCooldownSteps,
    interventionsEnabled: source.interventionsEnabled,
  };
}

/**
 * PsychTrails Insight Beats Engine
 *
 * Deterministic, modular, scenario-authored mid-run insight system.
 *
 * Insight beats are rare, sharp psychological realizations that surface
 * during gameplay at meaningful moments. They make the user feel:
 * "oh shit, that's exactly what I'm doing"
 *
 * Design principles:
 * - Deterministic: all triggers are authored, not generated
 * - Rare: 0-2 per run, max 3 in dense scenarios
 * - Sharp: 1-2 sentences, plain English, no clinical jargon
 * - Pattern-aware: triggered by choice + state context
 * - LLM-ready: emits structured payload for future augmentation
 *
 * Now with Behavioral Move Library integration:
 * - Choices with moveId automatically get insight beats from the move
 * - Scenario-specific beats take priority over move-generated ones
 * - This allows new behavioral moves to be authored as data, not code
 */

import type {
  ScenarioV2,
  RunStateV2,
  InsightBeat,
  InsightBeatConfig,
  InsightBeatTrigger,
  TriggeredInsightBeat,
  InsightBeatLLMPayload,
  PatternId,
  MicroIntervention,
  InterventionSelection,
} from "./types-v2";
import {
  generateMoveBasedInsightBeats,
  mergeInsightBeats,
} from "./move-resolver";

/** State tracked for insight beat suppression across a run */
export interface InsightBeatRunState {
  /** Number of beats shown this run */
  beatsShownCount: number;
  /** Step number when last beat was shown */
  lastBeatStep: number;
  /** IDs of beats already triggered this run */
  triggeredBeatIds: string[];

  // === INTERVENTION TRACKING ===

  /** Number of times interventions were shown this run */
  interventionsShownCount: number;
  /** Step number when interventions were last shown */
  lastInterventionStep: number;
  /** Record of selected interventions for outcome tracking */
  selectedInterventions: InterventionSelection[];
}

/** Create initial insight beat run state */
export function createInsightBeatRunState(): InsightBeatRunState {
  return {
    beatsShownCount: 0,
    lastBeatStep: -100, // Far in the past
    triggeredBeatIds: [],
    interventionsShownCount: 0,
    lastInterventionStep: -100,
    selectedInterventions: [],
  };
}

/**
 * Evaluate whether any insight beat should trigger after a turn.
 * Returns the highest-priority beat that passes all conditions, or null.
 *
 * Now integrates move-generated beats:
 * 1. Generates insight beats from choices with moveId
 * 2. Merges with scenario-specific beats (scenario takes priority)
 * 3. Evaluates all beats and returns highest priority match
 */
export function evaluateInsightBeats(
  scenario: ScenarioV2,
  state: RunStateV2,
  choiceId: string,
  beatRunState: InsightBeatRunState
): TriggeredInsightBeat | null {
  const interpretation = scenario.interpretation;

  // No interpretation layer or beats disabled
  if (!interpretation || !interpretation.insightBeatConfig?.enabled) {
    return null;
  }

  const config = interpretation.insightBeatConfig;
  const scenarioBeats = interpretation.insightBeats || [];

  // Generate move-based insight beats from choices with moveId
  const moveGeneratedBeats = generateMoveBasedInsightBeats(scenario.choices);

  // Merge: scenario-specific takes priority, move-generated fills gaps
  const beats = mergeInsightBeats(scenarioBeats, moveGeneratedBeats);

  // Global suppression checks
  if (beatRunState.beatsShownCount >= config.maxBeatsPerRun) {
    return null;
  }

  const stepsSinceLastBeat = state.currentStep - beatRunState.lastBeatStep;
  if (stepsSinceLastBeat < config.cooldownSteps) {
    return null;
  }

  // Find all beats that could trigger
  const candidates: Array<{ beat: InsightBeat; score: number }> = [];

  for (const beat of beats) {
    // Already triggered this run
    if (beatRunState.triggeredBeatIds.includes(beat.id)) {
      continue;
    }

    // Evaluate trigger conditions
    if (evaluateTrigger(beat.trigger, state, choiceId)) {
      candidates.push({
        beat,
        score: calculateBeatScore(beat, state),
      });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort by score descending and take highest
  candidates.sort((a, b) => b.score - a.score);
  const selected = candidates[0].beat;

  // Build the triggered beat result
  const routeIdHint = detectPartialRoute(scenario, state);
  const runProgress = state.currentStep / Math.max(scenario.timeConfig.maxSteps, 1);

  // Determine if interventions should be shown
  const shouldShowInterventions = evaluateShouldShowInterventions(
    selected,
    config,
    beatRunState,
    state.currentStep
  );

  // Get available interventions
  const availableInterventions = shouldShowInterventions
    ? (selected.microInterventions || [])
    : [];

  const llmPayload: InsightBeatLLMPayload = {
    scenarioId: scenario.id,
    beatId: selected.id,
    triggerSource: "choice",
    triggeringChoiceId: choiceId,
    stepNumber: state.currentStep,
    runProgressPercent: Math.round(runProgress * 100),
    internalPatternIds: selected.internalPatternIds,
    mechanismId: selected.mechanismContribution || null,
    patternId: selected.patternContribution || null,
    category: selected.category,
    valence: selected.valence,
    canonicalInsightText: selected.insightText,
    canonicalWhyItMatters: selected.whyItMatters || null,
    canonicalTryNextCue: selected.tryNextCue || null,
    flagsAtTrigger: { ...state.flags },
    metricsAtTrigger: { ...state.metrics },
    choiceSequence: [...state.choiceSequence],
    routeIdHint,
    // Intervention context
    internalState: selected.internalState || null,
    canonicalInterventions: availableInterventions.map((i) => ({
      id: i.id,
      text: i.text,
      targetState: i.targetState,
    })),
    interventionsShown: shouldShowInterventions,
  };

  return {
    beat: selected,
    triggeringChoiceId: choiceId,
    stepNumber: state.currentStep,
    scenarioId: scenario.id,
    routeIdHint,
    llmPayload,
    shouldShowInterventions,
    availableInterventions,
  };
}

/**
 * Update beat run state after a beat is shown.
 */
export function recordBeatShown(
  beatRunState: InsightBeatRunState,
  triggeredBeat: TriggeredInsightBeat
): InsightBeatRunState {
  return {
    beatsShownCount: beatRunState.beatsShownCount + 1,
    lastBeatStep: triggeredBeat.stepNumber,
    triggeredBeatIds: [...beatRunState.triggeredBeatIds, triggeredBeat.beat.id],
    // Update intervention tracking if interventions were shown
    interventionsShownCount: triggeredBeat.shouldShowInterventions
      ? beatRunState.interventionsShownCount + 1
      : beatRunState.interventionsShownCount,
    lastInterventionStep: triggeredBeat.shouldShowInterventions
      ? triggeredBeat.stepNumber
      : beatRunState.lastInterventionStep,
    selectedInterventions: beatRunState.selectedInterventions,
  };
}

/**
 * Record that the user selected a specific intervention.
 * Called when user taps an intervention option.
 */
export function recordInterventionSelection(
  beatRunState: InsightBeatRunState,
  beatId: string,
  interventionId: string,
  stepNumber: number
): InsightBeatRunState {
  const selection: InterventionSelection = {
    beatId,
    interventionId,
    stepNumber,
    timestamp: Date.now(),
  };

  return {
    ...beatRunState,
    selectedInterventions: [...beatRunState.selectedInterventions, selection],
  };
}

/**
 * Evaluate a single trigger's conditions against current state.
 */
function evaluateTrigger(
  trigger: InsightBeatTrigger,
  state: RunStateV2,
  choiceId: string
): boolean {
  // Must match at least one choice ID
  if (trigger.choiceIds.length > 0 && !trigger.choiceIds.includes(choiceId)) {
    return false;
  }

  // Check required flags (all must match)
  if (trigger.requireFlags) {
    for (const [flag, value] of Object.entries(trigger.requireFlags)) {
      if (state.flags[flag] !== value) {
        return false;
      }
    }
  }

  // Check flag that must be absent
  if (trigger.requireFlagAbsent && state.flags[trigger.requireFlagAbsent]) {
    return false;
  }

  // Check suppress-if flags
  if (trigger.suppressIfFlags) {
    for (const flag of trigger.suppressIfFlags) {
      if (state.flags[flag]) {
        return false;
      }
    }
  }

  // Check metric thresholds
  if (trigger.requireMetricAbove) {
    const value = state.metrics[trigger.requireMetricAbove.metric] ?? 0;
    if (value <= trigger.requireMetricAbove.value) {
      return false;
    }
  }

  if (trigger.requireMetricBelow) {
    const value = state.metrics[trigger.requireMetricBelow.metric] ?? 0;
    if (value >= trigger.requireMetricBelow.value) {
      return false;
    }
  }

  // Check step range
  if (trigger.minStep !== undefined && state.currentStep < trigger.minStep) {
    return false;
  }

  if (trigger.maxStep !== undefined && state.currentStep > trigger.maxStep) {
    return false;
  }

  // Check recent pattern tags (simplified: just check if choice has matching patterns)
  // This would need choice lookup for full implementation, but we're checking state-based patterns
  // For now, skip this check if not provided
  // Future: could check choiceSequence against pattern tags

  return true;
}

/**
 * Calculate a priority score for beat selection.
 */
function calculateBeatScore(beat: InsightBeat, state: RunStateV2): number {
  let score = beat.priority;

  // Bonus for mid-run timing (not too early, not too late)
  const progress = state.currentStep / 12; // Assuming ~12 step runs
  if (progress > 0.25 && progress < 0.75) {
    score += 10;
  }

  // Bonus for negative valence (often more impactful)
  if (beat.valence === "negative") {
    score += 5;
  }

  return score;
}

/**
 * Try to detect which route the user is on mid-run.
 * Returns null if no clear signal yet.
 */
function detectPartialRoute(scenario: ScenarioV2, state: RunStateV2): string | null {
  // Simple heuristic: check for flag-based route signatures
  for (const route of scenario.routes) {
    if (route.identifiedBy.type === "flag-combination") {
      const flags = route.identifiedBy.flags;
      const matchCount = Object.entries(flags).filter(
        ([flag, value]) => state.flags[flag] === value
      ).length;
      const totalFlags = Object.keys(flags).length;

      // If more than half the flags match, suggest this route
      if (matchCount > totalFlags / 2) {
        return route.id;
      }
    }
  }

  return null;
}

/**
 * Determine if interventions should be shown for this beat.
 */
function evaluateShouldShowInterventions(
  beat: InsightBeat,
  config: InsightBeatConfig,
  beatRunState: InsightBeatRunState,
  currentStep: number
): boolean {
  // Check if beat has interventions
  if (!beat.microInterventions || beat.microInterventions.length === 0) {
    return false;
  }

  // Check explicit showInterventions flag (default true if interventions exist)
  if (beat.showInterventions === false) {
    return false;
  }

  // Check global interventions enabled (default true)
  if (config.interventionsEnabled === false) {
    return false;
  }

  // Check intervention fatigue limit
  const maxShows = config.maxInterventionShowsPerRun ?? 2;
  if (beatRunState.interventionsShownCount >= maxShows) {
    return false;
  }

  // Check intervention cooldown
  const cooldown = config.interventionCooldownSteps ?? 2;
  const stepsSinceLastIntervention = currentStep - beatRunState.lastInterventionStep;
  if (stepsSinceLastIntervention < cooldown) {
    return false;
  }

  return true;
}

/**
 * Default insight beat config for scenarios without one.
 *
 * TUNING RATIONALE (2024-03):
 * - maxBeatsPerRun: 2 (down from 4) - Most 6-8 step runs shouldn't need more than
 *   2 mid-run insights. Saves quota for critical moments.
 * - cooldownSteps: 3 (up from 2) - Prevents back-to-back beats. Allows beats at
 *   steps 1, 4, 7... rather than 1, 3, 5...
 * - maxInterventionShowsPerRun: 2 (down from 3) - Intervention fatigue is real.
 *   Show support sparingly.
 */
export const DEFAULT_INSIGHT_BEAT_CONFIG: InsightBeatConfig = {
  maxBeatsPerRun: 2,
  cooldownSteps: 3,
  enabled: true,
  maxInterventionShowsPerRun: 2,
  interventionCooldownSteps: 3,
  interventionsEnabled: true,
};

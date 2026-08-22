/**
 * PsychTrails Interpretation Engine
 * Deterministic, modular, scenario-authored interpretation system
 *
 * This engine produces high-resolution post-run insight:
 * 1. Route-level interpretation (what route, what showed up, what to try next)
 * 2. Step-level turning-point interpretation (3-5 most meaningful steps)
 *
 * Now with Behavioral Move Library integration:
 * - Choices with moveId automatically get step interpretations from the move
 * - Scenario-specific interpretations take priority over move-generated ones
 * - This allows new behavioral moves to be authored as data, not code
 */

import type {
  ScenarioV2,
  RunStateV2,
  InterpretationLayer,
  InterpretationResult,
  RouteInterpretationResult,
  StepInterpretationResult,
  StepInterpretation,
  RouteInterpretation,
  InternalPatternId,
  ChoiceV2,
} from "./types-v2";
import {
  generateMoveBasedStepInterpretations,
  mergeStepInterpretations,
} from "./move-resolver";

/**
 * Context for interpretation generation
 */
interface InterpretationContext {
  scenario: ScenarioV2;
  state: RunStateV2;
  routeId: string | null;
  endingId: string;
  flags: Record<string, boolean>;
  metrics: Record<string, number>;
}

/**
 * Ranked turning point candidate
 */
interface TurningPointCandidate {
  interpretation: StepInterpretation;
  choiceId: string;
  stepNumber: number;
  score: number;
}

/**
 * Generate interpretation result for a completed run.
 * This is the main entry point for the interpretation engine.
 */
export function generateInterpretation(
  scenario: ScenarioV2,
  state: RunStateV2,
  routeId: string | null,
  endingId: string
): InterpretationResult | null {
  const interpretationLayer = scenario.interpretation;

  if (!interpretationLayer) {
    return null;
  }

  const context: InterpretationContext = {
    scenario,
    state,
    routeId,
    endingId,
    flags: state.flags,
    metrics: state.metrics,
  };

  // Generate route-level interpretation
  const routeInterpretation = generateRouteInterpretation(interpretationLayer, context);

  // Generate step-level turning points
  const turningPoints = selectTurningPoints(interpretationLayer, context);

  return {
    route: routeInterpretation,
    turningPoints,
    usedFallbacks: routeInterpretation === null && turningPoints.length === 0,
    totalChoices: state.choiceSequence.length,
  };
}

/**
 * Generate route-level interpretation.
 */
function generateRouteInterpretation(
  layer: InterpretationLayer,
  context: InterpretationContext
): RouteInterpretationResult | null {
  const { routeId } = context;

  // Try to find exact route match
  if (routeId) {
    const routeInterp = layer.routeInterpretations.find(r => r.routeId === routeId);
    if (routeInterp) {
      return convertRouteInterpretation(routeInterp, layer);
    }
  }

  // Try to find ending-based fallback
  const endingFallback = layer.fallbacks.find(f => f.condition === "no_route_match" && f.routeLevel);
  if (endingFallback?.routeLevel) {
    return {
      routeId: routeId || "unknown",
      routeSummaryLabel: "Your Path",
      whatShowedUp: endingFallback.routeLevel.whatShowedUp,
      userFacingPatternLabel: "What happened this run",
      reinforcement: endingFallback.routeLevel.reinforcement,
      nextRep: endingFallback.routeLevel.nextRep,
      whyItMatters: endingFallback.routeLevel.whyItMatters,
      ifPatternKeepsRunning: endingFallback.routeLevel.ifPatternKeepsRunning,
      transferBridge: "",
    };
  }

  // Try default fallback
  const defaultFallback = layer.fallbacks.find(f => f.condition === "default" && f.routeLevel);
  if (defaultFallback?.routeLevel) {
    return {
      routeId: routeId || "unknown",
      routeSummaryLabel: "Your Path",
      whatShowedUp: defaultFallback.routeLevel.whatShowedUp,
      userFacingPatternLabel: "What happened this run",
      reinforcement: defaultFallback.routeLevel.reinforcement,
      nextRep: defaultFallback.routeLevel.nextRep,
      whyItMatters: defaultFallback.routeLevel.whyItMatters,
      ifPatternKeepsRunning: defaultFallback.routeLevel.ifPatternKeepsRunning,
      transferBridge: "",
    };
  }

  return null;
}

/**
 * Convert compiled route interpretation to result format.
 */
function convertRouteInterpretation(
  interp: RouteInterpretation,
  layer: InterpretationLayer
): RouteInterpretationResult {
  // Get user-facing label, with fallback to authored label
  const userFacingLabel = interp.dominantUserFacingPatternLabel ||
    translatePatterns(interp.dominantInternalPatternIds, layer.patternLabelMap)[0] ||
    "What showed up";

  return {
    routeId: interp.routeId,
    routeSummaryLabel: interp.routeSummaryLabel,
    whatShowedUp: interp.whatShowedUp,
    userFacingPatternLabel: userFacingLabel,
    reinforcement: interp.routeReinforcement,
    nextRep: interp.routeNextRep,
    whyItMatters: interp.routeWhyItMatters,
    ifPatternKeepsRunning: interp.routeIfPatternKeepsRunning,
    transferBridge: interp.routeTransferBridge,
  };
}

/**
 * Select and rank the most meaningful turning points.
 * Returns 3-5 step interpretations, ranked by significance.
 *
 * Now integrates move-generated interpretations:
 * 1. Generates step interpretations from choices with moveId
 * 2. Merges with scenario-specific interpretations (scenario takes priority)
 * 3. Ranks and selects top turning points
 */
function selectTurningPoints(
  layer: InterpretationLayer,
  context: InterpretationContext
): StepInterpretationResult[] {
  const { scenario, state, routeId, endingId, flags, metrics } = context;
  const config = layer.turningPointConfig;
  const candidates: TurningPointCandidate[] = [];

  // Generate move-based step interpretations from choices with moveId
  const moveGeneratedInterps = generateMoveBasedStepInterpretations(scenario.choices);

  // Merge: scenario-specific takes priority, move-generated fills gaps
  const allStepInterpretations = mergeStepInterpretations(
    layer.stepInterpretations,
    moveGeneratedInterps
  );

  // Walk through choice sequence and find matching interpretations
  for (let i = 0; i < state.choiceSequence.length; i++) {
    const choiceId = state.choiceSequence[i];
    const stepNumber = i + 1;

    // Find all interpretations that match this choice (now includes move-generated)
    const matchingInterps = allStepInterpretations.filter(interp => {
      // Check choice ID match
      const choiceMatch = interp.choiceIds.length === 0 || interp.choiceIds.includes(choiceId);
      if (!choiceMatch) return false;

      // Check route match (if specified)
      if (interp.routeIds.length > 0 && routeId && !interp.routeIds.includes(routeId)) {
        return false;
      }

      // Check ending match (if specified)
      if (interp.endingIds.length > 0 && !interp.endingIds.includes(endingId)) {
        return false;
      }

      // Check display conditions
      if (interp.displayConditions) {
        const { requireFlags, requireMetricAbove, requireMetricBelow } = interp.displayConditions;

        if (requireFlags) {
          for (const [flag, value] of Object.entries(requireFlags)) {
            if (flags[flag] !== value) return false;
          }
        }

        if (requireMetricAbove) {
          const metricValue = metrics[requireMetricAbove.metric] ?? 0;
          if (metricValue <= requireMetricAbove.value) return false;
        }

        if (requireMetricBelow) {
          const metricValue = metrics[requireMetricBelow.metric] ?? 0;
          if (metricValue >= requireMetricBelow.value) return false;
        }
      }

      return true;
    });

    // Score and add candidates
    for (const interp of matchingInterps) {
      if (interp.turningPointWeight >= config.minWeight) {
        const score = calculateTurningPointScore(interp, stepNumber, state, config);
        candidates.push({
          interpretation: interp,
          choiceId,
          stepNumber,
          score,
        });
      }
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Take top N, ensuring we don't duplicate choice IDs
  const selected: TurningPointCandidate[] = [];
  const seenChoices = new Set<string>();

  for (const candidate of candidates) {
    if (selected.length >= config.maxTurningPoints) break;
    if (seenChoices.has(candidate.choiceId)) continue;

    selected.push(candidate);
    seenChoices.add(candidate.choiceId);
  }

  // Sort selected by step number for chronological display
  selected.sort((a, b) => a.stepNumber - b.stepNumber);

  // Convert to results with rank
  return selected.map((candidate, index) =>
    convertStepInterpretation(candidate, index + 1, layer)
  );
}

/**
 * Calculate turning point score for ranking.
 */
function calculateTurningPointScore(
  interp: StepInterpretation,
  stepNumber: number,
  state: RunStateV2,
  config: { rankingWeights: { turningPointWeight: number; interpretationPriority: number; routeDivergence: number; patternContribution: number; mechanismShift: number } }
): number {
  const weights = config.rankingWeights;

  let score = 0;

  // Base weight from interpretation
  score += interp.turningPointWeight * weights.turningPointWeight;

  // Priority bonus
  score += interp.interpretationPriority * weights.interpretationPriority;

  // Pattern contribution bonus
  if (interp.patternContribution) {
    score += 20 * weights.patternContribution;
  }

  // Mechanism shift bonus
  if (interp.mechanismContribution) {
    score += 15 * weights.mechanismShift;
  }

  // Route divergence bonus (higher for mid-run choices)
  const relativePosition = stepNumber / Math.max(state.choiceSequence.length, 1);
  if (relativePosition > 0.3 && relativePosition < 0.8) {
    score += 10 * weights.routeDivergence;
  }

  return score;
}

/**
 * Convert step interpretation to result format.
 */
function convertStepInterpretation(
  candidate: TurningPointCandidate,
  rank: number,
  layer: InterpretationLayer
): StepInterpretationResult {
  const interp = candidate.interpretation;

  // Get user-facing label, with fallback to authored label
  const userFacingLabel = interp.userFacingPatternLabel ||
    translatePatterns(interp.internalPatternIds, layer.patternLabelMap)[0] ||
    "What showed up";

  return {
    id: interp.id,
    choiceId: candidate.choiceId,
    stepNumber: candidate.stepNumber,
    userFacingPatternLabel: userFacingLabel,
    whatYouChose: interp.whatYouChose ?? null,
    whatShowedUp: interp.whatShowedUp,
    functionalIntent: interp.functionalIntent,
    immediatePayoff: interp.immediatePayoff,
    cost: interp.cost,
    reinforcement: interp.reinforcement,
    tryNext: interp.tryNext,
    whyThisMatters: interp.whyThisMatters,
    consequenceIfRepeated: interp.consequenceIfRepeated,
    valence: interp.stepValence,
    turningPointRank: rank,
  };
}

/**
 * Translate internal pattern IDs to user-facing labels using the pattern map.
 */
function translatePatterns(
  internalIds: InternalPatternId[],
  labelMap: Partial<Record<InternalPatternId, string>>
): string[] {
  return internalIds
    .map(id => labelMap[id])
    .filter((label): label is string => label !== undefined);
}

/**
 * Default pattern label map used when scenario doesn't provide one.
 * These are the canonical user-facing translations.
 */
export const DEFAULT_PATTERN_LABELS: Record<InternalPatternId, string> = {
  catastrophizing: "You jumped to the worst-case",
  black_and_white_thinking: "You made it all-or-nothing",
  mind_reading: "You filled in what they were thinking",
  emotional_reasoning: "You treated the feeling like a fact",
  safety_behavior: "You reached for cover",
  experiential_avoidance: "You left at the hardest moment",
  self_attack: "You turned on yourself",
  threshold_collapse: "You raised the bar until it broke",
  perfectionism: "You needed it to be perfect before you could start",
  distress_intolerance: "You couldn't stay with the discomfort",
  values_aligned_action: "You moved toward what matters",
  repair_attempt: "You tried to fix it",
  recovery_success: "You came back after pulling away",
  overcontrol: "You tried to control too much",
  overforcing: "You pushed too hard and your system pushed back",
  grounded_interpretation: "You read the moment for what it was",
  micro_step_success: "You found a move small enough that your system could say yes",
  distress_tolerated: "You stayed through the hard part",
  support_utilized: "You let someone help",
  direct_communication: "You said what needed to be said",
  flexible_response: "You adjusted when your first plan didn't work",
  compassionate_response: "You gave yourself room to be human",
  premature_exit: "You protected yourself fast, but stayed stuck",
  post_event_processing: "You replayed the moment until it became something worse",
};

/**
 * Merge scenario-specific pattern labels with defaults.
 */
export function mergePatternLabels(
  scenarioLabels: Partial<Record<InternalPatternId, string>> | undefined
): Record<InternalPatternId, string> {
  return {
    ...DEFAULT_PATTERN_LABELS,
    ...(scenarioLabels || {}),
  };
}

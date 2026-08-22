/**
 * Move Resolver
 * ==============
 *
 * Bridges the Behavioral Move Library to the runtime.
 * Handles move resolution, step interpretation generation, and insight beat generation.
 *
 * ============================================================================
 * GENERATION CONTROL SYSTEM
 * ============================================================================
 *
 * The Move Resolver respects generation control flags from the Behavioral Move Library.
 * This prevents UX overload from auto-generated beats/interpretations.
 *
 * PRECEDENCE RULES (highest to lowest):
 * 1. Scenario-level override (e.g., choice.suppressBeat) - NOT YET IMPLEMENTED
 * 2. Move-level generation flags (move.generation.generateBeat, etc.)
 * 3. Smart defaults (beats only for moves with interventions)
 *
 * WHEN BEATS ARE GENERATED:
 * - Move has interventions AND move.generation.generateBeat !== false
 * - OR move.generation.generateBeat === true explicitly
 *
 * WHEN BEATS ARE SUPPRESSED:
 * - Move has no interventions (default)
 * - OR move.generation.generateBeat === false explicitly
 *
 * WHEN INTERPRETATIONS ARE GENERATED:
 * - Always, unless move.generation.generateInterpretation === false
 * - Step interpretations are end-of-run, so lower UX cost
 *
 * ============================================================================
 * MERGING RULES
 * ============================================================================
 *
 * Scenario-specific content ALWAYS wins over move-generated content:
 * - If a choice has a scenario-specific interpretation, move-generated is skipped
 * - If a choice has a scenario-specific beat, move-generated is skipped
 * - This allows scenario authors to sharpen or completely replace move-level copy
 *
 */

import type { ChoiceV2, StepInterpretation, InsightBeat, InternalPatternId, InternalState } from "./types-v2";
import { getMove, getGenerationControl, type BehavioralMove, type MoveCategory, type MoveMicroIntervention } from "./behavioral-moves";

// ============================================================================
// MOVE RESOLUTION
// ============================================================================

export interface ResolvedMove {
  move: BehavioralMove;
  choiceId: string;
}

/**
 * Resolve a move for a choice, if one is assigned
 */
export function resolveMove(choice: ChoiceV2): ResolvedMove | null {
  if (!choice.moveId) return null;
  const move = getMove(choice.moveId);
  if (!move) return null;
  return { move, choiceId: choice.id };
}

/**
 * Resolve all moves for an array of choices
 */
export function resolveMoves(choices: ChoiceV2[]): Map<string, BehavioralMove> {
  const result = new Map<string, BehavioralMove>();
  for (const choice of choices) {
    if (choice.moveId) {
      const move = getMove(choice.moveId);
      if (move) {
        result.set(choice.id, move);
      }
    }
  }
  return result;
}

// ============================================================================
// STEP INTERPRETATION GENERATION FROM MOVES
// ============================================================================

/**
 * Generate a step interpretation from a behavioral move.
 * This allows move-based choices to automatically get step interpretations
 * without requiring scenario-specific authoring.
 */
export function generateStepInterpretationFromMove(
  choiceId: string,
  move: BehavioralMove,
  options?: {
    priority?: number;
    turningPointWeight?: number;
  }
): StepInterpretation {
  return {
    id: `move_${move.id}_${choiceId}`,
    choiceIds: [choiceId],
    nodeIds: [],
    routeIds: [],
    endingIds: [],
    internalPatternIds: move.internalPatternIds,
    userFacingPatternLabel: move.userFacingLabel,
    whatYouChose: null,
    whatShowedUp: move.insightTemplate.text,
    functionalIntent: move.functionalIntent,
    immediatePayoff: move.immediatePayoff,
    cost: move.hiddenCost,
    reinforcement: move.reinforcement,
    tryNext: move.tryNext,
    whyThisMatters: move.whyThisMatters,
    consequenceIfRepeated: move.consequenceIfRepeated,
    turningPointWeight: options?.turningPointWeight ?? move.turningPointWeight ?? 50,
    interpretationPriority: options?.priority ?? move.insightPriority ?? 50,
    stepValence: move.valence,
    mechanismContribution: move.mechanismContribution ?? null,
    patternContribution: move.patternContribution ?? null,
    displayConditions: null,
  };
}

/**
 * Generate step interpretations for all move-tagged choices in a scenario.
 * These are used as defaults when no scenario-specific interpretation exists.
 *
 * GENERATION CONTROL:
 * - Respects the move's generateInterpretation flag
 * - If move.generation.generateInterpretation is false, no interpretation is generated
 * - Default is true for all moves (step interpretations are end-of-run, low UX cost)
 */
export function generateMoveBasedStepInterpretations(
  choices: ChoiceV2[],
  options?: {
    /** Force generation for all moves, ignoring generation control flags */
    forceAll?: boolean;
  }
): StepInterpretation[] {
  const result: StepInterpretation[] = [];
  const moveMap = resolveMoves(choices);

  for (const [choiceId, move] of moveMap.entries()) {
    // Respect generation control unless forced
    const control = getGenerationControl(move);
    if (!options?.forceAll && !control.generateInterpretation) {
      continue;
    }
    result.push(generateStepInterpretationFromMove(choiceId, move));
  }

  return result;
}

// ============================================================================
// INSIGHT BEAT GENERATION FROM MOVES
// ============================================================================

/**
 * Generate an insight beat from a behavioral move.
 * This allows move-based choices to automatically get insight beats
 * without requiring scenario-specific authoring.
 */
export function generateInsightBeatFromMove(
  choiceId: string,
  move: BehavioralMove,
  options?: {
    priority?: number;
  }
): InsightBeat {
  // Convert move interventions to the InsightBeat format
  const microInterventions = move.interventions.map((intervention) => ({
    id: intervention.id,
    text: intervention.text,
    targetState: move.targetState,
    why: intervention.why,
  }));

  return {
    id: `move_beat_${move.id}_${choiceId}`,
    trigger: {
      choiceIds: [choiceId],
    },
    internalPatternIds: move.internalPatternIds,
    userFacingLabel: move.insightTemplate.label,
    insightText: move.insightTemplate.text,
    whyItMatters: move.insightTemplate.whyItMatters,
    tryNextCue: move.tryNext,
    valence: move.valence,
    priority: options?.priority ?? move.insightPriority ?? 50,
    mechanismContribution: move.mechanismContribution,
    patternContribution: move.patternContribution,
    category: mapMoveCategoryToInsightCategory(move.category),
    setFlagOnTrigger: `move_beat_${move.id}_shown`,
    internalState: move.targetState,
    microInterventions: microInterventions.length > 0 ? microInterventions : undefined,
    showInterventions: microInterventions.length > 0,
  };
}

/**
 * Generate insight beats for all move-tagged choices.
 *
 * GENERATION CONTROL:
 * - Respects the move's generateBeat flag
 * - Default: true if move has interventions, false otherwise
 * - Set generateBeat: false to suppress beats for moves that are:
 *   - Too subtle to warrant mid-run interruption
 *   - Repetitive (e.g., multiple phone_shield choices in same scenario)
 *   - Better delivered at end-of-run
 *
 * MOVE-LEVEL DEDUPLICATION:
 * - Only ONE beat is generated per unique moveId
 * - If phone_shield appears on choices A and B, ONE beat is created with
 *   trigger.choiceIds = [A, B]
 * - This prevents the same insight from firing twice on the same run
 *
 * PRECEDENCE:
 * 1. Scenario-level suppressBeat on choice wins (not implemented here)
 * 2. Move-level generation.generateBeat flag
 * 3. Default based on interventions.length > 0
 */
export function generateMoveBasedInsightBeats(
  choices: ChoiceV2[],
  options?: {
    /**
     * @deprecated Use generation control flags on moves instead.
     * Force beats for moves without interventions.
     */
    includeMovesWithoutInterventions?: boolean;
    /** Force generation for all moves, ignoring generation control flags */
    forceAll?: boolean;
  }
): InsightBeat[] {
  const result: InsightBeat[] = [];

  // Group choices by moveId to deduplicate
  const moveIdToChoices = new Map<string, string[]>();
  const moveIdToMove = new Map<string, BehavioralMove>();

  for (const choice of choices) {
    if (!choice.moveId) continue;
    const move = getMove(choice.moveId);
    if (!move) continue;

    // Respect generation control unless forced
    const control = getGenerationControl(move);
    if (!options?.forceAll && !control.generateBeat) {
      // Legacy fallback: if includeMovesWithoutInterventions is true, still generate
      if (!options?.includeMovesWithoutInterventions) {
        continue;
      }
    }

    // Group by moveId
    if (!moveIdToChoices.has(move.id)) {
      moveIdToChoices.set(move.id, []);
      moveIdToMove.set(move.id, move);
    }
    moveIdToChoices.get(move.id)!.push(choice.id);
  }

  // Generate ONE beat per unique moveId, with all choiceIds as triggers
  for (const [moveId, choiceIds] of moveIdToChoices.entries()) {
    const move = moveIdToMove.get(moveId)!;
    result.push(generateInsightBeatFromMoveWithMultipleTriggers(choiceIds, move));
  }

  return result;
}

/**
 * Generate an insight beat with multiple choice triggers.
 * Used when the same moveId appears on multiple choices.
 */
function generateInsightBeatFromMoveWithMultipleTriggers(
  choiceIds: string[],
  move: BehavioralMove,
  options?: {
    priority?: number;
  }
): InsightBeat {
  // Convert move interventions to the InsightBeat format
  const microInterventions = move.interventions.map((intervention) => ({
    id: intervention.id,
    text: intervention.text,
    targetState: move.targetState,
    why: intervention.why,
  }));

  return {
    id: `move_beat_${move.id}`,
    trigger: {
      choiceIds: choiceIds, // All choices that use this moveId
    },
    internalPatternIds: move.internalPatternIds,
    userFacingLabel: move.insightTemplate.label,
    insightText: move.insightTemplate.text,
    whyItMatters: move.insightTemplate.whyItMatters,
    tryNextCue: move.tryNext,
    valence: move.valence,
    priority: options?.priority ?? move.insightPriority ?? 50,
    mechanismContribution: move.mechanismContribution,
    patternContribution: move.patternContribution,
    category: mapMoveCategoryToInsightCategory(move.category),
    setFlagOnTrigger: `move_beat_${move.id}_shown`,
    internalState: move.targetState,
    microInterventions: microInterventions.length > 0 ? microInterventions : undefined,
    showInterventions: microInterventions.length > 0,
  };
}

// ============================================================================
// CATEGORY MAPPING
// ============================================================================

/**
 * Map a move category to an insight beat category
 */
export function mapMoveCategoryToInsightCategory(
  category: MoveCategory
): InsightBeat["category"] {
  const mapping: Record<MoveCategory, InsightBeat["category"]> = {
    // Avoidance cluster
    premature_exit: "avoidance",
    threshold_escape: "threshold",
    safety_behavior: "safety_behavior",
    numbing_detour: "avoidance",
    preemptive_escape: "avoidance",

    // Crutch cluster
    state_altering_crutch: "safety_behavior",
    external_reassurance: "safety_behavior",
    perfectionistic_prep: "threshold",
    rehearsal_loop: "threshold",

    // Interpretation cluster
    mind_reading: "interpretation",
    catastrophizing: "interpretation",
    post_event_processing: "interpretation",
    self_attack: "interpretation",
    emotional_reasoning: "interpretation",

    // Overcontrol cluster
    overforcing: "overforcing",
    overcontrol: "overforcing",
    all_or_nothing: "threshold",

    // Positive cluster
    direct_approach: "approach",
    recovery_return: "recovery",
    grounded_read: "grounding",
    distress_tolerance: "grounding",
    threshold_lowering: "micro_success",
    support_seeking: "approach",
    micro_step: "micro_success",
    self_compassion: "recovery",
    flexible_response: "recovery",
    values_aligned_action: "approach",
  };

  return mapping[category] || "interpretation";
}

// ============================================================================
// MOVE-AWARE INTERPRETATION MERGING
// ============================================================================

/**
 * Merge scenario-specific step interpretations with move-generated ones.
 * Scenario-specific interpretations take priority.
 */
export function mergeStepInterpretations(
  scenarioSpecific: StepInterpretation[],
  moveGenerated: StepInterpretation[]
): StepInterpretation[] {
  // Build a set of choice IDs that already have scenario-specific interpretations
  const coveredChoiceIds = new Set<string>();
  for (const interp of scenarioSpecific) {
    for (const choiceId of interp.choiceIds) {
      coveredChoiceIds.add(choiceId);
    }
  }

  // Filter out move-generated interpretations for already-covered choices
  const uniqueMoveGenerated = moveGenerated.filter(
    (interp) => !interp.choiceIds.some((id) => coveredChoiceIds.has(id))
  );

  return [...scenarioSpecific, ...uniqueMoveGenerated];
}

/**
 * Merge scenario-specific insight beats with move-generated ones.
 * Scenario-specific beats take priority.
 */
export function mergeInsightBeats(
  scenarioSpecific: InsightBeat[],
  moveGenerated: InsightBeat[]
): InsightBeat[] {
  // Build a set of choice IDs that already have scenario-specific beats
  const coveredChoiceIds = new Set<string>();
  for (const beat of scenarioSpecific) {
    for (const choiceId of beat.trigger.choiceIds) {
      coveredChoiceIds.add(choiceId);
    }
  }

  // Filter out move-generated beats for already-covered choices
  const uniqueMoveGenerated = moveGenerated.filter(
    (beat) => !beat.trigger.choiceIds.some((id) => coveredChoiceIds.has(id))
  );

  return [...scenarioSpecific, ...uniqueMoveGenerated];
}

// ============================================================================
// HIDDEN BARGAIN / BEHAVIORAL ANALYSIS EXTRACTION
// ============================================================================

export interface BehavioralAnalysis {
  moveId: string;
  category: MoveCategory;
  userFacingLabel: string;
  functionalIntent: string;
  immediatePayoff: string;
  hiddenBargain: string;
  hiddenCost: string;
  reinforcement: string;
  consequenceIfRepeated: string;
  tryNext: string;
  whyThisMatters: string;
  valence: "positive" | "negative" | "mixed";
  internalState: InternalState;
  interventions: MoveMicroIntervention[];
}

/**
 * Extract the full behavioral analysis for a choice.
 * Returns null if the choice has no moveId or the move doesn't exist.
 */
export function getBehavioralAnalysis(choice: ChoiceV2): BehavioralAnalysis | null {
  if (!choice.moveId) return null;
  const move = getMove(choice.moveId);
  if (!move) return null;

  return {
    moveId: move.id,
    category: move.category,
    userFacingLabel: move.userFacingLabel,
    functionalIntent: move.functionalIntent,
    immediatePayoff: move.immediatePayoff,
    hiddenBargain: move.hiddenBargain,
    hiddenCost: move.hiddenCost,
    reinforcement: move.reinforcement,
    consequenceIfRepeated: move.consequenceIfRepeated,
    tryNext: move.tryNext,
    whyThisMatters: move.whyThisMatters,
    valence: move.valence,
    internalState: move.targetState,
    interventions: move.interventions,
  };
}

/**
 * Get the hidden bargain for a choice (the deal the system made).
 * Returns null if no move is attached.
 */
export function getHiddenBargain(choice: ChoiceV2): string | null {
  const analysis = getBehavioralAnalysis(choice);
  return analysis?.hiddenBargain ?? null;
}

/**
 * Get the reinforcement pattern for a choice (what gets taught).
 * Returns null if no move is attached.
 */
export function getReinforcement(choice: ChoiceV2): string | null {
  const analysis = getBehavioralAnalysis(choice);
  return analysis?.reinforcement ?? null;
}

/**
 * Get the consequence if this pattern is repeated.
 * Returns null if no move is attached.
 */
export function getConsequenceIfRepeated(choice: ChoiceV2): string | null {
  const analysis = getBehavioralAnalysis(choice);
  return analysis?.consequenceIfRepeated ?? null;
}

// ============================================================================
// LLM PAYLOAD AUGMENTATION
// ============================================================================

export interface MoveLLMPayload {
  moveId: string;
  category: MoveCategory;
  hiddenBargain: string;
  hiddenCost: string;
  reinforcement: string;
  consequenceIfRepeated: string;
  valence: "positive" | "negative" | "mixed";
  internalState: InternalState;
  internalPatternIds: InternalPatternId[];
}

/**
 * Generate a structured payload for LLM augmentation.
 * This provides all the canonical behavioral data for future personalization.
 */
export function generateMoveLLMPayload(choice: ChoiceV2): MoveLLMPayload | null {
  if (!choice.moveId) return null;
  const move = getMove(choice.moveId);
  if (!move) return null;

  return {
    moveId: move.id,
    category: move.category,
    hiddenBargain: move.hiddenBargain,
    hiddenCost: move.hiddenCost,
    reinforcement: move.reinforcement,
    consequenceIfRepeated: move.consequenceIfRepeated,
    valence: move.valence,
    internalState: move.targetState,
    internalPatternIds: move.internalPatternIds,
  };
}

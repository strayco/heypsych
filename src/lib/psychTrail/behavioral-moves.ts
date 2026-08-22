/**
 * PsychTrails Behavioral Move Library
 * ====================================
 *
 * This is the canonical library of psychological moves - reusable behavioral patterns
 * that can be authored once and referenced across scenarios.
 *
 * ============================================================================
 * NON-NEGOTIABLE RULES
 * ============================================================================
 *
 * 1. NEW MOVES MUST BE AUTHORABLE AS DATA, NOT ENGINEERING PROJECTS.
 *    Adding a new behavioral move should require only defining the data.
 *
 * 2. SCENARIO-SPECIFIC NUANCE MUST REMAIN POSSIBLE AND EASY.
 *    The library provides strong defaults; local scenario sharpness overrides them.
 *
 * 3. GENERATED OUTPUTS MUST NOT FLATTEN THE PRODUCT.
 *    Move-based copy is a starting point; scenario authoring adds situation-specificity.
 *
 * 4. DETERMINISTIC TRUTH REMAINS CANONICAL.
 *    The move library is source-of-truth data. LLM augmentation is downstream.
 *
 * ============================================================================
 * TAXONOMY REFERENCE
 * ============================================================================
 *
 * This system has multiple overlapping but distinct taxonomies:
 *
 * 1. MoveCategory (28 categories)
 *    WHAT IT IS: The type of psychological move being made.
 *    WHEN TO USE: Every move has exactly one category.
 *    EXAMPLES: safety_behavior, mind_reading, direct_approach, recovery_return
 *    ORGANIZED INTO CLUSTERS:
 *      - Avoidance: premature_exit, threshold_escape, safety_behavior, etc.
 *      - Crutch: state_altering_crutch, external_reassurance, etc.
 *      - Interpretation: mind_reading, catastrophizing, post_event_processing, etc.
 *      - Overcontrol: overforcing, overcontrol, all_or_nothing
 *      - Positive: direct_approach, recovery_return, grounded_read, etc.
 *
 * 2. MoveValence (3 values)
 *    WHAT IT IS: The directional quality of the move.
 *    WHEN TO USE: Every move has exactly one valence.
 *    VALUES:
 *      - positive: Move that builds skill / capacity
 *      - negative: Move that maintains or reinforces a problematic pattern
 *      - mixed: Move that has both protective and limiting qualities
 *
 * 3. InternalPatternId (24 types) - from authoring/types.ts
 *    WHAT IT IS: The clinical/modeling label for the pattern.
 *    WHEN TO USE: For step interpretations and clinical tracking.
 *    EXAMPLES: catastrophizing, mind_reading, safety_behavior, grounded_interpretation
 *    NOTE: A move can map to multiple internal pattern IDs.
 *
 * 4. InternalState (11 states) - from authoring/types.ts
 *    WHAT IT IS: What the user is experiencing in the moment.
 *    WHEN TO USE: For targeting micro-interventions.
 *    EXAMPLES: anxiety_spike, avoidance_urge, uncertainty_spiral, grounded_approach
 *    NOTE: Each move targets exactly one internal state.
 *
 * 5. PatternId (15 patterns) - from clinical-constants.ts
 *    WHAT IT IS: Canonical clinical patterns tracked across runs.
 *    WHEN TO USE: For cross-run pattern detection and clinical reporting.
 *    EXAMPLES: avoidance_at_threshold, premature_exit, recovery_success
 *    NOTE: This is for CLINICAL USE, not user-facing language.
 *
 * 6. MechanismId (10 mechanisms) - from clinical-constants.ts
 *    WHAT IT IS: Trainable psychological capacities.
 *    WHEN TO USE: For mechanism scoring and progress tracking.
 *    VALUES: activation, persistence, recovery, interpretation, self_compassion,
 *            directness, distress_tolerance, flexibility, support_seeking, threshold_lowering
 *
 * RELATIONSHIP BETWEEN TAXONOMIES:
 * - MoveCategory → describes WHAT the move is
 * - MoveValence → describes the DIRECTION of the move
 * - InternalPatternId → internal label for MODELING (can be multiple)
 * - InternalState → what the user EXPERIENCES (exactly one)
 * - PatternId → CLINICAL tracking label (for cross-run analysis)
 * - MechanismId → TRAINABLE capacity this affects (for progress)
 *
 * ============================================================================
 * WRITING STANDARDS
 * ============================================================================
 *
 * All move copy must follow these rules:
 *
 * 1. PLAIN ENGLISH
 *    - No therapy jargon ("cognitive distortion", "maladaptive coping")
 *    - No clinical terms unless user-facing and already defined
 *    - Write like you're explaining to a smart friend
 *
 * 2. SHARP, NOT SOFT
 *    - "Your brain just logged this as 'confirmed threat'" (sharp)
 *    - NOT "You might have reinforced some patterns" (soft)
 *    - The language should land, not pad
 *
 * 3. BEHAVIORALLY ACCURATE
 *    - Describe what actually happens, not what should happen
 *    - "The phone becomes required" not "may become a habit"
 *    - Be honest about consequences without being melodramatic
 *
 * 4. NON-MELODRAMATIC
 *    - No doom language ("Your life will spiral into darkness")
 *    - No excessive emotional weight
 *    - State consequences directly without amplification
 *
 * 5. NON-MORALIZING
 *    - No judgment ("You failed to...")
 *    - No should/shouldn't unless describing skill mechanics
 *    - Describe patterns, not character
 *
 * 6. SPECIFIC ABOUT MECHANISM
 *    - Name what the system is doing, not just the outcome
 *    - "Your brain logs: 'too dangerous raw'" (mechanism)
 *    - NOT "This creates problems" (vague)
 *
 * 7. REAL-WORLD ACTIONABLE (for tryNext)
 *    - Can be done in the next 24 hours
 *    - Specific enough to attempt
 *    - Small enough to be realistic
 *    - "Leave phone in pocket for first 2 minutes" (good)
 *    - NOT "Try to use your phone less" (too vague)
 *
 * FIELD-SPECIFIC STANDARDS:
 *
 * hiddenBargain:
 *   - First person ("I can do this if...")
 *   - Names the implicit deal being made
 *   - Should feel like something the user might actually think
 *   - GOOD: "I can be here if I have a buffer between me and the room."
 *   - BAD: "The user is negotiating their presence conditionally."
 *
 * hiddenCost:
 *   - Second person, direct
 *   - Names what's actually being paid
 *   - Should feel like an insight, not a lecture
 *   - GOOD: "The phone says to your system: 'This is dangerous.'"
 *   - BAD: "Using the phone reinforces anxiety patterns."
 *
 * reinforcement:
 *   - Describes what the system LEARNS, not what user does
 *   - Should reference the teaching/learning dynamic
 *   - GOOD: "You're teaching your brain you can't handle the space raw."
 *   - BAD: "This is a bad coping strategy."
 *
 * consequenceIfRepeated:
 *   - Future tense, direct
 *   - Realistic extrapolation, not catastrophizing
 *   - Should feel like honest forecasting
 *   - GOOD: "The phone becomes required. You'll feel naked without it."
 *   - BAD: "You'll never be able to function socially again."
 *
 * tryNext:
 *   - Imperative or suggestive
 *   - Ultra-specific and achievable
 *   - Time-bound when possible
 *   - GOOD: "Next time, leave the phone in your pocket for the first 2 minutes."
 *   - BAD: "Try to be more present in social situations."
 *
 * whyThisMatters:
 *   - Connects to larger pattern or principle
 *   - Should feel like wisdom, not lecture
 *   - GOOD: "Safety behaviors maintain anxiety. Every use confirms the threat."
 *   - BAD: "It's important to face your fears."
 *
 * ============================================================================
 * AUTHORING RULES
 * ============================================================================
 *
 * WHEN TO CREATE A NEW MOVE vs REUSE AN EXISTING ONE:
 *
 * REUSE an existing move when:
 *   - The psychological mechanism is the same
 *   - The functional intent is the same
 *   - The hidden bargain is structurally identical
 *   - Only the surface context differs
 *   Example: "phone as shield in dining hall" and "phone as shield in lecture"
 *            should BOTH use `phone_shield` move
 *
 * CREATE a new move when:
 *   - The psychological mechanism is genuinely different
 *   - The hidden bargain represents a different deal
 *   - The consequences diverge meaningfully
 *   - The category would be different
 *   Example: "checking phone to avoid eye contact" (safety_behavior) vs
 *            "scrolling phone to numb before starting" (state_altering_crutch)
 *            are DIFFERENT moves with different mechanics
 *
 * WHEN TO ADD SCENARIO-LEVEL OVERRIDES:
 *
 * ALWAYS override at scenario level when:
 *   - The context changes the meaning (same move, different stakes)
 *   - The tryNext should be situation-specific
 *   - The consequence language should reference specific scenario elements
 *   - You want sharper, more pointed copy
 *
 * DON'T override when:
 *   - The move-level copy is already accurate and sharp
 *   - Override would just be paraphrasing
 *   - No meaningful specificity would be added
 *
 * GENERATION CONTROL RULES:
 *
 * Each move has two generation flags:
 *   - generateBeat: Should this move auto-generate an insight beat?
 *   - generateInterpretation: Should this move auto-generate a step interpretation?
 *
 * Defaults:
 *   - generateBeat: true if move has interventions, false otherwise
 *   - generateInterpretation: true for all moves
 *
 * Set generateBeat: false when:
 *   - The move is too subtle to warrant a mid-run interruption
 *   - Similar beats would be repetitive (e.g., multiple phone_shield choices)
 *   - The insight is better delivered at end-of-run
 *
 * Scenario-level can also disable generation per-choice via choice.suppressBeat
 *
 * ============================================================================
 * LIBRARY STRUCTURE
 * ============================================================================
 *
 * Moves are organized by cluster for findability:
 *   1. AVOIDANCE CLUSTER (exit, escape, safety behaviors)
 *   2. CRUTCH CLUSTER (state-altering, reassurance, perfectionism)
 *   3. INTERPRETATION CLUSTER (mind-reading, catastrophizing, replay)
 *   4. OVERCONTROL CLUSTER (overforcing, all-or-nothing)
 *   5. POSITIVE CLUSTER (approach, recovery, tolerance, compassion)
 *
 * Within each cluster, moves are ordered by:
 *   - Severity/significance (more significant first)
 *   - Alphabetically within similar significance
 *
 */

import type { MechanismId, PatternId } from "./clinical-constants";
import type { InternalPatternId, InternalState } from "./types-v2";

// ============================================================================
// MOVE CATEGORY TAXONOMY
// ============================================================================

export const MOVE_CATEGORIES = [
  // Avoidance cluster
  "premature_exit",           // Leave before trying
  "threshold_escape",         // Leave at the hard moment
  "safety_behavior",          // Shield/buffer/protection
  "numbing_detour",           // Check out / dissociate / go blank
  "preemptive_escape",        // Plan exit before entering

  // Crutch cluster
  "state_altering_crutch",    // Smoke/drink/scroll/eat first to change state
  "external_reassurance",     // Ask others if it's okay, seek confirmation
  "perfectionistic_prep",     // Over-prepare until it feels safe
  "rehearsal_loop",           // Practice/rehearse until anxiety permits

  // Interpretation cluster
  "mind_reading",             // Assume rejection / fill in the blank
  "catastrophizing",          // Jump to worst case
  "post_event_processing",    // Replay until it's bad
  "self_attack",              // Turn criticism inward
  "emotional_reasoning",      // Treat feeling like fact

  // Overcontrol cluster
  "overforcing",              // Push too hard, system pushes back
  "overcontrol",              // Try to manage everything
  "all_or_nothing",           // Perfect or don't start

  // Positive cluster
  "direct_approach",          // Move toward despite fear
  "recovery_return",          // Come back after leaving
  "grounded_read",            // Accurate interpretation
  "distress_tolerance",       // Stay through hard part
  "threshold_lowering",       // Find smaller step
  "support_seeking",          // Accept help
  "micro_step",               // Find workable small move
  "self_compassion",          // Give self room
  "flexible_response",        // Adjust when plan doesn't work
  "values_aligned_action",    // Move toward what matters
] as const;

export type MoveCategory = (typeof MOVE_CATEGORIES)[number];

export type MoveValence = "positive" | "negative" | "mixed";

// ============================================================================
// GENERATION CONTROL
// ============================================================================

/**
 * Controls whether auto-generation happens for this move.
 * These are move-level defaults that can be overridden per-choice.
 */
export interface GenerationControl {
  /**
   * Should this move auto-generate an insight beat when triggered?
   * Default: true if move has interventions, false otherwise.
   * Set to false for moves that are too subtle or would be repetitive.
   */
  generateBeat: boolean;

  /**
   * Should this move auto-generate a step interpretation?
   * Default: true for all moves.
   * Rarely needs to be false - step interpretations are end-of-run.
   */
  generateInterpretation: boolean;
}

// ============================================================================
// MICRO-INTERVENTION (In-the-moment support)
// ============================================================================

export interface MoveMicroIntervention {
  /** Unique ID within this move */
  id: string;
  /** The intervention text - sharp, plain English, immediate */
  text: string;
  /** Optional: very brief "why" (shown on tap/expand) */
  why?: string;
}

// ============================================================================
// BEHAVIORAL MOVE DEFINITION
// ============================================================================

export interface BehavioralMove {
  /** Unique identifier for this move */
  id: string;

  /** Category of this move (see MOVE_CATEGORIES) */
  category: MoveCategory;

  /** Internal pattern IDs this move represents (for clinical modeling) */
  internalPatternIds: InternalPatternId[];

  /** Clinical pattern this contributes to (for cross-run tracking) */
  patternContribution?: PatternId;

  /** Mechanism this move relates to (for progress tracking) */
  mechanismContribution?: MechanismId;

  /** Valence of this move (positive, negative, or mixed) */
  valence: MoveValence;

  // ============================================================================
  // THE BEHAVIORAL ANALYSIS - Core user-facing content
  // ============================================================================

  /** User-facing label for this pattern (e.g., "You reached for cover") */
  userFacingLabel: string;

  /** What the system is trying to do with this move */
  functionalIntent: string;

  /** The immediate payoff - what the person gets right away */
  immediatePayoff: string;

  /**
   * The hidden bargain - the deal the system made.
   * First person, represents what the user implicitly agreed to.
   * Example: "I can do this only if I have chemical help."
   */
  hiddenBargain: string;

  /**
   * The hidden cost - what it actually costs.
   * Should feel like an insight, not a lecture.
   */
  hiddenCost: string;

  /**
   * What this move reinforces / teaches the system.
   * References the teaching/learning dynamic.
   */
  reinforcement: string;

  /**
   * What happens if this pattern is repeated.
   * Future tense, direct, realistic (not catastrophizing).
   */
  consequenceIfRepeated: string;

  /**
   * What to try next time (real-world transfer).
   * Ultra-specific, achievable in 24 hours.
   */
  tryNext: string;

  /**
   * Why this matters - the deeper significance.
   * Connects to larger pattern or principle.
   */
  whyThisMatters: string;

  // ============================================================================
  // STATE AND SUPPORT
  // ============================================================================

  /** What internal state this move is trying to manage */
  targetState: InternalState;

  /** In-the-moment micro-interventions for this move */
  interventions: MoveMicroIntervention[];

  // ============================================================================
  // INSIGHT BEAT TEMPLATE
  // ============================================================================

  /** Template for mid-run insight beat */
  insightTemplate: {
    /** Short label for the insight header (max 20 chars) */
    label: string;
    /** The sharp insight text (1-2 sentences max) */
    text: string;
    /** Why this matters (brief, 1-2 sentences) */
    whyItMatters: string;
  };

  // ============================================================================
  // GENERATION CONTROL
  // ============================================================================

  /**
   * Controls auto-generation behavior.
   * If not specified, defaults are:
   *   - generateBeat: true if interventions.length > 0
   *   - generateInterpretation: true
   */
  generation?: Partial<GenerationControl>;

  // ============================================================================
  // OPTIONAL EXTENSIONS
  // ============================================================================

  /** Optional subtype for more specific categorization within category */
  subtype?: string;

  /** Priority for insight beat triggering (higher = more likely). Default: 50 */
  insightPriority?: number;

  /** Turning point weight for interpretation (higher = more significant). Default: 50 */
  turningPointWeight?: number;

  /** Tags for filtering/search */
  tags?: string[];
}

// ============================================================================
// GENERATION DEFAULTS
// ============================================================================

/**
 * Get the effective generation control for a move.
 * Applies defaults based on move structure.
 */
export function getGenerationControl(move: BehavioralMove): GenerationControl {
  const hasInterventions = move.interventions.length > 0;
  return {
    generateBeat: move.generation?.generateBeat ?? hasInterventions,
    generateInterpretation: move.generation?.generateInterpretation ?? true,
  };
}

// ============================================================================
// CANONICAL BEHAVIORAL MOVE LIBRARY
// ============================================================================

export const BEHAVIORAL_MOVES: Record<string, BehavioralMove> = {

  // ===========================================================================
  // CLUSTER 1: AVOIDANCE
  // Moves involving exit, escape, or safety-seeking
  // ===========================================================================

  premature_exit_door: {
    id: "premature_exit_door",
    category: "premature_exit",
    internalPatternIds: ["experiential_avoidance", "premature_exit"],
    patternContribution: "premature_exit",
    mechanismContribution: "activation",
    valence: "negative",

    userFacingLabel: "You left before trying",
    functionalIntent: "Your system was trying to protect you from rejection, awkwardness, exposure.",
    immediatePayoff: "Relief. The threat is avoided. You're safe.",
    hiddenBargain: "I don't have to find out what happens if I stay.",
    hiddenCost: "Your brain just logged this as 'confirmed: too hard.' Next time will be harder.",
    reinforcement: "Avoidance compounds. Each exit teaches your system that the space is dangerous.",
    consequenceIfRepeated: "The space becomes a place you 'can't go.' Your world shrinks.",
    tryNext: "Tomorrow, just enter. Stand inside for 30 seconds. No expectations beyond that.",
    whyThisMatters: "The hardest part is often just entering. Once you're in, options open up.",

    targetState: "collapse_after_pressure",
    interventions: [
      {
        id: "threshold_one",
        text: "One step back in. That's it. No further goal.",
        why: "Tiny reversal breaks the escape momentum.",
      },
      {
        id: "threshold_shrink",
        text: "Shrink the goal: 30 seconds inside, then you can leave.",
        why: "The bar was too high. Lower it to survivable.",
      },
      {
        id: "threshold_name",
        text: "Say: 'This is the collapse moment.' Don't act on it yet.",
        why: "Naming creates a gap between urge and action.",
      },
    ],

    insightTemplate: {
      label: "Left at the door",
      text: "You got close enough to feel it—and then you bailed. Your brain just filed this under 'confirmed threat.'",
      whyItMatters: "Escape feels like relief. Your body just logged the peak as 'too much to stay.' Next time starts harder.",
    },

    // TUNING: Suppress mid-run beats for premature_exit_door. If the user leaves
    // and then RETURNS (comeback_return, priority 95), the comeback is the critical
    // teachable moment, not the initial exit. premature_exit_door was crowding out
    // comeback_return due to cooldown. If user doesn't return, the avoidance_loop
    // ending explains the pattern. Still generates end-of-run interpretations.
    generation: {
      generateBeat: false,
      generateInterpretation: true,
    },

    insightPriority: 80,
    turningPointWeight: 80,
    tags: ["exit", "avoidance", "threshold"],
  },

  threshold_escape_late: {
    id: "threshold_escape_late",
    category: "threshold_escape",
    internalPatternIds: ["experiential_avoidance", "threshold_collapse"],
    patternContribution: "avoidance_at_threshold",
    mechanismContribution: "persistence",
    valence: "negative",

    userFacingLabel: "You left at the hardest moment",
    functionalIntent: "Your system wanted to protect you from the peak of discomfort.",
    immediatePayoff: "The mounting pressure releases. You're free.",
    hiddenBargain: "I only have to handle what I can handle. When it gets too much, I'm allowed to leave.",
    hiddenCost: "Your body just logged the peak as unmanageable. The fear grows.",
    reinforcement: "Your brain logs: 'Almost made it, but it was too much.' The threshold lowers next time.",
    consequenceIfRepeated: "Your tolerance shrinks. What used to be manageable becomes impossible.",
    tryNext: "Stay through the peak. It passes in 90 seconds. Let it pass.",
    whyThisMatters: "The peak is a lie. It feels unbearable but it doesn't last. Leaving at peak confirms the lie.",

    targetState: "overwhelm",
    interventions: [
      {
        id: "peak_breathe",
        text: "Stop. Breathe. Don't move for 10 seconds.",
        why: "The urge to escape peaks and fades. Wait it out.",
      },
      {
        id: "peak_shrink",
        text: "Just stay until this feeling passes. 90 seconds.",
        why: "Peaks don't last. You can outlast it.",
      },
    ],

    insightTemplate: {
      label: "The threshold",
      text: "You were right at the hard part and you bailed. That's where the learning was.",
      whyItMatters: "Leaving at the peak teaches your system the peak is unmanageable. Staying through it teaches the opposite.",
    },

    insightPriority: 75,
    turningPointWeight: 75,
    tags: ["exit", "threshold", "peak"],
  },

  phone_shield: {
    id: "phone_shield",
    category: "safety_behavior",
    internalPatternIds: ["safety_behavior"],
    patternContribution: "safety_behavior",
    mechanismContribution: "distress_tolerance",
    valence: "negative",

    userFacingLabel: "You reached for cover",
    functionalIntent: "You needed something to hold. The phone dulls the exposure.",
    immediatePayoff: "You're less visible. Less available to be seen or judged.",
    hiddenBargain: "I can be here if I have a buffer between me and the room.",
    hiddenCost: "The phone says to your system: 'This is dangerous—you need protection.'",
    reinforcement: "This keeps the fear believable. You're teaching your brain that you can't handle the space raw.",
    consequenceIfRepeated: "The phone becomes required. You'll feel naked without it. The fear grows.",
    tryNext: "Next time, leave the phone in your pocket for the first 2 minutes.",
    whyThisMatters: "Every time you use it, you confirm the threat. The space stays dangerous because you never let it prove otherwise.",

    targetState: "avoidance_urge",
    interventions: [
      {
        id: "phone_pocket",
        text: "Put it in your pocket. Leave it there for one minute.",
        why: "You break the reflex by not completing it.",
      },
      {
        id: "phone_table",
        text: "Set it face-down on the table. Hands off.",
        why: "Present but not protecting. Halfway honest.",
      },
    ],

    insightTemplate: {
      label: "The shield",
      text: "You grabbed armor before anyone fired a shot. Your system traded 'find out if it's safe' for 'assume it's not.'",
      whyItMatters: "Every time the phone goes up, your brain logs: 'See? You needed it.' The space stays dangerous because you never let it prove otherwise.",
    },

    subtype: "phone",
    insightPriority: 75,
    turningPointWeight: 55,
    tags: ["safety", "phone", "buffer"],
  },

  corner_table_buffer: {
    id: "corner_table_buffer",
    category: "safety_behavior",
    internalPatternIds: ["safety_behavior", "micro_step_success"],
    patternContribution: "safety_behavior",
    mechanismContribution: "threshold_lowering",
    valence: "mixed",

    userFacingLabel: "You chose safety over stretch",
    functionalIntent: "Your system wanted distance from the social pressure.",
    immediatePayoff: "You're in the space but protected. Exposure with a buffer.",
    hiddenBargain: "I can say 'I went' without really testing myself.",
    hiddenCost: "You didn't test what happens at the harder option.",
    reinforcement: "You stayed—but you stayed at a distance. Your brain logged 'present but protected.'",
    consequenceIfRepeated: "The corner table becomes your default. The social options stay untested.",
    tryNext: "Same scenario, but try one table closer.",
    whyThisMatters: "There's a difference between showing up and engaging. Both count—but one grows you more.",

    targetState: "avoidance_urge",
    interventions: [
      {
        id: "corner_look",
        text: "Look at the group for 5 seconds. No smile. Just look.",
        why: "Looking is half the distance to sitting there.",
      },
      {
        id: "corner_spotlight",
        text: "Count who's actually looking at you. It's almost always zero.",
        why: "The spotlight feeling lies. Check it.",
      },
      {
        id: "corner_finish",
        text: "Finish the meal here. Don't leave early, even from the corner.",
        why: "Early exit erases partial credit.",
      },
    ],

    insightTemplate: {
      label: "The buffer zone",
      text: "You stayed, but in a way that kept the room from really happening to you. That's showing up without arriving.",
      whyItMatters: "The corner lets you say 'I went.' But your brain still logged 'too risky to really join.' The fear stays intact.",
    },

    subtype: "position",
    insightPriority: 50,
    turningPointWeight: 50,
    tags: ["safety", "position", "buffer"],
  },

  // ===========================================================================
  // CLUSTER 2: CRUTCH
  // Moves involving state-altering, reassurance, or over-preparation
  // ===========================================================================

  crutch_substance: {
    id: "crutch_substance",
    category: "state_altering_crutch",
    internalPatternIds: ["safety_behavior", "experiential_avoidance"],
    patternContribution: "safety_behavior",
    mechanismContribution: "distress_tolerance",
    valence: "negative",

    userFacingLabel: "You changed your state to make it possible",
    functionalIntent: "Your system said the task was too much on its own. You found a chemical shortcut.",
    immediatePayoff: "Anxiety drops. Confidence feels borrowed but real.",
    hiddenBargain: "I can do this only if I chemically change my state first.",
    hiddenCost: "Sober reps get harder. The situation stays coded as 'too much on its own.'",
    reinforcement: "You're teaching your system you need something outside yourself before you can do hard things.",
    consequenceIfRepeated: "Fear gets outsourced instead of shrunk. You build dependency instead of skill.",
    tryNext: "Do one partial exposure before leaving to regulate. Get one sober rep.",
    whyThisMatters: "State-altering crutches feel like coping but they're actually skill-blockers. The fear stays.",

    targetState: "avoidance_urge",
    interventions: [
      {
        id: "crutch_30sec",
        text: "Stay for 30 seconds as you are. Don't change anything.",
        why: "One sober rep before regulating teaches your system it's possible.",
      },
      {
        id: "crutch_partial",
        text: "Do one small piece of the task first. Then decide.",
        why: "Partial credit while sober counts more than full credit while altered.",
      },
      {
        id: "crutch_notice",
        text: "Notice the urge to change your state. Label it.",
        why: "Awareness of the pattern is the first step.",
      },
    ],

    insightTemplate: {
      label: "The shortcut",
      text: "You needed to change your state before you could do this. That's a dependency, not a skill.",
      whyItMatters: "Every time you regulate before acting, your brain logs 'I can't handle this sober.' The bar keeps rising.",
    },

    subtype: "substance",
    insightPriority: 80,
    turningPointWeight: 70,
    tags: ["crutch", "substance", "state-altering"],
  },

  crutch_scroll: {
    id: "crutch_scroll",
    category: "state_altering_crutch",
    internalPatternIds: ["safety_behavior", "experiential_avoidance"],
    patternContribution: "safety_behavior",
    mechanismContribution: "distress_tolerance",
    valence: "negative",

    userFacingLabel: "You numbed before starting",
    functionalIntent: "Your system said 'too much.' Scrolling turns down the volume.",
    immediatePayoff: "The pressure eases. Starting feels less urgent.",
    hiddenBargain: "I can face this after I'm more regulated.",
    hiddenCost: "You traded activation for numbness. The task gets pushed back. Time disappears.",
    reinforcement: "Your brain logs: 'Hard feeling = scroll first.' The pattern solidifies.",
    consequenceIfRepeated: "Starting gets harder. The scroll becomes required preamble to any difficult task.",
    tryNext: "Start the hard task for 2 minutes before reaching for your phone.",
    whyThisMatters: "Binge-scrolling before hard things isn't rest—it's avoidance in disguise.",

    targetState: "avoidance_urge",
    interventions: [
      {
        id: "scroll_2min",
        text: "Two minutes on the task. Then you can scroll.",
        why: "Starting before numbing proves it's possible.",
      },
      {
        id: "scroll_notice",
        text: "What are you avoiding right now?",
        why: "The scroll is a symptom. Name what's underneath.",
      },
    ],

    insightTemplate: {
      label: "The numbing detour",
      text: "You scrolled to turn down the feeling first. That's not preparation—that's escape with extra steps.",
      whyItMatters: "The task doesn't get easier after scrolling. You just delay it and feel worse.",
    },

    subtype: "scroll",
    insightPriority: 65,
    turningPointWeight: 55,
    tags: ["crutch", "scroll", "numbing"],
  },

  reassurance_seek: {
    id: "reassurance_seek",
    category: "external_reassurance",
    internalPatternIds: ["safety_behavior"],
    patternContribution: "safety_behavior",
    mechanismContribution: "self_compassion",
    valence: "negative",

    userFacingLabel: "You needed someone else to tell you it was okay",
    functionalIntent: "Your system didn't trust your own judgment. External validation felt safer.",
    immediatePayoff: "Relief when they say it's fine. Certainty from outside yourself.",
    hiddenBargain: "I'll believe it's okay only if someone else confirms it.",
    hiddenCost: "You gave away your confidence. You need them now.",
    reinforcement: "Your brain logs: 'I can't trust myself on this.' Self-trust erodes.",
    consequenceIfRepeated: "You become dependent on external confirmation. Your internal compass atrophies.",
    tryNext: "Make one decision without asking anyone else first.",
    whyThisMatters: "Reassurance feels like help but it's actually dependency. Your confidence stays borrowed.",

    targetState: "uncertainty_spiral",
    interventions: [
      {
        id: "reassure_decide",
        text: "Decide first. Then you can ask if you want.",
        why: "Internal decision first. External check second.",
      },
      {
        id: "reassure_wait",
        text: "Wait 10 minutes before asking. See if the urge passes.",
        why: "The urgency is often the anxiety, not the situation.",
      },
      {
        id: "reassure_trust",
        text: "What would you do if you trusted yourself?",
        why: "The answer is usually there. You're just not trusting it.",
      },
    ],

    insightTemplate: {
      label: "The external check",
      text: "You needed someone else to confirm what you already knew. That's dependency, not support.",
      whyItMatters: "Every time you seek reassurance, you tell your brain 'I can't trust myself.' Build internal authority instead.",
    },

    insightPriority: 70,
    turningPointWeight: 60,
    tags: ["reassurance", "dependency", "external"],
  },

  perfectionist_prep: {
    id: "perfectionist_prep",
    category: "perfectionistic_prep",
    internalPatternIds: ["perfectionism"],
    patternContribution: "perfectionism_trap",
    mechanismContribution: "threshold_lowering",
    valence: "negative",

    userFacingLabel: "You needed it to be perfect first",
    functionalIntent: "Your system set the bar at 'ready' instead of 'willing.'",
    immediatePayoff: "Feels productive. Feels like getting ready.",
    hiddenBargain: "I can start when I'm prepared enough that it won't go wrong.",
    hiddenCost: "You're never prepared enough. The preparation becomes the avoidance.",
    reinforcement: "Your brain logs: 'See, you weren't ready. Good thing you waited.'",
    consequenceIfRepeated: "The bar rises. You need more and more prep before anything feels possible.",
    tryNext: "Start before you feel ready. Let 'good enough' be enough.",
    whyThisMatters: "Perfectionism isn't high standards—it's fear wearing a productivity mask.",

    targetState: "avoidance_urge",
    interventions: [
      {
        id: "perf_messy",
        text: "Do a messy version. Ugly counts.",
        why: "Imperfect action beats perfect paralysis.",
      },
      {
        id: "perf_timer",
        text: "Set a timer: 5 minutes of prep, then start.",
        why: "Bounded prep prevents endless preparation.",
      },
      {
        id: "perf_80",
        text: "What would 80% ready look like?",
        why: "80% ready is often 100% enough.",
      },
    ],

    insightTemplate: {
      label: "The perfectionist trap",
      text: "You're preparing to feel ready. You'll never feel ready. Start anyway.",
      whyItMatters: "Perfectionism uses preparation as avoidance. The feeling of 'ready' never comes.",
    },

    insightPriority: 70,
    turningPointWeight: 65,
    tags: ["perfectionism", "prep", "avoidance"],
  },

  // ===========================================================================
  // CLUSTER 3: INTERPRETATION
  // Moves involving how we read and process moments
  // ===========================================================================

  mind_reading_rejection: {
    id: "mind_reading_rejection",
    category: "mind_reading",
    internalPatternIds: ["mind_reading", "catastrophizing"],
    patternContribution: "interpretation_distortion",
    mechanismContribution: "interpretation",
    valence: "negative",

    userFacingLabel: "You turned neutral into rejection",
    functionalIntent: "Your system was scanning for threat. It found one—even though it wasn't there.",
    immediatePayoff: "You feel justified in your fear. The story makes sense.",
    hiddenBargain: "If I assume rejection first, I can't be caught off guard by it.",
    hiddenCost: "You just poisoned a neutral moment. The win became a loss.",
    reinforcement: "This keeps the fear believable. You're teaching your brain that ambiguity = danger.",
    consequenceIfRepeated: "Every flat tone becomes rejection. Your social world gets smaller.",
    tryNext: "After your next ambiguous interaction, write down three interpretations: negative, neutral, positive.",
    whyThisMatters: "Mind-reading isn't reading—it's projecting. The story you tell matters more than what actually happened.",

    targetState: "uncertainty_spiral",
    interventions: [
      {
        id: "rejection_boring",
        text: "Silently say: 'Or they're just tired.'",
        why: "The boring explanation is almost always the true one.",
      },
      {
        id: "rejection_guess",
        text: "Label it out loud: 'That was a guess.'",
        why: "Calling it a guess breaks its authority.",
      },
      {
        id: "rejection_wait",
        text: "Don't decide yet. Give it 60 seconds.",
        why: "The spiral needs you to conclude fast. Don't.",
      },
    ],

    insightTemplate: {
      label: "Filled in the blank",
      text: "Their face gave you nothing. You wrote 'rejection' anyway. That's not reading—that's projecting.",
      whyItMatters: "The story felt true because it matched what you expected. But you made it up. Now it feels like evidence.",
    },

    insightPriority: 85,
    turningPointWeight: 80,
    tags: ["interpretation", "mind-reading", "rejection"],
  },

  self_attack_engage: {
    id: "self_attack_engage",
    category: "self_attack",
    internalPatternIds: ["self_attack"],
    patternContribution: "self_attack_spiral",
    mechanismContribution: "self_compassion",
    valence: "negative",

    userFacingLabel: "You let the critic take over",
    functionalIntent: "The harsh voice had something to say. You listened and agreed.",
    immediatePayoff: "The attack feels deserved. At least you're being honest with yourself.",
    hiddenBargain: "If I'm hard enough on myself, maybe I'll finally change.",
    hiddenCost: "Self-attack doesn't motivate—it paralyzes. You're deeper in the hole now.",
    reinforcement: "Your brain logs: 'See, you deserve this.' The attack becomes the default response to struggle.",
    consequenceIfRepeated: "The critic becomes the only voice. Trying becomes impossible because failure is certain.",
    tryNext: "When the attack starts, say: 'That's the critic.' Don't argue with it—just label it.",
    whyThisMatters: "Self-attack masquerades as standards. It's actually just cruelty wearing a productivity mask.",

    targetState: "self_attack",
    interventions: [
      {
        id: "attack_label",
        text: "Say: 'That's the critic voice.' Don't fight it.",
        why: "Labeling creates distance. You don't have to believe it.",
      },
      {
        id: "attack_friend",
        text: "Would you say this to someone you love?",
        why: "The attack fails the friend test. Notice that.",
      },
      {
        id: "attack_pause",
        text: "Stop. The critic wants you to conclude. Don't.",
        why: "The spiral needs you to keep going. Refuse.",
      },
    ],

    insightTemplate: {
      label: "The critic won",
      text: "The harsh voice showed up and you handed it the mic. It doesn't help—it just hurts.",
      whyItMatters: "Self-attack feels like accountability. It's actually sabotage. Nothing good grows in that soil.",
    },

    insightPriority: 80,
    turningPointWeight: 75,
    tags: ["self-attack", "critic", "spiral"],
  },

  post_event_replay: {
    id: "post_event_replay",
    category: "post_event_processing",
    internalPatternIds: ["post_event_processing", "self_attack"],
    patternContribution: "interpretation_distortion",
    mechanismContribution: "interpretation",
    valence: "negative",

    userFacingLabel: "You started the replay",
    functionalIntent: "Your system is scanning for what went wrong, what you could have done better.",
    immediatePayoff: "It feels productive—like you're learning something.",
    hiddenBargain: "If I analyze everything, I can figure out what went wrong and prevent it next time.",
    hiddenCost: "The replay turns a neutral or positive experience into evidence against yourself.",
    reinforcement: "This teaches your brain that every interaction needs post-analysis. It doesn't.",
    consequenceIfRepeated: "Every interaction becomes a test you probably failed. The fear grows even when you succeed.",
    tryNext: "After your next social moment, set a 2-minute timer. When it goes off: 'Replay time is over.'",
    whyThisMatters: "Post-event processing is the leak in the bucket. You did well—the replay says otherwise.",

    targetState: "post_event_rumination",
    interventions: [
      {
        id: "replay_timer",
        text: "Set a 2-minute timer. When it goes off, stop.",
        why: "Bounded analysis. Then it's done.",
      },
      {
        id: "replay_label",
        text: "Say out loud: 'This is post-event processing.'",
        why: "Naming it breaks its power.",
      },
      {
        id: "replay_redirect",
        text: "Do something physical. Move your body.",
        why: "Physical action interrupts mental loops.",
      },
    ],

    insightTemplate: {
      label: "The replay",
      text: "The experience was over. Then your brain started picking it apart.",
      whyItMatters: "This is the cruelest part of social anxiety: you can do the hard thing and still turn it into evidence against yourself.",
    },

    insightPriority: 70,
    turningPointWeight: 70,
    tags: ["rumination", "post-event", "replay"],
  },

  grounded_interpretation: {
    id: "grounded_interpretation",
    category: "grounded_read",
    internalPatternIds: ["grounded_interpretation"],
    patternContribution: "grounded_interpretation",
    mechanismContribution: "interpretation",
    valence: "positive",

    userFacingLabel: "You read the moment for what it was",
    functionalIntent: "Your brain wanted to find threat. You chose accuracy instead.",
    immediatePayoff: "The moment didn't spiral. You stayed grounded.",
    hiddenBargain: "None—this is the skill working.",
    hiddenCost: "None.",
    reinforcement: "This teaches your system that not everything is a signal. Sometimes people are just... there.",
    consequenceIfRepeated: "If you keep reading moments accurately, the threat detector recalibrates.",
    tryNext: "Practice the question: 'What's the most neutral reading?' in your next ambiguous moment.",
    whyThisMatters: "The story you tell about a moment matters more than what happened. You told the true one.",

    targetState: "grounded_approach",
    interventions: [
      {
        id: "grounded_log",
        text: "Mark it: 'Neutral face. I didn't add a story.'",
        why: "Explicit logging strengthens the accurate pattern.",
      },
      {
        id: "grounded_stay",
        text: "Stay a few minutes longer. Extend the data.",
        why: "Duration at accurate interpretation compounds the learning.",
      },
    ],

    insightTemplate: {
      label: "Accurate read",
      text: "Your system scanned for threat and you didn't take the bait. You let neutral be neutral.",
      whyItMatters: "This is what recalibration looks like. One accurate read at a time, the threat detector gets retrained.",
    },

    insightPriority: 65,
    turningPointWeight: 85,
    tags: ["interpretation", "grounded", "accurate"],
  },

  // ===========================================================================
  // CLUSTER 4: OVERCONTROL
  // Moves involving pushing too hard or all-or-nothing thinking
  // ===========================================================================

  all_or_nothing_big: {
    id: "all_or_nothing_big",
    category: "all_or_nothing",
    internalPatternIds: ["black_and_white_thinking", "threshold_collapse"],
    patternContribution: "perfectionism_trap",
    mechanismContribution: "threshold_lowering",
    valence: "negative",

    userFacingLabel: "You made it all-or-nothing",
    functionalIntent: "Your system only accepts the full win. Partial credit doesn't count.",
    immediatePayoff: "Clarity. The goal is simple: do it all or don't start.",
    hiddenBargain: "I'll do it right or not at all. No half-measures.",
    hiddenCost: "You miss every workable middle path. The task stays undone.",
    reinforcement: "Your brain logs: 'See, the smaller version didn't feel worth it.' The pattern solidifies.",
    consequenceIfRepeated: "Everything becomes too big to start. Your capacity to act shrinks.",
    tryNext: "Find the smallest possible version. Make that the goal.",
    whyThisMatters: "All-or-nothing thinking blocks action. The smallest step counts more than the perfect plan.",

    targetState: "avoidance_urge",
    interventions: [
      {
        id: "aon_smallest",
        text: "What's the smallest version that still counts?",
        why: "Small beats nothing. Always.",
      },
      {
        id: "aon_partial",
        text: "Partial credit is still credit.",
        why: "Done is better than perfect.",
      },
    ],

    insightTemplate: {
      label: "Too big to start",
      text: "You set the bar at 'all' and got 'nothing.' That's not high standards—that's a trap.",
      whyItMatters: "The smallest step forward beats the grandest plan that never happens.",
    },

    insightPriority: 70,
    turningPointWeight: 65,
    tags: ["all-or-nothing", "threshold", "perfectionism"],
  },

  overforcing_push: {
    id: "overforcing_push",
    category: "overforcing",
    internalPatternIds: ["overforcing"],
    patternContribution: "overreach_collapse",
    mechanismContribution: "flexibility",
    valence: "negative",

    userFacingLabel: "You pushed and your system pushed back",
    functionalIntent: "You tried to force through when your system was already strained.",
    immediatePayoff: "Feels like effort. Feels like you're fighting for it.",
    hiddenBargain: "If I push hard enough, I can make this work.",
    hiddenCost: "Your system has limits. Pushing past them triggers collapse, not victory.",
    reinforcement: "Your brain logs: 'Tried too hard, crashed.' The overforce-collapse cycle deepens.",
    consequenceIfRepeated: "You oscillate between overreach and collapse. Sustainable effort stays out of reach.",
    tryNext: "Stop one step before maximum effort. Leave something in the tank.",
    whyThisMatters: "Overforcing isn't strength—it's panic wearing an effort costume.",

    targetState: "overcontrol",
    interventions: [
      {
        id: "overforce_pause",
        text: "Stop. Check: are you pushing or proceeding?",
        why: "The distinction matters. Notice which one this is.",
      },
      {
        id: "overforce_70",
        text: "Dial it to 70%. What does that look like?",
        why: "Sustainable beats heroic.",
      },
    ],

    insightTemplate: {
      label: "The push",
      text: "You tried to force your way through. Your system doesn't work that way.",
      whyItMatters: "Effort is good. But pushing past your limits isn't effort—it's desperation. It usually backfires.",
    },

    insightPriority: 65,
    turningPointWeight: 60,
    tags: ["overforce", "push", "collapse"],
  },

  // ===========================================================================
  // CLUSTER 5: POSITIVE
  // Moves involving approach, recovery, tolerance, and skill
  // ===========================================================================

  comeback_return: {
    id: "comeback_return",
    category: "recovery_return",
    internalPatternIds: ["recovery_success", "values_aligned_action"],
    patternContribution: "recovery_success",
    mechanismContribution: "recovery",
    valence: "positive",

    userFacingLabel: "You came back",
    functionalIntent: "The relief of escape wasn't enough. You wanted more than safety.",
    immediatePayoff: "Second chance. New data. Different outcome.",
    hiddenBargain: "None—this is the hardest move.",
    hiddenCost: "Re-entering is harder than entering. You did it anyway.",
    reinforcement: "This teaches your system that setbacks are temporary. Escape isn't final.",
    consequenceIfRepeated: "Leaving becomes a pause, not a verdict. Your options stay open.",
    tryNext: "If you leave a social situation this week, try returning within 10 minutes.",
    whyThisMatters: "Recovery is the rarest skill. Most people who leave stay gone. You didn't.",

    targetState: "recovery_window",
    interventions: [
      {
        id: "comeback_ground",
        text: "You're back. That's the win. Nothing else required.",
        why: "Don't add goals. The return is complete.",
      },
      {
        id: "comeback_tiny",
        text: "One small thing: sit down, order, look around. Pick one.",
        why: "Low bar protects the recovery.",
      },
    ],

    insightTemplate: {
      label: "The return",
      text: "You left. And then you walked back in. That second entry is the move almost nobody makes.",
      whyItMatters: "Escape usually wins permanently. You just proved it doesn't have to. Your brain logged 'I can come back' instead of 'I can't handle it.'",
    },

    insightPriority: 95,
    turningPointWeight: 95,
    tags: ["recovery", "comeback", "return"],
  },

  catch_spiral_mid: {
    id: "catch_spiral_mid",
    category: "recovery_return",
    internalPatternIds: ["recovery_success", "grounded_interpretation"],
    patternContribution: "recovery_success",
    mechanismContribution: "recovery",
    valence: "positive",

    userFacingLabel: "You caught yourself mid-spiral",
    functionalIntent: "The spiral wanted to run. You interrupted it.",
    immediatePayoff: "You're still here. The moment didn't collapse.",
    hiddenBargain: "None—this is the skill working.",
    hiddenCost: "The discomfort didn't disappear—you sat with it instead.",
    reinforcement: "This teaches your system that spirals are interruptible. You're not at their mercy.",
    consequenceIfRepeated: "If you keep catching spirals, they get shorter. The alarm bells lose their power.",
    tryNext: "When you notice a spiral starting, say out loud: 'That's a story, not a fact.'",
    whyThisMatters: "Catching distortions mid-flight is a higher-order skill. You just practiced it.",

    targetState: "recovery_window",
    interventions: [
      {
        id: "catch_hold",
        text: "Don't conclude. Hold the not-knowing for 30 seconds.",
        why: "Uncertainty is tolerable. You don't have to resolve it.",
      },
      {
        id: "catch_stay",
        text: "Stay until the spike passes. Don't leave at peak.",
        why: "Leaving now teaches your brain the peak is unmanageable.",
      },
      {
        id: "catch_look",
        text: "Look at them again. Check if the data matches your story.",
        why: "Second look often contradicts first read.",
      },
    ],

    insightTemplate: {
      label: "Caught mid-story",
      text: "You were writing a rejection script and you stopped typing. That interrupt is harder than never starting.",
      whyItMatters: "The spiral wanted you to finish the story. You refused. That's not nothing—that's the skill working in real time.",
    },

    insightPriority: 90,
    turningPointWeight: 90,
    tags: ["recovery", "spiral", "catch"],
  },

  direct_entry: {
    id: "direct_entry",
    category: "direct_approach",
    internalPatternIds: ["values_aligned_action"],
    patternContribution: "direct_action",
    mechanismContribution: "activation",
    valence: "positive",

    userFacingLabel: "You moved forward despite the resistance",
    functionalIntent: "Your system was trying to buy time, scan for safety. You overrode it.",
    immediatePayoff: "You're in. The decision is made. No more hovering at the threshold.",
    hiddenBargain: "None—this is the skill working.",
    hiddenCost: "The discomfort didn't go away—it came with you.",
    reinforcement: "Your brain just logged: 'I can move before I feel ready.' That's the whole skill.",
    consequenceIfRepeated: "Each time you enter directly, the threshold gets lower. The door becomes less significant.",
    tryNext: "Tomorrow, enter one space 30 seconds faster than feels comfortable.",
    whyThisMatters: "The hesitation at the door is where most people get stuck. You didn't.",

    targetState: "grounded_approach",
    interventions: [
      {
        id: "entry_stay",
        text: "You're here. Don't bolt. Let the discomfort settle.",
        why: "Staying through the spike is what changes it.",
      },
      {
        id: "entry_small",
        text: "Say one sentence. Anything. The content doesn't matter.",
        why: "Action solidifies approach. Words are secondary.",
      },
    ],

    insightTemplate: {
      label: "Toward the hard thing",
      text: "Your system said 'not yet' and you went anyway. That override is the whole skill.",
      whyItMatters: "Fear shrinks when you approach what it says to avoid. You just gave your brain data it couldn't get from outside.",
    },

    // TUNING: Suppress mid-run beats for direct_entry. This move fires frequently on
    // positive paths (often 2-3x per run). Positive behavior is its own reward—don't
    // crowd out critical negative beats with "good job" cards. Still generates step
    // interpretations for end-of-run.
    generation: {
      generateBeat: false,
      generateInterpretation: true,
    },

    insightPriority: 70,
    turningPointWeight: 60,
    tags: ["direct", "entry", "approach"],
  },

  direct_ask: {
    id: "direct_ask",
    category: "direct_approach",
    internalPatternIds: ["direct_communication", "values_aligned_action"],
    patternContribution: "direct_action",
    mechanismContribution: "directness",
    valence: "positive",

    userFacingLabel: "You said what needed to be said",
    functionalIntent: "Part of you wanted to retreat. You pushed through.",
    immediatePayoff: "You're now in the game. The passive moment became active.",
    hiddenBargain: "None—this is direct action.",
    hiddenCost: "Higher stakes. More exposure. More to potentially replay later.",
    reinforcement: "This teaches your system that you can initiate, not just respond.",
    consequenceIfRepeated: "Speaking up gets easier. Silence becomes optional, not mandatory.",
    tryNext: "Try asking one follow-up question in your next real conversation.",
    whyThisMatters: "Initiative is where connection starts. You just took it.",

    targetState: "grounded_approach",
    interventions: [
      {
        id: "ask_wait",
        text: "Wait for their response. Don't fill the silence.",
        why: "Let them respond. You did your part.",
      },
      {
        id: "ask_breathe",
        text: "Breathe. The ask is done. Let it land.",
        why: "The hardest part is over.",
      },
    ],

    insightTemplate: {
      label: "The direct ask",
      text: "You spoke when you could have stayed silent. That's direct communication.",
      whyItMatters: "Most people wait to be invited. You invited yourself. That's a skill.",
    },

    // TUNING: Suppress mid-run beats for direct_ask. The act of asking is minor;
    // the interpretation that follows (grounded_interpretation or mind_reading_rejection)
    // is the critical skill moment. direct_ask was crowding out interpretation beats
    // due to cooldown. Still generates end-of-run interpretations.
    generation: {
      generateBeat: false,
      generateInterpretation: true,
    },

    insightPriority: 70,
    turningPointWeight: 70,
    tags: ["direct", "ask", "communication"],
  },

  stay_through_hard: {
    id: "stay_through_hard",
    category: "distress_tolerance",
    internalPatternIds: ["distress_tolerated"],
    patternContribution: "distress_tolerated",
    mechanismContribution: "distress_tolerance",
    valence: "positive",

    userFacingLabel: "You stayed through the hard part",
    functionalIntent: "Your system wanted to fill it, escape it, fix it. You did nothing.",
    immediatePayoff: "The moment passed. You're still here.",
    hiddenBargain: "None—this is distress tolerance.",
    hiddenCost: "The discomfort wasn't avoided—it was felt.",
    reinforcement: "This teaches your system that discomfort is tolerable. You don't have to fix everything.",
    consequenceIfRepeated: "Silence becomes less threatening. You gain access to moments others flee.",
    tryNext: "In your next awkward moment, let 5 seconds pass before acting.",
    whyThisMatters: "Distress tolerance is the foundation. You can't engage if you can't stay.",

    targetState: "grounded_approach",
    interventions: [
      {
        id: "stay_breathe",
        text: "Breathe. This feeling will pass.",
        why: "Discomfort peaks and fades. Wait it out.",
      },
      {
        id: "stay_notice",
        text: "Notice where you feel it in your body. Just notice.",
        why: "Observation creates distance from the feeling.",
      },
    ],

    insightTemplate: {
      label: "Stayed through it",
      text: "The moment was uncomfortable. You let it be uncomfortable.",
      whyItMatters: "This is distress tolerance in action. You stayed when your system wanted to flee.",
    },

    insightPriority: 75,
    turningPointWeight: 75,
    tags: ["distress", "tolerance", "stay"],
  },

  threshold_lower_success: {
    id: "threshold_lower_success",
    category: "threshold_lowering",
    internalPatternIds: ["micro_step_success"],
    patternContribution: "threshold_lowered",
    mechanismContribution: "threshold_lowering",
    valence: "positive",

    userFacingLabel: "You found a move small enough to work",
    functionalIntent: "You stopped asking for the full win. You asked for a workable step.",
    immediatePayoff: "Action. Movement. Something instead of nothing.",
    hiddenBargain: "None—this is the skill.",
    hiddenCost: "It's not the full thing. But it's something.",
    reinforcement: "Your brain logs: 'That was achievable.' The bar becomes realistic.",
    consequenceIfRepeated: "You build momentum. Small steps compound. The impossible becomes possible.",
    tryNext: "Find another area where you can lower the bar to get started.",
    whyThisMatters: "Lowering the threshold isn't weakness—it's strategy. Your system needs wins it can actually achieve.",

    targetState: "grounded_approach",
    interventions: [
      {
        id: "lower_celebrate",
        text: "That counted. Mark it.",
        why: "Small wins need acknowledgment.",
      },
      {
        id: "lower_next",
        text: "What's the next smallest step?",
        why: "Build on what worked.",
      },
    ],

    insightTemplate: {
      label: "Small enough to work",
      text: "You found a step your system could say yes to. That's not compromise—that's skill.",
      whyItMatters: "The people who get things done aren't braver. They're better at finding workable steps.",
    },

    // TUNING: Suppress mid-run beats. On threshold-lowering routes (especially Morning
    // Bed), this move can fire 2-3x in quick succession. The step interpretations at
    // end-of-run capture the pattern better than repetitive mid-run interruptions.
    generation: {
      generateBeat: false,
      generateInterpretation: true,
    },

    insightPriority: 65,
    turningPointWeight: 75,
    tags: ["threshold", "micro-step", "success"],
  },

  threshold_overwhelm: {
    id: "threshold_overwhelm",
    category: "threshold_escape",
    internalPatternIds: ["threshold_collapse", "experiential_avoidance"],
    patternContribution: "avoidance_at_threshold",
    mechanismContribution: "threshold_lowering",
    valence: "negative",

    userFacingLabel: "Even the smallest thing felt too big",
    functionalIntent: "Your system tried to find a workable step and came up empty. Everything felt impossible.",
    immediatePayoff: "You stop struggling. The pressure to act fades.",
    hiddenBargain: "If I can't find anything small enough, I'm allowed to stop.",
    hiddenCost: "You didn't run out of options—your system quit looking. There's always a smaller step.",
    reinforcement: "Your brain logs: 'See, it was impossible.' But it wasn't—you just couldn't see the path from inside the overwhelm.",
    consequenceIfRepeated: "The overwhelm becomes the verdict. You stop looking for workable steps because 'there aren't any.'",
    tryNext: "When everything feels too big: what's something you could do with one hand, without standing up, in 10 seconds?",
    whyThisMatters: "Overwhelm lies. It says 'nothing is possible.' There's always something smaller—you just can't see it from inside the storm.",

    targetState: "overwhelm",
    interventions: [
      {
        id: "overwhelm_tinier",
        text: "What if the goal was just to move one finger?",
        why: "The bar can always go lower. Find the floor.",
      },
      {
        id: "overwhelm_wait",
        text: "Don't decide yet. Let the spike pass first.",
        why: "Overwhelm peaks and fades. Wait 90 seconds.",
      },
      {
        id: "overwhelm_witness",
        text: "Say: 'This is the overwhelm.' Don't fix it—just name it.",
        why: "Naming creates distance from the feeling.",
      },
    ],

    insightTemplate: {
      label: "The overwhelm wall",
      text: "You looked for something small enough to do. Everything felt impossible. That's the overwhelm talking—not reality.",
      whyItMatters: "When your system says 'nothing is possible,' it's lying. There's always a smaller step. You just couldn't see it from inside the storm.",
    },

    insightPriority: 85,
    turningPointWeight: 70,
    tags: ["overwhelm", "threshold", "stuck"],
  },

  self_compassion_applied: {
    id: "self_compassion_applied",
    category: "self_compassion",
    internalPatternIds: ["compassionate_response"],
    patternContribution: "compassion_applied",
    mechanismContribution: "self_compassion",
    valence: "positive",

    userFacingLabel: "You gave yourself room",
    functionalIntent: "Instead of attacking yourself for struggling, you made space for it.",
    immediatePayoff: "The pressure eases. You can breathe.",
    hiddenBargain: "None—this is self-compassion.",
    hiddenCost: "None.",
    reinforcement: "You're teaching your system that struggle is allowed. You don't have to be perfect to be okay.",
    consequenceIfRepeated: "You recover faster. Setbacks become information, not verdicts.",
    tryNext: "Next time you stumble, treat yourself like you'd treat a friend.",
    whyThisMatters: "Self-compassion isn't softness. It's the foundation that lets you try hard things.",

    targetState: "recovery_window",
    interventions: [
      {
        id: "comp_friend",
        text: "What would you say to a friend in this moment?",
        why: "You deserve the same kindness you'd give others.",
      },
      {
        id: "comp_human",
        text: "This is hard. It's okay that it's hard.",
        why: "Acknowledging difficulty isn't weakness.",
      },
    ],

    insightTemplate: {
      label: "Room to be human",
      text: "You could have attacked yourself. You chose kindness instead.",
      whyItMatters: "Self-compassion is what lets you try again. Self-attack is what makes you stop trying.",
    },

    insightPriority: 65,
    turningPointWeight: 75,
    tags: ["compassion", "self-kindness", "recovery"],
  },

  flexible_adjust: {
    id: "flexible_adjust",
    category: "flexible_response",
    internalPatternIds: ["flexible_response"],
    patternContribution: "micro_progress",
    mechanismContribution: "flexibility",
    valence: "positive",

    userFacingLabel: "You adjusted when it wasn't working",
    functionalIntent: "Your original plan wasn't working. You changed course instead of forcing.",
    immediatePayoff: "A new path opens. Stuck becomes unstuck.",
    hiddenBargain: "None—this is flexibility.",
    hiddenCost: "The original plan didn't work. That's okay.",
    reinforcement: "Your brain logs: 'I can adjust.' Rigidity loosens.",
    consequenceIfRepeated: "You become more adaptive. Obstacles become detours, not walls.",
    tryNext: "When your next plan doesn't work, ask: 'What's the adjusted version?'",
    whyThisMatters: "Flexibility is what keeps you moving when the first path closes.",

    targetState: "grounded_approach",
    interventions: [
      {
        id: "flex_ask",
        text: "What's another way to get there?",
        why: "There's usually more than one path.",
      },
      {
        id: "flex_shrink",
        text: "What's a smaller version that still counts?",
        why: "Shrinking beats stopping.",
      },
    ],

    insightTemplate: {
      label: "The pivot",
      text: "Plan A didn't work. You didn't quit—you found Plan B.",
      whyItMatters: "Most people confuse 'this way failed' with 'I failed.' You didn't.",
    },

    insightPriority: 60,
    turningPointWeight: 65,
    tags: ["flexibility", "adjust", "pivot"],
  },

  pacing_win: {
    id: "pacing_win",
    category: "threshold_lowering",
    internalPatternIds: ["micro_step_success", "compassionate_response"],
    patternContribution: "micro_progress",
    mechanismContribution: "threshold_lowering",
    valence: "positive",

    userFacingLabel: "You accepted partial as a win",
    functionalIntent: "Your system wanted more. You said 'this counts.'",
    immediatePayoff: "The pressure lifts. What you did becomes enough.",
    hiddenBargain: "None—this is skill.",
    hiddenCost: "None. This is exactly right.",
    reinforcement: "Your brain logs: 'Partial is valid.' The bar becomes realistic.",
    consequenceIfRepeated: "You build sustainable momentum instead of boom-bust cycles.",
    tryNext: "Notice when you dismiss partial progress. Practice saying: 'This counted.'",
    whyThisMatters: "Most people discount anything less than 100%. You just claimed credit for real progress.",

    targetState: "grounded_approach",
    interventions: [
      {
        id: "pacing_mark",
        text: "Say it: 'This counted.' Out loud if you can.",
        why: "Explicit acknowledgment locks in the win.",
      },
      {
        id: "pacing_notice",
        text: "Notice the urge to do more. You don't have to act on it.",
        why: "The push for 'more' can undo the win. Let it pass.",
      },
      {
        id: "pacing_rest",
        text: "Rest here. You earned it.",
        why: "Sustainable progress includes rest.",
      },
    ],

    insightTemplate: {
      label: "Partial credit claimed",
      text: "You could have pushed for more. Instead, you said 'this is enough.' That's not giving up—that's pacing.",
      whyItMatters: "The all-or-nothing trap says partial doesn't count. You just proved it wrong.",
    },

    insightPriority: 70,
    turningPointWeight: 70,
    tags: ["pacing", "acceptance", "partial"],
  },

  support_accept: {
    id: "support_accept",
    category: "support_seeking",
    internalPatternIds: ["support_utilized"],
    patternContribution: "support_utilized",
    mechanismContribution: "support_seeking",
    valence: "positive",

    userFacingLabel: "You let someone be there",
    functionalIntent: "You accepted help instead of going it alone.",
    immediatePayoff: "You're not alone. The weight is shared.",
    hiddenBargain: "None—this is support-seeking.",
    hiddenCost: "You had to admit you needed help. That's courage, not weakness.",
    reinforcement: "Your brain logs: 'Help is available. I can use it.'",
    consequenceIfRepeated: "Your support network strengthens. Hard things become more manageable.",
    tryNext: "Ask for help on one small thing this week.",
    whyThisMatters: "Accepting support isn't weakness—it's wisdom. No one does hard things completely alone.",

    targetState: "recovery_window",
    interventions: [
      {
        id: "support_thank",
        text: "Let them know it helped.",
        why: "Acknowledgment strengthens the connection.",
      },
      {
        id: "support_specific",
        text: "Be specific about what you need.",
        why: "Specific asks get better support.",
      },
    ],

    insightTemplate: {
      label: "Support accepted",
      text: "You let someone help. That's a skill, not a weakness.",
      whyItMatters: "The myth of doing everything alone keeps people stuck. You just did something smarter.",
    },

    insightPriority: 55,
    turningPointWeight: 60,
    tags: ["support", "help", "connection"],
  },
};

// ============================================================================
// MOVE LIBRARY API
// ============================================================================

/**
 * Get a behavioral move by ID
 */
export function getMove(moveId: string): BehavioralMove | undefined {
  return BEHAVIORAL_MOVES[moveId];
}

/**
 * Get all moves by category
 */
export function getMovesByCategory(category: MoveCategory): BehavioralMove[] {
  return Object.values(BEHAVIORAL_MOVES).filter((move) => move.category === category);
}

/**
 * Get all moves by valence
 */
export function getMovesByValence(valence: MoveValence): BehavioralMove[] {
  return Object.values(BEHAVIORAL_MOVES).filter((move) => move.valence === valence);
}

/**
 * Get all moves targeting a specific internal state
 */
export function getMovesByTargetState(state: InternalState): BehavioralMove[] {
  return Object.values(BEHAVIORAL_MOVES).filter((move) => move.targetState === state);
}

/**
 * Get all moves with interventions
 */
export function getMovesWithInterventions(): BehavioralMove[] {
  return Object.values(BEHAVIORAL_MOVES).filter((move) => move.interventions.length > 0);
}

/**
 * Get all moves that should generate insight beats by default
 */
export function getMovesWithBeatGeneration(): BehavioralMove[] {
  return Object.values(BEHAVIORAL_MOVES).filter((move) => getGenerationControl(move).generateBeat);
}

/**
 * List all available move IDs
 */
export function listMoveIds(): string[] {
  return Object.keys(BEHAVIORAL_MOVES);
}

/**
 * List all available move IDs by cluster
 */
export function listMoveIdsByCluster(): Record<string, string[]> {
  const clusters: Record<string, MoveCategory[]> = {
    avoidance: ["premature_exit", "threshold_escape", "safety_behavior", "numbing_detour", "preemptive_escape"],
    crutch: ["state_altering_crutch", "external_reassurance", "perfectionistic_prep", "rehearsal_loop"],
    interpretation: ["mind_reading", "catastrophizing", "post_event_processing", "self_attack", "emotional_reasoning"],
    overcontrol: ["overforcing", "overcontrol", "all_or_nothing"],
    positive: ["direct_approach", "recovery_return", "grounded_read", "distress_tolerance", "threshold_lowering", "support_seeking", "micro_step", "self_compassion", "flexible_response", "values_aligned_action"],
  };

  const result: Record<string, string[]> = {};
  for (const [cluster, categories] of Object.entries(clusters)) {
    result[cluster] = Object.values(BEHAVIORAL_MOVES)
      .filter((move) => categories.includes(move.category))
      .map((move) => move.id);
  }
  return result;
}

// ============================================================================
// MOVE CATEGORY METADATA
// ============================================================================

export const MOVE_CATEGORY_METADATA: Record<MoveCategory, { name: string; description: string; valence: MoveValence }> = {
  // Avoidance cluster
  premature_exit: { name: "Premature Exit", description: "Leave before trying", valence: "negative" },
  threshold_escape: { name: "Threshold Escape", description: "Leave at the hard moment", valence: "negative" },
  safety_behavior: { name: "Safety Behavior", description: "Use shield/buffer/protection", valence: "negative" },
  numbing_detour: { name: "Numbing Detour", description: "Check out / dissociate", valence: "negative" },
  preemptive_escape: { name: "Preemptive Escape", description: "Plan exit before entering", valence: "negative" },

  // Crutch cluster
  state_altering_crutch: { name: "State-Altering Crutch", description: "Change state before acting", valence: "negative" },
  external_reassurance: { name: "External Reassurance", description: "Seek confirmation from others", valence: "negative" },
  perfectionistic_prep: { name: "Perfectionistic Prep", description: "Over-prepare until safe", valence: "negative" },
  rehearsal_loop: { name: "Rehearsal Loop", description: "Practice until anxiety permits", valence: "negative" },

  // Interpretation cluster
  mind_reading: { name: "Mind-Reading", description: "Assume rejection", valence: "negative" },
  catastrophizing: { name: "Catastrophizing", description: "Jump to worst case", valence: "negative" },
  post_event_processing: { name: "Post-Event Processing", description: "Replay until it's bad", valence: "negative" },
  self_attack: { name: "Self-Attack", description: "Turn criticism inward", valence: "negative" },
  emotional_reasoning: { name: "Emotional Reasoning", description: "Treat feeling like fact", valence: "negative" },

  // Overcontrol cluster
  overforcing: { name: "Overforcing", description: "Push too hard", valence: "negative" },
  overcontrol: { name: "Overcontrol", description: "Try to manage everything", valence: "negative" },
  all_or_nothing: { name: "All-or-Nothing", description: "Perfect or don't start", valence: "negative" },

  // Positive cluster
  direct_approach: { name: "Direct Approach", description: "Move toward despite fear", valence: "positive" },
  recovery_return: { name: "Recovery Return", description: "Come back after leaving", valence: "positive" },
  grounded_read: { name: "Grounded Read", description: "Accurate interpretation", valence: "positive" },
  distress_tolerance: { name: "Distress Tolerance", description: "Stay through hard part", valence: "positive" },
  threshold_lowering: { name: "Threshold Lowering", description: "Find smaller step", valence: "positive" },
  support_seeking: { name: "Support Seeking", description: "Accept help", valence: "positive" },
  micro_step: { name: "Micro-Step", description: "Find workable small move", valence: "positive" },
  self_compassion: { name: "Self-Compassion", description: "Give self room", valence: "positive" },
  flexible_response: { name: "Flexible Response", description: "Adjust when plan doesn't work", valence: "positive" },
  values_aligned_action: { name: "Values-Aligned Action", description: "Move toward what matters", valence: "positive" },
};

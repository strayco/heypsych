/**
 * PsychTrails - Rewards System
 *
 * Calculates XP, confidence gains, and insight cards for scenario completion
 */

import type { RunState, ScenarioCompletionResult } from "./types";

// XP formula constants
const XP_BASE = 50;
const XP_PER_STEP = 5;
const XP_COMPLETION_BONUS = 20;

// Confidence gain constants
const CONFIDENCE_BASE = 10;
const CONFIDENCE_BONUS_FOR_GOOD_ENDING = 5;

// Insight card pool
const INSIGHT_CARDS = [
  // Generic cards
  {
    id: "preparation-matters",
    title: "Preparation Matters",
    text: "Coming prepared to appointments helps you feel more confident and communicate better with providers.",
  },
  {
    id: "communication-key",
    title: "Communication is Key",
    text: "Being open and honest about your symptoms helps providers understand your needs and create better treatment plans.",
  },
  {
    id: "self-advocacy",
    title: "Self-Advocacy Works",
    text: "Speaking up about your concerns and preferences is an important part of getting the care you need.",
  },
  {
    id: "progress-not-perfection",
    title: "Progress, Not Perfection",
    text: "Mental health care is a journey. Each step forward, no matter how small, builds your confidence and skills.",
  },
  // Social Anxiety cards
  {
    id: "attempts-count-more-than-reactions",
    title: "Attempts Count More Than Reactions",
    text: "Showing up and trying matters more than how people respond. You can't control their reactions, only your willingness to practice.",
  },
  {
    id: "neutral-doesnt-mean-bad",
    title: "Neutral Doesn't Mean Bad",
    text: "Most people are neutral most of the time. Neutral isn't rejection—it's just normal. Don't let your mind turn 'meh' into 'no.'",
  },
  {
    id: "one-question-is-enough",
    title: "One Question Is Enough",
    text: "You don't need a whole conversation. One clear question is a complete rep. Small steps add up.",
  },
  {
    id: "clarity-beats-confidence",
    title: "Clarity Beats Confidence",
    text: "You don't need to feel sure of yourself to ask for help. You just need to be clear about what you need. Confidence follows action, not the other way around.",
  },
];

// Scenario-specific card mapping (deterministic)
const SCENARIO_CARD_MAPPING: Record<string, string> = {
  "college_social_anxiety_dining_hall_v1": "attempts-count-more-than-reactions",
  "college_social_anxiety_office_hours_v1": "clarity-beats-confidence",
};

/**
 * Calculate XP earned for completing a scenario
 */
export function calculateXP(state: RunState): number {
  const stepXP = state.currentStep * XP_PER_STEP;
  return XP_BASE + stepXP + XP_COMPLETION_BONUS;
}

/**
 * Calculate confidence gain for completing a scenario
 * Can vary based on ending quality, but simple for MVP
 */
export function calculateConfidenceGain(
  state: RunState,
  isPositiveEnding: boolean = true
): number {
  let gain = CONFIDENCE_BASE;

  // Bonus for positive endings
  if (isPositiveEnding) {
    gain += CONFIDENCE_BONUS_FOR_GOOD_ENDING;
  }

  return gain;
}

/**
 * Select an insight card to award
 * Checks scenario-specific mapping first, then falls back to rotation
 */
export function selectInsightCard(scenarioId: string, completionCount: number): string {
  // Check if there's a scenario-specific card
  const scenarioCard = SCENARIO_CARD_MAPPING[scenarioId];
  if (scenarioCard) {
    return scenarioCard;
  }

  // Fall back to rotation through generic cards
  const cardIndex = completionCount % 4; // Only rotate through first 4 (generic cards)
  return INSIGHT_CARDS[cardIndex].id;
}

/**
 * Get insight card details by ID
 */
export function getInsightCard(cardId: string) {
  return INSIGHT_CARDS.find((card) => card.id === cardId);
}

/**
 * Calculate complete scenario completion result
 */
export function calculateCompletionResult(
  state: RunState,
  scenarioId: string,
  isPositiveEnding: boolean = true,
  completionCount: number = 0
): ScenarioCompletionResult {
  const xpEarned = calculateXP(state);
  const confidenceGain = calculateConfidenceGain(state, isPositiveEnding);
  const insightCardId = selectInsightCard(scenarioId, completionCount);

  return {
    xpEarned,
    confidenceGain,
    insightCardId,
    endingId: state.endingId ?? "unknown",
  };
}

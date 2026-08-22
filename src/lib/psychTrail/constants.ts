import type { ScoreCategory, MasteryTier, Grade, Rank, ScoringConfig } from "./types-v2";

export const SCORE_CATEGORIES: ScoreCategory[] = [
  "directness",
  "persistence",
  "recovery",
  "exploration",
  "clarity",
  "resilience",
];

export const MASTERY_TIERS: MasteryTier[] = ["none", "bronze", "silver", "gold", "platinum"];

export const GRADES: Grade[] = ["S", "A", "B", "C", "D", "F"];

export const RANK_XP_THRESHOLDS: Record<Rank, number> = {
  novice: 0,
  apprentice: 500,
  practitioner: 1500,
  adept: 3500,
  expert: 7000,
  master: 12000,
  grandmaster: 20000,
};

export const MASTERY_TIER_RANK: Record<MasteryTier, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
};

export const GRADE_RANK: Record<Grade, number> = {
  S: 6,
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  F: 1,
};

export const GRADE_XP_BONUS: Record<Grade, number> = {
  S: 100,
  A: 75,
  B: 50,
  C: 25,
  D: 10,
  F: 0,
};

export const MASTERY_TIER_XP: Record<MasteryTier, number> = {
  none: 0,
  bronze: 100,
  silver: 200,
  gold: 350,
  platinum: 500,
};

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  completionBase: 50,
  categoryWeights: {
    directness: 1.0,
    persistence: 1.0,
    recovery: 1.0,
    exploration: 1.0,
    clarity: 1.0,
    resilience: 1.0,
  },
  positiveEndingBonus: 75,
  mixedEndingBonus: 25,
  negativeEndingBonus: 0,
  objectiveBonus: 50,
  routeDiscoveryBonus: 50,
  hiddenRouteBonus: 100,
  firstClearBonus: 100,
  gradeThresholds: {
    S: 95,
    A: 80,
    B: 65,
    C: 50,
    D: 35,
  },
  maxScoreEstimate: 300,
};

export const VISIBLE_LAUNCH_SYSTEMS = [
  "score",
  "grade",
  "stars",
  "objectives",
  "routes",
  "challenges",
  "mastery",
  "pack-progress",
  "replay",
] as const;

export const EXTENSIBLE_SYSTEMS = [
  "achievements",
  "collections",
  "streaks",
  "advanced-unlocks",
  "profile",
  "builds",
  "currencies",
  "llm-augmentation",
] as const;

export const UI_CONFIG = {
  maxVisibleRewardsOnEndScreen: 5,
  maxVisibleAchievementsOnEndScreen: 2,
  showAchievementsInline: false,
  showDetailedScoreBreakdown: false,
  collapseSecondaryProgressByDefault: true,
} as const;

/**
 * PMF TEST CONFIG
 * Change this to test which scenario opener performs better.
 * Options: "dining_hall" | "depression_morning_bed"
 */
export const FEATURED_SCENARIO_ID = "dining_hall";

/**
 * Related scenario framing for wedge-aware continuation.
 * Maps from current scenario domain to continuation framing.
 */
export const SCENARIO_DOMAINS: Record<string, { domain: string; wedgeLabel: string }> = {
  dining_hall: {
    domain: "social-approach",
    wedgeLabel: "social situations",
  },
  depression_morning_bed: {
    domain: "activation",
    wedgeLabel: "getting started",
  },
};

export function calculateRank(totalXP: number): Rank {
  if (totalXP >= 20000) return "grandmaster";
  if (totalXP >= 12000) return "master";
  if (totalXP >= 7000) return "expert";
  if (totalXP >= 3500) return "adept";
  if (totalXP >= 1500) return "practitioner";
  if (totalXP >= 500) return "apprentice";
  return "novice";
}

export function compareMastery(a: MasteryTier, b: MasteryTier): number {
  return MASTERY_TIER_RANK[a] - MASTERY_TIER_RANK[b];
}

export function compareGrade(a: Grade, b: Grade): number {
  return GRADE_RANK[a] - GRADE_RANK[b];
}

export function getBetterGrade(a: Grade, b: Grade): Grade {
  return compareGrade(a, b) >= 0 ? a : b;
}

export function getBetterMastery(a: MasteryTier, b: MasteryTier): MasteryTier {
  return compareMastery(a, b) >= 0 ? a : b;
}

export function calculateStars(
  baseStars: 0 | 1 | 2 | 3,
  requiredObjectives: string[],
  completedObjectives: string[]
): 0 | 1 | 2 | 3 {
  const allMet = requiredObjectives.every((id) => completedObjectives.includes(id));
  if (!allMet) {
    return Math.max(0, baseStars - 1) as 0 | 1 | 2 | 3;
  }
  return baseStars;
}

export function calculateGrade(percentOfMax: number, thresholds: { S: number; A: number; B: number; C: number; D: number }): Grade {
  if (percentOfMax >= thresholds.S) return "S";
  if (percentOfMax >= thresholds.A) return "A";
  if (percentOfMax >= thresholds.B) return "B";
  if (percentOfMax >= thresholds.C) return "C";
  if (percentOfMax >= thresholds.D) return "D";
  return "F";
}

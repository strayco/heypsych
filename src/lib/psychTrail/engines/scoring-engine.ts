import type { ScenarioV2, RunStateV2, ChoiceV2, EndingV2, ScoringConfig, ScoreCategory, Grade, RunScoreResult, BestRun } from "../types-v2";
import { SCORE_CATEGORIES, GRADE_RANK, calculateGrade } from "../constants";

export class ScoringEngine {
  private scenario: ScenarioV2;
  private config: ScoringConfig;

  constructor(scenario: ScenarioV2) {
    this.scenario = scenario;
    this.config = scenario.scoringConfig;
  }

  calculateRunScore(
    state: RunStateV2,
    ending: EndingV2,
    completedObjectiveIds: string[],
    isNewRoute: boolean,
    isHiddenRoute: boolean,
    isFirstClear: boolean
  ): RunScoreResult {
    const bonuses: { source: string; points: number; reason: string }[] = [];
    bonuses.push({ source: "completion", points: this.config.completionBase, reason: "Completed" });

    const categoryScores: Record<ScoreCategory, number> = { directness: 0, persistence: 0, recovery: 0, exploration: 0, clarity: 0, resilience: 0 };
    for (const cat of SCORE_CATEGORIES) categoryScores[cat] = state.categoryScores[cat] || 0;

    let weightedScore = 0;
    for (const cat of SCORE_CATEGORIES) weightedScore += categoryScores[cat] * (this.config.categoryWeights[cat] || 1);
    bonuses.push({ source: "categories", points: Math.round(weightedScore), reason: "Performance" });

    let endingBonus = ending.quality === "positive" ? this.config.positiveEndingBonus : ending.quality === "mixed" ? this.config.mixedEndingBonus : this.config.negativeEndingBonus;
    if (endingBonus > 0) bonuses.push({ source: "ending", points: endingBonus, reason: ending.quality });

    for (const objId of completedObjectiveIds) {
      const obj = this.scenario.objectives.find((o) => o.id === objId);
      if (obj && obj.reward.xpBonus > 0) bonuses.push({ source: `obj:${objId}`, points: obj.reward.xpBonus, reason: obj.title });
    }

    if (isNewRoute) {
      const routeBonus = isHiddenRoute ? this.config.hiddenRouteBonus : this.config.routeDiscoveryBonus;
      bonuses.push({ source: "route", points: routeBonus, reason: isHiddenRoute ? "Hidden route" : "New route" });
    }

    if (isFirstClear) bonuses.push({ source: "first", points: this.config.firstClearBonus, reason: "First clear" });

    const totalScore = bonuses.reduce((s, b) => s + b.points, 0);
    const percentOfMax = Math.min(100, (totalScore / this.config.maxScoreEstimate) * 100);
    const grade = calculateGrade(percentOfMax, this.config.gradeThresholds);

    return { totalScore, categoryScores, grade, percentOfMax, bonuses };
  }

  calculateChoiceScore(choice: ChoiceV2): Record<ScoreCategory, number> {
    const scores: Record<ScoreCategory, number> = { directness: 0, persistence: 0, recovery: 0, exploration: 0, clarity: 0, resilience: 0 };
    for (const e of choice.scoreEffects) scores[e.category] += e.points;
    return scores;
  }

  compareToPersonalBest(current: RunScoreResult, best: BestRun | null): { isPersonalBest: boolean; scoreDiff: number; gradeImproved: boolean } {
    if (!best) return { isPersonalBest: true, scoreDiff: current.totalScore, gradeImproved: true };
    return {
      isPersonalBest: current.totalScore > best.score,
      scoreDiff: current.totalScore - best.score,
      gradeImproved: GRADE_RANK[current.grade] > GRADE_RANK[best.grade],
    };
  }
}

export function applyChallengeMultiplier(baseXP: number, multiplier: number): number {
  return Math.round(baseXP * multiplier);
}

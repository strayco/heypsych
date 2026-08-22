import type { ScenarioV2, RunStateV2, EndingV2, RunScoreResult, ObjectiveResult, RouteDetectionResult, MasteryProgress, RewardGrant, Achievement, UnlockGrant, Challenge } from "../types-v2";
import { GRADE_XP_BONUS, MASTERY_TIER_XP } from "../constants";

export class RewardEngine {
  private scenario: ScenarioV2;

  constructor(scenario: ScenarioV2) {
    this.scenario = scenario;
  }

  calculate(
    state: RunStateV2,
    ending: EndingV2,
    score: RunScoreResult,
    objectives: ObjectiveResult[],
    route: RouteDetectionResult,
    mastery: MasteryProgress,
    achievements: Achievement[],
    unlocks: UnlockGrant[],
    challengeCompleted: boolean,
    challenge: Challenge | null,
    isFirst: boolean
  ): { rewards: RewardGrant[]; totalXP: number } {
    const rewards: RewardGrant[] = [];
    rewards.push({ type: "xp", source: "completion", value: ending.rewards.xpBase, description: "Completed" });

    const gradeBonus = GRADE_XP_BONUS[score.grade];
    if (gradeBonus > 0) rewards.push({ type: "xp", source: "grade", value: gradeBonus, description: `Grade ${score.grade}` });

    for (const r of objectives.filter((o) => o.completed)) {
      if (r.objective.reward.xpBonus > 0) rewards.push({ type: "xp", source: `obj:${r.objective.id}`, value: r.objective.reward.xpBonus, description: r.objective.title });
    }

    if (route.isNewDiscovery && route.xpBonus > 0) {
      rewards.push({ type: "xp", source: "route", value: route.xpBonus, description: route.isHidden ? `Hidden: ${route.routeName}` : `Route: ${route.routeName}` });
    }

    if (isFirst) rewards.push({ type: "xp", source: "first", value: this.scenario.scoringConfig.firstClearBonus, description: "First clear" });

    if (mastery.tierAdvanced) {
      rewards.push({ type: "mastery", source: "mastery", value: MASTERY_TIER_XP[mastery.currentTier], description: `${mastery.previousTier} → ${mastery.currentTier}` });
    }

    let totalXP = rewards.filter((r) => r.type === "xp" || r.type === "mastery").reduce((s, r) => s + (typeof r.value === "number" ? r.value : 0), 0);

    if (challengeCompleted && challenge) {
      const bonus = Math.round(totalXP * challenge.xpMultiplier) - totalXP;
      rewards.push({ type: "xp", source: "challenge", value: bonus, description: `${challenge.title} (${challenge.xpMultiplier}x)` });
      totalXP += bonus;
    }

    for (const a of achievements) {
      rewards.push({ type: "achievement", source: `ach:${a.id}`, value: a.id, description: a.title });
      if (a.xpReward > 0) {
        rewards.push({ type: "xp", source: `ach-xp:${a.id}`, value: a.xpReward, description: `Achievement: ${a.title}` });
        totalXP += a.xpReward;
      }
    }

    for (const u of unlocks) {
      rewards.push({ type: "unlock", source: `unlock:${u.type}:${u.id}`, value: u.id, description: `Unlocked: ${u.title}` });
    }

    return { rewards, totalXP };
  }
}

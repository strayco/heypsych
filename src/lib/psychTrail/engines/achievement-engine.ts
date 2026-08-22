import type { Achievement, AchievementCondition, ProgressState, MasteryTier, Grade, StructuredRunSummary } from "../types-v2";
import { ACHIEVEMENTS } from "../data/achievements";
import { MASTERY_TIER_RANK, GRADE_RANK } from "../constants";

export class AchievementEngine {
  private achievements: Achievement[];

  constructor(achievements: Achievement[] = ACHIEVEMENTS) {
    this.achievements = achievements;
  }

  getAll(): Achievement[] { return this.achievements; }
  get(id: string): Achievement | null { return this.achievements.find((a) => a.id === id) || null; }

  evaluateNew(summary: StructuredRunSummary, before: ProgressState, after: ProgressState): Achievement[] {
    const newlyUnlocked: Achievement[] = [];
    for (const a of this.achievements) {
      if (before.achievements.includes(a.id)) continue;
      if (this.evalCondition(a.condition, after, summary)) newlyUnlocked.push(a);
    }
    return newlyUnlocked;
  }

  evalCondition(c: AchievementCondition, p: ProgressState, s?: StructuredRunSummary): boolean {
    switch (c.type) {
      case "scenarios-completed": return p.global.totalScenariosCompleted >= c.count;
      case "scenario-completed": return (p.scenarios[c.scenarioId]?.completions ?? 0) > 0;
      case "stars-earned": return Object.values(p.scenarios).reduce((sum, x) => sum + (x.bestStars || 0), 0) >= c.count;
      case "three-stars": return c.scenarioId ? p.scenarios[c.scenarioId]?.bestStars === 3 : Object.values(p.scenarios).some((x) => x.bestStars === 3);
      case "routes-discovered": return p.global.totalRoutesDiscovered >= c.count;
      case "hidden-route-discovered": return s ? s.isHiddenRoute && s.isNewRoute : false;
      case "all-routes-scenario": return (p.routes[c.scenarioId]?.length ?? 0) >= 4;
      case "mastery-tier": return c.scenarioId
        ? MASTERY_TIER_RANK[p.scenarios[c.scenarioId]?.masteryTier ?? "none"] >= MASTERY_TIER_RANK[c.tier]
        : Object.values(p.scenarios).some((x) => MASTERY_TIER_RANK[x.masteryTier] >= MASTERY_TIER_RANK[c.tier]);
      case "mastery-count": return Object.values(p.scenarios).filter((x) => MASTERY_TIER_RANK[x.masteryTier] >= MASTERY_TIER_RANK[c.tier]).length >= c.count;
      case "challenge-completed": return c.challengeId
        ? Object.values(p.scenarios).some((x) => x.completedChallenges.includes(c.challengeId!))
        : Object.values(p.scenarios).some((x) => x.completedChallenges.length > 0);
      case "challenges-completed": return Object.values(p.scenarios).reduce((sum, x) => sum + x.completedChallenges.length, 0) >= c.count;
      case "grade-achieved": return s ? GRADE_RANK[s.grade] >= GRADE_RANK[c.grade] : Object.values(p.scenarios).some((x) => GRADE_RANK[x.bestGrade] >= GRADE_RANK[c.grade]);
      case "comeback": return s ? s.choiceSequence.some((x) => x.includes("try_again")) && s.endingQuality === "positive" : false;
      case "pack-completed": return (p.packs[c.packId]?.scenariosCompleted ?? 0) > 0;
      case "packs-completed": return p.global.totalPacksCompleted >= c.count;
      default: return false;
    }
  }

  getUnlocked(p: ProgressState): Achievement[] { return this.achievements.filter((a) => p.achievements.includes(a.id)); }
  getLocked(p: ProgressState): Achievement[] { return this.achievements.filter((a) => !p.achievements.includes(a.id)); }
}

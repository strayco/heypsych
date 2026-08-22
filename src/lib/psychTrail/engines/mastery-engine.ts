import type { ScenarioV2, MasteryTier, MasteryProgress, MasteryRequirement, Grade, ScenarioProgress } from "../types-v2";
import { MASTERY_TIER_RANK } from "../constants";

export class MasteryEngine {
  private scenario: ScenarioV2;

  constructor(scenario: ScenarioV2) {
    this.scenario = scenario;
  }

  calculateTier(progress: ScenarioProgress | null, routes: string[]): MasteryTier {
    if (!progress || progress.completions === 0) return "none";
    const rp = this.routePercent(routes);
    const po = this.primaryDone(progress.completedObjectives);
    const tp = this.totalPrimary();
    const ch = progress.completedChallenges.length;
    const tc = this.scenario.challenges.length;
    const st = progress.bestStars;
    const gr = progress.bestGrade;

    if (st === 3 && rp === 100 && po === tp && ch === tc && (gr === "S" || gr === "A")) return "platinum";
    if (st >= 3 && rp >= 75 && po >= Math.min(2, tp) && ch >= 1) return "gold";
    if (st >= 2 && rp >= 50 && po >= 1) return "silver";
    return "bronze";
  }

  getMasteryProgress(progress: ScenarioProgress | null, routes: string[], prev: MasteryTier): MasteryProgress {
    const cur = this.calculateTier(progress, routes);
    const rp = this.routePercent(routes);
    const po = progress ? this.primaryDone(progress.completedObjectives) : 0;
    const tp = this.totalPrimary();
    const ch = progress?.completedChallenges.length ?? 0;
    const tc = this.scenario.challenges.length;
    return {
      currentTier: cur,
      previousTier: prev,
      tierAdvanced: MASTERY_TIER_RANK[cur] > MASTERY_TIER_RANK[prev],
      routePercentage: rp,
      objectivesCompleted: po,
      objectivesTotal: tp,
      challengesCompleted: ch,
      challengesTotal: tc,
      bestStars: progress?.bestStars ?? 0,
      bestGrade: progress?.bestGrade ?? "F",
      nextTierRequirements: this.nextReqs(cur, progress, routes),
    };
  }

  private nextReqs(cur: MasteryTier, p: ScenarioProgress | null, routes: string[]): MasteryRequirement[] {
    const rp = this.routePercent(routes);
    const po = p ? this.primaryDone(p.completedObjectives) : 0;
    const tp = this.totalPrimary();
    const ch = p?.completedChallenges.length ?? 0;
    const tc = this.scenario.challenges.length;
    const st = p?.bestStars ?? 0;
    const gr = p?.bestGrade ?? "F";
    const reqs: MasteryRequirement[] = [];
    switch (cur) {
      case "none": reqs.push({ description: "Complete scenario", met: false }); break;
      case "bronze":
        reqs.push({ description: "Earn 2+ stars", met: st >= 2 });
        reqs.push({ description: "Discover 50% routes", met: rp >= 50 });
        reqs.push({ description: "Complete 1 primary objective", met: po >= 1 });
        break;
      case "silver":
        reqs.push({ description: "Earn 3 stars", met: st >= 3 });
        reqs.push({ description: "Discover 75% routes", met: rp >= 75 });
        reqs.push({ description: "Complete 2+ primary objectives", met: po >= Math.min(2, tp) });
        if (tc > 0) reqs.push({ description: "Complete 1 challenge", met: ch >= 1 });
        break;
      case "gold":
        reqs.push({ description: "Discover all routes", met: rp === 100 });
        reqs.push({ description: "Complete all primary objectives", met: po === tp });
        if (tc > 0) reqs.push({ description: "Complete all challenges", met: ch === tc });
        reqs.push({ description: "Achieve S or A grade", met: gr === "S" || gr === "A" });
        break;
    }
    return reqs;
  }

  private routePercent(routes: string[]): number {
    const t = this.scenario.routes.length;
    if (t === 0) return 100;
    return Math.round((routes.filter((id) => this.scenario.routes.some((r) => r.id === id)).length / t) * 100);
  }

  private primaryDone(completed: string[]): number {
    return this.scenario.objectives.filter((o) => o.type === "primary" && completed.includes(o.id)).length;
  }

  private totalPrimary(): number {
    return this.scenario.objectives.filter((o) => o.type === "primary").length;
  }
}

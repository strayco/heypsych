import type { UnlockRequirement, UnlockGrant, ProgressState, MasteryTier, Pack, ScenarioV2 } from "../types-v2";
import { MASTERY_TIER_RANK } from "../constants";

export class UnlockEngine {
  evalReq(r: UnlockRequirement, p: ProgressState): boolean {
    switch (r.type) {
      case "always": return true;
      case "scenario-complete": return (p.scenarios[r.scenarioId]?.completions ?? 0) > 0;
      case "scenario-mastery": return MASTERY_TIER_RANK[p.scenarios[r.scenarioId]?.masteryTier ?? "none"] >= MASTERY_TIER_RANK[r.minTier];
      case "pack-complete": return (p.packs[r.packId]?.scenariosCompleted ?? 0) > 0;
      case "pack-mastery": return MASTERY_TIER_RANK[p.packs[r.packId]?.masteryTier ?? "none"] >= MASTERY_TIER_RANK[r.minTier];
      case "total-stars": return Object.values(p.scenarios).reduce((s, x) => s + (x.bestStars || 0), 0) >= r.count;
      case "total-scenarios": return p.global.totalScenariosCompleted >= r.count;
      case "achievement": return p.achievements.includes(r.achievementId);
      case "all-of": return r.requirements.every((x) => this.evalReq(x, p));
      case "any-of": return r.requirements.some((x) => this.evalReq(x, p));
      default: return false;
    }
  }

  isScenarioUnlocked(s: ScenarioV2, p: ProgressState): boolean {
    return s.unlockRequirements.length === 0 || s.unlockRequirements.every((r) => this.evalReq(r, p));
  }

  isPackUnlocked(pack: Pack, p: ProgressState): boolean {
    return pack.unlockRequirements.length === 0 || pack.unlockRequirements.every((r) => this.evalReq(r, p));
  }

  evaluateNewUnlocks(before: ProgressState, after: ProgressState, scenarios: ScenarioV2[], packs: Pack[]): UnlockGrant[] {
    const grants: UnlockGrant[] = [];
    for (const s of scenarios) {
      if (!this.isScenarioUnlocked(s, before) && this.isScenarioUnlocked(s, after)) {
        grants.push({ type: "scenario", id: s.id, title: s.title });
      }
    }
    for (const pk of packs) {
      if (!this.isPackUnlocked(pk, before) && this.isPackUnlocked(pk, after)) {
        grants.push({ type: "pack", id: pk.id, title: pk.title });
      }
    }
    return grants;
  }
}

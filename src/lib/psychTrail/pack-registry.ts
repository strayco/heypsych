import type { Pack, ScenarioV2, ProgressState, PackProgress, MasteryTier } from "./types-v2";
import { MASTERY_TIER_RANK } from "./constants";
import { UnlockEngine } from "./engines/unlock-engine";

import socialAnxietyFundamentals from "./data/packs/social-anxiety-fundamentals.json";
import activationFundamentals from "./data/packs/activation-fundamentals.json";
import diningHall from "./scenarios-compiled/dining-hall.json";
import depressionMorningBed from "./scenarios-compiled/depression-morning-bed.json";

const PACKS_DATA: Record<string, Pack> = {
  "social-anxiety-fundamentals": socialAnxietyFundamentals as unknown as Pack,
  "activation-fundamentals": activationFundamentals as unknown as Pack,
};

const SCENARIOS_DATA: Record<string, ScenarioV2> = {
  dining_hall: diningHall as unknown as ScenarioV2,
  depression_morning_bed: depressionMorningBed as unknown as ScenarioV2,
};

export class PackRegistry {
  private packs: Map<string, Pack> = new Map();
  private scenarios: Map<string, ScenarioV2> = new Map();
  private unlocks: UnlockEngine = new UnlockEngine();

  constructor() {
    for (const [id, pack] of Object.entries(PACKS_DATA)) {
      this.packs.set(id, pack);
    }
    for (const [id, scenario] of Object.entries(SCENARIOS_DATA)) {
      this.scenarios.set(id, scenario);
    }
  }

  getAllPacks(): Pack[] {
    return Array.from(this.packs.values());
  }

  getPack(id: string): Pack | null {
    return this.packs.get(id) || null;
  }

  getAllScenarios(): ScenarioV2[] {
    return Array.from(this.scenarios.values());
  }

  getScenario(id: string): ScenarioV2 | null {
    return this.scenarios.get(id) || null;
  }

  getScenariosForPack(packId: string): ScenarioV2[] {
    const pack = this.packs.get(packId);
    if (!pack) return [];
    return pack.scenarioIds.map((id) => this.scenarios.get(id)).filter((s): s is ScenarioV2 => !!s);
  }

  getPacksForScenario(scenarioId: string): Pack[] {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return [];
    return scenario.packIds.map((id) => this.packs.get(id)).filter((p): p is Pack => !!p);
  }

  isPackUnlocked(packId: string, progress: ProgressState): boolean {
    const pack = this.packs.get(packId);
    return pack ? this.unlocks.isPackUnlocked(pack, progress) : false;
  }

  isScenarioUnlocked(scenarioId: string, progress: ProgressState): boolean {
    const scenario = this.scenarios.get(scenarioId);
    return scenario ? this.unlocks.isScenarioUnlocked(scenario, progress) : false;
  }

  getPackProgress(packId: string, progress: ProgressState): PackProgress {
    const pack = this.packs.get(packId);
    if (!pack) return { scenariosCompleted: 0, totalStars: 0, masteryTier: "none", firstCompletedAt: null };

    let completed = 0;
    let stars = 0;
    let lowest: MasteryTier = "platinum";

    for (const sid of pack.scenarioIds) {
      const sp = progress.scenarios[sid];
      if (sp && sp.completions > 0) {
        completed++;
        stars += sp.bestStars;
        if (MASTERY_TIER_RANK[sp.masteryTier] < MASTERY_TIER_RANK[lowest]) lowest = sp.masteryTier;
      }
    }

    if (completed === 0) lowest = "none";

    return {
      scenariosCompleted: completed,
      totalStars: stars,
      masteryTier: lowest,
      firstCompletedAt: completed === pack.scenarioIds.length ? Date.now() : null,
    };
  }

  getUnlockedPacks(progress: ProgressState): Pack[] {
    return this.getAllPacks().filter((p) => this.isPackUnlocked(p.id, progress));
  }

  getLockedPacks(progress: ProgressState): Pack[] {
    return this.getAllPacks().filter((p) => !this.isPackUnlocked(p.id, progress));
  }

  getUnlockedScenarios(progress: ProgressState): ScenarioV2[] {
    return this.getAllScenarios().filter((s) => this.isScenarioUnlocked(s.id, progress));
  }

  registerPack(pack: Pack): void {
    this.packs.set(pack.id, pack);
  }

  registerScenario(scenario: ScenarioV2): void {
    this.scenarios.set(scenario.id, scenario);
  }
}

let registry: PackRegistry | null = null;

export function getPackRegistry(): PackRegistry {
  if (!registry) registry = new PackRegistry();
  return registry;
}

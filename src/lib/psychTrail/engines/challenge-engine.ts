import type { ScenarioV2, RunStateV2, Challenge, ChoiceV2, Grade, UnlockRequirement, ProgressState, MasteryTier } from "../types-v2";
import { MASTERY_TIER_RANK, GRADE_RANK } from "../constants";

export interface ChallengeValidationResult {
  valid: boolean;
  violations: { type: string; desc: string }[];
}

export class ChallengeEngine {
  private scenario: ScenarioV2;

  constructor(scenario: ScenarioV2) {
    this.scenario = scenario;
  }

  getAll(): Challenge[] { return this.scenario.challenges; }
  get(id: string): Challenge | null { return this.scenario.challenges.find((c) => c.id === id) || null; }

  isUnlocked(id: string, progress: ProgressState): boolean {
    const ch = this.get(id);
    return ch ? this.evalReqs(ch.unlockRequirements, progress) : false;
  }

  private evalReqs(reqs: UnlockRequirement[], p: ProgressState): boolean {
    if (reqs.length === 0) return true;
    return reqs.every((r) => this.evalReq(r, p));
  }

  private evalReq(r: UnlockRequirement, p: ProgressState): boolean {
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

  getUnlocked(p: ProgressState): Challenge[] { return this.scenario.challenges.filter((c) => this.isUnlocked(c.id, p)); }
  getLocked(p: ProgressState): Challenge[] { return this.scenario.challenges.filter((c) => !this.isUnlocked(c.id, p)); }

  isChoiceAllowed(choice: ChoiceV2, ch: Challenge): boolean {
    for (const m of ch.modifiers) {
      if (m.type === "forbid-choices" && m.choiceIds.includes(choice.id)) return false;
      if (m.type === "forbid-style" && m.styles.includes(choice.style)) return false;
    }
    return true;
  }

  getForbiddenChoiceIds(ch: Challenge): string[] {
    const ids: string[] = [];
    for (const m of ch.modifiers) if (m.type === "forbid-choices") ids.push(...m.choiceIds);
    return ids;
  }

  validate(state: RunStateV2, ch: Challenge, grade: Grade): ChallengeValidationResult {
    const violations: { type: string; desc: string }[] = [];
    for (const m of ch.modifiers) {
      if (m.type === "forbid-choices") {
        const used = state.choiceSequence.filter((c) => m.choiceIds.includes(c));
        if (used.length) violations.push({ type: "forbid-choices", desc: `Used: ${used.join(", ")}` });
      }
      if (m.type === "forbid-style") {
        const bad = state.choiceSequence.some((cid) => {
          const c = this.scenario.choices.find((x) => x.id === cid);
          return c && m.styles.includes(c.style);
        });
        if (bad) violations.push({ type: "forbid-style", desc: `Used forbidden style` });
      }
      if (m.type === "require-ending-grade" && GRADE_RANK[grade] < GRADE_RANK[m.minGrade]) {
        violations.push({ type: "require-ending-grade", desc: `Required ${m.minGrade}, got ${grade}` });
      }
      if (m.type === "max-steps" && state.currentStep > m.steps) {
        violations.push({ type: "max-steps", desc: `${state.currentStep} > ${m.steps}` });
      }
    }
    return { valid: violations.length === 0, violations };
  }
}

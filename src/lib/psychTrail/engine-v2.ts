import type { ScenarioV2, RunStateV2, TurnInputV2, TurnResultV2, ConditionV2, EffectV2, ChoiceV2, NodeV2, GameEventV2, EndingV2, Challenge, ScoreCategory, ObjectiveUpdate, HistoryEntryV2 } from "./types-v2";
import { SeededRNG, generateSeed } from "./rng";
import { SCORE_CATEGORIES } from "./constants";

export class PsychTrailEngineV2 {
  private scenario: ScenarioV2;
  private rng: SeededRNG;
  private challenge: Challenge | null = null;

  constructor(scenario: ScenarioV2, seed?: number) {
    this.scenario = scenario;
    this.rng = new SeededRNG(seed ?? generateSeed());
  }

  createInitialState(seed?: number, challengeId?: string): RunStateV2 {
    const s = seed ?? generateSeed();
    this.rng = new SeededRNG(s);
    if (challengeId) this.challenge = this.scenario.challenges.find((c) => c.id === challengeId) || null;
    const cats: Record<ScoreCategory, number> = { directness: 0, persistence: 0, recovery: 0, exploration: 0, clarity: 0, resilience: 0 };
    return {
      scenarioId: this.scenario.id,
      currentStep: 0,
      currentNodeId: this.scenario.startNodeId,
      metrics: { ...this.scenario.initialMetrics },
      flags: { ...this.scenario.initialFlags },
      inventory: {},
      history: [],
      seed: s,
      isEnded: false,
      endingId: null,
      challengeId: challengeId || null,
      categoryScores: cats,
      choiceSequence: [],
      nodeSequence: [this.scenario.startNodeId],
    };
  }

  getCurrentNode(state: RunStateV2): NodeV2 | undefined {
    return this.scenario.nodes.find((n) => n.id === state.currentNodeId);
  }

  getAvailableChoices(state: RunStateV2): ChoiceV2[] {
    const node = this.getCurrentNode(state);
    if (!node) return [];
    return node.choiceIds
      .map((cid) => this.scenario.choices.find((c) => c.id === cid))
      .filter((c): c is ChoiceV2 => !!c)
      .filter((c) => {
        if (c.condition && !this.evalCond(c.condition, state)) return false;
        if (this.challenge) {
          for (const m of this.challenge.modifiers) {
            if (m.type === "forbid-choices" && m.choiceIds.includes(c.id)) return false;
            if (m.type === "forbid-style" && m.styles.includes(c.style)) return false;
          }
        }
        return true;
      });
  }

  processTurn(state: RunStateV2, input: TurnInputV2): TurnResultV2 {
    if (state.isEnded) throw new Error("Run ended");
    const choice = this.scenario.choices.find((c) => c.id === input.choiceId);
    if (!choice) throw new Error("Invalid choice");
    const avail = this.getAvailableChoices(state);
    if (!avail.find((c) => c.id === input.choiceId)) throw new Error("Choice unavailable");

    let ns: RunStateV2 = {
      ...state,
      metrics: { ...state.metrics },
      flags: { ...state.flags },
      inventory: { ...state.inventory },
      history: [...state.history],
      categoryScores: { ...state.categoryScores },
      choiceSequence: [...state.choiceSequence, choice.id],
      nodeSequence: [...state.nodeSequence],
    };

    ns = this.applyEffects(ns, choice.effects);

    const scoreGained: Record<ScoreCategory, number> = { directness: 0, persistence: 0, recovery: 0, exploration: 0, clarity: 0, resilience: 0 };
    for (const e of choice.scoreEffects) {
      scoreGained[e.category] += e.points;
      ns.categoryScores[e.category] += e.points;
    }

    const objUpdates: ObjectiveUpdate[] = choice.objectiveEffects.map((e) => ({
      objectiveId: e.objectiveId,
      action: e.action,
      newStatus: e.action === "complete" ? "completed" : e.action === "fail" ? "failed" : "pending",
    }));
    for (const e of choice.objectiveEffects) ns.flags[`objective_${e.objectiveId}_${e.action}`] = true;

    if (choice.advancesTime !== false) ns.currentStep++;

    if (ns.isEnded) {
      if (choice.nextNodeId) {
        ns.currentNodeId = choice.nextNodeId;
        ns.nodeSequence.push(choice.nextNodeId);
      }
      ns.history.push(this.historyEntry(ns, choice.id, []));
      return { newState: ns, triggeredEvents: [], choice, scoreGained, objectiveUpdates: objUpdates };
    }

    const events = this.rollEvents(ns);
    for (const ev of events) {
      ns = this.applyEffects(ns, ev.effects);
      if (ns.isEnded) break;
    }

    if (choice.nextNodeId) {
      ns.currentNodeId = choice.nextNodeId;
      ns.nodeSequence.push(choice.nextNodeId);
    }

    ns.history.push(this.historyEntry(ns, choice.id, events.map((e) => e.id)));
    return { newState: ns, triggeredEvents: events, choice, scoreGained, objectiveUpdates: objUpdates };
  }

  private historyEntry(s: RunStateV2, choiceId: string, events: string[]): HistoryEntryV2 {
    return { step: s.currentStep, nodeId: s.currentNodeId, choiceId, events, metricsSnapshot: { ...s.metrics }, scoreSnapshot: { ...s.categoryScores } };
  }

  private evalCond(c: ConditionV2, s: RunStateV2): boolean {
    switch (c.type) {
      case "flag": return s.flags[c.flag!] === c.value;
      case "metric": return this.cmp(s.metrics[c.metric!] ?? 0, c.operator!, c.value as number);
      case "inventory": return this.cmp(s.inventory[c.item!] ?? 0, c.operator!, c.value as number);
      case "step": return this.cmp(s.currentStep, c.operator!, c.value as number);
      case "and": return c.conditions!.every((x) => this.evalCond(x, s));
      case "or": return c.conditions!.some((x) => this.evalCond(x, s));
      case "not": return !this.evalCond(c.condition!, s);
      default: return true;
    }
  }

  private cmp(a: number, op: string, b: number): boolean {
    switch (op) {
      case ">": return a > b;
      case "<": return a < b;
      case ">=": return a >= b;
      case "<=": return a <= b;
      case "==": return a === b;
      default: return false;
    }
  }

  private applyEffects(s: RunStateV2, effects: EffectV2[]): RunStateV2 {
    for (const e of effects) {
      switch (e.type) {
        case "metric": {
          const m = this.scenario.uiConfig.metrics.find((x) => x.key === e.metric);
          const min = m?.min ?? 0, max = m?.max ?? 100;
          s.metrics[e.metric!] = Math.max(min, Math.min(max, (s.metrics[e.metric!] ?? min) + e.change!));
          break;
        }
        case "metric-set": {
          const m = this.scenario.uiConfig.metrics.find((x) => x.key === e.metric);
          s.metrics[e.metric!] = Math.max(m?.min ?? 0, Math.min(m?.max ?? 100, e.value as number));
          break;
        }
        case "flag": s.flags[e.flag!] = e.value as boolean; break;
        case "inventory": s.inventory[e.item!] = Math.max(0, (s.inventory[e.item!] ?? 0) + e.change!); break;
        case "inventory-set": s.inventory[e.item!] = Math.max(0, e.value as number); break;
        case "end": s.isEnded = true; s.endingId = e.endingId!; break;
      }
    }
    return s;
  }

  private rollEvents(s: RunStateV2): GameEventV2[] {
    const out: GameEventV2[] = [];
    for (const ev of this.scenario.events) {
      if (ev.condition && !this.evalCond(ev.condition, s)) continue;
      if (this.rng.chance(ev.probability)) out.push(ev);
    }
    return out;
  }

  getEnding(id: string): EndingV2 | undefined {
    return this.scenario.endings.find((e) => e.id === id);
  }

  getScenario(): ScenarioV2 { return this.scenario; }
  getActiveChallenge(): Challenge | null { return this.challenge; }

  isMaxSteps(s: RunStateV2): boolean {
    if (this.challenge) {
      for (const m of this.challenge.modifiers) {
        if (m.type === "max-steps" && s.currentStep >= m.steps) return true;
      }
    }
    return s.currentStep >= this.scenario.timeConfig.maxSteps;
  }
}

export function createEngine(scenario: ScenarioV2, seed?: number): PsychTrailEngineV2 {
  return new PsychTrailEngineV2(scenario, seed);
}

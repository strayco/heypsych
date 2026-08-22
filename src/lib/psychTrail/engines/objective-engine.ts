import type { ScenarioV2, RunStateV2, Objective, ObjectiveCondition, ObjectiveResult, ComparisonOperator } from "../types-v2";

export class ObjectiveEngine {
  private scenario: ScenarioV2;

  constructor(scenario: ScenarioV2) {
    this.scenario = scenario;
  }

  evaluateAllObjectives(state: RunStateV2): ObjectiveResult[] {
    return this.scenario.objectives.map((o) => ({
      objective: o,
      completed: this.evaluateObjective(o, state),
      revealed: o.type !== "hidden" || this.evaluateObjective(o, state),
    }));
  }

  evaluateObjective(objective: Objective, state: RunStateV2): boolean {
    return this.evalCondition(objective.condition, state);
  }

  private evalCondition(c: ObjectiveCondition, state: RunStateV2): boolean {
    switch (c.type) {
      case "reach-ending": return state.endingId === c.endingId;
      case "reach-ending-quality": return this.scenario.endings.find((e) => e.id === state.endingId)?.quality === c.quality;
      case "reach-node": return state.nodeSequence.includes(c.nodeId);
      case "choice-made": return state.choiceSequence.includes(c.choiceId);
      case "choice-avoided": return !state.choiceSequence.includes(c.choiceId);
      case "flag-set": return state.flags[c.flag] === c.value;
      case "metric-threshold": return this.cmp(state.metrics[c.metric] ?? 0, c.operator, c.value);
      case "steps-under": return state.currentStep <= c.maxSteps;
      case "route-taken": {
        const r = this.scenario.routes.find((r) => r.id === c.routeId);
        if (!r) return false;
        return this.matchRoute(r.identifiedBy, state);
      }
      case "all-of": return c.conditions.every((sub) => this.evalCondition(sub, state));
      case "any-of": return c.conditions.some((sub) => this.evalCondition(sub, state));
      case "none-of": return !c.conditions.some((sub) => this.evalCondition(sub, state));
      default: return false;
    }
  }

  private cmp(a: number, op: ComparisonOperator, b: number): boolean {
    switch (op) {
      case ">": return a > b;
      case "<": return a < b;
      case ">=": return a >= b;
      case "<=": return a <= b;
      case "==": return a === b;
    }
  }

  private matchRoute(id: any, state: RunStateV2): boolean {
    switch (id.type) {
      case "ending": return state.endingId === id.endingId;
      case "choice-includes": return state.choiceSequence.includes(id.choiceId);
      case "flag-combination": return Object.entries(id.flags as Record<string, boolean>).every(([k, v]) => state.flags[k] === v);
      default: return true;
    }
  }

  getPreRunObjectives(): Objective[] { return this.scenario.objectives.filter((o) => o.showPreRun); }
  getInRunObjectives(): Objective[] { return this.scenario.objectives.filter((o) => o.showInRun); }
  getCompletedIds(results: ObjectiveResult[]): string[] { return results.filter((r) => r.completed).map((r) => r.objective.id); }
}

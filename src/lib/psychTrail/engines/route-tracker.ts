import type { ScenarioV2, RunStateV2, RouteDefinition, RouteIdentifier, RouteDetectionResult } from "../types-v2";

export class RouteTracker {
  private scenario: ScenarioV2;

  constructor(scenario: ScenarioV2) {
    this.scenario = scenario;
  }

  detectRoute(state: RunStateV2): RouteDefinition | null {
    for (const r of this.scenario.routes) {
      if (this.matches(state, r.identifiedBy)) return r;
    }
    return null;
  }

  private matches(state: RunStateV2, id: RouteIdentifier): boolean {
    switch (id.type) {
      case "ending": return state.endingId === id.endingId;
      case "choice-sequence": return this.hasSeq(state.choiceSequence, id.choiceIds);
      case "choice-includes": return state.choiceSequence.includes(id.choiceId);
      case "node-sequence": return this.hasSeq(state.nodeSequence, id.nodeIds);
      case "flag-combination": return Object.entries(id.flags).every(([k, v]) => state.flags[k] === v);
      default: return false;
    }
  }

  private hasSeq(arr: string[], seq: string[]): boolean {
    let i = 0;
    for (const x of arr) { if (x === seq[i]) i++; if (i === seq.length) return true; }
    return i === seq.length;
  }

  processRouteDiscovery(state: RunStateV2, discovered: string[]): RouteDetectionResult {
    const r = this.detectRoute(state);
    if (!r) return { routeId: null, routeName: null, isNewDiscovery: false, isHidden: false, xpBonus: 0 };
    const isNew = !discovered.includes(r.id);
    return { routeId: r.id, routeName: r.name, isNewDiscovery: isNew, isHidden: r.isHidden, xpBonus: isNew ? r.discoveryReward.xpBonus : 0 };
  }

  getDiscoveryPercentage(discovered: string[]): number {
    if (this.scenario.routes.length === 0) return 100;
    return Math.round((discovered.filter((id) => this.scenario.routes.some((r) => r.id === id)).length / this.scenario.routes.length) * 100);
  }

  getHiddenRouteCount(): number { return this.scenario.routes.filter((r) => r.isHidden).length; }
  getNextHint(discovered: string[]): string | null {
    const r = this.scenario.routes.find((r) => !discovered.includes(r.id) && r.discoveryHint);
    return r?.discoveryHint || null;
  }
}

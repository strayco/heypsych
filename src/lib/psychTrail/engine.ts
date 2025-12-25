/**
 * Psych Trail - Simulation Engine
 *
 * Domain-neutral, pure TypeScript engine for turn-based simulation.
 * No React, no UI logic, no clinical assumptions - just state + transitions.
 */

import type {
  Scenario,
  RunState,
  TurnInput,
  TurnResult,
  Condition,
  Effect,
  GameEvent,
  Choice,
  Node,
  Inventory,
} from "./types";
import { SeededRNG, generateSeed } from "./rng";

// ============================================================================
// Engine Class (Domain-Neutral)
// ============================================================================

export class PsychTrailEngine {
  private scenario: Scenario;
  private rng: SeededRNG;

  constructor(scenario: Scenario, seed?: number) {
    this.scenario = scenario;
    this.rng = new SeededRNG(seed ?? generateSeed());
  }

  /**
   * Create a new run state at the beginning of the scenario
   */
  createInitialState(seed?: number): RunState {
    const actualSeed = seed ?? generateSeed();
    this.rng = new SeededRNG(actualSeed);

    return {
      currentStep: 0,
      currentNodeId: this.scenario.startNodeId,
      metrics: { ...this.scenario.initialMetrics },
      flags: { ...this.scenario.initialFlags },
      inventory: this.scenario.initialInventory ? { ...this.scenario.initialInventory } : undefined,
      history: [],
      seed: actualSeed,
      isEnded: false,
    };
  }

  /**
   * Get the current node from state
   */
  getCurrentNode(state: RunState): Node | undefined {
    return this.scenario.nodes.find((n) => n.id === state.currentNodeId);
  }

  /**
   * Get available choices at current node (filtered by conditions)
   */
  getAvailableChoices(state: RunState): Choice[] {
    const node = this.getCurrentNode(state);
    if (!node) return [];

    return node.choiceIds
      .map((cid) => this.scenario.choices.find((c) => c.id === cid))
      .filter((c): c is Choice => c !== undefined)
      .filter((choice) => {
        if (!choice.condition) return true;
        return this.evaluateCondition(choice.condition, state);
      });
  }

  /**
   * Process a turn: apply choice → advance time → roll events → return new state
   */
  processTurn(state: RunState, input: TurnInput): TurnResult {
    if (state.isEnded) {
      throw new Error("Cannot process turn: run has ended");
    }

    // Find the choice
    const choice = this.scenario.choices.find((c) => c.id === input.choiceId);
    if (!choice) {
      throw new Error(`Invalid choice ID: ${input.choiceId}`);
    }

    // Verify choice is available
    const availableChoices = this.getAvailableChoices(state);
    if (!availableChoices.find((c) => c.id === input.choiceId)) {
      throw new Error(`Choice "${input.choiceId}" is not available at current node`);
    }

    // Clone state for mutation
    let newState: RunState = {
      ...state,
      metrics: { ...state.metrics },
      flags: { ...state.flags },
      inventory: state.inventory ? { ...state.inventory } : undefined,
      history: [...state.history],
    };

    // Apply choice effects
    newState = this.applyEffects(newState, choice.effects);

    // Advance time (if choice specifies it, default true)
    // Do this BEFORE checking if game ended so ending choices get correct step number
    const advancesTime = choice.advancesTime ?? true;
    if (advancesTime) {
      newState.currentStep += 1;
    }

    // Check if choice ended the game
    if (newState.isEnded) {
      // Add to history and return early
      newState.history.push({
        step: newState.currentStep,
        nodeId: newState.currentNodeId,
        choiceId: choice.id,
        events: [],
        metricsSnapshot: { ...newState.metrics },
        inventorySnapshot: newState.inventory ? { ...newState.inventory } : undefined,
      });
      newState.currentNodeId = choice.nextNodeId;
      return { newState, triggeredEvents: [], choice };
    }

    // Roll for random events
    const triggeredEvents = this.rollEvents(newState);

    // Apply event effects
    for (const event of triggeredEvents) {
      newState = this.applyEffects(newState, event.effects);
      // If an event ended the game, stop processing
      if (newState.isEnded) break;
    }

    // Move to next node
    newState.currentNodeId = choice.nextNodeId;

    // Add history entry
    newState.history.push({
      step: newState.currentStep,
      nodeId: newState.currentNodeId,
      choiceId: choice.id,
      events: triggeredEvents.map((e) => e.id),
      metricsSnapshot: { ...newState.metrics },
      inventorySnapshot: newState.inventory ? { ...newState.inventory } : undefined,
    });

    return { newState, triggeredEvents, choice };
  }

  /**
   * Evaluate a condition against current state (domain-neutral)
   */
  private evaluateCondition(condition: Condition, state: RunState): boolean {
    switch (condition.type) {
      case "flag":
        return state.flags[condition.flag] === condition.value;

      case "metric": {
        const value = state.metrics[condition.metric] ?? 0;
        return this.compareNumbers(value, condition.operator, condition.value);
      }

      case "inventory": {
        const value = state.inventory?.[condition.item] ?? 0;
        return this.compareNumbers(value, condition.operator, condition.value);
      }

      case "step": {
        return this.compareNumbers(state.currentStep, condition.operator, condition.value);
      }

      case "and":
        return condition.conditions.every((c) => this.evaluateCondition(c, state));

      case "or":
        return condition.conditions.some((c) => this.evaluateCondition(c, state));

      case "not":
        return !this.evaluateCondition(condition.condition, state);
    }
  }

  /**
   * Compare two numbers with an operator
   */
  private compareNumbers(a: number, operator: ">" | "<" | ">=" | "<=" | "==", b: number): boolean {
    switch (operator) {
      case ">":
        return a > b;
      case "<":
        return a < b;
      case ">=":
        return a >= b;
      case "<=":
        return a <= b;
      case "==":
        return a === b;
    }
  }

  /**
   * Apply effects to state (domain-neutral, mutates state object)
   */
  private applyEffects(state: RunState, effects: Effect[]): RunState {
    for (const effect of effects) {
      switch (effect.type) {
        case "metric": {
          // Get metric bounds from UI config (if available)
          const metricDef = this.scenario.uiConfig.metrics.find((m) => m.key === effect.metric);
          const min = metricDef?.min ?? 0;
          const max = metricDef?.max ?? 100;
          const current = state.metrics[effect.metric] ?? min;
          state.metrics[effect.metric] = Math.max(min, Math.min(max, current + effect.change));
          break;
        }

        case "metric-set": {
          // Set metric to exact value (respecting bounds)
          const metricDef = this.scenario.uiConfig.metrics.find((m) => m.key === effect.metric);
          const min = metricDef?.min ?? 0;
          const max = metricDef?.max ?? 100;
          state.metrics[effect.metric] = Math.max(min, Math.min(max, effect.value));
          break;
        }

        case "flag":
          state.flags[effect.flag] = effect.value;
          break;

        case "inventory": {
          // Initialize inventory if not present
          if (!state.inventory) state.inventory = {};
          const current = state.inventory[effect.item] ?? 0;
          state.inventory[effect.item] = Math.max(0, current + effect.change);
          break;
        }

        case "inventory-set": {
          // Set inventory to exact value
          if (!state.inventory) state.inventory = {};
          state.inventory[effect.item] = Math.max(0, effect.value);
          break;
        }

        case "end":
          state.isEnded = true;
          state.endingId = effect.endingId;
          break;
      }
    }
    return state;
  }

  /**
   * Roll for random events based on probabilities and conditions
   */
  private rollEvents(state: RunState): GameEvent[] {
    const triggered: GameEvent[] = [];

    for (const event of this.scenario.events) {
      // Check condition (if any)
      if (event.condition && !this.evaluateCondition(event.condition, state)) {
        continue;
      }

      // Roll for probability
      if (this.rng.chance(event.probability)) {
        triggered.push(event);
      }
    }

    return triggered;
  }

  /**
   * Get an ending by ID
   */
  getEnding(endingId: string) {
    return this.scenario.endings.find((e) => e.id === endingId);
  }

  /**
   * Get the scenario (for UI config, metadata, etc.)
   */
  getScenario(): Scenario {
    return this.scenario;
  }
}

// ============================================================================
// Helper Functions (Domain-Neutral)
// ============================================================================

/**
 * Clamp a value to valid range
 */
export function clampValue(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if a state is valid (basic sanity check)
 */
export function isValidState(state: RunState): boolean {
  return state.currentStep >= 0;
}

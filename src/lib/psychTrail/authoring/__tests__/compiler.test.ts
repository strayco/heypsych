import { describe, it, expect } from "vitest";
import { loadScenarioSource, compileScenario, convertLegacyToSource } from "../index";
import { validateScenarioSource } from "../validator";
import type { ScenarioSource, NodesModule, ChoicesModule } from "../types";
import * as path from "path";
import * as fs from "fs";

const SCENARIOS_DIR = path.join(__dirname, "../scenarios");
const DINING_HALL_DIR = path.join(SCENARIOS_DIR, "dining-hall");

describe("Scenario Validator", () => {
  it("validates a well-formed scenario source", () => {
    const { source } = loadScenarioSource(DINING_HALL_DIR);
    const result = validateScenarioSource(source);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.stats.nodeCount).toBeGreaterThan(0);
    expect(result.stats.choiceCount).toBeGreaterThan(0);
    expect(result.stats.endingCount).toBeGreaterThan(0);
  });

  it("detects invalid node references in choices", () => {
    const source: ScenarioSource = createMinimalSource();
    source.choices.choices[0].nextNodeId = "nonexistent_node";
    
    const result = validateScenarioSource(source);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes("nonexistent_node"))).toBe(true);
  });

  it("detects invalid ending references", () => {
    const source: ScenarioSource = createMinimalSource();
    source.choices.choices[0].effects.push({ type: "end", endingId: "fake_ending" });
    source.choices.choices[0].nextNodeId = null;
    
    const result = validateScenarioSource(source);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes("fake_ending"))).toBe(true);
  });

  it("detects invalid choice references in nodes", () => {
    const source: ScenarioSource = createMinimalSource();
    source.nodes.nodes[0].choiceIds.push("ghost_choice");
    
    const result = validateScenarioSource(source);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes("ghost_choice"))).toBe(true);
  });

  it("detects invalid objective references", () => {
    const source: ScenarioSource = createMinimalSource();
    source.choices.choices[0].objectiveEffects = [{ objectiveId: "missing_obj", action: "complete" }];
    
    const result = validateScenarioSource(source);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes("missing_obj"))).toBe(true);
  });

  it("detects invalid route references in challenges", () => {
    const source: ScenarioSource = createMinimalSource();
    source.challenges.challenges.push({
      id: "bad_challenge",
      title: "Bad Challenge",
      description: "Test",
      unlockRequirements: [{ type: "always" }],
      modifiers: [{ type: "require-route", routeId: "missing_route" }],
      xpMultiplier: 1.5,
      masteryCredit: "silver",
    });
    
    const result = validateScenarioSource(source);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes("missing_route"))).toBe(true);
  });

  it("warns about orphaned nodes", () => {
    const source: ScenarioSource = createMinimalSource();
    source.nodes.nodes.push({
      id: "orphan_node",
      text: "Nobody points to me",
      choiceIds: ["end_choice"],
      presentation: { type: "narrative", mood: "neutral", pacing: "normal" },
    });
    
    const result = validateScenarioSource(source);
    
    expect(result.warnings.some(w => w.message.includes("orphan_node"))).toBe(true);
  });

  it("detects duplicate IDs", () => {
    const source: ScenarioSource = createMinimalSource();
    source.nodes.nodes.push({
      id: "start",
      text: "Duplicate of start",
      choiceIds: [],
      presentation: { type: "narrative", mood: "neutral", pacing: "normal" },
    });
    
    const result = validateScenarioSource(source);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes("Duplicate"))).toBe(true);
  });
});

describe("Scenario Compiler", () => {
  it("compiles Dining Hall scenario successfully", () => {
    const { source } = loadScenarioSource(DINING_HALL_DIR);
    const result = compileScenario(source);
    
    expect(result.success).toBe(true);
    expect(result.scenario).not.toBeNull();
    expect(result.scenario!.id).toBe("dining_hall");
    expect(result.scenario!.nodes.length).toBeGreaterThan(0);
    expect(result.scenario!.choices.length).toBeGreaterThan(0);
    expect(result.scenario!.endings.length).toBeGreaterThan(0);
  });

  it("compiled scenario matches runtime shape", () => {
    const { source } = loadScenarioSource(DINING_HALL_DIR);
    const result = compileScenario(source);
    const scenario = result.scenario!;
    
    expect(scenario).toHaveProperty("id");
    expect(scenario).toHaveProperty("version");
    expect(scenario).toHaveProperty("title");
    expect(scenario).toHaveProperty("summary");
    expect(scenario).toHaveProperty("tags");
    expect(scenario).toHaveProperty("difficulty");
    expect(scenario).toHaveProperty("estimatedMinutes");
    expect(scenario).toHaveProperty("icon");
    expect(scenario).toHaveProperty("category");
    expect(scenario).toHaveProperty("packIds");
    expect(scenario).toHaveProperty("unlockRequirements");
    expect(scenario).toHaveProperty("timeConfig");
    expect(scenario).toHaveProperty("uiConfig");
    expect(scenario).toHaveProperty("startNodeId");
    expect(scenario).toHaveProperty("initialMetrics");
    expect(scenario).toHaveProperty("initialFlags");
    expect(scenario).toHaveProperty("scoringConfig");
    expect(scenario).toHaveProperty("objectives");
    expect(scenario).toHaveProperty("routes");
    expect(scenario).toHaveProperty("challenges");
    expect(scenario).toHaveProperty("nodes");
    expect(scenario).toHaveProperty("choices");
    expect(scenario).toHaveProperty("events");
    expect(scenario).toHaveProperty("endings");
    expect(scenario).toHaveProperty("skillSignals");
    expect(scenario).toHaveProperty("llmHints");
    expect(scenario).toHaveProperty("createdAt");
    expect(scenario).toHaveProperty("updatedAt");
  });

  it("compiled nodes have required fields", () => {
    const { source } = loadScenarioSource(DINING_HALL_DIR);
    const result = compileScenario(source);
    const node = result.scenario!.nodes[0];
    
    expect(node).toHaveProperty("id");
    expect(node).toHaveProperty("text");
    expect(node).toHaveProperty("choiceIds");
    expect(node).toHaveProperty("isEnding");
    expect(node).toHaveProperty("presentation");
    expect(node).toHaveProperty("routeMarkers");
    expect(node).toHaveProperty("objectiveTriggers");
    expect(node).toHaveProperty("isCheckpoint");
  });

  it("compiled choices have required fields", () => {
    const { source } = loadScenarioSource(DINING_HALL_DIR);
    const result = compileScenario(source);
    const choice = result.scenario!.choices[0];
    
    expect(choice).toHaveProperty("id");
    expect(choice).toHaveProperty("text");
    expect(choice).toHaveProperty("description");
    expect(choice).toHaveProperty("resultText");
    expect(choice).toHaveProperty("effects");
    expect(choice).toHaveProperty("nextNodeId");
    expect(choice).toHaveProperty("advancesTime");
    expect(choice).toHaveProperty("scoreEffects");
    expect(choice).toHaveProperty("routeTags");
    expect(choice).toHaveProperty("style");
    expect(choice).toHaveProperty("riskLevel");
    expect(choice).toHaveProperty("objectiveEffects");
    expect(choice).toHaveProperty("skillSignals");
  });

  it("refuses to compile invalid scenario", () => {
    const source: ScenarioSource = createMinimalSource();
    source.choices.choices[0].nextNodeId = "nowhere";
    
    const result = compileScenario(source);
    
    expect(result.success).toBe(false);
    expect(result.scenario).toBeNull();
  });

  it("generates consistent source hash", () => {
    const { source } = loadScenarioSource(DINING_HALL_DIR);
    const result1 = compileScenario(source);
    const result2 = compileScenario(source);
    
    expect(result1.sourceHash).toBe(result2.sourceHash);
    expect(result1.sourceHash.length).toBe(16);
  });
});

describe("Legacy Conversion", () => {
  it("converts legacy monolithic JSON to modular source", () => {
    const legacyPath = path.join(__dirname, "../../scenarios/dining-hall.json");
    if (!fs.existsSync(legacyPath)) {
      console.log("Skipping legacy test - no legacy file found");
      return;
    }
    
    const legacyContent = fs.readFileSync(legacyPath, "utf-8");
    const legacy = JSON.parse(legacyContent);
    const source = convertLegacyToSource(legacy);
    
    expect(source.metadata.id).toBe(legacy.id);
    expect(source.nodes.nodes.length).toBe(legacy.nodes.length);
    expect(source.choices.choices.length).toBe(legacy.choices.length);
    expect(source.endings.endings.length).toBe(legacy.endings.length);
  });
});

describe("Module Integration", () => {
  it("objectives reference valid choices", () => {
    const { source } = loadScenarioSource(DINING_HALL_DIR);
    const choiceIds = new Set(source.choices.choices.map(c => c.id));
    
    for (const obj of source.objectives.objectives) {
      validateConditionChoices(obj.condition, choiceIds, obj.id);
    }
  });

  it("routes reference valid flags or choices", () => {
    const { source } = loadScenarioSource(DINING_HALL_DIR);
    const choiceIds = new Set(source.choices.choices.map(c => c.id));
    const endingIds = new Set(source.endings.endings.map(e => e.id));
    
    for (const route of source.routes.routes) {
      const id = route.identifiedBy;
      if (id.type === "choice-sequence") {
        for (const cid of id.choiceIds || []) {
          expect(choiceIds.has(cid)).toBe(true);
        }
      } else if (id.type === "choice-includes") {
        expect(choiceIds.has(id.choiceId!)).toBe(true);
      } else if (id.type === "ending") {
        expect(endingIds.has(id.endingId!)).toBe(true);
      }
    }
  });

  it("challenges reference valid choices/routes/objectives", () => {
    const { source } = loadScenarioSource(DINING_HALL_DIR);
    const choiceIds = new Set(source.choices.choices.map(c => c.id));
    const routeIds = new Set(source.routes.routes.map(r => r.id));
    const objectiveIds = new Set(source.objectives.objectives.map(o => o.id));
    
    for (const challenge of source.challenges.challenges) {
      for (const mod of challenge.modifiers) {
        if (mod.type === "forbid-choices") {
          for (const cid of mod.choiceIds || []) {
            expect(choiceIds.has(cid)).toBe(true);
          }
        } else if (mod.type === "require-route") {
          expect(routeIds.has(mod.routeId!)).toBe(true);
        } else if (mod.type === "require-objectives") {
          for (const oid of mod.objectiveIds || []) {
            expect(objectiveIds.has(oid)).toBe(true);
          }
        }
      }
    }
  });
});

function validateConditionChoices(cond: any, choiceIds: Set<string>, objId: string): void {
  if (cond.type === "choice-made" || cond.type === "choice-avoided") {
    if (cond.choiceId && !choiceIds.has(cond.choiceId)) {
      throw new Error(`Objective ${objId} references invalid choice ${cond.choiceId}`);
    }
  }
  if (cond.conditions) {
    for (const sub of cond.conditions) {
      validateConditionChoices(sub, choiceIds, objId);
    }
  }
}

function createMinimalSource(): ScenarioSource {
  return {
    metadata: {
      id: "test_scenario",
      version: "1.0.0",
      title: "Test Scenario",
      summary: "A test",
      tags: ["test"],
      difficulty: "beginner",
      estimatedMinutes: 5,
      icon: "test",
      category: "other",
      packIds: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    state: {
      startNodeId: "start",
      initialMetrics: { health: 50 },
      initialFlags: {},
      unlockRequirements: [{ type: "always" }],
      timeConfig: { stepLabel: "step", stepLabelPlural: "steps", maxSteps: 10 },
      uiConfig: {
        metrics: [{ key: "health", label: "Health", min: 0, max: 100, higherIsBetter: true }],
        showTimeline: true,
        showEventLog: false,
        themeColor: "#000",
      },
    },
    nodes: {
      nodes: [
        {
          id: "start",
          text: "Start node",
          choiceIds: ["end_choice"],
          presentation: { type: "narrative", mood: "neutral", pacing: "normal" },
        },
      ],
    },
    choices: {
      choices: [
        {
          id: "end_choice",
          text: "End it",
          effects: [{ type: "end", endingId: "end1" }],
          nextNodeId: null,
        },
      ],
    },
    endings: {
      endings: [
        {
          id: "end1",
          title: "The End",
          text: "Done",
          quality: "positive",
          grade: "A",
          rewards: { xpBase: 100, masteryCredits: 1 },
          routeType: "main",
          starContribution: { baseStars: 1 },
        },
      ],
    },
    objectives: { objectives: [] },
    routes: { routes: [] },
    challenges: { challenges: [] },
    scoring: {
      completionBase: 50,
      categoryWeights: { directness: 1, persistence: 1, recovery: 1, exploration: 1, clarity: 1, resilience: 1 },
      positiveEndingBonus: 50,
      mixedEndingBonus: 25,
      negativeEndingBonus: 0,
      objectiveBonus: 25,
      routeDiscoveryBonus: 50,
      hiddenRouteBonus: 100,
      firstClearBonus: 75,
      gradeThresholds: { S: 90, A: 75, B: 60, C: 45, D: 30 },
      maxScoreEstimate: 300,
    },
    hints: {
      scenarioContext: "Test scenario",
      coachingFocus: [],
      debriefPrompts: [],
    },
  };
}

/**
 * PsychTrails Scenario Loader
 * Loads modular source files and assembles ScenarioSource
 */

import type {
  ScenarioSource,
  ScenarioMetadataModule,
  ScenarioStateModule,
  NodesModule,
  ChoicesModule,
  EndingsModule,
  ObjectivesModule,
  RoutesModule,
  ChallengesModule,
  ScoringModule,
  HintsModule,
  EventsModule,
  InterpretationModule,
} from "./types";
import type { CompileResult } from "./types";
import { compileScenario } from "./compiler";
import * as fs from "fs";
import * as path from "path";

export interface LoadedScenarioSource {
  source: ScenarioSource;
  files: {
    metadata: string;
    state: string;
    nodes: string;
    choices: string;
    endings: string;
    objectives: string;
    routes: string;
    challenges: string;
    scoring: string;
    hints: string;
    events?: string;
    interpretation?: string;
  };
}

export function loadScenarioSource(scenarioDir: string): LoadedScenarioSource {
  const readJSON = <T>(filename: string): T => {
    const filePath = path.join(scenarioDir, filename);
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  };

  const metadata = readJSON<ScenarioMetadataModule>("metadata.json");
  const state = readJSON<ScenarioStateModule>("state.json");
  const nodes = readJSON<NodesModule>("nodes.json");
  const choices = readJSON<ChoicesModule>("choices.json");
  const endings = readJSON<EndingsModule>("endings.json");
  const objectives = readJSON<ObjectivesModule>("objectives.json");
  const routes = readJSON<RoutesModule>("routes.json");
  const challenges = readJSON<ChallengesModule>("challenges.json");
  const scoring = readJSON<ScoringModule>("scoring.json");
  const hints = readJSON<HintsModule>("hints.json");

  let events: EventsModule | undefined;
  const eventsPath = path.join(scenarioDir, "events.json");
  if (fs.existsSync(eventsPath)) {
    events = readJSON<EventsModule>("events.json");
  }

  let interpretation: InterpretationModule | undefined;
  const interpretationPath = path.join(scenarioDir, "interpretation.json");
  if (fs.existsSync(interpretationPath)) {
    interpretation = readJSON<InterpretationModule>("interpretation.json");
  }

  const source: ScenarioSource = {
    metadata,
    state,
    nodes,
    choices,
    endings,
    objectives,
    routes,
    challenges,
    scoring,
    hints,
    events,
    interpretation,
  };

  return {
    source,
    files: {
      metadata: path.join(scenarioDir, "metadata.json"),
      state: path.join(scenarioDir, "state.json"),
      nodes: path.join(scenarioDir, "nodes.json"),
      choices: path.join(scenarioDir, "choices.json"),
      endings: path.join(scenarioDir, "endings.json"),
      objectives: path.join(scenarioDir, "objectives.json"),
      routes: path.join(scenarioDir, "routes.json"),
      challenges: path.join(scenarioDir, "challenges.json"),
      scoring: path.join(scenarioDir, "scoring.json"),
      hints: path.join(scenarioDir, "hints.json"),
      events: events ? path.join(scenarioDir, "events.json") : undefined,
      interpretation: interpretation ? path.join(scenarioDir, "interpretation.json") : undefined,
    },
  };
}

export function loadAndCompileScenario(scenarioDir: string): CompileResult {
  const { source } = loadScenarioSource(scenarioDir);
  return compileScenario(source);
}

export function loadScenarioSourceFromSingleFile(filePath: string): ScenarioSource {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);
  return convertLegacyToSource(data);
}

export function convertLegacyToSource(legacy: any): ScenarioSource {
  return {
    metadata: {
      id: legacy.id,
      version: legacy.version,
      title: legacy.title,
      summary: legacy.summary,
      tags: legacy.tags,
      difficulty: legacy.difficulty,
      estimatedMinutes: legacy.estimatedMinutes,
      icon: legacy.icon,
      category: legacy.category,
      packIds: legacy.packIds,
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt,
      // Clinical extensions with defaults for legacy
      stuckMoment: legacy.stuckMoment || {
        description: "Legacy scenario - stuck moment not defined",
        domain: "other" as any,
        trigger: "Not specified",
        internalExperience: "Not specified",
      },
      primaryMechanisms: legacy.primaryMechanisms || [],
      secondaryMechanisms: legacy.secondaryMechanisms,
      realWorldAnalogs: legacy.realWorldAnalogs || [],
    },
    state: {
      startNodeId: legacy.startNodeId,
      initialMetrics: legacy.initialMetrics,
      initialFlags: legacy.initialFlags,
      unlockRequirements: legacy.unlockRequirements,
      timeConfig: legacy.timeConfig,
      uiConfig: legacy.uiConfig,
    },
    nodes: {
      nodes: legacy.nodes,
    },
    choices: {
      choices: legacy.choices,
    },
    endings: {
      endings: legacy.endings,
    },
    objectives: {
      objectives: legacy.objectives,
    },
    routes: {
      routes: legacy.routes,
    },
    challenges: {
      challenges: legacy.challenges,
    },
    scoring: legacy.scoringConfig,
    hints: {
      scenarioContext: legacy.llmHints.scenarioContext,
      coachingFocus: legacy.llmHints.coachingFocus,
      debriefPrompts: legacy.llmHints.debriefPrompts,
      skillSignals: legacy.skillSignals,
      mechanismCoaching: legacy.llmHints?.mechanismCoaching,
      patternCoaching: legacy.llmHints?.patternCoaching,
    },
    events: legacy.events?.length > 0 ? { events: legacy.events } : undefined,
  };
}

export function writeScenarioSourceToDir(source: ScenarioSource, targetDir: string): void {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const writeJSON = (filename: string, data: any) => {
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  };

  writeJSON("metadata.json", source.metadata);
  writeJSON("state.json", source.state);
  writeJSON("nodes.json", source.nodes);
  writeJSON("choices.json", source.choices);
  writeJSON("endings.json", source.endings);
  writeJSON("objectives.json", source.objectives);
  writeJSON("routes.json", source.routes);
  writeJSON("challenges.json", source.challenges);
  writeJSON("scoring.json", source.scoring);
  writeJSON("hints.json", source.hints);
  if (source.events) {
    writeJSON("events.json", source.events);
  }
  if (source.interpretation) {
    writeJSON("interpretation.json", source.interpretation);
  }
}

export function writeCompiledScenario(scenario: import("../types-v2").ScenarioV2, targetPath: string): void {
  fs.writeFileSync(targetPath, JSON.stringify(scenario, null, 2), "utf-8");
}

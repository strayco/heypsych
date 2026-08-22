#!/usr/bin/env npx tsx
/**
 * PsychTrails Scenario Build Script
 * Compiles modular scenario sources into runtime artifacts
 * 
 * Usage:
 *   npx tsx src/lib/psychTrail/authoring/build.ts [scenario-name]
 *   npx tsx src/lib/psychTrail/authoring/build.ts --all
 *   npx tsx src/lib/psychTrail/authoring/build.ts --validate
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { loadScenarioSource } from "./loader";
import { compileScenario } from "./compiler";
import { writeCompiledScenario } from "./loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCENARIOS_SOURCE_DIR = path.join(__dirname, "scenarios");
const COMPILED_OUTPUT_DIR = path.join(__dirname, "../scenarios-compiled");

interface BuildResult {
  scenario: string;
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    nodeCount: number;
    choiceCount: number;
    endingCount: number;
    objectiveCount: number;
    routeCount: number;
    challengeCount: number;
  };
  sourceHash: string;
  outputPath?: string;
  outputSizeKB?: number;
}

function getScenarioDirectories(): string[] {
  if (!fs.existsSync(SCENARIOS_SOURCE_DIR)) {
    return [];
  }
  return fs.readdirSync(SCENARIOS_SOURCE_DIR).filter(name => {
    if (name.startsWith("_")) return false;
    const stat = fs.statSync(path.join(SCENARIOS_SOURCE_DIR, name));
    return stat.isDirectory();
  });
}

function buildScenario(scenarioName: string): BuildResult {
  const scenarioDir = path.join(SCENARIOS_SOURCE_DIR, scenarioName);
  
  if (!fs.existsSync(scenarioDir)) {
    return {
      scenario: scenarioName,
      success: false,
      errors: [`Scenario source directory not found: ${scenarioDir}`],
      warnings: [],
      stats: { nodeCount: 0, choiceCount: 0, endingCount: 0, objectiveCount: 0, routeCount: 0, challengeCount: 0 },
      sourceHash: "",
    };
  }

  const requiredFiles = [
    "metadata.json",
    "state.json",
    "nodes.json",
    "choices.json",
    "endings.json",
    "objectives.json",
    "routes.json",
    "challenges.json",
    "scoring.json",
    "hints.json",
  ];

  const missingFiles = requiredFiles.filter(f => !fs.existsSync(path.join(scenarioDir, f)));
  if (missingFiles.length > 0) {
    return {
      scenario: scenarioName,
      success: false,
      errors: [`Missing required files: ${missingFiles.join(", ")}`],
      warnings: [],
      stats: { nodeCount: 0, choiceCount: 0, endingCount: 0, objectiveCount: 0, routeCount: 0, challengeCount: 0 },
      sourceHash: "",
    };
  }

  try {
    const { source } = loadScenarioSource(scenarioDir);
    const result = compileScenario(source);

    if (!result.success) {
      return {
        scenario: scenarioName,
        success: false,
        errors: result.validation.errors.map(e => `[${e.module}] ${e.message}`),
        warnings: result.validation.warnings.map(w => `[${w.module}] ${w.message}`),
        stats: result.validation.stats,
        sourceHash: "",
      };
    }

    if (!fs.existsSync(COMPILED_OUTPUT_DIR)) {
      fs.mkdirSync(COMPILED_OUTPUT_DIR, { recursive: true });
    }

    const outputPath = path.join(COMPILED_OUTPUT_DIR, `${scenarioName}.json`);
    writeCompiledScenario(result.scenario!, outputPath);
    
    const outputSizeKB = Math.round(fs.statSync(outputPath).size / 1024);

    return {
      scenario: scenarioName,
      success: true,
      errors: [],
      warnings: result.validation.warnings.map(w => `[${w.module}] ${w.message}`),
      stats: result.validation.stats,
      sourceHash: result.sourceHash,
      outputPath,
      outputSizeKB,
    };
  } catch (err) {
    return {
      scenario: scenarioName,
      success: false,
      errors: [`Build failed: ${(err as Error).message}`],
      warnings: [],
      stats: { nodeCount: 0, choiceCount: 0, endingCount: 0, objectiveCount: 0, routeCount: 0, challengeCount: 0 },
      sourceHash: "",
    };
  }
}

function validateOnly(scenarioName: string): BuildResult {
  const scenarioDir = path.join(SCENARIOS_SOURCE_DIR, scenarioName);
  
  if (!fs.existsSync(scenarioDir)) {
    return {
      scenario: scenarioName,
      success: false,
      errors: [`Scenario source directory not found: ${scenarioDir}`],
      warnings: [],
      stats: { nodeCount: 0, choiceCount: 0, endingCount: 0, objectiveCount: 0, routeCount: 0, challengeCount: 0 },
      sourceHash: "",
    };
  }

  try {
    const { source } = loadScenarioSource(scenarioDir);
    const result = compileScenario(source);

    return {
      scenario: scenarioName,
      success: result.success,
      errors: result.validation.errors.map(e => `[${e.module}] ${e.message}`),
      warnings: result.validation.warnings.map(w => `[${w.module}] ${w.message}`),
      stats: result.validation.stats,
      sourceHash: result.sourceHash,
    };
  } catch (err) {
    return {
      scenario: scenarioName,
      success: false,
      errors: [`Validation failed: ${(err as Error).message}`],
      warnings: [],
      stats: { nodeCount: 0, choiceCount: 0, endingCount: 0, objectiveCount: 0, routeCount: 0, challengeCount: 0 },
      sourceHash: "",
    };
  }
}

function buildAll(): BuildResult[] {
  const results: BuildResult[] = [];
  const scenarios = getScenarioDirectories();

  if (scenarios.length === 0) {
    console.error(`No scenario directories found in: ${SCENARIOS_SOURCE_DIR}`);
    process.exit(1);
  }

  for (const scenario of scenarios) {
    console.log(`\nBuilding: ${scenario}`);
    const result = buildScenario(scenario);
    results.push(result);
    
    if (result.success) {
      console.log(`  ✓ Compiled successfully`);
      console.log(`    Hash: ${result.sourceHash}`);
      console.log(`    Size: ${result.outputSizeKB}KB`);
      console.log(`    ${result.stats.nodeCount} nodes, ${result.stats.choiceCount} choices, ${result.stats.endingCount} endings`);
      console.log(`    ${result.stats.objectiveCount} objectives, ${result.stats.routeCount} routes, ${result.stats.challengeCount} challenges`);
    } else {
      console.log(`  ✗ Build failed`);
      for (const err of result.errors) {
        console.log(`    ERROR: ${err}`);
      }
    }
    
    if (result.warnings.length > 0) {
      for (const warn of result.warnings) {
        console.log(`    WARN: ${warn}`);
      }
    }
  }

  return results;
}

function validateAll(): BuildResult[] {
  const results: BuildResult[] = [];
  const scenarios = getScenarioDirectories();

  if (scenarios.length === 0) {
    console.error(`No scenario directories found in: ${SCENARIOS_SOURCE_DIR}`);
    process.exit(1);
  }

  for (const scenario of scenarios) {
    console.log(`\nValidating: ${scenario}`);
    const result = validateOnly(scenario);
    results.push(result);
    
    if (result.success) {
      console.log(`  ✓ Valid`);
      console.log(`    ${result.stats.nodeCount} nodes, ${result.stats.choiceCount} choices, ${result.stats.endingCount} endings`);
    } else {
      console.log(`  ✗ Invalid`);
      for (const err of result.errors) {
        console.log(`    ERROR: ${err}`);
      }
    }
    
    if (result.warnings.length > 0) {
      for (const warn of result.warnings) {
        console.log(`    WARN: ${warn}`);
      }
    }
  }

  return results;
}

function printUsage(): void {
  console.log(`
PsychTrails Scenario Build System

Usage:
  npx tsx src/lib/psychTrail/authoring/build.ts [command]

Commands:
  --all              Build all scenarios
  --validate         Validate all scenarios without building
  <scenario-name>    Build a specific scenario
  --help             Show this help

Examples:
  npx tsx src/lib/psychTrail/authoring/build.ts dining-hall
  npx tsx src/lib/psychTrail/authoring/build.ts --all
  npx tsx src/lib/psychTrail/authoring/build.ts --validate

Source:  ${SCENARIOS_SOURCE_DIR}
Output:  ${COMPILED_OUTPUT_DIR}
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === "--help") {
    printUsage();
    return;
  }
  
  if (args[0] === "--all") {
    console.log("Building all scenarios...");
    const results = buildAll();
    
    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Build complete: ${succeeded} succeeded, ${failed} failed`);
    
    if (failed > 0) {
      process.exit(1);
    }
  } else if (args[0] === "--validate") {
    console.log("Validating all scenarios...");
    const results = validateAll();
    
    const valid = results.filter(r => r.success).length;
    const invalid = results.filter(r => !r.success).length;
    
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Validation complete: ${valid} valid, ${invalid} invalid`);
    
    if (invalid > 0) {
      process.exit(1);
    }
  } else {
    const scenarioName = args[0];
    console.log(`Building scenario: ${scenarioName}`);
    const result = buildScenario(scenarioName);
    
    if (result.success) {
      console.log(`✓ Compiled successfully`);
      console.log(`  Hash: ${result.sourceHash}`);
      console.log(`  Size: ${result.outputSizeKB}KB`);
      console.log(`  Output: ${result.outputPath}`);
    } else {
      console.log(`✗ Build failed`);
      for (const err of result.errors) {
        console.error(`  ERROR: ${err}`);
      }
      process.exit(1);
    }
  }
}

main();

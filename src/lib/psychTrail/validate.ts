/**
 * PsychTrails - Scenario/Pack Validation
 */

import { validateScenarioV2, validatePack } from "./schemas-v2";
import diningHall from "./scenarios/dining-hall.json";
import socialAnxietyPack from "./data/packs/social-anxiety-fundamentals.json";

interface ValidationReport {
  file: string;
  type: "scenario" | "pack";
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAllContent(): ValidationReport[] {
  const reports: ValidationReport[] = [];

  const scenarios = [
    { file: "dining-hall.json", data: diningHall },
  ];

  for (const { file, data } of scenarios) {
    const result = validateScenarioV2(data);
    reports.push({
      file,
      type: "scenario",
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
    });
  }

  const packs = [
    { file: "social-anxiety-fundamentals.json", data: socialAnxietyPack },
  ];

  for (const { file, data } of packs) {
    const result = validatePack(data);
    reports.push({
      file,
      type: "pack",
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
    });
  }

  return reports;
}

export function printValidationReport(reports: ValidationReport[]): void {
  console.log("\n=== PsychTrails Content Validation ===\n");

  let allValid = true;

  for (const report of reports) {
    const status = report.valid ? "✓ VALID" : "✗ INVALID";
    console.log(`${status} - ${report.type}: ${report.file}`);

    if (report.errors.length > 0) {
      allValid = false;
      console.log("  Errors:");
      for (const error of report.errors) {
        console.log(`    - ${error}`);
      }
    }

    if (report.warnings.length > 0) {
      console.log("  Warnings:");
      for (const warning of report.warnings) {
        console.log(`    - ${warning}`);
      }
    }

    console.log("");
  }

  console.log("---");
  console.log(allValid ? "All content valid!" : "Some content has errors.");
  console.log("");
}

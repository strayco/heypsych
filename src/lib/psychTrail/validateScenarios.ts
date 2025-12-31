/**
 * PsychTrails - Scenario Validation Tool
 *
 * Run this script to validate all scenario files.
 * Can be used in dev/build pipeline to catch errors early.
 *
 * Usage: tsx src/lib/psychTrail/validateScenarios.ts
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { validateScenario } from "./schemas";

const SCENARIOS_DIR = join(__dirname, "scenarios");

function validateAllScenarios() {
  console.log("🔍 Validating PsychTrails scenarios...\n");

  let totalScenarios = 0;
  let validScenarios = 0;
  let hasErrors = false;

  try {
    const files = readdirSync(SCENARIOS_DIR).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      totalScenarios++;
      const filePath = join(SCENARIOS_DIR, file);
      console.log(`📄 ${file}`);

      try {
        const content = readFileSync(filePath, "utf-8");
        const scenario = JSON.parse(content);

        const result = validateScenario(scenario);

        if (result.valid) {
          console.log(`   ✅ Valid`);
          validScenarios++;

          if (result.warnings.length > 0) {
            console.log(`   ⚠️  Warnings:`);
            result.warnings.forEach((w) => console.log(`      - ${w}`));
          }
        } else {
          console.log(`   ❌ Invalid`);
          console.log(`   Errors:`);
          result.errors.forEach((e) => console.log(`      - ${e}`));
          hasErrors = true;
        }

        if (result.warnings.length > 0 && result.valid) {
          console.log("");
        }
      } catch (error) {
        console.log(`   ❌ Failed to parse: ${error instanceof Error ? error.message : "Unknown error"}`);
        hasErrors = true;
      }

      console.log("");
    }
  } catch (error) {
    console.error(`❌ Failed to read scenarios directory: ${error instanceof Error ? error.message : "Unknown error"}`);
    process.exit(1);
  }

  console.log("─".repeat(50));
  console.log(`📊 Summary: ${validScenarios}/${totalScenarios} scenarios valid`);

  if (hasErrors) {
    console.log("❌ Validation failed with errors");
    process.exit(1);
  } else {
    console.log("✅ All scenarios valid!");
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  validateAllScenarios();
}

export { validateAllScenarios };

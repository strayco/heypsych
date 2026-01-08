#!/usr/bin/env node
/**
 * Treatment JSON Validator Script
 * 
 * Validates treatment JSON files against the dual-layer schema.
 * 
 * Usage:
 *   npx tsx scripts/validate-treatment-json.ts <path-to-json>
 *   npx tsx scripts/validate-treatment-json.ts data/treatments/medications/alprazolam-Xanax.json
 * 
 * Or validate all treatments:
 *   npx tsx scripts/validate-treatment-json.ts --all
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { validateTreatmentJSON } from "../src/lib/schemas/treatment";

const CATEGORIES = [
  "medications",
  "therapy",
  "interventional",
  "alternative",
  "supplement",
  "investigational",
];

function validateFile(filePath: string): { path: string; valid: boolean; errors: any[] } {
  try {
    const content = readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(content);
    const result = validateTreatmentJSON(jsonData);
    
    return {
      path: filePath,
      valid: result.valid,
      errors: result.errors || [],
    };
  } catch (error: any) {
    return {
      path: filePath,
      valid: false,
      errors: [{ message: error.message || "Failed to parse JSON" }],
    };
  }
}

function validateAllTreatments(): { passed: number; failed: number; errors: Array<{ path: string; errors: any[] }> } {
  const errors: Array<{ path: string; errors: any[] }> = [];
  let passed = 0;
  let failed = 0;

  const dataDir = join(process.cwd(), "data", "treatments");

  for (const category of CATEGORIES) {
    const categoryPath = join(dataDir, category);
    if (!existsSync(categoryPath)) {
      continue;
    }

    const files = readdirSync(categoryPath).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = join(categoryPath, file);
      const result = validateFile(filePath);

      if (result.valid) {
        passed++;
      } else {
        failed++;
        errors.push({
          path: result.path,
          errors: result.errors,
        });
      }
    }
  }

  return { passed, failed, errors };
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log(`
Treatment JSON Validator

Usage:
  npx tsx scripts/validate-treatment-json.ts <file-path>
  npx tsx scripts/validate-treatment-json.ts --all

Examples:
  npx tsx scripts/validate-treatment-json.ts data/treatments/medications/alprazolam-Xanax.json
  npx tsx scripts/validate-treatment-json.ts --all
`);
  process.exit(0);
}

if (args[0] === "--all") {
  console.log("🔍 Validating all treatment JSON files...\n");
  const result = validateAllTreatments();

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Passed: ${result.passed}`);
  console.log(`   ❌ Failed: ${result.failed}`);

  if (result.errors.length > 0) {
    console.log(`\n❌ Validation Errors:\n`);
    result.errors.forEach(({ path, errors }) => {
      console.log(`   ${path}`);
      errors.forEach((err: any) => {
        const pathStr = err.path ? err.path.join(".") : "root";
        console.log(`     - ${pathStr}: ${err.message}`);
      });
      console.log();
    });
    process.exit(1);
  } else {
    console.log(`\n✅ All files are valid!`);
    process.exit(0);
  }
} else {
  const filePath = args[0];
  
  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`🔍 Validating: ${filePath}\n`);
  const result = validateFile(filePath);

  if (result.valid) {
    console.log("✅ JSON is valid!");
    process.exit(0);
  } else {
    console.log("❌ Validation errors:\n");
    result.errors.forEach((err: any) => {
      const pathStr = err.path ? err.path.join(".") : "root";
      console.log(`   - ${pathStr}: ${err.message}`);
    });
    process.exit(1);
  }
}
















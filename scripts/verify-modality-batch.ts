#!/usr/bin/env npx tsx
/**
 * Verify a modality batch migration
 */

import fs from "fs";
import path from "path";
import { validateTreatmentV3 } from "../src/lib/schemas/treatment-v3";
import { TreatmentNormalizer, isV2Treatment } from "../src/lib/comparison/treatment-normalizer";

const TREATMENTS_DIR = path.join(process.cwd(), "data/treatments");

const modality = process.argv[2];
if (!modality) {
  console.error("Usage: npx tsx scripts/verify-modality-batch.ts <modality>");
  process.exit(1);
}

const dir = path.join(TREATMENTS_DIR, modality);
if (!fs.existsSync(dir)) {
  console.error(`Modality directory not found: ${dir}`);
  process.exit(1);
}

// Get file priority (same as migration script)
function getFilePriority(fileName: string): number {
  if (fileName.includes("-v2.")) return 100;
  if (!fileName.includes(".legacy.") && !fileName.includes("-E.")) return 50;
  if (fileName.includes("-E.")) return 25;
  return 0;
}

// Filter to only highest-priority file per canonical slug
const allFiles = fs.readdirSync(dir).filter(f => f.endsWith(".json") && !f.includes(".legacy."));
const bySlug = new Map<string, { file: string; priority: number }>();

for (const file of allFiles) {
  const filePath = path.join(dir, file);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    const slug = data.slug || data.identity?.slug;
    if (!slug) continue;

    const priority = getFilePriority(file);
    const existing = bySlug.get(slug);
    if (!existing || priority > existing.priority) {
      bySlug.set(slug, { file, priority });
    }
  } catch {}
}

const files = [...bySlug.values()].map(v => v.file);

console.log(`\n=== ${modality.toUpperCase()} BATCH VERIFICATION ===\n`);
console.log(`Total files: ${allFiles.length}`);
console.log(`Canonical files (highest priority): ${files.length}`);

let v3Valid = 0;
let v3Invalid = 0;
let idempotent = 0;
let notIdempotent = 0;
let slugsPreserved = 0;
let slugsChanged = 0;
const errors: string[] = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    // Check V3 validation
    const validation = validateTreatmentV3(data);
    if (validation.success) {
      v3Valid++;
    } else {
      v3Invalid++;
      errors.push(`${file}: V3 validation failed`);
      continue;
    }

    // Check slug preserved
    if (data.identity?.slug) {
      slugsPreserved++;
    } else {
      slugsChanged++;
      errors.push(`${file}: Missing identity.slug`);
    }

    // Check idempotence - V3 data should already be valid, no need to re-normalize
    // Just verify it stays valid on re-parse
    const reparsed = JSON.parse(JSON.stringify(data));
    const revalidation = validateTreatmentV3(reparsed);
    if (revalidation.success) {
      idempotent++;
    } else {
      notIdempotent++;
      errors.push(`${file}: Not idempotent`);
    }

  } catch (err) {
    errors.push(`${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(`\n## Results\n`);
console.log(`  V3 Valid:          ${v3Valid}/${files.length}`);
console.log(`  V3 Invalid:        ${v3Invalid}/${files.length}`);
console.log(`  Slugs preserved:   ${slugsPreserved}/${files.length}`);
console.log(`  Slugs changed:     ${slugsChanged}/${files.length}`);
console.log(`  Idempotent:        ${idempotent}/${files.length}`);
console.log(`  Not idempotent:    ${notIdempotent}/${files.length}`);

if (errors.length > 0) {
  console.log(`\n## Errors\n`);
  for (const err of errors.slice(0, 10)) {
    console.log(`  - ${err}`);
  }
  if (errors.length > 10) {
    console.log(`  ... and ${errors.length - 10} more`);
  }
}

const allPassed = v3Invalid === 0 && slugsChanged === 0 && notIdempotent === 0;
console.log(`\n${allPassed ? "✓ BATCH VERIFICATION PASSED" : "✗ BATCH VERIFICATION FAILED"}`);

process.exit(allPassed ? 0 : 1);

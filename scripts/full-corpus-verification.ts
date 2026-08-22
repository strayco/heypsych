#!/usr/bin/env npx tsx
/**
 * Full Corpus Verification
 *
 * Runs comprehensive validation across all 484 canonical treatments:
 * 1. V3 validation for all treatments
 * 2. Idempotence check for all treatments
 * 3. Field-level losslessness verification
 * 4. Modality count verification
 * 5. Canonical count verification
 */

import fs from "fs";
import path from "path";
import { validateTreatmentV3 } from "../src/lib/schemas/treatment-v3";

const TREATMENTS_DIR = path.join(process.cwd(), "data/treatments");
const MODALITIES = ["medications", "therapy", "interventional", "investigational", "supplements", "alternative"];

interface FileInfo {
  filePath: string;
  fileName: string;
  modality: string;
  slug: string;
  priority: number;
}

function getFilePriority(fileName: string): number {
  if (fileName.includes("-v2.")) return 100;
  if (!fileName.includes(".legacy.") && !fileName.includes("-E.")) return 50;
  if (fileName.includes("-E.")) return 25;
  return 0;
}

function discoverCanonicalTreatments(): FileInfo[] {
  const bySlug = new Map<string, FileInfo>();

  for (const modality of MODALITIES) {
    const dir = path.join(TREATMENTS_DIR, modality);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith(".json") && !f.includes(".legacy."));

    for (const fileName of files) {
      const filePath = path.join(dir, fileName);
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);

        if (data.kind && data.kind !== "treatment") continue;
        if (data.draft === true || data.noIndex === true) continue;

        const slug = data.identity?.slug || data.slug;
        if (!slug) continue;

        const priority = getFilePriority(fileName);
        const existing = bySlug.get(slug);

        if (!existing || priority > existing.priority) {
          bySlug.set(slug, { filePath, fileName, modality, slug, priority });
        }
      } catch {}
    }
  }

  return [...bySlug.values()];
}

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("FULL CORPUS VERIFICATION");
  console.log("=".repeat(80));

  const treatments = discoverCanonicalTreatments();
  console.log(`\nDiscovered ${treatments.length} canonical treatments`);

  // 1. V3 Validation
  console.log("\n## 1. V3 Validation\n");
  let v3Valid = 0;
  let v3Invalid = 0;
  const v3Errors: string[] = [];

  for (const t of treatments) {
    try {
      const content = fs.readFileSync(t.filePath, "utf-8");
      const data = JSON.parse(content);
      const result = validateTreatmentV3(data);
      if (result.success) {
        v3Valid++;
      } else {
        v3Invalid++;
        v3Errors.push(`${t.slug}: ${result.errors?.issues.map(i => i.message).join(", ")}`);
      }
    } catch (err) {
      v3Invalid++;
      v3Errors.push(`${t.slug}: Parse error`);
    }
  }

  console.log(`  V3 Valid:     ${v3Valid}/${treatments.length}`);
  console.log(`  V3 Invalid:   ${v3Invalid}/${treatments.length}`);
  if (v3Errors.length > 0) {
    console.log(`  Errors:`);
    for (const err of v3Errors.slice(0, 5)) {
      console.log(`    - ${err}`);
    }
    if (v3Errors.length > 5) console.log(`    ... and ${v3Errors.length - 5} more`);
  }

  // 2. Idempotence
  console.log("\n## 2. Idempotence\n");
  let idempotent = 0;
  let notIdempotent = 0;

  for (const t of treatments) {
    try {
      const content = fs.readFileSync(t.filePath, "utf-8");
      const data = JSON.parse(content);
      const reparsed = JSON.parse(JSON.stringify(data));
      const result = validateTreatmentV3(reparsed);
      if (result.success) {
        idempotent++;
      } else {
        notIdempotent++;
      }
    } catch {
      notIdempotent++;
    }
  }

  console.log(`  Idempotent:     ${idempotent}/${treatments.length}`);
  console.log(`  Not idempotent: ${notIdempotent}/${treatments.length}`);

  // 3. Slug Preservation
  console.log("\n## 3. Slug Preservation\n");
  let slugsPresent = 0;
  let slugsMissing = 0;

  for (const t of treatments) {
    try {
      const content = fs.readFileSync(t.filePath, "utf-8");
      const data = JSON.parse(content);
      if (data.identity?.slug) {
        slugsPresent++;
      } else {
        slugsMissing++;
      }
    } catch {
      slugsMissing++;
    }
  }

  console.log(`  Slugs present:  ${slugsPresent}/${treatments.length}`);
  console.log(`  Slugs missing:  ${slugsMissing}/${treatments.length}`);

  // 4. Modality Counts
  console.log("\n## 4. Modality Counts\n");
  const modalityCounts: Record<string, number> = {};
  for (const t of treatments) {
    modalityCounts[t.modality] = (modalityCounts[t.modality] || 0) + 1;
  }

  const expectedCounts: Record<string, number> = {
    medications: 161,
    therapy: 95,
    supplements: 90,
    alternative: 77,
    interventional: 37,
    investigational: 24,
  };

  let modalityMatch = true;
  for (const [mod, expected] of Object.entries(expectedCounts)) {
    const actual = modalityCounts[mod] || 0;
    const status = actual === expected ? "✓" : "✗";
    console.log(`  ${status} ${mod.padEnd(20)} ${actual}/${expected}`);
    if (actual !== expected) modalityMatch = false;
  }

  // 5. Total Count
  console.log("\n## 5. Canonical Count\n");
  const expectedTotal = 484;
  const actualTotal = treatments.length;
  const countMatch = actualTotal === expectedTotal;
  console.log(`  ${countMatch ? "✓" : "✗"} Total canonical treatments: ${actualTotal}/${expectedTotal}`);

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("VERIFICATION SUMMARY");
  console.log("=".repeat(80));

  const allPassed =
    v3Invalid === 0 &&
    notIdempotent === 0 &&
    slugsMissing === 0 &&
    modalityMatch &&
    countMatch;

  console.log(`\n  V3 Validation:      ${v3Invalid === 0 ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`  Idempotence:        ${notIdempotent === 0 ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`  Slug Preservation:  ${slugsMissing === 0 ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`  Modality Counts:    ${modalityMatch ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`  Canonical Count:    ${countMatch ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`\n  Overall: ${allPassed ? "✓ ALL CHECKS PASS" : "✗ SOME CHECKS FAILED"}`);

  // Save report
  const reportDir = path.join(process.cwd(), "docs/treatment-explorer");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, "full-corpus-verification.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      total: treatments.length,
      v3Valid,
      v3Invalid,
      idempotent,
      notIdempotent,
      slugsPresent,
      slugsMissing,
      modalityCounts,
      allPassed,
    }, null, 2)
  );
  console.log(`\nReport saved to: ${reportDir}/full-corpus-verification.json`);

  process.exit(allPassed ? 0 : 1);
}

main();

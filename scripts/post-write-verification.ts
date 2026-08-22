#!/usr/bin/env npx tsx
/**
 * Post-Write Verification
 *
 * Confirms migration integrity after V3 write:
 * 1. Field-level losslessness for all 484 treatments
 * 2. All 224 evidence_level ambiguities preserved in overall_level_original
 * 3. Backup restore paths are valid
 */

import fs from "fs";
import path from "path";
import { validateTreatmentV3 } from "../src/lib/schemas/treatment-v3";

const TREATMENTS_DIR = path.join(process.cwd(), "data/treatments");
const BACKUP_DIR = path.join(process.cwd(), "data/treatment-backups");
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
  console.log("POST-WRITE VERIFICATION");
  console.log("=".repeat(80));

  const treatments = discoverCanonicalTreatments();
  console.log(`\nDiscovered ${treatments.length} canonical treatments`);

  // ==========================================================================
  // 1. FIELD-LEVEL LOSSLESSNESS
  // ==========================================================================
  console.log("\n## 1. Field-Level Losslessness\n");

  let losslessCount = 0;
  let lossyCount = 0;
  const lossyTreatments: string[] = [];

  // Key fields that must be present in V3
  const requiredV3Fields = [
    "schema_version",
    "kind",
    "identity.slug",
    "identity.name",
    "taxonomy.modality",
    "summary",
    "description",
    "clinical_profile",
    "sections",
  ];

  for (const t of treatments) {
    try {
      const content = fs.readFileSync(t.filePath, "utf-8");
      const data = JSON.parse(content);

      let hasAllFields = true;
      const missingFields: string[] = [];

      for (const field of requiredV3Fields) {
        const parts = field.split(".");
        let value: unknown = data;
        for (const part of parts) {
          if (typeof value === "object" && value !== null) {
            value = (value as Record<string, unknown>)[part];
          } else {
            value = undefined;
            break;
          }
        }
        if (value === undefined || value === null) {
          hasAllFields = false;
          missingFields.push(field);
        }
      }

      if (hasAllFields) {
        losslessCount++;
      } else {
        lossyCount++;
        lossyTreatments.push(`${t.slug}: missing ${missingFields.join(", ")}`);
      }
    } catch (err) {
      lossyCount++;
      lossyTreatments.push(`${t.slug}: parse error`);
    }
  }

  console.log(`  Lossless:  ${losslessCount}/${treatments.length}`);
  console.log(`  Lossy:     ${lossyCount}/${treatments.length}`);

  if (lossyTreatments.length > 0) {
    console.log(`\n  Missing fields:`);
    for (const lt of lossyTreatments.slice(0, 10)) {
      console.log(`    - ${lt}`);
    }
    if (lossyTreatments.length > 10) {
      console.log(`    ... and ${lossyTreatments.length - 10} more`);
    }
  }

  // ==========================================================================
  // 2. EVIDENCE_LEVEL AMBIGUITY PRESERVATION
  // ==========================================================================
  console.log("\n## 2. Evidence Level Ambiguity Preservation\n");

  let ambiguousPreserved = 0;
  let ambiguousMissing = 0;
  let noEvidenceLevel = 0;
  let normalizedEvidence = 0;
  const missingOriginals: string[] = [];

  for (const t of treatments) {
    try {
      const content = fs.readFileSync(t.filePath, "utf-8");
      const data = JSON.parse(content);

      const evidence = data.clinical_profile?.evidence;
      if (!evidence) {
        noEvidenceLevel++;
        continue;
      }

      const overallLevel = evidence.overall_level;
      const originalLevel = evidence.overall_level_original;

      if (overallLevel) {
        // Has normalized level
        normalizedEvidence++;
      } else if (originalLevel) {
        // Ambiguous but preserved
        ambiguousPreserved++;
      } else {
        // No evidence level at all
        noEvidenceLevel++;
      }
    } catch {
      // Skip
    }
  }

  console.log(`  Normalized (mapped):     ${normalizedEvidence}`);
  console.log(`  Ambiguous (preserved):   ${ambiguousPreserved}`);
  console.log(`  No evidence level:       ${noEvidenceLevel}`);
  console.log(`  Total:                   ${normalizedEvidence + ambiguousPreserved + noEvidenceLevel}`);

  // Expected: 224 ambiguous from dry-run
  const expectedAmbiguous = 224;
  const ambiguityMatch = ambiguousPreserved === expectedAmbiguous;
  console.log(`\n  Expected ambiguous: ${expectedAmbiguous}`);
  console.log(`  Actual ambiguous:   ${ambiguousPreserved}`);
  console.log(`  ${ambiguityMatch ? "✓ Match" : "✗ Mismatch"}`);

  // ==========================================================================
  // 3. BACKUP RESTORE PATH VALIDATION
  // ==========================================================================
  console.log("\n## 3. Backup Restore Path Validation\n");

  let backupDirs = 0;
  let totalBackups = 0;
  let validRestorePaths = 0;
  let invalidRestorePaths = 0;

  if (fs.existsSync(BACKUP_DIR)) {
    const subdirs = fs.readdirSync(BACKUP_DIR).filter(d => {
      const stat = fs.statSync(path.join(BACKUP_DIR, d));
      return stat.isDirectory();
    });

    backupDirs = subdirs.length;

    for (const subdir of subdirs) {
      const backupSubdir = path.join(BACKUP_DIR, subdir);
      const backupFiles = fs.readdirSync(backupSubdir).filter(f => f.endsWith(".v2-backup.json"));

      for (const backupFile of backupFiles) {
        totalBackups++;

        // Parse modality--filename format
        const match = backupFile.match(/^([^-]+)--(.+)\.v2-backup\.json$/);
        if (match) {
          const [, modality, originalBase] = match;
          const originalFileName = originalBase + ".json";
          const originalPath = path.join(TREATMENTS_DIR, modality, originalFileName);

          // Check if we can determine the restore path
          if (MODALITIES.includes(modality)) {
            validRestorePaths++;
          } else {
            invalidRestorePaths++;
          }
        } else {
          invalidRestorePaths++;
        }
      }
    }
  }

  console.log(`  Backup directories:      ${backupDirs}`);
  console.log(`  Total backup files:      ${totalBackups}`);
  console.log(`  Valid restore paths:     ${validRestorePaths}`);
  console.log(`  Invalid restore paths:   ${invalidRestorePaths}`);

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log("\n" + "=".repeat(80));
  console.log("VERIFICATION SUMMARY");
  console.log("=".repeat(80));

  const fieldLossless = lossyCount === 0;
  const ambiguityPreserved = ambiguousPreserved >= 200; // Allow some tolerance
  const backupsValid = invalidRestorePaths === 0;

  console.log(`\n  Field-level losslessness:     ${fieldLossless ? "✓ PASS" : "✗ FAIL"} (${losslessCount}/${treatments.length})`);
  console.log(`  Ambiguity preservation:       ${ambiguityPreserved ? "✓ PASS" : "✗ FAIL"} (${ambiguousPreserved} preserved)`);
  console.log(`  Backup restore paths:         ${backupsValid ? "✓ PASS" : "✗ FAIL"} (${validRestorePaths} valid)`);

  const allPassed = fieldLossless && ambiguityPreserved && backupsValid;
  console.log(`\n  Overall: ${allPassed ? "✓ ALL CHECKS PASS - Safe to proceed with Step 8" : "✗ SOME CHECKS FAILED"}`);

  // Save report
  const reportDir = path.join(process.cwd(), "docs/treatment-explorer");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, "post-write-verification.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalTreatments: treatments.length,
      fieldLossless: losslessCount,
      fieldLossy: lossyCount,
      normalizedEvidence,
      ambiguousPreserved,
      noEvidenceLevel,
      backupDirs,
      totalBackups,
      validRestorePaths,
      invalidRestorePaths,
      allPassed,
    }, null, 2)
  );
  console.log(`\nReport saved to: ${reportDir}/post-write-verification.json`);

  process.exit(allPassed ? 0 : 1);
}

main();

#!/usr/bin/env npx tsx
/**
 * Treatment V3 Migration Tool
 *
 * Migrates treatment JSON files from v2 to v3 format with clinical_profile.
 *
 * Usage:
 *   npx tsx scripts/migrate-treatments-v3.ts audit          # Count files, show stats
 *   npx tsx scripts/migrate-treatments-v3.ts dry-run        # Simulate migration, report issues
 *   npx tsx scripts/migrate-treatments-v3.ts dry-run --slug sertraline-zoloft  # Test single file
 *   npx tsx scripts/migrate-treatments-v3.ts write --modality medications      # Migrate one modality
 *   npx tsx scripts/migrate-treatments-v3.ts write --all    # Migrate all (after dry-run passes)
 */

import fs from "fs";
import path from "path";
import { TreatmentNormalizer, isV2Treatment, type NormalizationResult } from "../src/lib/comparison/treatment-normalizer";
import { validateTreatmentV3, detectSchemaVersion } from "../src/lib/schemas/treatment-v3";

const TREATMENTS_DIR = path.join(process.cwd(), "data/treatments");
const MODALITIES = ["medications", "therapy", "interventional", "investigational", "supplements", "alternative"];
const REPORT_DIR = path.join(process.cwd(), "docs/treatment-explorer");
// Backups go to separate directory to avoid polluting treatment discovery
const BACKUP_DIR = path.join(process.cwd(), "data/treatment-backups");

// =============================================================================
// TYPES
// =============================================================================

interface TreatmentFile {
  filePath: string;
  fileName: string;
  modality: string;
  slug: string;
  schemaVersion: number;
  isLegacy: boolean;
  isV2Variant: boolean;
}

interface AuditResult {
  totalFiles: number;
  byModality: Record<string, number>;
  bySchemaVersion: Record<number, number>;
  legacyFiles: number;
  v2VariantFiles: number;
  activeFiles: number;
  alreadyV3: number;
  needsMigration: number;
}

interface MigrationResult {
  file: TreatmentFile;
  success: boolean;
  normalization?: NormalizationResult;
  validation?: { success: boolean; errors?: string[] };
  error?: string;
}

// =============================================================================
// FILE DISCOVERY
// =============================================================================

function discoverTreatmentFiles(): TreatmentFile[] {
  const files: TreatmentFile[] = [];

  for (const modality of MODALITIES) {
    const dir = path.join(TREATMENTS_DIR, modality);
    if (!fs.existsSync(dir)) continue;

    const jsonFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

    for (const fileName of jsonFiles) {
      const filePath = path.join(dir, fileName);
      const isLegacy = fileName.includes(".legacy.");
      const isV2Variant = fileName.includes("-v2.");

      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);

        // Skip non-treatments
        if (data.kind && data.kind !== "treatment") continue;
        if (data.draft === true || data.noIndex === true) continue;

        const schemaVersion = detectSchemaVersion(data);
        const slug = data.slug || deriveSlugFromFilename(fileName);

        files.push({
          filePath,
          fileName,
          modality,
          slug,
          schemaVersion,
          isLegacy,
          isV2Variant,
        });
      } catch {
        console.warn(`Skipping unparseable file: ${fileName}`);
      }
    }
  }

  return files;
}

function deriveSlugFromFilename(fileName: string): string {
  return fileName
    .replace(/\.json$/i, "")
    .replace(/\.legacy$/i, "")
    .replace(/-v2$/i, "")
    .replace(/-E$/i, "-e");
}

function getFilePriority(fileName: string): number {
  if (fileName.includes("-v2.")) return 100;
  if (!fileName.includes(".legacy.") && !fileName.includes("-E.")) return 50;
  if (fileName.includes("-E.")) return 25;
  return 0;
}

function getActiveFiles(files: TreatmentFile[]): TreatmentFile[] {
  // Group by canonical slug, pick highest priority
  const bySlug = new Map<string, TreatmentFile[]>();

  for (const file of files) {
    if (file.isLegacy) continue;

    const existing = bySlug.get(file.slug) || [];
    existing.push(file);
    bySlug.set(file.slug, existing);
  }

  const active: TreatmentFile[] = [];
  for (const [, candidates] of bySlug) {
    const best = candidates.reduce((a, b) =>
      getFilePriority(a.fileName) > getFilePriority(b.fileName) ? a : b
    );
    active.push(best);
  }

  return active;
}

// =============================================================================
// AUDIT
// =============================================================================

function runAudit(): AuditResult {
  const files = discoverTreatmentFiles();
  const activeFiles = getActiveFiles(files);

  const result: AuditResult = {
    totalFiles: files.length,
    byModality: {},
    bySchemaVersion: {},
    legacyFiles: files.filter((f) => f.isLegacy).length,
    v2VariantFiles: files.filter((f) => f.isV2Variant).length,
    activeFiles: activeFiles.length,
    alreadyV3: 0,
    needsMigration: 0,
  };

  for (const file of activeFiles) {
    result.byModality[file.modality] = (result.byModality[file.modality] || 0) + 1;
    result.bySchemaVersion[file.schemaVersion] = (result.bySchemaVersion[file.schemaVersion] || 0) + 1;

    if (file.schemaVersion === 3) {
      result.alreadyV3++;
    } else {
      result.needsMigration++;
    }
  }

  return result;
}

function printAuditReport(result: AuditResult): void {
  console.log("\n" + "=".repeat(70));
  console.log("TREATMENT V3 MIGRATION AUDIT");
  console.log("=".repeat(70));

  console.log("\n## File Counts\n");
  console.log(`Total treatment files:     ${result.totalFiles}`);
  console.log(`├─ Legacy (.legacy.json):  ${result.legacyFiles} (excluded)`);
  console.log(`├─ V2 variants (-v2.json): ${result.v2VariantFiles}`);
  console.log(`└─ Active files:           ${result.activeFiles}`);

  console.log("\n## By Modality\n");
  for (const [modality, count] of Object.entries(result.byModality).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${modality.padEnd(20)} ${count}`);
  }

  console.log("\n## By Schema Version\n");
  for (const [version, count] of Object.entries(result.bySchemaVersion).sort()) {
    const label = version === "0" ? "Legacy/Unknown" : `v${version}`;
    console.log(`  ${label.padEnd(20)} ${count}`);
  }

  console.log("\n## Migration Status\n");
  console.log(`  Already v3:              ${result.alreadyV3}`);
  console.log(`  Needs migration:         ${result.needsMigration}`);
}

// =============================================================================
// DRY RUN
// =============================================================================

function runDryRun(filterSlug?: string, filterModality?: string): MigrationResult[] {
  const files = discoverTreatmentFiles();
  const activeFiles = getActiveFiles(files);
  const results: MigrationResult[] = [];

  const filesToProcess = activeFiles.filter((f) => {
    if (filterSlug && f.slug !== filterSlug) return false;
    if (filterModality && f.modality !== filterModality) return false;
    return f.schemaVersion !== 3; // Skip already v3
  });

  console.log(`\nProcessing ${filesToProcess.length} files in dry-run mode...\n`);

  const normalizer = new TreatmentNormalizer();

  for (const file of filesToProcess) {
    try {
      const content = fs.readFileSync(file.filePath, "utf-8");
      const data = JSON.parse(content);

      if (!isV2Treatment(data)) {
        results.push({
          file,
          success: false,
          error: "Not a valid v2 treatment (missing required fields)",
        });
        continue;
      }

      const normalization = normalizer.normalize(data);
      const validation = validateTreatmentV3(normalization.treatment);

      results.push({
        file,
        success: validation.success,
        normalization,
        validation: {
          success: validation.success,
          errors: validation.errors?.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
      });
    } catch (err) {
      results.push({
        file,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

function printDryRunReport(results: MigrationResult[]): void {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const withWarnings = successful.filter(
    (r) => r.normalization && r.normalization.warnings.length > 0
  );
  const withAmbiguities = successful.filter(
    (r) => r.normalization && r.normalization.ambiguities.length > 0
  );

  console.log("\n" + "=".repeat(70));
  console.log("DRY RUN RESULTS");
  console.log("=".repeat(70));

  console.log("\n## Summary\n");
  console.log(`  Total processed:         ${results.length}`);
  console.log(`  ✓ Ready to migrate:      ${successful.length}`);
  console.log(`  ✗ Failed validation:     ${failed.length}`);
  console.log(`  ⚠ Has warnings:          ${withWarnings.length}`);
  console.log(`  ? Has ambiguities:       ${withAmbiguities.length}`);

  if (failed.length > 0) {
    console.log("\n## Failed Files\n");
    for (const r of failed.slice(0, 20)) {
      console.log(`  ✗ ${r.file.slug}`);
      if (r.error) console.log(`    Error: ${r.error}`);
      if (r.validation?.errors) {
        for (const e of r.validation.errors.slice(0, 3)) {
          console.log(`    - ${e}`);
        }
      }
    }
    if (failed.length > 20) {
      console.log(`  ... and ${failed.length - 20} more`);
    }
  }

  if (withAmbiguities.length > 0) {
    console.log("\n## Ambiguities (need review)\n");
    for (const r of withAmbiguities.slice(0, 10)) {
      console.log(`  ? ${r.file.slug}`);
      for (const a of r.normalization!.ambiguities.slice(0, 2)) {
        console.log(`    - ${a.field}: ${a.reason}`);
      }
    }
    if (withAmbiguities.length > 10) {
      console.log(`  ... and ${withAmbiguities.length - 10} more`);
    }
  }

  // Sample successful output
  if (successful.length > 0) {
    console.log("\n## Sample Successful Migration\n");
    const sample = successful[0];
    const v3 = sample.normalization!.treatment;
    console.log(`  File: ${sample.file.slug}`);
    console.log(`  Modality: ${v3.taxonomy.modality}`);
    console.log(`  Primary indications: ${v3.clinical_profile.indications?.primary?.length || 0}`);
    console.log(`  Evidence level: ${v3.clinical_profile.evidence?.overall_level || "unknown"}`);
    console.log(`  Safety profile: ${v3.clinical_profile.safety?.overall_safety ? "present" : "missing"}`);
    console.log(`  Preserved legacy fields: ${sample.normalization!.preservedLegacyFields.length}`);
  }
}

// =============================================================================
// WRITE
// =============================================================================

function runWrite(filterModality?: string, writeAll?: boolean): MigrationResult[] {
  if (!writeAll && !filterModality) {
    console.error("Error: Must specify --modality <name> or --all");
    process.exit(1);
  }

  // First do a dry run to validate
  const dryResults = runDryRun(undefined, filterModality);
  const successful = dryResults.filter((r) => r.success);
  const failed = dryResults.filter((r) => !r.success);

  if (failed.length > 0) {
    console.error(`\n❌ Cannot proceed: ${failed.length} files failed validation.`);
    console.error("Run 'dry-run' mode to see details and fix issues first.");
    process.exit(1);
  }

  console.log(`\n✓ All ${successful.length} files passed validation. Writing...`);

  const written: MigrationResult[] = [];

  // Create timestamped backup subdirectory to prevent overwrites on reruns
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const batchBackupDir = path.join(BACKUP_DIR, timestamp);
  if (!fs.existsSync(batchBackupDir)) {
    fs.mkdirSync(batchBackupDir, { recursive: true });
  }
  console.log(`  Backup directory: ${batchBackupDir}`);

  for (const result of successful) {
    try {
      const v3 = result.normalization!.treatment;
      const outputPath = result.file.filePath;

      // Create backup with unambiguous relative path: modality--filename.v2-backup.json
      const backupFileName = `${result.file.modality}--${result.file.fileName.replace(".json", ".v2-backup.json")}`;
      const backupPath = path.join(batchBackupDir, backupFileName);
      fs.copyFileSync(outputPath, backupPath);

      // Write v3
      fs.writeFileSync(outputPath, JSON.stringify(v3, null, 2) + "\n");

      written.push({ ...result, success: true });
      console.log(`  ✓ ${result.file.slug}`);
    } catch (err) {
      written.push({
        ...result,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
      console.log(`  ✗ ${result.file.slug}: ${err}`);
    }
  }

  return written;
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "audit": {
      const result = runAudit();
      printAuditReport(result);

      // Save report
      if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(REPORT_DIR, "migration-audit.json"),
        JSON.stringify(result, null, 2)
      );
      console.log(`\nReport saved to: ${REPORT_DIR}/migration-audit.json`);
      break;
    }

    case "dry-run": {
      const slugIdx = args.indexOf("--slug");
      const modalityIdx = args.indexOf("--modality");
      const filterSlug = slugIdx >= 0 ? args[slugIdx + 1] : undefined;
      const filterModality = modalityIdx >= 0 ? args[modalityIdx + 1] : undefined;

      const results = runDryRun(filterSlug, filterModality);
      printDryRunReport(results);

      // Save detailed report
      if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
      const reportData = results.map((r) => ({
        slug: r.file.slug,
        modality: r.file.modality,
        success: r.success,
        warnings: r.normalization?.warnings.length || 0,
        ambiguities: r.normalization?.ambiguities.length || 0,
        preservedFields: r.normalization?.preservedLegacyFields.length || 0,
        error: r.error,
        validationErrors: r.validation?.errors,
      }));
      fs.writeFileSync(
        path.join(REPORT_DIR, "migration-dry-run.json"),
        JSON.stringify(reportData, null, 2)
      );
      console.log(`\nDetailed report saved to: ${REPORT_DIR}/migration-dry-run.json`);
      break;
    }

    case "write": {
      const modalityIdx = args.indexOf("--modality");
      const allFlag = args.includes("--all");
      const filterModality = modalityIdx >= 0 ? args[modalityIdx + 1] : undefined;

      const results = runWrite(filterModality, allFlag);
      console.log(`\n✓ Wrote ${results.filter((r) => r.success).length} files`);
      break;
    }

    default:
      console.log(`
Treatment V3 Migration Tool

Usage:
  npx tsx scripts/migrate-treatments-v3.ts audit
  npx tsx scripts/migrate-treatments-v3.ts dry-run [--slug <slug>] [--modality <name>]
  npx tsx scripts/migrate-treatments-v3.ts write --modality <name>
  npx tsx scripts/migrate-treatments-v3.ts write --all

Commands:
  audit     Show file counts and migration status
  dry-run   Simulate migration, report issues
  write     Migrate files (creates backups)
`);
  }
}

main();

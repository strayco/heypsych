#!/usr/bin/env npx tsx
/**
 * Treatment Reconciliation Report
 *
 * Produces exact reconciliation of all treatment files with:
 * - canonical slug
 * - modality
 * - selected source file
 * - source schema/version
 * - manifest eligibility
 * - migration eligibility
 * - migration status
 * - exclusion reason, if any
 */

import fs from "fs";
import path from "path";
import { detectSchemaVersion } from "../src/lib/schemas/treatment-v3";
import { isV2Treatment, TreatmentNormalizer } from "../src/lib/comparison/treatment-normalizer";
import { validateTreatmentV3 } from "../src/lib/schemas/treatment-v3";

const TREATMENTS_DIR = path.join(process.cwd(), "data/treatments");
const MODALITY_DIRS = ["medications", "therapy", "interventional", "investigational", "supplements", "alternative"];
const REPORT_DIR = path.join(process.cwd(), "docs/treatment-explorer");

interface FileRecord {
  filePath: string;
  fileName: string;
  directoryModality: string;
  canonicalSlug: string | null;
  name: string | null;
  kind: string | null;
  schemaVersion: number;
  isLegacy: boolean;
  isV2Variant: boolean;
  isDraft: boolean;
  isNoIndex: boolean;
  hasSLugField: boolean;
  priority: number;
  manifestEligible: boolean;
  migrationEligible: boolean;
  migrationStatus: "ready" | "already_v3" | "excluded" | "blocked" | "invalid";
  exclusionReason: string | null;
  validationPassed: boolean | null;
  ambiguityCount: number;
  parseError: string | null;
}

interface ReconciliationReport {
  summary: {
    totalFiles: number;
    legacyFiles: number;
    nonLegacyFiles: number;
    uniqueCanonicalSlugs: number;
    manifestEligible: number;
    migrationEligible: number;
    migrationReady: number;
    alreadyV3: number;
    excluded: number;
    blocked: number;
    invalid: number;
    byModality: Record<string, number>;
    byExclusionReason: Record<string, number>;
  };
  records: FileRecord[];
  canonicalIndex: Record<string, {
    slug: string;
    modality: string;
    sourceFile: string;
    schemaVersion: number;
    manifestEligible: boolean;
    migrationEligible: boolean;
    migrationStatus: string;
    exclusionReason: string | null;
  }>;
}

function getFilePriority(fileName: string): number {
  if (fileName.includes("-v2.")) return 100;
  if (!fileName.includes(".legacy.") && !fileName.includes("-E.")) return 50;
  if (fileName.includes("-E.")) return 25;
  return 0;
}

function scanAllFiles(): FileRecord[] {
  const records: FileRecord[] = [];

  for (const modality of MODALITY_DIRS) {
    const dir = path.join(TREATMENTS_DIR, modality);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

    for (const fileName of files) {
      const filePath = path.join(dir, fileName);
      const isLegacy = fileName.includes(".legacy.");
      const isV2Variant = fileName.includes("-v2.");
      const priority = getFilePriority(fileName);

      const record: FileRecord = {
        filePath,
        fileName,
        directoryModality: modality,
        canonicalSlug: null,
        name: null,
        kind: null,
        schemaVersion: 0,
        isLegacy,
        isV2Variant,
        isDraft: false,
        isNoIndex: false,
        hasSLugField: false,
        priority,
        manifestEligible: false,
        migrationEligible: false,
        migrationStatus: "excluded",
        exclusionReason: null,
        validationPassed: null,
        ambiguityCount: 0,
        parseError: null,
      };

      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);

        record.kind = data.kind || null;
        record.name = data.name || null;
        record.hasSLugField = !!data.slug;
        record.canonicalSlug = data.slug || null;
        record.isDraft = data.draft === true;
        record.isNoIndex = data.noIndex === true;
        record.schemaVersion = detectSchemaVersion(data);

        // Determine eligibility and exclusion reasons
        if (isLegacy) {
          record.exclusionReason = "legacy_file";
        } else if (data.kind && data.kind !== "treatment") {
          record.exclusionReason = `wrong_kind:${data.kind}`;
        } else if (data.draft === true) {
          record.exclusionReason = "draft";
        } else if (data.noIndex === true) {
          record.exclusionReason = "noIndex";
        } else if (!data.slug) {
          record.exclusionReason = "missing_slug_field";
        } else {
          // Eligible for manifest and migration
          record.manifestEligible = true;
          record.migrationEligible = record.schemaVersion !== 3;

          if (record.schemaVersion === 3) {
            record.migrationStatus = "already_v3";
          } else if (isV2Treatment(data)) {
            // Test validation
            const normalizer = new TreatmentNormalizer();
            const result = normalizer.normalize(data);
            const validation = validateTreatmentV3(result.treatment);

            record.validationPassed = validation.success;
            record.ambiguityCount = result.ambiguities.length;

            if (validation.success) {
              record.migrationStatus = "ready";
            } else {
              record.migrationStatus = "blocked";
              record.exclusionReason = `validation_failed:${validation.errors?.issues[0]?.path.join(".")}`;
            }
          } else {
            record.migrationStatus = "invalid";
            record.exclusionReason = "not_v2_treatment";
          }
        }
      } catch (err) {
        record.parseError = err instanceof Error ? err.message : String(err);
        record.exclusionReason = "parse_error";
        record.migrationStatus = "invalid";
      }

      records.push(record);
    }
  }

  return records;
}

function buildCanonicalIndex(records: FileRecord[]): ReconciliationReport["canonicalIndex"] {
  const candidates = new Map<string, FileRecord[]>();

  // Group by canonical slug
  for (const record of records) {
    if (!record.canonicalSlug || !record.manifestEligible) continue;

    const existing = candidates.get(record.canonicalSlug) || [];
    existing.push(record);
    candidates.set(record.canonicalSlug, existing);
  }

  // Select best candidate for each slug
  const index: ReconciliationReport["canonicalIndex"] = {};

  for (const [slug, recs] of candidates) {
    const best = recs.reduce((a, b) => (a.priority > b.priority ? a : b));

    index[slug] = {
      slug,
      modality: best.directoryModality,
      sourceFile: best.fileName,
      schemaVersion: best.schemaVersion,
      manifestEligible: best.manifestEligible,
      migrationEligible: best.migrationEligible,
      migrationStatus: best.migrationStatus,
      exclusionReason: best.exclusionReason,
    };
  }

  return index;
}

function generateReport(): ReconciliationReport {
  const records = scanAllFiles();
  const canonicalIndex = buildCanonicalIndex(records);

  const summary = {
    totalFiles: records.length,
    legacyFiles: records.filter((r) => r.isLegacy).length,
    nonLegacyFiles: records.filter((r) => !r.isLegacy).length,
    uniqueCanonicalSlugs: Object.keys(canonicalIndex).length,
    manifestEligible: records.filter((r) => r.manifestEligible).length,
    migrationEligible: records.filter((r) => r.migrationEligible).length,
    migrationReady: records.filter((r) => r.migrationStatus === "ready").length,
    alreadyV3: records.filter((r) => r.migrationStatus === "already_v3").length,
    excluded: records.filter((r) => r.migrationStatus === "excluded").length,
    blocked: records.filter((r) => r.migrationStatus === "blocked").length,
    invalid: records.filter((r) => r.migrationStatus === "invalid").length,
    byModality: {} as Record<string, number>,
    byExclusionReason: {} as Record<string, number>,
  };

  // Count by modality (for canonical entries only)
  for (const entry of Object.values(canonicalIndex)) {
    summary.byModality[entry.modality] = (summary.byModality[entry.modality] || 0) + 1;
  }

  // Count by exclusion reason
  for (const record of records) {
    if (record.exclusionReason) {
      const reason = record.exclusionReason.split(":")[0];
      summary.byExclusionReason[reason] = (summary.byExclusionReason[reason] || 0) + 1;
    }
  }

  return { summary, records, canonicalIndex };
}

function printReport(report: ReconciliationReport): void {
  console.log("\n" + "=".repeat(80));
  console.log("TREATMENT RECONCILIATION REPORT");
  console.log("=".repeat(80));

  console.log("\n## File Summary\n");
  console.log(`Total files:               ${report.summary.totalFiles}`);
  console.log(`├─ Legacy files:           ${report.summary.legacyFiles}`);
  console.log(`└─ Non-legacy files:       ${report.summary.nonLegacyFiles}`);

  console.log("\n## Canonical Slug Resolution\n");
  console.log(`Unique canonical slugs:    ${report.summary.uniqueCanonicalSlugs}`);
  console.log(`Manifest eligible:         ${report.summary.manifestEligible}`);

  console.log("\n## Migration Status\n");
  console.log(`Migration eligible:        ${report.summary.migrationEligible}`);
  console.log(`├─ Ready to migrate:       ${report.summary.migrationReady}`);
  console.log(`├─ Already v3:             ${report.summary.alreadyV3}`);
  console.log(`├─ Blocked (validation):   ${report.summary.blocked}`);
  console.log(`└─ Invalid:                ${report.summary.invalid}`);
  console.log(`Excluded:                  ${report.summary.excluded}`);

  console.log("\n## By Modality (canonical only)\n");
  for (const [modality, count] of Object.entries(report.summary.byModality).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${modality.padEnd(20)} ${count}`);
  }

  console.log("\n## By Exclusion Reason\n");
  for (const [reason, count] of Object.entries(report.summary.byExclusionReason).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason.padEnd(25)} ${count}`);
  }

  // Reconciliation equation
  const migratedCandidates = report.summary.migrationReady + report.summary.alreadyV3;
  const intentionallyExcluded = report.summary.legacyFiles;
  const blocked = report.summary.blocked + report.summary.invalid;
  const other = report.summary.excluded - report.summary.legacyFiles;

  console.log("\n## Reconciliation Equation\n");
  console.log(`  Migration candidates:    ${migratedCandidates}`);
  console.log(`  + Legacy (excluded):     ${intentionallyExcluded}`);
  console.log(`  + Blocked/Invalid:       ${blocked}`);
  console.log(`  + Other excluded:        ${other}`);
  console.log(`  ─────────────────────────`);
  console.log(`  = Total non-legacy:      ${report.summary.nonLegacyFiles}`);
  console.log(`  Unique canonical slugs:  ${report.summary.uniqueCanonicalSlugs}`);

  // List blocked files
  const blockedRecords = report.records.filter((r) => r.migrationStatus === "blocked");
  if (blockedRecords.length > 0) {
    console.log("\n## Blocked Files (validation failures)\n");
    for (const r of blockedRecords.slice(0, 10)) {
      console.log(`  ${r.canonicalSlug}: ${r.exclusionReason}`);
    }
  }

  // List excluded (non-legacy)
  const otherExcluded = report.records.filter(
    (r) => r.migrationStatus === "excluded" && !r.isLegacy
  );
  if (otherExcluded.length > 0) {
    console.log("\n## Other Excluded Files\n");
    for (const r of otherExcluded) {
      console.log(`  ${r.fileName}: ${r.exclusionReason}`);
    }
  }
}

// Main
const report = generateReport();
printReport(report);

// Save full report
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(REPORT_DIR, "reconciliation-report.json"),
  JSON.stringify(report, null, 2)
);
console.log(`\nFull report saved to: ${REPORT_DIR}/reconciliation-report.json`);

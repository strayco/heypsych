/**
 * Slug Canonicalization Audit
 *
 * Analyzes the relationship between filenames and internal slugs
 * to identify:
 * 1. Files where filename != internal slug
 * 2. Legacy files that should be excluded
 * 3. Duplicate slugs across files
 * 4. Files missing slug fields
 */

import fs from "fs";
import path from "path";

const TREATMENTS_DIR = path.join(process.cwd(), "data/treatments");

interface FileAuditResult {
  filePath: string;
  fileName: string;
  fileNameSlug: string; // Derived from filename
  internalSlug: string | null; // From JSON slug field
  modality: string;
  isLegacy: boolean;
  isV2: boolean;
  slugMismatch: boolean;
  name: string | null;
}

interface AuditSummary {
  totalFiles: number;
  legacyFiles: number;
  v2Files: number;
  plainFiles: number;
  filesWithSlugMismatch: number;
  filesMissingSlug: number;
  duplicateSlugs: Map<string, string[]>;
  canonicalSlugToFile: Map<string, string[]>;
  fileNameToCanonicalSlug: Map<string, string>;
}

function deriveSlugFromFilename(fileName: string): string {
  return fileName
    .replace(/\.json$/i, "")
    .replace(/\.legacy$/i, "")
    .replace(/-v2$/i, "")
    .replace(/-E$/i, "-e"); // Normalize -E suffix
}

function auditFile(filePath: string, modality: string): FileAuditResult | null {
  try {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    // Skip non-treatment files
    if (data.kind !== "treatment") {
      return null;
    }

    const isLegacy = fileName.includes(".legacy.");
    const isV2 = fileName.includes("-v2.");
    const fileNameSlug = deriveSlugFromFilename(fileName);
    const internalSlug = data.slug || null;
    const slugMismatch = internalSlug !== null && fileNameSlug !== internalSlug;

    return {
      filePath,
      fileName,
      fileNameSlug,
      internalSlug,
      modality,
      isLegacy,
      isV2,
      slugMismatch,
      name: data.name || null,
    };
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return null;
  }
}

function runAudit(): void {
  const results: FileAuditResult[] = [];
  const summary: AuditSummary = {
    totalFiles: 0,
    legacyFiles: 0,
    v2Files: 0,
    plainFiles: 0,
    filesWithSlugMismatch: 0,
    filesMissingSlug: 0,
    duplicateSlugs: new Map(),
    canonicalSlugToFile: new Map(),
    fileNameToCanonicalSlug: new Map(),
  };

  // Process all modality directories
  const modalities = fs.readdirSync(TREATMENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const modality of modalities) {
    const dir = path.join(TREATMENTS_DIR, modality);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(dir, file);
      const result = auditFile(filePath, modality);

      if (!result) continue;

      results.push(result);
      summary.totalFiles++;

      if (result.isLegacy) summary.legacyFiles++;
      else if (result.isV2) summary.v2Files++;
      else summary.plainFiles++;

      if (result.slugMismatch) summary.filesWithSlugMismatch++;
      if (!result.internalSlug) summary.filesMissingSlug++;

      // Track canonical slugs
      const canonicalSlug = result.internalSlug || result.fileNameSlug;
      if (!summary.canonicalSlugToFile.has(canonicalSlug)) {
        summary.canonicalSlugToFile.set(canonicalSlug, []);
      }
      summary.canonicalSlugToFile.get(canonicalSlug)!.push(result.filePath);

      // Track filename to canonical slug mapping
      summary.fileNameToCanonicalSlug.set(result.fileNameSlug, canonicalSlug);
    }
  }

  // Find duplicate slugs
  for (const [slug, files] of summary.canonicalSlugToFile.entries()) {
    if (files.length > 1) {
      summary.duplicateSlugs.set(slug, files);
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("SLUG CANONICALIZATION AUDIT REPORT");
  console.log("=".repeat(80));

  console.log("\n## File Counts\n");
  console.log(`Total files: ${summary.totalFiles}`);
  console.log(`Legacy files (.legacy.json): ${summary.legacyFiles}`);
  console.log(`V2 files (-v2.json): ${summary.v2Files}`);
  console.log(`Plain files: ${summary.plainFiles}`);
  console.log(`Unique canonical slugs: ${summary.canonicalSlugToFile.size}`);

  console.log("\n## Slug Issues\n");
  console.log(`Files with slug mismatch (filename != internal slug): ${summary.filesWithSlugMismatch}`);
  console.log(`Files missing slug field: ${summary.filesMissingSlug}`);
  console.log(`Duplicate slugs (same slug, multiple files): ${summary.duplicateSlugs.size}`);

  // Show files with slug mismatch
  if (summary.filesWithSlugMismatch > 0) {
    console.log("\n## Files with Slug Mismatch\n");
    const mismatches = results.filter((r) => r.slugMismatch).slice(0, 20);
    for (const r of mismatches) {
      console.log(`- ${r.fileName}`);
      console.log(`  Filename slug: ${r.fileNameSlug}`);
      console.log(`  Internal slug: ${r.internalSlug}`);
      console.log(`  Name: ${r.name}`);
      console.log("");
    }
    if (summary.filesWithSlugMismatch > 20) {
      console.log(`  ... and ${summary.filesWithSlugMismatch - 20} more`);
    }
  }

  // Show duplicate slugs
  if (summary.duplicateSlugs.size > 0) {
    console.log("\n## Duplicate Slugs (Same canonical slug, multiple files)\n");
    for (const [slug, files] of summary.duplicateSlugs.entries()) {
      console.log(`Slug: ${slug}`);
      for (const file of files) {
        const relPath = path.relative(TREATMENTS_DIR, file);
        console.log(`  - ${relPath}`);
      }
      console.log("");
    }
  }

  // Show files missing slug
  if (summary.filesMissingSlug > 0) {
    console.log("\n## Files Missing Slug Field\n");
    const missing = results.filter((r) => !r.internalSlug).slice(0, 10);
    for (const r of missing) {
      console.log(`- ${r.fileName} (derived: ${r.fileNameSlug})`);
    }
    if (summary.filesMissingSlug > 10) {
      console.log(`  ... and ${summary.filesMissingSlug - 10} more`);
    }
  }

  // Generate canonical slug resolution map
  console.log("\n## Canonical Slug Resolution Strategy\n");
  console.log("The manifest should:");
  console.log("1. Use internal `slug` field as the canonical identifier");
  console.log("2. Exclude .legacy.json files from the manifest");
  console.log("3. Create aliases from filename-derived slugs to canonical slugs");
  console.log("4. When a canonical slug has multiple files (legacy + v2), prefer v2");

  // Count active files (non-legacy)
  const activeFiles = results.filter((r) => !r.isLegacy);
  const activeSlugs = new Set(activeFiles.map((r) => r.internalSlug || r.fileNameSlug));
  console.log(`\nActive (non-legacy) files: ${activeFiles.length}`);
  console.log(`Unique active slugs: ${activeSlugs.size}`);

  // Generate alias map for active files
  console.log("\n## Alias Resolution Map (filename slug -> canonical slug)\n");
  const aliases: Array<{ from: string; to: string; reason: string }> = [];

  for (const r of activeFiles) {
    if (r.slugMismatch && r.internalSlug) {
      aliases.push({
        from: r.fileNameSlug,
        to: r.internalSlug,
        reason: "internal slug differs from filename",
      });
    }
    // Also add -v2 stripped alias
    if (r.isV2 && r.internalSlug) {
      const v2Slug = r.fileNameSlug;
      if (v2Slug !== r.internalSlug) {
        aliases.push({
          from: v2Slug,
          to: r.internalSlug,
          reason: "v2 filename suffix",
        });
      }
    }
  }

  console.log(`Total aliases needed: ${aliases.length}`);
  for (const a of aliases.slice(0, 20)) {
    console.log(`  ${a.from} -> ${a.to} (${a.reason})`);
  }
  if (aliases.length > 20) {
    console.log(`  ... and ${aliases.length - 20} more`);
  }

  // Save detailed report
  const reportPath = path.join(process.cwd(), "docs/treatment-explorer/slug-canonicalization-report.json");
  const report = {
    summary: {
      totalFiles: summary.totalFiles,
      legacyFiles: summary.legacyFiles,
      v2Files: summary.v2Files,
      plainFiles: summary.plainFiles,
      uniqueCanonicalSlugs: summary.canonicalSlugToFile.size,
      filesWithSlugMismatch: summary.filesWithSlugMismatch,
      filesMissingSlug: summary.filesMissingSlug,
      duplicateSlugs: summary.duplicateSlugs.size,
      activeFiles: activeFiles.length,
      uniqueActiveSlugs: activeSlugs.size,
    },
    duplicateSlugs: Object.fromEntries(summary.duplicateSlugs),
    aliases,
    fileNameToCanonicalSlug: Object.fromEntries(summary.fileNameToCanonicalSlug),
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

runAudit();

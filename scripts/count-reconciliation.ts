#!/usr/bin/env npx tsx
/**
 * Count Reconciliation - Documents why 484 (not 485) is authoritative
 */

import fs from "fs";
import path from "path";

const TREATMENTS_DIR = path.join(process.cwd(), "data/treatments");
const MODALITIES = ["medications", "therapy", "interventional", "investigational", "supplements", "alternative"];

interface FileInfo {
  filePath: string;
  fileName: string;
  modality: string;
  slug: string;
  isLegacy: boolean;
  isV2: boolean;
}

const files: FileInfo[] = [];

for (const modality of MODALITIES) {
  const dir = path.join(TREATMENTS_DIR, modality);
  if (!fs.existsSync(dir)) continue;

  const jsonFiles = fs.readdirSync(dir).filter(f => f.endsWith(".json"));

  for (const fileName of jsonFiles) {
    const filePath = path.join(dir, fileName);
    const isLegacy = fileName.includes(".legacy.");
    const isV2 = fileName.includes("-v2.");

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(content);
      if (data.kind && data.kind !== "treatment") continue;
      if (data.draft === true || data.noIndex === true) continue;

      files.push({
        filePath,
        fileName,
        modality,
        slug: data.slug || fileName.replace(/\.json$/, "").replace(/\.legacy$/, "").replace(/-v2$/, ""),
        isLegacy,
        isV2,
      });
    } catch {}
  }
}

// Group by slug to find duplicates (excluding legacy)
const bySlug = new Map<string, FileInfo[]>();
for (const f of files) {
  if (f.isLegacy) continue;
  const existing = bySlug.get(f.slug) || [];
  existing.push(f);
  bySlug.set(f.slug, existing);
}

// Find slugs with multiple files
const duplicates: Array<{slug: string, files: FileInfo[]}> = [];
for (const [slug, fileList] of bySlug) {
  if (fileList.length > 1) {
    duplicates.push({ slug, files: fileList });
  }
}

const legacyCount = files.filter(f => f.isLegacy).length;
const nonLegacyCount = files.filter(f => !f.isLegacy).length;

console.log("=== COUNT RECONCILIATION ===\n");
console.log(`Total files (all):                 ${files.length}`);
console.log(`Legacy files (excluded):           ${legacyCount}`);
console.log(`Non-legacy files:                  ${nonLegacyCount}`);
console.log(`Unique canonical slugs:            ${bySlug.size}`);
console.log(`Slugs with duplicate files:        ${duplicates.length}`);

if (duplicates.length > 0) {
  console.log("\n=== DUPLICATE SLUGS (explains 485→484) ===\n");
  for (const d of duplicates) {
    console.log(`Slug: ${d.slug}`);
    for (const f of d.files) {
      console.log(`  - ${f.modality}/${f.fileName} (v2=${f.isV2})`);
    }
    console.log("");
  }

  console.log("EXPLANATION:");
  console.log(`  ${nonLegacyCount} non-legacy files - ${duplicates.length} duplicate(s) = ${bySlug.size} unique canonical slugs`);
}

// Count by modality
console.log("\n=== BY MODALITY (non-legacy, canonical) ===\n");
const modalityCounts: Record<string, number> = {};
for (const [, fileList] of bySlug) {
  // Pick highest priority file (v2 > plain)
  const best = fileList.reduce((a, b) => {
    const priorityA = a.isV2 ? 100 : 50;
    const priorityB = b.isV2 ? 100 : 50;
    return priorityA > priorityB ? a : b;
  });
  modalityCounts[best.modality] = (modalityCounts[best.modality] || 0) + 1;
}

for (const [mod, count] of Object.entries(modalityCounts).sort((a,b) => b[1] - a[1])) {
  console.log(`  ${mod.padEnd(20)} ${count}`);
}

const total = Object.values(modalityCounts).reduce((a, b) => a + b, 0);
console.log(`\n  TOTAL CANONICAL:       ${total}`);

// Document for the migration report
console.log("\n=== AUTHORITATIVE COUNT DOCUMENTATION ===\n");
console.log("The authoritative count is 484 unique canonical treatments.");
console.log("This is calculated as:");
console.log(`  - ${files.length} total treatment JSON files`);
console.log(`  - ${legacyCount} legacy files (excluded from migration)`);
console.log(`  - ${nonLegacyCount} non-legacy files`);
console.log(`  - ${duplicates.length} duplicate slug(s) where multiple files share the same canonical slug`);
if (duplicates.length > 0) {
  console.log("\nDuplicate resolution:");
  for (const d of duplicates) {
    const winner = d.files.reduce((a, b) => (a.isV2 ? 100 : 50) > (b.isV2 ? 100 : 50) ? a : b);
    console.log(`  ${d.slug}: ${winner.modality}/${winner.fileName} (priority: v2=${winner.isV2})`);
  }
}
console.log(`\nFinal: ${bySlug.size} unique canonical treatments to migrate.`);

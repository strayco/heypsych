/**
 * Comprehensive Treatment Content Audit
 *
 * This script performs a complete census of all treatment JSON files to:
 * - Count files by modality
 * - Detect schema versions
 * - Map all observed keys and their shapes
 * - Identify section types
 * - Detect inconsistencies and conflicts
 * - Generate audit reports for migration planning
 */

import * as fs from "fs";
import * as path from "path";

const TREATMENTS_DIR = path.join(process.cwd(), "data/treatments");
const REPORTS_DIR = path.join(process.cwd(), "docs/treatment-explorer");

interface FieldInfo {
  count: number;
  types: Set<string>;
  examples: any[];
  paths: string[];
}

interface SectionTypeInfo {
  count: number;
  modalities: Set<string>;
  hasHeading: number;
  hasText: number;
  hasItems: number;
  exampleFiles: string[];
}

interface AuditResult {
  summary: {
    totalFiles: number;
    byModality: Record<string, number>;
    bySchemaVersion: Record<string, number>;
    filesWithErrors: number;
  };
  topLevelKeys: Record<string, FieldInfo>;
  metadataKeys: Record<string, FieldInfo>;
  clinicalMetadataKeys: Record<string, FieldInfo>;
  sectionTypes: Record<string, SectionTypeInfo>;
  modalitySpecificFields: Record<string, Record<string, number>>;
  inconsistencies: {
    scalarVsArray: Array<{ field: string; files: string[] }>;
    stringVsObject: Array<{ field: string; files: string[] }>;
    missingRequiredFields: Array<{ file: string; missing: string[] }>;
    unusualStructures: Array<{ file: string; issue: string }>;
  };
  editorialCoverage: {
    hasReview: number;
    hasReviewDate: number;
    hasReviewerIds: number;
    noEditorial: string[];
  };
  sourceCoverage: {
    hasReferences: number;
    hasCitations: number;
    noSources: string[];
  };
  representativeFixtures: {
    medications: string[];
    therapy: string[];
    interventional: string[];
    supplements: string[];
    alternative: string[];
    investigational: string[];
    sparse: string[];
    detailed: string[];
  };
}

function getFieldType(value: any): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function deepKeys(obj: any, prefix = ""): Array<{ path: string; type: string; value: any }> {
  const results: Array<{ path: string; type: string; value: any }> = [];

  if (obj === null || typeof obj !== "object") {
    return results;
  }

  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    const type = getFieldType(value);

    results.push({ path: fullPath, type, value });

    if (type === "object" && !Array.isArray(value)) {
      results.push(...deepKeys(value, fullPath));
    } else if (type === "array" && value.length > 0 && typeof value[0] === "object") {
      // Sample first array item
      results.push(...deepKeys(value[0], `${fullPath}[]`));
    }
  }

  return results;
}

function detectModality(filePath: string, data: any): string {
  // Check explicit type field first
  if (data.type) return data.type;

  // Fall back to directory structure
  const parts = filePath.split(path.sep);
  const treatmentsIdx = parts.indexOf("treatments");
  if (treatmentsIdx >= 0 && parts[treatmentsIdx + 1]) {
    return parts[treatmentsIdx + 1];
  }

  return "unknown";
}

function detectSchemaVersion(data: any): string {
  if (data.schema_version) return `v${data.schema_version}`;

  // Infer from structure
  if (data.clinical_profile) return "v3";
  if (data.clinical_metadata && data.sections) return "v2";
  if (data.sections) return "v1";

  return "legacy";
}

function analyzeFile(filePath: string, audit: AuditResult): void {
  let data: any;

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    data = JSON.parse(content);
  } catch (err) {
    audit.summary.filesWithErrors++;
    audit.inconsistencies.unusualStructures.push({
      file: filePath,
      issue: `Parse error: ${(err as Error).message}`,
    });
    return;
  }

  const modality = detectModality(filePath, data);
  const schemaVersion = detectSchemaVersion(data);
  const relativePath = path.relative(TREATMENTS_DIR, filePath);

  // Count by modality and schema version
  audit.summary.byModality[modality] = (audit.summary.byModality[modality] || 0) + 1;
  audit.summary.bySchemaVersion[schemaVersion] = (audit.summary.bySchemaVersion[schemaVersion] || 0) + 1;

  // Initialize modality-specific tracking
  if (!audit.modalitySpecificFields[modality]) {
    audit.modalitySpecificFields[modality] = {};
  }

  // Track top-level keys
  for (const key of Object.keys(data)) {
    if (!audit.topLevelKeys[key]) {
      audit.topLevelKeys[key] = { count: 0, types: new Set(), examples: [], paths: [] };
    }
    audit.topLevelKeys[key].count++;
    audit.topLevelKeys[key].types.add(getFieldType(data[key]));
    if (audit.topLevelKeys[key].examples.length < 3) {
      audit.topLevelKeys[key].examples.push(data[key]);
    }

    // Track modality-specific fields
    audit.modalitySpecificFields[modality][key] = (audit.modalitySpecificFields[modality][key] || 0) + 1;
  }

  // Track metadata keys
  if (data.metadata && typeof data.metadata === "object") {
    for (const key of Object.keys(data.metadata)) {
      if (!audit.metadataKeys[key]) {
        audit.metadataKeys[key] = { count: 0, types: new Set(), examples: [], paths: [] };
      }
      audit.metadataKeys[key].count++;
      audit.metadataKeys[key].types.add(getFieldType(data.metadata[key]));
      if (audit.metadataKeys[key].examples.length < 3) {
        audit.metadataKeys[key].examples.push(data.metadata[key]);
      }
    }
  }

  // Track clinical_metadata keys
  if (data.clinical_metadata && typeof data.clinical_metadata === "object") {
    for (const key of Object.keys(data.clinical_metadata)) {
      if (!audit.clinicalMetadataKeys[key]) {
        audit.clinicalMetadataKeys[key] = { count: 0, types: new Set(), examples: [], paths: [] };
      }
      audit.clinicalMetadataKeys[key].count++;
      audit.clinicalMetadataKeys[key].types.add(getFieldType(data.clinical_metadata[key]));
      if (audit.clinicalMetadataKeys[key].examples.length < 3) {
        audit.clinicalMetadataKeys[key].examples.push(data.clinical_metadata[key]);
      }
    }
  }

  // Analyze sections
  if (Array.isArray(data.sections)) {
    for (const section of data.sections) {
      if (section && typeof section === "object" && section.type) {
        const sectionType = section.type;

        if (!audit.sectionTypes[sectionType]) {
          audit.sectionTypes[sectionType] = {
            count: 0,
            modalities: new Set(),
            hasHeading: 0,
            hasText: 0,
            hasItems: 0,
            exampleFiles: [],
          };
        }

        audit.sectionTypes[sectionType].count++;
        audit.sectionTypes[sectionType].modalities.add(modality);
        if (section.heading) audit.sectionTypes[sectionType].hasHeading++;
        if (section.text) audit.sectionTypes[sectionType].hasText++;
        if (section.items) audit.sectionTypes[sectionType].hasItems++;
        if (audit.sectionTypes[sectionType].exampleFiles.length < 3) {
          audit.sectionTypes[sectionType].exampleFiles.push(relativePath);
        }
      }
    }
  }

  // Check editorial coverage
  if (data.editorial) {
    if (data.editorial.lastReviewed || data.editorial.lastUpdated) {
      audit.editorialCoverage.hasReview++;
    }
    if (data.editorial.lastReviewed) {
      audit.editorialCoverage.hasReviewDate++;
    }
    if (data.editorial.medicalReviewerIds?.length > 0) {
      audit.editorialCoverage.hasReviewerIds++;
    }
  } else {
    audit.editorialCoverage.noEditorial.push(relativePath);
  }

  // Check source coverage
  const hasReferencesSection = data.sections?.some((s: any) => s.type === "references" && s.items?.length > 0);
  const hasCitations = data.editorial?.citations?.length > 0;

  if (hasReferencesSection) {
    audit.sourceCoverage.hasReferences++;
  }
  if (hasCitations) {
    audit.sourceCoverage.hasCitations++;
  }
  if (!hasReferencesSection && !hasCitations) {
    audit.sourceCoverage.noSources.push(relativePath);
  }

  // Identify representative fixtures
  const fileSize = fs.statSync(filePath).size;
  const sectionCount = data.sections?.length || 0;

  // Track by modality
  const modalityFixtures = audit.representativeFixtures[modality as keyof typeof audit.representativeFixtures];
  if (modalityFixtures && modalityFixtures.length < 5) {
    modalityFixtures.push(relativePath);
  }

  // Track sparse vs detailed
  if (fileSize < 2000 || sectionCount < 3) {
    if (audit.representativeFixtures.sparse.length < 10) {
      audit.representativeFixtures.sparse.push(relativePath);
    }
  }
  if (fileSize > 15000 || sectionCount > 10) {
    if (audit.representativeFixtures.detailed.length < 10) {
      audit.representativeFixtures.detailed.push(relativePath);
    }
  }

  // Check for missing required fields
  const requiredFields = ["slug", "name", "type"];
  const missing = requiredFields.filter(f => !data[f]);
  if (missing.length > 0) {
    audit.inconsistencies.missingRequiredFields.push({ file: relativePath, missing });
  }
}

function getAllTreatmentFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory() && entry.name !== "compare") {
        // Skip compare directory for now - different structure
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function serializeForJson(audit: AuditResult): any {
  // Convert Sets to arrays for JSON serialization
  const serialized: any = {
    ...audit,
    topLevelKeys: Object.fromEntries(
      Object.entries(audit.topLevelKeys).map(([k, v]) => [k, { ...v, types: Array.from(v.types) }])
    ),
    metadataKeys: Object.fromEntries(
      Object.entries(audit.metadataKeys).map(([k, v]) => [k, { ...v, types: Array.from(v.types) }])
    ),
    clinicalMetadataKeys: Object.fromEntries(
      Object.entries(audit.clinicalMetadataKeys).map(([k, v]) => [k, { ...v, types: Array.from(v.types) }])
    ),
    sectionTypes: Object.fromEntries(
      Object.entries(audit.sectionTypes).map(([k, v]) => [k, { ...v, modalities: Array.from(v.modalities) }])
    ),
  };
  return serialized;
}

function generateHumanReadableReport(audit: AuditResult): string {
  const lines: string[] = [];

  lines.push("# Treatment Content Audit Report");
  lines.push(`Generated: ${new Date().toISOString()}\n`);

  lines.push("## Summary\n");
  lines.push(`- **Total Files**: ${audit.summary.totalFiles}`);
  lines.push(`- **Files with Errors**: ${audit.summary.filesWithErrors}`);

  lines.push("\n### Files by Modality\n");
  for (const [modality, count] of Object.entries(audit.summary.byModality).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${modality}: ${count}`);
  }

  lines.push("\n### Files by Schema Version\n");
  for (const [version, count] of Object.entries(audit.summary.bySchemaVersion).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${version}: ${count}`);
  }

  lines.push("\n## Top-Level Keys\n");
  lines.push("| Key | Count | Types |");
  lines.push("|-----|-------|-------|");
  for (const [key, info] of Object.entries(audit.topLevelKeys).sort((a, b) => b[1].count - a[1].count)) {
    lines.push(`| ${key} | ${info.count} | ${Array.from(info.types).join(", ")} |`);
  }

  lines.push("\n## Section Types\n");
  lines.push("| Type | Count | Modalities |");
  lines.push("|------|-------|------------|");
  for (const [type, info] of Object.entries(audit.sectionTypes).sort((a, b) => b[1].count - a[1].count)) {
    lines.push(`| ${type} | ${info.count} | ${Array.from(info.modalities).join(", ")} |`);
  }

  lines.push("\n## Metadata Keys\n");
  lines.push("| Key | Count | Types |");
  lines.push("|-----|-------|-------|");
  for (const [key, info] of Object.entries(audit.metadataKeys).sort((a, b) => b[1].count - a[1].count)) {
    lines.push(`| ${key} | ${info.count} | ${Array.from(info.types).join(", ")} |`);
  }

  lines.push("\n## Clinical Metadata Keys\n");
  lines.push("| Key | Count | Types |");
  lines.push("|-----|-------|-------|");
  for (const [key, info] of Object.entries(audit.clinicalMetadataKeys).sort((a, b) => b[1].count - a[1].count)) {
    lines.push(`| ${key} | ${info.count} | ${Array.from(info.types).join(", ")} |`);
  }

  lines.push("\n## Editorial Coverage\n");
  lines.push(`- Has review info: ${audit.editorialCoverage.hasReview}`);
  lines.push(`- Has review date: ${audit.editorialCoverage.hasReviewDate}`);
  lines.push(`- Has reviewer IDs: ${audit.editorialCoverage.hasReviewerIds}`);
  lines.push(`- Missing editorial: ${audit.editorialCoverage.noEditorial.length} files`);

  lines.push("\n## Source Coverage\n");
  lines.push(`- Has references section: ${audit.sourceCoverage.hasReferences}`);
  lines.push(`- Has citations: ${audit.sourceCoverage.hasCitations}`);
  lines.push(`- Missing sources: ${audit.sourceCoverage.noSources.length} files`);

  lines.push("\n## Representative Fixtures\n");

  lines.push("\n### Detailed Files (>15KB or >10 sections)");
  for (const file of audit.representativeFixtures.detailed.slice(0, 5)) {
    lines.push(`- ${file}`);
  }

  lines.push("\n### Sparse Files (<2KB or <3 sections)");
  for (const file of audit.representativeFixtures.sparse.slice(0, 5)) {
    lines.push(`- ${file}`);
  }

  if (audit.inconsistencies.missingRequiredFields.length > 0) {
    lines.push("\n## Missing Required Fields\n");
    for (const item of audit.inconsistencies.missingRequiredFields.slice(0, 10)) {
      lines.push(`- ${item.file}: missing ${item.missing.join(", ")}`);
    }
  }

  if (audit.inconsistencies.unusualStructures.length > 0) {
    lines.push("\n## Unusual Structures / Errors\n");
    for (const item of audit.inconsistencies.unusualStructures.slice(0, 10)) {
      lines.push(`- ${item.file}: ${item.issue}`);
    }
  }

  return lines.join("\n");
}

async function main() {
  console.log("Starting comprehensive treatment audit...\n");

  // Initialize audit result
  const audit: AuditResult = {
    summary: {
      totalFiles: 0,
      byModality: {},
      bySchemaVersion: {},
      filesWithErrors: 0,
    },
    topLevelKeys: {},
    metadataKeys: {},
    clinicalMetadataKeys: {},
    sectionTypes: {},
    modalitySpecificFields: {},
    inconsistencies: {
      scalarVsArray: [],
      stringVsObject: [],
      missingRequiredFields: [],
      unusualStructures: [],
    },
    editorialCoverage: {
      hasReview: 0,
      hasReviewDate: 0,
      hasReviewerIds: 0,
      noEditorial: [],
    },
    sourceCoverage: {
      hasReferences: 0,
      hasCitations: 0,
      noSources: [],
    },
    representativeFixtures: {
      medications: [],
      therapy: [],
      interventional: [],
      supplements: [],
      alternative: [],
      investigational: [],
      sparse: [],
      detailed: [],
    },
  };

  // Get all treatment files
  const files = getAllTreatmentFiles(TREATMENTS_DIR);
  audit.summary.totalFiles = files.length;

  console.log(`Found ${files.length} treatment files to analyze...\n`);

  // Analyze each file
  for (const file of files) {
    analyzeFile(file, audit);
  }

  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  // Write JSON audit
  const jsonPath = path.join(REPORTS_DIR, "treatment-audit.json");
  fs.writeFileSync(jsonPath, JSON.stringify(serializeForJson(audit), null, 2));
  console.log(`Wrote JSON audit to: ${jsonPath}`);

  // Write human-readable report
  const reportPath = path.join(REPORTS_DIR, "treatment-audit-report.md");
  fs.writeFileSync(reportPath, generateHumanReadableReport(audit));
  console.log(`Wrote report to: ${reportPath}`);

  // Print summary
  console.log("\n=== AUDIT SUMMARY ===\n");
  console.log(`Total Files: ${audit.summary.totalFiles}`);
  console.log(`Files with Errors: ${audit.summary.filesWithErrors}`);

  console.log("\nBy Modality:");
  for (const [modality, count] of Object.entries(audit.summary.byModality).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${modality}: ${count}`);
  }

  console.log("\nBy Schema Version:");
  for (const [version, count] of Object.entries(audit.summary.bySchemaVersion).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${version}: ${count}`);
  }

  console.log("\nTop-Level Keys (top 15):");
  for (const [key, info] of Object.entries(audit.topLevelKeys).sort((a, b) => b[1].count - a[1].count).slice(0, 15)) {
    console.log(`  ${key}: ${info.count} (${Array.from(info.types).join(", ")})`);
  }

  console.log("\nSection Types (top 20):");
  for (const [type, info] of Object.entries(audit.sectionTypes).sort((a, b) => b[1].count - a[1].count).slice(0, 20)) {
    console.log(`  ${type}: ${info.count} (${Array.from(info.modalities).join(", ")})`);
  }

  console.log("\nEditorial Coverage:");
  console.log(`  Has review info: ${audit.editorialCoverage.hasReview}/${audit.summary.totalFiles}`);
  console.log(`  Missing editorial: ${audit.editorialCoverage.noEditorial.length}`);

  console.log("\nSource Coverage:");
  console.log(`  Has references: ${audit.sourceCoverage.hasReferences}/${audit.summary.totalFiles}`);
  console.log(`  Missing sources: ${audit.sourceCoverage.noSources.length}`);
}

main().catch(console.error);

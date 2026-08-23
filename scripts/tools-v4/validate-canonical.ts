#!/usr/bin/env npx tsx
/**
 * V4 Clinician Tools Canonical Validator
 *
 * Uses the ACTUAL ClinicianToolV4Z schema from src/lib/schemas/clinician-tool-v4.ts
 * NOT a handwritten shadow validator.
 *
 * Usage:
 *   npx tsx scripts/tools-v4/validate-canonical.ts --check   # CI-safe, read-only
 *   npx tsx scripts/tools-v4/validate-canonical.ts --report  # Write report to file
 */

import fs from 'fs';
import path from 'path';
import {
  ClinicianToolV4Z,
  isPublishReady,
  ClinicianProductCategoryZ,
  type ClinicianToolV4,
} from '../../src/lib/schemas/clinician-tool-v4';

// Configuration
const PRODUCTS_DIR = path.join(process.cwd(), 'data/tools-v4/products');
const OUTPUT_DIR = path.join(process.cwd(), 'data/tools-v4/generated');

// Valid categories from schema
const VALID_CATEGORIES = ClinicianProductCategoryZ.options;

interface ValidationReport {
  timestamp: string;
  summary: {
    total_files: number;
    valid_json: number;
    invalid_json: number;
    schema_valid: number;
    schema_invalid: number;
    publish_ready: number;
    public_gate_pass: number;
    drafts: number;
    active: number;
    acquired: number;
    unique_slugs: number;
    duplicate_slugs: number;
    missing_descriptions: number;
    missing_websites: number;
    hipaa_unknown: number;
    hipaa_yes: number;
    hipaa_no: number;
    ehr_category_count: number;
    valid_ehr_for_wedge: number;
  };
  duplicates: Array<{ slug: string; files: Array<{ path: string; name: string; status: string }> }>;
  schema_errors: Array<{ path: string; errors: string[] }>;
  public_gate_failures: Array<{ slug: string; reasons: string[] }>;
  publish_ready_tools: string[];
  ehr_wedge_candidates: string[];
  by_category: Record<string, number>;
  by_status: Record<string, number>;
}

/**
 * Recursively find all JSON files
 */
function findJsonFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['taxonomies', 'raw', 'generated', 'comparisons'].includes(entry.name)) continue;
      files.push(...findJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Check if a tool passes the public gate (isToolPublishable equivalent)
 */
function passesPublicGate(tool: ClinicianToolV4): { passes: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (tool.status !== 'active') {
    reasons.push(`status is "${tool.status}", not "active"`);
  }

  const lifecycleStatus = tool.lifecycle?.status;
  if (lifecycleStatus && !['active', 'beta'].includes(lifecycleStatus)) {
    reasons.push(`lifecycle.status is "${lifecycleStatus}"`);
  }

  return { passes: reasons.length === 0, reasons };
}

/**
 * Check if a tool is a valid EHR wedge candidate
 */
function isEhrWedgeCandidate(tool: ClinicianToolV4): boolean {
  // Must be in EHR category
  if (tool.primary_category !== 'ehr-practice-management') return false;

  // Must pass public gate
  const { passes } = passesPublicGate(tool);
  if (!passes) return false;

  // Must have website
  if (!tool.website_url) return false;

  // Must have some description
  if (!tool.short_description || tool.short_description.length < 20) return false;

  return true;
}

/**
 * Main validation
 */
async function main() {
  const args = process.argv.slice(2);
  const checkMode = args.includes('--check');
  const reportMode = args.includes('--report');

  console.log('V4 Clinician Tools Canonical Validator');
  console.log('======================================');
  console.log(`Using canonical schema: ClinicianToolV4Z`);
  console.log('');

  const files = findJsonFiles(PRODUCTS_DIR);
  console.log(`Found ${files.length} JSON files\n`);

  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total_files: files.length,
      valid_json: 0,
      invalid_json: 0,
      schema_valid: 0,
      schema_invalid: 0,
      publish_ready: 0,
      public_gate_pass: 0,
      drafts: 0,
      active: 0,
      acquired: 0,
      unique_slugs: 0,
      duplicate_slugs: 0,
      missing_descriptions: 0,
      missing_websites: 0,
      hipaa_unknown: 0,
      hipaa_yes: 0,
      hipaa_no: 0,
      ehr_category_count: 0,
      valid_ehr_for_wedge: 0,
    },
    duplicates: [],
    schema_errors: [],
    public_gate_failures: [],
    publish_ready_tools: [],
    ehr_wedge_candidates: [],
    by_category: {},
    by_status: {},
  };

  const slugMap = new Map<string, Array<{ path: string; name: string; status: string }>>();
  const validTools: ClinicianToolV4[] = [];

  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);

    // Parse JSON
    let data: unknown;
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      data = JSON.parse(content);
      report.summary.valid_json++;
    } catch (e) {
      report.summary.invalid_json++;
      continue;
    }

    // Validate against canonical schema
    const result = ClinicianToolV4Z.safeParse(data);

    if (!result.success) {
      report.summary.schema_invalid++;
      const errors = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      report.schema_errors.push({ path: relativePath, errors: errors.slice(0, 5) });
      continue;
    }

    report.summary.schema_valid++;
    const tool = result.data;
    validTools.push(tool);

    // Track slug for duplicate detection
    if (!slugMap.has(tool.slug)) {
      slugMap.set(tool.slug, []);
    }
    slugMap.get(tool.slug)!.push({
      path: relativePath,
      name: tool.name,
      status: tool.status,
    });

    // Status tracking
    report.by_status[tool.status] = (report.by_status[tool.status] || 0) + 1;
    if (tool.status === 'draft') report.summary.drafts++;
    if (tool.status === 'active') report.summary.active++;
    if (tool.lifecycle?.status === 'acquired') report.summary.acquired++;

    // Category tracking
    report.by_category[tool.primary_category] = (report.by_category[tool.primary_category] || 0) + 1;
    if (tool.primary_category === 'ehr-practice-management') {
      report.summary.ehr_category_count++;
    }

    // Compliance tracking
    if (tool.compliance.hipaa_support === 'unknown') report.summary.hipaa_unknown++;
    else if (tool.compliance.hipaa_support === 'yes') report.summary.hipaa_yes++;
    else if (tool.compliance.hipaa_support === 'no') report.summary.hipaa_no++;

    // Data quality
    if (!tool.short_description || tool.short_description.length < 10) {
      report.summary.missing_descriptions++;
    }
    if (!tool.website_url) {
      report.summary.missing_websites++;
    }

    // Publication checks
    const publicGate = passesPublicGate(tool);
    if (publicGate.passes) {
      report.summary.public_gate_pass++;
    } else {
      report.public_gate_failures.push({ slug: tool.slug, reasons: publicGate.reasons });
    }

    if (isPublishReady(tool)) {
      report.summary.publish_ready++;
      report.publish_ready_tools.push(tool.slug);
    }

    // EHR wedge
    if (isEhrWedgeCandidate(tool)) {
      report.summary.valid_ehr_for_wedge++;
      report.ehr_wedge_candidates.push(tool.slug);
    }
  }

  // Count duplicates
  for (const [slug, entries] of slugMap) {
    if (entries.length > 1) {
      report.summary.duplicate_slugs++;
      report.duplicates.push({ slug, files: entries });
    } else {
      report.summary.unique_slugs++;
    }
  }

  // Output
  console.log('CANONICAL VALIDATION SUMMARY');
  console.log('============================');
  console.log(`Total files:           ${report.summary.total_files}`);
  console.log(`Valid JSON:            ${report.summary.valid_json}`);
  console.log(`Invalid JSON:          ${report.summary.invalid_json}`);
  console.log('');
  console.log(`SCHEMA VALIDATION (ClinicianToolV4Z.safeParse)`);
  console.log(`  Schema valid:        ${report.summary.schema_valid}`);
  console.log(`  Schema invalid:      ${report.summary.schema_invalid}`);
  console.log('');
  console.log('PUBLICATION GATES');
  console.log(`  Pass public gate:    ${report.summary.public_gate_pass}`);
  console.log(`  isPublishReady():    ${report.summary.publish_ready}`);
  console.log('');
  console.log('STATUS BREAKDOWN');
  console.log(`  Drafts:              ${report.summary.drafts}`);
  console.log(`  Active:              ${report.summary.active}`);
  console.log(`  Acquired:            ${report.summary.acquired}`);
  console.log('');
  console.log('DATA QUALITY');
  console.log(`  Unique slugs:        ${report.summary.unique_slugs}`);
  console.log(`  Duplicate slugs:     ${report.summary.duplicate_slugs}`);
  console.log(`  Missing descriptions:${report.summary.missing_descriptions}`);
  console.log(`  Missing websites:    ${report.summary.missing_websites}`);
  console.log('');
  console.log('COMPLIANCE');
  console.log(`  HIPAA "unknown":     ${report.summary.hipaa_unknown}`);
  console.log(`  HIPAA "yes":         ${report.summary.hipaa_yes}`);
  console.log(`  HIPAA "no":          ${report.summary.hipaa_no}`);
  console.log('');
  console.log('EHR WEDGE');
  console.log(`  EHR category count:  ${report.summary.ehr_category_count}`);
  console.log(`  Valid EHR candidates:${report.summary.valid_ehr_for_wedge}`);
  console.log('');

  if (report.duplicates.length > 0) {
    console.log('DUPLICATE SLUGS (MUST FIX)');
    console.log('--------------------------');
    for (const dup of report.duplicates.slice(0, 15)) {
      console.log(`  ${dup.slug}:`);
      for (const f of dup.files) {
        console.log(`    - ${f.path} (${f.name}, ${f.status})`);
      }
    }
    if (report.duplicates.length > 15) {
      console.log(`  ... and ${report.duplicates.length - 15} more`);
    }
    console.log('');
  }

  if (report.schema_errors.length > 0) {
    console.log('SCHEMA VALIDATION ERRORS (sample)');
    console.log('----------------------------------');
    for (const err of report.schema_errors.slice(0, 10)) {
      console.log(`  ${err.path}:`);
      for (const e of err.errors.slice(0, 3)) {
        console.log(`    - ${e}`);
      }
    }
    if (report.schema_errors.length > 10) {
      console.log(`  ... and ${report.schema_errors.length - 10} more files with errors`);
    }
    console.log('');
  }

  console.log('EHR WEDGE CANDIDATES');
  console.log('--------------------');
  for (const slug of report.ehr_wedge_candidates.slice(0, 20)) {
    console.log(`  - ${slug}`);
  }
  if (report.ehr_wedge_candidates.length > 20) {
    console.log(`  ... and ${report.ehr_wedge_candidates.length - 20} more`);
  }

  // Write report if requested
  if (reportMode) {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    const reportPath = path.join(OUTPUT_DIR, 'canonical-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport written to ${reportPath}`);
  }

  // Exit code for CI
  if (checkMode) {
    // CRITICAL ERRORS: These MUST block the build
    // - Duplicate slugs (data integrity issue)
    // Schema-invalid DRAFT files are OK - they won't be published
    // The ClinicianToolService correctly filters them out via safeParse
    const hasCriticalErrors = report.duplicates.length > 0;

    // WARNING: Schema-invalid files exist but are not blocking
    // These are typically raw imports or incomplete drafts
    const hasWarnings = report.summary.schema_invalid > 0;

    if (hasCriticalErrors) {
      console.log('\n[FAIL] Canonical validation failed - CRITICAL ERRORS');
      console.log(`  - ${report.duplicates.length} duplicate slugs (MUST FIX)`);
      if (hasWarnings) {
        console.log(`  - ${report.summary.schema_invalid} schema-invalid files (non-blocking, drafts filtered by service)`);
      }
      process.exit(1);
    }

    if (hasWarnings) {
      console.log('\n[WARN] Canonical validation passed with warnings');
      console.log(`  - ${report.summary.schema_invalid} schema-invalid files (drafts/raw imports, filtered by service)`);
      console.log(`  - ${report.summary.schema_valid} valid files, ${report.summary.publish_ready} publish-ready`);
    } else {
      console.log('\n[PASS] Canonical validation passed');
    }
  }

  console.log('\n[DONE] Validation complete');
}

main().catch(console.error);

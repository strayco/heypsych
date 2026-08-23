#!/usr/bin/env node
/**
 * V4 Clinician Tools Corpus Validator
 *
 * Validates all V4 tool JSON files against schema and publication requirements.
 * Produces a machine-readable report for CI integration.
 *
 * Usage: node scripts/tools-v4/validate-corpus.cjs [--json] [--strict] [--fix-slugs]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PRODUCTS_DIR = path.join(process.cwd(), 'data/tools-v4/products');
const OUTPUT_DIR = path.join(process.cwd(), 'data/tools-v4/generated');

// Valid enum values from schema
const VALID_LIFECYCLE_STATUS = ['active', 'beta', 'deprecated', 'discontinued', 'acquired', 'merged'];
const VALID_STATUS = ['active', 'draft', 'archived', 'pending-review'];
const VALID_CATEGORIES = [
  'ehr-practice-management',
  'billing-rcm-insurance',
  'telehealth-communication',
  'credentialing-workforce',
  'provider-network-virtual-care',
  'measurement-outcomes-dtx',
  'ai-scribe-documentation',
  'ai-copilot-clinical',
  'clinical-decision-support',
  'patient-engagement',
  'intake-scheduling-forms',
  'prescribing-erx',
  'compliance-consent-security',
  'analytics-reporting',
  'care-coordination-referrals',
];
const VALID_UNCERTAINTY_BOOLEAN = ['yes', 'no', 'unknown', 'not_applicable', true, false];

// Report accumulator
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total_files: 0,
    valid_json: 0,
    invalid_json: 0,
    schema_valid: 0,
    schema_invalid: 0,
    publish_ready: 0,
    drafts: 0,
    active: 0,
    acquired: 0,
    unique_slugs: 0,
    duplicate_slugs: 0,
    missing_descriptions: 0,
    hipaa_unknown: 0,
    hipaa_yes: 0,
    hipaa_no: 0,
    hipaa_invalid: 0,
    categories_found: new Set(),
    categories_with_products: {},
    categories_without_products: [],
  },
  duplicates: [],
  schema_errors: [],
  trust_violations: [],
  warnings: [],
  by_category: {},
  by_status: { active: 0, draft: 0, archived: 0, 'pending-review': 0, unknown: 0 },
  by_lifecycle: {},
  tools_by_slug: new Map(),
};

/**
 * Recursively find all JSON files in a directory
 */
function findJsonFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'taxonomies' || entry.name === 'raw' || entry.name === 'generated') continue;
      files.push(...findJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Validate uncertainty boolean value
 */
function isValidUncertaintyBoolean(value) {
  return VALID_UNCERTAINTY_BOOLEAN.includes(value);
}

/**
 * Validate a single tool file
 */
function validateTool(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  const errors = [];
  const warnings = [];

  let data;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(content);
  } catch (e) {
    report.summary.invalid_json++;
    errors.push({ path: relativePath, error: `Invalid JSON: ${e.message}` });
    return { valid: false, errors, warnings, data: null };
  }

  report.summary.valid_json++;

  // Check schema version and kind
  if (data.schema_version !== '4.0') {
    errors.push({ path: relativePath, field: 'schema_version', error: `Expected "4.0", got "${data.schema_version}"` });
  }
  if (data.kind !== 'clinician-tool') {
    errors.push({ path: relativePath, field: 'kind', error: `Expected "clinician-tool", got "${data.kind}"` });
  }

  // Required fields
  if (!data.id) errors.push({ path: relativePath, field: 'id', error: 'Missing required field: id' });
  if (!data.slug) errors.push({ path: relativePath, field: 'slug', error: 'Missing required field: slug' });
  if (!data.name) errors.push({ path: relativePath, field: 'name', error: 'Missing required field: name' });

  // Slug format
  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push({ path: relativePath, field: 'slug', error: `Invalid slug format: "${data.slug}"` });
  }

  // Primary category
  if (!data.primary_category) {
    errors.push({ path: relativePath, field: 'primary_category', error: 'Missing required field: primary_category' });
  } else if (!VALID_CATEGORIES.includes(data.primary_category)) {
    warnings.push({ path: relativePath, field: 'primary_category', warning: `Unknown category: "${data.primary_category}"` });
  }

  // Status field
  const status = data.status || 'unknown';
  if (data.status && !VALID_STATUS.includes(data.status)) {
    errors.push({ path: relativePath, field: 'status', error: `Invalid status: "${data.status}"` });
  }
  report.by_status[status] = (report.by_status[status] || 0) + 1;

  // Lifecycle status
  const lifecycleStatus = data.lifecycle?.status || 'unknown';
  if (data.lifecycle?.status && !VALID_LIFECYCLE_STATUS.includes(data.lifecycle.status)) {
    errors.push({ path: relativePath, field: 'lifecycle.status', error: `Invalid lifecycle status: "${data.lifecycle.status}"` });
  }
  report.by_lifecycle[lifecycleStatus] = (report.by_lifecycle[lifecycleStatus] || 0) + 1;

  // Compliance fields - CRITICAL CHECK
  if (data.compliance) {
    const hipaaValue = data.compliance.hipaa_support;
    if (hipaaValue === undefined || hipaaValue === null) {
      warnings.push({ path: relativePath, field: 'compliance.hipaa_support', warning: 'Missing HIPAA support field' });
    } else if (!isValidUncertaintyBoolean(hipaaValue)) {
      report.summary.hipaa_invalid++;
      errors.push({ path: relativePath, field: 'compliance.hipaa_support', error: `Invalid HIPAA value: "${hipaaValue}" (must be yes/no/unknown/not_applicable or boolean)` });
    } else {
      // Count HIPAA values
      if (hipaaValue === 'unknown') {
        report.summary.hipaa_unknown++;
      } else if (hipaaValue === 'yes' || hipaaValue === true) {
        report.summary.hipaa_yes++;
      } else if (hipaaValue === 'no' || hipaaValue === false) {
        report.summary.hipaa_no++;
      }
    }

    // BAA check
    const baaValue = data.compliance.baa_available;
    if (baaValue !== undefined && !isValidUncertaintyBoolean(baaValue)) {
      errors.push({ path: relativePath, field: 'compliance.baa_available', error: `Invalid BAA value: "${baaValue}"` });
    }
  } else {
    warnings.push({ path: relativePath, field: 'compliance', warning: 'Missing compliance object' });
  }

  // Description checks
  if (!data.short_description || data.short_description.length < 10) {
    report.summary.missing_descriptions++;
    warnings.push({ path: relativePath, field: 'short_description', warning: 'Missing or too short description' });
  }

  // Track categories
  if (data.primary_category) {
    report.summary.categories_found.add(data.primary_category);
    report.by_category[data.primary_category] = (report.by_category[data.primary_category] || 0) + 1;
  }

  // Publication readiness check
  const isPublishReady = !!(
    data.name &&
    data.slug &&
    data.primary_category &&
    data.short_description &&
    data.compliance?.hipaa_support !== 'unknown' &&
    data.governance?.last_reviewed &&
    !data.governance?.needs_review &&
    data.status === 'active'
  );

  if (isPublishReady) {
    report.summary.publish_ready++;
  }

  // Track status
  if (data.status === 'draft') {
    report.summary.drafts++;
  } else if (data.status === 'active') {
    report.summary.active++;
  }

  if (data.lifecycle?.status === 'acquired') {
    report.summary.acquired++;
  }

  const isValid = errors.length === 0;
  if (isValid) {
    report.summary.schema_valid++;
  } else {
    report.summary.schema_invalid++;
  }

  return { valid: isValid, errors, warnings, data, isPublishReady };
}

/**
 * Main validation routine
 */
function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const strictMode = args.includes('--strict');

  console.log('V4 Clinician Tools Corpus Validator');
  console.log('====================================\n');

  // Find all JSON files
  const files = findJsonFiles(PRODUCTS_DIR);
  report.summary.total_files = files.length;

  console.log(`Found ${files.length} JSON files in ${PRODUCTS_DIR}\n`);

  // Validate each file
  const slugMap = new Map(); // slug -> [filePaths]

  for (const filePath of files) {
    const result = validateTool(filePath);

    if (result.errors.length > 0) {
      report.schema_errors.push(...result.errors);
    }
    if (result.warnings.length > 0) {
      report.warnings.push(...result.warnings);
    }

    // Track slugs for duplicate detection
    if (result.data?.slug) {
      const slug = result.data.slug;
      if (!slugMap.has(slug)) {
        slugMap.set(slug, []);
      }
      slugMap.get(slug).push({
        path: path.relative(process.cwd(), filePath),
        name: result.data.name,
        status: result.data.status,
      });
      report.tools_by_slug.set(slug, result.data);
    }
  }

  // Find duplicates
  for (const [slug, entries] of slugMap) {
    if (entries.length > 1) {
      report.summary.duplicate_slugs++;
      report.duplicates.push({ slug, files: entries });
    } else {
      report.summary.unique_slugs++;
    }
  }

  // Check for missing categories
  for (const cat of VALID_CATEGORIES) {
    report.summary.categories_with_products[cat] = report.by_category[cat] || 0;
    if (!report.summary.categories_found.has(cat)) {
      report.summary.categories_without_products.push(cat);
    }
  }

  // Convert Set to Array for JSON serialization
  report.summary.categories_found = Array.from(report.summary.categories_found);

  // Check for trust violations (P0)
  // Tools with "unknown" compliance that might be displayed with positive badges
  for (const [slug, tool] of report.tools_by_slug) {
    if (tool.status === 'active' || !tool.status) {
      if (tool.compliance?.hipaa_support === 'unknown') {
        report.trust_violations.push({
          slug,
          name: tool.name,
          issue: 'HIPAA status is "unknown" but tool may display HIPAA badge due to truthiness',
          severity: 'P0',
        });
      }
    }
  }

  // Output
  if (jsonOutput) {
    // Remove Map from report for JSON
    const jsonReport = { ...report, tools_by_slug: undefined };
    console.log(JSON.stringify(jsonReport, null, 2));
  } else {
    // Human-readable output
    console.log('CORPUS SUMMARY');
    console.log('--------------');
    console.log(`Total files:          ${report.summary.total_files}`);
    console.log(`Valid JSON:           ${report.summary.valid_json}`);
    console.log(`Invalid JSON:         ${report.summary.invalid_json}`);
    console.log(`Schema valid:         ${report.summary.schema_valid}`);
    console.log(`Schema invalid:       ${report.summary.schema_invalid}`);
    console.log('');
    console.log('STATUS BREAKDOWN');
    console.log('----------------');
    console.log(`Drafts:               ${report.summary.drafts}`);
    console.log(`Active:               ${report.summary.active}`);
    console.log(`Publish-ready:        ${report.summary.publish_ready}`);
    console.log(`Acquired (lifecycle): ${report.summary.acquired}`);
    console.log('');
    console.log('COMPLIANCE');
    console.log('----------');
    console.log(`HIPAA "unknown":      ${report.summary.hipaa_unknown} (${((report.summary.hipaa_unknown / report.summary.valid_json) * 100).toFixed(1)}%)`);
    console.log(`HIPAA "yes"/true:     ${report.summary.hipaa_yes}`);
    console.log(`HIPAA "no"/false:     ${report.summary.hipaa_no}`);
    console.log(`HIPAA invalid:        ${report.summary.hipaa_invalid}`);
    console.log('');
    console.log('DATA QUALITY');
    console.log('------------');
    console.log(`Unique slugs:         ${report.summary.unique_slugs}`);
    console.log(`Duplicate slugs:      ${report.summary.duplicate_slugs}`);
    console.log(`Missing descriptions: ${report.summary.missing_descriptions}`);
    console.log('');
    console.log('BY CATEGORY');
    console.log('-----------');
    for (const [cat, count] of Object.entries(report.by_category).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count}`);
    }
    console.log('');

    if (report.duplicates.length > 0) {
      console.log('DUPLICATE SLUGS');
      console.log('---------------');
      for (const dup of report.duplicates) {
        console.log(`  ${dup.slug}:`);
        for (const f of dup.files) {
          console.log(`    - ${f.path} (${f.name}, ${f.status})`);
        }
      }
      console.log('');
    }

    if (report.trust_violations.length > 0) {
      console.log('P0 TRUST VIOLATIONS');
      console.log('-------------------');
      for (const v of report.trust_violations.slice(0, 10)) {
        console.log(`  [${v.severity}] ${v.slug}: ${v.issue}`);
      }
      if (report.trust_violations.length > 10) {
        console.log(`  ... and ${report.trust_violations.length - 10} more`);
      }
      console.log('');
    }

    if (report.schema_errors.length > 0 && strictMode) {
      console.log('SCHEMA ERRORS');
      console.log('-------------');
      for (const err of report.schema_errors.slice(0, 20)) {
        console.log(`  ${err.path}: ${err.field} - ${err.error}`);
      }
      if (report.schema_errors.length > 20) {
        console.log(`  ... and ${report.schema_errors.length - 20} more`);
      }
      console.log('');
    }
  }

  // Write report to file
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const jsonReport = { ...report, tools_by_slug: undefined };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'corpus-validation-report.json'),
    JSON.stringify(jsonReport, null, 2)
  );
  console.log(`\nReport written to ${path.join(OUTPUT_DIR, 'corpus-validation-report.json')}`);

  // Exit code
  if (strictMode && (report.summary.schema_invalid > 0 || report.trust_violations.length > 0)) {
    console.log('\n[FAIL] Strict validation failed');
    process.exit(1);
  }

  console.log('\n[DONE] Validation complete');
}

main();

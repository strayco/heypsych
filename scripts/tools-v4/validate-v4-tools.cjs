#!/usr/bin/env node
/**
 * Validate all V4 clinician tools
 * Checks schema compliance, required fields, and data quality
 */
const fs = require('fs');
const path = require('path');

const productsDir = path.join(__dirname, '../../data/tools-v4/products');

const VALID_CATEGORIES = [
  'ehr-practice-management',
  'ai-scribe-documentation',
  'ai-copilot-clinical',
  'billing-rcm-insurance',
  'telehealth-communication',
  'measurement-outcomes-dtx',
  'credentialing-workforce',
  'provider-networks',
  'patient-engagement-portal',
  'intake-scheduling-forms',
  'care-coordination',
  'clinical-decision-support',
  'compliance-quality',
  'interoperability',
  'training-simulation'
];

const REQUIRED_FIELDS = [
  'schema_version',
  'kind',
  'id',
  'slug',
  'name',
  'primary_category',
  'status'
];

function walkDir(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (item.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function validateTool(filePath) {
  const errors = [];
  const warnings = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const tool = JSON.parse(content);

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!tool[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check schema version
    if (tool.schema_version !== '4.0') {
      errors.push(`Invalid schema version: ${tool.schema_version} (expected 4.0)`);
    }

    // Check kind
    if (tool.kind !== 'clinician-tool') {
      errors.push(`Invalid kind: ${tool.kind} (expected clinician-tool)`);
    }

    // Check category
    if (tool.primary_category && !VALID_CATEGORIES.includes(tool.primary_category)) {
      // Map old category names
      const categoryMappings = {
        'ehr': 'ehr-practice-management',
        'ai-scribe': 'ai-scribe-documentation',
        'billing-rcm': 'billing-rcm-insurance',
        'telehealth': 'telehealth-communication',
        'measurement-dtx': 'measurement-outcomes-dtx',
        'credentialing': 'credentialing-workforce'
      };
      if (!categoryMappings[tool.primary_category]) {
        warnings.push(`Non-standard category: ${tool.primary_category}`);
      }
    }

    // Check status
    if (!['active', 'draft', 'archived', 'deprecated'].includes(tool.status)) {
      warnings.push(`Non-standard status: ${tool.status}`);
    }

    // Quality warnings for draft tools
    if (tool.status === 'draft') {
      if (!tool.short_description) warnings.push('Draft missing short_description');
      if (!tool.capabilities || tool.capabilities.length === 0) warnings.push('Draft missing capabilities');
      if (!tool.pricing || !tool.pricing.model) warnings.push('Draft missing pricing');
    }

    // Check for enriched tools
    if (tool.status === 'active') {
      if (!tool.long_description) warnings.push('Active tool missing long_description');
      if (!tool.seo?.faqs || tool.seo.faqs.length < 2) warnings.push('Active tool has < 2 FAQs');
      if (!tool.company_info?.founded_year) warnings.push('Active tool missing company_info');
    }

    return { valid: errors.length === 0, errors, warnings };
  } catch (err) {
    return { valid: false, errors: [`Parse error: ${err.message}`], warnings: [] };
  }
}

function main() {
  const files = walkDir(productsDir);
  let valid = 0;
  let invalid = 0;
  let totalWarnings = 0;

  const results = {
    active: { count: 0, errors: 0, warnings: 0 },
    draft: { count: 0, errors: 0, warnings: 0 }
  };

  const errorDetails = [];

  for (const filePath of files) {
    const result = validateTool(filePath);
    const relativePath = path.relative(productsDir, filePath);

    if (result.valid) {
      valid++;
    } else {
      invalid++;
      errorDetails.push({
        file: relativePath,
        errors: result.errors
      });
    }

    totalWarnings += result.warnings.length;

    // Track by status
    try {
      const tool = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const status = tool.status || 'unknown';
      if (results[status]) {
        results[status].count++;
        if (!result.valid) results[status].errors++;
        results[status].warnings += result.warnings.length;
      }
    } catch {}
  }

  console.log('V4 Tools Validation Report');
  console.log('==========================');
  console.log(`Total files: ${files.length}`);
  console.log(`Valid: ${valid}`);
  console.log(`Invalid: ${invalid}`);
  console.log(`Warnings: ${totalWarnings}`);
  console.log('');
  console.log('By Status:');
  console.log(`  Active: ${results.active.count} (${results.active.errors} errors, ${results.active.warnings} warnings)`);
  console.log(`  Draft: ${results.draft.count} (${results.draft.errors} errors, ${results.draft.warnings} warnings)`);

  if (errorDetails.length > 0) {
    console.log('\nErrors:');
    for (const detail of errorDetails.slice(0, 10)) {
      console.log(`  ${detail.file}:`);
      for (const err of detail.errors) {
        console.log(`    - ${err}`);
      }
    }
    if (errorDetails.length > 10) {
      console.log(`  ... and ${errorDetails.length - 10} more files with errors`);
    }
  }
}

main();

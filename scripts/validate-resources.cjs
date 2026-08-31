#!/usr/bin/env node

/**
 * Resources Validation Script
 *
 * Validates resources data integrity, SEO compliance, and crawlability.
 * Fails build (exit code 1) if critical issues are found.
 *
 * Usage:
 *   node scripts/validate-resources.js
 *   npm run validate:resources
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'data', 'resources');
const INDEX_FILE = path.join(__dirname, '..', 'public', 'resources-index.json');
const CATEGORIES = [
  'assessments-screeners',
  'support-community',
  'digital-tools',
  'knowledge-hub'
];

// Validation results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  warnings: []
};

// Helper functions
function error(message) {
  results.errors.push(`❌ ${message}`);
  results.failed++;
}

function warning(message) {
  results.warnings.push(`⚠️  ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
  results.passed++;
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    error(`Failed to read JSON file: ${filePath} - ${err.message}`);
    return null;
  }
}

function getAllResourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip 'tools' directory - it uses v3 schema and has its own validator (validate:tools)
      if (file === 'tools') {
        return;
      }
      getAllResourceFiles(filePath, fileList);
    } else if (file.endsWith('.json') && file !== 'index.json' && file !== 'README.md') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Validation checks

/**
 * Check 1: Category Validation
 * Every resource must have metadata.category and it must be valid
 */
function validateCategories() {
  console.log('\n📋 Check 1: Category Validation');
  results.total++;

  const files = getAllResourceFiles(DATA_DIR);
  let invalidCount = 0;

  files.forEach(file => {
    const data = readJsonFile(file);
    if (!data) return;

    const category = data.metadata?.category;

    if (!category) {
      error(`Missing metadata.category: ${path.relative(DATA_DIR, file)}`);
      invalidCount++;
    } else if (!CATEGORIES.includes(category)) {
      error(`Invalid category "${category}": ${path.relative(DATA_DIR, file)}`);
      invalidCount++;
    }
  });

  if (invalidCount === 0) {
    success(`Category Validation: ${files.length}/${files.length} resources have valid categories`);
  }
}

/**
 * Check 2: Slug Uniqueness
 * No duplicate slugs across all resources
 */
function validateSlugUniqueness() {
  console.log('\n🔍 Check 2: Slug Uniqueness');
  results.total++;

  const files = getAllResourceFiles(DATA_DIR);
  const slugs = new Map();
  let duplicateCount = 0;

  files.forEach(file => {
    const data = readJsonFile(file);
    if (!data) return;

    const slug = data.slug;
    if (!slug) {
      error(`Missing slug: ${path.relative(DATA_DIR, file)}`);
      return;
    }

    if (slugs.has(slug)) {
      error(`Duplicate slug "${slug}": ${path.relative(DATA_DIR, file)} and ${path.relative(DATA_DIR, slugs.get(slug))}`);
      duplicateCount++;
    } else {
      slugs.set(slug, file);
    }
  });

  if (duplicateCount === 0) {
    success(`Slug Uniqueness: No duplicates found (${slugs.size} unique slugs)`);
  }
}

/**
 * Check 3: Status Validation
 * Only status: "active" resources should be in production
 */
function validateStatus() {
  console.log('\n✓ Check 3: Status Validation');
  results.total++;

  const files = getAllResourceFiles(DATA_DIR);
  const VALID_STATUSES = ['active', 'draft', 'archived', 'pending-review'];
  let nonActiveCount = 0;

  files.forEach(file => {
    const data = readJsonFile(file);
    if (!data) return;

    if (!VALID_STATUSES.includes(data.status)) {
      error(`Invalid status "${data.status}": ${path.relative(DATA_DIR, file)}`);
    } else if (data.status !== 'active') {
      warning(`Non-active resource (${data.status}): ${path.relative(DATA_DIR, file)}`);
      nonActiveCount++;
    }
  });

  if (nonActiveCount === 0) {
    success(`Status Validation: All resources have status "active"`);
  } else {
    warning(`Found ${nonActiveCount} non-active resources (excluded from index)`);
    success(`Status Validation: All statuses are valid`);
  }
}

/**
 * Check 4: Indexing Validation
 * Every JSON file should be in resources-index.json and vice versa
 */
function validateIndexing() {
  console.log('\n📇 Check 4: Indexing Validation');
  results.total++;

  const files = getAllResourceFiles(DATA_DIR);
  const fileSlugs = new Set();

  files.forEach(file => {
    const data = readJsonFile(file);
    if (data?.slug && data?.status === 'active') {
      fileSlugs.add(data.slug);
    }
  });

  if (!fs.existsSync(INDEX_FILE)) {
    error(`Resources index not found: ${INDEX_FILE}`);
    return;
  }

  const index = readJsonFile(INDEX_FILE);
  if (!index) return;

  // Handle both array and { resources: [] } formats
  const resources = Array.isArray(index) ? index : (index.resources || []);
  const indexSlugs = new Set(resources.map(r => r.slug));

  // Check for files missing from index
  const missingFromIndex = [...fileSlugs].filter(slug => !indexSlugs.has(slug));
  if (missingFromIndex.length > 0) {
    error(`${missingFromIndex.length} resources missing from index: ${missingFromIndex.join(', ')}`);
  }

  // Check for index entries with no corresponding file
  const missingFiles = [...indexSlugs].filter(slug => !fileSlugs.has(slug));
  if (missingFiles.length > 0) {
    error(`${missingFiles.length} index entries have no corresponding file: ${missingFiles.join(', ')}`);
  }

  if (missingFromIndex.length === 0 && missingFiles.length === 0) {
    success(`Indexing Validation: All ${fileSlugs.size} active resources properly indexed`);
  }
}

/**
 * Check 5: Required Fields
 * Every resource must have name, slug, type, status
 */
function validateRequiredFields() {
  console.log('\n📝 Check 5: Required Fields');
  results.total++;

  const files = getAllResourceFiles(DATA_DIR);
  let missingCount = 0;

  files.forEach(file => {
    const data = readJsonFile(file);
    if (!data) return;

    const required = ['name', 'slug', 'type', 'status'];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
      error(`Missing required fields [${missing.join(', ')}]: ${path.relative(DATA_DIR, file)}`);
      missingCount++;
    }

    if (data.type && data.type !== 'resource') {
      error(`Invalid type "${data.type}" (expected "resource"): ${path.relative(DATA_DIR, file)}`);
      missingCount++;
    }
  });

  if (missingCount === 0) {
    success(`Required Fields: All resources have required fields`);
  }
}

/**
 * Check 6: SEO Metadata
 * Resources should have description or summary, SEO titles ≤ 60 chars
 */
function validateSEO() {
  console.log('\n🔎 Check 6: SEO Metadata');
  results.total++;

  const files = getAllResourceFiles(DATA_DIR);
  let issues = 0;

  files.forEach(file => {
    const data = readJsonFile(file);
    if (!data) return;

    // Check for description or summary
    if (!data.description && !data.summary) {
      warning(`Missing description and summary: ${path.relative(DATA_DIR, file)}`);
    }

    // Check SEO title length
    if (data.seo?.title && data.seo.title.length > 60) {
      warning(`SEO title too long (${data.seo.title.length} chars): ${path.relative(DATA_DIR, file)}`);
    }

    // Check SEO description length
    if (data.seo?.description && data.seo.description.length > 160) {
      warning(`SEO description too long (${data.seo.description.length} chars): ${path.relative(DATA_DIR, file)}`);
    }
  });

  success(`SEO Metadata: Validation complete (check warnings above)`);
}

/**
 * Check 7: Crosslink Validation
 * All relatedConditionSlugs, relatedResourceSlugs must reference existing entities
 */
function validateCrosslinks() {
  console.log('\n🔗 Check 7: Crosslink Validation');
  results.total++;

  // This is a placeholder - full implementation would require checking against
  // conditions database and other resources

  const files = getAllResourceFiles(DATA_DIR);
  const allResourceSlugs = new Set();

  files.forEach(file => {
    const data = readJsonFile(file);
    if (data?.slug && data?.status === 'active') {
      allResourceSlugs.add(data.slug);
    }
  });

  // Also include tools from the v3 tools directory (they can be referenced)
  const toolsDir = path.join(DATA_DIR, 'tools');
  if (fs.existsSync(toolsDir)) {
    const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith('.json'));
    toolFiles.forEach(file => {
      const data = readJsonFile(path.join(toolsDir, file));
      if (data?.slug && data?.status === 'active') {
        allResourceSlugs.add(data.slug);
      }
    });
  }

  let brokenLinks = 0;

  files.forEach(file => {
    const data = readJsonFile(file);
    if (!data) return;

    // Check relatedResourceSlugs
    if (data.relatedResourceSlugs) {
      data.relatedResourceSlugs.forEach(slug => {
        if (!allResourceSlugs.has(slug)) {
          error(`Broken resource link "${slug}": ${path.relative(DATA_DIR, file)}`);
          brokenLinks++;
        }
      });
    }

    // Check for self-references
    if (data.relatedResourceSlugs?.includes(data.slug)) {
      error(`Self-reference detected: ${path.relative(DATA_DIR, file)}`);
      brokenLinks++;
    }
  });

  if (brokenLinks === 0) {
    success(`Crosslink Validation: No broken resource links found`);
  }

  // Note: Condition/medication crosslink validation would require database access
  warning(`Note: Condition/medication crosslink validation requires database access (not implemented)`);
}

/**
 * Check 8: Directory Structure
 * Resources should be organized in correct category directories
 */
function validateDirectoryStructure() {
  console.log('\n📁 Check 8: Directory Structure');
  results.total++;

  const files = getAllResourceFiles(DATA_DIR);
  let misplaced = 0;

  files.forEach(file => {
    const data = readJsonFile(file);
    if (!data) return;

    const category = data.metadata?.category;
    if (!category) return;

    const relativePath = path.relative(DATA_DIR, file);
    const fileCategory = relativePath.split(path.sep)[0];

    // Allow for subcategories (e.g., knowledge-hub/how-to-guides)
    if (!relativePath.startsWith(category)) {
      warning(`File in wrong directory - category "${category}" but file in "${fileCategory}": ${relativePath}`);
      misplaced++;
    }
  });

  if (misplaced === 0) {
    success(`Directory Structure: All resources in correct category directories`);
  }
}

// Main execution
function main() {
  console.log('🚀 Resources Validation Script\n');
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Index file: ${INDEX_FILE}`);
  console.log(`Valid categories: ${CATEGORIES.join(', ')}\n`);

  // Run all checks
  validateCategories();
  validateSlugUniqueness();
  validateStatus();
  validateIndexing();
  validateRequiredFields();
  validateSEO();
  validateCrosslinks();
  validateDirectoryStructure();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total checks: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(err => console.log(err));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(warn => console.log(warn));
  }

  console.log('\n' + '='.repeat(60));

  if (results.failed > 0) {
    console.log('❌ VALIDATION FAILED\n');
    process.exit(1);
  } else {
    console.log('✅ VALIDATION PASSED\n');
    process.exit(0);
  }
}

main();

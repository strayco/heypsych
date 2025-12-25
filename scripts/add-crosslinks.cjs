#!/usr/bin/env node

/**
 * Add Crosslinks Script
 *
 * Adds relatedConditionSlugs, relatedMedicationSlugs, and relatedResourceSlugs
 * to resource JSON files based on crosslinks-data.json.
 *
 * Usage:
 *   node scripts/add-crosslinks.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Parse CLI args
const isDryRun = process.argv.includes('--dry-run');

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'data', 'resources');
const CROSSLINKS_FILE = path.join(__dirname, 'crosslinks-data.json');

// Statistics
const stats = {
  totalProcessed: 0,
  updated: 0,
  skipped: 0,
  errors: []
};

/**
 * Read JSON file
 */
function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Failed to read ${filePath}: ${err.message}`);
    return null;
  }
}

/**
 * Find resource file by slug
 */
function findResourceFile(slug) {
  const categories = ['assessments-screeners', 'digital-tools', 'knowledge-hub', 'support-community'];

  for (const category of categories) {
    const categoryDir = path.join(DATA_DIR, category);

    // Try direct file
    const directFile = path.join(categoryDir, `${slug}.json`);
    if (fs.existsSync(directFile)) {
      return directFile;
    }

    // Try in subdirectories
    if (fs.existsSync(categoryDir) && fs.statSync(categoryDir).isDirectory()) {
      const subdirs = fs.readdirSync(categoryDir).filter(f =>
        fs.statSync(path.join(categoryDir, f)).isDirectory()
      );

      for (const subdir of subdirs) {
        const subFile = path.join(categoryDir, subdir, `${slug}.json`);
        if (fs.existsSync(subFile)) {
          return subFile;
        }
      }
    }
  }

  return null;
}

/**
 * Add crosslinks to a resource
 */
function addCrosslinks(slug, crosslinks) {
  stats.totalProcessed++;

  const filePath = findResourceFile(slug);
  if (!filePath) {
    console.warn(`  ⚠️  File not found for slug: ${slug}`);
    stats.skipped++;
    return;
  }

  const data = readJsonFile(filePath);
  if (!data) {
    stats.errors.push({ slug, error: 'Failed to read file' });
    return;
  }

  let modified = false;

  // Add relatedConditionSlugs
  if (crosslinks.relatedConditionSlugs && crosslinks.relatedConditionSlugs.length > 0) {
    if (!data.relatedConditionSlugs || data.relatedConditionSlugs.length === 0) {
      console.log(`  ➕ Adding ${crosslinks.relatedConditionSlugs.length} condition crosslinks: ${data.name || slug}`);
      data.relatedConditionSlugs = crosslinks.relatedConditionSlugs;
      modified = true;
    }
  }

  // Add relatedMedicationSlugs
  if (crosslinks.relatedMedicationSlugs && crosslinks.relatedMedicationSlugs.length > 0) {
    if (!data.relatedMedicationSlugs || data.relatedMedicationSlugs.length === 0) {
      console.log(`  ➕ Adding ${crosslinks.relatedMedicationSlugs.length} medication crosslinks: ${data.name || slug}`);
      data.relatedMedicationSlugs = crosslinks.relatedMedicationSlugs;
      modified = true;
    }
  }

  // Add relatedResourceSlugs
  if (crosslinks.relatedResourceSlugs && crosslinks.relatedResourceSlugs.length > 0) {
    if (!data.relatedResourceSlugs || data.relatedResourceSlugs.length === 0) {
      console.log(`  ➕ Adding ${crosslinks.relatedResourceSlugs.length} resource crosslinks: ${data.name || slug}`);
      data.relatedResourceSlugs = crosslinks.relatedResourceSlugs;
      modified = true;
    }
  }

  if (modified) {
    if (!isDryRun) {
      const prettyJson = JSON.stringify(data, null, 2) + '\n';
      fs.writeFileSync(filePath, prettyJson, 'utf8');
      console.log(`  ✅ Updated: ${path.relative(DATA_DIR, filePath)}`);
      stats.updated++;
    } else {
      console.log(`  🔍 Would update: ${path.relative(DATA_DIR, filePath)}`);
    }
  } else {
    stats.skipped++;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔗 Add Crosslinks Script\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  // Load crosslinks data
  if (!fs.existsSync(CROSSLINKS_FILE)) {
    console.error(`❌ Crosslinks data file not found: ${CROSSLINKS_FILE}`);
    process.exit(1);
  }

  const crosslinksData = readJsonFile(CROSSLINKS_FILE);
  if (!crosslinksData) {
    console.error(`❌ Failed to read crosslinks data`);
    process.exit(1);
  }

  console.log(`Loaded crosslinks for ${Object.keys(crosslinksData).length} resources\n`);
  console.log('Processing resources...\n');

  // Process each resource
  for (const [slug, crosslinks] of Object.entries(crosslinksData)) {
    addCrosslinks(slug, crosslinks);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total resources processed: ${stats.totalProcessed}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Skipped (no changes): ${stats.skipped - stats.errors.length}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    stats.errors.forEach(({ slug, error }) => {
      console.log(`  - ${slug}: ${error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  if (isDryRun) {
    console.log('\n🔍 Dry run complete. Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ All crosslinks added!');
  }
}

main();

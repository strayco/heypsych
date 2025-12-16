#!/usr/bin/env node
/**
 * Add Editorial Metadata to JSON Files
 *
 * This script adds default editorial metadata to all entity JSON files
 * that don't already have an "editorial" field.
 *
 * Usage:
 *   node scripts/add-editorial-metadata.mjs [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be changed without making changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DRY_RUN = process.argv.includes('--dry-run');

// Default editorial metadata
const DEFAULT_EDITORIAL = {
  medicalReviewerIds: ['john-lee-md'],
  reviewBoard: 'official',
  lastReviewed: '2025-11-24',
  lastUpdated: '2025-11-24'
};

let filesProcessed = 0;
let filesUpdated = 0;
let filesSkipped = 0;
let errors = [];

/**
 * Process a single JSON file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Check if editorial metadata already exists
    if (data.editorial || data.content?.editorial || data.metadata?.editorial) {
      filesSkipped++;
      return { updated: false, reason: 'already has editorial' };
    }

    // Add editorial metadata
    data.editorial = {
      ...DEFAULT_EDITORIAL,
      // Use existing dates if available
      lastUpdated: data.metadata?.last_updated || data.last_updated || DEFAULT_EDITORIAL.lastUpdated,
      lastReviewed: data.metadata?.last_reviewed || DEFAULT_EDITORIAL.lastReviewed
    };

    // Write back to file (unless dry run)
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    }

    filesUpdated++;
    return { updated: true };

  } catch (error) {
    errors.push({ file: filePath, error: error.message });
    return { updated: false, error: error.message };
  }
}

/**
 * Recursively process all JSON files in a directory
 */
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      filesProcessed++;
      const result = processFile(fullPath);

      if (DRY_RUN && result.updated) {
        console.log(`[DRY RUN] Would update: ${path.relative(DATA_DIR, fullPath)}`);
      } else if (result.updated) {
        console.log(`✅ Updated: ${path.relative(DATA_DIR, fullPath)}`);
      } else if (result.error) {
        console.error(`❌ Error: ${path.relative(DATA_DIR, fullPath)} - ${result.error}`);
      }
    }
  }
}

/**
 * Main execution
 */
console.log('=====================================');
console.log('Editorial Metadata Population Script');
console.log('=====================================\n');

if (DRY_RUN) {
  console.log('🔍 DRY RUN MODE - No files will be modified\n');
}

console.log(`📁 Processing files in: ${DATA_DIR}\n`);

// Process conditions
const conditionsDir = path.join(DATA_DIR, 'conditions');
if (fs.existsSync(conditionsDir)) {
  console.log('Processing conditions...');
  processDirectory(conditionsDir);
}

// Process treatments
const treatmentsDir = path.join(DATA_DIR, 'treatments');
if (fs.existsSync(treatmentsDir)) {
  console.log('\nProcessing treatments...');
  processDirectory(treatmentsDir);
}

// Process resources
const resourcesDir = path.join(DATA_DIR, 'resources');
if (fs.existsSync(resourcesDir)) {
  console.log('\nProcessing resources...');
  processDirectory(resourcesDir);
}

// Print summary
console.log('\n=====================================');
console.log('Summary');
console.log('=====================================');
console.log(`📊 Files processed: ${filesProcessed}`);
console.log(`✅ Files updated: ${filesUpdated}`);
console.log(`⏭️  Files skipped: ${filesSkipped}`);
console.log(`❌ Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\nErrors:');
  errors.forEach(({ file, error }) => {
    console.log(`  - ${path.relative(DATA_DIR, file)}: ${error}`);
  });
}

if (DRY_RUN && filesUpdated > 0) {
  console.log('\n💡 Run without --dry-run to apply changes');
} else if (!DRY_RUN && filesUpdated > 0) {
  console.log('\n✅ All changes saved successfully!');
  console.log('📝 Next step: Run `npm run sync:json-to-db` to sync to database');
}

console.log('=====================================\n');

// Exit with error code if there were errors
process.exit(errors.length > 0 ? 1 : 0);

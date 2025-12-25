#!/usr/bin/env node

/**
 * Fix Orphaned Resources
 *
 * Adds missing metadata.category and metadata.resourceType fields to resource JSON files.
 * Focuses on the 40 orphaned support-community resources.
 *
 * Usage:
 *   node scripts/fix-orphaned-resources.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Parse CLI args
const isDryRun = process.argv.includes('--dry-run');

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'data', 'resources');

// Category to resource type mapping
const CATEGORY_TO_TYPE = {
  'assessments-screeners': 'assessment',
  'digital-tools': 'app',
  'knowledge-hub': 'guide',  // or 'article' depending on content
  'support-community': 'support'
};

// Statistics
const stats = {
  totalProcessed: 0,
  categoriesAdded: 0,
  resourceTypesAdded: 0,
  statusAdded: 0,
  alreadyComplete: 0,
  errors: []
};

/**
 * Infer category from file path
 */
function inferCategoryFromPath(filePath) {
  const relativePath = path.relative(DATA_DIR, filePath);
  const parts = relativePath.split(path.sep);

  // First directory is the category
  const topLevelDir = parts[0];

  // Map directory names to category slugs
  if (topLevelDir.includes('assessment')) return 'assessments-screeners';
  if (topLevelDir.includes('digital-tool')) return 'digital-tools';
  if (topLevelDir.includes('knowledge-hub')) return 'knowledge-hub';
  if (topLevelDir.includes('support-community')) return 'support-community';

  return null;
}

/**
 * Infer resource type from category and content
 */
function inferResourceType(category, data) {
  // Check for explicit type in data
  if (data.metadata?.resourceType) {
    return data.metadata.resourceType;
  }

  // Infer from category
  if (CATEGORY_TO_TYPE[category]) {
    return CATEGORY_TO_TYPE[category];
  }

  // Fallback based on content
  if (data.name?.toLowerCase().includes('assessment') ||
      data.name?.toLowerCase().includes('screener') ||
      data.name?.toLowerCase().includes('questionnaire')) {
    return 'assessment';
  }

  if (data.sections?.some(s => s.type === 'how_to_use')) {
    return 'guide';
  }

  return 'guide';  // Default fallback
}

/**
 * Fix a single resource file
 */
function fixResourceFile(filePath) {
  try {
    stats.totalProcessed++;

    // Read file
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    let modified = false;

    // Ensure metadata object exists
    if (!data.metadata) {
      data.metadata = {};
      modified = true;
    }

    // Add category if missing
    if (!data.metadata.category) {
      const inferredCategory = inferCategoryFromPath(filePath);

      if (inferredCategory) {
        console.log(`  ➕ Adding category "${inferredCategory}": ${data.name || data.slug}`);
        data.metadata.category = inferredCategory;
        stats.categoriesAdded++;
        modified = true;
      } else {
        console.warn(`  ⚠️  Could not infer category: ${path.relative(DATA_DIR, filePath)}`);
      }
    }

    // Add resourceType if missing
    if (!data.metadata.resourceType) {
      const category = data.metadata.category || inferCategoryFromPath(filePath);
      const resourceType = inferResourceType(category, data);

      console.log(`  ➕ Adding resourceType "${resourceType}": ${data.name || data.slug}`);
      data.metadata.resourceType = resourceType;
      stats.resourceTypesAdded++;
      modified = true;
    }

    // Add or fix type field
    if (!data.type) {
      console.log(`  ➕ Adding type "resource": ${data.name || data.slug}`);
      data.type = 'resource';
      modified = true;
    } else if (data.type !== 'resource') {
      console.log(`  🔧 Fixing type "${data.type}" → "resource": ${data.name || data.slug}`);
      data.type = 'resource';
      modified = true;
    }

    // Add status if missing
    if (!data.status) {
      console.log(`  ➕ Adding status "active": ${data.name || data.slug}`);
      data.status = 'active';
      stats.statusAdded++;
      modified = true;
    }

    // Write back if modified
    if (modified) {
      if (!isDryRun) {
        const prettyJson = JSON.stringify(data, null, 2) + '\n';
        fs.writeFileSync(filePath, prettyJson, 'utf8');
        console.log(`  ✅ Updated: ${path.relative(DATA_DIR, filePath)}`);
      } else {
        console.log(`  🔍 Would update: ${path.relative(DATA_DIR, filePath)}`);
      }
    } else {
      stats.alreadyComplete++;
    }

  } catch (err) {
    console.error(`  ❌ Error processing ${filePath}: ${err.message}`);
    stats.errors.push({ file: filePath, error: err.message });
  }
}

/**
 * Get all resource files recursively
 */
function getAllResourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllResourceFiles(filePath, fileList);
    } else if (file.endsWith('.json') && file !== 'index.json' && !file.includes('README')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Fix Orphaned Resources Script\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  console.log(`Data directory: ${DATA_DIR}\n`);

  // Get all resource files
  const files = getAllResourceFiles(DATA_DIR);
  console.log(`Found ${files.length} resource files\n`);

  // Process each file
  console.log('Processing files...\n');
  files.forEach(fixResourceFile);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files processed: ${stats.totalProcessed}`);
  console.log(`Categories added: ${stats.categoriesAdded}`);
  console.log(`Resource types added: ${stats.resourceTypesAdded}`);
  console.log(`Status fields added: ${stats.statusAdded}`);
  console.log(`Already complete: ${stats.alreadyComplete}`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${path.relative(DATA_DIR, file)}: ${error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  if (isDryRun) {
    console.log('\n🔍 Dry run complete. Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ All changes applied!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run validate:resources');
    console.log('  2. Run: npm run audit:resources');
    console.log('  3. Review and commit changes\n');
  }
}

main();

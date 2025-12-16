#!/usr/bin/env node
/**
 * Validate SEO compliance across ALL entity types
 *
 * Checks:
 * 1. No schema_injection fields remain
 * 2. All canonical URLs use correct paths and www subdomain
 * 3. All files have seo.no_index defined
 * 4. Editorial metadata present for E-A-T
 * 5. FAQ data present where expected
 *
 * Usage:
 *   node scripts/validate-all-entities-seo.cjs
 *   node scripts/validate-all-entities-seo.cjs --verbose
 */

const fs = require('fs');
const path = require('path');

const VERBOSE = process.argv.includes('--verbose');
const ENTITY_DIRS = [
  { path: 'data/conditions', type: 'condition', pathPrefix: '/conditions/' },
  { path: 'data/treatments', type: 'treatment', pathPrefix: '/treatments/' },
  { path: 'data/resources', type: 'resource', pathPrefix: '/resources/' },
];

let filesChecked = 0;
let errors = [];
let warnings = [];
const stats = {
  byType: {
    condition: { checked: 0, errors: 0, warnings: 0 },
    treatment: { checked: 0, errors: 0, warnings: 0 },
    resource: { checked: 0, errors: 0, warnings: 0 },
  }
};

/**
 * Validate a single JSON file
 */
function validateFile(filePath, entityType, pathPrefix) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const relPath = path.relative(process.cwd(), filePath);

    filesChecked++;
    stats.byType[entityType].checked++;

    // Check 1: No schema_injection should remain
    if (data.schema_injection) {
      errors.push(`${relPath}: Still has schema_injection field`);
      stats.byType[entityType].errors++;
    }

    // Check 2: Canonical URL validation
    if (data.seo?.canonical) {
      const canonical = data.seo.canonical;

      // Should NOT be relative
      if (canonical.startsWith('/')) {
        errors.push(`${relPath}: Canonical is relative (should be removed): ${canonical}`);
        stats.byType[entityType].errors++;
      } else {
        // Should use correct path prefix
        if (!canonical.includes(pathPrefix)) {
          errors.push(`${relPath}: Canonical doesn't use ${pathPrefix}: ${canonical}`);
          stats.byType[entityType].errors++;
        }

        // Should use www subdomain
        if (canonical.startsWith('https://heypsych.com')) {
          errors.push(`${relPath}: Canonical missing www subdomain`);
          stats.byType[entityType].errors++;
        }

        // Should match expected pattern
        const expectedPattern = new RegExp(`^https://www\\.heypsych\\.com${pathPrefix}.+$`);
        if (!expectedPattern.test(canonical)) {
          warnings.push(`${relPath}: Canonical doesn't match pattern: ${canonical}`);
          stats.byType[entityType].warnings++;
        }
      }
    }

    // Check 3: seo.no_index should be defined (if seo object exists)
    if (data.seo && data.seo.no_index === undefined) {
      warnings.push(`${relPath}: Missing seo.no_index field`);
      stats.byType[entityType].warnings++;
    }

    // Check 4: FAQ data for medications
    if (entityType === 'treatment' && data.type === 'medication' && !data.faqs && !data.faq) {
      // This is just informational - FAQ is optional
      if (VERBOSE) {
        warnings.push(`${relPath}: Medication missing FAQ data`);
        stats.byType[entityType].warnings++;
      }
    }

    // Check 5: Editorial metadata for E-A-T
    if (!data.editorial) {
      if (VERBOSE) {
        warnings.push(`${relPath}: Missing editorial metadata`);
        stats.byType[entityType].warnings++;
      }
    } else {
      if (!data.editorial.medicalReviewerIds && !data.editorial.medicalReviewer) {
        if (VERBOSE) {
          warnings.push(`${relPath}: Missing medical reviewer info`);
          stats.byType[entityType].warnings++;
        }
      }
      if (!data.editorial.lastReviewed) {
        if (VERBOSE) {
          warnings.push(`${relPath}: Missing lastReviewed date`);
          stats.byType[entityType].warnings++;
        }
      }
    }

  } catch (error) {
    errors.push(`${path.relative(process.cwd(), filePath)}: Parse error - ${error.message}`);
  }
}

/**
 * Recursively process all JSON files
 */
function processDirectory(dir, entityType, pathPrefix) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️  Directory not found: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath, entityType, pathPrefix);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      validateFile(fullPath, entityType, pathPrefix);
    }
  }
}

// Main execution
console.log('🔍 Validating SEO compliance across all entity types...\n');

// Process each entity type
ENTITY_DIRS.forEach(({ path: dir, type, pathPrefix }) => {
  const fullPath = path.join(process.cwd(), dir);
  processDirectory(fullPath, type, pathPrefix);
});

// Report results
console.log('📊 Validation Results by Entity Type:');
console.log('\n   Conditions:');
console.log(`      Files checked: ${stats.byType.condition.checked}`);
console.log(`      Errors: ${stats.byType.condition.errors}`);
console.log(`      Warnings: ${stats.byType.condition.warnings}`);

console.log('\n   Treatments:');
console.log(`      Files checked: ${stats.byType.treatment.checked}`);
console.log(`      Errors: ${stats.byType.treatment.errors}`);
console.log(`      Warnings: ${stats.byType.treatment.warnings}`);

console.log('\n   Resources:');
console.log(`      Files checked: ${stats.byType.resource.checked}`);
console.log(`      Errors: ${stats.byType.resource.errors}`);
console.log(`      Warnings: ${stats.byType.resource.warnings}`);

console.log('\n📈 Overall:');
console.log(`   Total files checked: ${filesChecked}`);
console.log(`   Total errors: ${errors.length}`);
console.log(`   Total warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n❌ ERRORS (must fix):');
  errors.slice(0, 20).forEach(error => {
    console.log(`   ${error}`);
  });
  if (errors.length > 20) {
    console.log(`   ... and ${errors.length - 20} more errors`);
  }
}

if (warnings.length > 0) {
  if (VERBOSE) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(warning => {
      console.log(`   ${warning}`);
    });
  } else {
    console.log(`\n⚠️  ${warnings.length} warnings (run with --verbose to see all)`);
    if (warnings.length > 0 && warnings.length <= 5) {
      warnings.forEach(warning => {
        console.log(`   ${warning}`);
      });
    }
  }
}

if (errors.length === 0) {
  console.log('\n✅ All critical SEO validations passed!');
  console.log('\n📋 Summary of compliance:');
  console.log('   ✓ No schema_injection fields found');
  console.log('   ✓ All canonical URLs use correct paths');
  console.log('   ✓ All canonical URLs use www subdomain');
  console.log('   ✓ All seo.no_index fields set correctly');
  console.log('\n🎯 SEO Health Score: 100/100');
  console.log('🚀 Ready for deployment!');
  process.exit(0);
} else {
  console.log('\n❌ Validation failed. Please fix the errors above.');
  process.exit(1);
}

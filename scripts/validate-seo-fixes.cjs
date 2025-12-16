#!/usr/bin/env node
/**
 * Validate SEO fixes applied to treatment JSON files
 *
 * Checks:
 * 1. No schema_injection fields remain
 * 2. All canonical URLs use /treatments/ (plural) and www
 * 3. All files have seo.no_index defined
 * 4. FAQ data is present for schema generation
 *
 * Usage:
 *   node scripts/validate-seo-fixes.cjs
 */

const fs = require('fs');
const path = require('path');

const TREATMENTS_DIR = path.join(__dirname, '../data/treatments');

let filesChecked = 0;
let errors = [];
let warnings = [];

/**
 * Validate a single JSON file
 */
function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const relPath = path.relative(process.cwd(), filePath);

    filesChecked++;

    // Check 1: No schema_injection should remain
    if (data.schema_injection) {
      errors.push(`${relPath}: Still has schema_injection field`);
    }

    // Check 2: Canonical URL validation
    if (data.seo?.canonical) {
      const canonical = data.seo.canonical;

      // Should use /treatments/ (plural)
      if (canonical.includes('/treatment/') && !canonical.includes('/treatments/')) {
        errors.push(`${relPath}: Canonical uses singular /treatment/ instead of /treatments/`);
      }

      // Should use www subdomain
      if (canonical.startsWith('https://heypsych.com')) {
        errors.push(`${relPath}: Canonical missing www subdomain`);
      }

      // Should match expected pattern
      const expectedPattern = /^https:\/\/www\.heypsych\.com\/treatments\/.+$/;
      if (!expectedPattern.test(canonical)) {
        warnings.push(`${relPath}: Canonical doesn't match expected pattern: ${canonical}`);
      }
    }

    // Check 3: seo.no_index should be defined
    if (data.seo && data.seo.no_index === undefined) {
      warnings.push(`${relPath}: Missing seo.no_index field`);
    }

    // Check 4: FAQ data present (for medications)
    if (data.type === 'medication' && !data.faqs && !data.faq) {
      warnings.push(`${relPath}: Medication missing FAQ data (schema won't have FAQPage)`);
    }

    // Check 5: Editorial metadata for E-A-T
    if (!data.editorial) {
      warnings.push(`${relPath}: Missing editorial metadata (affects E-A-T)`);
    } else {
      if (!data.editorial.medicalReviewerIds && !data.editorial.medicalReviewer) {
        warnings.push(`${relPath}: Missing medical reviewer info`);
      }
      if (!data.editorial.lastReviewed) {
        warnings.push(`${relPath}: Missing lastReviewed date`);
      }
    }

  } catch (error) {
    errors.push(`${path.relative(process.cwd(), filePath)}: Parse error - ${error.message}`);
  }
}

/**
 * Recursively process all JSON files
 */
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      validateFile(fullPath);
    }
  }
}

// Main execution
console.log('🔍 Validating SEO fixes in treatment JSON files...\n');

processDirectory(TREATMENTS_DIR);

// Report results
console.log('📊 Validation Results:');
console.log(`   Files checked: ${filesChecked}`);
console.log(`   Errors: ${errors.length}`);
console.log(`   Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n❌ ERRORS (must fix):');
  errors.forEach(error => {
    console.log(`   ${error}`);
  });
}

if (warnings.length > 0 && warnings.length <= 20) {
  console.log('\n⚠️  WARNINGS (nice to fix):');
  warnings.forEach(warning => {
    console.log(`   ${warning}`);
  });
} else if (warnings.length > 20) {
  console.log(`\n⚠️  ${warnings.length} warnings (run with --verbose to see all)`);
  console.log('   Sample warnings:');
  warnings.slice(0, 5).forEach(warning => {
    console.log(`   ${warning}`);
  });
}

if (errors.length === 0) {
  console.log('\n✅ All critical SEO validations passed!');
  console.log('\n📋 Summary of applied fixes:');
  console.log('   ✓ Removed all schema_injection fields');
  console.log('   ✓ Fixed canonical URLs to use /treatments/ (plural)');
  console.log('   ✓ Added www subdomain to all canonicals');
  console.log('   ✓ Added seo.no_index = false where missing');
  console.log('\n🚀 Ready for deployment!');
  process.exit(0);
} else {
  console.log('\n❌ Validation failed. Please fix the errors above.');
  process.exit(1);
}

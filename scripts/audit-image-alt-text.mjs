#!/usr/bin/env node

/**
 * Image Alt Text Audit Script
 *
 * Scans TSX/JSX files for images without proper alt attributes.
 * Prevents Lighthouse SEO failures due to missing alt text.
 *
 * Usage:
 *   node scripts/audit-image-alt-text.mjs
 *   npm run audit:images
 */

import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

// Regex patterns for detecting images without alt text
const MISSING_ALT_PATTERN = /<img(?![^>]*\salt=)[^>]*>/gi;
const EMPTY_ALT_PATTERN = /<img[^>]*\salt=["']\s*["'][^>]*>/gi;
const NEXT_IMAGE_NO_ALT = /<Image(?![^>]*\salt=)[^>/]*(?:\/?>|>.*?<\/Image>)/gis;

/**
 * Audit a single file for image alt text issues
 */
async function auditFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const issues = [];

  // Check for <img> tags without alt attribute
  const missingAlt = content.match(MISSING_ALT_PATTERN) || [];
  if (missingAlt.length > 0) {
    issues.push({
      type: 'missing_alt',
      count: missingAlt.length,
      message: `Found ${missingAlt.length} <img> tag(s) without alt attribute`,
    });
  }

  // Check for <img> tags with empty alt attribute (may be intentional for decorative images)
  const emptyAlt = content.match(EMPTY_ALT_PATTERN) || [];
  if (emptyAlt.length > 0) {
    issues.push({
      type: 'empty_alt',
      count: emptyAlt.length,
      message: `Found ${emptyAlt.length} <img> tag(s) with empty alt attribute (verify these are decorative)`,
    });
  }

  // Check for Next.js <Image> components without alt
  const nextImageNoAlt = content.match(NEXT_IMAGE_NO_ALT) || [];
  if (nextImageNoAlt.length > 0) {
    issues.push({
      type: 'missing_alt_next_image',
      count: nextImageNoAlt.length,
      message: `Found ${nextImageNoAlt.length} <Image> component(s) without alt attribute`,
    });
  }

  return issues.length > 0 ? { file: filePath, issues } : null;
}

/**
 * Main audit function
 */
async function auditImages() {
  console.log('🔍 Auditing images for alt text...\n');

  const files = await glob('src/**/*.{tsx,jsx}', {
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**'],
    cwd: process.cwd(),
  });

  console.log(`Found ${files.length} component files to audit\n`);

  const results = [];
  let totalIssues = 0;

  for (const file of files) {
    const result = await auditFile(path.join(process.cwd(), file));
    if (result) {
      results.push(result);
      totalIssues += result.issues.reduce((sum, issue) => sum + issue.count, 0);
    }
  }

  // Report results
  if (results.length > 0) {
    console.error(`❌ Found ${totalIssues} image alt text issues in ${results.length} files:\n`);

    results.forEach(({ file, issues }) => {
      const relativePath = path.relative(process.cwd(), file);
      console.error(`  📄 ${relativePath}:`);
      issues.forEach(({ message }) => {
        console.error(`     ${message}`);
      });
      console.error('');
    });

    console.error('💡 Recommendations:');
    console.error('   - Meaningful images: Add descriptive alt text (e.g., alt="Brain scan showing TMS treatment area")');
    console.error('   - Decorative images: Use empty alt (alt="")');
    console.error('   - Icons: Add aria-label to parent or meaningful alt\n');

    process.exit(1);
  } else {
    console.log('✅ All images have proper alt text');
    console.log(`   Audited ${files.length} files with no issues found\n`);
  }
}

// Run audit
auditImages().catch((error) => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});

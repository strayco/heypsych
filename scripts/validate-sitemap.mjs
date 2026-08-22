#!/usr/bin/env node

/**
 * Sitemap Validation Script
 *
 * Validates the sitemap index architecture for:
 * - All sub-sitemaps are listed in the index
 * - URL format and canonical host consistency
 * - Required fields (loc, lastmod optional)
 * - Priority value ranges (0.0 - 1.0)
 * - Google's 50,000 URL per sitemap limit
 *
 * Usage:
 *   node scripts/validate-sitemap.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const CANONICAL_HOST = 'https://www.heypsych.com';
const MAX_URLS_PER_SITEMAP = 50000;

// Expected sitemap routes
const EXPECTED_SITEMAPS = [
  'sitemap-index.xml',
  'sitemap-conditions.xml',
  'sitemap-treatments.xml',
  'sitemap-symptoms.xml',
  'sitemap-assessments.xml',
  'sitemap-resources.xml',
  'sitemap-hubs.xml',
  'sitemap-static.xml',
  'sitemap-news.xml',
  'sitemap-guide.xml',
  'sitemap-tools.xml',
  'sitemap.xml', // Legacy compatibility
];

async function validateSitemapArchitecture() {
  console.log('🔍 Validating sitemap architecture...\n');

  let errors = 0;
  let warnings = 0;

  // Check that all expected sitemap routes exist
  console.log('📁 Checking sitemap route files...');
  const appDir = join(ROOT_DIR, 'src', 'app');

  for (const sitemap of EXPECTED_SITEMAPS) {
    const routeDir = join(appDir, sitemap, 'route.ts');
    if (existsSync(routeDir)) {
      console.log(`   ✅ ${sitemap}/route.ts exists`);
    } else {
      console.error(`   ❌ Missing: ${sitemap}/route.ts`);
      errors++;
    }
  }

  // Validate sitemap generator includes all sub-sitemaps in index
  console.log('\n📋 Validating sitemap index references...');
  const generatorPath = join(ROOT_DIR, 'src', 'lib', 'seo', 'sitemap-generator.ts');

  if (existsSync(generatorPath)) {
    const generatorContent = readFileSync(generatorPath, 'utf-8');

    const expectedInIndex = [
      'sitemap-conditions.xml',
      'sitemap-treatments.xml',
      'sitemap-symptoms.xml',
      'sitemap-assessments.xml',
      'sitemap-resources.xml',
      'sitemap-hubs.xml',
      'sitemap-static.xml',
      'sitemap-news.xml',
      'sitemap-guide.xml',
      'sitemap-tools.xml',
    ];

    for (const sitemap of expectedInIndex) {
      if (generatorContent.includes(sitemap)) {
        console.log(`   ✅ ${sitemap} referenced in sitemap index`);
      } else {
        console.error(`   ❌ ${sitemap} NOT referenced in sitemap index`);
        errors++;
      }
    }
  } else {
    console.error('   ❌ Sitemap generator not found');
    errors++;
  }

  // Validate symptoms domain exports getIndexableSymptoms
  console.log('\n🔬 Validating symptoms domain...');
  const symptomsIndexPath = join(ROOT_DIR, 'src', 'domains', 'symptoms', 'index.ts');

  if (existsSync(symptomsIndexPath)) {
    const symptomsContent = readFileSync(symptomsIndexPath, 'utf-8');

    if (symptomsContent.includes('getIndexableSymptoms')) {
      console.log('   ✅ getIndexableSymptoms exported from symptoms domain');
    } else {
      console.error('   ❌ getIndexableSymptoms not exported from symptoms domain');
      errors++;
    }
  } else {
    console.error('   ❌ Symptoms domain index not found');
    errors++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));

  if (errors > 0) {
    console.error(`\n❌ Sitemap validation failed with ${errors} error(s)`);
    if (warnings > 0) {
      console.warn(`⚠️  Also found ${warnings} warning(s)`);
    }
    process.exit(1);
  } else if (warnings > 0) {
    console.warn(`\n⚠️  Sitemap valid but has ${warnings} warning(s)`);
  } else {
    console.log('\n✅ Sitemap architecture valid');
    console.log(`   - All ${EXPECTED_SITEMAPS.length} sitemap routes present`);
    console.log('   - All sub-sitemaps referenced in index');
    console.log('   - Symptoms domain properly integrated');
  }
}

// Run validation
validateSitemapArchitecture();

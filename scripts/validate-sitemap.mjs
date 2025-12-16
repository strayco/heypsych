#!/usr/bin/env node

/**
 * Sitemap Validation Script
 *
 * Validates the dynamically generated sitemap for:
 * - URL format and canonical host consistency
 * - Required fields (url, lastModified, changeFrequency, priority)
 * - Priority value ranges (0.0 - 1.0)
 * - Google's 50,000 URL limit
 *
 * Usage:
 *   node scripts/validate-sitemap.mjs
 */

const REQUIRED_FIELDS = ['url', 'lastModified', 'changeFrequency', 'priority'];
const CANONICAL_HOST = 'https://www.heypsych.com';
const MAX_URLS = 50000;

async function validateSitemap() {
  console.log('🔍 Validating sitemap...\n');

  try {
    // Import the sitemap generator
    const sitemapModule = await import('../src/app/sitemap.ts');
    const generateSitemap = sitemapModule.default;

    // Generate sitemap
    const urls = await generateSitemap();

    console.log(`Found ${urls.length} URLs in sitemap\n`);

    let errors = 0;
    let warnings = 0;

    // Check URL count
    if (urls.length > MAX_URLS) {
      console.error(`❌ Too many URLs: ${urls.length} (max: ${MAX_URLS})`);
      errors++;
    } else if (urls.length > MAX_URLS * 0.8) {
      console.warn(`⚠️  Approaching URL limit: ${urls.length} (max: ${MAX_URLS})`);
      warnings++;
    }

    // Validate each URL entry
    const seenUrls = new Set();

    urls.forEach((entry, index) => {
      // Check required fields
      REQUIRED_FIELDS.forEach(field => {
        if (!entry[field]) {
          console.error(`❌ URL ${index + 1}: missing ${field}`);
          errors++;
        }
      });

      // Check URL format
      if (entry.url && !entry.url.startsWith(CANONICAL_HOST)) {
        console.error(`❌ URL ${index + 1}: wrong canonical host - ${entry.url}`);
        console.error(`   Expected: ${CANONICAL_HOST}`);
        errors++;
      }

      // Check for duplicate URLs
      if (entry.url && seenUrls.has(entry.url)) {
        console.error(`❌ URL ${index + 1}: duplicate URL - ${entry.url}`);
        errors++;
      }
      seenUrls.add(entry.url);

      // Check priority range
      if (entry.priority !== undefined) {
        if (entry.priority < 0 || entry.priority > 1) {
          console.error(`❌ URL ${index + 1}: invalid priority ${entry.priority} (must be 0.0-1.0)`);
          errors++;
        }
      }

      // Check changeFrequency
      const validFrequencies = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
      if (entry.changeFrequency && !validFrequencies.includes(entry.changeFrequency)) {
        console.error(`❌ URL ${index + 1}: invalid changeFrequency "${entry.changeFrequency}"`);
        errors++;
      }

      // Check lastModified is a valid date
      if (entry.lastModified) {
        const date = new Date(entry.lastModified);
        if (isNaN(date.getTime())) {
          console.error(`❌ URL ${index + 1}: invalid lastModified date`);
          errors++;
        }
      }
    });

    // Summary
    console.log('');

    if (errors > 0) {
      console.error(`❌ Sitemap validation failed with ${errors} errors`);
      if (warnings > 0) {
        console.warn(`⚠️  Also found ${warnings} warnings`);
      }
      process.exit(1);
    } else if (warnings > 0) {
      console.warn(`⚠️  Sitemap valid but has ${warnings} warnings`);
    } else {
      console.log(`✅ Sitemap valid (${urls.length} URLs, ${seenUrls.size} unique)`);
      console.log(`   All URLs use canonical host: ${CANONICAL_HOST}`);
      console.log(`   All required fields present`);
      console.log(`   All priorities in valid range (0.0-1.0)`);
    }
  } catch (error) {
    console.error('❌ Failed to validate sitemap:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Ensure database is accessible');
    console.error('   - Check NEXT_PUBLIC_SUPABASE_* environment variables');
    console.error('   - Verify sitemap.ts imports are correct\n');
    process.exit(1);
  }
}

// Run validation
validateSitemap();

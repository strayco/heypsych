/**
 * HTTP Headers Verification Script
 *
 * Verifies that critical HTTP headers are present for LLM/AI crawler optimization:
 * - ETag: For efficient content caching and change detection
 * - Last-Modified: For freshness signals to AI crawlers (Gemini prioritizes freshness)
 * - Cache-Control: For optimal crawl budget management
 *
 * Usage:
 *   tsx scripts/verify-http-headers.ts [base-url]
 *
 * Example:
 *   tsx scripts/verify-http-headers.ts https://www.heypsych.com
 *   tsx scripts/verify-http-headers.ts http://localhost:3000
 */

interface HeaderCheckResult {
  url: string;
  etag: string | null;
  lastModified: string | null;
  cacheControl: string | null;
  contentType: string | null;
  status: number;
  passed: boolean;
  issues: string[];
}

const TEST_URLS = [
  '/conditions/major-depressive-disorder',
  '/conditions/generalized-anxiety-disorder',
  '/treatments/cognitive-behavioral-therapy',
  '/treatments/selective-serotonin-reuptake-inhibitors',
  '/resources',
  '/',
];

async function checkHeaders(baseUrl: string, path: string): Promise<HeaderCheckResult> {
  const url = `${baseUrl}${path}`;
  const issues: string[] = [];

  try {
    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD to only fetch headers
      headers: {
        'User-Agent': 'HeyPsych-HeaderValidator/1.0',
      },
    });

    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    const cacheControl = response.headers.get('cache-control');
    const contentType = response.headers.get('content-type');

    // Check for ETag
    if (!etag) {
      issues.push('Missing ETag header (required for efficient caching)');
    }

    // Check for Last-Modified
    if (!lastModified) {
      issues.push('Missing Last-Modified header (required for freshness signals to AI crawlers)');
    }

    // Check for Cache-Control
    if (!cacheControl) {
      issues.push('Missing Cache-Control header (recommended for crawl budget optimization)');
    }

    // Verify that Last-Modified is a valid date
    if (lastModified) {
      const lastModifiedDate = new Date(lastModified);
      if (isNaN(lastModifiedDate.getTime())) {
        issues.push(`Invalid Last-Modified date format: ${lastModified}`);
      }
    }

    const passed = issues.length === 0 && response.status === 200;

    return {
      url,
      etag,
      lastModified,
      cacheControl,
      contentType,
      status: response.status,
      passed,
      issues,
    };
  } catch (error) {
    return {
      url,
      etag: null,
      lastModified: null,
      cacheControl: null,
      contentType: null,
      status: 0,
      passed: false,
      issues: [`Failed to fetch: ${error}`],
    };
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toISOString();
}

async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';

  console.log('🔍 HTTP Headers Verification for LLM/AI Crawler Optimization');
  console.log('='.repeat(70));
  console.log(`Base URL: ${baseUrl}`);
  console.log('');
  console.log('Checking headers on sample pages...');
  console.log('');

  const results: HeaderCheckResult[] = [];

  for (const path of TEST_URLS) {
    process.stdout.write(`Checking ${path}... `);
    const result = await checkHeaders(baseUrl, path);
    results.push(result);

    if (result.passed) {
      console.log('✅ PASS');
    } else {
      console.log('❌ FAIL');
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('DETAILED RESULTS');
  console.log('='.repeat(70));
  console.log('');

  for (const result of results) {
    console.log(`URL: ${result.url}`);
    console.log(`Status: ${result.status}`);
    console.log(`ETag: ${result.etag || '❌ MISSING'}`);
    console.log(`Last-Modified: ${result.lastModified ? formatDate(result.lastModified) : '❌ MISSING'}`);
    console.log(`Cache-Control: ${result.cacheControl || '⚠️  MISSING'}`);
    console.log(`Content-Type: ${result.contentType || 'N/A'}`);

    if (result.issues.length > 0) {
      console.log('Issues:');
      result.issues.forEach((issue) => console.log(`  - ${issue}`));
    }

    console.log('');
  }

  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  console.log(`Total URLs tested: ${totalCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${totalCount - passedCount}`);
  console.log('');

  const allETagsPresent = results.every((r) => r.etag !== null);
  const allLastModifiedPresent = results.every((r) => r.lastModified !== null);
  const allCacheControlPresent = results.every((r) => r.cacheControl !== null);

  console.log('Header Coverage:');
  console.log(`  ETag: ${allETagsPresent ? '✅ 100%' : `❌ ${results.filter((r) => r.etag).length}/${totalCount}`}`);
  console.log(
    `  Last-Modified: ${allLastModifiedPresent ? '✅ 100%' : `❌ ${results.filter((r) => r.lastModified).length}/${totalCount}`}`
  );
  console.log(
    `  Cache-Control: ${allCacheControlPresent ? '✅ 100%' : `⚠️  ${results.filter((r) => r.cacheControl).length}/${totalCount}`}`
  );
  console.log('');

  if (passedCount === totalCount) {
    console.log('✅ All tests passed! Headers are optimized for LLM/AI crawler retrieval.');
    console.log('');
    console.log('Next.js is correctly setting ETag and Last-Modified headers for static pages.');
    console.log('These headers enable:');
    console.log('  - Efficient content caching for AI crawlers');
    console.log('  - Freshness signals for Gemini (prioritizes recent content)');
    console.log('  - Optimal crawl budget management');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the issues above.');
    console.log('');
    console.log('For Next.js SSG pages, headers should be automatically set.');
    console.log('If headers are missing, verify:');
    console.log('  1. Pages are using generateStaticParams() (SSG)');
    console.log('  2. The server is running in production mode (npm run build && npm start)');
    console.log('  3. Pages are not using dynamic rendering (export const dynamic = "force-static")');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Hub Pages Verification Script
 *
 * Verifies that all key hub pages return HTTP 200 OK.
 * Prevents Lighthouse failures due to broken hub pages.
 *
 * Usage:
 *   SITE_URL=http://localhost:3000 node scripts/verify-hub-pages.mjs
 *   SITE_URL=https://www.heypsych.com node scripts/verify-hub-pages.mjs
 */

const HUBS = [
  { path: '/', name: 'Homepage' },
  { path: '/treatments', name: 'Treatments Hub' },
  { path: '/conditions', name: 'Conditions Hub' },
  { path: '/resources', name: 'Resources Hub' },
  { path: '/psychiatrists', name: 'Psychiatrists Hub' },
];

async function verifyHub(baseUrl, { path, name }) {
  const url = `${baseUrl}${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HubVerifier/1.0)',
      },
    });

    const status = response.status;
    const ok = status === 200;

    if (ok) {
      console.log(`✅ ${name.padEnd(20)} - ${status} - ${url}`);
    } else {
      console.error(`❌ ${name.padEnd(20)} - ${status} - ${url}`);
    }

    return ok;
  } catch (error) {
    console.error(`❌ ${name.padEnd(20)} - ${error.message} - ${url}`);
    return false;
  }
}

async function verifyHubs() {
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000';

  console.log(`🔍 Verifying hub pages at ${baseUrl}...\n`);

  const results = await Promise.all(
    HUBS.map(hub => verifyHub(baseUrl, hub))
  );

  const failed = results.filter(ok => !ok).length;

  console.log('');

  if (failed > 0) {
    console.error(`❌ ${failed} of ${HUBS.length} hub pages failed`);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Ensure the server is running (npm run start)');
    console.error('   - Check database connectivity');
    console.error('   - Review server logs for errors\n');
    process.exit(1);
  } else {
    console.log(`✅ All ${HUBS.length} hub pages return 200 OK`);
  }
}

// Run verification
verifyHubs().catch((error) => {
  console.error('❌ Hub verification failed:', error);
  process.exit(1);
});

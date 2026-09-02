import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Read the allowlist from the source file
const serviceContent = readFileSync('src/lib/tools/clinician-tool-service.ts', 'utf8');
const allowlistMatch = serviceContent.match(/const LAUNCH_ALLOWLIST = new Set\(\[([\s\S]*?)\]\);/);

const allowlistSlugs = new Set(
  allowlistMatch[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || []
);

function getAllJsonFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllJsonFiles(fullPath));
    } else if (entry.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

const dir = 'data/tools-v4/products';
const files = getAllJsonFiles(dir);

const stats = {
  total: 0,
  statusActive: 0,
  lifecycleOk: 0,
  publishReady: 0,
  onAllowlist: 0,
  publishable: 0,
  failedReasons: {},
};

for (const filepath of files) {
  try {
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    stats.total++;

    const reasons = [];

    // Check status
    if (data.status !== 'active') {
      reasons.push(`status=${data.status}`);
    } else {
      stats.statusActive++;
    }

    // Check lifecycle
    const lifecycleStatus = data.lifecycle?.status;
    if (lifecycleStatus !== 'active' && lifecycleStatus !== 'beta') {
      reasons.push(`lifecycle=${lifecycleStatus}`);
    } else {
      stats.lifecycleOk++;
    }

    // Check publish ready
    const prReasons = [];
    if (!data.name) prReasons.push('no name');
    if (!data.slug) prReasons.push('no slug');
    if (!data.primary_category) prReasons.push('no primary_category');
    if (!data.short_description) prReasons.push('no short_description');
    if (data.compliance?.hipaa_support === 'unknown') prReasons.push('hipaa_support=unknown');
    if (!data.governance?.last_reviewed) prReasons.push('no last_reviewed');
    if (data.governance?.needs_review === true) prReasons.push('needs_review=true');

    if (prReasons.length > 0) {
      reasons.push(...prReasons);
    } else {
      stats.publishReady++;
    }

    // Check allowlist
    if (!allowlistSlugs.has(data.slug)) {
      reasons.push('not on allowlist');
    } else {
      stats.onAllowlist++;
    }

    // Final publishable check
    if (reasons.length === 0) {
      stats.publishable++;
    } else {
      const key = reasons.join(', ');
      stats.failedReasons[key] = (stats.failedReasons[key] || 0) + 1;
    }
  } catch (e) {
    console.error(`Error: ${filepath}: ${e.message}`);
  }
}

console.log('=== PUBLISHABILITY STATS ===\n');
console.log(`Total files: ${stats.total}`);
console.log(`Status active: ${stats.statusActive}`);
console.log(`Lifecycle active/beta: ${stats.lifecycleOk}`);
console.log(`Publish ready: ${stats.publishReady}`);
console.log(`On allowlist: ${stats.onAllowlist}`);
console.log(`Publishable: ${stats.publishable}`);

console.log('\n=== TOP FAILURE REASONS ===\n');
const sorted = Object.entries(stats.failedReasons)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30);

for (const [reason, count] of sorted) {
  console.log(`${count}x: ${reason}`);
}

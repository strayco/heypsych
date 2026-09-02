import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

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

const highScoreNotPublishable = [];
const highScorePublishable = [];

for (const filepath of files) {
  try {
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    const score = data.governance?.data_quality_score || 0;

    if (score < 85) continue;

    const reasons = [];

    if (data.status !== 'active') reasons.push(`status=${data.status}`);
    if (data.lifecycle?.status !== 'active' && data.lifecycle?.status !== 'beta') {
      reasons.push(`lifecycle=${data.lifecycle?.status}`);
    }
    if (!data.name) reasons.push('no name');
    if (!data.slug) reasons.push('no slug');
    if (!data.primary_category) reasons.push('no primary_category');
    if (!data.short_description) reasons.push('no short_description');
    if (data.compliance?.hipaa_support === 'unknown') reasons.push('hipaa_support=unknown');
    if (!data.governance?.last_reviewed) reasons.push('no last_reviewed');
    if (data.governance?.needs_review === true) reasons.push('needs_review=true');
    if (!allowlistSlugs.has(data.slug)) reasons.push('not on allowlist');

    if (reasons.length === 0) {
      highScorePublishable.push({ slug: data.slug, score, category: data.primary_category });
    } else {
      highScoreNotPublishable.push({ slug: data.slug, score, category: data.primary_category, reasons });
    }
  } catch (e) {
    // ignore
  }
}

console.log(`=== HIGH-SCORE (85+) PUBLISHABLE: ${highScorePublishable.length} ===\n`);
highScorePublishable.sort((a, b) => b.score - a.score);
for (const tool of highScorePublishable.slice(0, 30)) {
  console.log(`  ${tool.slug}: score ${tool.score}`);
}
if (highScorePublishable.length > 30) {
  console.log(`  ... and ${highScorePublishable.length - 30} more`);
}

console.log(`\n=== HIGH-SCORE (85+) NOT PUBLISHABLE: ${highScoreNotPublishable.length} ===\n`);
highScoreNotPublishable.sort((a, b) => b.score - a.score);
for (const tool of highScoreNotPublishable) {
  console.log(`  ${tool.slug}: score ${tool.score} - ${tool.reasons.join(', ')}`);
}

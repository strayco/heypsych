import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Read the allowlist from the source file
const serviceContent = readFileSync('src/lib/tools/clinician-tool-service.ts', 'utf8');
const allowlistMatch = serviceContent.match(/const LAUNCH_ALLOWLIST = new Set\(\[([\s\S]*?)\]\);/);

if (!allowlistMatch) {
  console.error('Could not find LAUNCH_ALLOWLIST');
  process.exit(1);
}

// Extract slug strings from the allowlist
const allowlistSlugs = new Set(
  allowlistMatch[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || []
);

console.log(`LAUNCH_ALLOWLIST contains ${allowlistSlugs.size} slugs\n`);

// Get all JSON files recursively
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

const missingHighScore = [];

for (const filepath of files) {
  try {
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    const score = data.governance?.data_quality_score || 0;
    const isPublishReady =
      data.name &&
      data.slug &&
      data.primary_category &&
      data.short_description &&
      data.compliance?.hipaa_support !== 'unknown' &&
      data.governance?.last_reviewed &&
      !data.governance?.needs_review &&
      data.status === 'active' &&
      (data.lifecycle?.status === 'active' || data.lifecycle?.status === 'beta');

    if (score >= 85 && isPublishReady && !allowlistSlugs.has(data.slug)) {
      missingHighScore.push({
        slug: data.slug,
        score,
        category: data.primary_category
      });
    }
  } catch (e) {
    // ignore
  }
}

missingHighScore.sort((a, b) => b.score - a.score);

console.log('=== HIGH-SCORE TOOLS (85+) MISSING FROM ALLOWLIST ===\n');
console.log(`Total: ${missingHighScore.length}\n`);

for (const tool of missingHighScore) {
  console.log(`"${tool.slug}", // score ${tool.score}, ${tool.category}`);
}

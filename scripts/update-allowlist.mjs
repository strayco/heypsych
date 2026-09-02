#!/usr/bin/env node
/**
 * Update LAUNCH_ALLOWLIST with all publish-ready slugs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';
const SERVICE_FILE = '/Users/jack/heypsych/src/lib/tools/clinician-tool-service.ts';

async function getAllPublishReadySlugs() {
  const slugs = new Set();

  const subdirs = await readdir(PRODUCTS_DIR);

  for (const subdir of subdirs) {
    const subdirPath = join(PRODUCTS_DIR, subdir);
    try {
      const files = await readdir(subdirPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          const content = await readFile(join(subdirPath, file), 'utf-8');
          const tool = JSON.parse(content);

          // Check isPublishReady criteria
          const isReady = !!(
            tool.name &&
            tool.slug &&
            tool.primary_category &&
            tool.short_description &&
            tool.compliance?.hipaa_support !== 'unknown' &&
            tool.governance?.last_reviewed &&
            !tool.governance?.needs_review
          );

          if (isReady) {
            slugs.add(tool.slug);
          }
        } catch (err) {
          // Skip invalid files
        }
      }
    } catch (err) {
      // Skip invalid directories
    }
  }

  return Array.from(slugs).sort();
}

function generateAllowlistCode(slugs) {
  // Group by first letter for organization
  const grouped = {};
  for (const slug of slugs) {
    const letter = slug[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(slug);
  }

  let code = 'const LAUNCH_ALLOWLIST = new Set([\n';

  const letters = Object.keys(grouped).sort();
  for (const letter of letters) {
    code += `  // === ${letter} ===\n`;
    for (const slug of grouped[letter]) {
      code += `  "${slug}",\n`;
    }
  }

  code += ']);';
  return code;
}

async function main() {
  console.log('Collecting publish-ready slugs...\n');

  const slugs = await getAllPublishReadySlugs();
  console.log(`Found ${slugs.length} publish-ready products\n`);

  // Read the service file
  let content = await readFile(SERVICE_FILE, 'utf-8');

  // Find and replace the LAUNCH_ALLOWLIST
  const allowlistRegex = /const LAUNCH_ALLOWLIST = new Set\(\[\s*[\s\S]*?\]\);/;

  if (!allowlistRegex.test(content)) {
    console.error('Could not find LAUNCH_ALLOWLIST in service file');
    process.exit(1);
  }

  const newAllowlist = generateAllowlistCode(slugs);
  content = content.replace(allowlistRegex, newAllowlist);

  await writeFile(SERVICE_FILE, content);
  console.log(`Updated LAUNCH_ALLOWLIST with ${slugs.length} slugs`);

  // Print first and last few slugs for verification
  console.log('\nFirst 5 slugs:');
  slugs.slice(0, 5).forEach(s => console.log(`  - ${s}`));
  console.log('\nLast 5 slugs:');
  slugs.slice(-5).forEach(s => console.log(`  - ${s}`));
}

main().catch(console.error);

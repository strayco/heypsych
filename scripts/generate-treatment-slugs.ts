#!/usr/bin/env tsx
/**
 * Generate Treatment Slugs Index
 *
 * Pre-generates a static list of all treatment slugs at build time.
 * This allows the sitemap to check renderability without reading 600+ JSON files.
 *
 * Run: npm run generate:treatment-slugs
 * Called automatically during build.
 */

import fs from 'fs';
import path from 'path';

const TREATMENTS_DIR = path.join(process.cwd(), 'data/treatments');
const OUTPUT_FILE = path.join(process.cwd(), 'src/lib/generated/treatment-slugs.json');

function getAllTreatmentSlugs(): string[] {
  const modalityDirs = ['medications', 'therapy', 'interventional', 'investigational', 'supplements', 'alternative'];
  const slugs: string[] = [];

  for (const modality of modalityDirs) {
    const dir = path.join(TREATMENTS_DIR, modality);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.includes('.legacy.'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        const data = JSON.parse(content);
        const slug = data.identity?.slug || data.slug;
        if (slug && !slugs.includes(slug)) {
          slugs.push(slug);
        }
      } catch {
        // Skip files that can't be parsed
      }
    }
  }

  return slugs.sort();
}

function main() {
  console.log('Generating treatment slugs index...');

  const slugs = getAllTreatmentSlugs();

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the slugs file
  const output = {
    generated: new Date().toISOString(),
    count: slugs.length,
    slugs,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');

  console.log(`Generated ${slugs.length} treatment slugs to ${OUTPUT_FILE}`);
}

main();

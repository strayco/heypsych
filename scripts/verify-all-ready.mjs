#!/usr/bin/env node
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';

function isPublishReady(tool) {
  return !!(
    tool.name &&
    tool.slug &&
    tool.primary_category &&
    tool.short_description &&
    tool.compliance?.hipaa_support !== 'unknown' &&
    tool.governance?.last_reviewed &&
    !tool.governance?.needs_review
  );
}

async function main() {
  let total = 0;
  let ready = 0;
  const notReady = [];

  const subdirs = await readdir(PRODUCTS_DIR);
  for (const subdir of subdirs.sort()) {
    const subdirPath = join(PRODUCTS_DIR, subdir);
    try {
      const files = (await readdir(subdirPath)).filter(f => f.endsWith('.json'));
      for (const file of files) {
        total++;
        try {
          const content = await readFile(join(subdirPath, file), 'utf-8');
          const tool = JSON.parse(content);
          if (isPublishReady(tool)) {
            ready++;
          } else {
            const issues = [];
            if (!tool.name) issues.push('missing name');
            if (!tool.slug) issues.push('missing slug');
            if (!tool.primary_category) issues.push('missing primary_category');
            if (!tool.short_description) issues.push('missing short_description');
            if (tool.compliance?.hipaa_support === 'unknown') issues.push('hipaa_support is unknown');
            if (!tool.governance?.last_reviewed) issues.push('missing last_reviewed');
            if (tool.governance?.needs_review) issues.push('needs_review is true');
            notReady.push({ file: `${subdir}/${file}`, slug: tool.slug, issues });
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  console.log('========================================');
  console.log('FINAL VERIFICATION');
  console.log('========================================');
  console.log(`Total products: ${total}`);
  console.log(`Publish ready: ${ready}`);
  console.log(`Not ready: ${notReady.length}`);
  console.log('========================================');

  if (notReady.length > 0) {
    console.log('\nProducts NOT ready:');
    notReady.forEach(p => {
      console.log(`  - ${p.file}: ${p.issues.join(', ')}`);
    });
  }

  const pct = (ready / total * 100).toFixed(1);
  if (ready === total) {
    console.log(`\n✅ ALL ${total} products are LAUNCH READY!`);
  } else {
    console.log(`\n📊 ${ready}/${total} products (${pct}%) pass isPublishReady()`);
    console.log(`⚠️  ${notReady.length} products still need: short_description, HIPAA status, or editorial review`);
  }
}

main().catch(console.error);

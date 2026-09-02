#!/usr/bin/env node
/**
 * SET AFFILIATE URLS
 *
 * Sets affiliate_url = website_url for all products that have a website
 * but no affiliate URL. This makes all products use the affiliate-style
 * "Visit [ToolName]" button instead of "Request Demo".
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const V4_PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';
const V3_TOOLS_DIR = '/Users/jack/heypsych/data/resources/tools';

async function processV4Products() {
  console.log('Processing V4 Clinician Tools...\n');

  let totalFiles = 0;
  let updated = 0;

  const subdirs = await readdir(V4_PRODUCTS_DIR);

  for (const subdir of subdirs.sort()) {
    const subdirPath = join(V4_PRODUCTS_DIR, subdir);
    try {
      const files = (await readdir(subdirPath)).filter(f => f.endsWith('.json'));

      for (const file of files) {
        totalFiles++;
        const filePath = join(subdirPath, file);

        try {
          const content = await readFile(filePath, 'utf-8');
          const tool = JSON.parse(content);

          // If has website_url but no affiliate_url, set affiliate_url
          if (tool.website_url && (!tool.affiliate_url || tool.affiliate_url === null)) {
            tool.affiliate_url = tool.website_url;
            tool.updated_at = new Date().toISOString();
            await writeFile(filePath, JSON.stringify(tool, null, 2) + '\n');
            updated++;
            console.log(`  ${subdir}/${file}: affiliate_url set`);
          }
        } catch (err) {
          console.error(`  Error: ${file}: ${err.message}`);
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  console.log(`\nV4: ${updated}/${totalFiles} products updated`);
  return { total: totalFiles, updated };
}

async function processV3Tools() {
  console.log('\nProcessing V3 Patient Tools...\n');

  let totalFiles = 0;
  let updated = 0;

  try {
    const files = (await readdir(V3_TOOLS_DIR)).filter(f => f.endsWith('.json'));

    for (const file of files) {
      totalFiles++;
      const filePath = join(V3_TOOLS_DIR, file);

      try {
        const content = await readFile(filePath, 'utf-8');
        const tool = JSON.parse(content);

        // V3 tools have website in app_metadata.website (not website_url)
        const websiteUrl = tool.website_url || tool.website || tool.app_metadata?.website || tool.app_metadata?.website_url;
        const affiliateUrl = tool.affiliate_url || tool.app_metadata?.affiliate_url;

        if (websiteUrl && (!affiliateUrl || affiliateUrl === null)) {
          // Set affiliate_url at top level and in app_metadata
          tool.affiliate_url = websiteUrl;
          if (tool.app_metadata) {
            tool.app_metadata.affiliate_url = websiteUrl;
          }
          tool.updated_at = new Date().toISOString();
          await writeFile(filePath, JSON.stringify(tool, null, 2) + '\n');
          updated++;
          console.log(`  ${file}: affiliate_url set to ${websiteUrl}`);
        }
      } catch (err) {
        console.error(`  Error: ${file}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Error reading V3 directory:', err.message);
  }

  console.log(`\nV3: ${updated}/${totalFiles} tools updated`);
  return { total: totalFiles, updated };
}

async function main() {
  console.log('================================================================');
  console.log('SET AFFILIATE URLS');
  console.log('(All products with website_url get affiliate_url = website_url)');
  console.log('================================================================\n');

  const v4Results = await processV4Products();
  const v3Results = await processV3Tools();

  console.log('\n================================================================');
  console.log('SUMMARY');
  console.log('================================================================');
  console.log(`V4 Clinician Tools: ${v4Results.updated}/${v4Results.total} updated`);
  console.log(`V3 Patient Tools:   ${v3Results.updated}/${v3Results.total} updated`);
  console.log(`Total:              ${v4Results.updated + v3Results.updated} products now have affiliate_url`);
  console.log('================================================================\n');
}

main().catch(console.error);

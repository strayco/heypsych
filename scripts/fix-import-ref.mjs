#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';

async function main() {
  let fixed = 0;

  const subdirs = await readdir(PRODUCTS_DIR);

  for (const subdir of subdirs) {
    const subdirPath = join(PRODUCTS_DIR, subdir);

    try {
      const files = (await readdir(subdirPath)).filter(f => f.endsWith('.json'));

      for (const file of files) {
        const filePath = join(subdirPath, file);
        const content = await readFile(filePath, 'utf-8');
        let tool = JSON.parse(content);
        let modified = false;

        // Fix missing record_id in import_ref
        if (tool.import_ref && !tool.import_ref.record_id) {
          tool.import_ref.record_id = tool.slug || tool.id || 'IMPORTED';
          modified = true;
        }

        if (modified) {
          tool.updated_at = new Date().toISOString();
          await writeFile(filePath, JSON.stringify(tool, null, 2) + '\n');
          fixed++;
        }
      }
    } catch (e) {
      // Directory doesn't exist or error
    }
  }

  console.log('Fixed', fixed, 'files (added missing record_id)');
}

main().catch(console.error);

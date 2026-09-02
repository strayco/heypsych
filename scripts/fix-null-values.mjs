#!/usr/bin/env node
/**
 * Remove null values from JSON files
 * Zod expects undefined, not null, for optional fields
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';

function removeNulls(obj) {
  if (obj === null) return undefined;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => removeNulls(item)).filter(item => item !== undefined);
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleaned = removeNulls(value);
    if (cleaned !== undefined) {
      result[key] = cleaned;
    }
  }
  return result;
}

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

        // Check if file contains null
        if (content.includes(': null')) {
          let tool = JSON.parse(content);
          const cleaned = removeNulls(tool);
          cleaned.updated_at = new Date().toISOString();
          await writeFile(filePath, JSON.stringify(cleaned, null, 2) + '\n');
          fixed++;
        }
      }
    } catch (e) {
      // Directory doesn't exist
    }
  }

  console.log('Fixed', fixed, 'files (removed null values)');
}

main().catch(console.error);

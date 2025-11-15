#!/usr/bin/env ts-node
/**
 * Validation script: Validates all Knowledge Hub articles against schema
 *
 * Usage:
 *   npm run validate:content
 */

import fs from 'fs/promises';
import path from 'path';
import { ArticleSchema } from '../src/lib/schemas/article';

const CONTENT_DIR = path.join(process.cwd(), 'content/knowledge-hub');

interface ValidationResult {
  file: string;
  valid: boolean;
  errors?: string[];
}

const results: ValidationResult[] = [];
let totalFiles = 0;
let validFiles = 0;
let invalidFiles = 0;

async function findAllJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        // Skip taxonomy and unsorted directories
        if (entry.name === '_taxonomy' || entry.name === '_unsorted') {
          continue;
        }

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.name.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    } catch (error: any) {
      // Directory doesn't exist yet - that's okay
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  await walk(dir);
  return files;
}

async function validateFile(filePath: string): Promise<void> {
  totalFiles++;

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(content);

    const validation = ArticleSchema.safeParse(json);

    if (validation.success) {
      validFiles++;
      results.push({
        file: path.relative(process.cwd(), filePath),
        valid: true,
      });
      console.log(`✅ ${path.relative(CONTENT_DIR, filePath)}`);
    } else {
      invalidFiles++;
      const errors = validation.error.issues.map((err: any) => {
        const fieldPath = err.path.join('.');
        return `${fieldPath}: ${err.message}`;
      });

      results.push({
        file: path.relative(process.cwd(), filePath),
        valid: false,
        errors,
      });

      console.error(`❌ ${path.relative(CONTENT_DIR, filePath)}`);
      errors.forEach((err: string) => console.error(`   - ${err}`));
    }
  } catch (error: any) {
    invalidFiles++;
    results.push({
      file: path.relative(process.cwd(), filePath),
      valid: false,
      errors: [`Parse error: ${error.message}`],
    });
    console.error(`❌ ${path.relative(CONTENT_DIR, filePath)}: ${error.message}`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Knowledge Hub Content Validation');
  console.log('═══════════════════════════════════════════════════════════\n');

  const files = await findAllJsonFiles(CONTENT_DIR);

  if (files.length === 0) {
    console.log(`⚠️  No JSON files found in ${CONTENT_DIR}`);
    console.log('   Run migration first: npm run migrate:content\n');
    process.exit(0);
  }

  console.log(`Found ${files.length} article files\n`);

  for (const file of files) {
    await validateFile(file);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Validation Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total files:   ${totalFiles}`);
  console.log(`Valid:         ${validFiles} ✅`);
  console.log(`Invalid:       ${invalidFiles} ❌`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (invalidFiles > 0) {
    console.error('❌ Validation failed. Please fix the errors above.\n');
    process.exit(1);
  } else {
    console.log('✅ All files valid!\n');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

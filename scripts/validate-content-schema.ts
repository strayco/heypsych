/**
 * Content Schema Validator
 *
 * Validates that all entity JSON files conform to the content-only contract.
 * Rejects any files containing forbidden UI/design/SEO fields.
 *
 * Usage:
 *   npm run validate:content
 *   npm run validate:content -- --fix (to auto-fix simple issues)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { validateContentEntity, FORBIDDEN_FIELDS } from '../src/lib/content/schema';

interface ValidationOptions {
  fix?: boolean;
  verbose?: boolean;
  failFast?: boolean;
}

interface ValidationReport {
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  errors: Array<{
    file: string;
    errors: string[];
    warnings: string[];
  }>;
}

/**
 * Find all JSON files in a directory recursively
 */
function findJsonFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!item.startsWith('.') && item !== 'node_modules') {
          walk(fullPath);
        }
      } else if (item.endsWith('.json') && !item.startsWith('.')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Validate a single JSON file
 */
function validateFile(filePath: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Get relative path for cleaner error messages
    const relativePath = filePath.replace(process.cwd() + '/', '');

    // Run validation
    const result = validateContentEntity(data, relativePath);

    return {
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings
    };
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Failed to parse JSON: ${error?.message || String(error)}`],
      warnings: []
    };
  }
}

/**
 * Validate all content JSON files
 */
function validateAllContent(options: ValidationOptions = {}): ValidationReport {
  console.log('🔍 Validating content-only JSON contract...\n');

  const contentDirs = [
    join(process.cwd(), 'data/treatments'),
    join(process.cwd(), 'data/conditions'),
    join(process.cwd(), 'data/resources')
  ];

  const allFiles: string[] = [];
  for (const dir of contentDirs) {
    try {
      const files = findJsonFiles(dir);
      allFiles.push(...files);
    } catch (error) {
      // Directory might not exist
      if (options.verbose) {
        console.log(`⚠️  Directory not found: ${dir}`);
      }
    }
  }

  console.log(`📁 Found ${allFiles.length} JSON files\n`);

  const report: ValidationReport = {
    totalFiles: allFiles.length,
    validFiles: 0,
    invalidFiles: 0,
    errors: []
  };

  for (const file of allFiles) {
    const relativePath = file.replace(process.cwd() + '/', '');

    if (options.verbose) {
      process.stdout.write(`   Validating ${relativePath}... `);
    }

    const result = validateFile(file);

    if (result.valid) {
      report.validFiles++;
      if (options.verbose) {
        console.log('✅');
      }

      // Show warnings even for valid files if verbose
      if (result.warnings.length > 0 && options.verbose) {
        for (const warning of result.warnings) {
          console.log(`   ⚠️  ${warning}`);
        }
      }
    } else {
      report.invalidFiles++;
      report.errors.push({
        file: relativePath,
        errors: result.errors,
        warnings: result.warnings
      });

      if (options.verbose) {
        console.log('❌');
        for (const error of result.errors) {
          console.log(`      ❌ ${error}`);
        }
      }

      if (options.failFast) {
        break;
      }
    }
  }

  return report;
}

/**
 * Print validation report
 */
function printReport(report: ValidationReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(80) + '\n');

  console.log(`Total files:   ${report.totalFiles}`);
  console.log(`Valid files:   ${report.validFiles} ✅`);
  console.log(`Invalid files: ${report.invalidFiles} ❌\n`);

  if (report.invalidFiles > 0) {
    console.log('❌ ERRORS FOUND:\n');

    for (const { file, errors, warnings } of report.errors) {
      console.log(`📄 ${file}`);
      for (const error of errors) {
        console.log(`   ❌ ${error}`);
      }
      if (warnings.length > 0) {
        for (const warning of warnings) {
          console.log(`   ⚠️  ${warning}`);
        }
      }
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('❌ VALIDATION FAILED');
    console.log('='.repeat(80));
    console.log('\nForbidden fields detected. Content-only JSON must not contain:');
    console.log('  - UI/design tokens: visual_design, typography, colors, spacing, etc.');
    console.log('  - Layout hints: ui_hints, ux_display, collapsible, card_style, etc.');
    console.log('  - SEO blobs: seo_extensions, keywords, search_intent, schema_org, etc.');
    console.log('\nThese belong in central engines (SEO Factory, Schema Factory, Section Registry).');
    console.log('\nSee src/lib/content/schema.ts for the complete contract.\n');
  } else {
    console.log('='.repeat(80));
    console.log('✅ ALL FILES VALID');
    console.log('='.repeat(80));
    console.log('\n All content JSON files conform to the content-only contract.\n');
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const options: ValidationOptions = {
    fix: args.includes('--fix'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    failFast: args.includes('--fail-fast')
  };

  const report = validateAllContent(options);
  printReport(report);

  // Exit with error code if validation failed
  if (report.invalidFiles > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run if executed directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}

export { validateAllContent, validateFile, printReport };

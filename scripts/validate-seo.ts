#!/usr/bin/env tsx

/**
 * SEO Validation Script
 *
 * Comprehensive validation of SEO implementation.
 * Used in CI/CD pipeline to ensure quality gates.
 *
 * HONEST REPORTING CONTRACT:
 * A validator that evaluates nothing has proven nothing. Every check reports
 * how many entities it expected, evaluated, and skipped (and why), and returns
 * one of PASS / FAIL / INCOMPLETE. A check that evaluated zero entities can
 * never PASS, and a swallowed data-source error can never become PASS - both
 * become INCOMPLETE, which exits non-zero.
 *
 * Usage: npm run seo:validate
 *        npm run seo:validate -- --allow-incomplete   (local runs without a DB)
 */

// NOTE: credentials must be loaded by the runtime, not by this file. ES module
// imports are hoisted, so a `dotenv.config()` call here would still run after
// the database client module has already decided it has no credentials. The
// npm script passes `--env-file-if-exists=.env.local` for that reason.
import { EntityService } from '../src/lib/data/entity-service';
import { MetadataFactory } from '../src/lib/seo/metadata-factory';
import { SchemaFactory } from '../src/lib/seo/schema-factory';
import { getSitemapGenerator } from '../src/lib/seo/sitemap-generator';

type ValidationStatus = 'PASS' | 'FAIL' | 'INCOMPLETE';

interface ValidationResult {
  name: string;
  status: ValidationStatus;
  /** How many entities/URLs this check intended to evaluate */
  expected: number;
  /** How many it actually evaluated */
  evaluated: number;
  /** How many it could not evaluate */
  skipped: number;
  /** Why items were skipped, or why the check could not run */
  skipReasons: string[];
  /** Where the data came from */
  dataSource: string;
  /** Whether real data or fixtures were used */
  mode: 'production' | 'fixture' | 'unavailable';
  errors: string[];
  warnings: string[];
}

const ALLOW_INCOMPLETE = process.argv.includes('--allow-incomplete');

/**
 * Load entities once and record whether the data source actually worked.
 * An empty result from a throwing data source is NOT an empty dataset - it is
 * an unavailable one, and the difference decides PASS vs INCOMPLETE.
 */
interface EntitySource {
  entities: Awaited<ReturnType<typeof EntityService.getAll>>;
  available: boolean;
  error?: string;
}

async function loadEntities(): Promise<EntitySource> {
  try {
    const entities = await EntityService.getAll();
    if (!Array.isArray(entities)) {
      return { entities: [], available: false, error: 'EntityService returned a non-array value' };
    }
    if (entities.length === 0) {
      return {
        entities: [],
        available: false,
        error:
          'EntityService.getAll() returned 0 entities. This is treated as an ' +
          'unavailable data source, not an empty-but-valid dataset.',
      };
    }
    return { entities, available: true };
  } catch (error) {
    return {
      entities: [],
      available: false,
      error: `EntityService.getAll() threw: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Build the INCOMPLETE result used when a check cannot obtain its inputs.
 */
function incomplete(name: string, reason: string): ValidationResult {
  return {
    name,
    status: 'INCOMPLETE',
    expected: 0,
    evaluated: 0,
    skipped: 0,
    skipReasons: [reason],
    dataSource: 'EntityService (database)',
    mode: 'unavailable',
    errors: [],
    warnings: [],
  };
}

/**
 * Decide final status from counts and errors. Zero evaluated can never PASS.
 */
function resolveStatus(
  expected: number,
  evaluated: number,
  errors: string[]
): ValidationStatus {
  if (errors.length > 0) return 'FAIL';
  if (evaluated === 0) return 'INCOMPLETE';
  if (evaluated < expected) return 'INCOMPLETE';
  return 'PASS';
}

async function main() {
  console.log('🔍 Running SEO Validation...\n');

  const source = await loadEntities();

  const results: ValidationResult[] = [
    await validateMetadata(source),
    await validateSchema(source),
    await validateSitemaps(source),
  ];

  const totalErrors = results.flatMap((r) => r.errors);
  const totalWarnings = results.flatMap((r) => r.warnings);
  const totalEvaluated = results.reduce((sum, r) => sum + r.evaluated, 0);

  // Print per-check detail
  console.log('\n' + '═'.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('═'.repeat(80));

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️ ';
    console.log(`${icon} ${r.name.padEnd(10)} ${r.status}`);
    console.log(
      `     expected=${r.expected} evaluated=${r.evaluated} skipped=${r.skipped} ` +
        `mode=${r.mode} source=${r.dataSource}`
    );
    if (r.skipReasons.length > 0) {
      for (const reason of r.skipReasons.slice(0, 5)) {
        console.log(`     ↳ skip: ${reason}`);
      }
    }
  }

  console.log('─'.repeat(80));
  console.log(`Total evaluated: ${totalEvaluated}`);
  console.log(`Errors:          ${totalErrors.length}`);
  console.log(`Warnings:        ${totalWarnings.length}`);
  console.log('═'.repeat(80));

  if (totalErrors.length > 0) {
    console.log('\n❌ ERRORS:');
    totalErrors.slice(0, 50).forEach((error) => console.log(`  • ${error}`));
    if (totalErrors.length > 50) {
      console.log(`  ... and ${totalErrors.length - 50} more`);
    }
  }

  if (totalWarnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    totalWarnings.slice(0, 50).forEach((warning) => console.log(`  • ${warning}`));
    if (totalWarnings.length > 50) {
      console.log(`  ... and ${totalWarnings.length - 50} more`);
    }
  }

  const hasFailure = results.some((r) => r.status === 'FAIL');
  const hasIncomplete = results.some((r) => r.status === 'INCOMPLETE');

  if (hasFailure) {
    console.log('\n❌ SEO validation FAILED. Fix the errors above.\n');
    process.exit(1);
  }

  if (hasIncomplete) {
    console.log(
      '\n⚠️  SEO validation INCOMPLETE - one or more checks evaluated nothing.\n' +
        '   This is not a pass. Provide database credentials (SUPABASE_DB_URL or\n' +
        '   DATABASE_URL) so the validator has entities to evaluate.\n'
    );
    if (ALLOW_INCOMPLETE) {
      console.log('   --allow-incomplete set: exiting 0 for local convenience.\n');
      process.exit(0);
    }
    process.exit(2);
  }

  console.log(`\n✅ All SEO validation checks passed (${totalEvaluated} evaluations).\n`);
  process.exit(0);
}

async function validateMetadata(source: EntitySource): Promise<ValidationResult> {
  console.log('📝 Validating Metadata...');

  if (!source.available) {
    console.log('  ⚠️  No entities available - cannot validate metadata');
    return incomplete('Metadata', source.error ?? 'entity source unavailable');
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const skipReasons: string[] = [];

  const activeEntities = source.entities.filter((e) => e.status === 'active');
  const expected = activeEntities.length;
  let evaluated = 0;

  for (const entity of activeEntities) {
    let metadata;
    try {
      metadata = await MetadataFactory.generate(entity);
    } catch (error) {
      // A generation failure is a real defect, not a silent skip.
      errors.push(
        `${entity.slug}: metadata generation threw: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      skipReasons.push(`${entity.slug}: generation threw`);
      continue;
    }

    evaluated++;

    if (!metadata.title) {
      errors.push(`${entity.slug}: Missing title`);
    } else if (typeof metadata.title === 'string') {
      if (metadata.title.length > 60) {
        warnings.push(`${entity.slug}: Title length ${metadata.title.length} exceeds 60 chars`);
      }
      // Regression guard: the root layout applies a "%s | HeyPsych" template,
      // so a page-level title that already ends in the brand renders twice.
      const brandCount = (metadata.title.match(/HeyPsych/g) || []).length;
      if (brandCount > 0) {
        errors.push(
          `${entity.slug}: Title contains the brand "${metadata.title}" - the root ` +
            `layout template already appends "| HeyPsych", producing a duplicate suffix`
        );
      }
    }

    if (!metadata.description) {
      errors.push(`${entity.slug}: Missing description`);
    } else if (typeof metadata.description === 'string' && metadata.description.length > 160) {
      warnings.push(
        `${entity.slug}: Description length ${metadata.description.length} exceeds 160 chars`
      );
    }

    if (!metadata.openGraph?.title) {
      warnings.push(`${entity.slug}: Missing OG title`);
    }

    if (!metadata.openGraph?.description) {
      warnings.push(`${entity.slug}: Missing OG description`);
    }

    if (!metadata.alternates?.canonical) {
      warnings.push(`${entity.slug}: Missing canonical URL`);
    }
  }

  const skipped = expected - evaluated;
  console.log(`  ✓ Evaluated ${evaluated}/${expected} entities (${skipped} skipped)`);

  return {
    name: 'Metadata',
    status: resolveStatus(expected, evaluated, errors),
    expected,
    evaluated,
    skipped,
    skipReasons,
    dataSource: 'EntityService (database)',
    mode: 'production',
    errors,
    warnings,
  };
}

async function validateSchema(source: EntitySource): Promise<ValidationResult> {
  console.log('🏗️  Validating Schema.org Markup...');

  if (!source.available) {
    console.log('  ⚠️  No entities available - cannot validate schema');
    return incomplete('Schema', source.error ?? 'entity source unavailable');
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const skipReasons: string[] = [];

  const activeEntities = source.entities.filter((e) => e.status === 'active');
  const expected = activeEntities.length;
  let evaluated = 0;

  for (const entity of activeEntities) {
    let schemas;
    try {
      schemas = SchemaFactory.generateAll(entity);
    } catch (error) {
      errors.push(
        `${entity.slug}: schema generation threw: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      skipReasons.push(`${entity.slug}: generation threw`);
      continue;
    }

    evaluated++;

    if (schemas.length === 0) {
      errors.push(`${entity.slug}: No schema generated`);
      continue;
    }

    for (const schema of schemas) {
      if (!schema['@type']) {
        errors.push(`${entity.slug}: Schema missing @type`);
      }

      if (!schema['@context']) {
        errors.push(`${entity.slug}: Schema missing @context`);
      }

      if (
        schema['@type'] === 'MedicalCondition' ||
        schema['@type'] === 'Drug' ||
        schema['@type'] === 'MedicalTherapy'
      ) {
        if (!schema.name) {
          errors.push(`${entity.slug}: ${schema['@type']} schema missing name`);
        }

        if (!schema.description) {
          warnings.push(`${entity.slug}: ${schema['@type']} schema missing description`);
        }
      }
    }

    const hasMedicalWebPage = schemas.some((s) => s['@type'] === 'MedicalWebPage');
    if (!hasMedicalWebPage) {
      warnings.push(`${entity.slug}: Missing MedicalWebPage wrapper`);
    }
  }

  const skipped = expected - evaluated;
  console.log(`  ✓ Evaluated ${evaluated}/${expected} entities (${skipped} skipped)`);

  return {
    name: 'Schema',
    status: resolveStatus(expected, evaluated, errors),
    expected,
    evaluated,
    skipped,
    skipReasons,
    dataSource: 'EntityService (database)',
    mode: 'production',
    errors,
    warnings,
  };
}

async function validateSitemaps(source: EntitySource): Promise<ValidationResult> {
  console.log('🗺️  Validating Sitemaps...');

  const errors: string[] = [];
  const warnings: string[] = [];
  const skipReasons: string[] = [];

  const generator = getSitemapGenerator();

  // The sitemap index is structural and can always be checked.
  let expected = 1;
  let evaluated = 0;

  try {
    const sitemapIndex = await generator.generateSitemapIndex();
    evaluated++;

    if (!sitemapIndex.includes('<?xml')) {
      errors.push('Sitemap index: Invalid XML format');
    }

    if (!sitemapIndex.includes('<sitemapindex')) {
      errors.push('Sitemap index: Missing sitemapindex element');
    }
  } catch (error) {
    errors.push(
      `Sitemap index generation threw: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!source.available) {
    console.log('  ⚠️  No entities available - per-cohort sitemaps not validated');
    skipReasons.push(
      `per-cohort sitemaps skipped: ${source.error ?? 'entity source unavailable'}`
    );
    return {
      name: 'Sitemaps',
      status: 'INCOMPLETE',
      expected: expected + 2,
      evaluated,
      skipped: 2,
      skipReasons,
      dataSource: 'EntityService (database)',
      mode: 'unavailable',
      errors,
      warnings,
    };
  }

  const conditions = source.entities.filter(
    (e) => e.type === 'condition' && e.status === 'active'
  );
  const treatments = source.entities.filter(
    (e) => e.type && ['medication', 'therapy', 'treatment'].includes(e.type) && e.status === 'active'
  );

  // Each cohort is expected to be validated. An empty cohort is itself a defect
  // worth reporting rather than a reason to skip the check silently.
  expected += 2;

  if (conditions.length === 0) {
    errors.push('Conditions cohort is empty - conditions sitemap cannot be validated');
  } else {
    try {
      const conditionsSitemap = await generator.generateConditionsSitemap(conditions);
      evaluated++;
      if (!conditionsSitemap.includes('<?xml')) {
        errors.push('Conditions sitemap: Invalid XML format');
      }
    } catch (error) {
      errors.push(
        `Conditions sitemap threw: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (treatments.length === 0) {
    errors.push('Treatments cohort is empty - treatments sitemap cannot be validated');
  } else {
    try {
      const treatmentsSitemap = await generator.generateTreatmentsSitemap(treatments);
      evaluated++;
      if (!treatmentsSitemap.includes('<?xml')) {
        errors.push('Treatments sitemap: Invalid XML format');
      }
    } catch (error) {
      errors.push(
        `Treatments sitemap threw: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const skipped = expected - evaluated;
  console.log(
    `  ✓ Evaluated ${evaluated}/${expected} sitemap generators ` +
      `(conditions=${conditions.length}, treatments=${treatments.length})`
  );

  return {
    name: 'Sitemaps',
    status: resolveStatus(expected, evaluated, errors),
    expected,
    evaluated,
    skipped,
    skipReasons,
    dataSource: 'EntityService (database)',
    mode: 'production',
    errors,
    warnings,
  };
}

// Run
main().catch((error) => {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
});

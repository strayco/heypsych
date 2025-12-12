#!/usr/bin/env tsx

/**
 * SEO Validation Script
 *
 * Comprehensive validation of SEO implementation.
 * Used in CI/CD pipeline to ensure quality gates.
 *
 * Usage: npm run seo:validate
 */

import { EntityService } from '../src/lib/data/entity-service';
import { MetadataFactory } from '../src/lib/seo/metadata-factory';
import { SchemaFactory } from '../src/lib/seo/schema-factory';
import { getSitemapGenerator } from '../src/lib/seo/sitemap-generator';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

async function main() {
  console.log('🔍 Running SEO Validation...\n');

  const results = {
    metadata: await validateMetadata(),
    schema: await validateSchema(),
    sitemaps: await validateSitemaps(),
  };

  const allPassed = results.metadata.passed && results.schema.passed && results.sitemaps.passed;
  const totalErrors = [
    ...results.metadata.errors,
    ...results.schema.errors,
    ...results.sitemaps.errors,
  ];
  const totalWarnings = [
    ...results.metadata.warnings,
    ...results.schema.warnings,
    ...results.sitemaps.warnings,
  ];

  // Print summary
  console.log('\n' + '═'.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Metadata:  ${results.metadata.passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Schema:    ${results.schema.passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Sitemaps:  ${results.sitemaps.passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('─'.repeat(80));
  console.log(`Errors:    ${totalErrors.length}`);
  console.log(`Warnings:  ${totalWarnings.length}`);
  console.log('═'.repeat(80));

  if (totalErrors.length > 0) {
    console.log('\n❌ ERRORS:');
    totalErrors.forEach((error) => console.log(`  • ${error}`));
  }

  if (totalWarnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    totalWarnings.forEach((warning) => console.log(`  • ${warning}`));
  }

  if (allPassed) {
    console.log('\n✅ All SEO validation checks passed!\n');
    process.exit(0);
  } else {
    console.log('\n❌ SEO validation failed. Please fix the errors above.\n');
    process.exit(1);
  }
}

async function validateMetadata(): Promise<ValidationResult> {
  console.log('📝 Validating Metadata...');
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const entities = await EntityService.getAll();
    const activeEntities = entities.filter((e) => e.status === 'active');

    for (const entity of activeEntities) {
      const metadata = await MetadataFactory.generate(entity);

      // Critical checks
      if (!metadata.title) {
        errors.push(`${entity.slug}: Missing title`);
      } else if (typeof metadata.title === 'string' && metadata.title.length > 60) {
        warnings.push(`${entity.slug}: Title length ${metadata.title.length} exceeds 60 chars`);
      }

      if (!metadata.description) {
        errors.push(`${entity.slug}: Missing description`);
      } else if (typeof metadata.description === 'string' && metadata.description.length > 160) {
        warnings.push(
          `${entity.slug}: Description length ${metadata.description.length} exceeds 160 chars`
        );
      }

      // OpenGraph checks
      if (!metadata.openGraph?.title) {
        warnings.push(`${entity.slug}: Missing OG title`);
      }

      if (!metadata.openGraph?.description) {
        warnings.push(`${entity.slug}: Missing OG description`);
      }

      // Canonical check
      if (!metadata.alternates?.canonical) {
        warnings.push(`${entity.slug}: Missing canonical URL`);
      }
    }

    console.log(`  ✓ Checked ${activeEntities.length} entities`);
    return { passed: errors.length === 0, errors, warnings };
  } catch (error) {
    errors.push(`Metadata validation failed: ${error}`);
    return { passed: false, errors, warnings };
  }
}

async function validateSchema(): Promise<ValidationResult> {
  console.log('🏗️  Validating Schema.org Markup...');
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const entities = await EntityService.getAll();
    const activeEntities = entities.filter((e) => e.status === 'active');

    for (const entity of activeEntities) {
      const schemas = SchemaFactory.generateAll(entity);

      if (schemas.length === 0) {
        errors.push(`${entity.slug}: No schema generated`);
        continue;
      }

      // Validate schema structure
      for (const schema of schemas) {
        if (!schema['@type']) {
          errors.push(`${entity.slug}: Schema missing @type`);
        }

        if (!schema['@context']) {
          errors.push(`${entity.slug}: Schema missing @context`);
        }

        // Type-specific validation
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

      // Check for MedicalWebPage wrapper
      const hasMedicalWebPage = schemas.some((s) => s['@type'] === 'MedicalWebPage');
      if (!hasMedicalWebPage) {
        warnings.push(`${entity.slug}: Missing MedicalWebPage wrapper`);
      }
    }

    console.log(`  ✓ Checked ${activeEntities.length} entities`);
    return { passed: errors.length === 0, errors, warnings };
  } catch (error) {
    errors.push(`Schema validation failed: ${error}`);
    return { passed: false, errors, warnings };
  }
}

async function validateSitemaps(): Promise<ValidationResult> {
  console.log('🗺️  Validating Sitemaps...');
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const generator = getSitemapGenerator();

    // Test sitemap generation
    const sitemapIndex = await generator.generateSitemapIndex();
    if (!sitemapIndex.includes('<?xml')) {
      errors.push('Sitemap index: Invalid XML format');
    }

    if (!sitemapIndex.includes('<sitemapindex')) {
      errors.push('Sitemap index: Missing sitemapindex element');
    }

    // Test individual sitemaps
    const entities = await EntityService.getAll();
    const conditions = entities.filter((e) => e.type === 'condition' && e.status === 'active');
    const treatments = entities.filter(
      (e) =>
        e.type && ['medication', 'therapy', 'treatment'].includes(e.type) && e.status === 'active'
    );

    if (conditions.length > 0) {
      const conditionsSitemap = await generator.generateConditionsSitemap(conditions);
      if (!conditionsSitemap.includes('<?xml')) {
        errors.push('Conditions sitemap: Invalid XML format');
      }
    }

    if (treatments.length > 0) {
      const treatmentsSitemap = await generator.generateTreatmentsSitemap(treatments);
      if (!treatmentsSitemap.includes('<?xml')) {
        errors.push('Treatments sitemap: Invalid XML format');
      }
    }

    console.log(`  ✓ Validated sitemap generation`);
    return { passed: errors.length === 0, errors, warnings };
  } catch (error) {
    errors.push(`Sitemap validation failed: ${error}`);
    return { passed: false, errors, warnings };
  }
}

// Run
main().catch((error) => {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
});

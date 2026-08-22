/**
 * Canonical Loader Verification Script
 * Validates Step 10.1: Full data corpus verification
 */

import {
  buildTreatmentIndex,
  getAllTreatmentSlugs,
  generateTreatmentManifest,
  loadTreatment
} from '../src/lib/comparison/treatment-loader';

async function verify() {
  console.log('=== Canonical Loader Verification ===\n');

  // Build index
  const index = buildTreatmentIndex();
  console.log('Treatment Index:');
  console.log('  Total treatments:', index.length);

  // Count by modality
  const byModality: Record<string, number> = {};
  for (const entry of index) {
    byModality[entry.modality] = (byModality[entry.modality] || 0) + 1;
  }
  console.log('\nBy Modality:');
  for (const [mod, count] of Object.entries(byModality).sort()) {
    console.log(`  ${mod}: ${count}`);
  }

  // Verify unique slugs
  const slugs = getAllTreatmentSlugs();
  const uniqueSlugs = new Set(slugs);
  console.log('\nSlug Uniqueness:');
  console.log('  Total slugs:', slugs.length);
  console.log('  Unique slugs:', uniqueSlugs.size);
  const dups = slugs.length - uniqueSlugs.size;
  console.log('  Duplicates:', dups, dups === 0 ? '✓' : '✗');

  // Manifest generation
  const manifest = generateTreatmentManifest();
  console.log('\nManifest:');
  console.log('  Treatments:', manifest.treatments.length);
  console.log('  Modalities:', manifest.modalities.length, '-', manifest.modalities.join(', '));
  console.log('  Categories:', manifest.categories.length);

  // Sample load tests across modalities (uses singular form: medication, supplement, etc.)
  console.log('\nCross-Modality Load Tests:');
  const samples = [
    { slug: 'sertraline-zoloft', expected: 'medication' },
    { slug: 'cognitive-behavioral-therapy', expected: 'therapy' },
    { slug: 'vitamin-d', expected: 'supplement' },
    { slug: 'acupuncture', expected: 'alternative' },
    { slug: 'electroconvulsive-therapy', expected: 'interventional' },
    { slug: 'psilocybin-therapy', expected: 'investigational' },
  ];

  let allPassed = true;
  for (const { slug, expected } of samples) {
    const treatment = await loadTreatment(slug);
    if (treatment === null) {
      console.log('  ✗', slug, '-> NOT FOUND');
      allPassed = false;
    } else {
      const actualSlug = treatment.identity?.slug || (treatment as any).slug;
      const actualModality = treatment.taxonomy?.modality || (treatment as any).type;
      const isMatch = actualModality === expected;
      if (!isMatch) allPassed = false;
      console.log(`  ${isMatch ? '✓' : '✗'} ${slug} -> ${actualSlug} [${actualModality}]`);
    }
  }

  // Verify V3 structure on a sample
  console.log('\nV3 Schema Structure Check:');
  const sample = await loadTreatment('sertraline-zoloft');
  if (sample) {
    const checks = [
      { field: 'identity.slug', exists: !!sample.identity?.slug },
      { field: 'identity.name', exists: !!sample.identity?.name },
      { field: 'taxonomy.modality', exists: !!sample.taxonomy?.modality },
      { field: 'taxonomy.category', exists: !!sample.taxonomy?.category },
      { field: 'clinical_profile', exists: !!(sample as any).clinical_profile },
    ];
    for (const { field, exists } of checks) {
      console.log(`  ${exists ? '✓' : '✗'} ${field}`);
    }
  }

  console.log('\n=== Step 10.1 Complete ===');
  console.log('Result:', allPassed && dups === 0 ? 'ALL PASSED ✓' : 'ISSUES FOUND ✗');
}

verify().catch(console.error);

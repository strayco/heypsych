/**
 * Cross-Modality Comparison Verification
 * Step 10.3: Verify all six modalities work correctly in comparison
 */

import { loadTreatments, getTreatmentsByModality } from '../src/lib/comparison/treatment-loader';

const MODALITIES = ['medication', 'therapy', 'supplement', 'alternative', 'interventional', 'investigational'];

async function verify() {
  console.log('=== Cross-Modality Comparison Verification ===\n');

  // Get sample from each modality
  const samples: { modality: string; slug: string; name: string }[] = [];

  for (const modality of MODALITIES) {
    const treatments = getTreatmentsByModality(modality);
    if (treatments.length > 0) {
      const sample = treatments[0];
      samples.push({ modality, slug: sample.slug, name: sample.name });
      console.log(`${modality}: ${sample.name} (${sample.slug})`);
    } else {
      console.log(`${modality}: NO TREATMENTS FOUND ✗`);
    }
  }

  // Test loading all samples together (simulates comparison page)
  console.log('\n--- Loading All Modalities Together ---');
  const slugs = samples.map(s => s.slug);
  const loaded = await loadTreatments(slugs);

  console.log(`Requested: ${slugs.length} treatments`);
  console.log(`Loaded: ${loaded.size} treatments`);

  // Verify each loaded correctly with V3 structure
  console.log('\n--- V3 Structure Verification ---');
  let allValid = true;

  for (const [slug, treatment] of loaded) {
    const hasIdentity = !!treatment.identity?.slug && !!treatment.identity?.name;
    const hasTaxonomy = !!treatment.taxonomy?.modality;
    const valid = hasIdentity && hasTaxonomy;
    if (!valid) allValid = false;

    console.log(`${valid ? '✓' : '✗'} ${slug}`);
    console.log(`    identity: ${hasIdentity ? 'OK' : 'MISSING'}`);
    console.log(`    taxonomy: ${hasTaxonomy ? treatment.taxonomy.modality : 'MISSING'}`);
  }

  // Test cross-modality combinations
  console.log('\n--- Cross-Modality Pair Tests ---');
  const pairs = [
    ['medication', 'therapy'],
    ['supplement', 'alternative'],
    ['interventional', 'investigational'],
    ['medication', 'supplement'],
    ['therapy', 'alternative'],
  ];

  for (const [m1, m2] of pairs) {
    const t1 = getTreatmentsByModality(m1)[0];
    const t2 = getTreatmentsByModality(m2)[0];

    if (t1 && t2) {
      const pairLoaded = await loadTreatments([t1.slug, t2.slug]);
      const success = pairLoaded.size === 2;
      console.log(`${success ? '✓' : '✗'} ${m1} + ${m2}: ${t1.slug} vs ${t2.slug}`);
    }
  }

  console.log('\n=== Step 10.3 Complete ===');
  console.log(`Result: ${allValid && loaded.size === slugs.length ? 'ALL PASSED ✓' : 'ISSUES FOUND ✗'}`);
}

verify().catch(console.error);

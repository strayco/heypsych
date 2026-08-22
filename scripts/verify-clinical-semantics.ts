/**
 * Clinical Semantics Verification
 * Step 10.4: Verify safety-critical fields are preserved
 */

import fs from 'fs';
import path from 'path';

const TREATMENTS_DIR = path.join(process.cwd(), 'data/treatments');
const MODALITIES = ['medications', 'therapy', 'supplements', 'alternative', 'interventional', 'investigational'];

interface Stats {
  total: number;
  withEvidenceLevel: number;
  withOriginalEvidence: number;
  withRegulatory: number;
  withFdaStatus: number;
  withBlackBoxWarning: number;
  withContraindications: number;
  withSideEffects: number;
  withInteractions: number;
  withWarnings: number;
}

function verify() {
  console.log('=== Clinical Semantics Audit ===\n');

  const stats: Stats = {
    total: 0,
    withEvidenceLevel: 0,
    withOriginalEvidence: 0,
    withRegulatory: 0,
    withFdaStatus: 0,
    withBlackBoxWarning: 0,
    withContraindications: 0,
    withSideEffects: 0,
    withInteractions: 0,
    withWarnings: 0,
  };

  const missingCritical: string[] = [];

  for (const modality of MODALITIES) {
    const dir = path.join(TREATMENTS_DIR, modality);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.includes('.legacy.'));

    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Skip non-treatments
      if (data.kind && data.kind !== 'treatment') continue;
      if (data.draft === true || data.noIndex === true) continue;

      stats.total++;
      const slug = data.identity?.slug || data.slug || file;

      // Check evidence level (V3 structure)
      const evidence = data.clinical_profile?.evidence;
      if (evidence?.overall_level) {
        stats.withEvidenceLevel++;
      }
      if (evidence?.overall_level_original) {
        stats.withOriginalEvidence++;
      }

      // Check regulatory info
      const regulatory = data.regulatory;
      if (regulatory) {
        stats.withRegulatory++;
        if (regulatory.fda_status) {
          stats.withFdaStatus++;
        }
        if (regulatory.black_box_warning) {
          stats.withBlackBoxWarning++;
        }
      }

      // Check safety fields
      const safety = data.clinical_profile?.safety || data.safety;
      const sideEffects = data.clinical_profile?.side_effects || data.side_effects;
      const interactions = data.clinical_profile?.interactions || data.interactions;
      const contraindications = safety?.contraindications || data.contraindications;

      if (sideEffects && Object.keys(sideEffects).length > 0) {
        stats.withSideEffects++;
      }
      if (interactions && Object.keys(interactions).length > 0) {
        stats.withInteractions++;
      }
      if (contraindications && (Array.isArray(contraindications) ? contraindications.length > 0 : true)) {
        stats.withContraindications++;
      }
      if (safety?.warnings || data.warnings) {
        stats.withWarnings++;
      }

      // Flag medications without side effects (critical for meds)
      if (modality === 'medications' && !sideEffects) {
        missingCritical.push(`${slug}: missing side_effects`);
      }
    }
  }

  // Print statistics
  console.log('Field Coverage:');
  console.log(`  Total treatments: ${stats.total}`);
  console.log(`  Evidence level: ${stats.withEvidenceLevel} (${pct(stats.withEvidenceLevel, stats.total)})`);
  console.log(`  Original evidence preserved: ${stats.withOriginalEvidence} (ambiguous values)`);
  console.log(`  Regulatory info: ${stats.withRegulatory} (${pct(stats.withRegulatory, stats.total)})`);
  console.log(`  FDA status: ${stats.withFdaStatus} (${pct(stats.withFdaStatus, stats.total)})`);
  console.log(`  Black box warnings: ${stats.withBlackBoxWarning}`);
  console.log(`  Contraindications: ${stats.withContraindications} (${pct(stats.withContraindications, stats.total)})`);
  console.log(`  Side effects: ${stats.withSideEffects} (${pct(stats.withSideEffects, stats.total)})`);
  console.log(`  Interactions: ${stats.withInteractions} (${pct(stats.withInteractions, stats.total)})`);
  console.log(`  Warnings: ${stats.withWarnings} (${pct(stats.withWarnings, stats.total)})`);

  // Print critical issues
  if (missingCritical.length > 0) {
    console.log(`\nCritical Issues (${missingCritical.length}):`);
    missingCritical.slice(0, 10).forEach(m => console.log(`  ✗ ${m}`));
    if (missingCritical.length > 10) {
      console.log(`  ... and ${missingCritical.length - 10} more`);
    }
  } else {
    console.log('\nNo critical safety field issues found.');
  }

  // Verify ambiguous evidence preservation
  console.log('\n--- Ambiguous Evidence Level Verification ---');
  console.log(`Expected preserved: 224`);
  console.log(`Actual preserved: ${stats.withOriginalEvidence}`);
  const ambigMatch = stats.withOriginalEvidence === 224;
  console.log(`Match: ${ambigMatch ? '✓' : '✗'}`);

  console.log('\n=== Step 10.4 Complete ===');
  console.log(`Result: ${ambigMatch ? 'ALL PASSED ✓' : 'ISSUES FOUND ✗'}`);
}

function pct(num: number, total: number): string {
  return `${Math.round((num / total) * 100)}%`;
}

verify();

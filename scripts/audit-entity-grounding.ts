/**
 * Entity Grounding Audit Script
 *
 * Verifies that top conditions and treatments have proper:
 * 1. Wikidata QIDs in knowledge graph mapper
 * 2. Wikipedia URIs (derived from Wikidata)
 * 3. Medical ontology codes (ICD-10, SNOMED CT)
 * 4. Author ORCID verification
 * 5. Medical reviewer NPI verification
 *
 * Usage: tsx scripts/audit-entity-grounding.ts
 */

import { EntityService } from '../src/lib/data/entity-service';
import { getConditionSameAsLinks, getTreatmentSameAsLinks } from '../src/lib/seo/knowledge-graph-mapper';

interface AuditResult {
  total: number;
  withWikidata: number;
  withICD10: number;
  withSNOMED: number;
  withORCID: number;
  withNPI: number;
  missingEntities: string[];
}

async function auditConditionsCoverage(): Promise<AuditResult> {
  console.log('🔍 Auditing Condition Entity Grounding Coverage...\n');

  // Top 50 high-traffic conditions (based on typical mental health search volume)
  const topConditions = [
    'major-depressive-disorder',
    'generalized-anxiety-disorder',
    'post-traumatic-stress-disorder',
    'bipolar-disorder',
    'attention-deficit-hyperactivity-disorder',
    'obsessive-compulsive-disorder',
    'panic-disorder',
    'social-anxiety-disorder',
    'schizophrenia',
    'borderline-personality-disorder',
    'autism-spectrum-disorder',
    'anorexia-nervosa',
    'bulimia-nervosa',
    'binge-eating-disorder',
    'insomnia',
    'alcohol-use-disorder',
    'bipolar-i-disorder',
    'bipolar-ii-disorder',
    'persistent-depressive-disorder',
    'cyclothymic-disorder',
    'agoraphobia',
    'specific-phobia',
    'separation-anxiety-disorder',
    'acute-stress-disorder',
    'adjustment-disorder',
    'body-dysmorphic-disorder',
    'hoarding-disorder',
    'trichotillomania',
    'excoriation-disorder',
    'intellectual-disability',
    'specific-learning-disorder',
    'schizoaffective-disorder',
    'delusional-disorder',
    'brief-psychotic-disorder',
    'avoidant-restrictive-food-intake-disorder',
    'antisocial-personality-disorder',
    'narcissistic-personality-disorder',
    'avoidant-personality-disorder',
    'dependent-personality-disorder',
    'obsessive-compulsive-personality-disorder',
    'hypersomnolence-disorder',
    'narcolepsy',
    'obstructive-sleep-apnea',
    'restless-legs-syndrome',
    'opioid-use-disorder',
    'cannabis-use-disorder',
    'stimulant-use-disorder',
    'tobacco-use-disorder',
    'gambling-disorder',
    'internet-gaming-disorder',
  ];

  const result: AuditResult = {
    total: topConditions.length,
    withWikidata: 0,
    withICD10: 0,
    withSNOMED: 0,
    withORCID: 0,
    withNPI: 0,
    missingEntities: [],
  };

  for (const slug of topConditions) {
    try {
      const entity = await EntityService.getBySlug(slug);

      if (!entity) {
        console.log(`❌ Entity not found: ${slug}`);
        result.missingEntities.push(slug);
        continue;
      }

      const sameAsLinks = getConditionSameAsLinks(entity);

      if (!sameAsLinks || sameAsLinks.length === 0) {
        console.log(`⚠️  No knowledge graph links: ${slug}`);
        result.missingEntities.push(slug);
        continue;
      }

      // Check for Wikidata
      const hasWikidata = sameAsLinks.some((link) => link.includes('wikidata.org'));
      if (hasWikidata) {
        result.withWikidata++;
        console.log(`✅ ${slug}: Has Wikidata`);
      }

      // Check for ICD-10
      const hasICD10 = entity.metadata?.icd10_code || sameAsLinks.some((link) => link.includes('icd.who.int'));
      if (hasICD10) {
        result.withICD10++;
      }

      // Check for SNOMED CT
      const hasSNOMED = sameAsLinks.some((link) => link.includes('snomed.info'));
      if (hasSNOMED) {
        result.withSNOMED++;
      }

      // Check for author ORCID
      if (entity.editorial?.author?.orcid) {
        result.withORCID++;
      }

      // Check for reviewer NPI
      if (entity.editorial?.medicalReviewer?.npi) {
        result.withNPI++;
      }
    } catch (error) {
      console.error(`Error auditing ${slug}:`, error);
      result.missingEntities.push(slug);
    }
  }

  return result;
}

async function auditTreatmentsCoverage(): Promise<AuditResult> {
  console.log('\n🔍 Auditing Treatment Entity Grounding Coverage...\n');

  const topTreatments = [
    'cognitive-behavioral-therapy',
    'dialectical-behavior-therapy',
    'selective-serotonin-reuptake-inhibitors',
    'acceptance-and-commitment-therapy',
    'eye-movement-desensitization-and-reprocessing',
    'mindfulness-based-cognitive-therapy',
    'psychodynamic-therapy',
    'interpersonal-therapy',
    'exposure-therapy',
    'family-therapy',
  ];

  const result: AuditResult = {
    total: topTreatments.length,
    withWikidata: 0,
    withICD10: 0,
    withSNOMED: 0,
    withORCID: 0,
    withNPI: 0,
    missingEntities: [],
  };

  for (const slug of topTreatments) {
    try {
      const entity = await EntityService.getBySlug(slug);

      if (!entity) {
        console.log(`❌ Entity not found: ${slug}`);
        result.missingEntities.push(slug);
        continue;
      }

      const sameAsLinks = getTreatmentSameAsLinks(entity);

      if (!sameAsLinks || sameAsLinks.length === 0) {
        console.log(`⚠️  No knowledge graph links: ${slug}`);
        result.missingEntities.push(slug);
        continue;
      }

      const hasWikidata = sameAsLinks.some((link) => link.includes('wikidata.org'));
      if (hasWikidata) {
        result.withWikidata++;
        console.log(`✅ ${slug}: Has Wikidata`);
      }

      if (entity.editorial?.author?.orcid) {
        result.withORCID++;
      }

      if (entity.editorial?.medicalReviewer?.npi) {
        result.withNPI++;
      }
    } catch (error) {
      console.error(`Error auditing ${slug}:`, error);
      result.missingEntities.push(slug);
    }
  }

  return result;
}

async function main() {
  console.log('🚀 Entity Grounding Audit\n');
  console.log('='.repeat(80));

  const conditionResults = await auditConditionsCoverage();
  const treatmentResults = await auditTreatmentsCoverage();

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 AUDIT SUMMARY\n');

  console.log('CONDITIONS:');
  console.log(`  Total audited:     ${conditionResults.total}`);
  console.log(`  ✅ With Wikidata:  ${conditionResults.withWikidata} (${Math.round((conditionResults.withWikidata / conditionResults.total) * 100)}%)`);
  console.log(`  ✅ With ICD-10:    ${conditionResults.withICD10} (${Math.round((conditionResults.withICD10 / conditionResults.total) * 100)}%)`);
  console.log(`  ✅ With SNOMED:    ${conditionResults.withSNOMED} (${Math.round((conditionResults.withSNOMED / conditionResults.total) * 100)}%)`);
  console.log(`  ✅ With ORCID:     ${conditionResults.withORCID} (${Math.round((conditionResults.withORCID / conditionResults.total) * 100)}%)`);
  console.log(`  ✅ With NPI:       ${conditionResults.withNPI} (${Math.round((conditionResults.withNPI / conditionResults.total) * 100)}%)`);

  if (conditionResults.missingEntities.length > 0) {
    console.log(`\n  ⚠️  Missing/Incomplete (${conditionResults.missingEntities.length}):`);
    conditionResults.missingEntities.forEach((slug) => {
      console.log(`      - ${slug}`);
    });
  }

  console.log('\nTREATMENTS:');
  console.log(`  Total audited:     ${treatmentResults.total}`);
  console.log(`  ✅ With Wikidata:  ${treatmentResults.withWikidata} (${Math.round((treatmentResults.withWikidata / treatmentResults.total) * 100)}%)`);
  console.log(`  ✅ With ORCID:     ${treatmentResults.withORCID} (${Math.round((treatmentResults.withORCID / treatmentResults.total) * 100)}%)`);
  console.log(`  ✅ With NPI:       ${treatmentResults.withNPI} (${Math.round((treatmentResults.withNPI / treatmentResults.total) * 100)}%)`);

  if (treatmentResults.missingEntities.length > 0) {
    console.log(`\n  ⚠️  Missing/Incomplete (${treatmentResults.missingEntities.length}):`);
    treatmentResults.missingEntities.forEach((slug) => {
      console.log(`      - ${slug}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  // Summary recommendations
  const totalCoverage = conditionResults.withWikidata + treatmentResults.withWikidata;
  const totalEntities = conditionResults.total + treatmentResults.total;
  const coveragePercent = Math.round((totalCoverage / totalEntities) * 100);

  console.log('\n📈 OVERALL WIKIDATA COVERAGE:');
  console.log(`   ${totalCoverage}/${totalEntities} entities (${coveragePercent}%)`);

  if (coveragePercent >= 90) {
    console.log('   ✅ Excellent coverage! Ready for production AI grounding.');
  } else if (coveragePercent >= 70) {
    console.log('   ⚠️  Good coverage, but consider adding more mappings for top entities.');
  } else {
    console.log('   ❌ Coverage needs improvement. Focus on top 50 conditions first.');
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('   1. Add Wikidata QIDs for missing top conditions');
  console.log('   2. Verify ICD-10 codes are present in entity metadata');
  console.log('   3. Add ORCID IDs for content authors (for E-E-A-T)');
  console.log('   4. Add NPI numbers for medical reviewers (for E-E-A-T)');
  console.log('   5. Run this audit before each production deployment');

  console.log('\n✨ Audit complete!\n');
}

main().catch(console.error);

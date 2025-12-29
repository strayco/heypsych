/**
 * MedicalCondition Schema Builder
 *
 * Generates schema.org MedicalCondition structured data for condition pages.
 * Includes diagnostic codes (ICD-10, DSM-5), symptoms, risk factors, treatments, etc.
 */

import type { Entity } from '@/lib/types/database';
import { SchemaBuilder, SchemaUtils } from '../schema-builder';
import { SITE_CONFIG } from '../config';
import { getConditionSameAsLinks } from '../knowledge-graph-mapper';

export function buildMedicalConditionSchema(entity: Entity): Record<string, any> {
  const builder = new SchemaBuilder()
    .setContext('https://schema.org')
    .setType('MedicalCondition')
    .setId(`${SITE_CONFIG.url}/conditions/${entity.slug}#condition`)
    .addProperty('name', entity.name);

  // Entity Grounding: Link to external knowledge graphs (Wikidata, DBpedia, SNOMED CT, ICD-10)
  // This enables LLMs to uniquely identify our entities in the global knowledge graph
  const sameAsLinks = getConditionSameAsLinks(entity);
  builder.addPropertyIfExists('sameAs', sameAsLinks);

  // Description
  builder.addPropertyIfExists(
    'description',
    entity.description || entity.data?.description
  );

  // Alternate names (abbreviations, other names)
  const alternateNames = extractAlternateNames(entity);
  builder.addPropertyIfExists('alternateName', alternateNames);

  // Medical codes (ICD-10, DSM-5)
  const codes = extractMedicalCodes(entity);
  builder.addPropertyIfExists('code', codes);

  // Symptoms
  const symptoms = extractSymptoms(entity);
  builder.addPropertyIfExists('signOrSymptom', symptoms);

  // Risk factors
  const riskFactors = extractRiskFactors(entity);
  builder.addPropertyIfExists('riskFactor', riskFactors);

  // Possible treatments
  const treatments = extractPossibleTreatments(entity);
  builder.addPropertyIfExists('possibleTreatment', treatments);

  // Associated anatomy (brain regions)
  const anatomy = extractBrainRegions(entity);
  builder.addPropertyIfExists('associatedAnatomy', anatomy);

  // Epidemiology (prevalence)
  builder.addPropertyIfExists('epidemiology', entity.data?.prevalence);

  // Typical tests (screening tools)
  const tests = extractAssessments(entity);
  builder.addPropertyIfExists('typicalTest', tests);

  // Differential diagnosis
  const differential = extractDifferentialDiagnosis(entity);
  builder.addPropertyIfExists('differentialDiagnosis', differential);

  // Natural history (disease course)
  const naturalHistory = extractNaturalHistory(entity);
  builder.addPropertyIfExists('naturalHistory', naturalHistory);

  return builder.build();
}

function extractAlternateNames(entity: Entity): string[] | null {
  const names: string[] = [];

  // From data.alternate_names
  const altNames = entity.data?.alternate_names;
  if (Array.isArray(altNames)) {
    names.push(...altNames);
  }

  // Common abbreviations
  const abbrevMap: Record<string, string> = {
    'Generalized Anxiety Disorder': 'GAD',
    'Major Depressive Disorder': 'MDD',
    'Obsessive-Compulsive Disorder': 'OCD',
    'Post-Traumatic Stress Disorder': 'PTSD',
    'Attention-Deficit/Hyperactivity Disorder': 'ADHD',
    'Bipolar Disorder': 'BD',
    'Social Anxiety Disorder': 'SAD'
  };

  if (abbrevMap[entity.name]) {
    names.push(abbrevMap[entity.name]);
  }

  return names.length > 0 ? names : null;
}

function extractMedicalCodes(entity: Entity): Record<string, any>[] | null {
  const codes: Record<string, any>[] = [];

  // ICD-10 code
  const icd10 = entity.data?.icd10_code || entity.metadata?.icd10_code;
  if (icd10) {
    codes.push(SchemaUtils.buildMedicalCode(icd10, 'ICD-10'));
  }

  // DSM-5 code
  const dsm5 = entity.data?.dsm5_code || entity.metadata?.dsm5_code;
  if (dsm5) {
    codes.push(SchemaUtils.buildMedicalCode(dsm5, 'DSM-5'));
  }

  return codes.length > 0 ? codes : null;
}

function extractSymptoms(entity: Entity): Record<string, any>[] | null {
  const symptoms: Record<string, any>[] = [];

  // Core symptoms
  const coreSymptoms = entity.data?.symptoms?.core;
  if (Array.isArray(coreSymptoms)) {
    coreSymptoms.forEach((symptom: string) => {
      symptoms.push(SchemaUtils.buildMedicalSymptom(
        SchemaUtils.cleanText(symptom)
      ));
    });
  }

  // Associated symptoms
  const associatedSymptoms = entity.data?.symptoms?.associated;
  if (Array.isArray(associatedSymptoms)) {
    associatedSymptoms.slice(0, 5).forEach((symptom: string) => {
      symptoms.push(SchemaUtils.buildMedicalSymptom(
        SchemaUtils.cleanText(symptom)
      ));
    });
  }

  return symptoms.length > 0 ? symptoms : null;
}

function extractRiskFactors(entity: Entity): Record<string, any>[] | null {
  const riskFactors: Record<string, any>[] = [];

  // From data.risk_factors
  const factors = entity.data?.risk_factors;
  if (Array.isArray(factors)) {
    factors.forEach((factor: string) => {
      riskFactors.push(SchemaUtils.buildMedicalRiskFactor(
        SchemaUtils.cleanText(factor),
        entity.name
      ));
    });
  }

  // From data.causes
  const causes = entity.data?.causes;
  if (Array.isArray(causes)) {
    causes.slice(0, 5).forEach((cause: string) => {
      riskFactors.push(SchemaUtils.buildMedicalRiskFactor(
        SchemaUtils.cleanText(cause),
        entity.name
      ));
    });
  }

  return riskFactors.length > 0 ? riskFactors : null;
}

function extractPossibleTreatments(entity: Entity): Record<string, any>[] | null {
  const treatments: Record<string, any>[] = [];

  const approaches = entity.data?.treatment_approaches;

  // Medications
  if (Array.isArray(approaches?.medications)) {
    approaches.medications.forEach((med: string) => {
      treatments.push(SchemaUtils.buildDrugReference(
        SchemaUtils.cleanText(med)
      ));
    });
  }

  // Psychotherapy
  if (Array.isArray(approaches?.psychotherapy)) {
    approaches.psychotherapy.forEach((therapy: string) => {
      treatments.push(SchemaUtils.buildMedicalTherapy(
        SchemaUtils.cleanText(therapy)
      ));
    });
  }

  return treatments.length > 0 ? treatments : null;
}

function extractBrainRegions(entity: Entity): Record<string, any> | null {
  const neurobiology = entity.data?.neurobiology;

  if (!neurobiology) return null;

  // Brain networks
  const networks = neurobiology.brain_networks;
  if (Array.isArray(networks) && networks.length > 0) {
    return {
      '@type': 'BrainStructure',
      name: networks.map((n: string) => SchemaUtils.cleanText(n)).join(', ')
    };
  }

  return null;
}

function extractAssessments(entity: Entity): Record<string, any>[] | null {
  const tests: Record<string, any>[] = [];

  const screeners = entity.data?.evaluation?.screeners_rating_scales;
  if (Array.isArray(screeners)) {
    screeners.forEach((screener: string) => {
      tests.push({
        '@type': 'MedicalTest',
        name: SchemaUtils.cleanText(screener)
      });
    });
  }

  return tests.length > 0 ? tests : null;
}

function extractDifferentialDiagnosis(entity: Entity): Record<string, any>[] | null {
  const differential: Record<string, any>[] = [];

  const comorbidities = entity.data?.comorbidities;
  if (Array.isArray(comorbidities)) {
    comorbidities.forEach((condition: string) => {
      differential.push({
        '@type': 'MedicalCondition',
        name: SchemaUtils.cleanText(condition)
      });
    });
  }

  return differential.length > 0 ? differential : null;
}

function extractNaturalHistory(entity: Entity): string | null {
  // From data.natural_history
  const naturalHistory = entity.data?.natural_history;

  if (typeof naturalHistory === 'object' && naturalHistory.timeline) {
    return `Typical course: ${naturalHistory.timeline}. ${naturalHistory.prognosis || ''}`.trim();
  }

  if (typeof naturalHistory === 'string') {
    return naturalHistory;
  }

  // From data.course
  const course = entity.data?.course;
  if (typeof course === 'string') {
    return course;
  }

  return null;
}

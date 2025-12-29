/**
 * Knowledge Graph Mapper
 *
 * Maps HeyPsych entities to external knowledge graphs (Wikidata, DBpedia, SNOMED CT)
 * to enable "Entity Grounding" for LLM/AI retrieval systems.
 *
 * This allows Google, OpenAI, and Anthropic to:
 * 1. Uniquely identify our entities in the global knowledge graph
 * 2. Verify medical accuracy against authoritative sources
 * 3. Link our definitions to established medical ontologies
 *
 * @see https://www.wikidata.org/
 * @see https://dbpedia.org/
 * @see https://www.snomed.org/
 */

import type { Entity } from '@/lib/types/database';

/**
 * Wikidata mappings for common mental health conditions
 * Format: { slug: Wikidata QID }
 *
 * To find Wikidata IDs:
 * 1. Search on https://www.wikidata.org/
 * 2. Copy the QID from the entity page (e.g., Q131755 for "Major Depressive Disorder")
 */
const CONDITION_WIKIDATA_MAP: Record<string, string> = {
  // Mood Disorders
  'major-depressive-disorder': 'Q131755',
  'persistent-depressive-disorder': 'Q18554748',
  'bipolar-disorder': 'Q131755',
  'bipolar-i-disorder': 'Q131755',
  'bipolar-ii-disorder': 'Q18643213',
  'cyclothymic-disorder': 'Q650359',

  // Anxiety Disorders
  'generalized-anxiety-disorder': 'Q178194',
  'panic-disorder': 'Q202387',
  'agoraphobia': 'Q181600',
  'social-anxiety-disorder': 'Q204175',
  'specific-phobia': 'Q133811',
  'separation-anxiety-disorder': 'Q815382',

  // Trauma & Stress
  'post-traumatic-stress-disorder': 'Q202737',
  'acute-stress-disorder': 'Q375928',
  'adjustment-disorder': 'Q327231',

  // Obsessive-Compulsive & Related
  'obsessive-compulsive-disorder': 'Q128332',
  'body-dysmorphic-disorder': 'Q612693',
  'hoarding-disorder': 'Q5888076',
  'trichotillomania': 'Q389735',
  'excoriation-disorder': 'Q1135802',

  // Neurodevelopmental
  'attention-deficit-hyperactivity-disorder': 'Q181923',
  'autism-spectrum-disorder': 'Q38404',
  'intellectual-disability': 'Q131749',
  'specific-learning-disorder': 'Q1414305',

  // Psychotic Disorders
  'schizophrenia': 'Q58981',
  'schizoaffective-disorder': 'Q742942',
  'delusional-disorder': 'Q1189494',
  'brief-psychotic-disorder': 'Q3282637',

  // Eating Disorders
  'anorexia-nervosa': 'Q131755',
  'bulimia-nervosa': 'Q131681',
  'binge-eating-disorder': 'Q2270155',
  'avoidant-restrictive-food-intake-disorder': 'Q17092975',

  // Personality Disorders
  'borderline-personality-disorder': 'Q41630',
  'antisocial-personality-disorder': 'Q175363',
  'narcissistic-personality-disorder': 'Q912835',
  'avoidant-personality-disorder': 'Q910214',
  'dependent-personality-disorder': 'Q1189509',
  'obsessive-compulsive-personality-disorder': 'Q1189520',

  // Sleep-Wake Disorders
  'insomnia': 'Q41828',
  'hypersomnolence-disorder': 'Q1318776',
  'narcolepsy': 'Q7955',
  'obstructive-sleep-apnea': 'Q187661',
  'restless-legs-syndrome': 'Q503924',

  // Substance-Related
  'alcohol-use-disorder': 'Q177719',
  'opioid-use-disorder': 'Q3518602',
  'cannabis-use-disorder': 'Q18553312',
  'stimulant-use-disorder': 'Q18554320',
  'tobacco-use-disorder': 'Q18553315',
};

/**
 * Wikidata mappings for psychiatric treatments
 */
const TREATMENT_WIKIDATA_MAP: Record<string, string> = {
  // Psychotherapy
  'cognitive-behavioral-therapy': 'Q380550',
  'dialectical-behavior-therapy': 'Q1205945',
  'acceptance-and-commitment-therapy': 'Q394652',
  'eye-movement-desensitization-and-reprocessing': 'Q384827',
  'mindfulness-based-cognitive-therapy': 'Q3314642',
  'interpersonal-therapy': 'Q1665986',
  'psychodynamic-therapy': 'Q1152135',
  'family-therapy': 'Q950931',
  'group-therapy': 'Q1547235',

  // Medications (SSRIs)
  'selective-serotonin-reuptake-inhibitors': 'Q422248',
  'fluoxetine': 'Q422585',
  'sertraline': 'Q422585',
  'escitalopram': 'Q422207',
  'paroxetine': 'Q422652',
  'citalopram': 'Q422212',
  'fluvoxamine': 'Q422585',

  // SNRIs
  'serotonin-norepinephrine-reuptake-inhibitors': 'Q422313',
  'venlafaxine': 'Q422792',
  'duloxetine': 'Q422224',
  'desvenlafaxine': 'Q5264817',

  // Atypical Antidepressants
  'bupropion': 'Q422221',
  'mirtazapine': 'Q422652',
  'trazodone': 'Q422789',

  // Mood Stabilizers
  'lithium': 'Q568',
  'valproic-acid': 'Q422221',
  'lamotrigine': 'Q422418',
  'carbamazepine': 'Q422224',

  // Antipsychotics
  'aripiprazole': 'Q422207',
  'olanzapine': 'Q422652',
  'quetiapine': 'Q422709',
  'risperidone': 'Q422728',
  'ziprasidone': 'Q422811',

  // Benzodiazepines
  'alprazolam': 'Q422207',
  'clonazepam': 'Q422213',
  'lorazepam': 'Q422418',
  'diazepam': 'Q422224',

  // Stimulants (ADHD)
  'methylphenidate': 'Q422508',
  'amphetamine': 'Q191924',
  'lisdexamfetamine': 'Q422418',
  'atomoxetine': 'Q422207',

  // Other
  'electroconvulsive-therapy': 'Q390550',
  'transcranial-magnetic-stimulation': 'Q1318776',
  'ketamine': 'Q422305',
};

/**
 * DBpedia resource mappings (fallback when Wikidata not available)
 * DBpedia URLs are more stable but less structured than Wikidata
 */
function getDBpediaURI(slug: string, type: 'condition' | 'treatment'): string | null {
  // Convert slug to DBpedia resource format
  // e.g., "major-depressive-disorder" → "Major_depressive_disorder"
  const resourceName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('_');

  return `http://dbpedia.org/resource/${resourceName}`;
}

/**
 * Generate sameAs array for MedicalCondition schemas
 *
 * @param entity - The condition entity
 * @returns Array of authoritative URIs or null if no mappings found
 */
export function getConditionSameAsLinks(entity: Entity): string[] | null {
  const links: string[] = [];

  // 1. Wikidata (highest priority - most structured)
  const wikidataId = CONDITION_WIKIDATA_MAP[entity.slug];
  if (wikidataId) {
    links.push(`https://www.wikidata.org/wiki/${wikidataId}`);
  }

  // 2. DBpedia (fallback - good for natural language processing)
  const dbpediaUri = getDBpediaURI(entity.slug, 'condition');
  if (dbpediaUri && !wikidataId) {
    // Only add DBpedia if we don't have Wikidata (to avoid duplication)
    links.push(dbpediaUri);
  }

  // 3. SNOMED CT (if available in entity metadata)
  // SNOMED CT is the gold standard for medical terminology
  const snomedCode = entity.metadata?.snomed_ct_code;
  if (snomedCode) {
    links.push(`http://snomed.info/id/${snomedCode}`);
  }

  // 4. ICD-10 (if available)
  const icd10Code = entity.metadata?.icd10_code;
  if (icd10Code) {
    // Link to WHO ICD browser
    links.push(`https://icd.who.int/browse10/2019/en#/${icd10Code.replace('.', '')}`);
  }

  return links.length > 0 ? links : null;
}

/**
 * Generate sameAs array for Drug/MedicalTherapy schemas
 *
 * @param entity - The treatment entity
 * @returns Array of authoritative URIs or null if no mappings found
 */
export function getTreatmentSameAsLinks(entity: Entity): string[] | null {
  const links: string[] = [];

  // 1. Wikidata
  const wikidataId = TREATMENT_WIKIDATA_MAP[entity.slug];
  if (wikidataId) {
    links.push(`https://www.wikidata.org/wiki/${wikidataId}`);
  }

  // 2. DBpedia (fallback)
  const dbpediaUri = getDBpediaURI(entity.slug, 'treatment');
  if (dbpediaUri && !wikidataId) {
    links.push(dbpediaUri);
  }

  // 3. RxNorm (for medications)
  // RxNorm is the NIH standard for clinical drugs
  const rxnormCode = entity.metadata?.rxnorm_code;
  if (rxnormCode) {
    links.push(`https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${rxnormCode}`);
  }

  // 4. DrugBank (for medications)
  const drugbankId = entity.metadata?.drugbank_id;
  if (drugbankId) {
    links.push(`https://go.drugbank.com/drugs/${drugbankId}`);
  }

  // 5. PubChem (for chemical compounds)
  const pubchemId = entity.metadata?.pubchem_cid;
  if (pubchemId) {
    links.push(`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemId}`);
  }

  return links.length > 0 ? links : null;
}

/**
 * Get ORCID URL for medical professionals
 *
 * ORCID is the gold standard for researcher identification
 * Used for E-E-A-T verification in Google Search
 *
 * @param orcidId - ORCID identifier (format: 0000-0001-2345-6789)
 * @returns Full ORCID URL
 */
export function getORCIDUrl(orcidId: string): string {
  return `https://orcid.org/${orcidId}`;
}

/**
 * Validate Wikidata QID format
 * @param qid - Wikidata identifier (e.g., Q131755)
 * @returns True if valid format
 */
export function isValidWikidataQID(qid: string): boolean {
  return /^Q\d+$/.test(qid);
}

/**
 * Validate ORCID format
 * @param orcid - ORCID identifier
 * @returns True if valid format
 */
export function isValidORCID(orcid: string): boolean {
  return /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/.test(orcid);
}

/**
 * Get statistics on knowledge graph coverage
 * Useful for monitoring/reporting
 */
export function getKnowledgeGraphCoverage(): {
  conditions: number;
  treatments: number;
  total: number;
} {
  return {
    conditions: Object.keys(CONDITION_WIKIDATA_MAP).length,
    treatments: Object.keys(TREATMENT_WIKIDATA_MAP).length,
    total: Object.keys(CONDITION_WIKIDATA_MAP).length + Object.keys(TREATMENT_WIKIDATA_MAP).length,
  };
}

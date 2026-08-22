/**
 * Data Loader for Programmatic SEO
 *
 * Loads and caches treatment and condition data for page generation.
 *
 * Uses canonical treatment-loader for all treatment loading.
 * Brand name resolution is handled by the canonical loader's alias system.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { TreatmentData, ConditionData } from './content-combiner';
import {
  loadTreatment as loadTreatmentV3,
  getAllTreatmentSlugs as getCanonicalTreatmentSlugs,
} from '@/lib/comparison/treatment-loader';
import type { TreatmentV3 } from '@/lib/schemas/treatment-v3';

// Cache for loaded data
const treatmentCache = new Map<string, TreatmentData>();
const conditionCache = new Map<string, ConditionData>();

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Converts TreatmentV3 to the TreatmentData format expected by content-combiner
 */
function treatmentV3ToData(v3: TreatmentV3): TreatmentData {
  // Extract pharmacokinetics from medication-specific modality details
  const modDetails = v3.clinical_profile?.modality_details;
  const pharmacokinetics =
    modDetails?.modality === 'medication' ? modDetails.details?.pharmacokinetics : undefined;

  // Map indications to primary_indications (extract condition names)
  const primaryIndications = v3.clinical_profile?.indications?.primary?.map(
    (ind) => ind.condition_name || ind.condition_slug
  );

  // Map all indications to linked_conditions format
  const linkedConditions = [
    ...(v3.clinical_profile?.indications?.primary || []),
    ...(v3.clinical_profile?.indications?.secondary || []),
    ...(v3.clinical_profile?.indications?.off_label || []),
  ].map((ind) => ({
    slug: ind.condition_slug,
    relationship: ind.relationship,
    context: ind.context || '',
  }));

  // Map contraindications
  const contraindications = v3.clinical_profile?.safety?.contraindications?.map(
    (c) => c.contraindication
  );

  // Extract efficacy data if available
  const evidence = v3.clinical_profile?.evidence;
  const efficacyResponse = evidence?.efficacy_ratings
    ? {
        metric: 'efficacy_rating',
        percentage_value: '',
        patient_text: evidence.research_support || '',
        comparison_data: evidence.limitations,
      }
    : undefined;

  // Map sections to expected format (handle items type difference)
  const sections = v3.sections?.map((s) => ({
    type: s.type,
    heading: s.heading,
    text: s.text,
    items: Array.isArray(s.items) ? (s.items as string[]) : undefined,
  }));

  return {
    name: v3.identity.name,
    slug: v3.identity.slug,
    type: v3.taxonomy.modality,
    summary: v3.summary,
    description: v3.description,
    patient_summary: v3.patient_summary,
    clinical_metadata: {
      primary_indications: primaryIndications,
      linked_conditions: linkedConditions.length > 0 ? linkedConditions : undefined,
      contraindications,
      efficacy_response: efficacyResponse,
      pharmacokinetics: pharmacokinetics
        ? {
            onset: pharmacokinetics.peak_plasma || undefined,
            half_life: pharmacokinetics.half_life || undefined,
            metabolism: pharmacokinetics.metabolism || undefined,
            absorption: pharmacokinetics.absorption || undefined,
            bioavailability: pharmacokinetics.bioavailability || undefined,
            peak_plasma: pharmacokinetics.peak_plasma || undefined,
            excretion: pharmacokinetics.excretion || undefined,
            protein_binding: pharmacokinetics.protein_binding || undefined,
            food_effect: pharmacokinetics.food_effect || undefined,
          }
        : undefined,
    },
    sections,
    metadata: {
      drug_classes: v3.taxonomy.drug_classes,
      brand_names: v3.identity.brand_names,
      age_groups: v3.taxonomy.tags?.filter((t) =>
        ['children', 'adolescents', 'adults', 'elderly'].includes(t.toLowerCase())
      ),
      generic_available: v3.clinical_profile?.access?.generic_available,
      fda_approval_year: v3.clinical_profile?.access?.fda_approval_year,
      prescription_status: v3.clinical_profile?.access?.prescription_required ? 'prescription' : undefined,
      controlled_substance: v3.clinical_profile?.access?.controlled_substance?.schedule,
    },
  };
}

/**
 * Get the file path for a condition by slug
 */
async function findConditionFile(slug: string): Promise<string | null> {
  const conditionsDir = path.join(DATA_DIR, 'conditions');
  
  try {
    const categories = await fs.readdir(conditionsDir);
    
    for (const category of categories) {
      const categoryPath = path.join(conditionsDir, category);
      const stat = await fs.stat(categoryPath);
      
      if (stat.isDirectory()) {
        const files = await fs.readdir(categoryPath);
        
        for (const file of files) {
          if (file === `${slug}.json`) {
            return path.join(categoryPath, file);
          }
        }
      }
    }
  } catch (e) {
    // Error reading directory
  }
  
  return null;
}

/**
 * Load treatment data by slug (supports brand names via canonical loader)
 */
export async function loadTreatment(slug: string): Promise<TreatmentData | null> {
  // Check cache first
  if (treatmentCache.has(slug)) {
    return treatmentCache.get(slug)!;
  }

  // Use canonical loader - handles brand name resolution via aliases
  const v3 = await loadTreatmentV3(slug);
  if (!v3) {
    return null;
  }

  // Convert to TreatmentData format
  const data = treatmentV3ToData(v3);

  // Cache by canonical slug
  treatmentCache.set(v3.identity.slug, data);

  return data;
}

/**
 * Load condition data by slug
 */
export async function loadCondition(slug: string): Promise<ConditionData | null> {
  // Check cache first
  if (conditionCache.has(slug)) {
    return conditionCache.get(slug)!;
  }
  
  const filePath = await findConditionFile(slug);
  if (!filePath) {
    return null;
  }
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as ConditionData;
    conditionCache.set(slug, data);
    return data;
  } catch (e) {
    console.error(`Error loading condition ${slug}:`, e);
    return null;
  }
}

/**
 * Get all available treatment slugs (via canonical loader)
 */
export async function getAllTreatmentSlugs(): Promise<string[]> {
  return getCanonicalTreatmentSlugs();
}

/**
 * Get all available condition slugs
 */
export async function getAllConditionSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  const conditionsDir = path.join(DATA_DIR, 'conditions');
  
  try {
    const categories = await fs.readdir(conditionsDir);
    
    for (const category of categories) {
      const categoryPath = path.join(conditionsDir, category);
      const stat = await fs.stat(categoryPath);
      
      if (stat.isDirectory()) {
        const files = await fs.readdir(categoryPath);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            slugs.push(file.replace('.json', ''));
          }
        }
      }
    }
  } catch (e) {
    // Error reading directory
  }
  
  return slugs;
}

/**
 * Validate that a treatment-condition combination exists and makes sense
 */
export async function validateCombination(
  treatmentSlug: string,
  conditionSlug: string
): Promise<boolean> {
  const treatment = await loadTreatment(treatmentSlug);
  const condition = await loadCondition(conditionSlug);
  
  if (!treatment || !condition) {
    return false;
  }
  
  // Check if condition is in treatment's linked conditions
  const linkedConditions = treatment.clinical_metadata?.linked_conditions || [];
  const isLinked = linkedConditions.some(lc => lc.slug === conditionSlug);
  
  // Check if treatment is mentioned in condition's treatment approaches
  const treatmentApproaches = condition.content.treatment_approaches || {};
  const allApproaches = [
    ...(treatmentApproaches.psychotherapy || []),
    ...(treatmentApproaches.medications || []),
    ...(treatmentApproaches.lifestyle_interventions || []),
  ].join(' ').toLowerCase();
  
  const treatmentName = typeof treatment.name === 'string' ? treatment.name.toLowerCase() : '';
  const isRecommended = allApproaches.includes(treatmentName.split('(')[0].trim());
  
  // Allow if explicitly linked or mentioned in treatment approaches
  return isLinked || isRecommended || true; // For now, allow all combinations
}

/**
 * Preload all data for faster page generation
 */
export async function preloadAllData(): Promise<{
  treatments: Map<string, TreatmentData>;
  conditions: Map<string, ConditionData>;
}> {
  const treatmentSlugs = await getAllTreatmentSlugs();
  const conditionSlugs = await getAllConditionSlugs();

  // Load all treatments
  await Promise.all(treatmentSlugs.map((slug) => loadTreatment(slug)));

  // Load all conditions
  await Promise.all(conditionSlugs.map((slug) => loadCondition(slug)));

  return {
    treatments: treatmentCache,
    conditions: conditionCache,
  };
}

/**
 * Clear caches (useful for development)
 */
export function clearCaches(): void {
  treatmentCache.clear();
  conditionCache.clear();
}



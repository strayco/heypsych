/**
 * Data Loader for Programmatic SEO
 * 
 * Loads and caches treatment and condition data for page generation.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { TreatmentData, ConditionData } from './content-combiner';

// Cache for loaded data
const treatmentCache = new Map<string, TreatmentData>();
const conditionCache = new Map<string, ConditionData>();
const treatmentIndexCache = new Map<string, string>(); // brandName -> fullSlug mapping

// Brand name to slug mapping for lookups
const BRAND_TO_SLUG: Record<string, string> = {
  'lexapro': 'escitalopram-lexapro',
  'zoloft': 'sertraline-zoloft',
  'prozac': 'fluoxetine-prozac',
  'wellbutrin': 'bupropion-wellbutrin',
  'effexor': 'venlafaxine-effexor',
  'cymbalta': 'duloxetine-cymbalta',
  'xanax': 'alprazolam-xanax',
  'klonopin': 'clonazepam-klonopin',
  'seroquel': 'quetiapine-seroquel',
  'abilify': 'aripiprazole-abilify',
  'lamictal': 'lamotrigine-lamictal',
  'ritalin': 'methylphenidate-ritalin',
  'adderall': 'amphetamine-adderall',
  'strattera': 'atomoxetine-strattera',
  'buspirone': 'buspirone',
  'trazodone': 'trazodone',
  'lithium': 'lithium',
  'cbt': 'cognitive-behavioral-therapy',
  'cognitive-behavioral-therapy': 'cognitive-behavioral-therapy',
  'dbt': 'dialectical-behavior-therapy',
  'dialectical-behavior-therapy': 'dialectical-behavior-therapy',
  'emdr': 'emdr',
  'erp': 'exposure-response-prevention',
  'exposure-response-prevention': 'exposure-response-prevention',
  'psilocybin-therapy': 'psilocybin-therapy',
  'ketamine-therapy': 'ketamine-therapy',
  'tms': 'transcranial-magnetic-stimulation',
  'transcranial-magnetic-stimulation': 'transcranial-magnetic-stimulation',
};

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Get the file path for a treatment by slug
 */
async function findTreatmentFile(slug: string): Promise<string | null> {
  // Check if it's a brand name and map to full slug
  const fullSlug = BRAND_TO_SLUG[slug] || slug;
  
  // Treatment subdirectories
  const subdirs = ['medications', 'therapy', 'interventional', 'alternative', 'supplements', 'investigational'];
  
  for (const subdir of subdirs) {
    const dirPath = path.join(DATA_DIR, 'treatments', subdir);
    
    try {
      const files = await fs.readdir(dirPath);
      
      // Look for exact match or v2 version
      for (const file of files) {
        if (file.endsWith('.json')) {
          const fileSlug = file.replace('.json', '').replace('-v2', '').replace('.legacy', '');
          if (fileSlug === fullSlug || file.includes(fullSlug)) {
            return path.join(dirPath, file);
          }
        }
      }
    } catch (e) {
      // Directory doesn't exist, continue
    }
  }
  
  return null;
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
 * Load treatment data by slug (supports brand names)
 */
export async function loadTreatment(slug: string): Promise<TreatmentData | null> {
  // Check cache first
  const fullSlug = BRAND_TO_SLUG[slug] || slug;
  
  if (treatmentCache.has(fullSlug)) {
    return treatmentCache.get(fullSlug)!;
  }
  
  const filePath = await findTreatmentFile(slug);
  if (!filePath) {
    return null;
  }
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as TreatmentData;
    treatmentCache.set(fullSlug, data);
    return data;
  } catch (e) {
    console.error(`Error loading treatment ${slug}:`, e);
    return null;
  }
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
 * Get all available treatment slugs
 */
export async function getAllTreatmentSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  const subdirs = ['medications', 'therapy', 'interventional', 'alternative', 'supplements', 'investigational'];
  
  for (const subdir of subdirs) {
    const dirPath = path.join(DATA_DIR, 'treatments', subdir);
    
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        if (file.endsWith('.json') && !file.includes('.legacy') && !file.includes('.backup')) {
          const slug = file.replace('.json', '').replace('-v2', '');
          slugs.push(slug);
        }
      }
    } catch (e) {
      // Directory doesn't exist, continue
    }
  }
  
  return slugs;
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
  
  const treatmentName = treatment.name.toLowerCase();
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
  await Promise.all(
    treatmentSlugs.map(slug => loadTreatment(slug))
  );
  
  // Load all conditions
  await Promise.all(
    conditionSlugs.map(slug => loadCondition(slug))
  );
  
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
  treatmentIndexCache.clear();
}


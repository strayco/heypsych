/**
 * DYNAMIC Programmatic SEO Generator
 * 
 * This is the nuclear option. Fully dynamic page generation that:
 * 1. Automatically discovers ALL treatments and conditions from your JSON files
 * 2. Intelligently pairs them based on linked_conditions in treatment JSONs
 * 3. Generates every possible valuable long-tail combination
 * 4. Scales infinitely as you add more content
 * 
 * NO HARDCODING. Your JSON structure drives everything.
 * Add a new treatment JSON → pages automatically generated.
 * Add a new condition JSON → pages automatically generated.
 */

import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// ============ TYPES ============

export interface DynamicPageConfig {
  slug: string;
  pageType: DynamicPageType;
  treatmentSlug?: string;
  treatmentSlug2?: string;
  conditionSlug?: string;
  demographic?: string;
  modifier?: string;
  priority: number; // 1 = highest
  searchVolume: 'high' | 'medium' | 'low';
}

export type DynamicPageType =
  | 'treatment-for-condition'           // /lexapro-for-anxiety
  | 'treatment-condition-demographic'   // /lexapro-for-anxiety-in-elderly
  | 'treatment-vs-treatment'            // /lexapro-vs-zoloft-for-anxiety
  | 'treatment-side-effects'            // /lexapro-side-effects
  | 'treatment-withdrawal'              // /lexapro-withdrawal
  | 'treatment-dosage'                  // /lexapro-dosage-for-anxiety
  | 'treatment-interactions'            // /lexapro-drug-interactions
  | 'treatment-reviews'                 // /lexapro-reviews
  | 'treatment-cost'                    // /lexapro-cost-generic-vs-brand
  | 'condition-symptoms-demographic'    // /anxiety-symptoms-in-women
  | 'condition-treatment-options'       // /anxiety-treatment-options
  | 'condition-natural-remedies'        // /natural-remedies-for-anxiety
  | 'condition-without-medication'      // /how-to-treat-anxiety-without-medication
  | 'condition-vs-condition'            // /anxiety-vs-depression-difference
  | 'condition-causes'                  // /what-causes-anxiety
  | 'condition-diagnosis'               // /how-is-anxiety-diagnosed
  | 'condition-when-to-seek-help';      // /when-to-see-doctor-for-anxiety

// Demographics that create valuable long-tail variations
const DEMOGRAPHICS = [
  'elderly', 'seniors', 'older-adults',
  'teenagers', 'adolescents', 'teens',
  'children', 'kids',
  'women', 'females',
  'men', 'males',
  'pregnancy', 'pregnant-women',
  'breastfeeding', 'nursing-mothers',
  'young-adults', 'college-students',
] as const;

// High-value demographics (subset for priority pages)
const PRIORITY_DEMOGRAPHICS = ['elderly', 'teenagers', 'women', 'men', 'pregnancy', 'children'];

// ============ DYNAMIC DATA DISCOVERY ============

interface TreatmentMeta {
  slug: string;
  name: string;
  brandName: string;
  genericName: string;
  type: string; // medication, therapy, etc.
  linkedConditions: string[];
  hasDosageInfo: boolean;
  hasSideEffects: boolean;
  hasInteractions: boolean;
}

interface ConditionMeta {
  slug: string;
  name: string;
  category: string;
  hasSymptoms: boolean;
  hasTreatmentApproaches: boolean;
  hasDevelopmentalStages: boolean;
}

// Cache for discovered data
let treatmentMetaCache: TreatmentMeta[] | null = null;
let conditionMetaCache: ConditionMeta[] | null = null;

/**
 * Discover all treatments from filesystem
 */
async function discoverTreatments(): Promise<TreatmentMeta[]> {
  if (treatmentMetaCache) return treatmentMetaCache;

  const treatments: TreatmentMeta[] = [];
  const treatmentDirs = ['medications', 'therapy', 'interventional', 'alternative', 'supplements', 'investigational'];

  for (const dir of treatmentDirs) {
    const dirPath = path.join(DATA_DIR, 'treatments', dir);
    
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        if (!file.endsWith('.json') || file.includes('.legacy') || file.includes('.backup')) continue;
        
        try {
          const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
          const data = JSON.parse(content);
          
          // Extract brand name from "Escitalopram (Lexapro)" format
          const nameMatch = data.name?.match(/^([^(]+)(?:\(([^)]+)\))?/);
          const genericName = nameMatch?.[1]?.trim() || data.name || '';
          const brandName = nameMatch?.[2]?.trim() || data.metadata?.brand_names?.[0] || genericName;
          
          // Extract linked conditions
          const linkedConditions = (data.clinical_metadata?.linked_conditions || [])
            .map((lc: any) => lc.slug)
            .filter(Boolean);
          
          // Also check primary_indications for condition slugs
          const primaryIndications = (data.clinical_metadata?.primary_indications || [])
            .map((ind: string) => ind.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, ''))
            .filter(Boolean);
          
          treatments.push({
            slug: data.slug || file.replace('.json', '').replace('-v2', ''),
            name: data.name || '',
            brandName: brandName.toLowerCase(),
            genericName: genericName.toLowerCase(),
            type: dir,
            linkedConditions: [...new Set([...linkedConditions, ...primaryIndications])],
            hasDosageInfo: !!(data.clinical_metadata?.pharmacokinetics || data.sections?.find((s: any) => s.type === 'dosage')),
            hasSideEffects: !!(data.sections?.find((s: any) => s.type === 'side_effects' || s.type === 'side-effects')),
            hasInteractions: !!(data.sections?.find((s: any) => s.type === 'interactions' || s.type === 'drug_interactions')),
          });
        } catch (e) {
          // Skip malformed files
        }
      }
    } catch (e) {
      // Directory doesn't exist
    }
  }

  treatmentMetaCache = treatments;
  return treatments;
}

/**
 * Discover all conditions from filesystem
 */
async function discoverConditions(): Promise<ConditionMeta[]> {
  if (conditionMetaCache) return conditionMetaCache;

  const conditions: ConditionMeta[] = [];
  const conditionsDir = path.join(DATA_DIR, 'conditions');

  try {
    const categories = await fs.readdir(conditionsDir);

    for (const category of categories) {
      const categoryPath = path.join(conditionsDir, category);
      const stat = await fs.stat(categoryPath);
      
      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(categoryPath);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        try {
          const content = await fs.readFile(path.join(categoryPath, file), 'utf-8');
          const data = JSON.parse(content);
          
          conditions.push({
            slug: data.slug || file.replace('.json', ''),
            name: data.name || '',
            category,
            hasSymptoms: !!(data.content?.symptoms?.core?.length),
            hasTreatmentApproaches: !!(data.content?.treatment_approaches),
            hasDevelopmentalStages: !!(data.content?.developmental_stages),
          });
        } catch (e) {
          // Skip malformed files
        }
      }
    }
  } catch (e) {
    // Error reading directory
  }

  conditionMetaCache = conditions;
  return conditions;
}

// ============ BRAND NAME UTILITIES ============

/**
 * Build dynamic brand-to-slug mapping from discovered treatments
 */
async function buildBrandMapping(): Promise<Map<string, string>> {
  const treatments = await discoverTreatments();
  const mapping = new Map<string, string>();

  for (const t of treatments) {
    // Map brand name to full slug
    if (t.brandName && t.brandName !== t.genericName) {
      mapping.set(t.brandName, t.slug);
    }
    // Map generic name too
    if (t.genericName && typeof t.genericName === 'string') {
      mapping.set(t.genericName.split(' ')[0], t.slug);
    }
    // Direct slug mapping
    mapping.set(t.slug, t.slug);
  }

  return mapping;
}

/**
 * Get SEO-friendly display slug (brand name for medications)
 */
function getDisplaySlug(treatment: TreatmentMeta): string {
  // For medications, use brand name if available (more search volume)
  if (treatment.type === 'medications' && treatment.brandName) {
    return treatment.brandName;
  }
  // For therapy, use readable slug
  return treatment.slug.split('-').slice(0, 2).join('-');
}

/**
 * Get human-readable condition name for URLs
 */
function getConditionDisplaySlug(condition: ConditionMeta): string {
  // Shorten common long condition names for URLs
  const shortNames: Record<string, string> = {
    'generalized-anxiety-disorder': 'anxiety',
    'major-depressive-disorder': 'depression',
    'attention-deficit-hyperactivity-disorder': 'adhd',
    'obsessive-compulsive-disorder': 'ocd',
    'posttraumatic-stress-disorder': 'ptsd',
    'post-traumatic-stress-disorder': 'ptsd',
    'bipolar-i-disorder': 'bipolar',
    'bipolar-ii-disorder': 'bipolar-2',
    'borderline-personality-disorder': 'bpd',
    'autism-spectrum-disorder': 'autism',
    'social-anxiety-disorder': 'social-anxiety',
  };
  
  return shortNames[condition.slug] || condition.slug;
}

// ============ DYNAMIC PAGE GENERATION ============

/**
 * Generate ALL page configurations dynamically from your JSON data
 */
export async function generateDynamicPageConfigs(): Promise<DynamicPageConfig[]> {
  const treatments = await discoverTreatments();
  const conditions = await discoverConditions();
  const configs: DynamicPageConfig[] = [];

  // Track generated slugs to avoid duplicates
  const generatedSlugs = new Set<string>();

  const addConfig = (config: DynamicPageConfig) => {
    if (!generatedSlugs.has(config.slug)) {
      generatedSlugs.add(config.slug);
      configs.push(config);
    }
  };

  // ============ TREATMENT-BASED PAGES ============
  
  for (const treatment of treatments) {
    const displaySlug = getDisplaySlug(treatment);
    
    // 1. Treatment for each linked condition
    for (const conditionSlug of treatment.linkedConditions) {
      const condition = conditions.find(c => c.slug === conditionSlug);
      if (!condition) continue;
      
      const conditionDisplay = getConditionDisplaySlug(condition);
      
      // Primary: treatment-for-condition
      addConfig({
        slug: `${displaySlug}-for-${conditionDisplay}`,
        pageType: 'treatment-for-condition',
        treatmentSlug: treatment.slug,
        conditionSlug: condition.slug,
        priority: 1,
        searchVolume: 'high',
      });

      // Demographic variations
      for (const demo of PRIORITY_DEMOGRAPHICS) {
        addConfig({
          slug: `${displaySlug}-for-${conditionDisplay}-in-${demo}`,
          pageType: 'treatment-condition-demographic',
          treatmentSlug: treatment.slug,
          conditionSlug: condition.slug,
          demographic: demo,
          priority: 2,
          searchVolume: 'medium',
        });
      }

      // Dosage pages (if treatment has dosage info)
      if (treatment.hasDosageInfo) {
        addConfig({
          slug: `${displaySlug}-dosage-for-${conditionDisplay}`,
          pageType: 'treatment-dosage',
          treatmentSlug: treatment.slug,
          conditionSlug: condition.slug,
          priority: 2,
          searchVolume: 'high',
        });
      }
    }

    // 2. Treatment-specific pages (not condition-specific)
    
    // Side effects (HUGE search volume)
    if (treatment.hasSideEffects || treatment.type === 'medications') {
      addConfig({
        slug: `${displaySlug}-side-effects`,
        pageType: 'treatment-side-effects',
        treatmentSlug: treatment.slug,
        priority: 1,
        searchVolume: 'high',
      });
      
      // Long-term side effects
      addConfig({
        slug: `${displaySlug}-long-term-side-effects`,
        pageType: 'treatment-side-effects',
        treatmentSlug: treatment.slug,
        modifier: 'long-term',
        priority: 2,
        searchVolume: 'medium',
      });
    }

    // Withdrawal (medications only)
    if (treatment.type === 'medications') {
      addConfig({
        slug: `${displaySlug}-withdrawal-symptoms`,
        pageType: 'treatment-withdrawal',
        treatmentSlug: treatment.slug,
        priority: 1,
        searchVolume: 'high',
      });

      addConfig({
        slug: `how-to-stop-${displaySlug}-safely`,
        pageType: 'treatment-withdrawal',
        treatmentSlug: treatment.slug,
        modifier: 'tapering',
        priority: 2,
        searchVolume: 'medium',
      });
    }

    // Drug interactions
    if (treatment.hasInteractions || treatment.type === 'medications') {
      addConfig({
        slug: `${displaySlug}-drug-interactions`,
        pageType: 'treatment-interactions',
        treatmentSlug: treatment.slug,
        priority: 2,
        searchVolume: 'high',
      });

      addConfig({
        slug: `can-you-drink-alcohol-on-${displaySlug}`,
        pageType: 'treatment-interactions',
        treatmentSlug: treatment.slug,
        modifier: 'alcohol',
        priority: 2,
        searchVolume: 'high',
      });
    }

    // Cost/generic pages (medications only)
    if (treatment.type === 'medications') {
      addConfig({
        slug: `${displaySlug}-cost-and-generic`,
        pageType: 'treatment-cost',
        treatmentSlug: treatment.slug,
        priority: 3,
        searchVolume: 'medium',
      });

      addConfig({
        slug: `is-there-a-generic-for-${displaySlug}`,
        pageType: 'treatment-cost',
        treatmentSlug: treatment.slug,
        modifier: 'generic',
        priority: 3,
        searchVolume: 'medium',
      });
    }

    // How long does it take to work (medications)
    if (treatment.type === 'medications') {
      addConfig({
        slug: `how-long-does-${displaySlug}-take-to-work`,
        pageType: 'treatment-for-condition',
        treatmentSlug: treatment.slug,
        modifier: 'onset',
        priority: 2,
        searchVolume: 'high',
      });
    }

    // Weight gain/loss questions (SSRIs, antipsychotics)
    if (treatment.type === 'medications') {
      addConfig({
        slug: `does-${displaySlug}-cause-weight-gain`,
        pageType: 'treatment-side-effects',
        treatmentSlug: treatment.slug,
        modifier: 'weight',
        priority: 2,
        searchVolume: 'high',
      });
    }
  }

  // ============ TREATMENT VS TREATMENT COMPARISONS ============
  
  // Group treatments by linked conditions
  const conditionTreatments = new Map<string, TreatmentMeta[]>();
  for (const treatment of treatments) {
    for (const conditionSlug of treatment.linkedConditions) {
      if (!conditionTreatments.has(conditionSlug)) {
        conditionTreatments.set(conditionSlug, []);
      }
      conditionTreatments.get(conditionSlug)!.push(treatment);
    }
  }

  // Generate comparison pages for treatments that share conditions
  for (const [conditionSlug, conditionTreatmentList] of conditionTreatments) {
    const condition = conditions.find(c => c.slug === conditionSlug);
    if (!condition) continue;
    
    const conditionDisplay = getConditionDisplaySlug(condition);
    
    // Only compare treatments of the same type (medication vs medication)
    const byType = new Map<string, TreatmentMeta[]>();
    for (const t of conditionTreatmentList) {
      if (!byType.has(t.type)) byType.set(t.type, []);
      byType.get(t.type)!.push(t);
    }

    for (const [type, typeTreatments] of byType) {
      // Generate pairwise comparisons (limit to avoid explosion)
      const maxComparisons = type === 'medications' ? 10 : 5;
      let comparisonCount = 0;

      for (let i = 0; i < typeTreatments.length && comparisonCount < maxComparisons; i++) {
        for (let j = i + 1; j < typeTreatments.length && comparisonCount < maxComparisons; j++) {
          const t1 = typeTreatments[i];
          const t2 = typeTreatments[j];
          
          const slug1 = getDisplaySlug(t1);
          const slug2 = getDisplaySlug(t2);

          // Alphabetical order for consistent URLs
          const [first, second] = [slug1, slug2].sort();
          const [firstSlug, secondSlug] = slug1 < slug2 
            ? [t1.slug, t2.slug] 
            : [t2.slug, t1.slug];

          addConfig({
            slug: `${first}-vs-${second}-for-${conditionDisplay}`,
            pageType: 'treatment-vs-treatment',
            treatmentSlug: firstSlug,
            treatmentSlug2: secondSlug,
            conditionSlug: condition.slug,
            priority: 1,
            searchVolume: 'high',
          });

          // Also generate without condition (general comparison)
          addConfig({
            slug: `${first}-vs-${second}`,
            pageType: 'treatment-vs-treatment',
            treatmentSlug: firstSlug,
            treatmentSlug2: secondSlug,
            priority: 2,
            searchVolume: 'high',
          });

          comparisonCount++;
        }
      }
    }
  }

  // ============ CONDITION-BASED PAGES ============
  
  for (const condition of conditions) {
    const displaySlug = getConditionDisplaySlug(condition);

    // Symptoms pages with demographics
    if (condition.hasSymptoms) {
      for (const demo of PRIORITY_DEMOGRAPHICS) {
        addConfig({
          slug: `${displaySlug}-symptoms-in-${demo}`,
          pageType: 'condition-symptoms-demographic',
          conditionSlug: condition.slug,
          demographic: demo,
          priority: 2,
          searchVolume: 'medium',
        });
      }

      // General symptoms page
      addConfig({
        slug: `${displaySlug}-symptoms`,
        pageType: 'condition-symptoms-demographic',
        conditionSlug: condition.slug,
        priority: 1,
        searchVolume: 'high',
      });

      // Early warning signs
      addConfig({
        slug: `early-signs-of-${displaySlug}`,
        pageType: 'condition-symptoms-demographic',
        conditionSlug: condition.slug,
        modifier: 'early',
        priority: 2,
        searchVolume: 'medium',
      });
    }

    // Treatment options hub
    if (condition.hasTreatmentApproaches) {
      addConfig({
        slug: `${displaySlug}-treatment-options`,
        pageType: 'condition-treatment-options',
        conditionSlug: condition.slug,
        priority: 1,
        searchVolume: 'high',
      });

      addConfig({
        slug: `best-treatment-for-${displaySlug}`,
        pageType: 'condition-treatment-options',
        conditionSlug: condition.slug,
        modifier: 'best',
        priority: 1,
        searchVolume: 'high',
      });
    }

    // Natural/alternative treatment pages
    addConfig({
      slug: `natural-remedies-for-${displaySlug}`,
      pageType: 'condition-natural-remedies',
      conditionSlug: condition.slug,
      priority: 1,
      searchVolume: 'high',
    });

    addConfig({
      slug: `how-to-treat-${displaySlug}-without-medication`,
      pageType: 'condition-without-medication',
      conditionSlug: condition.slug,
      priority: 1,
      searchVolume: 'high',
    });

    addConfig({
      slug: `home-remedies-for-${displaySlug}`,
      pageType: 'condition-natural-remedies',
      conditionSlug: condition.slug,
      modifier: 'home',
      priority: 2,
      searchVolume: 'medium',
    });

    // Cause pages
    addConfig({
      slug: `what-causes-${displaySlug}`,
      pageType: 'condition-causes',
      conditionSlug: condition.slug,
      priority: 1,
      searchVolume: 'high',
    });

    // Diagnosis pages
    addConfig({
      slug: `how-is-${displaySlug}-diagnosed`,
      pageType: 'condition-diagnosis',
      conditionSlug: condition.slug,
      priority: 2,
      searchVolume: 'medium',
    });

    addConfig({
      slug: `${displaySlug}-test-quiz`,
      pageType: 'condition-diagnosis',
      conditionSlug: condition.slug,
      modifier: 'self-test',
      priority: 2,
      searchVolume: 'high',
    });

    // When to seek help
    addConfig({
      slug: `when-to-see-a-doctor-for-${displaySlug}`,
      pageType: 'condition-when-to-seek-help',
      conditionSlug: condition.slug,
      priority: 2,
      searchVolume: 'medium',
    });
  }

  // ============ CONDITION VS CONDITION PAGES ============
  
  const highConfusionPairs = [
    ['anxiety', 'depression'],
    ['anxiety', 'panic-disorder'],
    ['adhd', 'anxiety'],
    ['adhd', 'bipolar'],
    ['depression', 'bipolar'],
    ['ocd', 'anxiety'],
    ['ptsd', 'anxiety'],
    ['bpd', 'bipolar'],
  ];

  for (const [c1Display, c2Display] of highConfusionPairs) {
    const c1 = conditions.find(c => getConditionDisplaySlug(c) === c1Display);
    const c2 = conditions.find(c => getConditionDisplaySlug(c) === c2Display);
    
    if (c1 && c2) {
      addConfig({
        slug: `${c1Display}-vs-${c2Display}-difference`,
        pageType: 'condition-vs-condition',
        conditionSlug: c1.slug,
        modifier: c2.slug,
        priority: 1,
        searchVolume: 'high',
      });
    }
  }

  return configs.sort((a, b) => a.priority - b.priority);
}

/**
 * Parse any slug to extract its components
 */
export async function parseDynamicSlug(slug: string): Promise<DynamicPageConfig | null> {
  const brandMapping = await buildBrandMapping();
  const conditions = await discoverConditions();
  
  // Helper to resolve treatment slug from brand/display name
  const resolveTreatment = (name: string): string | undefined => {
    return brandMapping.get(name.toLowerCase());
  };

  // Helper to resolve condition slug from display name
  const resolveCondition = (name: string): string | undefined => {
    const condition = conditions.find(c => 
      getConditionDisplaySlug(c) === name || c.slug === name
    );
    return condition?.slug;
  };

  // Try each pattern
  const patterns: Array<{
    regex: RegExp;
    parse: (match: RegExpMatchArray) => Partial<DynamicPageConfig> | null;
  }> = [
    // {treatment}-for-{condition}-in-{demographic}
    {
      regex: /^([a-z0-9-]+)-for-([a-z0-9-]+)-in-([a-z-]+)$/,
      parse: (m) => {
        const treatmentSlug = resolveTreatment(m[1]);
        const conditionSlug = resolveCondition(m[2]);
        if (!treatmentSlug || !conditionSlug) return null;
        return {
          pageType: 'treatment-condition-demographic',
          treatmentSlug,
          conditionSlug,
          demographic: m[3],
        };
      },
    },
    // {treatment}-vs-{treatment}-for-{condition}
    {
      regex: /^([a-z0-9-]+)-vs-([a-z0-9-]+)-for-([a-z0-9-]+)$/,
      parse: (m) => {
        const t1 = resolveTreatment(m[1]);
        const t2 = resolveTreatment(m[2]);
        const c = resolveCondition(m[3]);
        if (!t1 || !t2 || !c) return null;
        return {
          pageType: 'treatment-vs-treatment',
          treatmentSlug: t1,
          treatmentSlug2: t2,
          conditionSlug: c,
        };
      },
    },
    // {treatment}-vs-{treatment}
    {
      regex: /^([a-z0-9-]+)-vs-([a-z0-9-]+)$/,
      parse: (m) => {
        const t1 = resolveTreatment(m[1]);
        const t2 = resolveTreatment(m[2]);
        if (!t1 || !t2) return null;
        return {
          pageType: 'treatment-vs-treatment',
          treatmentSlug: t1,
          treatmentSlug2: t2,
        };
      },
    },
    // {treatment}-for-{condition}
    {
      regex: /^([a-z0-9-]+)-for-([a-z0-9-]+)$/,
      parse: (m) => {
        const treatmentSlug = resolveTreatment(m[1]);
        const conditionSlug = resolveCondition(m[2]);
        if (!treatmentSlug || !conditionSlug) return null;
        return { pageType: 'treatment-for-condition', treatmentSlug, conditionSlug };
      },
    },
    // {treatment}-dosage-for-{condition}
    {
      regex: /^([a-z0-9-]+)-dosage-for-([a-z0-9-]+)$/,
      parse: (m) => {
        const t = resolveTreatment(m[1]);
        const c = resolveCondition(m[2]);
        if (!t || !c) return null;
        return { pageType: 'treatment-dosage', treatmentSlug: t, conditionSlug: c };
      },
    },
    // {treatment}-side-effects
    {
      regex: /^([a-z0-9-]+)-(?:long-term-)?side-effects$/,
      parse: (m) => {
        const t = resolveTreatment(m[1]);
        if (!t) return null;
        return { 
          pageType: 'treatment-side-effects', 
          treatmentSlug: t,
          modifier: slug.includes('long-term') ? 'long-term' : undefined,
        };
      },
    },
    // {treatment}-withdrawal-symptoms
    {
      regex: /^([a-z0-9-]+)-withdrawal(?:-symptoms)?$/,
      parse: (m) => {
        const t = resolveTreatment(m[1]);
        if (!t) return null;
        return { pageType: 'treatment-withdrawal', treatmentSlug: t };
      },
    },
    // how-to-stop-{treatment}-safely
    {
      regex: /^how-to-stop-([a-z0-9-]+)-safely$/,
      parse: (m) => {
        const t = resolveTreatment(m[1]);
        if (!t) return null;
        return { pageType: 'treatment-withdrawal', treatmentSlug: t, modifier: 'tapering' };
      },
    },
    // {treatment}-drug-interactions
    {
      regex: /^([a-z0-9-]+)-drug-interactions$/,
      parse: (m) => {
        const t = resolveTreatment(m[1]);
        if (!t) return null;
        return { pageType: 'treatment-interactions', treatmentSlug: t };
      },
    },
    // can-you-drink-alcohol-on-{treatment}
    {
      regex: /^can-you-drink-alcohol-on-([a-z0-9-]+)$/,
      parse: (m) => {
        const t = resolveTreatment(m[1]);
        if (!t) return null;
        return { pageType: 'treatment-interactions', treatmentSlug: t, modifier: 'alcohol' };
      },
    },
    // does-{treatment}-cause-weight-gain
    {
      regex: /^does-([a-z0-9-]+)-cause-weight-gain$/,
      parse: (m) => {
        const t = resolveTreatment(m[1]);
        if (!t) return null;
        return { pageType: 'treatment-side-effects', treatmentSlug: t, modifier: 'weight' };
      },
    },
    // how-long-does-{treatment}-take-to-work
    {
      regex: /^how-long-does-([a-z0-9-]+)-take-to-work$/,
      parse: (m) => {
        const t = resolveTreatment(m[1]);
        if (!t) return null;
        return { pageType: 'treatment-for-condition', treatmentSlug: t, modifier: 'onset' };
      },
    },
    // {condition}-symptoms-in-{demographic}
    {
      regex: /^([a-z0-9-]+)-symptoms-in-([a-z-]+)$/,
      parse: (m) => {
        const c = resolveCondition(m[1]);
        if (!c) return null;
        return { pageType: 'condition-symptoms-demographic', conditionSlug: c, demographic: m[2] };
      },
    },
    // {condition}-symptoms
    {
      regex: /^([a-z0-9-]+)-symptoms$/,
      parse: (m) => {
        const c = resolveCondition(m[1]);
        if (!c) return null;
        return { pageType: 'condition-symptoms-demographic', conditionSlug: c };
      },
    },
    // early-signs-of-{condition}
    {
      regex: /^early-signs-of-([a-z0-9-]+)$/,
      parse: (m) => {
        const c = resolveCondition(m[1]);
        if (!c) return null;
        return { pageType: 'condition-symptoms-demographic', conditionSlug: c, modifier: 'early' };
      },
    },
    // {condition}-treatment-options OR best-treatment-for-{condition}
    {
      regex: /^(?:([a-z0-9-]+)-treatment-options|best-treatment-for-([a-z0-9-]+))$/,
      parse: (m) => {
        const c = resolveCondition(m[1] || m[2]);
        if (!c) return null;
        return { 
          pageType: 'condition-treatment-options', 
          conditionSlug: c,
          modifier: m[2] ? 'best' : undefined,
        };
      },
    },
    // natural-remedies-for-{condition}
    {
      regex: /^natural-remedies-for-([a-z0-9-]+)$/,
      parse: (m) => {
        const c = resolveCondition(m[1]);
        if (!c) return null;
        return { pageType: 'condition-natural-remedies', conditionSlug: c };
      },
    },
    // home-remedies-for-{condition}
    {
      regex: /^home-remedies-for-([a-z0-9-]+)$/,
      parse: (m) => {
        const c = resolveCondition(m[1]);
        if (!c) return null;
        return { pageType: 'condition-natural-remedies', conditionSlug: c, modifier: 'home' };
      },
    },
    // how-to-treat-{condition}-without-medication
    {
      regex: /^how-to-treat-([a-z0-9-]+)-without-medication$/,
      parse: (m) => {
        const c = resolveCondition(m[1]);
        if (!c) return null;
        return { pageType: 'condition-without-medication', conditionSlug: c };
      },
    },
    // what-causes-{condition}
    {
      regex: /^what-causes-([a-z0-9-]+)$/,
      parse: (m) => {
        const c = resolveCondition(m[1]);
        if (!c) return null;
        return { pageType: 'condition-causes', conditionSlug: c };
      },
    },
    // how-is-{condition}-diagnosed
    {
      regex: /^how-is-([a-z0-9-]+)-diagnosed$/,
      parse: (m) => {
        const c = resolveCondition(m[1]);
        if (!c) return null;
        return { pageType: 'condition-diagnosis', conditionSlug: c };
      },
    },
    // {condition}-test-quiz
    {
      regex: /^([a-z0-9-]+)-test-quiz$/,
      parse: (m) => {
        const c = resolveCondition(m[1]);
        if (!c) return null;
        return { pageType: 'condition-diagnosis', conditionSlug: c, modifier: 'self-test' };
      },
    },
    // when-to-see-a-doctor-for-{condition}
    {
      regex: /^when-to-see-a-doctor-for-([a-z0-9-]+)$/,
      parse: (m) => {
        const c = resolveCondition(m[1]);
        if (!c) return null;
        return { pageType: 'condition-when-to-seek-help', conditionSlug: c };
      },
    },
    // {condition}-vs-{condition}-difference
    {
      regex: /^([a-z0-9-]+)-vs-([a-z0-9-]+)-difference$/,
      parse: (m) => {
        const c1 = resolveCondition(m[1]);
        const c2 = resolveCondition(m[2]);
        if (!c1 || !c2) return null;
        return { pageType: 'condition-vs-condition', conditionSlug: c1, modifier: c2 };
      },
    },
  ];

  for (const { regex, parse } of patterns) {
    const match = slug.match(regex);
    if (match) {
      const result = parse(match);
      if (result) {
        return {
          slug,
          priority: 2,
          searchVolume: 'medium',
          ...result,
        } as DynamicPageConfig;
      }
    }
  }

  return null;
}

/**
 * Get statistics about generated pages
 */
export async function getDynamicPageStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  bySearchVolume: Record<string, number>;
  topTreatments: Array<{ slug: string; pages: number }>;
  topConditions: Array<{ slug: string; pages: number }>;
}> {
  const configs = await generateDynamicPageConfigs();
  
  const byType: Record<string, number> = {};
  const bySearchVolume: Record<string, number> = {};
  const treatmentCounts: Record<string, number> = {};
  const conditionCounts: Record<string, number> = {};

  for (const config of configs) {
    byType[config.pageType] = (byType[config.pageType] || 0) + 1;
    bySearchVolume[config.searchVolume] = (bySearchVolume[config.searchVolume] || 0) + 1;
    
    if (config.treatmentSlug) {
      treatmentCounts[config.treatmentSlug] = (treatmentCounts[config.treatmentSlug] || 0) + 1;
    }
    if (config.conditionSlug) {
      conditionCounts[config.conditionSlug] = (conditionCounts[config.conditionSlug] || 0) + 1;
    }
  }

  const topTreatments = Object.entries(treatmentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug, pages]) => ({ slug, pages }));

  const topConditions = Object.entries(conditionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug, pages]) => ({ slug, pages }));

  return {
    total: configs.length,
    byType,
    bySearchVolume,
    topTreatments,
    topConditions,
  };
}

/**
 * Clear caches (for development/testing)
 */
export function clearDynamicCaches(): void {
  treatmentMetaCache = null;
  conditionMetaCache = null;
}



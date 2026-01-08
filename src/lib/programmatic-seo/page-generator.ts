/**
 * Programmatic SEO Page Generator
 * 
 * Automatically generates thousands of long-tail pages by combining
 * existing condition and treatment data in intelligent ways.
 * 
 * Page Types Generated:
 * 1. Treatment-for-Condition: /lexapro-for-anxiety
 * 2. Treatment-for-Condition-Demographics: /lexapro-for-anxiety-in-elderly
 * 3. Condition-Symptoms-Demographics: /anxiety-symptoms-in-women
 * 4. Treatment-vs-Treatment-for-Condition: /lexapro-vs-zoloft-for-anxiety
 * 5. Treatment-Dosage-for-Condition: /lexapro-dosage-for-anxiety
 */

export interface ProgrammaticPageConfig {
  slug: string;
  treatmentSlug?: string;
  treatmentSlug2?: string; // For comparisons
  conditionSlug?: string;
  demographic?: DemographicModifier;
  pageType: PageType;
  modifier?: ContentModifier;
}

export type PageType = 
  | 'treatment-for-condition'
  | 'treatment-for-condition-demographic'
  | 'condition-symptoms-demographic'
  | 'treatment-vs-treatment-condition'
  | 'treatment-dosage-condition'
  | 'treatment-side-effects'
  | 'condition-treatment-options'
  | 'treatment-reviews'
  | 'natural-alternatives';

export type DemographicModifier = 
  | 'elderly'
  | 'seniors'
  | 'teenagers'
  | 'adolescents'
  | 'children'
  | 'women'
  | 'men'
  | 'pregnancy'
  | 'breastfeeding'
  | 'young-adults';

export type ContentModifier =
  | 'dosage'
  | 'side-effects'
  | 'withdrawal'
  | 'alternatives'
  | 'natural'
  | 'without-medication'
  | 'reviews'
  | 'cost'
  | 'generic';

// High-value treatment-condition combinations to generate
export const HIGH_PRIORITY_COMBINATIONS: Array<{
  treatment: string;
  conditions: string[];
  priority: number;
}> = [
  {
    treatment: 'escitalopram-lexapro',
    conditions: ['generalized-anxiety-disorder', 'major-depressive-disorder', 'social-anxiety-disorder', 'panic-disorder'],
    priority: 1
  },
  {
    treatment: 'sertraline-zoloft',
    conditions: ['generalized-anxiety-disorder', 'major-depressive-disorder', 'obsessive-compulsive-disorder', 'panic-disorder', 'posttraumatic-stress-disorder'],
    priority: 1
  },
  {
    treatment: 'cognitive-behavioral-therapy',
    conditions: ['generalized-anxiety-disorder', 'major-depressive-disorder', 'obsessive-compulsive-disorder', 'panic-disorder', 'social-anxiety-disorder', 'insomnia'],
    priority: 1
  },
  {
    treatment: 'fluoxetine-prozac',
    conditions: ['major-depressive-disorder', 'obsessive-compulsive-disorder', 'bulimia-nervosa', 'panic-disorder'],
    priority: 1
  },
  {
    treatment: 'bupropion-wellbutrin',
    conditions: ['major-depressive-disorder', 'attention-deficit-hyperactivity-disorder'],
    priority: 1
  },
  {
    treatment: 'venlafaxine-effexor',
    conditions: ['major-depressive-disorder', 'generalized-anxiety-disorder', 'social-anxiety-disorder', 'panic-disorder'],
    priority: 2
  },
  {
    treatment: 'duloxetine-cymbalta',
    conditions: ['major-depressive-disorder', 'generalized-anxiety-disorder'],
    priority: 2
  },
  {
    treatment: 'buspirone',
    conditions: ['generalized-anxiety-disorder'],
    priority: 2
  },
  {
    treatment: 'alprazolam-xanax',
    conditions: ['generalized-anxiety-disorder', 'panic-disorder'],
    priority: 1
  },
  {
    treatment: 'clonazepam-klonopin',
    conditions: ['panic-disorder', 'generalized-anxiety-disorder'],
    priority: 2
  },
  {
    treatment: 'trazodone',
    conditions: ['insomnia', 'major-depressive-disorder'],
    priority: 2
  },
  {
    treatment: 'quetiapine-seroquel',
    conditions: ['bipolar-i-disorder', 'major-depressive-disorder', 'schizophrenia'],
    priority: 2
  },
  {
    treatment: 'aripiprazole-abilify',
    conditions: ['bipolar-i-disorder', 'major-depressive-disorder', 'schizophrenia', 'autism-spectrum-disorder'],
    priority: 2
  },
  {
    treatment: 'lamotrigine-lamictal',
    conditions: ['bipolar-i-disorder', 'bipolar-ii-disorder'],
    priority: 2
  },
  {
    treatment: 'lithium',
    conditions: ['bipolar-i-disorder', 'bipolar-ii-disorder'],
    priority: 2
  },
  {
    treatment: 'methylphenidate-ritalin',
    conditions: ['attention-deficit-hyperactivity-disorder'],
    priority: 1
  },
  {
    treatment: 'amphetamine-adderall',
    conditions: ['attention-deficit-hyperactivity-disorder'],
    priority: 1
  },
  {
    treatment: 'atomoxetine-strattera',
    conditions: ['attention-deficit-hyperactivity-disorder'],
    priority: 2
  },
  {
    treatment: 'dialectical-behavior-therapy',
    conditions: ['borderline-personality-disorder', 'major-depressive-disorder'],
    priority: 1
  },
  {
    treatment: 'exposure-response-prevention',
    conditions: ['obsessive-compulsive-disorder'],
    priority: 1
  },
  {
    treatment: 'emdr',
    conditions: ['posttraumatic-stress-disorder'],
    priority: 1
  },
  {
    treatment: 'psilocybin-therapy',
    conditions: ['major-depressive-disorder', 'posttraumatic-stress-disorder'],
    priority: 2
  },
  {
    treatment: 'ketamine-therapy',
    conditions: ['major-depressive-disorder'],
    priority: 2
  },
  {
    treatment: 'transcranial-magnetic-stimulation',
    conditions: ['major-depressive-disorder', 'obsessive-compulsive-disorder'],
    priority: 2
  },
];

// Demographics that add search volume
export const DEMOGRAPHICS: DemographicModifier[] = [
  'elderly',
  'teenagers',
  'women',
  'men',
  'pregnancy',
  'children',
];

// Content modifiers that create unique long-tail pages
export const CONTENT_MODIFIERS: ContentModifier[] = [
  'dosage',
  'side-effects',
  'withdrawal',
  'alternatives',
  'natural',
];

/**
 * Generate all possible page slugs from combinations
 */
export function generateAllPageConfigs(): ProgrammaticPageConfig[] {
  const configs: ProgrammaticPageConfig[] = [];

  // Type 1: Treatment-for-Condition
  for (const combo of HIGH_PRIORITY_COMBINATIONS) {
    for (const condition of combo.conditions) {
      const treatmentName = getTreatmentDisplaySlug(combo.treatment);
      const conditionName = condition;
      
      configs.push({
        slug: `${treatmentName}-for-${conditionName}`,
        treatmentSlug: combo.treatment,
        conditionSlug: condition,
        pageType: 'treatment-for-condition',
      });

      // Type 2: Treatment-for-Condition-Demographic
      for (const demographic of DEMOGRAPHICS) {
        configs.push({
          slug: `${treatmentName}-for-${conditionName}-in-${demographic}`,
          treatmentSlug: combo.treatment,
          conditionSlug: condition,
          demographic,
          pageType: 'treatment-for-condition-demographic',
        });
      }

      // Type 5: Treatment-Dosage-for-Condition
      configs.push({
        slug: `${treatmentName}-dosage-for-${conditionName}`,
        treatmentSlug: combo.treatment,
        conditionSlug: condition,
        modifier: 'dosage',
        pageType: 'treatment-dosage-condition',
      });
    }
  }

  // Type 3: Condition-Symptoms-Demographic
  const highVolumeConditions = [
    'generalized-anxiety-disorder',
    'major-depressive-disorder',
    'attention-deficit-hyperactivity-disorder',
    'bipolar-i-disorder',
    'obsessive-compulsive-disorder',
    'posttraumatic-stress-disorder',
    'panic-disorder',
    'social-anxiety-disorder',
    'borderline-personality-disorder',
    'autism-spectrum-disorder',
  ];

  for (const condition of highVolumeConditions) {
    for (const demographic of DEMOGRAPHICS) {
      configs.push({
        slug: `${condition}-symptoms-in-${demographic}`,
        conditionSlug: condition,
        demographic,
        pageType: 'condition-symptoms-demographic',
      });
    }

    // Treatment options for condition
    configs.push({
      slug: `${condition}-treatment-options`,
      conditionSlug: condition,
      pageType: 'condition-treatment-options',
    });

    // Natural/alternative treatments
    configs.push({
      slug: `natural-remedies-for-${condition}`,
      conditionSlug: condition,
      modifier: 'natural',
      pageType: 'natural-alternatives',
    });

    configs.push({
      slug: `how-to-treat-${condition}-without-medication`,
      conditionSlug: condition,
      modifier: 'without-medication',
      pageType: 'natural-alternatives',
    });
  }

  // Type 4: Treatment-vs-Treatment-for-Condition (high-value comparisons)
  const comparisonPairs: Array<{ t1: string; t2: string; conditions: string[] }> = [
    { t1: 'escitalopram-lexapro', t2: 'sertraline-zoloft', conditions: ['generalized-anxiety-disorder', 'major-depressive-disorder'] },
    { t1: 'escitalopram-lexapro', t2: 'fluoxetine-prozac', conditions: ['major-depressive-disorder'] },
    { t1: 'sertraline-zoloft', t2: 'fluoxetine-prozac', conditions: ['major-depressive-disorder', 'obsessive-compulsive-disorder'] },
    { t1: 'bupropion-wellbutrin', t2: 'escitalopram-lexapro', conditions: ['major-depressive-disorder'] },
    { t1: 'venlafaxine-effexor', t2: 'duloxetine-cymbalta', conditions: ['major-depressive-disorder', 'generalized-anxiety-disorder'] },
    { t1: 'cognitive-behavioral-therapy', t2: 'dialectical-behavior-therapy', conditions: ['major-depressive-disorder', 'borderline-personality-disorder'] },
    { t1: 'alprazolam-xanax', t2: 'clonazepam-klonopin', conditions: ['panic-disorder', 'generalized-anxiety-disorder'] },
    { t1: 'methylphenidate-ritalin', t2: 'amphetamine-adderall', conditions: ['attention-deficit-hyperactivity-disorder'] },
  ];

  for (const pair of comparisonPairs) {
    for (const condition of pair.conditions) {
      const t1Name = getTreatmentDisplaySlug(pair.t1);
      const t2Name = getTreatmentDisplaySlug(pair.t2);
      
      configs.push({
        slug: `${t1Name}-vs-${t2Name}-for-${condition}`,
        treatmentSlug: pair.t1,
        treatmentSlug2: pair.t2,
        conditionSlug: condition,
        pageType: 'treatment-vs-treatment-condition',
      });
    }
  }

  // Type 6: Side effects pages (high search volume)
  for (const combo of HIGH_PRIORITY_COMBINATIONS.filter(c => c.priority === 1)) {
    const treatmentName = getTreatmentDisplaySlug(combo.treatment);
    
    configs.push({
      slug: `${treatmentName}-side-effects`,
      treatmentSlug: combo.treatment,
      modifier: 'side-effects',
      pageType: 'treatment-side-effects',
    });

    configs.push({
      slug: `${treatmentName}-withdrawal-symptoms`,
      treatmentSlug: combo.treatment,
      modifier: 'withdrawal',
      pageType: 'treatment-side-effects',
    });
  }

  return configs;
}

/**
 * Get display-friendly slug from treatment file slug
 * e.g., "escitalopram-lexapro" -> "lexapro" (uses brand name for SEO)
 */
function getTreatmentDisplaySlug(treatmentSlug: string): string {
  // Extract brand name if present (typically after hyphen)
  const parts = treatmentSlug.split('-');
  
  // Known brand name mappings for better SEO
  const brandMappings: Record<string, string> = {
    'escitalopram-lexapro': 'lexapro',
    'sertraline-zoloft': 'zoloft',
    'fluoxetine-prozac': 'prozac',
    'bupropion-wellbutrin': 'wellbutrin',
    'venlafaxine-effexor': 'effexor',
    'duloxetine-cymbalta': 'cymbalta',
    'alprazolam-xanax': 'xanax',
    'clonazepam-klonopin': 'klonopin',
    'quetiapine-seroquel': 'seroquel',
    'aripiprazole-abilify': 'abilify',
    'lamotrigine-lamictal': 'lamictal',
    'methylphenidate-ritalin': 'ritalin',
    'amphetamine-adderall': 'adderall',
    'atomoxetine-strattera': 'strattera',
  };

  return brandMappings[treatmentSlug] || parts[parts.length - 1] || treatmentSlug;
}

/**
 * Parse a programmatic slug to extract components
 */
export function parsePageSlug(slug: string): ProgrammaticPageConfig | null {
  // Pattern: {treatment}-for-{condition}
  const treatmentForCondition = slug.match(/^([a-z-]+)-for-([a-z-]+)$/);
  if (treatmentForCondition) {
    return {
      slug,
      treatmentSlug: treatmentForCondition[1],
      conditionSlug: treatmentForCondition[2],
      pageType: 'treatment-for-condition',
    };
  }

  // Pattern: {treatment}-for-{condition}-in-{demographic}
  const treatmentForConditionDemo = slug.match(/^([a-z-]+)-for-([a-z-]+)-in-([a-z-]+)$/);
  if (treatmentForConditionDemo) {
    return {
      slug,
      treatmentSlug: treatmentForConditionDemo[1],
      conditionSlug: treatmentForConditionDemo[2],
      demographic: treatmentForConditionDemo[3] as DemographicModifier,
      pageType: 'treatment-for-condition-demographic',
    };
  }

  // Pattern: {condition}-symptoms-in-{demographic}
  const conditionSymptoms = slug.match(/^([a-z-]+)-symptoms-in-([a-z-]+)$/);
  if (conditionSymptoms) {
    return {
      slug,
      conditionSlug: conditionSymptoms[1],
      demographic: conditionSymptoms[2] as DemographicModifier,
      pageType: 'condition-symptoms-demographic',
    };
  }

  // Pattern: {treatment}-vs-{treatment}-for-{condition}
  const comparison = slug.match(/^([a-z-]+)-vs-([a-z-]+)-for-([a-z-]+)$/);
  if (comparison) {
    return {
      slug,
      treatmentSlug: comparison[1],
      treatmentSlug2: comparison[2],
      conditionSlug: comparison[3],
      pageType: 'treatment-vs-treatment-condition',
    };
  }

  // Pattern: {treatment}-dosage-for-{condition}
  const dosage = slug.match(/^([a-z-]+)-dosage-for-([a-z-]+)$/);
  if (dosage) {
    return {
      slug,
      treatmentSlug: dosage[1],
      conditionSlug: dosage[2],
      modifier: 'dosage',
      pageType: 'treatment-dosage-condition',
    };
  }

  // Pattern: {treatment}-side-effects
  const sideEffects = slug.match(/^([a-z-]+)-side-effects$/);
  if (sideEffects) {
    return {
      slug,
      treatmentSlug: sideEffects[1],
      modifier: 'side-effects',
      pageType: 'treatment-side-effects',
    };
  }

  // Pattern: {treatment}-withdrawal-symptoms
  const withdrawal = slug.match(/^([a-z-]+)-withdrawal-symptoms$/);
  if (withdrawal) {
    return {
      slug,
      treatmentSlug: withdrawal[1],
      modifier: 'withdrawal',
      pageType: 'treatment-side-effects',
    };
  }

  // Pattern: {condition}-treatment-options
  const treatmentOptions = slug.match(/^([a-z-]+)-treatment-options$/);
  if (treatmentOptions) {
    return {
      slug,
      conditionSlug: treatmentOptions[1],
      pageType: 'condition-treatment-options',
    };
  }

  // Pattern: natural-remedies-for-{condition}
  const naturalRemedies = slug.match(/^natural-remedies-for-([a-z-]+)$/);
  if (naturalRemedies) {
    return {
      slug,
      conditionSlug: naturalRemedies[1],
      modifier: 'natural',
      pageType: 'natural-alternatives',
    };
  }

  // Pattern: how-to-treat-{condition}-without-medication
  const withoutMeds = slug.match(/^how-to-treat-([a-z-]+)-without-medication$/);
  if (withoutMeds) {
    return {
      slug,
      conditionSlug: withoutMeds[1],
      modifier: 'without-medication',
      pageType: 'natural-alternatives',
    };
  }

  return null;
}

/**
 * Get all page slugs for static generation
 */
export function getAllProgrammaticSlugs(): string[] {
  const configs = generateAllPageConfigs();
  return configs.map(c => c.slug);
}

/**
 * Count total pages that will be generated
 */
export function getPageCount(): { total: number; byType: Record<PageType, number> } {
  const configs = generateAllPageConfigs();
  const byType: Record<string, number> = {};

  for (const config of configs) {
    byType[config.pageType] = (byType[config.pageType] || 0) + 1;
  }

  return {
    total: configs.length,
    byType: byType as Record<PageType, number>,
  };
}



/**
 * CANONICAL AUTHORITY MODEL - ANSWER KINGS
 * 
 * For every question cluster, ONE page is the "answer king".
 * All variants support it, never compete with it.
 * 
 * This prevents:
 * - Featured snippet rotation
 * - Internal cannibalization
 * - Diluted authority
 * 
 * Rules:
 * - Only answer kings get featured snippet optimization
 * - Variants expand, localize, add nuance
 * - Variants NEVER restate the same core answer
 */

import type { DynamicPageConfig } from './dynamic-generator';

// ============ ANSWER CLUSTER DEFINITION ============

export interface AnswerCluster {
  question: string;              // The core question being answered
  kingSlug: string;              // The canonical answer page
  variantSlugs: string[];        // Supporting pages that link to king
  snippetOptimized: boolean;     // Only kings are snippet-optimized
}

// ============ KING DESIGNATION RULES ============

/**
 * Determine which page type is the "king" for each question pattern
 */
const KING_HIERARCHY: Record<string, string[]> = {
  // For "Is X good for Y?" - the base treatment-for-condition page is king
  'treatment-for-condition': [
    'treatment-for-condition',           // KING
    'treatment-condition-demographic',   // Variant
  ],
  
  // For "X vs Y" - the comparison page is king
  'treatment-comparison': [
    'treatment-vs-treatment',            // KING
    'treatment-vs-treatment-condition',  // Variant
  ],
  
  // For "X side effects" - the base side effects page is king
  'side-effects': [
    'treatment-side-effects',            // KING
    'treatment-side-effects-demographic', // Variant (if exists)
  ],
  
  // For "symptoms of X" - the base condition page is king
  'symptoms': [
    'condition-symptoms',                // KING
    'condition-symptoms-demographic',    // Variant
  ],
  
  // For "how to treat X" - the treatment options hub is king
  'treatment-options': [
    'condition-treatment-options',       // KING
    'condition-natural-remedies',        // Variant (alternative approach)
  ],
};

// ============ KING IDENTIFICATION ============

/**
 * Determine if a page is an answer king or a variant
 */
export function isAnswerKing(config: DynamicPageConfig): boolean {
  // Base pages without demographics/modifiers are kings
  if (!config.demographic && !config.modifier) {
    return true;
  }
  
  // Comparison pages without condition context are kings
  if (config.pageType === 'treatment-vs-treatment' && !config.conditionSlug) {
    return true;
  }
  
  // Specific page types are always kings for their query
  const alwaysKing = [
    'treatment-side-effects',
    'treatment-withdrawal',
    'treatment-dosage',
    'condition-causes',
    'condition-diagnosis',
  ];
  
  if (alwaysKing.includes(config.pageType) && !config.demographic) {
    return true;
  }
  
  return false;
}

/**
 * Get the king slug for a variant page
 */
export function getKingSlug(config: DynamicPageConfig): string | null {
  if (isAnswerKing(config)) {
    return null; // This page IS the king
  }
  
  // For demographic variants, the king is the non-demographic version
  if (config.demographic) {
    // Remove demographic from slug to get king
    const kingSlug = config.slug
      .replace(/-in-elderly$/, '')
      .replace(/-in-teenagers$/, '')
      .replace(/-in-children$/, '')
      .replace(/-in-pregnancy$/, '')
      .replace(/-in-women$/, '')
      .replace(/-in-men$/, '');
    
    return kingSlug;
  }
  
  // For condition-specific comparisons, king is the base comparison
  if (config.pageType === 'treatment-vs-treatment' && config.conditionSlug) {
    return `${config.treatmentSlug}-vs-${config.treatmentSlug2}`;
  }
  
  return null;
}

// ============ VARIANT DIFFERENTIATION ============

/**
 * Rules for how variants must differ from their king
 */
export interface VariantRules {
  mustInclude: string[];           // Required unique elements
  mustNotRepeat: string[];         // Elements that duplicate the king
  suggestedAngle: string;          // How to differentiate
}

export function getVariantRules(config: DynamicPageConfig): VariantRules {
  if (isAnswerKing(config)) {
    return {
      mustInclude: [],
      mustNotRepeat: [],
      suggestedAngle: 'This is the answer king - optimize for featured snippet',
    };
  }
  
  // Demographic variants
  if (config.demographic) {
    return {
      mustInclude: [
        `specific considerations for ${config.demographic}`,
        `dosage adjustments for ${config.demographic}`,
        `side effects more common in ${config.demographic}`,
        `studies specifically in ${config.demographic} populations`,
      ],
      mustNotRepeat: [
        'generic mechanism of action',
        'general effectiveness claims',
        'basic side effects list',
      ],
      suggestedAngle: `Focus on what's UNIQUE about ${config.demographic} - don't rehash general info`,
    };
  }
  
  // Condition-specific comparison variants
  if (config.pageType === 'treatment-vs-treatment' && config.conditionSlug) {
    return {
      mustInclude: [
        `head-to-head studies for ${config.conditionSlug}`,
        `which works better specifically for ${config.conditionSlug}`,
        `condition-specific side effect considerations`,
      ],
      mustNotRepeat: [
        'general drug comparison',
        'mechanism differences',
        'cost comparison',
      ],
      suggestedAngle: `Focus on ${config.conditionSlug}-specific evidence, not general comparison`,
    };
  }
  
  return {
    mustInclude: ['unique angle for this variant'],
    mustNotRepeat: ['content from the king page'],
    suggestedAngle: 'Find the unique value this page provides',
  };
}

// ============ INTERNAL LINKING STRATEGY ============

/**
 * Generate link structure for answer clusters
 * 
 * Rules:
 * - Variants link UP to king (supporting authority)
 * - King links DOWN to variants (breadth)
 * - Variants link ACROSS to each other (related content)
 */
export interface ClusterLinks {
  toKing: { text: string; url: string } | null;
  toVariants: Array<{ text: string; url: string }>;
  crossLinks: Array<{ text: string; url: string }>;
}

export function generateClusterLinks(
  config: DynamicPageConfig,
  allConfigs: DynamicPageConfig[]
): ClusterLinks {
  const isKing = isAnswerKing(config);
  const kingSlug = getKingSlug(config);
  
  // Find related variants
  const relatedVariants = allConfigs.filter(c => {
    if (c.slug === config.slug) return false;
    
    // Same treatment and condition base
    if (c.treatmentSlug === config.treatmentSlug && 
        c.conditionSlug === config.conditionSlug) {
      return true;
    }
    
    return false;
  });
  
  if (isKing) {
    return {
      toKing: null, // We ARE the king
      toVariants: relatedVariants.map(v => ({
        text: formatVariantLinkText(v),
        url: `/guide/${v.slug}`,
      })),
      crossLinks: [],
    };
  }
  
  return {
    toKing: kingSlug ? {
      text: 'See our comprehensive guide',
      url: `/guide/${kingSlug}`,
    } : null,
    toVariants: [],
    crossLinks: relatedVariants.slice(0, 3).map(v => ({
      text: formatVariantLinkText(v),
      url: `/guide/${v.slug}`,
    })),
  };
}

function formatVariantLinkText(config: DynamicPageConfig): string {
  if (config.demographic) {
    return `Information for ${config.demographic}`;
  }
  if (config.conditionSlug && config.pageType === 'treatment-vs-treatment') {
    return `For ${formatConditionName(config.conditionSlug)}`;
  }
  return config.slug;
}

function formatConditionName(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ============ FEATURED SNIPPET OPTIMIZATION ============

/**
 * Generate featured snippet content ONLY for answer kings
 */
export interface SnippetOptimization {
  enabled: boolean;
  directAnswer: string;           // 1-2 sentences, quotable
  expandedAnswer: string;         // With context and caveats
  listFormat?: string[];          // For list snippets
  tableFormat?: { headers: string[]; rows: string[][] }; // For table snippets
}

export function generateSnippetOptimization(
  config: DynamicPageConfig,
  coreAnswer: string,
  context: string
): SnippetOptimization {
  if (!isAnswerKing(config)) {
    return {
      enabled: false,
      directAnswer: '',
      expandedAnswer: '',
    };
  }
  
  return {
    enabled: true,
    directAnswer: sanitizeForSnippet(coreAnswer),
    expandedAnswer: `${sanitizeForSnippet(coreAnswer)} ${context} Individual responses vary, and you should consult your healthcare provider for personalized advice.`,
  };
}

/**
 * Clean answer for snippet extraction
 * 
 * Rules:
 * - No absolutes
 * - Explicit uncertainty
 * - Plain language
 * - Quotable out of context
 */
function sanitizeForSnippet(text: string): string {
  return text
    // Remove absolute language
    .replace(/\bwill\b/gi, 'may')
    .replace(/\balways\b/gi, 'often')
    .replace(/\bnever\b/gi, 'rarely')
    .replace(/\bguaranteed\b/gi, 'likely')
    .replace(/\bdefinitely\b/gi, 'typically')
    // Remove instruction language
    .replace(/\byou should\b/gi, 'patients may')
    .replace(/\btake\b/gi, 'consider')
    // Ensure it ends cleanly
    .trim();
}



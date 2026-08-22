/**
 * @deprecated This module is deprecated in favor of the Central Indexation Firewall.
 * Use `@/lib/seo/index-decision-service` instead for all indexability decisions.
 *
 * MIGRATION STATUS:
 * - Guide sitemap: Migrated to index-decision-service
 * - Guide page metadata: Migrated to index-decision-service
 * - Content engine: Still imports checkIndexEligibility (needs migration)
 *
 * DO NOT ADD NEW CONSUMERS. This file will be removed after full migration.
 *
 * @see src/lib/seo/index-decision-service.ts - The new Central Indexation Firewall
 *
 * -------- LEGACY DOCUMENTATION --------
 *
 * INDEX ELIGIBILITY GATE
 *
 * The difference between dominance and death.
 *
 * RULE: Generate unlimited pages. Index ONLY pages that earn it.
 * Everything else renders with noindex,follow.
 *
 * This prevents:
 * - Crawl budget waste
 * - Spam signals
 * - Index bloat penalties
 * - YMYL trust destruction
 */

import type { DynamicPageConfig } from './dynamic-generator';
import type { GeneratedContent } from './content-engine';

// ============ ELIGIBILITY THRESHOLDS ============

export interface EligibilityThresholds {
  minDemandScore: number;        // Search volume / impressions proxy
  minUniquenessScore: number;    // 0-1, semantic similarity threshold
  minSafetyScore: number;        // 0-1, completeness of medical caveats
  requireCanonicalAuthority: boolean;
}

const DEFAULT_THRESHOLDS: EligibilityThresholds = {
  minDemandScore: 10,           // At least 10 monthly searches (estimated)
  minUniquenessScore: 0.7,      // 70% unique from similar pages
  minSafetyScore: 0.8,          // 80% of required safety elements present
  requireCanonicalAuthority: true,
};

// ============ ELIGIBILITY RESULT ============

export interface EligibilityResult {
  isIndexable: boolean;
  reasons: string[];
  scores: {
    demand: number;
    uniqueness: number;
    safety: number;
    canonicalAuthority: boolean;
  };
  recommendation: 'index' | 'noindex' | 'review';
}

// ============ DEMAND SCORING ============

/**
 * Estimate demand based on page type and entity popularity
 * 
 * In production, this would use:
 * - Google Search Console impressions data
 * - Keyword research API data
 * - Internal analytics
 * 
 * For now, we use heuristics based on page type
 */
function calculateDemandScore(config: DynamicPageConfig): number {
  // Base scores by page type (estimated monthly searches)
  const baseScores: Record<string, number> = {
    'treatment-for-condition': 100,           // High demand
    'treatment-vs-treatment': 80,             // High demand (comparison intent)
    'treatment-side-effects': 150,            // Very high (safety intent)
    'treatment-withdrawal': 60,               // Moderate
    'treatment-dosage': 50,                   // Moderate
    'treatment-interactions': 40,             // Moderate
    'condition-symptoms': 120,                // High
    'condition-treatment-options': 100,       // High
    'condition-natural-remedies': 70,         // Moderate-high
    'condition-causes': 50,                   // Moderate
    'condition-diagnosis': 40,                // Lower
    'condition-comparison': 30,               // Lower
    'treatment-condition-demographic': 20,    // Long-tail (lower individual, high collective)
    'condition-symptoms-demographic': 15,     // Long-tail
  };

  let score = baseScores[config.pageType] || 10;

  // Boost for high-priority combinations
  const highPriorityTreatments = [
    'lexapro', 'escitalopram', 'zoloft', 'sertraline', 'prozac', 'fluoxetine',
    'wellbutrin', 'bupropion', 'xanax', 'alprazolam', 'adderall', 'vyvanse',
  ];
  
  const highPriorityConditions = [
    'anxiety', 'depression', 'adhd', 'bipolar', 'ocd', 'ptsd', 'panic',
  ];

  if (config.treatmentSlug) {
    const isHighPriority = highPriorityTreatments.some(t => 
      config.treatmentSlug!.toLowerCase().includes(t)
    );
    if (isHighPriority) score *= 2;
  }

  if (config.conditionSlug) {
    const isHighPriority = highPriorityConditions.some(c => 
      config.conditionSlug!.toLowerCase().includes(c)
    );
    if (isHighPriority) score *= 1.5;
  }

  // Reduce score for very specific demographics (except high-value ones)
  if (config.demographic) {
    const highValueDemographics = ['elderly', 'pregnancy', 'children'];
    const isHighValue = highValueDemographics.includes(config.demographic);
    score *= isHighValue ? 1.2 : 0.5;
  }

  return Math.round(score);
}

// ============ UNIQUENESS SCORING ============

/**
 * Check how unique this page is compared to siblings
 * 
 * In production, this would use:
 * - Semantic similarity embeddings
 * - Content fingerprinting
 * - N-gram analysis
 * 
 * For now, we use structural heuristics
 */
function calculateUniquenessScore(
  config: DynamicPageConfig, 
  content: GeneratedContent
): number {
  let score = 1.0;

  // Penalize pages that are too similar to parent pages
  // If treatment-for-condition exists, treatment-for-condition-demographic needs more unique content
  if (config.demographic) {
    // Demographic pages need substantial demographic-specific content
    const demographicMentions = (content.introduction + 
      content.sections.map(s => s.content).join(' ')
    ).toLowerCase().match(new RegExp(config.demographic, 'gi'))?.length || 0;
    
    if (demographicMentions < 3) {
      score -= 0.3; // Not enough demographic-specific content
    }
  }

  // Penalize thin content
  if (content.wordCount < 500) {
    score -= 0.4;
  } else if (content.wordCount < 800) {
    score -= 0.2;
  }

  // Penalize pages with generic introductions
  const genericPhrases = [
    'this guide covers',
    'in this article',
    'we will discuss',
    'let\'s explore',
  ];
  
  const introLower = content.introduction.toLowerCase();
  for (const phrase of genericPhrases) {
    if (introLower.includes(phrase)) {
      score -= 0.1;
    }
  }

  // Boost for unique structural elements
  if (content.comparisonTable) score += 0.1;
  if (content.keyFacts && content.keyFacts.length >= 4) score += 0.1;
  if (content.faqs.length >= 5) score += 0.1;

  return Math.max(0, Math.min(1, score));
}

// ============ SAFETY SCORING ============

/**
 * Ensure YMYL safety requirements are met
 * 
 * A page is NOT safe to index if it:
 * - Provides medication guidance without caveats
 * - Makes absolute claims about efficacy
 * - Lacks "consult your doctor" language
 * - Missing contraindication warnings for medications
 */
function calculateSafetyScore(
  config: DynamicPageConfig, 
  content: GeneratedContent
): number {
  const allText = (
    content.introduction + 
    content.sections.map(s => s.content + (s.items?.join(' ') || '')).join(' ') +
    content.faqs.map(f => f.answer).join(' ')
  ).toLowerCase();

  let score = 0;
  const requirements: { pattern: RegExp; weight: number; found: boolean }[] = [];

  // Required safety elements for medication pages
  if (config.treatmentSlug) {
    requirements.push(
      { pattern: /consult (your |a )?(doctor|physician|healthcare|provider)/i, weight: 0.2, found: false },
      { pattern: /not (a substitute|medical advice|intended to replace)/i, weight: 0.15, found: false },
      { pattern: /individual (results|responses?) (may )?var(y|ies)/i, weight: 0.1, found: false },
      { pattern: /side effects?/i, weight: 0.15, found: false },
      { pattern: /(may|might|can) (cause|experience|have)/i, weight: 0.1, found: false },
    );

    // Extra requirements for controlled substances
    const controlledSubstances = ['xanax', 'ativan', 'klonopin', 'adderall', 'vyvanse', 'ritalin'];
    const isControlled = controlledSubstances.some(s => config.treatmentSlug!.toLowerCase().includes(s));
    
    if (isControlled) {
      requirements.push(
        { pattern: /(addiction|dependence|abuse|controlled substance)/i, weight: 0.15, found: false },
        { pattern: /(do not|never).*(stop|discontinue|quit)/i, weight: 0.1, found: false },
      );
    }
  }

  // Check for absolute language (bad)
  const absolutePhrases = [
    /\bwill cure\b/i,
    /\bguaranteed to\b/i,
    /\balways works\b/i,
    /\bnever fails\b/i,
    /\b100% (effective|safe)\b/i,
  ];

  let absoluteViolations = 0;
  for (const phrase of absolutePhrases) {
    if (phrase.test(allText)) {
      absoluteViolations++;
    }
  }

  // Calculate score
  for (const req of requirements) {
    if (req.pattern.test(allText)) {
      req.found = true;
      score += req.weight;
    }
  }

  // Penalize absolute claims
  score -= absoluteViolations * 0.2;

  // Base score if no specific requirements
  if (requirements.length === 0) {
    score = 0.8; // Condition-only pages have lower requirements
  }

  // Ensure disclaimer level is appropriate
  if (content.disclaimerLevel === 'elevated' || content.disclaimerLevel === 'critical') {
    score += 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

// ============ CANONICAL AUTHORITY CHECK ============

/**
 * Determine if this page should be the canonical authority for its topic
 * 
 * Rules:
 * - Only one page can be canonical for a given answer
 * - Broader pages beat narrower ones for canonical status
 * - Demographic variants defer to base pages
 */
function checkCanonicalAuthority(config: DynamicPageConfig): boolean {
  // Base pages are always canonical for their topic
  if (!config.demographic && !config.modifier) {
    return true;
  }

  // Demographic variants are NOT canonical - they support the base page
  if (config.demographic) {
    return false;
  }

  // Comparison pages ARE canonical for the comparison query
  if (config.pageType === 'treatment-vs-treatment') {
    return true;
  }

  // Side effect, withdrawal, dosage pages ARE canonical for those specific queries
  if (['treatment-side-effects', 'treatment-withdrawal', 'treatment-dosage'].includes(config.pageType)) {
    return true;
  }

  return false;
}

// ============ MAIN ELIGIBILITY CHECK ============

/**
 * Check if a page should be indexed
 * 
 * Returns detailed result including scores and recommendation
 */
export function checkIndexEligibility(
  config: DynamicPageConfig,
  content: GeneratedContent,
  thresholds: EligibilityThresholds = DEFAULT_THRESHOLDS
): EligibilityResult {
  const demandScore = calculateDemandScore(config);
  const uniquenessScore = calculateUniquenessScore(config, content);
  const safetyScore = calculateSafetyScore(config, content);
  const canonicalAuthority = checkCanonicalAuthority(config);

  const reasons: string[] = [];

  // Check each criterion
  const demandPass = demandScore >= thresholds.minDemandScore;
  const uniquenessPass = uniquenessScore >= thresholds.minUniquenessScore;
  const safetyPass = safetyScore >= thresholds.minSafetyScore;
  const canonicalPass = !thresholds.requireCanonicalAuthority || canonicalAuthority;

  if (!demandPass) {
    reasons.push(`Demand score ${demandScore} below threshold ${thresholds.minDemandScore}`);
  }
  if (!uniquenessPass) {
    reasons.push(`Uniqueness score ${uniquenessScore.toFixed(2)} below threshold ${thresholds.minUniquenessScore}`);
  }
  if (!safetyPass) {
    reasons.push(`Safety score ${safetyScore.toFixed(2)} below threshold ${thresholds.minSafetyScore}`);
  }
  if (!canonicalPass) {
    reasons.push('Not canonical authority for this topic (variant page)');
  }

  const isIndexable = demandPass && uniquenessPass && safetyPass && canonicalPass;

  // Determine recommendation
  let recommendation: 'index' | 'noindex' | 'review' = 'noindex';
  if (isIndexable) {
    recommendation = 'index';
  } else if (demandScore >= thresholds.minDemandScore * 0.5 && safetyPass) {
    recommendation = 'review'; // High enough potential to warrant human review
  }

  return {
    isIndexable,
    reasons: reasons.length > 0 ? reasons : ['All eligibility criteria met'],
    scores: {
      demand: demandScore,
      uniqueness: uniquenessScore,
      safety: safetyScore,
      canonicalAuthority,
    },
    recommendation,
  };
}

// ============ BATCH ELIGIBILITY FOR SITEMAP ============

/**
 * Filter pages for sitemap inclusion
 * Only indexable pages go in the sitemap
 */
export async function filterForSitemap(
  pages: Array<{ config: DynamicPageConfig; content: GeneratedContent }>
): Promise<Array<{ config: DynamicPageConfig; content: GeneratedContent; eligibility: EligibilityResult }>> {
  return pages
    .map(page => ({
      ...page,
      eligibility: checkIndexEligibility(page.config, page.content),
    }))
    .filter(page => page.eligibility.isIndexable);
}

// ============ NOINDEX DIRECTIVE GENERATOR ============

/**
 * Generate the appropriate robots meta tag
 */
export function getRobotsDirective(eligibility: EligibilityResult): string {
  if (eligibility.isIndexable) {
    return 'index,follow';
  }
  
  // noindex but still follow links for crawl discovery
  return 'noindex,follow';
}

// ============ ELIGIBILITY STATS ============

export interface EligibilityStats {
  total: number;
  indexable: number;
  noindex: number;
  needsReview: number;
  byReason: Record<string, number>;
}

/**
 * Get aggregate stats on eligibility
 */
export function calculateEligibilityStats(
  results: EligibilityResult[]
): EligibilityStats {
  const stats: EligibilityStats = {
    total: results.length,
    indexable: 0,
    noindex: 0,
    needsReview: 0,
    byReason: {},
  };

  for (const result of results) {
    if (result.recommendation === 'index') {
      stats.indexable++;
    } else if (result.recommendation === 'review') {
      stats.needsReview++;
    } else {
      stats.noindex++;
    }

    for (const reason of result.reasons) {
      stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
    }
  }

  return stats;
}



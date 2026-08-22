/**
 * PROGRAMMATIC PAGE COHORT MANAGER
 *
 * Manages the lifecycle of programmatically generated pages through cohorts.
 * This replaces binary heuristic scoring with deterministic cohort classification.
 *
 * COHORT LIFECYCLE:
 * 1. candidate     - New page, awaiting evaluation
 * 2. public_noindex - Fails quality gates, accessible but not indexed
 * 3. indexable_pilot - Passes gates, in pilot (limited indexation)
 * 4. validated     - Confirmed via GSC data (impressions, clicks)
 * 5. answer_king   - Canonical authority for topic cluster
 * 6. demoted       - Previously indexed, now quality-gated out
 * 7. retired       - Deprecated, should redirect or 410
 *
 * @see ../seo/index-decision-service.ts for the central firewall
 */

import type { DynamicPageConfig, DynamicPageType } from './dynamic-generator';
import type { GeneratedContent } from './content-engine';
import {
  type IndexCohort,
  type IndexDecision,
  type IndexEvidence,
  makeGuideIndexDecision,
  registerAnswerKing,
  isAnswerKing,
} from '@/lib/seo/index-decision-service';

// ============ COHORT STATE STORAGE ============

/**
 * Persisted cohort state for a programmatic page
 */
export interface CohortState {
  slug: string;
  pageType: DynamicPageType;
  cohort: IndexCohort;
  previousCohort?: IndexCohort;
  transitionedAt: string;
  evaluatedAt: string;
  scores: {
    demand: number;
    uniqueness: number;
    safety: number;
    clinical: number;
  };
  gscData?: {
    impressions: number;
    clicks: number;
    position: number;
    lastFetched: string;
  };
  flags: {
    isAnswerKing: boolean;
    isManuallyPromoted: boolean;
    isManuallyDemoted: boolean;
    requiresReview: boolean;
  };
}

/**
 * In-memory cohort state store
 * In production, this would be backed by a database
 */
const cohortStore: Map<string, CohortState> = new Map();

// ============ COHORT EVALUATION ============

/**
 * Quality gates configuration for guide pages
 */
interface GuideQualityGates {
  minWordCount: number;
  minUniquenessScore: number;
  minSafetyScore: number;
  minDemandScore: number;
  requireDemographicSpecificity: boolean;
}

const DEFAULT_GUIDE_GATES: GuideQualityGates = {
  minWordCount: 400,
  minUniquenessScore: 0.6,
  minSafetyScore: 0.75,
  minDemandScore: 10,
  requireDemographicSpecificity: false,
};

/**
 * Page type specific gate adjustments
 */
const PAGE_TYPE_GATES: Partial<Record<DynamicPageType, Partial<GuideQualityGates>>> = {
  'treatment-for-condition': {
    minWordCount: 600,
    minSafetyScore: 0.8,
  },
  'treatment-side-effects': {
    minWordCount: 500,
    minSafetyScore: 0.85,
  },
  'treatment-withdrawal': {
    minWordCount: 500,
    minSafetyScore: 0.9, // Critical safety content
  },
  'treatment-vs-treatment': {
    minWordCount: 800, // Comparisons need depth
    minUniquenessScore: 0.7,
  },
  'treatment-condition-demographic': {
    minWordCount: 500,
    requireDemographicSpecificity: true,
  },
  'condition-symptoms-demographic': {
    minWordCount: 400,
    requireDemographicSpecificity: true,
  },
};

/**
 * Evaluate a programmatic page and assign/update its cohort
 */
export function evaluateCohort(
  config: DynamicPageConfig,
  content: GeneratedContent,
  existingState?: CohortState
): CohortState {
  const slug = config.slug;
  const now = new Date().toISOString();

  // Get page-type specific gates
  const gates: GuideQualityGates = {
    ...DEFAULT_GUIDE_GATES,
    ...PAGE_TYPE_GATES[config.pageType],
  };

  // Calculate scores
  const demandScore = calculateDemandScore(config);
  const uniquenessScore = calculateUniquenessScore(config, content);
  const safetyScore = calculateSafetyScore(config, content);
  const clinicalScore = calculateClinicalScore(config, content);

  // Get the IndexDecision from the central firewall
  const decision = makeGuideIndexDecision(slug, {
    pageType: config.pageType,
    wordCount: content.wordCount,
    uniquenessScore,
    safetyScore,
    hasDemographicContent: !!config.demographic,
  });

  // Determine cohort based on decision and additional checks
  let cohort: IndexCohort = decision.cohort;

  // Check for manual overrides
  if (existingState?.flags.isManuallyPromoted && cohort === 'public_noindex') {
    cohort = 'indexable_pilot'; // Manual promotion overrides noindex
  }
  if (existingState?.flags.isManuallyDemoted) {
    cohort = 'demoted';
  }

  // Check for answer king status
  if (isAnswerKing(`/guide/${slug}`)) {
    cohort = 'answer_king';
  }

  // Check for validation via GSC data
  if (existingState?.gscData) {
    const { impressions, clicks } = existingState.gscData;
    if (impressions > 100 && clicks > 10 && cohort === 'indexable_pilot') {
      cohort = 'validated';
    }
  }

  // Check for demographic specificity requirement
  if (gates.requireDemographicSpecificity && config.demographic) {
    const hasDemographicContent = checkDemographicSpecificity(config, content);
    if (!hasDemographicContent && cohort !== 'public_noindex') {
      cohort = 'public_noindex';
    }
  }

  // Build state object
  const state: CohortState = {
    slug,
    pageType: config.pageType,
    cohort,
    previousCohort: existingState?.cohort,
    transitionedAt: existingState?.cohort !== cohort ? now : (existingState?.transitionedAt || now),
    evaluatedAt: now,
    scores: {
      demand: demandScore,
      uniqueness: uniquenessScore,
      safety: safetyScore,
      clinical: clinicalScore,
    },
    gscData: existingState?.gscData,
    flags: {
      isAnswerKing: cohort === 'answer_king',
      isManuallyPromoted: existingState?.flags.isManuallyPromoted || false,
      isManuallyDemoted: existingState?.flags.isManuallyDemoted || false,
      requiresReview: cohort === 'public_noindex' && demandScore >= gates.minDemandScore * 0.5,
    },
  };

  // Store state
  cohortStore.set(slug, state);

  return state;
}

// ============ SCORING FUNCTIONS ============

/**
 * Calculate demand score based on page type and entity popularity
 */
function calculateDemandScore(config: DynamicPageConfig): number {
  // Base scores by page type
  const baseScores: Partial<Record<DynamicPageType, number>> = {
    'treatment-for-condition': 100,
    'treatment-vs-treatment': 80,
    'treatment-side-effects': 150,
    'treatment-withdrawal': 60,
    'treatment-dosage': 50,
    'treatment-interactions': 40,
    'condition-symptoms-demographic': 80,
    'condition-treatment-options': 100,
    'condition-natural-remedies': 70,
    'condition-causes': 50,
    'treatment-condition-demographic': 20,
  };

  let score = baseScores[config.pageType] || 10;

  // High-value treatments boost
  const highValueTreatments = [
    'lexapro', 'escitalopram', 'zoloft', 'sertraline', 'prozac', 'fluoxetine',
    'wellbutrin', 'bupropion', 'xanax', 'alprazolam', 'adderall', 'vyvanse',
  ];

  if (config.treatmentSlug) {
    const isHighValue = highValueTreatments.some(t =>
      config.treatmentSlug!.toLowerCase().includes(t)
    );
    if (isHighValue) score *= 2;
  }

  // High-value conditions boost
  const highValueConditions = [
    'anxiety', 'depression', 'adhd', 'bipolar', 'ocd', 'ptsd', 'panic',
  ];

  if (config.conditionSlug) {
    const isHighValue = highValueConditions.some(c =>
      config.conditionSlug!.toLowerCase().includes(c)
    );
    if (isHighValue) score *= 1.5;
  }

  // Demographic modifier
  if (config.demographic) {
    const highValueDemos = ['elderly', 'pregnancy', 'children'];
    const isHighValue = highValueDemos.includes(config.demographic);
    score *= isHighValue ? 1.2 : 0.5;
  }

  return Math.round(score);
}

/**
 * Calculate uniqueness score based on content analysis
 */
function calculateUniquenessScore(
  config: DynamicPageConfig,
  content: GeneratedContent
): number {
  let score = 1.0;

  // Penalize if demographic content is sparse
  if (config.demographic) {
    const demographicMentions = countDemographicMentions(config, content);
    if (demographicMentions < 3) score -= 0.3;
  }

  // Penalize thin content
  if (content.wordCount < 500) {
    score -= 0.4;
  } else if (content.wordCount < 800) {
    score -= 0.2;
  }

  // Penalize generic introductions
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

/**
 * Calculate safety score for YMYL compliance
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
  const requirements: { pattern: RegExp; weight: number }[] = [];

  // Treatment-specific requirements
  if (config.treatmentSlug) {
    requirements.push(
      { pattern: /consult (your |a )?(doctor|physician|healthcare|provider)/i, weight: 0.2 },
      { pattern: /not (a substitute|medical advice|intended to replace)/i, weight: 0.15 },
      { pattern: /individual (results|responses?) (may )?var(y|ies)/i, weight: 0.1 },
      { pattern: /side effects?/i, weight: 0.15 },
      { pattern: /(may|might|can) (cause|experience|have)/i, weight: 0.1 },
    );

    // Extra requirements for controlled substances
    const controlled = ['xanax', 'ativan', 'klonopin', 'adderall', 'vyvanse', 'ritalin'];
    const isControlled = controlled.some(s => config.treatmentSlug!.toLowerCase().includes(s));

    if (isControlled) {
      requirements.push(
        { pattern: /(addiction|dependence|abuse|controlled substance)/i, weight: 0.15 },
        { pattern: /(do not|never).*(stop|discontinue|quit)/i, weight: 0.1 },
      );
    }
  }

  // Check for absolute claims (negative)
  const absolutePhrases = [
    /\bwill cure\b/i,
    /\bguaranteed to\b/i,
    /\balways works\b/i,
    /\bnever fails\b/i,
    /\b100% (effective|safe)\b/i,
  ];

  let absoluteViolations = 0;
  for (const phrase of absolutePhrases) {
    if (phrase.test(allText)) absoluteViolations++;
  }

  // Calculate score
  for (const req of requirements) {
    if (req.pattern.test(allText)) {
      score += req.weight;
    }
  }

  // Penalize absolute claims
  score -= absoluteViolations * 0.2;

  // Base score if no specific requirements
  if (requirements.length === 0) {
    score = 0.8;
  }

  // Boost for appropriate disclaimer level
  if (content.disclaimerLevel === 'elevated' || content.disclaimerLevel === 'critical') {
    score += 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate clinical completeness score
 */
function calculateClinicalScore(
  config: DynamicPageConfig,
  content: GeneratedContent
): number {
  let score = 0;
  let maxScore = 10;

  // Check for key clinical elements
  if (content.keyFacts && content.keyFacts.length >= 3) score += 2;
  if (content.sections.length >= 3) score += 2;
  if (content.faqs.length >= 3) score += 1.5;
  if (content.wordCount >= 800) score += 1.5;
  if (content.comparisonTable) score += 1.5;
  // References are not part of GeneratedContent type - check relatedPages instead
  if (content.relatedPages?.length >= 3) score += 1.5;

  return score / maxScore;
}

/**
 * Check demographic-specific content presence
 */
function checkDemographicSpecificity(
  config: DynamicPageConfig,
  content: GeneratedContent
): boolean {
  if (!config.demographic) return true;

  const mentions = countDemographicMentions(config, content);
  return mentions >= 5; // Require at least 5 mentions for specificity
}

/**
 * Count demographic mentions in content
 */
function countDemographicMentions(
  config: DynamicPageConfig,
  content: GeneratedContent
): number {
  if (!config.demographic) return 0;

  const allText = (
    content.introduction +
    content.sections.map(s => s.content + (s.items?.join(' ') || '')).join(' ') +
    content.faqs.map(f => f.answer).join(' ')
  ).toLowerCase();

  const regex = new RegExp(config.demographic, 'gi');
  return (allText.match(regex) || []).length;
}

// ============ COHORT MANAGEMENT OPERATIONS ============

/**
 * Get current cohort state for a page
 */
export function getCohortState(slug: string): CohortState | undefined {
  return cohortStore.get(slug);
}

/**
 * Manually promote a page to indexable_pilot
 */
export function manuallyPromote(slug: string): void {
  const state = cohortStore.get(slug);
  if (state) {
    state.flags.isManuallyPromoted = true;
    state.flags.isManuallyDemoted = false;
    if (state.cohort === 'public_noindex') {
      state.previousCohort = state.cohort;
      state.cohort = 'indexable_pilot';
      state.transitionedAt = new Date().toISOString();
    }
    cohortStore.set(slug, state);
  }
}

/**
 * Manually demote a page
 */
export function manuallyDemote(slug: string): void {
  const state = cohortStore.get(slug);
  if (state) {
    state.flags.isManuallyDemoted = true;
    state.flags.isManuallyPromoted = false;
    state.previousCohort = state.cohort;
    state.cohort = 'demoted';
    state.transitionedAt = new Date().toISOString();
    cohortStore.set(slug, state);
  }
}

/**
 * Designate a page as answer king for a topic cluster
 */
export function designateAnswerKing(
  slug: string,
  topicCluster: string,
  variants: string[] = []
): void {
  // Register in the central answer king registry
  registerAnswerKing(`/guide/${slug}`, topicCluster, variants.map(v => `/guide/${v}`));

  // Update cohort state
  const state = cohortStore.get(slug);
  if (state) {
    state.flags.isAnswerKing = true;
    state.previousCohort = state.cohort;
    state.cohort = 'answer_king';
    state.transitionedAt = new Date().toISOString();
    cohortStore.set(slug, state);
  }

  // Demote variants to public_noindex (they defer to the king)
  for (const variant of variants) {
    const variantState = cohortStore.get(variant);
    if (variantState && variantState.cohort !== 'public_noindex') {
      variantState.previousCohort = variantState.cohort;
      variantState.cohort = 'public_noindex';
      variantState.transitionedAt = new Date().toISOString();
      cohortStore.set(variant, variantState);
    }
  }
}

/**
 * Update GSC data for a page
 */
export function updateGSCData(
  slug: string,
  gscData: { impressions: number; clicks: number; position: number }
): void {
  const state = cohortStore.get(slug);
  if (state) {
    state.gscData = {
      ...gscData,
      lastFetched: new Date().toISOString(),
    };

    // Auto-promote to validated if thresholds met
    if (
      state.cohort === 'indexable_pilot' &&
      gscData.impressions > 100 &&
      gscData.clicks > 10
    ) {
      state.previousCohort = state.cohort;
      state.cohort = 'validated';
      state.transitionedAt = new Date().toISOString();
    }

    cohortStore.set(slug, state);
  }
}

/**
 * Retire a page
 */
export function retirePage(slug: string): void {
  const state = cohortStore.get(slug);
  if (state) {
    state.previousCohort = state.cohort;
    state.cohort = 'retired';
    state.transitionedAt = new Date().toISOString();
    cohortStore.set(slug, state);
  }
}

// ============ BATCH OPERATIONS ============

/**
 * Get all pages in a specific cohort
 */
export function getPagesByCohort(cohort: IndexCohort): CohortState[] {
  const pages: CohortState[] = [];
  for (const state of cohortStore.values()) {
    if (state.cohort === cohort) {
      pages.push(state);
    }
  }
  return pages;
}

/**
 * Get pages requiring review
 */
export function getPagesRequiringReview(): CohortState[] {
  const pages: CohortState[] = [];
  for (const state of cohortStore.values()) {
    if (state.flags.requiresReview) {
      pages.push(state);
    }
  }
  return pages;
}

/**
 * Get sitemap-eligible pages
 */
export function getSitemapEligiblePages(): CohortState[] {
  const indexableCohorts: IndexCohort[] = ['indexable_pilot', 'validated', 'answer_king'];
  const pages: CohortState[] = [];

  for (const state of cohortStore.values()) {
    if (indexableCohorts.includes(state.cohort)) {
      pages.push(state);
    }
  }

  return pages;
}

/**
 * Get cohort statistics
 */
export function getCohortStats(): {
  total: number;
  byCohort: Record<IndexCohort, number>;
  byPageType: Record<string, number>;
  requiresReview: number;
  sitemapEligible: number;
} {
  const byCohort: Record<IndexCohort, number> = {
    candidate: 0,
    public_noindex: 0,
    indexable_pilot: 0,
    validated: 0,
    answer_king: 0,
    demoted: 0,
    retired: 0,
  };

  const byPageType: Record<string, number> = {};
  let requiresReview = 0;
  let sitemapEligible = 0;

  for (const state of cohortStore.values()) {
    byCohort[state.cohort]++;
    byPageType[state.pageType] = (byPageType[state.pageType] || 0) + 1;

    if (state.flags.requiresReview) requiresReview++;
    if (['indexable_pilot', 'validated', 'answer_king'].includes(state.cohort)) {
      sitemapEligible++;
    }
  }

  return {
    total: cohortStore.size,
    byCohort,
    byPageType,
    requiresReview,
    sitemapEligible,
  };
}

/**
 * Clear all cohort state (for testing)
 */
export function clearCohortStore(): void {
  cohortStore.clear();
}

// ============ EXPORTS ============

export type { GuideQualityGates };

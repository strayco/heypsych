/**
 * SIMILARITY ENGINE
 *
 * Detects content duplication and uniqueness for programmatic pages.
 * This prevents index bloat from near-duplicate content.
 *
 * METHODS:
 * 1. Structural similarity - Compare section headers/structure
 * 2. N-gram fingerprinting - Compare text content patterns
 * 3. Semantic clustering - Group pages by topic (future: embeddings)
 *
 * RULES:
 * - Pages >85% similar to siblings → noindex (defers to canonical)
 * - Pages >70% similar → flag for review
 * - Only the "answer king" for a cluster gets indexed
 */

import type { DynamicPageConfig, DynamicPageType } from './dynamic-generator';
import type { GeneratedContent } from './content-engine';

// ============ TYPES ============

export interface SimilarityResult {
  /** Overall similarity score 0-1 */
  score: number;

  /** Component scores */
  components: {
    structural: number;
    textual: number;
    topical: number;
  };

  /** Detailed breakdown */
  details: {
    sharedSections: string[];
    uniqueSections: string[];
    sharedNgrams: number;
    totalNgrams: number;
    topicOverlap: string[];
  };
}

export interface ContentFingerprint {
  slug: string;
  pageType: DynamicPageType;
  treatmentSlug?: string;
  conditionSlug?: string;
  demographic?: string;

  /** Section headers (normalized) */
  sectionHeaders: string[];

  /** Text fingerprint (normalized n-grams) */
  ngramSet: Set<string>;

  /** Topic identifiers */
  topics: string[];

  /** Word count */
  wordCount: number;

  /** Generated timestamp */
  generatedAt: string;
}

export interface SimilarityCluster {
  id: string;
  topic: string;
  answerKing?: string;
  members: string[];
  averageSimilarity: number;
}

// ============ CONFIGURATION ============

const SIMILARITY_CONFIG = {
  /** N-gram size for fingerprinting */
  ngramSize: 3,

  /** Minimum n-grams to consider for comparison */
  minNgrams: 50,

  /** Threshold above which pages are considered duplicates */
  duplicateThreshold: 0.85,

  /** Threshold above which pages need review */
  reviewThreshold: 0.70,

  /** Weight for each similarity component */
  weights: {
    structural: 0.25,
    textual: 0.50,
    topical: 0.25,
  },
};

// ============ FINGERPRINT STORAGE ============

/**
 * In-memory fingerprint store
 * In production, this would be backed by a database or vector store
 */
const fingerprintStore: Map<string, ContentFingerprint> = new Map();

// ============ FINGERPRINTING ============

/**
 * Generate a content fingerprint for a programmatic page
 */
export function generateFingerprint(
  config: DynamicPageConfig,
  content: GeneratedContent
): ContentFingerprint {
  const now = new Date().toISOString();

  // Extract and normalize section headers
  const sectionHeaders = content.sections
    .map(s => normalizeText(s.heading))
    .filter(Boolean);

  // Generate n-gram set from all text content
  const allText = extractAllText(content);
  const ngramSet = generateNgrams(allText, SIMILARITY_CONFIG.ngramSize);

  // Extract topic identifiers
  const topics = extractTopics(config, content);

  const fingerprint: ContentFingerprint = {
    slug: config.slug,
    pageType: config.pageType,
    treatmentSlug: config.treatmentSlug,
    conditionSlug: config.conditionSlug,
    demographic: config.demographic,
    sectionHeaders,
    ngramSet,
    topics,
    wordCount: content.wordCount,
    generatedAt: now,
  };

  // Store fingerprint
  fingerprintStore.set(config.slug, fingerprint);

  return fingerprint;
}

/**
 * Extract all text content for fingerprinting
 */
function extractAllText(content: GeneratedContent): string {
  const parts: string[] = [];

  parts.push(content.introduction);

  for (const section of content.sections) {
    parts.push(section.heading);
    parts.push(section.content);
    if (section.items) {
      parts.push(section.items.join(' '));
    }
  }

  for (const faq of content.faqs) {
    parts.push(faq.question);
    parts.push(faq.answer);
  }

  if (content.keyFacts) {
    parts.push(content.keyFacts.join(' '));
  }

  return normalizeText(parts.join(' '));
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim();
}

/**
 * Generate n-grams from text
 */
function generateNgrams(text: string, n: number): Set<string> {
  const words = text.split(' ').filter(Boolean);
  const ngrams = new Set<string>();

  for (let i = 0; i <= words.length - n; i++) {
    const ngram = words.slice(i, i + n).join(' ');
    ngrams.add(ngram);
  }

  return ngrams;
}

/**
 * Extract topic identifiers from page config and content
 */
function extractTopics(
  config: DynamicPageConfig,
  content: GeneratedContent
): string[] {
  const topics: string[] = [];

  // Add page type as topic
  topics.push(`type:${config.pageType}`);

  // Add treatment/condition as topics
  if (config.treatmentSlug) {
    topics.push(`treatment:${config.treatmentSlug}`);
  }
  if (config.conditionSlug) {
    topics.push(`condition:${config.conditionSlug}`);
  }
  if (config.demographic) {
    topics.push(`demographic:${config.demographic}`);
  }

  // Extract key terms from content
  const keyTerms = extractKeyTerms(content);
  for (const term of keyTerms) {
    topics.push(`term:${term}`);
  }

  return topics;
}

/**
 * Extract key terms from content (simple TF approach)
 */
function extractKeyTerms(content: GeneratedContent): string[] {
  const allText = extractAllText(content);
  const words = allText.split(' ').filter(w => w.length > 4);

  // Count word frequencies
  const freq: Map<string, number> = new Map();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  // Get top 10 most frequent words
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// ============ SIMILARITY COMPARISON ============

/**
 * Compare two fingerprints for similarity
 */
export function compareFingerprints(
  fp1: ContentFingerprint,
  fp2: ContentFingerprint
): SimilarityResult {
  // Structural similarity (section headers)
  const structural = calculateStructuralSimilarity(
    fp1.sectionHeaders,
    fp2.sectionHeaders
  );

  // Textual similarity (n-gram overlap)
  const textual = calculateTextualSimilarity(fp1.ngramSet, fp2.ngramSet);

  // Topical similarity (topic overlap)
  const topical = calculateTopicalSimilarity(fp1.topics, fp2.topics);

  // Weighted combination
  const score =
    structural * SIMILARITY_CONFIG.weights.structural +
    textual * SIMILARITY_CONFIG.weights.textual +
    topical * SIMILARITY_CONFIG.weights.topical;

  // Calculate details
  const sharedSections = fp1.sectionHeaders.filter(h =>
    fp2.sectionHeaders.includes(h)
  );
  const uniqueSections = [
    ...fp1.sectionHeaders.filter(h => !fp2.sectionHeaders.includes(h)),
    ...fp2.sectionHeaders.filter(h => !fp1.sectionHeaders.includes(h)),
  ];

  const sharedNgrams = countSetIntersection(fp1.ngramSet, fp2.ngramSet);
  const totalNgrams = countSetUnion(fp1.ngramSet, fp2.ngramSet);

  const topicOverlap = fp1.topics.filter(t => fp2.topics.includes(t));

  return {
    score,
    components: {
      structural,
      textual,
      topical,
    },
    details: {
      sharedSections,
      uniqueSections,
      sharedNgrams,
      totalNgrams,
      topicOverlap,
    },
  };
}

/**
 * Calculate structural similarity using Jaccard coefficient
 */
function calculateStructuralSimilarity(
  headers1: string[],
  headers2: string[]
): number {
  if (headers1.length === 0 && headers2.length === 0) return 1;
  if (headers1.length === 0 || headers2.length === 0) return 0;

  const set1 = new Set(headers1);
  const set2 = new Set(headers2);

  const intersection = headers1.filter(h => set2.has(h)).length;
  const union = new Set([...headers1, ...headers2]).size;

  return union > 0 ? intersection / union : 0;
}

/**
 * Calculate textual similarity using Jaccard coefficient on n-grams
 */
function calculateTextualSimilarity(
  ngrams1: Set<string>,
  ngrams2: Set<string>
): number {
  if (ngrams1.size < SIMILARITY_CONFIG.minNgrams ||
      ngrams2.size < SIMILARITY_CONFIG.minNgrams) {
    // Not enough content to compare meaningfully
    return 0.5; // Neutral score
  }

  const intersection = countSetIntersection(ngrams1, ngrams2);
  const union = countSetUnion(ngrams1, ngrams2);

  return union > 0 ? intersection / union : 0;
}

/**
 * Calculate topical similarity
 */
function calculateTopicalSimilarity(
  topics1: string[],
  topics2: string[]
): number {
  if (topics1.length === 0 && topics2.length === 0) return 1;
  if (topics1.length === 0 || topics2.length === 0) return 0;

  const set1 = new Set(topics1);
  const set2 = new Set(topics2);

  const intersection = topics1.filter(t => set2.has(t)).length;
  const union = new Set([...topics1, ...topics2]).size;

  return union > 0 ? intersection / union : 0;
}

/**
 * Count intersection of two sets
 */
function countSetIntersection(set1: Set<string>, set2: Set<string>): number {
  let count = 0;
  for (const item of set1) {
    if (set2.has(item)) count++;
  }
  return count;
}

/**
 * Count union of two sets
 */
function countSetUnion(set1: Set<string>, set2: Set<string>): number {
  return new Set([...set1, ...set2]).size;
}

// ============ SIBLING COMPARISON ============

/**
 * Find siblings for a page (pages that might be similar)
 */
export function findPotentialSiblings(
  config: DynamicPageConfig
): ContentFingerprint[] {
  const siblings: ContentFingerprint[] = [];

  for (const fp of fingerprintStore.values()) {
    if (fp.slug === config.slug) continue; // Skip self

    // Pages are potential siblings if they share:
    // 1. Same page type
    // 2. Same treatment OR same condition
    // 3. Similar topic cluster

    const samePageType = fp.pageType === config.pageType;
    const sameTreatment = config.treatmentSlug &&
      fp.treatmentSlug === config.treatmentSlug;
    const sameCondition = config.conditionSlug &&
      fp.conditionSlug === config.conditionSlug;

    if (samePageType || sameTreatment || sameCondition) {
      siblings.push(fp);
    }
  }

  return siblings;
}

/**
 * Check if a page is too similar to its siblings
 */
export function checkSiblingUniqueness(
  fingerprint: ContentFingerprint
): {
  isUnique: boolean;
  highestSimilarity: number;
  mostSimilarSibling?: string;
  recommendation: 'index' | 'noindex' | 'review';
} {
  const siblings = findPotentialSiblings({
    slug: fingerprint.slug,
    pageType: fingerprint.pageType,
    treatmentSlug: fingerprint.treatmentSlug,
    conditionSlug: fingerprint.conditionSlug,
    demographic: fingerprint.demographic,
    priority: 0,
    searchVolume: 'medium',
  });

  let highestSimilarity = 0;
  let mostSimilarSibling: string | undefined;

  for (const sibling of siblings) {
    const result = compareFingerprints(fingerprint, sibling);

    if (result.score > highestSimilarity) {
      highestSimilarity = result.score;
      mostSimilarSibling = sibling.slug;
    }
  }

  const isUnique = highestSimilarity < SIMILARITY_CONFIG.reviewThreshold;
  let recommendation: 'index' | 'noindex' | 'review' = 'index';

  if (highestSimilarity >= SIMILARITY_CONFIG.duplicateThreshold) {
    recommendation = 'noindex';
  } else if (highestSimilarity >= SIMILARITY_CONFIG.reviewThreshold) {
    recommendation = 'review';
  }

  return {
    isUnique,
    highestSimilarity,
    mostSimilarSibling,
    recommendation,
  };
}

// ============ CLUSTERING ============

/**
 * Build similarity clusters from all fingerprints
 */
export function buildSimilarityClusters(): SimilarityCluster[] {
  const fingerprints = Array.from(fingerprintStore.values());
  const clusters: SimilarityCluster[] = [];
  const assigned = new Set<string>();

  for (const fp of fingerprints) {
    if (assigned.has(fp.slug)) continue;

    // Start a new cluster
    const cluster: SimilarityCluster = {
      id: `cluster-${clusters.length + 1}`,
      topic: inferClusterTopic(fp),
      members: [fp.slug],
      averageSimilarity: 0,
    };

    // Find all similar fingerprints
    let totalSimilarity = 0;
    let comparisons = 0;

    for (const otherFp of fingerprints) {
      if (otherFp.slug === fp.slug || assigned.has(otherFp.slug)) continue;

      const result = compareFingerprints(fp, otherFp);
      if (result.score >= SIMILARITY_CONFIG.reviewThreshold) {
        cluster.members.push(otherFp.slug);
        assigned.add(otherFp.slug);
        totalSimilarity += result.score;
        comparisons++;
      }
    }

    assigned.add(fp.slug);

    if (comparisons > 0) {
      cluster.averageSimilarity = totalSimilarity / comparisons;
    }

    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Infer topic label for a cluster
 */
function inferClusterTopic(fp: ContentFingerprint): string {
  const parts: string[] = [];

  if (fp.treatmentSlug) parts.push(fp.treatmentSlug);
  if (fp.conditionSlug) parts.push(fp.conditionSlug);
  parts.push(fp.pageType.replace(/-/g, ' '));

  return parts.join(' - ');
}

/**
 * Elect an answer king for a cluster
 */
export function electAnswerKing(cluster: SimilarityCluster): string | undefined {
  if (cluster.members.length === 0) return undefined;
  if (cluster.members.length === 1) return cluster.members[0];

  // Score each member
  const scores: Array<{ slug: string; score: number }> = [];

  for (const slug of cluster.members) {
    const fp = fingerprintStore.get(slug);
    if (!fp) continue;

    let score = 0;

    // Prefer longer content
    score += Math.min(fp.wordCount / 1000, 2);

    // Prefer more sections
    score += Math.min(fp.sectionHeaders.length / 5, 1);

    // Prefer non-demographic variants (broader pages)
    if (!fp.demographic) score += 1;

    // Prefer base page types
    const basePriority: Partial<Record<DynamicPageType, number>> = {
      'treatment-for-condition': 3,
      'condition-treatment-options': 3,
      'treatment-side-effects': 2,
      'treatment-vs-treatment': 2,
      'treatment-condition-demographic': 0, // Demographic variants are lower priority
      'condition-symptoms-demographic': 0,
    };

    score += basePriority[fp.pageType] || 1;

    scores.push({ slug, score });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return scores[0]?.slug;
}

// ============ STORE OPERATIONS ============

/**
 * Get a stored fingerprint
 */
export function getFingerprint(slug: string): ContentFingerprint | undefined {
  return fingerprintStore.get(slug);
}

/**
 * Get all fingerprints
 */
export function getAllFingerprints(): ContentFingerprint[] {
  return Array.from(fingerprintStore.values());
}

/**
 * Clear fingerprint store (for testing)
 */
export function clearFingerprintStore(): void {
  fingerprintStore.clear();
}

/**
 * Get store statistics
 */
export function getFingerprintStats(): {
  total: number;
  byPageType: Record<string, number>;
  averageWordCount: number;
  averageNgramCount: number;
} {
  const byPageType: Record<string, number> = {};
  let totalWordCount = 0;
  let totalNgrams = 0;

  for (const fp of fingerprintStore.values()) {
    byPageType[fp.pageType] = (byPageType[fp.pageType] || 0) + 1;
    totalWordCount += fp.wordCount;
    totalNgrams += fp.ngramSet.size;
  }

  const total = fingerprintStore.size;

  return {
    total,
    byPageType,
    averageWordCount: total > 0 ? Math.round(totalWordCount / total) : 0,
    averageNgramCount: total > 0 ? Math.round(totalNgrams / total) : 0,
  };
}

// ============ EXPORTS ============

export { SIMILARITY_CONFIG };

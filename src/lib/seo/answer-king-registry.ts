/**
 * ADVANCED ANSWER KING REGISTRY - NOT IN PRODUCTION USE
 *
 * PRODUCTION STATUS: INACTIVE
 * The simpler Map-based implementation in index-decision-service.ts is used.
 * This module exists for future migration when topic cluster complexity increases.
 *
 * @see index-decision-service.ts for the PRODUCTION answer king implementation
 *
 * Manages canonical authority assignments for topic clusters.
 * Only one page can be the "answer king" for each topic - this prevents
 * internal cannibalization and ensures clear authority signals.
 *
 * RULES:
 * 1. One answer king per topic cluster
 * 2. Variants defer to the king (noindex + canonical)
 * 3. Kings are elected based on content quality, not chronology
 * 4. Kings can be manually overridden by editorial
 * 5. GSC data can trigger re-election (if a variant outperforms)
 *
 * TOPIC CLUSTERS:
 * - Treatment + Condition: "lexapro for anxiety"
 * - Treatment: "lexapro side effects"
 * - Condition: "anxiety symptoms"
 * - Comparison: "lexapro vs zoloft"
 */

import type { RouteFamily } from './index-decision-service';
import type { Entity } from '@/lib/types/database';

// ============ TYPES ============

/**
 * Structured Topic Key
 *
 * Structured topic keys are the PREFERRED way to identify topic clusters.
 * They should be defined in entity data or guide page configs.
 *
 * Format: {type}:{category}:{identifier}
 * Examples:
 *   - condition:anxiety:generalized-anxiety-disorder
 *   - treatment:ssri:escitalopram
 *   - treatment-for-condition:escitalopram:anxiety
 *   - comparison:escitalopram:sertraline
 *
 * Regex-based pattern extraction is only used as a FALLBACK when
 * structured keys are not available.
 */
export interface StructuredTopicKey {
  /** Primary type: condition, treatment, treatment-for-condition, comparison, guide */
  type: 'condition' | 'treatment' | 'treatment-for-condition' | 'comparison' | 'guide' | 'resource';

  /** Category (drug class, condition category, etc.) */
  category?: string;

  /** Primary identifier (slug of the main entity) */
  identifier: string;

  /** Secondary identifier for comparisons or treatment-condition pairs */
  secondaryIdentifier?: string;

  /** Demographic modifier if applicable */
  demographic?: string;
}

/**
 * Build a structured topic key from entity data
 */
export function buildTopicKeyFromEntity(entity: Entity): StructuredTopicKey | null {
  if (!entity.slug) return null;

  // Check for explicit topic key in entity data
  const explicitKey = entity.data?.topicKey || entity.metadata?.topicKey;
  if (explicitKey && isValidStructuredTopicKey(explicitKey)) {
    return explicitKey;
  }

  // Build from entity type and metadata
  switch (entity.type) {
    case 'condition':
      return {
        type: 'condition',
        category: entity.metadata?.category || entity.data?.category,
        identifier: entity.slug,
      };

    case 'medication':
    case 'therapy':
    case 'treatment':
      return {
        type: 'treatment',
        category: entity.data?.drug_classes?.[0] ||
                  entity.metadata?.drug_classes?.[0] ||
                  entity.data?.therapy_type,
        identifier: entity.slug,
      };

    case 'resource':
      return {
        type: 'resource',
        category: entity.metadata?.category || entity.data?.resource_type,
        identifier: entity.slug,
      };

    default:
      return null;
  }
}

/**
 * Validate that a topic key has the required structure
 */
function isValidStructuredTopicKey(key: unknown): key is StructuredTopicKey {
  if (!key || typeof key !== 'object') return false;
  const k = key as Record<string, unknown>;
  return typeof k.type === 'string' &&
         typeof k.identifier === 'string' &&
         ['condition', 'treatment', 'treatment-for-condition', 'comparison', 'guide', 'resource'].includes(k.type);
}

/**
 * Convert structured topic key to cluster ID string
 */
export function topicKeyToClusterId(key: StructuredTopicKey): string {
  const parts: string[] = [key.type];

  if (key.category) {
    parts.push(key.category);
  }

  parts.push(key.identifier);

  if (key.secondaryIdentifier) {
    parts.push(key.secondaryIdentifier);
  }

  if (key.demographic) {
    parts.push(`demographic-${key.demographic}`);
  }

  return parts.join(':');
}

/**
 * Parse cluster ID back to structured topic key (best effort)
 */
export function clusterIdToTopicKey(clusterId: string): StructuredTopicKey | null {
  const parts = clusterId.split(':');
  if (parts.length < 2) return null;

  const type = parts[0] as StructuredTopicKey['type'];
  if (!['condition', 'treatment', 'treatment-for-condition', 'comparison', 'guide', 'resource'].includes(type)) {
    return null;
  }

  // Handle demographic suffix
  let demographic: string | undefined;
  const demographicIndex = parts.findIndex(p => p.startsWith('demographic-'));
  if (demographicIndex !== -1) {
    demographic = parts[demographicIndex].replace('demographic-', '');
    parts.splice(demographicIndex, 1);
  }

  return {
    type,
    category: parts.length > 2 ? parts[1] : undefined,
    identifier: parts.length > 2 ? parts[2] : parts[1],
    secondaryIdentifier: parts.length > 3 ? parts[3] : undefined,
    demographic,
  };
}

export interface AnswerKingEntry {
  /** Canonical path (the answer king) */
  canonicalPath: string;

  /** Topic cluster identifier */
  topicCluster: string;

  /** Human-readable topic label */
  topicLabel: string;

  /** Route family */
  routeFamily: RouteFamily;

  /** Paths that defer to this king */
  variants: string[];

  /** How this king was elected */
  electionMethod: 'auto' | 'manual' | 'gsc_performance';

  /** Confidence score 0-1 */
  confidence: number;

  /** When this was designated */
  designatedAt: string;

  /** When last verified */
  lastVerified: string;

  /** GSC performance data if available */
  gscPerformance?: {
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
    lastFetched: string;
  };

  /** Manual override flag */
  manualOverride: boolean;
}

export interface TopicClusterDefinition {
  id: string;
  pattern: RegExp;
  label: string;
  routeFamily: RouteFamily;
}

// ============ TOPIC CLUSTER PATTERNS ============

/**
 * Define topic cluster patterns for automatic grouping
 */
const TOPIC_CLUSTER_PATTERNS: TopicClusterDefinition[] = [
  // ORDER MATTERS: More specific patterns must come FIRST

  // Comparison clusters (must be before treatment-condition to avoid matching -vs- in treatment name)
  {
    id: 'treatment-vs-treatment-condition',
    pattern: /^\/guide\/([a-z0-9-]+)-vs-([a-z0-9-]+)-for-([a-z0-9-]+)$/,
    label: '{treatment1} vs {treatment2} for {condition}',
    routeFamily: 'guide',
  },
  {
    id: 'treatment-vs-treatment',
    pattern: /^\/guide\/([a-z0-9-]+)-vs-([a-z0-9-]+)$/,
    label: '{treatment1} vs {treatment2}',
    routeFamily: 'guide',
  },

  // Treatment + Condition + Demographic (must be before treatment-condition)
  {
    id: 'treatment-condition-demographic',
    pattern: /^\/guide\/([a-z0-9-]+)-for-([a-z0-9-]+)-in-([a-z-]+)$/,
    label: '{treatment} for {condition} in {demographic}',
    routeFamily: 'guide',
  },

  // Treatment for Condition (base pattern)
  {
    id: 'treatment-condition',
    pattern: /^\/guide\/([a-z0-9-]+)-for-([a-z0-9-]+)$/,
    label: '{treatment} for {condition}',
    routeFamily: 'guide',
  },

  // Treatment-only clusters (specific patterns)
  {
    id: 'treatment-side-effects',
    pattern: /^\/guide\/([a-z0-9-]+)-(?:long-term-)?side-effects$/,
    label: '{treatment} side effects',
    routeFamily: 'guide',
  },
  {
    id: 'treatment-withdrawal',
    pattern: /^\/guide\/(?:how-to-stop-)?([a-z0-9-]+)-(?:withdrawal-symptoms?|safely)$/,
    label: '{treatment} withdrawal',
    routeFamily: 'guide',
  },
  {
    id: 'treatment-drug-interactions',
    pattern: /^\/guide\/([a-z0-9-]+)-drug-interactions$/,
    label: '{treatment} drug interactions',
    routeFamily: 'guide',
  },
  {
    id: 'treatment-alcohol-interactions',
    pattern: /^\/guide\/can-you-drink-alcohol-on-([a-z0-9-]+)$/,
    label: 'can you drink alcohol on {treatment}',
    routeFamily: 'guide',
  },

  // Condition clusters
  {
    id: 'condition-symptoms',
    pattern: /^\/guide\/([a-z0-9-]+)-symptoms(?:-in-([a-z-]+))?$/,
    label: '{condition} symptoms',
    routeFamily: 'guide',
  },
  {
    id: 'condition-treatment-options',
    pattern: /^\/guide\/(?:best-treatment-for-)?([a-z0-9-]+)(?:-treatment-options)?$/,
    label: '{condition} treatment options',
    routeFamily: 'guide',
  },
  {
    id: 'condition-natural-remedies',
    pattern: /^\/guide\/(?:natural|home)-remedies-for-([a-z0-9-]+)$/,
    label: '{condition} natural remedies',
    routeFamily: 'guide',
  },
  {
    id: 'condition-causes',
    pattern: /^\/guide\/what-causes-([a-z0-9-]+)$/,
    label: 'what causes {condition}',
    routeFamily: 'guide',
  },

  // Entity pages
  {
    id: 'treatment-entity',
    pattern: /^\/treatments\/([a-z0-9-]+)$/,
    label: 'treatment: {slug}',
    routeFamily: 'treatments',
  },
  {
    id: 'condition-entity',
    pattern: /^\/conditions\/([a-z0-9-]+)$/,
    label: 'condition: {slug}',
    routeFamily: 'conditions',
  },
];

// ============ REGISTRY STORAGE ============

/**
 * In-memory answer king registry
 * In production, this would be backed by a database
 */
const registry: Map<string, AnswerKingEntry> = new Map();

/**
 * Reverse lookup: path → topic cluster
 */
const pathToCluster: Map<string, string> = new Map();

// ============ TOPIC CLUSTER IDENTIFICATION ============

/**
 * Topic cluster identification result
 */
export interface TopicClusterResult {
  clusterId: string;
  clusterLabel: string;
  routeFamily: RouteFamily;
  captures: string[];
  /** How this cluster was identified */
  identificationMethod: 'structured_key' | 'regex_fallback';
  /** The structured topic key if available */
  structuredKey?: StructuredTopicKey;
}

/**
 * Identify the topic cluster for an entity (PREFERRED METHOD)
 *
 * This uses the entity's structured topic key if available,
 * falling back to path-based regex matching only when necessary.
 */
export function identifyTopicClusterFromEntity(
  entity: Entity,
  pathOverride?: string
): TopicClusterResult | null {
  // STEP 1: Try to build structured topic key from entity
  const structuredKey = buildTopicKeyFromEntity(entity);

  if (structuredKey) {
    const clusterId = topicKeyToClusterId(structuredKey);
    const routeFamily = mapTopicTypeToRouteFamily(structuredKey.type);

    return {
      clusterId,
      clusterLabel: buildLabelFromTopicKey(structuredKey),
      routeFamily,
      captures: extractCapturesFromTopicKey(structuredKey),
      identificationMethod: 'structured_key',
      structuredKey,
    };
  }

  // STEP 2: Fall back to path-based identification
  const path = pathOverride || `/${entity.type}s/${entity.slug}`;
  return identifyTopicCluster(path);
}

/**
 * Map topic key type to route family
 */
function mapTopicTypeToRouteFamily(type: StructuredTopicKey['type']): RouteFamily {
  switch (type) {
    case 'condition': return 'conditions';
    case 'treatment': return 'treatments';
    case 'treatment-for-condition': return 'guide';
    case 'comparison': return 'guide';
    case 'guide': return 'guide';
    case 'resource': return 'resources';
    default: return 'unknown';
  }
}

/**
 * Build human-readable label from topic key
 */
function buildLabelFromTopicKey(key: StructuredTopicKey): string {
  const formatIdentifier = (id: string) => id.replace(/-/g, ' ');

  switch (key.type) {
    case 'condition':
      return `condition: ${formatIdentifier(key.identifier)}`;

    case 'treatment':
      return key.category
        ? `${key.category} treatment: ${formatIdentifier(key.identifier)}`
        : `treatment: ${formatIdentifier(key.identifier)}`;

    case 'treatment-for-condition':
      return `${formatIdentifier(key.identifier)} for ${formatIdentifier(key.secondaryIdentifier || 'conditions')}`;

    case 'comparison':
      return `${formatIdentifier(key.identifier)} vs ${formatIdentifier(key.secondaryIdentifier || 'other')}`;

    case 'guide':
      return `guide: ${formatIdentifier(key.identifier)}`;

    case 'resource':
      return `resource: ${formatIdentifier(key.identifier)}`;

    default:
      return formatIdentifier(key.identifier);
  }
}

/**
 * Extract captures array from topic key (for backwards compatibility)
 */
function extractCapturesFromTopicKey(key: StructuredTopicKey): string[] {
  const captures: string[] = [];

  if (key.category) captures.push(key.category);
  captures.push(key.identifier);
  if (key.secondaryIdentifier) captures.push(key.secondaryIdentifier);
  if (key.demographic) captures.push(key.demographic);

  return captures;
}

/**
 * Identify the topic cluster for a path (FALLBACK METHOD)
 *
 * This uses regex pattern matching and should only be used when
 * structured topic keys are not available.
 */
export function identifyTopicCluster(path: string): TopicClusterResult | null {
  const normalizedPath = path.toLowerCase();

  for (const pattern of TOPIC_CLUSTER_PATTERNS) {
    const match = normalizedPath.match(pattern.pattern);
    if (match) {
      // Extract captures (treatment, condition, demographic, etc.)
      const captures = match.slice(1).filter(Boolean);

      // Build cluster ID from captures
      const clusterId = `${pattern.id}:${captures.join(':')}`;

      // Build label by replacing placeholders
      let label = pattern.label;
      for (let i = 0; i < captures.length; i++) {
        label = label.replace(/\{[^}]+\}/, captures[i]);
      }

      return {
        clusterId,
        clusterLabel: label,
        routeFamily: pattern.routeFamily,
        captures,
        identificationMethod: 'regex_fallback',
      };
    }
  }

  return null;
}

/**
 * Get the base topic cluster (without demographic/modifier variations)
 */
export function getBaseTopicCluster(clusterId: string): string {
  // For demographic clusters like "treatment-condition-demographic:lexapro:anxiety:elderly"
  // Return the base cluster like "treatment-condition:lexapro:anxiety"
  if (clusterId.includes('-demographic:')) {
    // Split into parts
    const parts = clusterId.split(':');
    // Remove "-demographic" from the cluster type (first part) and drop the last segment
    const baseType = parts[0].replace('-demographic', '');
    const captures = parts.slice(1, -1); // Remove the last capture (demographic value)
    return [baseType, ...captures].join(':');
  }

  // For non-demographic clusters, return as-is
  return clusterId;
}

// ============ REGISTRY OPERATIONS ============

/**
 * Register a page as the answer king for a topic cluster
 */
export function registerAnswerKing(
  canonicalPath: string,
  options: {
    variants?: string[];
    electionMethod?: 'auto' | 'manual' | 'gsc_performance';
    confidence?: number;
    gscPerformance?: AnswerKingEntry['gscPerformance'];
  } = {}
): AnswerKingEntry | null {
  // Identify the topic cluster
  const cluster = identifyTopicCluster(canonicalPath);
  if (!cluster) {
    console.warn(`Cannot identify topic cluster for: ${canonicalPath}`);
    return null;
  }

  const now = new Date().toISOString();

  const entry: AnswerKingEntry = {
    canonicalPath,
    topicCluster: cluster.clusterId,
    topicLabel: cluster.clusterLabel,
    routeFamily: cluster.routeFamily,
    variants: options.variants || [],
    electionMethod: options.electionMethod || 'auto',
    confidence: options.confidence || 1.0,
    designatedAt: now,
    lastVerified: now,
    gscPerformance: options.gscPerformance,
    manualOverride: options.electionMethod === 'manual',
  };

  // Store the entry
  registry.set(cluster.clusterId, entry);

  // Update reverse lookups
  pathToCluster.set(canonicalPath, cluster.clusterId);
  for (const variant of entry.variants) {
    pathToCluster.set(variant, cluster.clusterId);
  }

  return entry;
}

/**
 * Add a variant that defers to an existing answer king
 */
export function addVariant(
  variantPath: string,
  answerKingPath: string
): boolean {
  // Find the answer king's cluster
  const clusterId = pathToCluster.get(answerKingPath);
  if (!clusterId) return false;

  const entry = registry.get(clusterId);
  if (!entry) return false;

  // Add the variant if not already present
  if (!entry.variants.includes(variantPath)) {
    entry.variants.push(variantPath);
  }

  // Update reverse lookup
  pathToCluster.set(variantPath, clusterId);

  return true;
}

/**
 * Check if a path is an answer king
 */
export function isAnswerKing(path: string): boolean {
  const clusterId = pathToCluster.get(path);
  if (!clusterId) return false;

  const entry = registry.get(clusterId);
  return entry?.canonicalPath === path;
}

/**
 * Get the answer king for a path (if it defers to one)
 */
export function getAnswerKingFor(path: string): string | undefined {
  const clusterId = pathToCluster.get(path);
  if (!clusterId) return undefined;

  const entry = registry.get(clusterId);
  if (!entry) return undefined;

  // If this path IS the answer king, return undefined
  if (entry.canonicalPath === path) return undefined;

  // Otherwise return the canonical
  return entry.canonicalPath;
}

/**
 * Get the answer king entry for a topic cluster
 */
export function getAnswerKingEntry(topicCluster: string): AnswerKingEntry | undefined {
  return registry.get(topicCluster);
}

/**
 * Get all answer king entries
 */
export function getAllAnswerKings(): AnswerKingEntry[] {
  return Array.from(registry.values());
}

// ============ ELECTION AND RE-ELECTION ============

/**
 * Elect an answer king from a set of candidate paths
 */
export function electAnswerKing(
  candidates: Array<{
    path: string;
    wordCount: number;
    uniquenessScore: number;
    safetyScore: number;
    hasDemographic: boolean;
    gscImpressions?: number;
    gscClicks?: number;
  }>
): string | undefined {
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0].path;

  // Score each candidate
  const scores = candidates.map(c => {
    let score = 0;

    // Content quality (0-4 points)
    score += Math.min(c.wordCount / 500, 2);
    score += c.uniquenessScore * 1;
    score += c.safetyScore * 1;

    // Prefer broader pages (non-demographic) (0-1 points)
    if (!c.hasDemographic) score += 1;

    // GSC performance boost (0-3 points)
    if (c.gscImpressions && c.gscImpressions > 100) {
      score += Math.min(c.gscImpressions / 1000, 1.5);
    }
    if (c.gscClicks && c.gscClicks > 10) {
      score += Math.min(c.gscClicks / 100, 1.5);
    }

    return { path: c.path, score };
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return scores[0]?.path;
}

/**
 * Trigger re-election based on GSC performance data
 */
export function triggerReElection(
  topicCluster: string,
  gscData: Array<{
    path: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  }>
): AnswerKingEntry | null {
  const entry = registry.get(topicCluster);
  if (!entry) return null;

  // Don't re-elect if manually overridden
  if (entry.manualOverride) return entry;

  // Find the best performer
  const allPaths = [entry.canonicalPath, ...entry.variants];
  const pathsWithData = gscData.filter(d => allPaths.includes(d.path));

  if (pathsWithData.length === 0) return entry;

  // Score by CTR and clicks
  const scores = pathsWithData.map(d => ({
    path: d.path,
    score: d.ctr * 100 + d.clicks,
    data: d,
  }));

  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];

  // Only re-elect if significantly better (20% improvement)
  const currentKingData = pathsWithData.find(d => d.path === entry.canonicalPath);
  if (currentKingData) {
    const currentScore = currentKingData.ctr * 100 + currentKingData.clicks;
    if (winner.score < currentScore * 1.2) {
      // Current king is still good enough
      return entry;
    }
  }

  // Re-elect if different
  if (winner.path !== entry.canonicalPath) {
    const newVariants = allPaths.filter(p => p !== winner.path);

    return registerAnswerKing(winner.path, {
      variants: newVariants,
      electionMethod: 'gsc_performance',
      confidence: Math.min((winner.score - (scores[1]?.score || 0)) / 100, 1),
      gscPerformance: {
        impressions: winner.data.impressions,
        clicks: winner.data.clicks,
        ctr: winner.data.ctr,
        position: winner.data.position,
        lastFetched: new Date().toISOString(),
      },
    });
  }

  return entry;
}

// ============ MANUAL OVERRIDES ============

/**
 * Manually designate an answer king (editorial override)
 */
export function manuallyDesignateAnswerKing(
  canonicalPath: string,
  variants: string[] = []
): AnswerKingEntry | null {
  return registerAnswerKing(canonicalPath, {
    variants,
    electionMethod: 'manual',
    confidence: 1.0,
  });
}

/**
 * Remove a manual override (allow re-election)
 */
export function removeManualOverride(topicCluster: string): boolean {
  const entry = registry.get(topicCluster);
  if (!entry) return false;

  entry.manualOverride = false;
  return true;
}

// ============ STATISTICS ============

export interface AnswerKingStats {
  totalClusters: number;
  totalAnswerKings: number;
  totalVariants: number;
  byRouteFamily: Record<RouteFamily, number>;
  byElectionMethod: Record<string, number>;
  averageVariantsPerKing: number;
  clustersNeedingReview: number;
}

/**
 * Get registry statistics
 */
export function getRegistryStats(): AnswerKingStats {
  const byRouteFamily: Record<RouteFamily, number> = {
    conditions: 0,
    treatments: 0,
    resources: 0,
    guide: 0,
    tools: 0,
    hubs: 0,
    static: 0,
    psychiatrists: 0,
    compare: 0,
    search: 0,
    api: 0,
    unknown: 0,
  };

  const byElectionMethod: Record<string, number> = {
    auto: 0,
    manual: 0,
    gsc_performance: 0,
  };

  let totalVariants = 0;
  let lowConfidenceCount = 0;

  for (const entry of registry.values()) {
    byRouteFamily[entry.routeFamily]++;
    byElectionMethod[entry.electionMethod]++;
    totalVariants += entry.variants.length;

    if (entry.confidence < 0.7) lowConfidenceCount++;
  }

  return {
    totalClusters: registry.size,
    totalAnswerKings: registry.size,
    totalVariants,
    byRouteFamily,
    byElectionMethod,
    averageVariantsPerKing: registry.size > 0
      ? Math.round(totalVariants / registry.size * 10) / 10
      : 0,
    clustersNeedingReview: lowConfidenceCount,
  };
}

// ============ PERSISTENCE HELPERS ============

/**
 * Export registry as JSON (for persistence)
 */
export function exportRegistry(): string {
  const entries = Array.from(registry.entries());
  return JSON.stringify(entries, null, 2);
}

/**
 * Import registry from JSON
 */
export function importRegistry(json: string): void {
  try {
    const entries: Array<[string, AnswerKingEntry]> = JSON.parse(json);
    registry.clear();
    pathToCluster.clear();

    for (const [clusterId, entry] of entries) {
      registry.set(clusterId, entry);
      pathToCluster.set(entry.canonicalPath, clusterId);
      for (const variant of entry.variants) {
        pathToCluster.set(variant, clusterId);
      }
    }
  } catch (e) {
    console.error('Failed to import answer king registry:', e);
    throw new Error('Invalid registry JSON');
  }
}

/**
 * Clear registry (for testing)
 */
export function clearRegistry(): void {
  registry.clear();
  pathToCluster.clear();
}

// ============ EXPORTS ============

export { TOPIC_CLUSTER_PATTERNS };

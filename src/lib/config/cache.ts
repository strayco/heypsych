/**
 * Cache Configuration
 *
 * Centralized cache TTL constants for the entire application.
 * Single source of truth for all caching behavior.
 */

/**
 * Cache TTL constants (in milliseconds)
 */
export const CACHE_TTL = {
  /** Entity data cache - 5 minutes */
  ENTITY: 5 * 60 * 1000,

  /** Entity validation cache - 5 minutes */
  ENTITY_VALIDATION: 5 * 60 * 1000,

  /** Internal link extraction cache - 10 minutes */
  LINK_EXTRACTION: 10 * 60 * 1000,

  /** Schema generation cache - 1 hour */
  SCHEMA_GENERATION: 60 * 60 * 1000,

  /** Metadata generation cache - 1 hour */
  METADATA_GENERATION: 60 * 60 * 1000,

  /** Editorial data cache - 1 hour (reviewers, authors) */
  EDITORIAL: 60 * 60 * 1000,

  /** Static content cache - 24 hours */
  STATIC_CONTENT: 24 * 60 * 60 * 1000,

  /** ISR revalidation - 24 hours (in seconds for Next.js) */
  ISR_REVALIDATE: 86400,
} as const;

/**
 * Cache size limits
 */
export const CACHE_LIMITS = {
  /** Maximum entity cache entries */
  MAX_ENTITIES: 1000,

  /** Maximum validation cache entries */
  MAX_VALIDATIONS: 5000,

  /** Maximum link cache entries */
  MAX_LINKS: 10000,
} as const;

/**
 * Cache eviction strategies
 */
export enum CacheEvictionStrategy {
  /** Least Recently Used */
  LRU = 'lru',

  /** Least Frequently Used */
  LFU = 'lfu',

  /** Time To Live */
  TTL = 'ttl',

  /** First In First Out */
  FIFO = 'fifo',
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG = {
  ttl: CACHE_TTL.ENTITY,
  maxSize: CACHE_LIMITS.MAX_ENTITIES,
  evictionStrategy: CacheEvictionStrategy.LRU,
  enableStats: process.env.NODE_ENV === 'development',
} as const;

/**
 * Get cache TTL by name
 *
 * @param cacheName - Name of the cache
 * @returns TTL in milliseconds
 */
export function getCacheTTL(cacheName: keyof typeof CACHE_TTL): number {
  return CACHE_TTL[cacheName];
}

/**
 * Convert milliseconds to human-readable format
 *
 * @param ms - Milliseconds
 * @returns Human-readable string
 */
export function formatCacheTTL(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

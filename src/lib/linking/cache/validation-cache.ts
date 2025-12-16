/**
 * Entity Validation Cache
 *
 * In-memory cache for entity validation results during SSG builds.
 * Implements per-entry TTL and slug-based invalidation.
 */

import type { Entity } from '@/lib/types/database';

interface CachedEntity {
  entity: Entity | null;
  fetchedAt: number;
}

/**
 * Validation cache with per-entry TTL and invalidation support
 */
export class ValidationCache {
  private cache = new Map<string, CachedEntity>();
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached entity if not expired
   *
   * @param key - Cache key (type:slug format)
   * @returns Cached entity, null if not found, or undefined if expired
   */
  get(key: string): Entity | null | undefined {
    const cached = this.cache.get(key);
    if (!cached) return undefined;

    // Per-entry TTL check
    if (Date.now() - cached.fetchedAt > this.DEFAULT_TTL_MS) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.entity;
  }

  /**
   * Set cached entity
   *
   * @param key - Cache key
   * @param entity - Entity to cache (or null if not found)
   */
  set(key: string, entity: Entity | null): void {
    this.cache.set(key, {
      entity,
      fetchedAt: Date.now(),
    });
  }

  /**
   * Invalidate all cache entries for a specific entity slug
   *
   * @param slug - Entity slug to invalidate
   */
  invalidate(slug: string): void {
    for (const [key, _] of this.cache.entries()) {
      // Key format is "type:slug"
      if (key.endsWith(`:${slug}`) || key.includes(`:${slug}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache entries by type
   *
   * @param type - Entity type to invalidate
   */
  invalidateType(type: string): void {
    for (const [key, _] of this.cache.entries()) {
      if (key.startsWith(`${type}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   *
   * @returns Cache stats object
   */
  getStats(): {
    size: number;
    hitRate: number;
    avgAge: number;
  } {
    const now = Date.now();
    let totalAge = 0;

    for (const [_, cached] of this.cache.entries()) {
      totalAge += now - cached.fetchedAt;
    }

    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Track hits/misses if needed
      avgAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
    };
  }
}

/**
 * Generate cache key from entity name and type
 *
 * @param name - Entity name
 * @param type - Entity type
 * @returns Cache key
 */
export function getCacheKey(name: string, type: string): string {
  return `${type}:${name.toLowerCase().trim()}`;
}

/**
 * Singleton validation cache instance
 */
export const validationCache = new ValidationCache();

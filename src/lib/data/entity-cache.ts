/**
 * Request-Level Entity Cache
 *
 * Provides request-scoped memoization for entity fetching to prevent
 * duplicate database queries within a single page render.
 *
 * This is especially important for Next.js pages where:
 * - generateMetadata() fetches an entity for SEO metadata
 * - The page component fetches the same entity for rendering
 *
 * By using React's cache() function, we ensure the entity is only
 * fetched once per request, regardless of how many times it's called.
 *
 * IMPORTANT: This cache is request-scoped, not cross-request.
 * It does not create unbounded in-memory caches.
 *
 * @see src/lib/data/entity-service.ts - The underlying data service
 */

import { cache } from "react";
import { EntityService } from "./entity-service";
import type { Entity } from "@/lib/types/database";

// =============================================================================
// TYPED RESULT FOR ERROR HANDLING
// =============================================================================

/**
 * EntityLookupResult provides explicit status for entity fetching:
 * - "found": Entity was found in database
 * - "not_found": Entity does not exist (confirmed 404)
 * - "unavailable": Database temporarily unavailable (should retry)
 *
 * This prevents caching database errors as permanent 404s.
 */
export type EntityLookupResult =
  | { status: "found"; entity: Entity }
  | { status: "not_found" }
  | { status: "unavailable"; error: unknown };

// =============================================================================
// REQUEST-SCOPED CACHE
// =============================================================================

/**
 * Fetch entity by slug with request-level memoization.
 *
 * Uses React's cache() for deduplication within a single request.
 * This ensures generateMetadata() and the page component share results.
 *
 * @param slug - Entity slug to fetch
 * @returns EntityLookupResult with explicit status
 */
export const getEntityBySlug = cache(
  async (slug: string): Promise<EntityLookupResult> => {
    try {
      const entity = await EntityService.getBySlug(slug);

      if (entity) {
        return { status: "found", entity };
      }

      // No entity found - this is a confirmed 404
      return { status: "not_found" };
    } catch (error) {
      // Database error - could be timeout, connection issue, etc.
      // Do NOT cache this as a 404 - it might be temporary
      console.error(`[EntityCache] Error fetching entity "${slug}":`, error);
      return { status: "unavailable", error };
    }
  }
);

/**
 * Fetch entity by slug, returning null for not found.
 *
 * This is a convenience wrapper that matches the old EntityService.getBySlug signature.
 * Use getEntityBySlug() directly when you need to distinguish not_found from unavailable.
 *
 * @param slug - Entity slug to fetch
 * @returns Entity or null
 */
export const getCachedEntity = cache(
  async (slug: string): Promise<Entity | null> => {
    const result = await getEntityBySlug(slug);
    return result.status === "found" ? result.entity : null;
  }
);

// =============================================================================
// BATCH FETCHING
// =============================================================================

/**
 * Process items with limited concurrency to avoid overwhelming the database.
 */
async function processWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  const queue = [...items];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()!;
      const result = await fn(item);
      results.push(result);
    }
  }

  // Spawn workers up to concurrency limit
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Fetch multiple entities by slug with request-level memoization.
 *
 * Each slug is fetched through the cache, so subsequent calls
 * for the same slug will return the cached result.
 *
 * Uses limited concurrency (5) to prevent overwhelming the database
 * during static generation.
 *
 * @param slugs - Array of entity slugs to fetch
 * @returns Map of slug to EntityLookupResult
 */
export const getEntitiesBySlugs = cache(
  async (slugs: string[]): Promise<Map<string, EntityLookupResult>> => {
    const results = new Map<string, EntityLookupResult>();

    // Use concurrency limit to avoid overwhelming database during build
    const entries = await processWithConcurrency(
      slugs,
      async (slug) => {
        const result = await getEntityBySlug(slug);
        return [slug, result] as const;
      },
      5 // Max 5 concurrent requests
    );

    for (const [slug, result] of entries) {
      results.set(slug, result);
    }

    return results;
  }
);

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard for found entities
 */
export function isEntityFound(
  result: EntityLookupResult
): result is { status: "found"; entity: Entity } {
  return result.status === "found";
}

/**
 * Type guard for not found status
 */
export function isEntityNotFound(
  result: EntityLookupResult
): result is { status: "not_found" } {
  return result.status === "not_found";
}

/**
 * Type guard for unavailable status
 */
export function isEntityUnavailable(
  result: EntityLookupResult
): result is { status: "unavailable"; error: unknown } {
  return result.status === "unavailable";
}

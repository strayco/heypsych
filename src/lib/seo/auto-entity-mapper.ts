/**
 * Automatic Entity Mapping via Wikidata API
 *
 * Automatically finds Wikidata QIDs for entities that don't have manual mappings.
 * Uses fuzzy search with Wikidata's API and caches results for performance.
 */

import type { Entity } from '@/lib/types/database';

// In-memory cache for runtime lookups (cleared on server restart)
const wikidataCache = new Map<string, string | null>();

/**
 * Search Wikidata for an entity and return the most likely QID
 *
 * @param entityName - The name of the entity to search for
 * @param entityType - Type of entity (condition, treatment, resource)
 * @returns Wikidata QID or null if not found
 */
export async function searchWikidataQID(
  entityName: string,
  entityType: 'condition' | 'treatment' | 'resource'
): Promise<string | null> {
  try {
    // Check cache first
    const cacheKey = `${entityType}:${entityName}`;
    if (wikidataCache.has(cacheKey)) {
      return wikidataCache.get(cacheKey) ?? null;
    }

    // Build search query with context based on type
    const searchQuery = buildSearchQuery(entityName, entityType);

    // Search Wikidata API
    const url = new URL('https://www.wikidata.org/w/api.php');
    url.searchParams.set('action', 'wbsearchentities');
    url.searchParams.set('search', searchQuery);
    url.searchParams.set('language', 'en');
    url.searchParams.set('limit', '5');
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'HeyPsych/1.0 (Mental Health Education Platform)',
      },
    });

    if (!response.ok) {
      console.warn(`Wikidata API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Find the best match using heuristics
    const bestMatch = findBestMatch(data.search, entityName, entityType);

    // Cache the result (even if null)
    wikidataCache.set(cacheKey, bestMatch);

    return bestMatch;
  } catch (error) {
    console.error('Error searching Wikidata:', error);
    return null;
  }
}

/**
 * Build optimized search query with context
 */
function buildSearchQuery(entityName: string, entityType: 'condition' | 'treatment' | 'resource'): string {
  // Clean the entity name
  const cleanName = entityName
    .replace(/-v2$/, '')
    .replace(/\.legacy$/, '')
    .replace(/-/g, ' ')
    .replace(/\([^)]*\)/g, '') // Remove parenthetical info for initial search
    .trim();

  // Only add context for conditions, keep treatments/resources simple
  if (entityType === 'condition') {
    return `${cleanName} disorder`;
  }

  return cleanName;
}

/**
 * Find the best matching result from Wikidata search results
 */
function findBestMatch(
  results: any[],
  originalName: string,
  entityType: 'condition' | 'treatment' | 'resource'
): string | null {
  if (!results || results.length === 0) {
    return null;
  }

  // Scoring algorithm to find best match
  const scored = results.map((result: any) => {
    let score = 0;

    // Exact match bonus
    const label = result.label?.toLowerCase() || '';
    const description = result.description?.toLowerCase() || '';
    const searchName = originalName.toLowerCase().replace(/-/g, ' ').replace(/\([^)]*\)/g, '').trim();

    if (label === searchName) {
      score += 100;
    } else if (label.includes(searchName) || searchName.includes(label)) {
      score += 50;
    }

    // Partial word matching (for acronyms and abbreviations)
    const searchWords = searchName.split(' ').filter(w => w.length > 2);
    const labelWords = label.split(' ');
    const matchingWords = searchWords.filter(w => labelWords.some(lw => lw.includes(w)));
    score += matchingWords.length * 15;

    // Description keyword matching
    const keywords = {
      condition: ['disorder', 'disease', 'syndrome', 'mental', 'psychiatric', 'condition'],
      treatment: ['medication', 'therapy', 'treatment', 'drug', 'antidepressant', 'antipsychotic', 'medicine', 'pharmaceutical'],
      resource: ['organization', 'service', 'helpline', 'app', 'hotline', 'foundation'],
    }[entityType];

    for (const keyword of keywords) {
      if (description.includes(keyword)) {
        score += 10;
      }
    }

    return { ...result, score };
  });

  // Sort by score and return top result
  scored.sort((a, b) => b.score - a.score);

  // Lower threshold to 30 for more matches (was 50)
  return scored[0].score > 30 ? scored[0].id : null;
}

/**
 * Get Wikidata QID for an entity with automatic fallback
 *
 * Priority:
 * 1. Entity metadata (wikidata_qid field)
 * 2. Hardcoded mapping (knowledge-graph-mapper.ts)
 * 3. Automatic Wikidata search (cached)
 *
 * @param entity - The entity to map
 * @param hardcodedMap - The hardcoded mapping object
 * @returns Wikidata QID or null
 */
export async function getWikidataQID(
  entity: Entity,
  hardcodedMap: Record<string, string>,
  entityType: 'condition' | 'treatment' | 'resource'
): Promise<string | null> {
  // 1. Check entity metadata first (highest priority)
  const metadataQID = entity.metadata?.wikidata_qid;
  if (metadataQID && /^Q\d+$/.test(metadataQID)) {
    return metadataQID;
  }

  // 2. Check hardcoded mapping (second priority)
  const hardcodedQID = hardcodedMap[entity.slug];
  if (hardcodedQID) {
    return hardcodedQID;
  }

  // 3. Automatic search as fallback (third priority)
  // Only use in development/staging to avoid API rate limits in production
  if (process.env.ENABLE_AUTO_WIKIDATA_MAPPING === 'true') {
    const autoQID = await searchWikidataQID(entity.name, entityType);
    return autoQID;
  }

  return null;
}

/**
 * Clear the in-memory cache (useful for testing)
 */
export function clearWikidataCache(): void {
  wikidataCache.clear();
}

/**
 * Get cache statistics
 */
export function getWikidataCacheStats(): {
  size: number;
  entries: Array<{ key: string; qid: string | null }>;
} {
  return {
    size: wikidataCache.size,
    entries: Array.from(wikidataCache.entries()).map(([key, qid]) => ({ key, qid })),
  };
}

/**
 * Link Extraction Utilities
 *
 * Helper functions for link extraction, matching, and manipulation.
 */

import type { Entity, EntityType } from '@/lib/types/database';
import type { CandidateLink } from './types';

/**
 * Parse {link:type:slug} syntax from content
 * Returns null if not valid link syntax
 */
export function parseLinkSyntax(text: string): {
  type: string;
  slug: string;
  text: string | null;
} | null {
  const linkRegex = /\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/;
  const match = text.match(linkRegex);

  if (!match) return null;

  return {
    type: match[1],
    slug: match[2],
    text: match[3] || null,
  };
}

/**
 * Clean link syntax from text, leaving just the display text
 */
export function cleanLinkSyntax(text: string): string {
  return text.replace(/\{link:[^:}]+:([^:}]+)(?::([^}]+))?\}/g, (_, slug, displayText) => {
    return displayText || slug.replace(/-/g, ' ');
  });
}

/**
 * Convert text to slug format
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Match entity by name (fuzzy matching)
 * Tries exact match first, then normalized match, then partial match
 */
export function matchEntityByName(
  name: string,
  entities: Entity[],
  allowedTypes: EntityType[] = []
): Entity | null {
  if (!name || entities.length === 0) return null;

  // Filter by allowed types if specified
  const candidateEntities =
    allowedTypes.length > 0
      ? entities.filter((e) => allowedTypes.includes(e.type as EntityType))
      : entities;

  if (candidateEntities.length === 0) return null;

  // Remove link syntax if present
  const cleanName = cleanLinkSyntax(name);
  const normalized = normalizeForMatching(cleanName);

  // Try exact match (case-insensitive)
  for (const entity of candidateEntities) {
    if (entity.name.toLowerCase() === cleanName.toLowerCase()) {
      return entity;
    }
  }

  // Try normalized match
  for (const entity of candidateEntities) {
    if (normalizeForMatching(entity.name) === normalized) {
      return entity;
    }
  }

  // Try slug match
  const slug = slugify(cleanName);
  for (const entity of candidateEntities) {
    if (entity.slug === slug) {
      return entity;
    }
  }

  // Try abbreviation match
  for (const entity of candidateEntities) {
    const abbrev = entity.data?.abbreviation || entity.metadata?.abbreviation;
    if (abbrev && abbrev.toLowerCase() === cleanName.toLowerCase()) {
      return entity;
    }
  }

  // Try alternative names
  for (const entity of candidateEntities) {
    const altNames = entity.data?.alternative_names || [];
    for (const altName of altNames) {
      if (
        typeof altName === 'string' &&
        normalizeForMatching(altName) === normalized
      ) {
        return entity;
      }
    }
  }

  // Try partial match (starts with)
  for (const entity of candidateEntities) {
    if (normalizeForMatching(entity.name).startsWith(normalized)) {
      return entity;
    }
  }

  return null;
}

/**
 * Normalize text for matching (remove punctuation, extra spaces, etc.)
 */
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match entity by slug
 */
export function matchEntityBySlug(slug: string, entities: Entity[]): Entity | null {
  return entities.find((e) => e.slug === slug) || null;
}

/**
 * Check if two links are duplicates
 * Same source, target, and link type
 */
export function isDuplicateLink(link1: CandidateLink, link2: CandidateLink): boolean {
  return (
    link1.sourceId === link2.sourceId &&
    link1.targetId === link2.targetId &&
    link1.linkType === link2.linkType
  );
}

/**
 * De-duplicate array of candidate links
 * Keeps the higher priority link when duplicates found
 */
export function deduplicateLinks(links: CandidateLink[]): CandidateLink[] {
  const seen = new Map<string, CandidateLink>();
  const priorityOrder: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  for (const link of links) {
    const key = `${link.sourceId}:${link.targetId}:${link.linkType}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, link);
    } else {
      // Keep higher priority link
      const existingPriority = priorityOrder[existing.priority] || 0;
      const currentPriority = priorityOrder[link.priority] || 0;

      if (currentPriority > existingPriority) {
        seen.set(key, link);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Sort links by priority
 */
export function sortLinksByPriority(links: CandidateLink[]): CandidateLink[] {
  const priorityOrder: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return links.sort((a, b) => {
    const aPriority = priorityOrder[a.priority] || 0;
    const bPriority = priorityOrder[b.priority] || 0;
    return bPriority - aPriority; // Descending order
  });
}

/**
 * Filter links to stay within limits
 * Keeps highest priority links
 */
export function filterLinksToLimit(
  links: CandidateLink[],
  maxLinks: number
): CandidateLink[] {
  if (links.length <= maxLinks) return links;

  const sorted = sortLinksByPriority(links);
  return sorted.slice(0, maxLinks);
}

/**
 * Extract drug class from medication entity
 */
export function extractDrugClass(entity: Entity): string | null {
  if (entity.type !== 'medication' && entity.type !== 'treatment') return null;

  return (
    entity.data?.drug_class ||
    entity.data?.medication_class ||
    entity.clinical_metadata?.drug_class ||
    null
  );
}

/**
 * Extract therapy modality from therapy entity
 */
export function extractTherapyModality(entity: Entity): string | null {
  if (entity.type !== 'therapy' && entity.type !== 'treatment') return null;

  return (
    entity.data?.modality ||
    entity.data?.therapy_type ||
    entity.data?.category ||
    null
  );
}

/**
 * Check if entity has sufficient data for linking
 */
export function hasMinimumLinkableData(entity: Entity): boolean {
  return !!(entity.id && entity.slug && entity.name);
}

/**
 * Generate unique link ID for deduplication
 */
export function generateLinkId(link: CandidateLink): string {
  return `${link.sourceId}:${link.targetId}:${link.linkType}:${link.context}`;
}

/**
 * Validate candidate link
 */
export function validateCandidateLink(link: CandidateLink): boolean {
  // Basic validation
  if (!link.sourceId || !link.targetSlug || !link.linkType) return false;

  // No self-links
  if (link.sourceSlug === link.targetSlug) return false;

  // Must have at least one anchor option
  if (!link.anchorOptions || link.anchorOptions.length === 0) return false;

  return true;
}

/**
 * Extract all {link:} references from text
 */
export function extractAllLinkReferences(text: string): Array<{
  type: string;
  slug: string;
  text: string | null;
}> {
  const linkRegex = /\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/g;
  const references: Array<{ type: string; slug: string; text: string | null }> = [];
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    references.push({
      type: match[1],
      slug: match[2],
      text: match[3] || null,
    });
  }

  return references;
}

/**
 * Count links by type
 */
export function countLinksByType(links: CandidateLink[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const link of links) {
    counts[link.linkType] = (counts[link.linkType] || 0) + 1;
  }

  return counts;
}

/**
 * Count links by priority
 */
export function countLinksByPriority(links: CandidateLink[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const link of links) {
    counts[link.priority] = (counts[link.priority] || 0) + 1;
  }

  return counts;
}

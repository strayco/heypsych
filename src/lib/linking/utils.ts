/**
 * Link Extraction Utilities
 *
 * Helper functions for link extraction, matching, and manipulation.
 */

import type { Entity, EntityType } from '@/lib/types/database';
import type { CandidateLink, LinkType, LinkPriority } from './types';

/**
 * Parse {link:type:slug} syntax from content
 * Returns null if not valid link syntax
 */
export function parseLinkSyntax(text: string): {
  type: string;
  slug: string;
  text: string | null;
} | null {
  // Full format: {link:type:slug:text} or {link:type:slug}
  const fullLinkRegex = /\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/;
  const fullMatch = text.match(fullLinkRegex);

  if (fullMatch) {
    return {
      type: fullMatch[1],
      slug: fullMatch[2],
      text: fullMatch[3] || null,
    };
  }
  
  // Simple format: {link:slug} - assume condition type
  const simpleLinkRegex = /\{link:([^:}]+)\}/;
  const simpleMatch = text.match(simpleLinkRegex);
  
  if (simpleMatch) {
    return {
      type: 'condition', // Default to condition for simple format
      slug: simpleMatch[1],
      text: null,
    };
  }

  return null;
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
 * Normalize condition name by removing abbreviations in parentheses
 * Example: "Obsessive-Compulsive Disorder (OCD)" -> "Obsessive-Compulsive Disorder"
 */
export function normalizeConditionName(text: string): string {
  return text.replace(/\s*\([^)]+\)\s*/g, '').trim();
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
    entity.metadata?.clinical?.drug_class ||
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

/**
 * Parse medication/treatment list strings to extract individual entity names
 * Handles formats like:
 * - "First-line antidepressants: SSRIs (sertraline, escitalopram, fluoxetine)"
 * - "sertraline, escitalopram, fluoxetine"
 * - "Bupropion — energizing, fewer sexual side effects"
 * - "Cognitive Behavioral Therapy (CBT) — description"
 * - "Cognitive Behavioral Therapy"
 * - "Stimulants: Methylphenidate (Concerta), Mixed Amphetamine Salts (Adderall)"
 * - "Non-stimulants: Atomoxetine (Strattera), Guanfacine, Clonidine"
 * - "Antidepressants: Bupropion in select cases"
 */
export function parseEntityNames(text: string): string[] {
  if (!text) return [];

  const names: string[] = [];

  // Remove common prefixes/descriptions (including medication class prefixes)
  // Handle both formats: "Stimulants: ..." and "Stimulants (...)"
  let cleaned = text
    .replace(/^(First-line|Second-line|Third-line)[:\s]+/i, '')
    .trim();

  // Check if it starts with a medication class prefix followed by colon or parenthesis
  // Examples: "Stimulants: ..." or "Stimulants (...)"
  let contentToParse = cleaned;
  // Match medication class prefixes - strip these to get to the actual medication names
  // Examples: "Stimulants: ...", "FDA-approved for irritability: ...", "ADHD symptoms: ..."
  const classPrefixMatch = cleaned.match(/^(Stimulants?|Non-stimulants?|Antidepressants?|SSRIs?|SNRIs?|TCAs?|MAOIs?|FDA-approved[^:]*|ADHD symptoms?|Anxiety[^:]*|Mood[^:]*|medications?|therapies?|treatments?)\s*([:\(])/i);
  
  if (classPrefixMatch) {
    const prefix = classPrefixMatch[1];
    const separator = classPrefixMatch[2];
    
    if (separator === ':') {
      // Format: "Stimulants: ..." - extract everything after colon
      contentToParse = cleaned.substring(cleaned.indexOf(':') + 1).trim();
    } else if (separator === '(') {
      // Format: "Stimulants (...)" - extract content inside outer parentheses
      // Find the matching closing parenthesis
      let depth = 0;
      let startIndex = cleaned.indexOf('(');
      let endIndex = -1;
      
      for (let i = startIndex; i < cleaned.length; i++) {
        if (cleaned[i] === '(') depth++;
        else if (cleaned[i] === ')') {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }
      
      if (endIndex > startIndex) {
        contentToParse = cleaned.substring(startIndex + 1, endIndex).trim();
      } else {
        // Fallback: remove prefix and opening paren
        contentToParse = cleaned.replace(/^(Stimulants?|Non-stimulants?|Antidepressants?|SSRIs?|SNRIs?|TCAs?|MAOIs?|medications?|therapies?|treatments?)\s*\(/i, '').trim();
        contentToParse = contentToParse.replace(/\)\s*$/, '').trim();
      }
    }
  }

  // SPECIAL CASE: Therapy names with abbreviations
  // "Cognitive Behavioral Therapy (CBT) — description"
  // Extract BOTH the full name AND the abbreviation for better matching
  const therapyNameMatch = contentToParse.match(/^([A-Z][a-z]+(?:\s+(?:and|&|or|for|with|Based|Focused)\s+)?(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*))\s*\(([A-Z-]+)\)\s*[—–-]/);
  if (therapyNameMatch) {
    const fullName = therapyNameMatch[1].trim();
    const abbreviation = therapyNameMatch[2].trim();
    // Add both full name and abbreviation for matching
    names.push(fullName);
    names.push(abbreviation);
    return names; // Return early - this is a single therapy description
  }
  
  // Now parse the content, handling nested parentheses and comma-separated lists
  // Split by commas, but respect nested parentheses
  const entries: string[] = [];
  let current = '';
  let depth = 0;
  
  for (let i = 0; i < contentToParse.length; i++) {
    const char = contentToParse[i];
    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      entries.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    entries.push(current.trim());
  }
  
  // If no commas found but there's content, treat the whole thing as one entry
  if (entries.length === 0 && contentToParse.trim()) {
    entries.push(contentToParse.trim());
  }
  
  // Process each entry
  for (const entry of entries) {
    const trimmed = entry.trim();
    
    // Handle nested parentheses: "Methylphenidate ER (Concerta)" or "Mixed Amphetamine Salts (Adderall)"
    // IMPORTANT: Only extract the brand name inside parentheses, NOT the generic class name before it
    // Generic class names like "Methylphenidate ER" and "Mixed Amphetamine Salts" should NOT be linked
    if (trimmed.includes('(') && trimmed.includes(')')) {
      const nestedMatch = trimmed.match(/^(.+?)\s*\(([^)]+)\)/);
      if (nestedMatch) {
        const beforeParen = nestedMatch[1].trim();
        const insideParen = nestedMatch[2].trim();
        
        // Check if the name before parentheses is a drug FORMULATION or CLASS (not a generic drug name)
        // Formulations like "Mixed Amphetamine Salts" or "Methylphenidate ER" should NOT be linked
        // But generic drug names like "Atomoxetine", "Guanfacine" SHOULD be linked
        const beforeParenLower = beforeParen.toLowerCase();
        const isFormulationOrClass = 
          beforeParenLower.includes('salts') ||           // "Mixed Amphetamine Salts" = formulation
          beforeParenLower.includes(' er') ||              // "Methylphenidate ER" = extended release formulation
          beforeParenLower.includes(' extended release') ||
          beforeParenLower.includes(' xr') ||              // Extended release
          beforeParenLower.includes(' ir') ||              // Immediate release
          beforeParenLower.match(/^(ssri|snri|tca|maoi|stimulant|antidepressant|antipsychotic|anxiolytic)/i);
        
        // Add the brand name inside parentheses
        if (insideParen && insideParen.length > 2) {
          names.push(insideParen);
        }
        
        // Also add the generic drug name if it's NOT a formulation/class
        // "Atomoxetine" → add it (it's the generic name for Strattera)
        // "Mixed Amphetamine Salts" → skip it (it's a formulation, not a drug name)
        if (!isFormulationOrClass && beforeParen && beforeParen.length > 2) {
          names.push(beforeParen);
        }
      } else {
        // Fallback: remove parentheses and use the remaining text
        const cleanEntry = trimmed.replace(/\([^)]*\)/g, '').trim();
        if (cleanEntry && cleanEntry.length > 2) {
          names.push(cleanEntry);
        }
      }
    } else {
      // Simple name without parentheses (e.g., "Guanfacine", "Clonidine", "Bupropion")
      // Remove trailing descriptive text like "in select cases"
      let cleanName = trimmed
        .replace(/\s+in\s+select\s+cases.*$/i, '')
        .replace(/\s+—.*$/, '')
        .replace(/\s+–.*$/, '')
        .replace(/\s+-.*$/, '')
        .replace(/[.,;:]+$/, '')
        .trim();
      
      if (cleanName && cleanName.length > 2) {
        names.push(cleanName);
      }
    }
  }

  // Split remaining text by commas, semicolons, or "and"
  if (cleaned) {
    const splitNames = cleaned
      .split(/[,;]|\s+and\s+/i)
      .map((name) => {
        name = name.trim();

        // For prose items like "Bupropion — energizing, fewer side effects",
        // extract just the medication name (first word or multi-word phrase before punctuation)
        // Stop at: —, –, -, (, [, or other descriptive separators
        const proseMatch = name.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[—–\-\(\[]/);
        if (proseMatch) {
          return proseMatch[1].trim();
        }

        // Also handle formats like "nortriptyline) and MAOIs" - remove trailing punctuation
        name = name.replace(/[)\]]+.*$/, '').trim();
        name = name.replace(/[.,;:]+$/, '').trim();

        return name;
      })
      .filter((name) => {
        // Filter out empty, too short, or generic terms
        if (!name || name.length < 3) return false;
        const lower = name.toLowerCase();
        // Skip generic class names
        if (['ssri', 'ssris', 'snri', 'snris', 'tca', 'tcas', 'maoi', 'maois', 
             'stimulants', 'non-stimulants', 'non'].includes(lower)) {
          return false;
        }
        // Skip common prose words that aren't entity names
        const skipWords = ['e.g.', 'i.e.', 'etc.', 'helpful for', 'effective but', 'energizing', 'consider if', 'monitor'];
        if (skipWords.some(word => lower.includes(word))) {
          return false;
        }
        return true;
      });

    names.push(...splitNames);
  }

  // Deduplicate and return
  return [...new Set(names.filter(name => name && name.length > 2))];
}

// In-memory cache for entity validation during static generation
// Prevents redundant database calls for the same entity name
const validationCache = new Map<string, Entity | null>();
// Longer cache during build for performance, shorter during runtime for freshness
const CACHE_TTL_MS = process.env.NEXT_PHASE === 'phase-production-build' ? 600000 : 60000; // 10 min build, 1 min runtime
let lastCacheClear = Date.now();

function getCacheKey(name: string, type: EntityType): string {
  return `${type}:${name.toLowerCase().trim()}`;
}

function checkAndClearCache(): void {
  const now = Date.now();
  if (now - lastCacheClear > CACHE_TTL_MS) {
    validationCache.clear();
    lastCacheClear = now;
  }
}

// Global entity cache for build-time performance
// Stores all entities by type to reduce database queries during validation
let globalEntityCache: Map<EntityType, Entity[]> | null = null;
let globalCacheInitialized = false;

/**
 * Pre-warm the global entity cache with all entities
 * Called once at the start of build to reduce database queries
 */
async function ensureGlobalCache(): Promise<void> {
  if (globalCacheInitialized && globalEntityCache) return;

  // Only initialize during build, not runtime
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  if (!isBuild) return;

  try {
    const { EntityService } = await import('@/lib/data/entity-service');
    const allEntities = await EntityService.getAll();

    // Group entities by type for faster lookups
    globalEntityCache = new Map();
    const entityTypes: EntityType[] = ['condition', 'medication', 'therapy', 'treatment', 'resource'];

    for (const type of entityTypes) {
      const entitiesOfType = allEntities.filter(e => e.type === type);
      globalEntityCache.set(type, entitiesOfType);
    }

    globalCacheInitialized = true;
    console.log(`✅ Pre-warmed entity cache with ${allEntities.length} entities`);
  } catch (error) {
    console.error('Failed to pre-warm global entity cache:', error);
    // Continue without cache - will fall back to individual queries
  }
}

/**
 * Validate that an entity exists by querying the database
 * Returns the entity if found, null otherwise
 * Uses smart matching strategies to handle:
 * - Generic names → brand combinations (sertraline → sertraline-zoloft)
 * - Abbreviations (CBT → cognitive-behavioral-therapy)
 * - Partial matches with word boundaries
 * 
 * PERFORMANCE: Results are cached in-memory during static generation
 */
export async function validateEntityExists(
  name: string,
  type: EntityType
): Promise<Entity | null> {
  // Check cache first
  checkAndClearCache();
  const cacheKey = getCacheKey(name, type);
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey) || null;
  }

  // Ensure global cache is initialized (build-time only)
  await ensureGlobalCache();

  // If global cache available, search it first (much faster than DB queries)
  if (globalEntityCache) {
    const entitiesOfType = globalEntityCache.get(type) || [];
    const baseSlug = slugify(name);
    const lowerName = name.toLowerCase().trim();

    // Try exact slug match first
    let match = entitiesOfType.find(e => e.slug === baseSlug);
    if (match) {
      validationCache.set(cacheKey, match);
      return match;
    }

    // Try slug prefix match (e.g., "fluoxetine" → "fluoxetine-prozac")
    match = entitiesOfType.find(e => e.slug.startsWith(`${baseSlug}-`));
    if (match) {
      validationCache.set(cacheKey, match);
      return match;
    }

    // Try slug suffix match (e.g., "prozac" → "fluoxetine-prozac")
    match = entitiesOfType.find(e => e.slug.endsWith(`-${baseSlug}`));
    if (match) {
      validationCache.set(cacheKey, match);
      return match;
    }

    // Try abbreviation match
    if (lowerName.length <= 10) {
      match = entitiesOfType.find(e => {
        const abbrev = e.data?.abbreviation || e.metadata?.abbreviation;
        return abbrev && abbrev.toLowerCase() === lowerName;
      });
      if (match) {
        validationCache.set(cacheKey, match);
        return match;
      }
    }

    // Try name match
    match = entitiesOfType.find(e => e.name.toLowerCase() === lowerName);
    if (match) {
      validationCache.set(cacheKey, match);
      return match;
    }

    // If no match in global cache, cache negative result and return
    validationCache.set(cacheKey, null);
    return null;
  }

  // Import dependencies dynamically to avoid circular deps
  const { EntityService } = await import('@/lib/data/entity-service');

  const baseSlug = slugify(name);
  const lowerName = name.toLowerCase().trim();

  // STRICT BLACKLIST: Reject generic words that should NEVER be linked
  // These are too vague and would create incorrect/misleading links
  const genericWordBlacklist = new Set([
    // General mental health terms
    'anxiety', 'depression', 'mood', 'stress', 'pain', 'sleep',
    'treatment', 'therapy', 'medication', 'disorder', 'condition',
    'mental', 'health', 'care', 'symptom', 'symptoms', 'test',
    'screening', 'assessment', 'scale', 'questionnaire', 'tool',
    
    // Additional generic terms
    'drug', 'drugs', 'medicine', 'medicines', 'pill', 'pills',
    'effect', 'effects', 'side', 'dose', 'dosage', 'dosing',
    'feeling', 'feelings', 'thought', 'thoughts', 'behavior', 'behaviors',
    'problem', 'problems', 'issue', 'issues', 'concern', 'concerns',
    
    // Descriptive/action words
    'start', 'stop', 'use', 'using', 'take', 'taking', 'watch',
    'monitor', 'check', 'track', 'manage', 'help', 'support',
    'improve', 'reduce', 'increase', 'decrease', 'change', 'changes',
    
    // Body/experience terms
    'brain', 'body', 'mind', 'physical', 'emotional', 'cognitive',
    'memory', 'concentration', 'focus', 'attention', 'energy',
    'appetite', 'weight', 'fatigue', 'tired', 'exhaustion',
    
    // Process terms
    'diagnosis', 'evaluation', 'criteria', 'guidelines', 'approach',
    'intervention', 'psychotherapy', 'counseling', 'coaching',
    
    // Severity/quality terms
    'mild', 'moderate', 'severe', 'acute', 'chronic', 'persistent',
    'recurrent', 'remission', 'relapse', 'recovery', 'response',
    
    // People/roles
    'patient', 'patients', 'doctor', 'therapist', 'psychiatrist',
    'provider', 'clinician', 'specialist', 'professional',
  ]);

  // Reject if name is a generic word (unless it's part of a longer specific phrase)
  const wordCount = lowerName.split(/\s+/).length;
  if (wordCount === 1 && genericWordBlacklist.has(lowerName)) {
    return null;
  }
  
  // Also reject two-word phrases that are too generic
  const genericPhrases = new Set([
    'side effects', 'drug interactions', 'black box', 'first line',
    'second line', 'off label', 'as needed', 'long term', 'short term',
    'mental health', 'substance use', 'substance abuse', 'mood disorder',
    'anxiety disorder', 'depressive disorder', 'personality disorder',
  ]);
  
  if (wordCount === 2 && genericPhrases.has(lowerName)) {
    return null;
  }

  // BLACKLIST: Drug FORMULATIONS and CLASS names that should NOT be linked
  // These are NOT specific medications - only the brand name inside parens should be linked
  // Examples: "Mixed Amphetamine Salts (Adderall)" → only link "Adderall"
  //           "Methylphenidate ER (Concerta)" → only link "Concerta"
  // But NOT: "Atomoxetine (Strattera)" → Atomoxetine IS Strattera, link the whole thing
  const drugFormulationsToSkip = [
    // Formulations
    'mixed amphetamine salts',
    'amphetamine salts',
    'amphetamine mixed salts',
    'methylphenidate er',
    'methylphenidate extended release',
    'methylphenidate xr',
    'methylphenidate ir',
    
    // Generic class names
    'ssri', 'ssris',
    'snri', 'snris', 
    'tca', 'tcas',
    'maoi', 'maois',
    'ndri', 'ndris',
    'nri', 'nris',
    'benzodiazepine', 'benzodiazepines', 'benzo', 'benzos',
    'antidepressant', 'antidepressants',
    'antipsychotic', 'antipsychotics',
    'anxiolytic', 'anxiolytics',
    'stimulant', 'stimulants',
    'non-stimulant', 'non-stimulants', 'nonstimulant', 'nonstimulants',
    'mood stabilizer', 'mood stabilizers',
    'anticonvulsant', 'anticonvulsants',
    'sedative', 'sedatives',
    'hypnotic', 'hypnotics',
    'neuroleptic', 'neuroleptics',
    
    // Other formulation patterns
    'extended release', 'immediate release',
    'controlled release', 'sustained release',
    'oral solution', 'oral concentrate',
    'injectable', 'injection',
    'transdermal', 'patch',
  ];
  
  if (drugFormulationsToSkip.some(cls => lowerName === cls || lowerName.startsWith(cls + ' '))) {
    return null;
  }

  // Run first 3 strategies in parallel for better performance
  const { supabase } = await import('@/lib/config/database');
  
  const strategyPromises: Promise<Entity | null>[] = [
    // Strategy 1: Exact slug match
    EntityService.getBySlug(baseSlug).then(
      entity => (entity && entity.type === type ? entity : null),
      () => null
    ),
    
    // Strategy 2: Slug starts with base slug (handles generic → brand combinations)
    // Example: "fluoxetine" → "fluoxetine-prozac"
    Promise.resolve(
      supabase
        .from('entities')
        .select('slug')
        .eq('type', type)
        .eq('status', 'active')
        .ilike('slug', `${baseSlug}-%`)
        .order('slug')
        .limit(1)
        .then(async ({ data: prefixMatches }) => {
          if (prefixMatches && prefixMatches.length > 0) {
            try {
              const entity = await EntityService.getBySlug(prefixMatches[0].slug);
              return entity || null;
            } catch {
              return null;
            }
          }
          return null;
        })
    ),
    
    // Strategy 2b: Slug ends with base slug (handles brand name lookups)
    // Example: "prozac" → "fluoxetine-prozac", "zoloft" → "sertraline-zoloft"
    Promise.resolve(
      supabase
        .from('entities')
        .select('slug')
        .eq('type', type)
        .eq('status', 'active')
        .ilike('slug', `%-${baseSlug}`)
        .order('slug')
        .limit(1)
        .then(async ({ data: suffixMatches }) => {
          if (suffixMatches && suffixMatches.length > 0) {
            try {
              const entity = await EntityService.getBySlug(suffixMatches[0].slug);
              return entity || null;
            } catch {
              return null;
            }
          }
          return null;
        })
    ),
    
    // Strategy 3a: Check hardcoded common abbreviations
    (async () => {
      if (lowerName.length <= 10 && type === 'condition') {
        const commonAbbreviations: Record<string, string> = {
          'gad': 'generalized-anxiety-disorder',
          'mdd': 'major-depressive-disorder',
          'ptsd': 'posttraumatic-stress-disorder',
          'ocd': 'obsessive-compulsive-disorder',
          'adhd': 'attention-deficit-hyperactivity-disorder',
          'sad': 'social-anxiety-disorder',
          'pmdd': 'premenstrual-dysphoric-disorder',
        };
        
        if (commonAbbreviations[lowerName]) {
          try {
            const entity = await EntityService.getBySlug(commonAbbreviations[lowerName]);
            return entity || null;
          } catch {
            return null;
          }
        }
      }
      return null;
    })(),
    
    // Strategy 3b: Check metadata abbreviations
    (async () => {
      if (lowerName.length <= 10) {
        const { data: abbrevMatches } = await supabase
          .from('entities')
          .select('slug')
          .eq('type', type)
          .eq('status', 'active')
          .or(`content->abbreviation.ilike.${lowerName},metadata->abbreviation.ilike.${lowerName}`)
          .limit(1);
        
        if (abbrevMatches && abbrevMatches.length > 0) {
          try {
            const entity = await EntityService.getBySlug(abbrevMatches[0].slug);
            return entity || null;
          } catch {
            return null;
          }
        }
      }
      return null;
    })(),
  ];
  
  // Wait for first strategies in parallel, return first match
  const strategyResults = await Promise.all(strategyPromises);
  for (const result of strategyResults) {
    if (result) {
      validationCache.set(cacheKey, result);
      return result;
    }
  }

  // Strategy 4: Normalized matching (handles spelling variants like "post-traumatic" vs "posttraumatic")
  // Remove hyphens from both input and database values for comparison
  const normalizedInput = lowerName.replace(/-/g, '');
  const normalizedSlug = baseSlug.replace(/-/g, '');

  const { data: normalizedMatches } = await supabase
    .from('entities')
    .select('slug, title')
    .eq('type', type)
    .eq('status', 'active')
    .limit(50); // Get more results for client-side filtering

  if (normalizedMatches && normalizedMatches.length > 0) {
    for (const row of normalizedMatches) {
      const rowSlugNormalized = (row.slug || '').toLowerCase().replace(/-/g, '');
      const rowTitleNormalized = (row.title || '').toLowerCase().replace(/-/g, '').replace(/\s+/g, '');

      // Exact match after normalization
      if (rowSlugNormalized === normalizedSlug || rowTitleNormalized === normalizedInput.replace(/\s+/g, '')) {
        const entity = await EntityService.getBySlug(row.slug);
        if (entity) {
          validationCache.set(cacheKey, entity);
          return entity;
        }
      }
    }
  }

  // Strategy 5: Name contains search term (word boundary aware)
  // Example: "cognitive behavioral" → "cognitive-behavioral-therapy"
  const { data: nameMatches } = await supabase
    .from('entities')
    .select('slug, title')
    .eq('type', type)
    .eq('status', 'active')
    .ilike('title', `%${name}%`)
    .order('title')
    .limit(5);

  if (nameMatches && nameMatches.length > 0) {
    // Prefer exact word matches over partial matches
    for (const row of nameMatches) {
      const entityName = (row.title || '').toLowerCase();
      const entitySlug = (row.slug || '').toLowerCase();

      // Check if name starts with search term (best match)
      if (entityName.startsWith(lowerName) || entitySlug.startsWith(baseSlug)) {
        const entity = await EntityService.getBySlug(row.slug);
        if (entity) {
          validationCache.set(cacheKey, entity);
          return entity;
        }
      }
    }

    // Check for word boundary match
    const wordBoundaryRegex = new RegExp(`\\b${lowerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    for (const row of nameMatches) {
      const entityName = row.title || '';
      if (wordBoundaryRegex.test(entityName)) {
        const entity = await EntityService.getBySlug(row.slug);
        if (entity) {
          validationCache.set(cacheKey, entity);
          return entity;
        }
      }
    }

    // NO FALLBACK - if we didn't find an exact match, don't guess
    // This prevents linking generic words to random entities
  }

  // Strategy 5: Check alternative_names array in content
  const { data: altNameMatches } = await supabase
    .from('entities')
    .select('slug')
    .eq('type', type)
    .eq('status', 'active')
    .contains('content', { alternative_names: [name] })
    .limit(1);

  if (altNameMatches && altNameMatches.length > 0) {
    const entity = await EntityService.getBySlug(altNameMatches[0].slug);
    if (entity) {
      validationCache.set(cacheKey, entity);
      return entity;
    }
  }

  // Cache the negative result too to avoid repeated lookups
  validationCache.set(cacheKey, null);
  return null;
}

/**
 * Generate validated links from entity names
 * Only creates links for entities that actually exist in the database
 * NEVER creates links to non-existent pages
 */
export async function generateValidatedLinks(params: {
  sourceEntity: Entity;
  targetNames: string[];
  targetType: EntityType;
  linkType: LinkType;
  contextPrefix: string;
  priority: LinkPriority;
  extractorId: string;
  category?: string;
}): Promise<CandidateLink[]> {
  const {
    sourceEntity,
    targetNames,
    targetType,
    linkType,
    contextPrefix,
    priority,
    extractorId,
    category,
  } = params;

  const links: CandidateLink[] = [];

  for (let i = 0; i < targetNames.length; i++) {
    const name = targetNames[i];
    if (!name) continue;

    // Validate entity exists before creating link
    const targetEntity = await validateEntityExists(name, targetType);

    if (!targetEntity) {
      // Skip - entity doesn't exist, don't create a broken link
      continue;
    }

    // Entity exists - create the link
    links.push({
      sourceId: sourceEntity.id,
      sourceSlug: sourceEntity.slug,
      sourceType: sourceEntity.type || 'resource',
      targetId: targetEntity.id,
      targetSlug: targetEntity.slug,
      targetType: targetEntity.type || targetType,
      linkType: linkType,
      context: `${contextPrefix}[${i}]`,
      priority: priority,
      anchorOptions: [targetEntity.name, name],
      metadata: {
        extractorId: extractorId,
        category: category,
      },
    });
  }

  return links;
}

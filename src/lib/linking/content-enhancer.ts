/**
 * Content Enhancer - Server-side inline link injection
 *
 * Automatically detects entity names in content text and injects {link:} syntax
 * Only creates links for entities that actually exist (validated via database)
 *
 * Flow:
 * 1. Parse content to extract potential entity names
 * 2. Validate each name against database (smart matching)
 * 3. Inject {link:type:slug} syntax for valid entities
 * 4. Return enhanced content for client-side rendering via ParsedContent
 */

import type { Entity, EntityType } from '@/lib/types/database';
import { parseEntityNames, validateEntityExists } from './utils';
import { getRouteType } from '@/lib/utils/entity-type';

/**
 * Get canonical route for entity type
 * Uses consolidated utility for consistent URL paths
 */
function getCanonicalRoute(entityType: string): string {
  const routeType = getRouteType(entityType);
  
  switch (routeType) {
    case 'treatment':
      return '/treatments';
    case 'condition':
      return '/conditions';
    case 'resource':
      return '/resources';
    case 'assessment':
      return '/resources/assessments-screeners';
    case 'provider':
      return '/providers';
    default:
      return '/treatments';
  }
}

/**
 * Field patterns that may contain entity names
 * Maps field paths to expected entity types
 *
 * COMPLETE COVERAGE: Conditions, Treatments, Resources/Assessments
 *
 * ACTUAL DATA STRUCTURES (verified from database):
 * - Conditions: data.treatment_approaches.medications, data.treatment_approaches.psychotherapy (arrays of strings)
 * - Medications: data.sections (array) with items like {type:"indications", items:[...]}
 * - Resources: data.conditions (array of condition slugs)
 */
const LINKABLE_FIELDS: Record<string, EntityType[]> = {
  // ========== CONDITION FIELDS (verified working) ==========
  'data.treatment_approaches.medications': ['medication'],
  'data.treatment_approaches.psychotherapy': ['therapy'],
  'data.treatment_approaches.neuromodulation': ['treatment'],
  'data.treatment_approaches.interventional': ['treatment'],
  'data.treatment_approaches.alternative': ['treatment'],
  'data.treatment_approaches.supplements': ['supplement'],
  'data.comorbidities': ['condition'],
  'data.differential_diagnosis': ['condition'],

  // ========== MEDICATION FIELDS ==========
  // NOTE: sections is an ARRAY - must be handled specially in processSectionsArray()
  // Cannot use 'data.sections.indications.items' - sections[].type === "indications"

  // ========== RESOURCE/ASSESSMENT FIELDS ==========
  'data.conditions': ['condition'], // Array of condition slugs like ['anxiety', 'depression']
  'data.tags': ['condition'], // Tags may reference conditions
};

/**
 * Prose text fields that should use natural language extraction
 * These are NOT comma-separated lists, so need different parsing
 */
const PROSE_FIELDS: Record<string, EntityType[]> = {
  'data.description': ['condition', 'treatment'],
  'data.summary': ['condition', 'treatment'],
  'data.purpose': ['condition', 'treatment'],
  'data.full_name': ['condition'],
};

/**
 * Extract value from nested object path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set value at nested object path
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Extract entity names from prose text (not comma-separated lists)
 * STRICT CONSERVATIVE RULES: Only exact entity names or known abbreviations
 */
function extractEntityNamesFromProse(text: string): string[] {
  const names: string[] = [];

  // Exclude common non-entity abbreviations (Roman numerals, classification systems, etc.)
  const excludedAbbrevs = new Set(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'DSM', 'ICD', 'FDA', 'CDC', 'WHO', 'NIMH', 'MD', 'PHD', 'RN', 'MA', 'MS', 'BS', 'BA']);

  // STRICT whitelist of known medical abbreviations (tied to specific conditions)
  const knownMedicalAbbrevs = new Set(['GAD', 'MDD', 'PTSD', 'OCD', 'ADHD', 'PMDD', 'SAD', 'BPD', 'NPD', 'ASPD']);

  // Pattern 1: Only extract abbreviations that are in the known medical abbreviations list
  const abbrevRegex = /\b[A-Z]{2,5}\b/g;
  const abbrevMatches = text.match(abbrevRegex) || [];
  names.push(...abbrevMatches.filter(abbrev =>
    !excludedAbbrevs.has(abbrev) && knownMedicalAbbrevs.has(abbrev)
  ));

  // Pattern 2: Only FULL, SPECIFIC condition names (NO generic words like "anxiety", "depression", "mood")
  const specificConditionPatterns = [
    'generalized anxiety disorder',
    'major depressive disorder',
    'post-traumatic stress disorder',
    'posttraumatic stress disorder',
    'obsessive-compulsive disorder',
    'attention deficit hyperactivity disorder',
    'panic disorder',
    'social anxiety disorder',
    'bipolar disorder',
    'premenstrual dysphoric disorder',
    'borderline personality disorder',
    'narcissistic personality disorder',
    'antisocial personality disorder',
  ];

  const lowerText = text.toLowerCase();
  for (const pattern of specificConditionPatterns) {
    if (lowerText.includes(pattern)) {
      // Extract the actual cased version from the original text
      const regex = new RegExp(pattern.replace(/[-\s]/g, '[-\\s]'), 'gi');
      const matches = text.match(regex) || [];
      names.push(...matches);
    }
  }

  return [...new Set(names)]; // Deduplicate
}

/**
 * Enhance a single text field by injecting inline links
 * STRICT VALIDATION: Only creates links for entities that actually exist
 */
async function enhanceTextField(
  text: string,
  expectedTypes: EntityType[],
  isProse = false
): Promise<string> {
  if (!text || typeof text !== 'string') return text;

  // Skip if already has valid link syntax (to avoid double-processing)
  // Check for complete {link:type:slug:text} syntax
  if (text.match(/\{link:[^:}]+:[^:}]+:[^}]+\}/)) {
    return text; // Already has complete link syntax
  }
  
  // If there's malformed link syntax, clean it up first
  if (text.includes('{link:') || text.includes('link:')) {
    // Remove any malformed link syntax fragments
    text = text.replace(/\{?link:[^}]*\}?/g, '').trim();
  }

  // Skip very short text (likely not entity names)
  if (text.length < 3) return text;

  // Parse to extract entity names (use different strategy for prose vs lists)
  const entityNames = isProse
    ? extractEntityNamesFromProse(text)
    : parseEntityNames(text);

  if (entityNames.length === 0) return text;

  // Validate each entity and build replacement map
  // STRICT: Only add to map if entity is validated AND has required fields
  const replacements = new Map<string, string>();

  // Map of expected types to all valid subtypes (for medication types)
  const medicationSubtypes = new Set([
    'medication', 'antidepressant', 'antipsychotic', 'anxiolytic', 'benzodiazepine',
    'hypnotic', 'sedative-hypnotic', 'stimulant', 'mood-stabilizer', 'anticonvulsant',
    'nootropic', 'cognitive-enhancer', 'adhd-medication', 'addiction-treatment',
    'opioid-dependence-treatment', 'alcohol-dependence-treatment', 'antihistamine',
    'muscle-relaxant', 'barbiturate', 'anesthetic', 'antiemetic', 'antihypertensive',
    'opioid-antagonist', 'combination-medication', 'herbal', 'sleep-medication'
  ]);

  // Batch all validations to run in parallel for better performance
  const validationPromises: Promise<{ name: string; type: string; entity: Entity | null }>[] = [];
  
  // Process each entity name - for medications, try common subtypes sequentially
  for (const type of expectedTypes) {
    for (const name of entityNames) {
      const nameKey = name.toLowerCase();
      
      // Skip if we already have a replacement for this name
      if (replacements.has(nameKey)) continue;
      
      let entity: Entity | null = null;
      
      if (type === 'medication') {
        // Try key medication subtypes sequentially until we find a match
        const subtypesToTry = [
          'medication', 'antidepressant', 'antipsychotic', 'anxiolytic',
          'stimulant', 'adhd-medication', 'mood-stabilizer', 'anticonvulsant',
          'benzodiazepine', 'hypnotic', 'sedative-hypnotic'
        ];

        for (const subtype of subtypesToTry) {
          entity = await validateEntityExists(name, subtype as EntityType);
          if (entity) break; // Found a match, stop trying
        }
      } else {
        entity = await validateEntityExists(name, type);
      }

      // STRICT VALIDATION: Entity must have id, slug, type, AND name
      if (entity && entity.id && entity.slug && entity.type && entity.name) {
        // For medication types, accept any medication subtype
        const isMedicationType = type === 'medication' && medicationSubtypes.has(entity.type);
        const isExactMatch = entity.type === type;
        
        if (isExactMatch || isMedicationType) {
          // Create link syntax with validated entity
          const linkSyntax = `{link:${entity.type}:${entity.slug}:${name}}`;
          replacements.set(nameKey, linkSyntax);
        }
      }
    }
  }

  // If no validated entities, return original text
  if (replacements.size === 0) return text;

  // Apply replacements to text
  // IMPORTANT: Sort by length (longest first) to avoid partial matches
  // e.g., "Methylphenidate ER" should be replaced before "Methylphenidate"
  const sortedReplacements = Array.from(replacements.entries()).sort(
    (a, b) => b[0].length - a[0].length
  );

  let enhanced = text;

  for (const [name, linkSyntax] of sortedReplacements) {
    // Use word boundary regex to avoid partial matches
    // Match case-insensitively but preserve original case in replacement
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
    
    // Only replace if the match is not inside existing link syntax
    enhanced = enhanced.replace(regex, (match, offset) => {
      // Check if this match is inside a {link:...} block
      const beforeMatch = enhanced.substring(0, offset);
      const lastLinkStart = beforeMatch.lastIndexOf('{link:');
      const lastLinkEnd = beforeMatch.lastIndexOf('}');
      
      // If there's an unclosed {link: before this match, we're inside a link - skip
      if (lastLinkStart > lastLinkEnd) {
        return match; // Don't replace - already inside link syntax
      }
      
      return linkSyntax;
    });
  }

  return enhanced;
}

/**
 * Enhance array field (e.g., list of medications)
 */
async function enhanceArrayField(
  items: string[],
  expectedTypes: EntityType[]
): Promise<string[]> {
  if (!Array.isArray(items)) return items;

  const enhanced = await Promise.all(
    items.map(item => enhanceTextField(String(item), expectedTypes))
  );

  return enhanced;
}

/**
 * Process medication/therapy sections array
 * Handles structure like: [{ type: "indications", items: [...] }, ...]
 */
async function processSectionsArray(sections: any[]): Promise<any[]> {
  if (!Array.isArray(sections)) return sections;

  const processed = await Promise.all(
    sections.map(async (section) => {
      if (!section || typeof section !== 'object') return section;

      const processedSection = { ...section };

      // Process "indications" section - references conditions
      // Items are already individual condition names, process each one directly
      if (section.type === 'indications' && Array.isArray(section.items)) {
        processedSection.items = await Promise.all(
          section.items.map(async (item: string) => {
            if (typeof item !== 'string') return item;

            // If already has link syntax, validate it exists
            if (item.includes('{link:')) {
              const { parseLinkSyntax } = await import('./utils');

              // Extract the link part and the description part (if any)
              // Format: "{link:...}: description text" or just "{link:...}"
              const linkMatch = item.match(/^(\{link:[^}]+\})(.*)$/);
              const linkPart = linkMatch ? linkMatch[1] : item;
              const descriptionPart = linkMatch && linkMatch[2] ? linkMatch[2] : '';

              const parsed = parseLinkSyntax(linkPart);

              if (parsed) {
                // Handle abbreviations in slug
                const abbreviationMap: Record<string, string> = {
                  'ptsd': 'posttraumatic-stress-disorder', // Note: no hyphen in actual slug
                  'ocd': 'obsessive-compulsive-disorder',
                  'adhd': 'attention-deficit-hyperactivity-disorder',
                  'mdd': 'major-depressive-disorder',
                  'gad': 'generalized-anxiety-disorder',
                };

                let slugToCheck = parsed.slug.toLowerCase();
                if (abbreviationMap[slugToCheck]) {
                  slugToCheck = abbreviationMap[slugToCheck];
                }

                // Validate the entity actually exists
                const { EntityService } = await import('@/lib/data/entity-service');
                try {
                  const entity = await EntityService.getBySlug(slugToCheck);

                  // Only keep link if entity exists, is a condition, and is active
                  if (entity && entity.type === 'condition' && entity.status === 'active') {
                    // Return properly formatted link syntax + preserve any description after it
                    const displayText = parsed.text || entity.name;
                    return `{link:${entity.type}:${entity.slug}:${displayText}}${descriptionPart}`;
                  }
                } catch {
                  // Entity doesn't exist - fall through to remove link
                }

                // Entity doesn't exist or isn't a valid condition - remove link syntax but keep description
                // Extract display text from link syntax or format from slug
                const displayText = parsed.text || slugToCheck.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return displayText + descriptionPart;
              }

              // Invalid link syntax - return as plain text (remove link syntax but keep rest)
              return item.replace(/{link:[^}]+}/g, '').trim() || item;
            }

            const cleanItem = item.trim();

            // Use shared normalization function to handle abbreviations
            const { normalizeConditionName } = await import('./utils');
            const nameWithoutAbbrev = normalizeConditionName(cleanItem);

            // Try to validate as a condition (use name without abbreviation for matching)
            const entity = await validateEntityExists(nameWithoutAbbrev, 'condition');

            // Only create link if entity exists, is a condition, and is active
            if (entity && entity.id && entity.slug && entity.type === 'condition' && entity.status === 'active') {
              // Use original item text (with abbreviation) for display
              const linkSyntax = `{link:${entity.type}:${entity.slug}:${cleanItem}}`;
              return linkSyntax;
            }

            // No match - return original text (no link)
            return item;
          })
        );
      }

      // Process "contraindications" section - may reference conditions
      if (section.type === 'contraindications' && Array.isArray(section.items)) {
        processedSection.items = await enhanceArrayField(section.items, ['condition']);
      }

      // Process text fields in sections (use prose parsing, not list parsing)
      if (section.text && typeof section.text === 'string') {
        processedSection.text = await enhanceTextField(section.text, ['condition', 'medication'], true);
      }

      return processedSection;
    })
  );

  return processed;
}

/**
 * Validate tags and create pre-validated tag objects
 * Returns array of validated tags with entity info for rendering
 *
 * OPTIMIZED: Runs all validations in parallel for performance
 * FUTURE-PROOF: Tries all entity types for maximum coverage
 * SAFE: Prevents self-referential links (tags linking to themselves)
 */
async function validateTags(tags: string[], currentEntitySlug: string): Promise<any[]> {
  if (!Array.isArray(tags) || tags.length === 0) return [];

  // Try most common entity types (optimized for performance)
  // Order matters - most likely matches first to minimize DB queries
  const entityTypesToTry: EntityType[] = [
    'condition',      // Most common in article tags
    'medication',     // Second most common
    'therapy',        // Third most common
    // Skip less common types to reduce lag (36 queries → 12 queries for 4 tags)
    // Skip 'resource' to prevent self-referential links in articles
  ];

  // Run all tag validations in parallel for performance
  const validationPromises = tags.map(async (tag) => {
    // For each tag, try entity types in sequence (stop on first match)
    for (const entityType of entityTypesToTry) {
      try {
        const entity = await validateEntityExists(tag, entityType);
        if (entity && entity.id && entity.slug && entity.type && entity.name) {
          // SAFETY CHECK: Prevent self-referential links
          if (entity.slug === currentEntitySlug) {
            continue; // Try next entity type
          }

          const route = getCanonicalRoute(entity.type);
          return {
            text: tag,
            slug: entity.slug,
            type: entity.type,
            route: `${route}/${entity.slug}`
          };
        }
      } catch (error) {
        continue;
      }
    }

    // No entity match found
    return null;
  });

  // Wait for all validations to complete in parallel
  const results = await Promise.all(validationPromises);

  // Filter out null results (non-validated tags)
  return results.filter((tag): tag is NonNullable<typeof tag> => tag !== null);
}

/**
 * Enhance entity content with automatic inline links
 *
 * Processes known linkable fields and injects {link:} syntax for validated entities
 * Returns a new entity object with enhanced content (does not mutate original)
 */
export async function enhanceEntityContent(entity: Entity): Promise<Entity> {
  if (!entity || !entity.data) return entity;

  // Clone entity to avoid mutation
  const enhanced = JSON.parse(JSON.stringify(entity));

  // SPECIAL CASE: Validate tags for Knowledge Hub articles (metadata.topics)
  // Pre-validate tags server-side to avoid client-side loading state
  const topics = entity.data?.metadata?.topics || entity.metadata?.topics;
  if (topics && Array.isArray(topics)) {
    try {
      // Pass current entity slug to prevent self-referential links
      enhanced.validated_tags = await validateTags(topics, entity.slug);
    } catch (error) {
      console.error(`Failed to validate tags:`, error);
      enhanced.validated_tags = [];
    }
  }

  // SPECIAL CASE: Process medication/therapy sections array
  // Must be done before regular field processing since sections is an array
  if (entity.data.sections && Array.isArray(entity.data.sections)) {
    try {
      enhanced.data.sections = await processSectionsArray(entity.data.sections);
    } catch (error) {
      console.error(`Failed to process sections array:`, error);
    }
  }

  // Process each linkable field (lists and structured data) in parallel
  const fieldPromises = Object.entries(LINKABLE_FIELDS).map(async ([fieldPath, expectedTypes]) => {
    const value = getNestedValue(entity, fieldPath);

    if (!value) return { fieldPath, enhancedValue: null };

    try {
      let enhancedValue;

      if (typeof value === 'string') {
        enhancedValue = await enhanceTextField(value, expectedTypes);
      } else if (Array.isArray(value)) {
        enhancedValue = await enhanceArrayField(value, expectedTypes);
      } else if (typeof value === 'object') {
        // Handle nested objects (e.g., medications: { first_line: "...", second_line: "..." })
        enhancedValue = {} as Record<string, any>;
        const nestedPromises = Object.entries(value).map(async ([key, val]) => {
          if (typeof val === 'string') {
            return [key, await enhanceTextField(val, expectedTypes)] as const;
          } else if (Array.isArray(val)) {
            return [key, await enhanceArrayField(val, expectedTypes)] as const;
          } else {
            return [key, val] as const;
          }
        });
        const nestedResults = await Promise.all(nestedPromises);
        for (const [key, val] of nestedResults) {
          (enhancedValue as Record<string, any>)[key] = val;
        }
      } else {
        enhancedValue = value;
      }

      return { fieldPath, enhancedValue };
    } catch (error) {
      console.error(`Failed to enhance field ${fieldPath}:`, error);
      return { fieldPath, enhancedValue: null };
    }
  });

  const fieldResults = await Promise.all(fieldPromises);
  for (const { fieldPath, enhancedValue } of fieldResults) {
    if (enhancedValue !== null) {
      setNestedValue(enhanced, fieldPath, enhancedValue);
    }
  }

  // Process prose fields (natural language text, not lists) in parallel
  const prosePromises = Object.entries(PROSE_FIELDS).map(async ([fieldPath, expectedTypes]) => {
    const value = getNestedValue(entity, fieldPath);

    if (!value || typeof value !== 'string') return { fieldPath, enhancedValue: null };

    try {
      const enhancedValue = await enhanceTextField(value, expectedTypes, true); // isProse=true
      return { fieldPath, enhancedValue };
    } catch (error) {
      console.error(`Failed to enhance prose field ${fieldPath}:`, error);
      return { fieldPath, enhancedValue: null };
    }
  });

  const proseResults = await Promise.all(prosePromises);
  for (const { fieldPath, enhancedValue } of proseResults) {
    if (enhancedValue !== null) {
      setNestedValue(enhanced, fieldPath, enhancedValue);
    }
  }

  return enhanced;
}

/**
 * Check if entity type should have content enhancement
 */
export function shouldEnhanceEntity(entity: Entity): boolean {
  const enhancedTypes: EntityType[] = ['condition', 'medication', 'therapy', 'treatment', 'resource'];
  return enhancedTypes.includes(entity.type as EntityType);
}

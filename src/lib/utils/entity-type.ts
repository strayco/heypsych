/**
 * Entity Type Utilities
 * 
 * Single source of truth for determining entity types and canonical routes.
 * Used by MetadataFactory, SchemaFactory, LinkParser, and ContentEnhancer.
 */

import type { Entity, EntityType } from '@/lib/types/database';

/**
 * All valid entity types
 */
export const ENTITY_TYPES = [
  'condition',
  'medication',
  'therapy',
  'treatment',
  'interventional',
  'investigational',
  'alternative',
  'supplement',
  'resource',
  'provider',
] as const;

/**
 * Treatment subtypes (all route to /treatments/)
 */
export const TREATMENT_TYPES = [
  'medication',
  'therapy',
  'treatment',
  'interventional',
  'investigational',
  'alternative',
  'supplement',
] as const;

/**
 * Determine entity type from an entity object
 * 
 * Checks multiple sources in priority order:
 * 1. entity.type (explicit type field)
 * 2. entity.schema.entity_type (from schema)
 * 3. entity.schema.schema_name (fallback)
 * 4. entity.data.kind or entity.data.type (JSON data)
 * 5. Default to 'treatment'
 * 
 * @param entity - Entity to determine type for
 * @returns EntityType
 */
export function getEntityType(entity: Entity | null | undefined): EntityType {
  if (!entity) return 'treatment';

  // Priority 1: Explicit type field
  if (entity.type && isValidEntityType(entity.type)) {
    return entity.type;
  }

  // Priority 2: Schema entity_type
  if (entity.schema?.entity_type && isValidEntityType(entity.schema.entity_type)) {
    return entity.schema.entity_type as EntityType;
  }

  // Priority 3: Schema name
  if (entity.schema?.schema_name && isValidEntityType(entity.schema.schema_name)) {
    return entity.schema.schema_name as EntityType;
  }

  // Priority 4: Data fields
  if (entity.data?.kind && isValidEntityType(entity.data.kind)) {
    return entity.data.kind as EntityType;
  }

  if (entity.data?.type && isValidEntityType(entity.data.type)) {
    return entity.data.type as EntityType;
  }

  // Priority 5: Infer from schema_id
  if (entity.schema_id) {
    if (entity.schema_id.includes('condition')) return 'condition';
    if (entity.schema_id.includes('medication')) return 'medication';
    if (entity.schema_id.includes('therapy')) return 'therapy';
    if (entity.schema_id.includes('resource')) return 'resource';
    if (entity.schema_id.includes('provider')) return 'provider';
  }

  // Default fallback
  return 'treatment';
}

/**
 * Check if a string is a valid EntityType
 */
export function isValidEntityType(type: string | undefined | null): type is EntityType {
  if (!type) return false;
  return ENTITY_TYPES.includes(type as EntityType);
}

/**
 * Check if entity type is a treatment type (routes to /treatments/)
 */
export function isTreatmentType(type: EntityType | string): boolean {
  return TREATMENT_TYPES.includes(type as typeof TREATMENT_TYPES[number]);
}

/**
 * Get canonical route path for an entity type
 * 
 * @param entityType - Entity type
 * @returns Route path prefix (e.g., '/conditions', '/treatments')
 */
export function getCanonicalRoute(entityType: EntityType | string): string {
  switch (entityType) {
    case 'condition':
      return '/conditions';

    case 'medication':
    case 'therapy':
    case 'treatment':
    case 'interventional':
    case 'alternative':
    case 'supplement':
    case 'investigational':
      return '/treatments';

    case 'resource':
      return '/resources';

    case 'provider':
      return '/providers';

    default:
      return '/treatments'; // default fallback
  }
}

/**
 * Get full URL path for an entity
 * 
 * @param entity - Entity object
 * @returns Full path (e.g., '/conditions/major-depressive-disorder')
 */
export function getEntityPath(entity: Entity): string {
  const entityType = getEntityType(entity);
  const route = getCanonicalRoute(entityType);
  return `${route}/${entity.slug}`;
}

/**
 * Route type for URL generation
 */
export type RouteType = 'condition' | 'treatment' | 'resource' | 'provider' | 'assessment';

/**
 * Normalize entity type string to route type
 * Maps all treatment variants to 'treatment' route
 */
export function normalizeToRouteType(entityType: string): RouteType {
  switch (entityType) {
    case 'condition':
      return 'condition';

    case 'medication':
    case 'therapy':
    case 'treatment':
    case 'interventional':
    case 'alternative':
    case 'supplement':
    case 'investigational':
      return 'treatment';

    case 'resource':
      return 'resource';

    case 'assessment':
    case 'screener':
      return 'assessment';

    case 'provider':
      return 'provider';

    default:
      console.warn(`Unknown entity type "${entityType}", defaulting to treatment route`);
      return 'treatment';
  }
}

/**
 * Get display name for entity type
 */
export function getEntityTypeDisplayName(entityType: EntityType | string): string {
  const displayNames: Record<string, string> = {
    condition: 'Condition',
    medication: 'Medication',
    therapy: 'Therapy',
    treatment: 'Treatment',
    interventional: 'Interventional',
    investigational: 'Investigational',
    alternative: 'Alternative',
    supplement: 'Supplement',
    resource: 'Resource',
    provider: 'Provider',
  };

  return displayNames[entityType] || 'Treatment';
}

/**
 * Alias for normalizeToRouteType for backwards compatibility
 */
export const getRouteType = normalizeToRouteType;

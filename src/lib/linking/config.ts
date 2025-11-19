/**
 * Internal Linking Configuration
 *
 * Centralized configuration for link limits, priorities, and placement rules.
 * All linking behavior is driven by this config.
 */

import type { EntityType } from '@/lib/types/database';
import type { LinkType, LinkPriority, LinkSlot } from './types';

/**
 * Link Limits Per Template
 * Target ranges for total internal links per entity type
 */
export const LINK_LIMITS: Record<EntityType, { min: number; max: number; target: number }> = {
  condition: {
    min: 40,
    max: 75,
    target: 50, // Sweet spot for conditions
  },
  medication: {
    min: 35,
    max: 70,
    target: 45,
  },
  therapy: {
    min: 30,
    max: 60,
    target: 40,
  },
  treatment: {
    min: 30,
    max: 60,
    target: 40,
  },
  interventional: {
    min: 25,
    max: 50,
    target: 35,
  },
  investigational: {
    min: 20,
    max: 45,
    target: 30,
  },
  alternative: {
    min: 25,
    max: 50,
    target: 35,
  },
  supplement: {
    min: 20,
    max: 45,
    target: 30,
  },
  resource: {
    min: 15,
    max: 40,
    target: 25,
  },
  provider: {
    min: 10,
    max: 30,
    target: 20,
  },
};

/**
 * Link Type Priority Weights
 * Higher = more important, placed first, less likely to be dropped
 */
export const LINK_TYPE_PRIORITY: Record<LinkType, LinkPriority> = {
  // Critical: Primary treatment/assessment relationships
  condition_to_treatment: 'critical',
  condition_to_assessment: 'critical',
  treatment_to_condition: 'critical',

  // High: Clinically relevant relationships
  condition_to_comorbidity: 'high',
  treatment_to_drug_class: 'high',
  assessment_to_condition: 'high',

  // Medium: Related content
  condition_to_related_condition: 'medium',
  treatment_to_related_treatment: 'medium',
  treatment_to_alternative: 'medium',
  assessment_to_treatment: 'medium',

  // Low: Broad discovery
  resource_to_condition: 'low',
  resource_to_treatment: 'low',
  hub_to_entity: 'low',
  entity_to_hub: 'low',
  related_content: 'low',
};

/**
 * Slot Configuration
 * Rules for each placement slot
 */
export interface SlotConfig {
  /** Maximum links for this slot */
  maxLinks: number;

  /** Minimum links for this slot (0 = optional) */
  minLinks: number;

  /** Preferred link types for this slot (in priority order) */
  preferredLinkTypes: LinkType[];

  /** Allowed link types (if different from preferred) */
  allowedLinkTypes?: LinkType[];
}

/**
 * Slot Configuration Per Template
 * Different entity types may have different slot configurations
 */
export const SLOT_CONFIG: Record<LinkSlot, SlotConfig> = {
  body_inline: {
    maxLinks: 15,
    minLinks: 5,
    preferredLinkTypes: [
      'condition_to_treatment',
      'treatment_to_condition',
      'condition_to_related_condition',
      'treatment_to_related_treatment',
    ],
  },

  treatment_options: {
    maxLinks: 20,
    minLinks: 3,
    preferredLinkTypes: [
      'condition_to_treatment',
      'treatment_to_alternative',
      'treatment_to_drug_class',
    ],
  },

  related_conditions: {
    maxLinks: 15,
    minLinks: 0,
    preferredLinkTypes: [
      'condition_to_related_condition',
      'condition_to_comorbidity',
      'treatment_to_condition',
    ],
  },

  screening_tools: {
    maxLinks: 8,
    minLinks: 0,
    preferredLinkTypes: ['condition_to_assessment', 'assessment_to_condition'],
  },

  related_articles: {
    maxLinks: 10,
    minLinks: 0,
    preferredLinkTypes: [
      'resource_to_condition',
      'resource_to_treatment',
      'related_content',
    ],
  },

  sidebar: {
    maxLinks: 12,
    minLinks: 0,
    preferredLinkTypes: [
      'entity_to_hub',
      'condition_to_related_condition',
      'treatment_to_related_treatment',
    ],
  },

  footer_nav: {
    maxLinks: 8,
    minLinks: 0,
    preferredLinkTypes: ['entity_to_hub', 'hub_to_entity'],
  },
};

/**
 * Bidirectional Link Rules
 * Which link types should be reciprocal
 */
export const BIDIRECTIONAL_RULES: Record<LinkType, boolean> = {
  // Strong reciprocal relationships
  condition_to_treatment: true, // If condition links to treatment, treatment should link back
  treatment_to_condition: true,
  condition_to_comorbidity: true, // Comorbidities are bidirectional
  treatment_to_drug_class: true, // Drug class relationships

  // Weak reciprocal (only if space permits)
  condition_to_related_condition: true,
  treatment_to_related_treatment: true,

  // Unidirectional (no reciprocal required)
  condition_to_assessment: false, // Assessments don't need to link back to every condition
  assessment_to_condition: false,
  assessment_to_treatment: false,
  treatment_to_alternative: false,
  resource_to_condition: false,
  resource_to_treatment: false,
  hub_to_entity: false,
  entity_to_hub: false,
  related_content: false,
};

/**
 * Link Type Mapping
 * Define reciprocal link types
 */
export const RECIPROCAL_LINK_TYPES: Record<LinkType, LinkType | null> = {
  condition_to_treatment: 'treatment_to_condition',
  treatment_to_condition: 'condition_to_treatment',
  condition_to_comorbidity: 'condition_to_comorbidity', // Self-reciprocal
  treatment_to_drug_class: 'treatment_to_drug_class', // Self-reciprocal
  condition_to_related_condition: 'condition_to_related_condition', // Self-reciprocal
  treatment_to_related_treatment: 'treatment_to_related_treatment', // Self-reciprocal

  // No reciprocal
  condition_to_assessment: null,
  assessment_to_condition: null,
  assessment_to_treatment: null,
  treatment_to_alternative: null,
  resource_to_condition: null,
  resource_to_treatment: null,
  hub_to_entity: null,
  entity_to_hub: null,
  related_content: null,
};

/**
 * Anchor Text Variation Rules
 * How many anchor text variations to generate per link
 */
export const ANCHOR_TEXT_CONFIG = {
  /** Minimum anchor text variations per link */
  minVariations: 2,

  /** Maximum anchor text variations per link */
  maxVariations: 5,

  /** Use full entity name as first option */
  includeFullName: true,

  /** Use abbreviations if available */
  includeAbbreviations: true,

  /** Use generic terms ("this medication", "this therapy") */
  includeGenericTerms: false,
};

/**
 * Quality Thresholds
 * Used for guardrails and CI validation
 */
export const QUALITY_THRESHOLDS = {
  /** Maximum allowed duplicate links before failure */
  maxDuplicates: 10,

  /** Minimum average links per entity */
  minAverageLinks: 20,

  /** Maximum average links per entity */
  maxAverageLinks: 60,

  /** Maximum % of entities above max link limit */
  maxEntitiesAboveLimit: 0.05, // 5%

  /** Maximum % of entities below min link limit */
  maxEntitiesBelowLimit: 0.1, // 10%
};

/**
 * Performance Limits
 * Prevent runaway link extraction
 */
export const PERFORMANCE_LIMITS = {
  /** Maximum entities to process in single batch */
  maxBatchSize: 100,

  /** Maximum links to extract per entity (before filtering) */
  maxRawLinksPerEntity: 200,

  /** Timeout for single entity extraction (ms) */
  extractionTimeout: 5000,
};

/**
 * Get link limits for entity type
 */
export function getLinkLimits(entityType: EntityType): {
  min: number;
  max: number;
  target: number;
} {
  return LINK_LIMITS[entityType] || LINK_LIMITS.resource;
}

/**
 * Get priority for link type
 */
export function getLinkTypePriority(linkType: LinkType): LinkPriority {
  return LINK_TYPE_PRIORITY[linkType] || 'low';
}

/**
 * Check if link type should be reciprocal
 */
export function shouldBeReciprocal(linkType: LinkType): boolean {
  return BIDIRECTIONAL_RULES[linkType] || false;
}

/**
 * Get reciprocal link type
 */
export function getReciprocalLinkType(linkType: LinkType): LinkType | null {
  return RECIPROCAL_LINK_TYPES[linkType] || null;
}

/**
 * Get slot config
 */
export function getSlotConfig(slot: LinkSlot): SlotConfig {
  return SLOT_CONFIG[slot];
}

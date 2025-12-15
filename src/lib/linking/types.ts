/**
 * Internal Linking System - Type Definitions
 *
 * Core types for the link extraction, placement, and rendering system.
 * All link generation flows through these interfaces.
 */

import type { Entity, EntityType } from '@/lib/types/database';

/**
 * Link Type Categories
 * Defines the semantic relationship between source and target entities
 */
export type LinkType =
  // Condition-related links
  | 'condition_to_treatment'
  | 'condition_to_assessment'
  | 'condition_to_related_condition'
  | 'condition_to_comorbidity'

  // Treatment-related links
  | 'treatment_to_condition'
  | 'treatment_to_related_treatment'
  | 'treatment_to_drug_class'
  | 'treatment_to_alternative'

  // Resource-related links
  | 'assessment_to_condition'
  | 'assessment_to_treatment'
  | 'resource_to_condition'
  | 'resource_to_treatment'

  // Hub/category links
  | 'hub_to_entity'
  | 'entity_to_hub'

  // Generic related content
  | 'related_content';

/**
 * Context - Where the link was extracted from in the source entity
 * Format: "field.subfield" or "field[index]"
 * Examples: "treatment_approaches.medications", "comorbidities[0]", "primary_indications"
 */
export type LinkContext = string;

/**
 * Link Priority
 * Higher priority links are placed first and less likely to be dropped when hitting limits
 */
export type LinkPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Candidate Link
 * Raw extracted link before placement and rendering
 * Pure data structure with no UI concerns
 */
export interface CandidateLink {
  /** Source entity ID */
  sourceId: string;

  /** Source entity slug (for debugging) */
  sourceSlug: string;

  /** Source entity type */
  sourceType: EntityType;

  /** Target entity ID (null if external or not yet resolved) */
  targetId: string | null;

  /** Target entity slug */
  targetSlug: string;

  /** Target entity type */
  targetType: EntityType;

  /** Link type (semantic relationship) */
  linkType: LinkType;

  /** Context: where this link was extracted from in source entity data */
  context: LinkContext;

  /** Priority for placement (higher = more important) */
  priority: LinkPriority;

  /** Suggested anchor text options (in priority order) */
  anchorOptions: string[];

  /** Optional: Additional metadata for placement decisions */
  metadata?: {
    /** Drug class, therapy modality, etc. */
    category?: string;

    /** For bidirectional enforcement */
    isReciprocal?: boolean;

    /** For de-duplication */
    extractorId?: string;

    /** Relationship type (e.g., primary_treatment, off_label) */
    relationship?: string;

    /** Additional context about the link */
    linkContext?: string;
  };
}

/**
 * Link Slot
 * Where links can be placed in the UI
 */
export type LinkSlot =
  | 'body_inline'           // Inline contextual links in body text
  | 'treatment_options'     // Treatment options panel
  | 'related_conditions'    // Related conditions panel
  | 'screening_tools'       // Assessment/screening CTA
  | 'related_articles'      // Related resources/articles
  | 'sidebar'               // Sidebar modules
  | 'footer_nav';           // Footer navigation (within existing design)

/**
 * Slot Allocation
 * Links assigned to a specific placement slot
 */
export interface SlotAllocation {
  slot: LinkSlot;
  links: CandidateLink[];
  maxLinks: number;
  minLinks: number;
}

/**
 * Link Extraction Result
 * Complete set of candidate links for an entity
 */
export interface LinkExtractionResult {
  /** Source entity */
  sourceEntity: Entity;

  /** All candidate links (before de-duplication and prioritization) */
  rawLinks: CandidateLink[];

  /** De-duplicated and prioritized links */
  links: CandidateLink[];

  /** Total count by type */
  countByType: Record<LinkType, number>;

  /** Total count by priority */
  countByPriority: Record<LinkPriority, number>;

  /** Errors encountered during extraction (for observability) */
  errors: string[];
}

/**
 * Link Extractor Interface
 * Implemented by each entity-type-specific extractor
 */
export interface LinkExtractor {
  /** Entity type this extractor handles */
  entityType: EntityType;

  /** Unique identifier for this extractor */
  id: string;

  /**
   * Extract candidate links from an entity
   * @param entity - Source entity to extract links from
   * @param allEntities - All entities (for matching/validation)
   * @returns Array of candidate links
   */
  extract(entity: Entity, allEntities?: Entity[]): Promise<CandidateLink[]>;

  /**
   * Optional: Validate a candidate link before including it
   * @param link - Candidate link to validate
   * @returns true if link should be included
   */
  validate?(link: CandidateLink): boolean;
}

/**
 * Bidirectional Link Pair
 * Represents a bidirectional relationship between two entities
 */
export interface BidirectionalLinkPair {
  entityA: Entity;
  entityB: Entity;
  linkAtoB: CandidateLink | null;
  linkBtoA: CandidateLink | null;
  shouldBeReciprocal: boolean;
  isMissingReciprocal: boolean;
}

/**
 * Link Quality Metrics
 * For observability and guardrails
 */
export interface LinkQualityMetrics {
  totalLinks: number;
  duplicatesRemoved: number;
  averageLinksPerEntity: number;
  entitiesAboveMax: number;
  entitiesBelowMin: number;
  linksByType: Record<LinkType, number>;
  linksByPriority: Record<LinkPriority, number>;
  errorCount: number;
}

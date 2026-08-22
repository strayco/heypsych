/**
 * Catalog Domain Types
 *
 * Types for the minimal catalog relationship layer that powers Navigation V1.
 */
import type { Audience, CatalogEntityType } from "../navigation/types";

/**
 * Relationship types between catalog entities
 */
export type CatalogRelationType =
  | "SCREENS_FOR" // Assessment screens for a condition
  | "USED_FOR" // Treatment used for a condition
  | "COMPARES_WITH" // Treatment can be compared with another treatment
  | "SUPPORTS" // Tool supports treatment of a condition
  | "HAS_NEXT_STEP" // Entity has a suggested next step
  | "FIND_CARE_FOR"; // Find care link for a condition

/**
 * Status of a relationship (for editorial workflow)
 */
export type RelationshipStatus = "draft" | "reviewed" | "published";

/**
 * A relationship between two catalog entities
 */
export interface CatalogRelationship {
  /** Unique identifier */
  id: string;

  /** Source entity */
  source: {
    type: CatalogEntityType;
    slug: string;
  };

  /** Target entity */
  target: {
    type: CatalogEntityType;
    slug: string;
  };

  /** Type of relationship */
  relation: CatalogRelationType;

  /** Target audiences for this relationship */
  audience: Audience[];

  /** Optional display label override */
  displayLabel?: string;

  /** Editorial rationale for this relationship */
  rationale?: string;

  /** Priority for ordering (lower = higher priority) */
  priority: number;

  /** How this relationship was created */
  provenance: "editorial";

  /** Publication status */
  status: RelationshipStatus;
}

/**
 * A file containing relationships for a specific condition/entity
 */
export interface RelationshipFile {
  /** Schema version for migrations */
  schemaVersion: string;

  /** Entity this file is for */
  entity: {
    type: CatalogEntityType;
    slug: string;
  };

  /** Last updated timestamp */
  updatedAt: string;

  /** Author/editor who last modified */
  updatedBy?: string;

  /** Relationships defined for this entity */
  relationships: CatalogRelationship[];
}

/**
 * Query options for fetching relationships
 */
export interface RelationshipQueryOptions {
  /** Filter by source type */
  sourceType?: CatalogEntityType;

  /** Filter by source slug */
  sourceSlug?: string;

  /** Filter by relation type */
  relation?: CatalogRelationType;

  /** Filter by audience */
  audience?: Audience;

  /** Only include published relationships */
  publishedOnly?: boolean;
}

/**
 * Result of relationship validation
 */
export interface RelationshipValidationResult {
  valid: boolean;
  errors: RelationshipValidationError[];
  warnings: RelationshipValidationWarning[];
}

/**
 * A validation error that should block publication
 */
export interface RelationshipValidationError {
  relationshipId: string;
  field: string;
  message: string;
  code: "BROKEN_TARGET" | "INVALID_TYPE_COMBO" | "DUPLICATE" | "MISSING_REQUIRED";
}

/**
 * A validation warning that doesn't block publication
 */
export interface RelationshipValidationWarning {
  relationshipId: string;
  field: string;
  message: string;
  code: "MISSING_RATIONALE" | "LOW_PRIORITY";
}

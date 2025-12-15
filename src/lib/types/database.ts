// src/lib/types/database.ts

import type { EditorialMetadata } from './editorial';

export interface Collection {
  id: string;
  name: string;
  slug: string;
  collection_type: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  config?: Record<string, any>;
  parent_id?: string | null;
  created_at: string;
}

/**
 * Medical review metadata stored in entity.metadata
 */
export interface EntityMedicalReview {
  reviewed?: boolean;
  reviewer_name?: string;
  reviewer_credentials?: string;
  review_date?: string;
  verified?: boolean;
}

/**
 * Author information stored in entity.metadata
 */
export interface EntityAuthorMetadata {
  name?: string;
  credentials?: string;
  role?: string;
  verified?: boolean;
  bio?: string;
  image_url?: string;
}

/**
 * Entity metadata structure
 */
export interface EntityMetadata {
  /** Category/subcategory of the entity */
  category?: string;
  
  /** DSM-5 diagnostic code */
  dsm5_code?: string;
  
  /** ICD-10 diagnostic code */
  icd10_code?: string;
  
  /** Medical review information */
  medical_review?: EntityMedicalReview;
  
  /** Author information */
  author?: EntityAuthorMetadata;
  
  /** Medical reviewer information */
  medical_reviewer?: EntityAuthorMetadata;
  
  /** Publication date */
  published_date?: string;
  
  /** Last updated date */
  last_updated?: string;
  
  /** Editorial metadata (alternative location) */
  editorial?: EditorialMetadata;
  
  /** Tags */
  tags?: string[];
  
  /** References */
  references?: any[];
  
  /** Drug classes (for medications) */
  drug_classes?: string[];
  
  /** Mechanism categories (for medications) */
  mechanism_categories?: string[];
  
  /** Additional arbitrary metadata */
  [key: string]: any;
}

// UI-layer "Entity" your app uses (mapped from DB rows)
export interface Entity {
  id: string;
  schema_id: string;
  name: string;
  slug: string;
  description?: string | null;
  data: Record<string, any>;
  metadata?: EntityMetadata;
  status: "active" | "draft" | "archived" | (string & {});
  visibility: "public" | "admin" | "research" | (string & {});
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;

  /** Editorial metadata for E-A-T compliance (YMYL content) */
  editorial?: EditorialMetadata;

  /** SEO overrides (title, description, keywords) */
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  /** Entity type (derived from schema_name or explicit type field) */
  type?: EntityType;

  /** Tags for categorization and filtering */
  tags?: string[];
  
  /** Pre-validated tags from content enhancer */
  validated_tags?: Array<{
    text: string;
    slug: string;
    type: string;
    route: string;
  }>;

  schema?: {
    id: string;
    entity_type: string;
    schema_name: string;
    display_name: string;
    icon: string;
    color: string;
    field_definitions: Record<string, any>;
    ui_config: Record<string, any>;
    validation_rules: Record<string, any>;
    created_at: string;
    updated_at: string;
  } | null;
  collections?: Collection[];
}

// (Optional) DB-row helper if you want to type raw rows in a few places
export interface EntitiesRow {
  id: string;
  type: string;
  slug: string;
  title: string;
  description: string | null;
  content: any;
  metadata: any;
  status: string;
  created_at: string;
  updated_at: string;
}

// Convenience types some hooks/services may import
export type EntityType =
  | "treatment"
  | "medication"
  | "therapy"
  | "interventional"
  | "investigational"
  | "alternative"
  | "supplement"
  | "condition"
  | "resource"
  | "provider";

export type SchemaName =
  | "treatment"
  | "medication"
  | "interventional"
  | "investigational"
  | "alternative"
  | "therapy"
  | "supplement"
  | "condition"
  | "resource"
  | "provider";

// UI-mapped entity with typed `data` payload (optional generic)
export type MappedEntity<T = any> = {
  id: string;
  slug: string;
  name: string;
  summary?: string;
  description?: string | null;
  metadata?: any;
  schema: { schema_name: string; display_name: string };
  data: T;
  pillar?: string;
  raw?: any;
};

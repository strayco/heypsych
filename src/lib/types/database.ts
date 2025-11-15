// src/lib/types/database.ts

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

// UI-layer "Entity" your app uses (mapped from DB rows)
export interface Entity {
  id: string;
  schema_id: string;
  name: string;
  slug: string;
  description?: string | null;
  data: Record<string, any>;
  metadata?: any;
  status: "active" | "draft" | "archived" | (string & {});
  visibility: "public" | "admin" | "research" | (string & {});
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
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

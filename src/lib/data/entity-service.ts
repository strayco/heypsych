// src/lib/data/entity-service.ts - Server-only safe version
import { supabase } from "@/lib/config/database";
import type { Entity, Collection, EntityType, SchemaName } from "@/lib/types/database";

// Only import fs modules on server side
let fs: typeof import("fs") | null = null;
let path: typeof import("path") | null = null;

// Dynamically import fs modules only when on server
// eslint-disable-next-line @typescript-eslint/no-require-imports
if (typeof window === "undefined") {
  fs = require("fs");
  path = require("path");
}

type BasicSchemaMeta = {
  id: string;
  entity_type: EntityType | string;
  schema_name: SchemaName;
  display_name: string;
  icon: string;
  color: string;
  field_definitions: Record<string, any>;
  ui_config: Record<string, any>;
  validation_rules: Record<string, any>;
  created_at: string;
  updated_at: string;
};

// ---------- Dynamic helpers ----------
function categoryToSchemaName(category?: string | null): SchemaName {
  if (!category) return "treatment";
  const first = category.split("/")[0];
  switch (first) {
    case "medications":
      return "medication";
    case "interventional":
      return "interventional";
    case "investigational":
      return "investigational";
    case "alternative":
      return "alternative";
    case "therapy":
      return "therapy";
    case "supplements":
      return "supplement";
    default:
      return "treatment";
  }
}

// NEW: Map entity type directly to schema name
function entityTypeToSchemaName(entityType: string): SchemaName {
  switch (entityType) {
    case "medication":
      return "medication";
    case "interventional":
      return "interventional";
    case "investigational":
      return "investigational";
    case "alternative":
      return "alternative";
    case "therapy":
      return "therapy";
    case "supplement":
      return "supplement";
    case "treatment":
      return "treatment";
    case "condition":
      return "condition";
    case "resource":
      return "resource";
    case "provider":
      return "provider";
    default:
      return "treatment";
  }
}

function displayForSchema(s: SchemaName) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function iconForSchema(s: SchemaName) {
  const m: Record<SchemaName, string> = {
    treatment: "pill",
    medication: "pill",
    interventional: "zap",
    investigational: "flask-conical",
    alternative: "leaf",
    therapy: "message-circle",
    supplement: "heart",
    condition: "brain",
    resource: "book",
    provider: "user",
  };
  return m[s] ?? "circle";
}

function colorForSchema(s: SchemaName) {
  const m: Record<SchemaName, string> = {
    treatment: "green",
    medication: "purple",
    interventional: "yellow",
    investigational: "cyan",
    alternative: "emerald",
    therapy: "orange",
    supplement: "pink",
    condition: "blue",
    resource: "slate",
    provider: "gray",
  };
  return m[s] ?? "gray";
}

// Dynamic mapping that adapts to actual directory structure
const SCHEMA_TO_FILTER: Record<SchemaName, { type: EntityType; categoryPrefix?: string }> = {
  medication: { type: "medication" },
  interventional: { type: "interventional" },
  investigational: { type: "investigational" },
  alternative: { type: "alternative" },
  therapy: { type: "therapy" },
  supplement: { type: "supplement" },
  treatment: { type: "treatment" },
  condition: { type: "condition" },
  resource: { type: "resource" },
  provider: { type: "provider" },
};

// ---------- Dynamic file system scanning (server-only) ----------
class FileSystemScanner {
  private static treatmentCategoriesCache: string[] | null = null;
  private static conditionCategoriesCache: string[] | null = null;

  /** Dynamically scan for all treatment categories (server-only) */
  static getTreatmentCategories(): string[] {
    // Client-side: return empty array and let API handle it
    if (typeof window !== "undefined") {
      console.log("FileSystemScanner: Client-side, returning empty array");
      return [];
    }

    if (this.treatmentCategoriesCache) {
      return this.treatmentCategoriesCache;
    }

    try {
      if (!fs || !path) {
        console.warn("fs or path module not available");
        return [];
      }

      const treatmentsPath = path.join(process.cwd(), "data", "treatments");
      if (!fs.existsSync(treatmentsPath)) {
        console.warn("Treatments directory not found:", treatmentsPath);
        return [];
      }

      const categories = fs
        .readdirSync(treatmentsPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .sort();

      this.treatmentCategoriesCache = categories;
      console.log("🗂️ Discovered treatment categories:", categories);
      return categories;
    } catch (error) {
      console.error("Error scanning treatment categories:", error);
      return [];
    }
  }

  /** Clear caches to rescan directories */
  static clearCache() {
    this.treatmentCategoriesCache = null;
    this.conditionCategoriesCache = null;
  }
}

// ---------- mapping ----------
function normalizeEntity(row: any): Entity {
  // FIXED: Use entity type first, then fall back to category-based mapping
  let schemaName: SchemaName;

  if (
    row.type &&
    [
      "medication",
      "interventional",
      "investigational",
      "alternative",
      "therapy",
      "supplement",
    ].includes(row.type)
  ) {
    schemaName = entityTypeToSchemaName(row.type);
  } else {
    schemaName = categoryToSchemaName(row?.metadata?.category ?? row?.content?.category);
  }

  const schemaMeta: BasicSchemaMeta = {
    id: `schema-${schemaName}`,
    entity_type: SCHEMA_TO_FILTER[schemaName]?.type ?? "treatment",
    schema_name: schemaName,
    display_name: displayForSchema(schemaName),
    icon: iconForSchema(schemaName),
    color: colorForSchema(schemaName),
    field_definitions: {},
    ui_config: {},
    validation_rules: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    id: row.id,
    schema_id: `schema-${schemaName}`,
    name: row.title || row.name,
    slug: row.slug,
    description: row.description, // Add this line
    data: row.content || row.data || {},
    metadata: row.metadata,
    status: row.status,
    visibility: "public",
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    schema: schemaMeta,
  };
}

function normalizeEntities(rows: any[]): Entity[] {
  return rows.map(normalizeEntity);
}

// ---------- Enhanced service ----------
export class EntityService {
  /** Enhanced getBySlug with API fallback for client-side */
  static async getBySlug(slug: string): Promise<Entity | null> {
    try {
      // First, try the database
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      if (!error && data) {
        return normalizeEntity(data);
      }

      console.log(`🔍 Entity '${slug}' not found in database, trying API fallback...`);

      // Fallback: use API route (works on both client and server)
      return await this.getFromAPI(slug);
    } catch (error) {
      console.error("Error in getBySlug:", error);
      return await this.getFromAPI(slug);
    }
  }

  /** Fallback method using API route (works client and server-side) */
  private static async getFromAPI(slug: string): Promise<Entity | null> {
    try {
      const response = await fetch(`/api/treatments/${slug}`);

      if (!response.ok) {
        console.log(`❌ API request failed for ${slug}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`✅ Found ${slug} via API`);

      return data as Entity;
    } catch (error) {
      console.error("Error fetching from API:", error);
      return null;
    }
  }

  /** Get all treatment categories dynamically (with API fallback) */
  static getAvailableTreatmentCategories(): string[] {
    return FileSystemScanner.getTreatmentCategories();
  }

  /** Clear file system cache when directories change */
  static refreshFileSystemCache() {
    FileSystemScanner.clearCache();
  }

  // Keep all your existing database methods unchanged
  static async getBySchemaType(schemaName: string): Promise<Entity[]> {
    const schema = (schemaName as SchemaName) || "treatment";
    const filter = SCHEMA_TO_FILTER[schema] ?? { type: "treatment" };

    let query = supabase
      .from("entities")
      .select("*")
      .eq("type", filter.type)
      .eq("status", "active")
      .order("title");

    if (filter.categoryPrefix) {
      query = query.like("metadata->>category", `${filter.categoryPrefix}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return normalizeEntities(data || []);
  }

  static async getByEntityType(entityType: string): Promise<Entity[]> {
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("type", entityType)
      .eq("status", "active")
      .order("title");

    if (error) throw error;
    return normalizeEntities(data || []);
  }

  // FIXED: Include all treatment types
  static async getAllTreatments(): Promise<Entity[]> {
    const treatmentTypes = [
      "medication",
      "therapy",
      "interventional",
      "supplement",
      "treatment",
      "alternative",
      "investigational",
    ];

    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .in("type", treatmentTypes)
      .eq("status", "active")
      .order("title");

    if (error) throw error;
    return normalizeEntities(data || []);
  }

  static async getConditionsByCategory(category: string): Promise<Entity[]> {
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("type", "condition")
      .eq("status", "active")
      .eq("metadata->>category", category)
      .order("title");

    if (error) throw error;
    return normalizeEntities(data || []);
  }

  static async getConditionsByCategoryFlexible(category: string): Promise<Entity[]> {
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("type", "condition")
      .eq("status", "active")
      .or(`metadata->>category.eq.${category},slug.ilike.${category}%,slug.ilike.%${category}%`)
      .order("title");

    if (error) throw error;
    return normalizeEntities(data || []);
  }

  static async getByTypeAndCategory(entityType: EntityType, category: string): Promise<Entity[]> {
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("type", entityType)
      .eq("status", "active")
      .eq("metadata->>category", category)
      .order("title");

    if (error) throw error;
    return normalizeEntities(data || []);
  }

  static async getCategoriesByType(entityType: EntityType): Promise<string[]> {
    const { data, error } = await supabase
      .from("entities")
      .select("metadata")
      .eq("type", entityType)
      .eq("status", "active");

    if (error) throw error;

    const categories = new Set<string>();

    data?.forEach((row) => {
      const metaCategory = (row.metadata as any)?.category;
      if (metaCategory) categories.add(metaCategory);
    });

    return Array.from(categories).sort();
  }

  static async getCollections(collectionType?: string): Promise<Collection[]> {
    let query = supabase.from("collections").select("*").order("name");
    if (collectionType) query = query.eq("collection_type", collectionType);
    const { data, error } = await query;
    if (error) return [];
    return (data as Collection[]) || [];
  }

  // FIXED: Include all treatment types
  static async getTreatmentsByCategory(category: string): Promise<Entity[]> {
    const treatmentTypes = [
      "medication",
      "therapy",
      "interventional",
      "supplement",
      "treatment",
      "alternative",
      "investigational",
    ];

    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .in("type", treatmentTypes)
      .like("metadata->>category", `${category}%`)
      .eq("status", "active")
      .order("title");

    if (error) throw error;
    return normalizeEntities(data || []);
  }

  // FIXED: Include all treatment types
  static async searchTreatments(query: string): Promise<Entity[]> {
    const treatmentTypes = [
      "medication",
      "therapy",
      "interventional",
      "supplement",
      "treatment",
      "alternative",
      "investigational",
    ];

    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .in("type", treatmentTypes)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq("status", "active")
      .limit(20);

    if (error) throw error;
    return normalizeEntities(data || []);
  }

  // Updated convenience methods
  static getMedications() {
    return this.getBySchemaType("medication");
  }
  static getInterventional() {
    return this.getBySchemaType("interventional");
  }
  static getSupplements() {
    return this.getBySchemaType("supplement");
  }
  static getTherapies() {
    return this.getBySchemaType("therapy");
  }

  static async getByCollection(_collectionSlug: string): Promise<Entity[]> {
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("status", "active")
      .order("title");

    if (error) throw error;
    return normalizeEntities(data || []);
  }

  // comparisons
  static extractValue(entity: Entity, path: string): any {
    const keys = path.replace(/^\$\./, "").split(".");
    return keys.reduce((obj, key) => (obj as any)?.[key], entity.data as any);
  }

  static getComparisonData(entities: Entity[], metricPaths: string[]) {
    return entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      schema: (entity as any).schema?.display_name,
      metrics: metricPaths.reduce(
        (acc, path) => {
          const key = path.replace(/^\$\./, "").replace(".", "_");
          acc[key] = this.extractValue(entity, path);
          return acc;
        },
        {} as Record<string, any>
      ),
    }));
  }
}

// src/lib/data/entity-service.ts - Server-only safe version
import { supabaseOptional, SUPABASE_UNAVAILABLE } from "@/lib/config/database";
import type { Entity, Collection, EntityType, SchemaName, EntityMetadata } from "@/lib/types/database";
import { normalizeEntityContent, categoryToSchemaName } from "@/lib/data/entity-mappers";

// Helper to get supabase client - returns null if unavailable (build without credentials)
function getDb() {
  return supabaseOptional();
}

// Only import fs modules on server side
// Keep as null initially, will be loaded dynamically on server
let fs: typeof import('fs') | null = null;
let path: typeof import('path') | null = null;

/**
 * Webpack-safe server module loader
 *
 * INTENTIONAL USE OF EVAL:
 * We use eval('require') to hide the require() call from webpack's static analysis.
 * This prevents webpack from attempting to bundle Node.js modules (fs, path) for client-side code.
 * These modules should ONLY be loaded server-side during SSG/ISR builds.
 *
 * This is NOT a security risk - it's a build-time pattern to prevent incorrect bundling.
 * Alternatives like dynamic import('node:fs') still trigger webpack's module resolver.
 */
function loadServerModule(moduleName: string): any {
  if (typeof window !== "undefined") return null; // Client-side guard

  try {
    // eslint-disable-next-line no-eval
    return eval('require')(moduleName);
  } catch {
    return null;
  }
}

// Load fs modules dynamically when needed (server-side only)
async function ensureFsModules(): Promise<boolean> {
  if (typeof window !== "undefined") return false; // Client-side, don't load
  if (fs && path) return true; // Already loaded

  try {
    fs = loadServerModule('fs');
    path = loadServerModule('path');
    return !!(fs && path);
  } catch {
    return false;
  }
}

// Synchronous wrapper for backwards compatibility
function ensureFsModulesSync(): boolean {
  if (typeof window !== "undefined") return false;
  if (fs && path) return true;

  try {
    fs = loadServerModule('fs');
    path = loadServerModule('path');
    return !!(fs && path);
  } catch {
    return false;
  }
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
// categoryToSchemaName is now imported from entity-mappers.ts (single source of truth)

// Map entity type directly to schema name
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
      return [];
    }

    if (this.treatmentCategoriesCache) {
      return this.treatmentCategoriesCache;
    }

    try {
      if (!ensureFsModulesSync() || !fs || !path) {
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
        .filter((dirent: any) => dirent.isDirectory())
        .map((dirent: any) => dirent.name)
        .sort();

      this.treatmentCategoriesCache = categories;
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
  const normalizedContent = normalizeEntityContent(row.content || row.data || {});

  // Check content.type and content.kind first for accurate type detection
  const contentType = normalizedContent?.type || normalizedContent?.kind;
  const effectiveType = row.type || row.metadata?.entity_type || contentType;

  if (
    effectiveType &&
    [
      "medication",
      "interventional",
      "investigational",
      "alternative",
      "therapy",
      "supplement",
      "resource",
      "condition",
      "provider",
    ].includes(effectiveType)
  ) {
    schemaName = entityTypeToSchemaName(effectiveType);
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

  // Extract editorial metadata from multiple possible sources
  // Priority: row.editorial (direct) > normalizedContent.editorial > row.content.editorial
  const editorial = row.editorial || normalizedContent?.editorial || row.content?.editorial;

  return {
    id: row.id,
    schema_id: `schema-${schemaName}`,
    name: row.title || row.name,
    slug: row.slug,
    description: row.description ?? normalizedContent?.description ?? null,
    data: normalizedContent || {},
    metadata: row.metadata,
    status: row.status,
    visibility: "public",
    // CRITICAL: Preserve entity type - check multiple sources
    // Priority: row.type > metadata.entity_type > content.type > content.kind > schema fallback
    type: row.type || row.metadata?.entity_type || normalizedContent?.type || normalizedContent?.kind || schemaMeta.entity_type,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    schema: schemaMeta,
    // Editorial metadata for E-A-T compliance (YMYL content)
    editorial,
  };
}

function normalizeEntities(rows: any[]): Entity[] {
  return rows.map(normalizeEntity);
}

// ---------- Retry helper for transient DB errors ----------
const RETRYABLE_ERROR_CODES = ['57014', '20', 'ETIMEDOUT', 'ECONNRESET'];

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorCode = error?.code || error?.message?.match(/code[:\s'"]*(\w+)/i)?.[1];
      const isRetryable = RETRYABLE_ERROR_CODES.some(code =>
        errorCode === code || error?.message?.includes('AbortError') || error?.message?.includes('timeout')
      );

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 50;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ---------- Enhanced service ----------
type CachedSet<T> = {
  data: T[];
  fetchedAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const legacyCache: {
  treatments?: CachedSet<Entity>;
  conditions?: CachedSet<Entity>;
  resources?: CachedSet<Entity>;
  all?: CachedSet<Entity>;
  bySchema: Map<string, CachedSet<Entity>>;
} = {
  bySchema: new Map(),
};

function isCacheFresh(entry?: CachedSet<Entity>): entry is CachedSet<Entity> {
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS && entry.data.length > 0;
}

export class EntityService {
  /** Get entity by slug - database only, no API fallback */
  static async getBySlug(slug: string): Promise<Entity | null> {
    try {
      // During build, skip direct pool to avoid connection issues
      const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

      // Use direct database pool for faster queries (runtime only)
      if (!isBuild && typeof window === 'undefined') {
        try {
          const { queryWithRetry } = await import('@/lib/config/db-pool');
          const result = await queryWithRetry(
            `SELECT * FROM entities WHERE slug = $1 AND status = $2 ORDER BY type ASC LIMIT 1`,
            [slug, 'active']
          );

          if (result.rows && result.rows.length > 0) {
            return normalizeEntity(result.rows[0]);
          }

          return null;
        } catch (poolError) {
          console.warn('Direct pool query failed for getBySlug, falling back to Supabase:', poolError);
          // Fall through to Supabase client
        }
      }

      // Use Supabase (build-time and client-safe) with retry for transient errors
      const db = getDb();
      if (!db) return null; // Build without credentials

      const data = await withRetry(async () => {
        const result = await db
          .from("entities")
          .select("*")
          .eq("slug", slug)
          .eq("status", "active")
          .order("type", { ascending: true })
          .limit(1);

        // Throw retryable errors so withRetry can catch them
        if (result.error) {
          console.error("Supabase error in getBySlug:", result.error);
          const err = new Error(`Database error fetching entity "${slug}": ${result.error.message}`) as any;
          err.code = result.error.code;
          throw err;
        }

        return result.data;
      });

      if (data && data.length > 0) {
        return normalizeEntity(data[0]);
      }

      // Confirmed not found - entity doesn't exist
      return null;
    } catch (error) {
      // Re-throw database errors to preserve error semantics
      // Only swallow non-database errors (shouldn't happen)
      console.error("Error in getBySlug:", error);
      throw error;
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

  static clearLegacySearchCache() {
    legacyCache.treatments = undefined;
    legacyCache.conditions = undefined;
    legacyCache.resources = undefined;
    legacyCache.bySchema.clear();
  }

  // Keep all your existing database methods unchanged
  static async getBySchemaType(schemaName: string): Promise<Entity[]> {
    const schema = (schemaName as SchemaName) || "treatment";
    const filter = SCHEMA_TO_FILTER[schema] ?? { type: "treatment" };

    // Check cache first
    const cached = legacyCache.bySchema.get(schema);
    if (cached && isCacheFresh(cached)) {
      return cached.data;
    }

    const db = getDb();
    if (!db) return [];

    let query = db
      .from("entities")
      .select("*")
      .eq("type", filter.type)
      .eq("status", "active")
      .order("title")
      .limit(500); // Add limit to prevent timeout

    if (filter.categoryPrefix) {
      query = query.like("metadata->>category", `${filter.categoryPrefix}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Error in getBySchemaType for ${schemaName}:`, error);
      return [];
    }

    const normalized = normalizeEntities(data || []);

    // Cache the result
    legacyCache.bySchema.set(schema, { data: normalized, fetchedAt: Date.now() });

    return normalized;
  }

  static async getByEntityType(entityType: string): Promise<Entity[]> {
    if (entityType === "condition" && isCacheFresh(legacyCache.conditions)) {
      return legacyCache.conditions!.data;
    }
    if (entityType === "resource" && isCacheFresh(legacyCache.resources)) {
      return legacyCache.resources!.data;
    }

    const db = getDb();
    if (!db) return []; // Build without credentials

    try {
      const { data, error } = await db
        .from("entities")
        .select("*")
        .eq("type", entityType)
        .eq("status", "active")
        .order("title")
        .limit(500);

      if (error) {
        console.error(`Error in getByEntityType for ${entityType}:`, error);
        return [];
      }
      const normalized = normalizeEntities(data || []);

      if (entityType === "condition") {
        legacyCache.conditions = { data: normalized, fetchedAt: Date.now() };
      } else if (entityType === "resource") {
        legacyCache.resources = { data: normalized, fetchedAt: Date.now() };
      }

      return normalized;
    } catch (err) {
      console.error(`Exception in getByEntityType for ${entityType}:`, err);
      return [];
    }
  }

  /** Get all active entities across all types */
  static async getAll(): Promise<Entity[]> {
    // Check cache first (critical for performance during page generation)
    if (isCacheFresh(legacyCache.all)) {
      return legacyCache.all.data;
    }

    // During build, skip direct pool to avoid connection issues
    // Use Supabase which has better connection pooling for parallel builds
    const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

    // Use direct database pool for faster queries (runtime only)
    if (!isBuild && typeof window === 'undefined') {
      try {
        const { queryWithRetry } = await import('@/lib/config/db-pool');
        const result = await queryWithRetry(
          `SELECT * FROM entities WHERE status = $1 ORDER BY type, title LIMIT 1000`,
          ['active']
        );

        const normalized = normalizeEntities(result.rows || []);
        legacyCache.all = { data: normalized, fetchedAt: Date.now() };
        return normalized;
      } catch (poolError) {
        console.warn('Direct pool query failed, falling back to Supabase:', poolError);
        // Fall through to Supabase client
      }
    }

    // Use Supabase (build-time and client-safe)
    const db = getDb();
    if (!db) return []; // Build without credentials

    try {
      const { data, error } = await db
        .from("entities")
        .select("*")
        .eq("status", "active")
        .order("type")
        .order("title")
        .limit(1000);

      if (error) {
        console.error("Error in getAll:", error);
        return [];
      }

      const normalized = normalizeEntities(data || []);
      legacyCache.all = { data: normalized, fetchedAt: Date.now() };
      return normalized;
    } catch (err) {
      console.error("Exception in getAll:", err);
      return [];
    }
  }

  /** Get all entities by type (alias for getByEntityType) */
  static async getByType(entityType: EntityType): Promise<Entity[]> {
    return this.getByEntityType(entityType);
  }

  // FIXED: Include all treatment types with pagination support
  // Uses NOT IN for excluded types (faster than IN with 35+ types)
  static async getAllTreatments(limit?: number): Promise<Entity[]> {
    if (isCacheFresh(legacyCache.treatments)) {
      return limit ? legacyCache.treatments!.data.slice(0, limit) : legacyCache.treatments!.data;
    }

    try {
      const db = getDb();
      if (!db) return [];

      // Exclude non-treatment types instead of listing all treatment types
      const excludedTypes = ["condition", "resource", "provider"];

      const query = db
        .from("entities")
        .select("*")
        .eq("status", "active")
        .not("type", "in", `(${excludedTypes.join(",")})`)
        .order("title")
        .limit(800);

      const { data, error } = await query;
      if (error) {
        console.error("Error in getAllTreatments:", error);
        return [];
      }

      const normalized = normalizeEntities(data || []);

      // Deduplicate by slug, preferring entities with more complete metadata
      const bySlug = new Map<string, Entity>();
      normalized.forEach((entity) => {
        const existing = bySlug.get(entity.slug);

        // If no existing entry, add it
        if (!existing) {
          bySlug.set(entity.slug, entity);
          return;
        }

        // Prefer entity with mechanism_categories populated
        const existingHasMechanism = (existing.metadata?.mechanism_categories?.length ?? 0) > 0;
        const currentHasMechanism = (entity.metadata?.mechanism_categories?.length ?? 0) > 0;

        if (currentHasMechanism && !existingHasMechanism) {
          bySlug.set(entity.slug, entity);
        }
        // If both or neither have mechanisms, keep the one with more metadata fields
        else if (currentHasMechanism === existingHasMechanism) {
          const existingMetadataCount = Object.keys(existing.metadata || {}).length;
          const currentMetadataCount = Object.keys(entity.metadata || {}).length;

          if (currentMetadataCount > existingMetadataCount) {
            bySlug.set(entity.slug, entity);
          }
        }
      });

      const deduplicated = Array.from(bySlug.values());
      legacyCache.treatments = { data: deduplicated, fetchedAt: Date.now() };

      return limit ? deduplicated.slice(0, limit) : deduplicated;
    } catch (err) {
      console.error("Exception in getAllTreatments:", err);
      return [];
    }
  }

  static async getConditionsByCategory(category: string): Promise<Entity[]> {
    const db = getDb();
    if (!db) return []; // Build without credentials

    try {
      const { data, error } = await db
        .from("entities")
        .select("*")
        .eq("type", "condition")
        .eq("status", "active")
        .eq("metadata->>category", category)
        .order("title")
        .limit(100);

      if (error) {
        console.error(`Error in getConditionsByCategory for ${category}:`, error);
        return [];
      }
      return normalizeEntities(data || []);
    } catch (err) {
      console.error(`Exception in getConditionsByCategory for ${category}:`, err);
      return [];
    }
  }

  static async getConditionsByCategoryFlexible(category: string): Promise<Entity[]> {
    const db = getDb();
    if (!db) return []; // Build without credentials

    try {
      const { data, error } = await db
        .from("entities")
        .select("*")
        .eq("type", "condition")
        .eq("status", "active")
        .or(`metadata->>category.eq.${category},slug.ilike.${category}%,slug.ilike.%${category}%`)
        .order("title")
        .limit(100);

      if (error) {
        console.error(`Error in getConditionsByCategoryFlexible for ${category}:`, error);
        return [];
      }
      return normalizeEntities(data || []);
    } catch (err) {
      console.error(`Exception in getConditionsByCategoryFlexible for ${category}:`, err);
      return [];
    }
  }

  static async getByTypeAndCategory(entityType: EntityType, category: string): Promise<Entity[]> {
    const db = getDb();
    if (!db) return []; // Build without credentials

    try {
      const { data, error } = await db
        .from("entities")
        .select("*")
        .eq("type", entityType)
        .eq("status", "active")
        .eq("metadata->>category", category)
        .order("title")
        .limit(100);

      if (error) {
        console.error(`Error in getByTypeAndCategory for ${entityType}/${category}:`, error);
        return [];
      }
      return normalizeEntities(data || []);
    } catch (err) {
      console.error(`Exception in getByTypeAndCategory for ${entityType}/${category}:`, err);
      return [];
    }
  }

  static async getCategoriesByType(entityType: EntityType): Promise<string[]> {
    const db = getDb();
    if (!db) return []; // Build without credentials

    try {
      const { data, error } = await db
        .from("entities")
        .select("metadata")
        .eq("type", entityType)
        .eq("status", "active")
        .limit(500);

      if (error) {
        console.error(`Error in getCategoriesByType for ${entityType}:`, error);
        return [];
      }

      const categories = new Set<string>();

      data?.forEach((row) => {
        const metadata = row.metadata as EntityMetadata | null;
        const metaCategory = metadata?.category;
        if (metaCategory) categories.add(metaCategory);
      });

      return Array.from(categories).sort();
    } catch (err) {
      console.error(`Exception in getCategoriesByType for ${entityType}:`, err);
      return [];
    }
  }

  static async getCollections(collectionType?: string): Promise<Collection[]> {
    const db = supabaseOptional();
    if (!db) return [];

    let query = db.from("collections").select("*").order("name");
    if (collectionType) query = query.eq("collection_type", collectionType);
    const { data, error } = await query;
    if (error) return [];
    return (data as Collection[]) || [];
  }

  // FIXED: Include all treatment types
  static async getTreatmentsByCategory(category: string): Promise<Entity[]> {
    const db = getDb();
    if (!db) return []; // Build without credentials

    try {
      const treatmentTypes = [
        "medication",
        "therapy",
        "interventional",
        "supplement",
        "treatment",
        "alternative",
        "investigational",
      ];

      const { data, error } = await db
        .from("entities")
        .select("*")
        .in("type", treatmentTypes)
        .like("metadata->>category", `${category}%`)
        .eq("status", "active")
        .order("title")
        .limit(200);

      if (error) {
        console.error(`Error in getTreatmentsByCategory for ${category}:`, error);
        return [];
      }
      return normalizeEntities(data || []);
    } catch (err) {
      console.error(`Exception in getTreatmentsByCategory for ${category}:`, err);
      return [];
    }
  }

  // FIXED: Include all treatment types
  static async searchTreatments(query: string): Promise<Entity[]> {
    const db = getDb();
    if (!db) return []; // Build without credentials

    try {
      const treatmentTypes = [
        "medication",
        "therapy",
        "interventional",
        "supplement",
        "treatment",
        "alternative",
        "investigational",
      ];

      const { data, error } = await db
        .from("entities")
        .select("*")
        .in("type", treatmentTypes)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq("status", "active")
        .limit(20);

      if (error) {
        console.error(`Error in searchTreatments for "${query}":`, error);
        return [];
      }
      return normalizeEntities(data || []);
    } catch (err) {
      console.error(`Exception in searchTreatments for "${query}":`, err);
      return [];
    }
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
    const db = getDb();
    if (!db) return []; // Build without credentials

    try {
      const { data, error } = await db
        .from("entities")
        .select("*")
        .eq("status", "active")
        .order("title")
        .limit(500);

      if (error) {
        console.error("Error in getByCollection:", error);
        return [];
      }
      return normalizeEntities(data || []);
    } catch (err) {
      console.error("Exception in getByCollection:", err);
      return [];
    }
  }

  // comparisons
  static extractValue(entity: Entity, path: string): unknown {
    const keys = path.replace(/^\$\./, "").split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return keys.reduce<unknown>((obj, key) => {
      if (obj && typeof obj === 'object' && key in obj) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, entity.data);
  }

  static getComparisonData(entities: Entity[], metricPaths: string[]) {
    return entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      schema: entity.schema?.display_name ?? null,
      metrics: metricPaths.reduce(
        (acc, path) => {
          const key = path.replace(/^\$\./, "").replace(".", "_");
          acc[key] = this.extractValue(entity, path);
          return acc;
        },
        {} as Record<string, unknown>
      ),
    }));
  }
}

// src/lib/data/server-queries.ts - Server-only data fetching utilities
import { supabaseOptional, SUPABASE_UNAVAILABLE } from "@/lib/config/database";
import { mapRowToEntity, TREATMENT_TYPE_MAP } from "@/lib/data/entity-mappers";
import type { Entity } from "@/lib/types/database";
import { ENTITY_COLUMNS, ENTITY_SQL_COLUMNS } from "@/lib/data/entity-columns";
import {
  getConditionsByCategoryLocal,
  getConditionsLocal,
  getOtherConditionsSubcategoryLocal,
  getResourcesByCategoryLocal,
  getResourcesLocal,
} from "@/lib/data/local-queries";

// Helper to get supabase client - returns null if unavailable (build without credentials)
function getDb() {
  return supabaseOptional();
}

/**
 * Server-side data fetching utilities
 * These run on Vercel's servers during SSR, eliminating cold start delays
 */

// Build-time cache to prevent redundant queries during parallel page generation
// Longer TTL during build, shorter during runtime
const CACHE_TTL_MS = process.env.NEXT_PHASE === 'phase-production-build' ? 600000 : 60000; // 10 min build, 1 min runtime

type CachedData<T> = {
  data: T;
  fetchedAt: number;
};

const queryCache = new Map<string, CachedData<Entity[]>>();

function isCacheFresh<T>(entry?: CachedData<T>): entry is CachedData<T> {
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

function getCached(key: string): Entity[] | null {
  const cached = queryCache.get(key);
  return isCacheFresh(cached) ? cached.data : null;
}

function setCache(key: string, data: Entity[]): void {
  queryCache.set(key, { data, fetchedAt: Date.now() });
}

export async function getMedicationsServer(): Promise<Entity[]> {
  // Check cache first
  const cached = getCached('medications');
  if (cached) return cached;

  const db = getDb();
  if (!db) return []; // Build without credentials

  try {
    const { data, error} = await db
      .from("entities")
      .select(ENTITY_COLUMNS)
      .in("type", TREATMENT_TYPE_MAP.medication)
      .eq("status", "active")
      .order("title")
      .limit(500);

    if (error) {
      console.error("Error fetching medications:", error);
      return [];
    }

    const mappedData = (data || []).map((row) => mapRowToEntity(row, "medication"));

    // Deduplicate by slug, preferring entities with more complete metadata
    const bySlug = new Map<string, Entity>();
    mappedData.forEach((entity) => {
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

    const result = Array.from(bySlug.values());
    setCache('medications', result);
    return result;
  } catch (err) {
    console.error("Error fetching medications:", err);
    return [];
  }
}

export async function getInterventionalServer(): Promise<Entity[]> {
  const db = getDb();
  if (!db) return []; // Build without credentials

  const { data, error } = await db
    .from("entities")
    .select(ENTITY_COLUMNS)
    .eq("type", "interventional")
    .eq("status", "active")
    .order("title")
    .limit(100);

  if (error) {
    console.error("Error fetching interventional treatments:", error);
    return [];
  }

  return (data || []).map((row) => mapRowToEntity(row, "interventional"));
}

export async function getSupplementsServer(): Promise<Entity[]> {
  const db = getDb();
  if (!db) return []; // Build without credentials

  const { data, error } = await db
    .from("entities")
    .select(ENTITY_COLUMNS)
    .eq("type", "supplement")
    .eq("status", "active")
    .order("title")
    .limit(100);

  if (error) {
    console.error("Error fetching supplements:", error);
    return [];
  }

  return (data || []).map((row) => mapRowToEntity(row, "supplement"));
}

export async function getTherapiesServer(): Promise<Entity[]> {
  const db = getDb();
  if (!db) return []; // Build without credentials

  const { data, error } = await db
    .from("entities")
    .select(ENTITY_COLUMNS)
    .eq("type", "therapy")
    .eq("status", "active")
    .order("title")
    .limit(100);

  if (error) {
    console.error("Error fetching therapies:", error);
    return [];
  }

  return (data || []).map((row) => mapRowToEntity(row, "therapy"));
}

export async function getAlternativeServer(): Promise<Entity[]> {
  const db = getDb();
  if (!db) return []; // Build without credentials

  const { data, error } = await db
    .from("entities")
    .select(ENTITY_COLUMNS)
    .eq("type", "alternative")
    .eq("status", "active")
    .order("title")
    .limit(100);

  if (error) {
    console.error("Error fetching alternative treatments:", error);
    return [];
  }

  return (data || []).map((row) => mapRowToEntity(row, "alternative"));
}

export async function getInvestigationalServer(): Promise<Entity[]> {
  const db = getDb();
  if (!db) return []; // Build without credentials

  const { data, error } = await db
    .from("entities")
    .select(ENTITY_COLUMNS)
    .eq("type", "investigational")
    .eq("status", "active")
    .order("title")
    .limit(100);

  if (error) {
    console.error("Error fetching investigational treatments:", error);
    return [];
  }

  return (data || []).map((row) => mapRowToEntity(row, "investigational"));
}

export async function getAllTreatmentsServer(): Promise<Entity[]> {
  // Check cache first - critical during build to prevent repeated queries
  const cached = getCached('all-treatments');
  if (cached) return cached;

  const treatmentTypes = [
    "medication",
    "therapy",
    "interventional",
    "supplement",
    "treatment",
    "alternative",
    "investigational",
  ];

  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

  // Use direct database pool for faster queries (runtime only, skip during build to avoid connection issues)
  if (!isBuild && typeof window === 'undefined') {
    try {
      const { queryWithRetry } = await import('@/lib/config/db-pool');
      const typeList = treatmentTypes.map(t => `'${t}'`).join(',');
      const result = await queryWithRetry(
        `SELECT ${ENTITY_SQL_COLUMNS} FROM entities WHERE type IN (${typeList}) AND status = $1 ORDER BY title LIMIT 500`,
        ['active']
      );

      const mappedData = (result.rows || []).map((row: any) => {
        const type = row.type as any;
        return mapRowToEntity(row, type);
      });

      // Deduplicate by slug - keep the first occurrence
      const seen = new Set<string>();
      const deduplicated = mappedData.filter((entity: Entity) => {
        if (seen.has(entity.slug)) return false;
        seen.add(entity.slug);
        return true;
      });

      // Cache the result
      setCache('all-treatments', deduplicated);
      return deduplicated;
    } catch (poolError) {
      console.warn('Direct pool query failed for getAllTreatments, falling back to Supabase:', poolError);
      // Fall through to Supabase client
    }
  }

  // Use Supabase client (build-time and fallback)
  const db = getDb();
  if (!db) return []; // Build without credentials

  try {
    const { data, error } = await db
      .from("entities")
      .select(ENTITY_COLUMNS)
      .in("type", treatmentTypes)
      .eq("status", "active")
      .order("title")
      .limit(500);

    if (error) {
      console.error("Error fetching all treatments:", error);
      return [];
    }

    const mappedData = (data || []).map((row) => {
      // Map each entity with its correct type
      const type = row.type as any;
      return mapRowToEntity(row, type);
    });

    // Deduplicate by slug - keep the first occurrence
    const seen = new Set<string>();
    const result = mappedData.filter((entity) => {
      if (seen.has(entity.slug)) return false;
      seen.add(entity.slug);
      return true;
    });

    // Cache the result
    setCache('all-treatments', result);
    return result;
  } catch (err) {
    console.error("Error fetching all treatments:", err);
    return [];
  }
}

export async function getConditionsServer(): Promise<Entity[]> {
  // Read from data/ files (src/lib/data/local-queries.ts), not Supabase.
  return getConditionsLocal();
}

export async function getConditionsByCategoryServer(category: string): Promise<Entity[]> {
  return getConditionsByCategoryLocal(category);
}

export async function getResourcesServer(): Promise<Entity[]> {
  return getResourcesLocal();
}

export async function getResourcesByCategoryServer(category: string): Promise<Entity[]> {
  return getResourcesByCategoryLocal(category);
}

export async function getOtherConditionsSubcategoryServer(subcategory: string): Promise<Entity[]> {
  return getOtherConditionsSubcategoryLocal(subcategory);
}

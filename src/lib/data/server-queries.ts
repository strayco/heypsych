// src/lib/data/server-queries.ts - Server-only data fetching utilities
import { supabase } from "@/lib/config/database";
import { mapRowToEntity, TREATMENT_TYPE_MAP } from "@/lib/data/entity-mappers";
import type { Entity } from "@/lib/types/database";

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

  try {
    const { data, error} = await supabase
      .from("entities")
      .select("*")
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
  const { data, error } = await supabase
    .from("entities")
    .select("*")
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
  const { data, error } = await supabase
    .from("entities")
    .select("*")
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
  const { data, error } = await supabase
    .from("entities")
    .select("*")
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
  const { data, error } = await supabase
    .from("entities")
    .select("*")
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
  const { data, error } = await supabase
    .from("entities")
    .select("*")
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
        `SELECT * FROM entities WHERE type IN (${typeList}) AND status = $1 ORDER BY title LIMIT 500`,
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
  try {
    const { data, error } = await supabase
      .from("entities")
      .select("*")
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
  // Check cache first
  const cached = getCached('conditions');
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("type", "condition")
      .eq("status", "active")
      .order("title")
      .limit(200);

    if (error) {
      console.error("Error fetching conditions:", error);
      return [];
    }

    const result = (data || []).map((row) => mapRowToEntity(row, "condition"));
    setCache('conditions', result);
    return result;
  } catch (err) {
    console.error("Error fetching conditions:", err);
    return [];
  }
}

export async function getConditionsByCategoryServer(category: string): Promise<Entity[]> {
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("type", "condition")
    .eq("status", "active")
    .eq("metadata->>category", category)
    .order("title");

  if (error) {
    console.error(`Error fetching conditions for category ${category}:`, error);
    return [];
  }

  return (data || []).map((row) => mapRowToEntity(row, "condition"));
}

export async function getResourcesServer(): Promise<Entity[]> {
  // Check cache first
  const cached = getCached('resources');
  if (cached) return cached;

  // Fetch all resources for client-side search and navigation features
  // Limit set to 500 to support growth while preventing runaway queries
  try {
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("type", "resource")
      .eq("status", "active")
      .order("title")
      .limit(500);

    if (!error && data && data.length > 0) {
      // Deduplicate by name during mapping for better performance
      const byName = new Map<string, Entity>();

      for (const row of data) {
        const entity = mapRowToEntity(row, "resource");
        const existing = byName.get(entity.name);

        // If no existing entry or current has longer slug (more descriptive), add it
        if (!existing || entity.slug.length > existing.slug.length) {
          byName.set(entity.name, entity);
        }
      }

      const result = Array.from(byName.values());
      setCache('resources', result);
      return result;
    }
  } catch (err) {
    console.error("Database error loading resources:", err);
  }

  // Fallback to empty array - resources are primarily loaded via API route
  return [];
}

export async function getResourcesByCategoryServer(category: string): Promise<Entity[]> {
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("type", "resource")
    .eq("status", "active")
    .eq("metadata->>category", category)
    .order("metadata->>order", { ascending: true, nullsFirst: false })
    .order("title");

  if (error) {
    console.error(`Error fetching resources for category ${category}:`, error);
    return [];
  }

  return (data || []).map((row) => mapRowToEntity(row, "resource"));
}

export async function getOtherConditionsSubcategoryServer(subcategory: string): Promise<Entity[]> {
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("type", "condition")
    .eq("status", "active")
    .eq("metadata->>category", `other-conditions/${subcategory}`)
    .order("title");

  if (error) {
    console.error(`Error fetching conditions for subcategory ${subcategory}:`, error);
    return [];
  }

  return (data || []).map((row) => mapRowToEntity(row, "condition"));
}

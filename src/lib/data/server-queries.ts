// src/lib/data/server-queries.ts - Server-only data fetching utilities
import { supabase } from "@/lib/config/database";
import { mapRowToEntity, TREATMENT_TYPE_MAP } from "@/lib/data/entity-mappers";
import type { Entity } from "@/lib/types/database";

/**
 * Server-side data fetching utilities
 * These run on Vercel's servers during SSR, eliminating cold start delays
 */

export async function getMedicationsServer(): Promise<Entity[]> {
  const { data, error} = await supabase
    .from("entities")
    .select("*")
    .in("type", TREATMENT_TYPE_MAP.medication)
    .eq("status", "active")
    .order("title")
    .limit(500); // Increased from 200 to account for duplicate type entries

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

  return Array.from(bySlug.values());
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
  return mappedData.filter((entity) => {
    if (seen.has(entity.slug)) return false;
    seen.add(entity.slug);
    return true;
  });
}

export async function getConditionsServer(): Promise<Entity[]> {
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

  return (data || []).map((row) => mapRowToEntity(row, "condition"));
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
  // For resources, we load from JSON files since some categories (like knowledge-hub) are JSON-only
  // This matches the client-side behavior
  try {
    // Try database first
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("type", "resource")
      .eq("status", "active")
      .order("title");

    if (!error && data && data.length > 0) {
      return data.map((row) => mapRowToEntity(row, "resource"));
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

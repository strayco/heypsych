// src/lib/hooks/use-entities.ts - Updated with consistent Entity types
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/config/database";
import type { EntitiesRow, MappedEntity, EntityType, SchemaName } from "@/lib/types/database";
import { EntityService } from "@/lib/data/entity-service";
import { mapRowToEntity, TREATMENT_TYPE_MAP } from "@/lib/data/entity-mappers";

// Map category ("medications/...", "therapy/...") -> schema name used in UI
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

// DB row -> UI shape
function mapRowToEntityShape(row: any): MappedEntity<any> {
  const schemaName = categoryToSchemaName(
    (row.metadata as any)?.category ?? (row.content as any)?.category
  );
  const display = schemaName.charAt(0).toUpperCase() + schemaName.slice(1);

  return {
    id: row.id,
    slug: row.slug,
    name: row.title || row.name,
    summary: row.description ?? "",
    schema: { schema_name: schemaName, display_name: display },
    metadata: (row.metadata as any) || {}, // <-- add this line
    data: (row.content as any) || {},
    pillar: (row as any).pillar, // Preserve pillar field from resource index
    raw: row,
  };
}

/* ------- MAIN ENTITY HOOKS ------- */

/**
 * MAIN HOOK: This uses EntityService.getBySlug() which we enhanced
 */
export function useEntity(slug: string) {
  return useQuery({
    queryKey: ["entity", slug],
    queryFn: () => EntityService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });
}

/** Uses EntityService.getBySchemaType() */
export function useEntitiesBySchema(schemaName: string) {
  return useQuery({
    queryKey: ["entities", "schema", schemaName],
    queryFn: () => EntityService.getBySchemaType(schemaName),
    staleTime: 5 * 60 * 1000,
  });
}

/** Uses EntityService.getAllTreatments() */
export function useAllTreatments() {
  return useQuery({
    queryKey: ["treatments", "all"],
    queryFn: () => EntityService.getAllTreatments(),
    staleTime: 5 * 60 * 1000,
  });
}

/* ------- TREATMENT HOOKS - ALL USE DIRECT SUPABASE QUERIES FOR CONSISTENCY ------- */

/** Direct Supabase query for medications */
export function useMedications() {
  return useQuery({
    queryKey: ["treatments", "medications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .in("type", TREATMENT_TYPE_MAP.medication)
        .eq("status", "active")
        .order("title");

      if (error) throw error;
      const mappedData = (data || []).map((row) => mapRowToEntity(row, "medication"));

      // Deduplicate by slug - keep the first occurrence (which has preferred type="medication")
      const seen = new Set<string>();
      return mappedData.filter((entity) => {
        if (seen.has(entity.slug)) {
          return false;
        }
        seen.add(entity.slug);
        return true;
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Direct Supabase query for interventional treatments */
export function useInterventionalTreatments() {
  return useQuery({
    queryKey: ["treatments", "interventional"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("type", "interventional")
        .eq("status", "active")
        .order("title");

      if (error) throw error;
      return (data || []).map((row) => mapRowToEntity(row, "interventional"));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Direct Supabase query for supplements */
export function useSupplements() {
  return useQuery({
    queryKey: ["treatments", "supplements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("type", "supplement")
        .eq("status", "active")
        .order("title");

      if (error) throw error;
      return (data || []).map((row) => mapRowToEntity(row, "supplement"));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Direct Supabase query for therapies */
export function useTherapies() {
  return useQuery({
    queryKey: ["treatments", "therapy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("type", "therapy")
        .eq("status", "active")
        .order("title");

      if (error) throw error;
      return (data || []).map((row) => mapRowToEntity(row, "therapy"));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Direct Supabase query that returns proper Entity structure */
export function useAlternativeTreatments() {
  return useQuery({
    queryKey: ["treatments", "alternative"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("type", "alternative")
        .eq("status", "active")
        .order("title");

      if (error) throw error;
      return (data || []).map((row) => mapRowToEntity(row, "alternative"));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Direct Supabase query that returns proper Entity structure */
export function useInvestigationalTreatments() {
  return useQuery({
    queryKey: ["treatments", "investigational"],
    queryFn: async () => {
      const { data, error} = await supabase
        .from("entities")
        .select("*")
        .eq("type", "investigational")
        .eq("status", "active")
        .order("title");

      if (error) throw error;
      return (data || []).map((row) => mapRowToEntity(row, "investigational"));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Specific hook for assessments */
export function useAssessments() {
  return useQuery({
    queryKey: ["resources", "assessments-screeners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("type", "resource")
        .eq("metadata->>category", "assessments-screeners")
        .eq("status", "active")
        .order("metadata->>order", { ascending: true, nullsFirst: false })
        .order("title");

      if (error) throw error;
      return (data || []).map((row) => mapRowToEntity(row, "resource"));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/* ------- DIRECT SUPABASE QUERIES (return MappedEntity) ------- */

/** Direct Supabase query - no EntityService dependency */
export function useEntityByType<T = any>(type: EntityType, slug: string) {
  return useQuery<MappedEntity<T> | null>({
    queryKey: ["entity", type, slug],
    enabled: !!type && !!slug,
    queryFn: async () => {
      // First, try the database
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("type", type)
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      if (!error && data) {
        return mapRowToEntityShape(data as EntitiesRow) as MappedEntity<T>;
      }

      // Fallback: try the API route (loads from JSON files)
      console.log(`🔍 Entity '${slug}' (${type}) not found in database, trying API fallback...`);

      try {
        // Determine API endpoint based on type
        let apiPath = "";
        if (type === "condition") {
          apiPath = `/api/conditions/${slug}`;
        } else if (
          [
            "medication",
            "therapy",
            "interventional",
            "supplement",
            "treatment",
            "alternative",
            "investigational",
          ].includes(type)
        ) {
          apiPath = `/api/treatments/${slug}`;
        } else if (type === "resource") {
          apiPath = `/api/resources/${slug}`;
        }

        if (apiPath) {
          const response = await fetch(apiPath);

          if (response.ok) {
            const entityData = await response.json();
            console.log(`✅ Found ${slug} via API`);
            return mapRowToEntityShape(entityData as EntitiesRow) as MappedEntity<T>;
          }
        }
      } catch (err) {
        console.error(`Error fetching ${type} from API:`, err);
      }

      console.log(`❌ Entity '${slug}' (${type}) not found in database or API`);
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Direct Supabase query for conditions */
export function useConditions() {
  return useQuery({
    queryKey: ["conditions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("type", "condition")
        .eq("status", "active")
        .order("title");

      if (error) throw error;
      return data?.map(mapRowToEntityShape) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Direct Supabase query for conditions by category */
export function useConditionsByCategory(category: string) {
  return useQuery({
    queryKey: ["conditions", "category", category],
    enabled: !!category,
    queryFn: async () => {
      console.log('🔍 Querying conditions for category:', category);

      try {
        const { data, error } = await supabase
          .from("entities")
          .select("*")
          .eq("type", "condition")
          .eq("status", "active")
          .eq("metadata->>category", category)
          .order("title");

        console.log('📊 Query result:', {
          success: !error,
          count: data?.length || 0,
          error: error?.message
        });

        if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
        }
        return data?.map(mapRowToEntityShape) || [];
      } catch (err) {
        console.error('❌ Query failed:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Direct Supabase query for treatments by category */
export function useTreatmentsByCategory(category: string) {
  return useQuery({
    queryKey: ["treatments", "category", category],
    enabled: !!category,
    queryFn: async () => {
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
      return data?.map(mapRowToEntityShape) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Direct Supabase query for search */
export function useEntitySearch(query: string, schemaType?: string) {
  return useQuery({
    queryKey: ["entities", "search", query, schemaType],
    enabled: query.length > 2,
    queryFn: async () => {
      let supabaseQuery = supabase
        .from("entities")
        .select("*")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq("status", "active")
        .limit(20);

      if (schemaType) {
        // Map schema type to entity type for filtering
        const entityType = schemaType === "medication" ? "medication" : schemaType;
        supabaseQuery = supabaseQuery.eq("type", entityType);
      }

      const { data, error } = await supabaseQuery;
      if (error) throw error;
      return data?.map(mapRowToEntityShape) || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

/** Direct Supabase query for treatment search */
export function useTreatmentSearch(query: string) {
  return useQuery({
    queryKey: ["treatments", "search", query],
    enabled: query.length > 2,
    queryFn: async () => {
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
      return data?.map(mapRowToEntityShape) || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

/** Direct Supabase query for providers */
export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("type", "provider")
        .eq("status", "active")
        .order("title");

      if (error) throw error;
      return data?.map(mapRowToEntityShape) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Direct Supabase query for resources */
export function useResources() {
  return useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      // For resources, ALWAYS load from JSON files (includes knowledge-hub articles)
      // The database may have some resources but not all (knowledge-hub is JSON-only)
      console.log("📂 Loading resources from JSON files...");
      try {
        const response = await fetch("/api/resources");
        if (response.ok) {
          const { resources } = await response.json();
          console.log(`✅ Loaded ${resources.length} resources from JSON`);
          return resources.map(mapRowToEntityShape);
        }
      } catch (err) {
        console.error("Error loading resources from API:", err);
      }

      // Fallback to database if API fails
      console.log("⚠️ API failed, trying database...");
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("type", "resource")
        .eq("status", "active")
        .order("title");

      if (!error && data && data.length > 0) {
        console.log(`✅ Loaded ${data.length} resources from database`);
        return data.map(mapRowToEntityShape);
      }

      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/* ------- ALIASES for compatibility ------- */

/** Convenience alias for treatment pages */
export function useTreatment<T = any>(slug: string) {
  return useEntityByType<T>("treatment", slug);
}

/** Alias for therapy treatments */
export function useTherapyTreatments() {
  return useTherapies();
}

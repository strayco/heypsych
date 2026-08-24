// src/lib/hooks/use-entities.ts - Updated with consistent Entity types
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/config/database";
import type { EntitiesRow, MappedEntity, EntityType, SchemaName } from "@/lib/types/database";
import { EntityService } from "@/lib/data/entity-service";
import { mapRowToEntity, normalizeEntityContent, TREATMENT_TYPE_MAP, categoryToSchemaName } from "@/lib/data/entity-mappers";

// categoryToSchemaName is now imported from entity-mappers.ts (single source of truth)

// DB row -> UI shape
function mapRowToEntityShape(row: any): MappedEntity<any> {
  const schemaName = categoryToSchemaName(
    (row.metadata as any)?.category ?? (row.content as any)?.category
  );
  const display = schemaName.charAt(0).toUpperCase() + schemaName.slice(1);
  const normalizedContent = normalizeEntityContent((row.content as any) || {});

  return {
    id: row.id,
    slug: row.slug,
    name: row.title || row.name,
    summary: row.description ?? "",
    schema: { schema_name: schemaName, display_name: display },
    metadata: (row.metadata as any) || {},
    data: normalizedContent || {},
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
        .order("title")
        .limit(200); // Prevent unbounded query

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
        .order("title")
        .limit(100); // Prevent unbounded query

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
        .order("title")
        .limit(100); // Prevent unbounded query

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
        .order("title")
        .limit(100); // Prevent unbounded query

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
        .order("title")
        .limit(100); // Prevent unbounded query

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
        .order("title")
        .limit(100); // Prevent unbounded query

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

/** Direct Supabase query - no EntityService dependency, no API fallback */
export function useEntityByType<T = any>(type: EntityType, slug: string) {
  return useQuery<MappedEntity<T> | null>({
    queryKey: ["entity", type, slug],
    enabled: !!type && !!slug,
    queryFn: async () => {
      // Query database only - NO API FALLBACK
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

      console.log(`❌ Entity '${slug}' (${type}) not found in database`);
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
        .order("title")
        .limit(200); // Prevent unbounded query

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
        .order("title")
        .limit(200); // Prevent unbounded query

      if (error) throw error;
      return data?.map(mapRowToEntityShape) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Direct Supabase query for resources - database only, no API fallback */
export function useResources() {
  return useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      // Query database only - NO API FALLBACK
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("type", "resource")
        .eq("status", "active")
        .order("title")
        .limit(200);

      if (error) {
        console.error("Error loading resources:", error);
        return [];
      }

      console.log(`✅ Loaded ${data.length} resources from database`);
      return data.map(mapRowToEntityShape);
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

/**
 * Fetch individual provider from NPI Registry API
 * Extracts NPI number from slug format: dr-firstname-lastname-XXXXXXXXXX
 */
export function useProvider(slug: string) {
  // Extract NPI number from slug (last 10 digits)
  const npiMatch = slug.match(/(\d{10})$/);
  const npi = npiMatch?.[1];

  return useQuery({
    queryKey: ["provider", npi],
    enabled: !!npi,
    queryFn: async () => {
      if (!npi) return null;

      const response = await fetch(`/api/providers/${npi}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch provider");
      }

      const data = await response.json();
      return data.provider;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
  });
}

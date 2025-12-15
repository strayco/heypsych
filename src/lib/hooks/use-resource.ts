// src/lib/hooks/use-resources.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/config/database";
import { normalizeResource } from "@/lib/data/resource-normalizer";

type EntityRow = {
  content: unknown;
  slug: string;
  status: string;
  metadata?: Record<string, unknown> | null;
};

// REMOVED: No API fallback allowed
// Resources must exist in database

const hasKnowledgeHubContent = (resource: any): boolean => {
  if (!resource || typeof resource !== "object") return false;
  if (Array.isArray(resource.body) && resource.body.length > 0) return true;
  if (Array.isArray(resource.sections) && resource.sections.length > 0) return true;
  if (Array.isArray(resource.content?.body) && resource.content.body.length > 0) return true;
  if (Array.isArray(resource.content?.sections) && resource.content.sections.length > 0)
    return true;
  if (resource.introduction || resource.content?.introduction) return true;
  if (resource.conclusion || resource.content?.conclusion) return true;
  return false;
};

export function useResource(slug: string) {
  return useQuery({
    queryKey: ["resource", slug],
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("entities")
          .select("content, slug, status, metadata")
          .eq("type", "resource")
          .eq("slug", slug)
          .eq("status", "active")
          .single<EntityRow>();

        if (!error && data) {
          const mergedContent = data.content ? { ...(data.content as any) } : {};
          if (data.metadata) {
            mergedContent.metadata = {
              ...(mergedContent.metadata || {}),
              ...(data.metadata as Record<string, unknown>),
            };
          }
          if (data.slug && !mergedContent.slug) {
            mergedContent.slug = data.slug;
          }
          return normalizeResource(mergedContent);
        }

        console.log(`❌ Resource '${slug}' not found in database`);
        return null;
      } catch (err) {
        console.error("Error fetching resource:", err);
        return null;
      }
    },
  });
}

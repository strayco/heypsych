// src/lib/data/resource-normalizer.ts
import { AnyResourceZ } from "@/lib/schemas/resource";
import { transformKnowledgeHubArticle, buildBodyFromLegacy } from "@/lib/utils/resource-shape";

function buildCrosslinks(resource: any): Array<{ slug: string; type: 'condition' | 'treatment' | 'resource'; display: string }> {
  const crosslinks: Array<{ slug: string; type: 'condition' | 'treatment' | 'resource'; display: string }> = [];
  
  if (Array.isArray(resource.relatedConditionSlugs)) {
    for (const slug of resource.relatedConditionSlugs) {
      if (typeof slug === 'string' && slug.trim()) {
        crosslinks.push({
          slug,
          type: 'condition',
          display: slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        });
      }
    }
  }
  
  if (Array.isArray(resource.relatedTreatmentSlugs)) {
    for (const slug of resource.relatedTreatmentSlugs) {
      if (typeof slug === 'string' && slug.trim()) {
        crosslinks.push({
          slug,
          type: 'treatment',
          display: slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        });
      }
    }
  }
  
  if (Array.isArray(resource.relatedResourceSlugs)) {
    for (const slug of resource.relatedResourceSlugs) {
      if (typeof slug === 'string' && slug.trim()) {
        crosslinks.push({
          slug,
          type: 'resource',
          display: slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        });
      }
    }
  }
  
  return crosslinks;
}

function normalizeLegacyResource(content: any) {
  if (!content || typeof content !== "object") return content;

  const normalized = { ...content };
  const metadata = { ...(content.metadata || {}) };
  let category: string | undefined = metadata.category || content.category;

  if (category === "articles-blogs" || category === "articles-guides" || category === "articles") {
    category = "knowledge-hub";
  }

  if (category && metadata.category !== category) {
    metadata.category = category;
  }

  normalized.metadata = metadata;

  if (category === "knowledge-hub") {
    const upgraded = transformKnowledgeHubArticle(normalized);
    upgraded.body = upgraded.body || buildBodyFromLegacy(upgraded);
    return upgraded;
  }

  if (!normalized.sections && Array.isArray(normalized.content?.sections)) {
    normalized.sections = normalized.content.sections;
  }

  // Build crosslinks for all resource types
  const crosslinks = buildCrosslinks(normalized);
  if (crosslinks.length > 0) {
    normalized.crosslinks = crosslinks;
  }

  return normalized;
}

export function normalizeResource(content: unknown) {
  try {
    const parsed = AnyResourceZ.parse(normalizeLegacyResource(content));

    parsed.name = String(parsed.name ?? "");
    if (parsed.description != null) parsed.description = String(parsed.description);
    return parsed;
  } catch (error) {
    console.error("Schema validation failed for:", (content as any)?.slug, error);
    throw error;
  }
}

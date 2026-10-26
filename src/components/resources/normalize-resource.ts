/**
 * The props every resource renderer receives: the entity with entity.data
 * flattened to the top level, Knowledge Hub metadata mapped, and crosslinks
 * built from related slugs. Shared by ResourceDetailClient and the
 * assessment shell so the questionnaire gets exactly the same resource.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ResourceCrossLink = { slug: string; type: "condition" | "treatment" | "resource"; display: string };

export function buildCrosslinksFromSlugs(res: any): ResourceCrossLink[] {
  if (res.crosslinks && res.crosslinks.length > 0) {
    return res.crosslinks;
  }

  const crosslinks: ResourceCrossLink[] = [];
  const slugToDisplay = (slug: string) =>
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const conditionSlugs = res.relatedConditionSlugs || res.data?.relatedConditionSlugs;
  const treatmentSlugs = res.relatedTreatmentSlugs || res.data?.relatedTreatmentSlugs;
  const resourceSlugs = res.relatedResourceSlugs || res.data?.relatedResourceSlugs;

  const add = (slugs: unknown, type: ResourceCrossLink["type"]) => {
    if (!Array.isArray(slugs)) return;
    for (const slug of slugs) {
      if (typeof slug === "string" && slug.trim()) crosslinks.push({ slug, type, display: slugToDisplay(slug) });
    }
  };
  add(conditionSlugs, "condition");
  add(treatmentSlugs, "treatment");
  add(resourceSlugs, "resource");

  return crosslinks;
}

export function normalizeResource(resource: any): any {
  return {
    // Flatten server-side entity.data so renderers can read body/sections at the top level
    ...(resource?.data || {}),
    ...resource,
    // Map Knowledge Hub article metadata fields
    author: resource.author || resource.metadata?.author,
    reading_time: resource.reading_time || resource.metadata?.read_time,
    tags: resource.tags || resource.metadata?.topics,
    // Pass pre-validated tags from server (no client-side validation needed)
    validated_tags: resource.validated_tags || [],
    // Cross-links for related entities (build from slugs if not present)
    crosslinks: buildCrosslinksFromSlugs(resource),
    // Conditions for assessments
    conditions: resource.conditions || [],
  };
}

/**
 * CATEGORY HUB SLUG RESOLUTION
 *
 * Two vocabularies describe the same clinician tool categories:
 *
 *  - the *schema* slug stored on each tool record and used in product URLs
 *    (`/tools/for-clinicians/billing-rcm-insurance/thrizer`)
 *  - the *taxonomy* slug served by the category hub route
 *    (`/tools/for-clinicians/billing-rcm`)
 *
 * `/tools/for-clinicians/[category]` resolves slugs against the taxonomy only,
 * so emitting a raw schema slug as a hub URL produced a 404. Production
 * evidence (2026-08-25): 6 of the 9 category hubs listed in sitemap-tools.xml
 * returned 404, including billing-rcm-insurance and care-coordination-referrals.
 *
 * Anything that builds a category hub URL must translate through here and
 * verify the hub actually exists.
 */

import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import clinicianCategoriesData from "../../../data/tools-v4/taxonomies/clinician-categories.json";

/** Taxonomy slugs the category hub route can actually render. */
export const TAXONOMY_HUB_SLUGS: ReadonlySet<string> = new Set(
  clinicianCategoriesData.categories.map((c) => c.slug)
);

/**
 * Translate a tool's schema category into the hub slug that renders it.
 *
 * @returns the renderable taxonomy slug, or `null` when no hub exists - in
 *          which case the URL must not be emitted anywhere.
 */
export function resolveCategoryHubSlug(schemaCategory: string): string | null {
  const taxonomySlug =
    SCHEMA_TO_TAXONOMY_CATEGORY[
      schemaCategory as keyof typeof SCHEMA_TO_TAXONOMY_CATEGORY
    ] ?? schemaCategory;

  return TAXONOMY_HUB_SLUGS.has(taxonomySlug) ? taxonomySlug : null;
}

/**
 * Build the canonical hub URL path for a schema category, or `null` when the
 * category has no renderable hub.
 */
export function categoryHubPath(schemaCategory: string): string | null {
  const slug = resolveCategoryHubSlug(schemaCategory);
  return slug ? `/tools/for-clinicians/${slug}` : null;
}

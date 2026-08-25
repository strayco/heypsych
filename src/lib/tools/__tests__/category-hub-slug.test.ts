// src/lib/tools/__tests__/category-hub-slug.test.ts
// Regression tests for category hub URLs that 404'd from the sitemap.
//
// Production evidence (2026-08-25) - sitemap-tools.xml listed 9 category hubs,
// 6 of which returned 404 because the sitemap emitted schema category slugs
// while /tools/for-clinicians/[category] only resolves taxonomy slugs:
//
//   ai-copilot-clinical            404
//   billing-rcm-insurance          404
//   care-coordination-referrals    404
//   compliance-consent-security    404
//   measurement-outcomes-dtx       404
//   provider-network-virtual-care  404
//   ai-scribe-documentation        200
//   ehr-practice-management        200
//   telehealth-communication       200

import { describe, it, expect } from "vitest";
import {
  resolveCategoryHubSlug,
  categoryHubPath,
  TAXONOMY_HUB_SLUGS,
} from "../category-hub-slug";
import { ClinicianProductCategoryZ } from "@/lib/schemas/clinician-tool-v4";

/** The exact schema slugs that produced 404 hub URLs in production. */
const PREVIOUSLY_404 = [
  "ai-copilot-clinical",
  "billing-rcm-insurance",
  "care-coordination-referrals",
  "compliance-consent-security",
  "measurement-outcomes-dtx",
  "provider-network-virtual-care",
];

describe("resolveCategoryHubSlug", () => {
  it.each(PREVIOUSLY_404)(
    "resolves %s to a hub slug the route can render",
    (schemaCategory) => {
      const slug = resolveCategoryHubSlug(schemaCategory);
      expect(slug).not.toBeNull();
      expect(TAXONOMY_HUB_SLUGS.has(slug as string)).toBe(true);
    }
  );

  it("leaves categories whose slugs already match unchanged", () => {
    expect(resolveCategoryHubSlug("ehr-practice-management")).toBe(
      "ehr-practice-management"
    );
    expect(resolveCategoryHubSlug("telehealth-communication")).toBe(
      "telehealth-communication"
    );
  });

  it("returns null for a category with no renderable hub", () => {
    expect(resolveCategoryHubSlug("not-a-real-category")).toBeNull();
  });

  it("resolves every schema category defined by the V4 schema", () => {
    // If a new category is added to the schema without a taxonomy hub, this
    // fails rather than silently shipping another 404 into the sitemap.
    const unresolved = ClinicianProductCategoryZ.options.filter(
      (category) => resolveCategoryHubSlug(category) === null
    );

    expect(unresolved).toEqual([]);
  });

  it("only ever yields slugs present in the taxonomy", () => {
    for (const category of ClinicianProductCategoryZ.options) {
      const slug = resolveCategoryHubSlug(category);
      if (slug !== null) {
        expect(TAXONOMY_HUB_SLUGS.has(slug)).toBe(true);
      }
    }
  });
});

describe("categoryHubPath", () => {
  it("builds a hub path under /tools/for-clinicians", () => {
    expect(categoryHubPath("billing-rcm-insurance")).toBe(
      "/tools/for-clinicians/billing-rcm"
    );
  });

  it("returns null rather than an unrenderable path", () => {
    expect(categoryHubPath("not-a-real-category")).toBeNull();
  });

  it("collapses categories that share a hub to the same path", () => {
    // ai-copilot-clinical is folded into clinical-decision-support, so both
    // must resolve to one canonical hub instead of two competing URLs.
    expect(categoryHubPath("ai-copilot-clinical")).toBe(
      categoryHubPath("clinical-decision-support")
    );
  });
});

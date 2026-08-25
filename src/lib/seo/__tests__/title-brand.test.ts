// src/lib/seo/__tests__/title-brand.test.ts
// Regression tests for the duplicate brand suffix defect.
//
// Production evidence (2026-08-25) showed titles rendering as
// "Generalized Anxiety Disorder | HeyPsych | HeyPsych" because the root layout
// declares title.template = "%s | HeyPsych" while metadata generators also
// appended the brand.

import { describe, it, expect } from "vitest";
import {
  stripBrandTitleSuffix,
  hasDuplicateBrand,
  renderedTitleLength,
  BRAND_TITLE_SUFFIX,
} from "../title";
import { MetadataFactory } from "../metadata-factory";
import type { Entity } from "@/lib/types/database";

/** Simulate what Next.js renders: the layout template appends the brand. */
function renderWithTemplate(pageTitle: string): string {
  return `${pageTitle}${BRAND_TITLE_SUFFIX}`;
}

describe("stripBrandTitleSuffix", () => {
  it("removes a single trailing brand suffix", () => {
    expect(stripBrandTitleSuffix("Generalized Anxiety Disorder | HeyPsych")).toBe(
      "Generalized Anxiety Disorder"
    );
  });

  it("collapses an already-doubled brand suffix", () => {
    expect(
      stripBrandTitleSuffix("Generalized Anxiety Disorder | HeyPsych | HeyPsych")
    ).toBe("Generalized Anxiety Disorder");
  });

  it("removes brand suffixes using dash separators", () => {
    expect(stripBrandTitleSuffix("Nightmare Disorder - HeyPsych")).toBe(
      "Nightmare Disorder"
    );
  });

  it("preserves internal pipes that are part of the title", () => {
    expect(
      stripBrandTitleSuffix("988 Lifeline | 24/7 Crisis Support | HeyPsych")
    ).toBe("988 Lifeline | 24/7 Crisis Support");
  });

  it("does not strip the brand when it is part of a longer trailing phrase", () => {
    // "HeyPsych Tools Directory" is descriptive copy, not a brand suffix.
    expect(stripBrandTitleSuffix("List Your Tool | HeyPsych Tools Directory")).toBe(
      "List Your Tool | HeyPsych Tools Directory"
    );
  });

  it("never reduces a bare brand title to an empty string", () => {
    expect(stripBrandTitleSuffix("HeyPsych")).toBe("HeyPsych");
  });

  it("leaves unbranded titles untouched", () => {
    expect(stripBrandTitleSuffix("Sertraline (Zoloft): Uses & Dosage")).toBe(
      "Sertraline (Zoloft): Uses & Dosage"
    );
  });
});

describe("rendered title never duplicates the brand", () => {
  // These are the exact titles observed on production before the fix.
  const productionTitles = [
    "Generalized Anxiety Disorder | HeyPsych",
    "Major Depressive Disorder | HeyPsych",
    "Nightmare Disorder: Symptoms, Treatment & Support | HeyPsych",
    "Mental Health Tools & Apps | HeyPsych",
    "Daylio | HeyPsych",
  ];

  it.each(productionTitles)(
    "renders %s with exactly one brand token",
    (pageTitle) => {
      const rendered = renderWithTemplate(stripBrandTitleSuffix(pageTitle));
      expect(hasDuplicateBrand(rendered)).toBe(false);
      expect(rendered.match(/HeyPsych/g)).toHaveLength(1);
    }
  );

  it("detects duplication when normalization is skipped", () => {
    // Guards the guard: hasDuplicateBrand must actually catch the old bug.
    const rendered = renderWithTemplate("Generalized Anxiety Disorder | HeyPsych");
    expect(hasDuplicateBrand(rendered)).toBe(true);
  });
});

describe("MetadataFactory output feeds the layout template safely", () => {
  function createEntity(type: string, name: string): Entity {
    return {
      id: `${type}-fixture`,
      slug: `${type}-fixture`,
      name,
      type,
      schema_id: `${type}-v1`,
      status: "active",
      visibility: "public",
      description: `A description of ${name} used for metadata generation.`,
      data: {},
      metadata: {},
    } as unknown as Entity;
  }

  const cases: Array<[string, string]> = [
    ["condition", "Generalized Anxiety Disorder"],
    ["medication", "Sertraline"],
    ["therapy", "Cognitive Behavioral Therapy"],
    ["resource", "Daylio"],
  ];

  it.each(cases)(
    "%s metadata title carries no brand for the template to duplicate",
    async (type, name) => {
      const metadata = await MetadataFactory.generate(createEntity(type, name));
      const title = metadata.title;

      expect(typeof title).toBe("string");
      expect(title as string).not.toMatch(/HeyPsych/);

      // And once the layout template appends the brand, exactly one remains.
      const rendered = `${title as string}${BRAND_TITLE_SUFFIX}`;
      expect(hasDuplicateBrand(rendered)).toBe(false);
    }
  );

  it("keeps the rendered title within the 60 character budget", async () => {
    const metadata = await MetadataFactory.generate(
      createEntity("condition", "Generalized Anxiety Disorder")
    );
    expect(renderedTitleLength(metadata.title as string)).toBeLessThanOrEqual(60);
  });

  it("does not brand the not-found title twice", async () => {
    const metadata = await MetadataFactory.generate(null);
    const rendered = `${metadata.title as string}${BRAND_TITLE_SUFFIX}`;
    expect(hasDuplicateBrand(rendered)).toBe(false);
  });
});

describe("renderedTitleLength", () => {
  it("accounts for the brand suffix the layout appends", () => {
    const stem = "Sertraline (Zoloft): Uses & Dosage";
    expect(renderedTitleLength(stem)).toBe(stem.length + BRAND_TITLE_SUFFIX.length);
  });

  it("matches the length of the actually rendered title", () => {
    const stem = "Panic Disorder: Symptoms, Treatment & Support";
    expect(renderedTitleLength(stem)).toBe(renderWithTemplate(stem).length);
  });
});

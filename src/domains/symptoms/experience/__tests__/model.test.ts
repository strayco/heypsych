import { describe, expect, it } from "vitest";
import { SYMPTOM_REGISTRY } from "../../registry";
import { buildSymptomExperience } from "../model";
import { RESOURCE_SLUGS } from "@/lib/entities/entity-slugs.generated";

describe("every symptom", () => {
  for (const symptom of SYMPTOM_REGISTRY) {
    it(`${symptom.slug} builds a complete page`, () => {
      const x = buildSymptomExperience(symptom);
      expect(x.name).toBeTruthy();
      expect(x.lede).toBeTruthy();
      expect(x.glance.length).toBeGreaterThan(0);
      // Every condition link has a page; a missing one used to 404.
      for (const c of x.conditions) expect(c.hasPage, `${symptom.slug} → ${c.slug}`).toBe(true);
      // Related symptoms resolve to real symptom pages.
      expect(x.related.length).toBe(symptom.relatedSymptoms.length);
    });
  }

  it("links screeners to pages that exist", () => {
    for (const symptom of SYMPTOM_REGISTRY) {
      for (const a of symptom.assessmentLinks ?? []) {
        const slug = a.href.replace(/^\/resources\//, "");
        expect(RESOURCE_SLUGS.has(slug), `${symptom.slug} → ${a.href}`).toBe(true);
      }
    }
  });
});

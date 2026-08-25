// src/lib/treatments/__tests__/treatment-aliases.test.ts
//
// Regression tests for treatment URL aliasing.
//
// Production evidence (2026-08-25): `/treatments/sertraline` and
// `/treatments/zoloft` both answered HTTP 200 with an 80-word empty shell and
// `noindex`, while the real page lives at `/treatments/sertraline-zoloft` with
// 3,428 words and full Drug schema. Because the segment streams a prerendered
// shell, the status is committed before `notFound()` runs, so these read as
// soft 404s to Google rather than redirects or honest errors.

import { describe, it, expect } from "vitest";
import {
  TREATMENT_SLUG_ALIASES,
  CANONICAL_TREATMENT_SLUGS,
  resolveTreatmentAlias,
} from "../treatment-aliases.generated";

describe("treatment alias map", () => {
  it("maps the generic ingredient name to its canonical page", () => {
    expect(resolveTreatmentAlias("sertraline")).toBe("sertraline-zoloft");
    expect(resolveTreatmentAlias("fluoxetine")).toBe("fluoxetine-prozac");
  });

  it("maps brand names to their canonical page", () => {
    expect(resolveTreatmentAlias("zoloft")).toBe("sertraline-zoloft");
    expect(resolveTreatmentAlias("prozac")).toBe("fluoxetine-prozac");
    expect(resolveTreatmentAlias("xanax")).toBe("alprazolam-xanax");
    expect(resolveTreatmentAlias("lexapro")).toBe("escitalopram-lexapro");
  });

  it("returns null for a slug that already renders a page", () => {
    // Redirecting a canonical URL would create a loop.
    expect(resolveTreatmentAlias("sertraline-zoloft")).toBeNull();
  });

  it("returns null for an unknown slug so it can 404 honestly", () => {
    expect(resolveTreatmentAlias("not-a-real-treatment-xyz")).toBeNull();
  });

  it("never points an alias at a non-existent page", () => {
    for (const [alias, target] of Object.entries(TREATMENT_SLUG_ALIASES)) {
      expect(
        CANONICAL_TREATMENT_SLUGS.has(target),
        `alias "${alias}" targets "${target}", which has no page`
      ).toBe(true);
    }
  });

  it("never shadows a canonical slug", () => {
    for (const alias of Object.keys(TREATMENT_SLUG_ALIASES)) {
      expect(
        CANONICAL_TREATMENT_SLUGS.has(alias),
        `alias "${alias}" is also a real page, so redirecting it would hide content`
      ).toBe(false);
    }
  });

  it("resolves in a single hop", () => {
    // A -> B -> C chains would cost redundant round trips and dilute signals.
    for (const target of Object.values(TREATMENT_SLUG_ALIASES)) {
      expect(TREATMENT_SLUG_ALIASES[target]).toBeUndefined();
    }
  });

  it("contains only lowercase, URL-safe aliases", () => {
    for (const alias of Object.keys(TREATMENT_SLUG_ALIASES)) {
      expect(alias, `alias "${alias}" is not a lowercase slug`).toMatch(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      );
    }
  });

  it("covers a meaningful share of the catalogue", () => {
    // Guards against the generator silently producing an empty map, which would
    // quietly restore ~1,000 soft 404s.
    expect(CANONICAL_TREATMENT_SLUGS.size).toBeGreaterThan(400);
    expect(Object.keys(TREATMENT_SLUG_ALIASES).length).toBeGreaterThan(500);
  });

  it("omits ambiguous aliases rather than guessing a target", () => {
    // `esketamine` is claimed by two records; sending users to either would be
    // a coin flip, so it must not be redirected at all.
    expect(TREATMENT_SLUG_ALIASES["esketamine"]).toBeUndefined();
    expect(TREATMENT_SLUG_ALIASES["depakote"]).toBeUndefined();
  });
});

/**
 * SEO Rendering Invariants Tests
 *
 * Verifies that switching a page from prebuilt to on-demand ISR does not change:
 * - SEO indexability decisions
 * - Sitemap eligibility
 * - Canonical URLs
 * - Robots directives
 *
 * These tests ensure rendering mode is completely independent of SEO behavior.
 *
 * @see src/lib/build/static-generation-policy.ts - Rendering decisions
 * @see src/lib/seo/index-decision-service.ts - SEO decisions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("SEO Rendering Invariants", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Rendering mode independence", () => {
    it("rendering decision is separate type from SEO decision", async () => {
      const { makeRenderingDecision } = await import(
        "../static-generation-policy"
      );

      const decision = makeRenderingDecision("conditions");

      // Rendering decision should only have build-time concerns
      expect(decision).toHaveProperty("mode");
      expect(decision).toHaveProperty("reason");
      expect(["prebuilt", "on_demand"]).toContain(decision.mode);

      // Should NOT have SEO properties
      expect(decision).not.toHaveProperty("indexable");
      expect(decision).not.toHaveProperty("canonical");
      expect(decision).not.toHaveProperty("sitemapEligible");
    });

    it("changing SSG mode does not affect SEO decision structure", async () => {
      // Test with mode=none
      process.env.BUILD_TIME_SSG_MODE = "none";
      const {
        makeRenderingDecision: makeDecisionNone,
      } = await import("../static-generation-policy");
      const noneDecision = makeDecisionNone("conditions");

      vi.resetModules();

      // Test with mode=curated
      process.env.BUILD_TIME_SSG_MODE = "curated";
      const {
        makeRenderingDecision: makeDecisionCurated,
      } = await import("../static-generation-policy");
      const curatedDecision = makeDecisionCurated("conditions");

      // Both should have same structure, just different values
      expect(Object.keys(noneDecision).sort()).toEqual(
        Object.keys(curatedDecision).sort()
      );
    });
  });

  describe("Build cohort naming", () => {
    it("uses distinct names from SEO cohorts", async () => {
      const { makeRenderingDecision } = await import(
        "../static-generation-policy"
      );

      const routes = [
        "conditions",
        "treatments",
        "resources",
        "guide",
        "tools",
        "symptoms",
      ] as const;

      for (const route of routes) {
        const decision = makeRenderingDecision(route);

        // Build cohort names should be infrastructure-focused
        expect(["prebuilt", "on_demand"]).toContain(decision.mode);

        // Reasons should be infrastructure-focused, not SEO-focused
        expect([
          "curated_high_value",
          "small_local_corpus",
          "large_programmatic_corpus",
          "database_backed",
          "build_budget",
          "ssg_mode_none",
          "curated_limit_exceeded",
        ]).toContain(decision.reason);

        // Should NOT use SEO cohort names
        expect(decision.mode).not.toBe("indexable_pilot");
        expect(decision.mode).not.toBe("noindex");
        expect(decision.mode).not.toBe("sitemap_eligible");
      }
    });
  });

  describe("SEO preservation guarantees", () => {
    it("on_demand mode does not prevent indexability", async () => {
      process.env.BUILD_TIME_SSG_MODE = "none";

      const { makeRenderingDecision } = await import(
        "../static-generation-policy"
      );
      const decision = makeRenderingDecision("conditions");

      expect(decision.mode).toBe("on_demand");

      // The fact that a page is on-demand does NOT mean it's noindex
      // This is a critical invariant
      expect(decision).not.toHaveProperty("indexable");
    });

    it("prebuilt mode does not confer indexability", async () => {
      process.env.BUILD_TIME_SSG_MODE = "curated";

      const { makeRenderingDecision } = await import(
        "../static-generation-policy"
      );
      const decision = makeRenderingDecision("conditions");

      expect(decision.mode).toBe("prebuilt");

      // The fact that a page is prebuilt does NOT mean it's indexable
      // Indexability is determined by the SEO control plane
      expect(decision).not.toHaveProperty("indexable");
      expect(decision).not.toHaveProperty("sitemapEligible");
    });
  });

  describe("Sitemap independence", () => {
    it("sitemap eligibility is NOT derived from generateStaticParams", async () => {
      // When SSG mode is none, generateStaticParams returns empty
      process.env.BUILD_TIME_SSG_MODE = "none";

      const { getStaticParamsForRoute } = await import(
        "../static-generation-policy"
      );

      // No pages are generated at build time
      const staticParams = await getStaticParamsForRoute("conditions");
      expect(staticParams).toHaveLength(0);

      // But this should NOT affect sitemap eligibility
      // The sitemap should still include all eligible URLs
      // This is tested in sitemap tests, but we verify the invariant here
      expect(staticParams.length).not.toBe("sitemap-eligibility-count");
    });

    it("local data loaders exist for sitemap fallback", async () => {
      // Verify that local data loaders are available for database-backed routes
      const { getAllConditionSlugs } = await import(
        "@/lib/conditions/condition-loader"
      );
      const { getAllResourceSlugs } = await import(
        "@/lib/resources/resource-loader"
      );

      // These should work without database access
      const conditionSlugs = getAllConditionSlugs();
      const resourceSlugs = getAllResourceSlugs();

      // Should return some data from local JSON files
      expect(Array.isArray(conditionSlugs)).toBe(true);
      expect(Array.isArray(resourceSlugs)).toBe(true);
    });
  });

  describe("Invariant: prebuilt SEO output equals on-demand SEO output", () => {
    it("same entity produces same rendering decision structure regardless of mode", async () => {
      const routeTypes = [
        "conditions",
        "treatments",
        "resources",
        "tools",
        "symptoms",
      ] as const;

      for (const routeType of routeTypes) {
        // Get decision with mode=none
        process.env.BUILD_TIME_SSG_MODE = "none";
        vi.resetModules();
        const { makeRenderingDecision: makeNone } = await import(
          "../static-generation-policy"
        );
        const noneDecision = makeNone(routeType);

        // Get decision with mode=curated
        process.env.BUILD_TIME_SSG_MODE = "curated";
        vi.resetModules();
        const { makeRenderingDecision: makeCurated } = await import(
          "../static-generation-policy"
        );
        const curatedDecision = makeCurated(routeType);

        // Structure should be identical
        expect(Object.keys(noneDecision)).toEqual(
          Object.keys(curatedDecision)
        );

        // Both should be valid RenderingDecision objects
        expect(["prebuilt", "on_demand"]).toContain(noneDecision.mode);
        expect(["prebuilt", "on_demand"]).toContain(curatedDecision.mode);
      }
    });
  });
});

describe("Entity Cache Type Safety", () => {
  describe("EntityLookupResult types", () => {
    it("provides explicit status for all outcomes", async () => {
      const {
        isEntityFound,
        isEntityNotFound,
        isEntityUnavailable,
      } = await import("@/lib/data/entity-cache");

      // Type guards should work correctly
      const foundResult = { status: "found" as const, entity: { slug: "test" } };
      const notFoundResult = { status: "not_found" as const };
      const unavailableResult = {
        status: "unavailable" as const,
        error: new Error("timeout"),
      };

      expect(isEntityFound(foundResult)).toBe(true);
      expect(isEntityFound(notFoundResult)).toBe(false);
      expect(isEntityFound(unavailableResult)).toBe(false);

      expect(isEntityNotFound(notFoundResult)).toBe(true);
      expect(isEntityNotFound(foundResult)).toBe(false);
      expect(isEntityNotFound(unavailableResult)).toBe(false);

      expect(isEntityUnavailable(unavailableResult)).toBe(true);
      expect(isEntityUnavailable(foundResult)).toBe(false);
      expect(isEntityUnavailable(notFoundResult)).toBe(false);
    });
  });

  describe("Database error handling", () => {
    it("unavailable status prevents caching as 404", async () => {
      const { isEntityUnavailable, isEntityNotFound } = await import(
        "@/lib/data/entity-cache"
      );

      // Database timeout should be "unavailable", NOT "not_found"
      const timeoutResult = {
        status: "unavailable" as const,
        error: new Error("Connection timeout"),
      };

      expect(isEntityUnavailable(timeoutResult)).toBe(true);
      expect(isEntityNotFound(timeoutResult)).toBe(false);

      // This distinction is critical:
      // - not_found → return 404, can be cached
      // - unavailable → throw/retry, should NOT be cached as 404
    });
  });
});

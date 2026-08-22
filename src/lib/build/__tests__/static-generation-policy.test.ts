/**
 * Static Generation Policy Tests
 *
 * Verifies:
 * - Missing configuration uses safe bounded defaults
 * - 'none', 'curated', and 'all' modes behave as documented
 * - Invalid modes and negative/excessive limits fail safely
 * - Production cannot accidentally generate an unbounded cohort
 * - Database-backed routes do not query Supabase from generateStaticParams()
 *
 * @see src/lib/build/static-generation-policy.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Static Generation Policy", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getSsgMode", () => {
    it("returns 'none' as safe default when mode is not set", async () => {
      delete process.env.BUILD_TIME_SSG_MODE;
      const { getSsgMode } = await import("../static-generation-policy");
      expect(getSsgMode()).toBe("none");
    });

    it("returns 'none' for empty string", async () => {
      process.env.BUILD_TIME_SSG_MODE = "";
      const { getSsgMode } = await import("../static-generation-policy");
      expect(getSsgMode()).toBe("none");
    });

    it("returns 'none' for invalid mode", async () => {
      process.env.BUILD_TIME_SSG_MODE = "invalid";
      const { getSsgMode } = await import("../static-generation-policy");
      expect(getSsgMode()).toBe("none");
    });

    it("returns 'curated' when set", async () => {
      process.env.BUILD_TIME_SSG_MODE = "curated";
      const { getSsgMode } = await import("../static-generation-policy");
      expect(getSsgMode()).toBe("curated");
    });

    it("returns 'all' when set", async () => {
      process.env.BUILD_TIME_SSG_MODE = "all";
      const { getSsgMode } = await import("../static-generation-policy");
      expect(getSsgMode()).toBe("all");
    });

    it("is case-insensitive", async () => {
      process.env.BUILD_TIME_SSG_MODE = "CURATED";
      const { getSsgMode } = await import("../static-generation-policy");
      expect(getSsgMode()).toBe("curated");
    });
  });

  describe("getSsgLimit", () => {
    it("returns 50 as safe default when limit is not set", async () => {
      delete process.env.BUILD_TIME_SSG_LIMIT;
      const { getSsgLimit } = await import("../static-generation-policy");
      expect(getSsgLimit()).toBe(50);
    });

    it("returns 50 for empty string", async () => {
      process.env.BUILD_TIME_SSG_LIMIT = "";
      const { getSsgLimit } = await import("../static-generation-policy");
      expect(getSsgLimit()).toBe(50);
    });

    it("returns 50 for non-numeric value", async () => {
      process.env.BUILD_TIME_SSG_LIMIT = "abc";
      const { getSsgLimit } = await import("../static-generation-policy");
      expect(getSsgLimit()).toBe(50);
    });

    it("returns 50 for negative number", async () => {
      process.env.BUILD_TIME_SSG_LIMIT = "-10";
      const { getSsgLimit } = await import("../static-generation-policy");
      expect(getSsgLimit()).toBe(50);
    });

    it("returns 50 for zero", async () => {
      process.env.BUILD_TIME_SSG_LIMIT = "0";
      const { getSsgLimit } = await import("../static-generation-policy");
      expect(getSsgLimit()).toBe(50);
    });

    it("caps at 500 for excessive values", async () => {
      process.env.BUILD_TIME_SSG_LIMIT = "10000";
      const { getSsgLimit } = await import("../static-generation-policy");
      expect(getSsgLimit()).toBe(500);
    });

    it("returns configured value within valid range", async () => {
      process.env.BUILD_TIME_SSG_LIMIT = "100";
      const { getSsgLimit } = await import("../static-generation-policy");
      expect(getSsgLimit()).toBe(100);
    });
  });

  describe("makeRenderingDecision", () => {
    describe("with SSG_MODE=none (default)", () => {
      beforeEach(() => {
        delete process.env.BUILD_TIME_SSG_MODE;
      });

      it("returns on_demand for conditions route", async () => {
        const { makeRenderingDecision } = await import(
          "../static-generation-policy"
        );
        const decision = makeRenderingDecision("conditions");
        expect(decision.mode).toBe("on_demand");
        expect(decision.reason).toBe("ssg_mode_none");
      });

      it("returns on_demand for resources route", async () => {
        const { makeRenderingDecision } = await import(
          "../static-generation-policy"
        );
        const decision = makeRenderingDecision("resources");
        expect(decision.mode).toBe("on_demand");
        expect(decision.reason).toBe("ssg_mode_none");
      });

      it("returns on_demand for guide route", async () => {
        const { makeRenderingDecision } = await import(
          "../static-generation-policy"
        );
        const decision = makeRenderingDecision("guide");
        expect(decision.mode).toBe("on_demand");
        expect(decision.reason).toBe("ssg_mode_none");
      });

      it("returns on_demand for treatments route", async () => {
        const { makeRenderingDecision } = await import(
          "../static-generation-policy"
        );
        const decision = makeRenderingDecision("treatments");
        expect(decision.mode).toBe("on_demand");
        expect(decision.reason).toBe("ssg_mode_none");
      });

      it("returns prebuilt for static route even in none mode", async () => {
        const { makeRenderingDecision } = await import(
          "../static-generation-policy"
        );
        const decision = makeRenderingDecision("static");
        expect(decision.mode).toBe("prebuilt");
        expect(decision.reason).toBe("small_local_corpus");
      });
    });

    describe("with SSG_MODE=curated", () => {
      beforeEach(() => {
        process.env.BUILD_TIME_SSG_MODE = "curated";
      });

      it("returns prebuilt for routes with curated slugs", async () => {
        const { makeRenderingDecision } = await import(
          "../static-generation-policy"
        );
        const decision = makeRenderingDecision("conditions");
        expect(decision.mode).toBe("prebuilt");
        expect(decision.reason).toBe("curated_high_value");
      });

      it("returns prebuilt for guide route when curated slugs exist", async () => {
        const { makeRenderingDecision } = await import(
          "../static-generation-policy"
        );
        const decision = makeRenderingDecision("guide");
        // Guide has curated slugs, so in curated mode it should be prebuilt
        expect(decision.mode).toBe("prebuilt");
        expect(decision.reason).toBe("curated_high_value");
      });
    });
  });

  describe("getStaticParamsForRoute", () => {
    describe("with SSG_MODE=none", () => {
      beforeEach(() => {
        delete process.env.BUILD_TIME_SSG_MODE;
      });

      it("returns empty array for conditions", async () => {
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );
        const result = await getStaticParamsForRoute("conditions");
        expect(result).toEqual([]);
      });

      it("returns empty array for resources", async () => {
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );
        const result = await getStaticParamsForRoute("resources");
        expect(result).toEqual([]);
      });

      it("returns empty array for guide", async () => {
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );
        const result = await getStaticParamsForRoute("guide");
        expect(result).toEqual([]);
      });

      it("returns empty array for treatments", async () => {
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );
        const result = await getStaticParamsForRoute("treatments");
        expect(result).toEqual([]);
      });
    });

    describe("with SSG_MODE=curated", () => {
      beforeEach(() => {
        process.env.BUILD_TIME_SSG_MODE = "curated";
      });

      it("returns curated slugs for conditions", async () => {
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );
        const result = await getStaticParamsForRoute("conditions");
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty("slug");
        // Should include known curated condition
        expect(result.some((r) => r.slug === "major-depressive-disorder")).toBe(
          true
        );
      });

      it("returns curated slugs for treatments", async () => {
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );
        const result = await getStaticParamsForRoute("treatments");
        expect(result.length).toBeGreaterThan(0);
        // Should include known curated treatment
        expect(
          result.some((r) => r.slug === "cognitive-behavioral-therapy")
        ).toBe(true);
      });

      it("respects SSG_LIMIT for curated slugs", async () => {
        process.env.BUILD_TIME_SSG_LIMIT = "3";
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );
        const result = await getStaticParamsForRoute("conditions");
        expect(result.length).toBeLessThanOrEqual(3);
      });

      it("returns curated slugs for guide", async () => {
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );
        const result = await getStaticParamsForRoute("guide");
        // Guide has curated slugs, so it should return them
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThanOrEqual(5); // 5 curated guide slugs
        // Should include known curated guide page
        expect(result.some((r) => r.slug === "lexapro-for-anxiety")).toBe(true);
      });
    });

    describe("with slug provider function", () => {
      it("uses provided slugs in all mode", async () => {
        process.env.BUILD_TIME_SSG_MODE = "all";
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );

        const slugProvider = () => ["slug-1", "slug-2", "slug-3"];
        const result = await getStaticParamsForRoute("tools", slugProvider);

        expect(result).toEqual([
          { slug: "slug-1" },
          { slug: "slug-2" },
          { slug: "slug-3" },
        ]);
      });

      it("applies limit to provided slugs", async () => {
        process.env.BUILD_TIME_SSG_MODE = "all";
        process.env.BUILD_TIME_SSG_LIMIT = "2";
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );

        const slugProvider = () => ["slug-1", "slug-2", "slug-3"];
        const result = await getStaticParamsForRoute("tools", slugProvider);

        expect(result.length).toBe(2);
      });

      it("handles async slug providers", async () => {
        process.env.BUILD_TIME_SSG_MODE = "all";
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );

        const asyncProvider = async () => ["async-slug-1", "async-slug-2"];
        const result = await getStaticParamsForRoute("tools", asyncProvider);

        expect(result).toEqual([
          { slug: "async-slug-1" },
          { slug: "async-slug-2" },
        ]);
      });

      it("handles errors in slug provider gracefully", async () => {
        process.env.BUILD_TIME_SSG_MODE = "all";
        const { getStaticParamsForRoute } = await import(
          "../static-generation-policy"
        );

        const errorProvider = () => {
          throw new Error("Test error");
        };
        const result = await getStaticParamsForRoute("tools", errorProvider);

        expect(result).toEqual([]);
      });
    });
  });

  describe("getBuildSummary", () => {
    it("returns complete summary object", async () => {
      process.env.BUILD_TIME_SSG_MODE = "curated";
      process.env.BUILD_TIME_SSG_LIMIT = "100";

      const { getBuildSummary } = await import("../static-generation-policy");
      const summary = getBuildSummary();

      expect(summary).toHaveProperty("mode", "curated");
      expect(summary).toHaveProperty("limit", 100);
      expect(summary).toHaveProperty("routes");
      expect(summary.routes).toHaveProperty("conditions");
      expect(summary.routes).toHaveProperty("treatments");
      expect(summary.routes).toHaveProperty("resources");
      expect(summary.routes).toHaveProperty("guide");
    });
  });

  describe("Production safety", () => {
    it("production build cannot generate unbounded cohort without explicit config", async () => {
      // Simulate missing env vars (as would happen in misconfigured CI)
      delete process.env.BUILD_TIME_SSG_MODE;
      delete process.env.BUILD_TIME_SSG_LIMIT;

      const { getStaticParamsForRoute, getSsgMode, getSsgLimit } = await import(
        "../static-generation-policy"
      );

      // Should default to safe values
      expect(getSsgMode()).toBe("none");
      expect(getSsgLimit()).toBe(50);

      // All database-backed routes should return empty
      expect(await getStaticParamsForRoute("conditions")).toEqual([]);
      expect(await getStaticParamsForRoute("resources")).toEqual([]);
      expect(await getStaticParamsForRoute("guide")).toEqual([]);
    });

    it("excessive limit cannot cause unbounded generation", async () => {
      process.env.BUILD_TIME_SSG_MODE = "curated";
      process.env.BUILD_TIME_SSG_LIMIT = "999999";

      const { getSsgLimit, getStaticParamsForRoute } = await import(
        "../static-generation-policy"
      );

      // Limit should be capped
      expect(getSsgLimit()).toBe(500);

      // Even with high limit, curated mode has finite curated slugs
      const conditions = await getStaticParamsForRoute("conditions");
      expect(conditions.length).toBeLessThan(500);
    });
  });
});

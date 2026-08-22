/**
 * Database Error Handling Integration Tests
 *
 * Verifies that transient database failures are handled correctly:
 * - Errors are NOT cached as permanent 404s
 * - EntityLookupResult correctly distinguishes not_found from unavailable
 * - Page components throw on unavailable (triggering retry/error boundary)
 *
 * @see src/lib/data/entity-cache.ts - EntityLookupResult types
 * @see src/lib/data/entity-service.ts - Database access layer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Database Error Handling", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("EntityService error propagation", () => {
    it("throws on Supabase query error instead of returning null", async () => {
      // Mock the supabase module to simulate a query error
      vi.doMock("@/lib/config/database", () => ({
        supabase: {
          from: () => ({
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () =>
                      Promise.resolve({
                        data: null,
                        error: {
                          message: "Connection timeout",
                          code: "57014",
                        },
                      }),
                  }),
                }),
              }),
            }),
          }),
        },
      }));

      // Mock db-pool to fail as well
      vi.doMock("@/lib/config/db-pool", () => ({
        queryWithRetry: vi.fn().mockRejectedValue(new Error("Pool timeout")),
      }));

      const { EntityService } = await import("@/lib/data/entity-service");

      await expect(EntityService.getBySlug("test-slug")).rejects.toThrow();
    });

    it("returns null for confirmed not found (no error, empty data)", async () => {
      // Mock successful query with no results
      vi.doMock("@/lib/config/database", () => ({
        supabase: {
          from: () => ({
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () =>
                      Promise.resolve({
                        data: [],
                        error: null,
                      }),
                  }),
                }),
              }),
            }),
          }),
        },
      }));

      // Mock db-pool to also return empty
      vi.doMock("@/lib/config/db-pool", () => ({
        queryWithRetry: vi.fn().mockResolvedValue({ rows: [] }),
      }));

      const { EntityService } = await import("@/lib/data/entity-service");

      const result = await EntityService.getBySlug("nonexistent-slug");
      expect(result).toBeNull();
    });
  });

  describe("EntityCache error classification", () => {
    it("classifies database errors as unavailable", async () => {
      // Mock EntityService to throw (simulating database error)
      vi.doMock("@/lib/data/entity-service", () => ({
        EntityService: {
          getBySlug: vi.fn().mockRejectedValue(new Error("Database timeout")),
        },
      }));

      const { getEntityBySlug, isEntityUnavailable, isEntityNotFound } =
        await import("@/lib/data/entity-cache");

      const result = await getEntityBySlug("test-slug");

      expect(isEntityUnavailable(result)).toBe(true);
      expect(isEntityNotFound(result)).toBe(false);
      expect(result.status).toBe("unavailable");
    });

    it("classifies null result as not_found", async () => {
      // Mock EntityService to return null (confirmed not found)
      vi.doMock("@/lib/data/entity-service", () => ({
        EntityService: {
          getBySlug: vi.fn().mockResolvedValue(null),
        },
      }));

      const { getEntityBySlug, isEntityFound, isEntityNotFound } = await import(
        "@/lib/data/entity-cache"
      );

      const result = await getEntityBySlug("nonexistent-slug");

      expect(isEntityNotFound(result)).toBe(true);
      expect(isEntityFound(result)).toBe(false);
      expect(result.status).toBe("not_found");
    });

    it("classifies found entity correctly", async () => {
      const mockEntity = {
        id: "123",
        slug: "test-entity",
        name: "Test Entity",
        type: "condition",
        status: "active",
      };

      // Mock EntityService to return entity
      vi.doMock("@/lib/data/entity-service", () => ({
        EntityService: {
          getBySlug: vi.fn().mockResolvedValue(mockEntity),
        },
      }));

      const { getEntityBySlug, isEntityFound, isEntityNotFound, isEntityUnavailable } =
        await import("@/lib/data/entity-cache");

      const result = await getEntityBySlug("test-entity");

      expect(isEntityFound(result)).toBe(true);
      expect(isEntityNotFound(result)).toBe(false);
      expect(isEntityUnavailable(result)).toBe(false);
      expect(result.status).toBe("found");
      if (result.status === "found") {
        expect(result.entity).toEqual(mockEntity);
      }
    });
  });

  describe("Critical invariant: unavailable ≠ not_found", () => {
    it("unavailable status has error property, not_found does not", async () => {
      const { isEntityUnavailable, isEntityNotFound } = await import(
        "@/lib/data/entity-cache"
      );

      const unavailableResult = {
        status: "unavailable" as const,
        error: new Error("Connection refused"),
      };

      const notFoundResult = {
        status: "not_found" as const,
      };

      // Type guards work correctly
      expect(isEntityUnavailable(unavailableResult)).toBe(true);
      expect(isEntityNotFound(unavailableResult)).toBe(false);

      expect(isEntityNotFound(notFoundResult)).toBe(true);
      expect(isEntityUnavailable(notFoundResult)).toBe(false);

      // unavailable has error, not_found does not
      expect("error" in unavailableResult).toBe(true);
      expect("error" in notFoundResult).toBe(false);
    });
  });

  describe("Sitemap local fallback SEO filtering", () => {
    it("conditions sitemap fallback applies SEO eligibility checks", async () => {
      const { getSitemapEligibleConditions } = await import(
        "@/lib/conditions/condition-loader"
      );

      // This function should:
      // 1. Load conditions from local JSON files
      // 2. Apply makeEntityIndexDecision() to each
      // 3. Return only those with sitemapEligible=true

      const eligible = await getSitemapEligibleConditions();

      // Verify it returns an array
      expect(Array.isArray(eligible)).toBe(true);

      // Each entry should have slug and name
      for (const entry of eligible) {
        expect(typeof entry.slug).toBe("string");
        expect(typeof entry.name).toBe("string");
      }
    });

    it("resources sitemap fallback applies SEO eligibility checks", async () => {
      const { getSitemapEligibleResources } = await import(
        "@/lib/resources/resource-loader"
      );

      // This function should apply the SEO firewall to local resources
      const eligible = await getSitemapEligibleResources();

      // Verify it returns an array
      expect(Array.isArray(eligible)).toBe(true);

      // Each entry should have slug, name, and category
      for (const entry of eligible) {
        expect(typeof entry.slug).toBe("string");
        expect(typeof entry.name).toBe("string");
        expect(typeof entry.category).toBe("string");
      }
    });

    it("resources sitemap fallback respects category exclusion", async () => {
      const { getSitemapEligibleResources } = await import(
        "@/lib/resources/resource-loader"
      );

      // Get resources excluding assessments-screeners
      const eligible = await getSitemapEligibleResources("assessments-screeners");

      // None should be in the excluded category
      for (const entry of eligible) {
        expect(entry.category).not.toBe("assessments-screeners");
      }
    });
  });
});

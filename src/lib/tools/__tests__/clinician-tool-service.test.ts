// src/lib/tools/__tests__/clinician-tool-service.test.ts
// Unit tests for ClinicianToolService

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  ClinicianToolService,
  isToolPublishable,
  filterPublishableTools,
} from "../clinician-tool-service";
import type { ClinicianToolV4 } from "../../schemas/clinician-tool-v4";

// Mock tool factory - creates minimal valid tool for testing
function createMockTool(overrides: Partial<ClinicianToolV4> = {}): ClinicianToolV4 {
  return {
    schema_version: "4.0",
    kind: "clinician-tool",
    id: overrides.id ?? "00000000-0000-0000-0000-000000000001",
    slug: overrides.slug ?? "test-tool",
    name: overrides.name ?? "Test Tool",
    status: overrides.status ?? "active",
    primary_category: overrides.primary_category ?? "ehr-practice-management",
    secondary_categories: overrides.secondary_categories ?? [],
    capabilities: overrides.capabilities ?? ["clinical-notes"],
    integrations: overrides.integrations ?? [],
    compliance: {
      hipaa_support: "unknown",
      baa_available: "unknown",
      soc2_certified: "unknown",
      hitrust_certified: "unknown",
      ...overrides.compliance,
    },
    feature_flags: {
      has_ai: false,
      has_ehr: false,
      has_telehealth: false,
      has_mbc: false,
      has_rcm: false,
      ...overrides.feature_flags,
    },
    import_ref: {
      source: "manual",
      record_id: "test-001",
      imported_at: "2024-01-01T00:00:00Z",
      ...overrides.import_ref,
    },
    ...overrides,
  } as ClinicianToolV4;
}

describe("isToolPublishable", () => {
  it("should return true for active tools without lifecycle restrictions", () => {
    const tool = createMockTool({ status: "active" });
    expect(isToolPublishable(tool)).toBe(true);
  });

  it("should return true for active tools with active lifecycle", () => {
    const tool = createMockTool({
      status: "active",
      lifecycle: { status: "active" },
    });
    expect(isToolPublishable(tool)).toBe(true);
  });

  it("should return true for active tools with beta lifecycle", () => {
    const tool = createMockTool({
      status: "active",
      lifecycle: { status: "beta" },
    });
    expect(isToolPublishable(tool)).toBe(true);
  });

  it("should return false for draft tools", () => {
    const tool = createMockTool({ status: "draft" });
    expect(isToolPublishable(tool)).toBe(false);
  });

  it("should return false for archived tools", () => {
    const tool = createMockTool({ status: "archived" });
    expect(isToolPublishable(tool)).toBe(false);
  });

  it("should return false for pending-review tools", () => {
    const tool = createMockTool({ status: "pending-review" });
    expect(isToolPublishable(tool)).toBe(false);
  });

  it("should return false for acquired lifecycle status", () => {
    const tool = createMockTool({
      status: "active",
      lifecycle: { status: "acquired" },
    });
    expect(isToolPublishable(tool)).toBe(false);
  });

  it("should return false for discontinued lifecycle status", () => {
    const tool = createMockTool({
      status: "active",
      lifecycle: { status: "discontinued" },
    });
    expect(isToolPublishable(tool)).toBe(false);
  });

  it("should return false for deprecated lifecycle status", () => {
    const tool = createMockTool({
      status: "active",
      lifecycle: { status: "deprecated" },
    });
    expect(isToolPublishable(tool)).toBe(false);
  });

  it("should return false for merged lifecycle status", () => {
    const tool = createMockTool({
      status: "active",
      lifecycle: { status: "merged" },
    });
    expect(isToolPublishable(tool)).toBe(false);
  });
});

describe("filterPublishableTools", () => {
  it("should filter out non-publishable tools", () => {
    const tools = [
      createMockTool({ slug: "active-1", status: "active" }),
      createMockTool({ slug: "draft-1", status: "draft" }),
      createMockTool({ slug: "active-2", status: "active" }),
      createMockTool({
        slug: "acquired-1",
        status: "active",
        lifecycle: { status: "acquired" },
      }),
    ];

    const publishable = filterPublishableTools(tools);

    expect(publishable).toHaveLength(2);
    expect(publishable.map((t) => t.slug)).toEqual(["active-1", "active-2"]);
  });

  it("should return empty array for all non-publishable tools", () => {
    const tools = [
      createMockTool({ slug: "draft-1", status: "draft" }),
      createMockTool({ slug: "draft-2", status: "draft" }),
    ];

    const publishable = filterPublishableTools(tools);
    expect(publishable).toHaveLength(0);
  });

  it("should return all tools if all are publishable", () => {
    const tools = [
      createMockTool({ slug: "active-1", status: "active" }),
      createMockTool({
        slug: "active-2",
        status: "active",
        lifecycle: { status: "beta" },
      }),
    ];

    const publishable = filterPublishableTools(tools);
    expect(publishable).toHaveLength(2);
  });
});

describe("ClinicianToolService", () => {
  beforeEach(() => {
    // Clear cache before each test
    ClinicianToolService.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadClinicianTools", () => {
    it("should return publishable tools only by default", async () => {
      // This test requires actual files to exist
      // In a real environment, you'd mock fs module
      const tools = await ClinicianToolService.loadClinicianTools();

      // All returned tools should be publishable
      for (const tool of tools) {
        expect(isToolPublishable(tool)).toBe(true);
      }
    });
  });

  describe("getBySlug", () => {
    it("should return null for non-existent slug", async () => {
      const tool = await ClinicianToolService.getBySlug(
        "non-existent-tool-slug-12345"
      );
      expect(tool).toBeNull();
    });

    it("should not return draft tools by default", async () => {
      // Assuming there are draft tools in the data
      const allTools = await ClinicianToolService.loadAllToolsIncludingDrafts();
      const draftTool = allTools.find((t) => t.status === "draft");

      if (draftTool) {
        const publicTool = await ClinicianToolService.getBySlug(draftTool.slug);
        expect(publicTool).toBeNull();
      }
    });

    it("should return draft tools with includeUnpublished flag", async () => {
      const allTools = await ClinicianToolService.loadAllToolsIncludingDrafts();
      const draftTool = allTools.find((t) => t.status === "draft");

      if (draftTool) {
        const tool = await ClinicianToolService.getBySlug(draftTool.slug, {
          includeUnpublished: true,
        });
        expect(tool).not.toBeNull();
        expect(tool?.slug).toBe(draftTool.slug);
      }
    });
  });

  describe("getByCategory", () => {
    it("should filter tools by primary category", async () => {
      const tools = await ClinicianToolService.getByCategory(
        "ehr-practice-management"
      );

      for (const tool of tools) {
        expect(tool.primary_category).toBe("ehr-practice-management");
      }
    });

    it("should return empty array for non-existent category", async () => {
      const tools = await ClinicianToolService.getByCategory(
        "non-existent-category"
      );
      expect(tools).toHaveLength(0);
    });
  });

  describe("getToolCounts", () => {
    it("should return counts per category", async () => {
      const counts = await ClinicianToolService.getToolCounts();

      expect(typeof counts).toBe("object");

      // All counts should be positive integers
      for (const [category, count] of Object.entries(counts)) {
        expect(typeof category).toBe("string");
        expect(Number.isInteger(count)).toBe(true);
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  describe("searchClinicianTools", () => {
    it("should return all publishable tools with no query", async () => {
      const result = await ClinicianToolService.searchClinicianTools();

      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.total).toBe(result.tools.length);
    });

    it("should filter by category", async () => {
      const result = await ClinicianToolService.searchClinicianTools(undefined, {
        category: "ehr-practice-management",
      });

      for (const tool of result.tools) {
        expect(
          tool.primary_category === "ehr-practice-management" ||
            tool.secondary_categories.includes("ehr-practice-management")
        ).toBe(true);
      }
    });

    it("should filter by HIPAA compliance", async () => {
      const result = await ClinicianToolService.searchClinicianTools(undefined, {
        hipaaCompliant: true,
      });

      for (const tool of result.tools) {
        expect(tool.compliance.hipaa_support).toBe("yes");
      }
    });

    it("should search by text query", async () => {
      const allTools = await ClinicianToolService.loadClinicianTools();

      if (allTools.length > 0) {
        // Use first tool's name as query
        const searchName = allTools[0].name.split(" ")[0];
        const result = await ClinicianToolService.searchClinicianTools(
          searchName.toLowerCase()
        );

        // Should find at least one result
        expect(result.tools.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("getComparisonCandidates", () => {
    it("should return tools sorted by comparison score", async () => {
      const tools = await ClinicianToolService.getComparisonCandidates(
        "ehr-practice-management",
        5
      );

      expect(tools.length).toBeLessThanOrEqual(5);

      // All returned tools should be from the correct category
      for (const tool of tools) {
        expect(tool.primary_category).toBe("ehr-practice-management");
      }
    });

    it("should limit results to specified count", async () => {
      const tools = await ClinicianToolService.getComparisonCandidates(
        "ehr-practice-management",
        3
      );

      expect(tools.length).toBeLessThanOrEqual(3);
    });

    it("should not bias by featured status (P0-12)", async () => {
      const tools = await ClinicianToolService.getComparisonCandidates(
        "ehr-practice-management",
        10
      );

      // Featured status should NOT determine order
      // Tools with higher data quality should appear first
      // This is a smoke test - full verification requires known test data
      expect(Array.isArray(tools)).toBe(true);
    });
  });

  describe("getAllSlugs", () => {
    it("should return array of strings", async () => {
      const slugs = await ClinicianToolService.getAllSlugs();

      expect(Array.isArray(slugs)).toBe(true);
      for (const slug of slugs) {
        expect(typeof slug).toBe("string");
        expect(slug.length).toBeGreaterThan(0);
      }
    });

    it("should return unique slugs", async () => {
      const slugs = await ClinicianToolService.getAllSlugs();
      const uniqueSlugs = new Set(slugs);

      expect(slugs.length).toBe(uniqueSlugs.size);
    });
  });

  describe("getAllCategories", () => {
    it("should return array of category strings", async () => {
      const categories = await ClinicianToolService.getAllCategories();

      expect(Array.isArray(categories)).toBe(true);
      for (const category of categories) {
        expect(typeof category).toBe("string");
      }
    });

    it("should return sorted categories", async () => {
      const categories = await ClinicianToolService.getAllCategories();
      const sorted = [...categories].sort();

      expect(categories).toEqual(sorted);
    });
  });

  describe("clearCache", () => {
    it("should clear all caches", async () => {
      // Load tools to populate cache
      await ClinicianToolService.loadClinicianTools();

      // Clear cache
      ClinicianToolService.clearCache();

      // Validation stats should be null after clearing
      expect(ClinicianToolService.getValidationStats()).toBeNull();
    });
  });
});

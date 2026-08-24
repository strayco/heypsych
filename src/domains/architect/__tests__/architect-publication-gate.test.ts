// src/domains/architect/__tests__/architect-publication-gate.test.ts
// Tests that Architect uses only publishable products - P0 security requirement

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ArchitectProductService } from "../services/architect-product-service";
import { ClinicianToolService, isToolPublishable } from "@/lib/tools/clinician-tool-service";

// Mock the ClinicianToolService
vi.mock("@/lib/tools/clinician-tool-service", async () => {
  const actual = await vi.importActual("@/lib/tools/clinician-tool-service");
  return {
    ...actual,
    ClinicianToolService: {
      loadClinicianTools: vi.fn(),
      loadAllToolsIncludingDrafts: vi.fn(),
    },
  };
});

// Create a complete mock tool that passes the v4-product-adapter
function createMockClinicianTool(slug: string, name: string) {
  return {
    slug,
    name,
    primary_category: "ehr-practice-management",
    secondary_categories: [],
    short_description: "EHR for mental health",
    capabilities: ["clinical-notes"],
    integrations: [],
    compliance: { hipaa_support: "yes", baa_available: "yes" },
    feature_flags: { has_ai: false, has_ehr: true, has_telehealth: false, has_mbc: false, has_rcm: false },
    pricing: { model: "subscription", starting_price_display: "$49/mo" },
    audiences: { clinician_roles: [], practice_settings: [], organization_sizes: [] },
  };
}

describe("ArchitectProductService Publication Safety", () => {
  beforeEach(() => {
    // Clear the Architect service cache before each test
    ArchitectProductService.clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should use loadClinicianTools (publishable only), not loadAllToolsIncludingDrafts", async () => {
    const mockPublishableTools = [createMockClinicianTool("simplepractice", "SimplePractice")];

    (ClinicianToolService.loadClinicianTools as ReturnType<typeof vi.fn>).mockResolvedValue(mockPublishableTools);
    (ClinicianToolService.loadAllToolsIncludingDrafts as ReturnType<typeof vi.fn>).mockResolvedValue([
      ...mockPublishableTools,
      { slug: "draft-tool", name: "Draft Tool", status: "draft" },
    ]);

    await ArchitectProductService.loadProducts();

    // CRITICAL: Must call loadClinicianTools, NOT loadAllToolsIncludingDrafts
    expect(ClinicianToolService.loadClinicianTools).toHaveBeenCalled();
    expect(ClinicianToolService.loadAllToolsIncludingDrafts).not.toHaveBeenCalled();
  });

  it("should never expose draft products through Architect", async () => {
    const mockPublishableTools = [createMockClinicianTool("simplepractice", "SimplePractice")];

    (ClinicianToolService.loadClinicianTools as ReturnType<typeof vi.fn>).mockResolvedValue(mockPublishableTools);

    const { metadataMap } = await ArchitectProductService.loadProducts();

    // Should only contain publishable products
    expect(metadataMap.has("simplepractice")).toBe(true);
    expect(metadataMap.has("draft-tool")).toBe(false);
    expect(metadataMap.size).toBe(1);
  });

  it("should cache results to avoid repeated loads", async () => {
    const mockPublishableTools = [createMockClinicianTool("simplepractice", "SimplePractice")];

    (ClinicianToolService.loadClinicianTools as ReturnType<typeof vi.fn>).mockResolvedValue(mockPublishableTools);

    // Call twice
    await ArchitectProductService.loadProducts();
    await ArchitectProductService.loadProducts();

    // Should only call loadClinicianTools once due to caching
    expect(ClinicianToolService.loadClinicianTools).toHaveBeenCalledTimes(1);
  });

  it("should clear cache when clearCache is called", async () => {
    const mockPublishableTools = [createMockClinicianTool("simplepractice", "SimplePractice")];

    (ClinicianToolService.loadClinicianTools as ReturnType<typeof vi.fn>).mockResolvedValue(mockPublishableTools);

    await ArchitectProductService.loadProducts();
    ArchitectProductService.clearCache();
    await ArchitectProductService.loadProducts();

    // Should call loadClinicianTools twice after cache clear
    expect(ClinicianToolService.loadClinicianTools).toHaveBeenCalledTimes(2);
  });
});

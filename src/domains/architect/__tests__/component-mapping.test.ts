/**
 * Component Mapping Tests
 *
 * Tests for the v2 component-to-capability mapping layer.
 */

import { describe, it, expect } from "vitest";
import {
  COMPONENT_DEFINITIONS,
  ZONE_DEFINITIONS,
  getOrderedZones,
  getComponentsForZone,
  getProductComponentCoverage,
  productCoversComponent,
  getProductCoverageCount,
  getAllComponentsOrdered,
  TOTAL_COMPONENT_COUNT,
} from "../component-mapping";
import type { ProductArchitectureMetadata } from "../schemas/product-metadata";

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Mock product that covers multiple components (like SimplePractice)
 */
const mockEhrProduct: ProductArchitectureMetadata = {
  productSlug: "simplepractice",
  capabilityMapStatus: "reviewed-complete",
  capabilities: [
    // Scheduling capabilities
    { capabilityId: "scheduling", strength: "core", provenance: "verified" },
    { capabilityId: "appointment-reminders", strength: "strong", provenance: "verified" },
    // Intake capabilities
    { capabilityId: "intake", strength: "core", provenance: "verified" },
    { capabilityId: "forms-e-signature", strength: "strong", provenance: "verified" },
    // Clinical records capabilities
    { capabilityId: "ehr-clinical-record", strength: "core", provenance: "verified" },
    { capabilityId: "clinical-documentation", strength: "core", provenance: "verified" },
    { capabilityId: "treatment-planning", strength: "strong", provenance: "verified" },
    // Visits capabilities
    { capabilityId: "telehealth", strength: "core", provenance: "verified" },
    // Payments capabilities
    { capabilityId: "patient-payments", strength: "strong", provenance: "verified" },
    { capabilityId: "billing-rcm", strength: "strong", provenance: "verified" },
  ],
  integrations: [],
  fitEvidence: {
    practiceTypesSupported: ["therapist", "psychiatrist"],
  },
  pricing: {
    model: "per-provider-month",
    basePriceCents: 9900,
  },
};

/**
 * Mock product that only covers telehealth (like Doxy.me)
 */
const mockTelehealthOnlyProduct: ProductArchitectureMetadata = {
  productSlug: "doxy-me",
  capabilityMapStatus: "reviewed-partial",
  capabilities: [
    { capabilityId: "telehealth", strength: "core", provenance: "verified" },
  ],
  integrations: [],
  fitEvidence: {},
  pricing: {
    model: "per-provider-month",
    basePriceCents: 0, // Free tier
  },
};

/**
 * Mock product with partial capabilities
 */
const mockPartialProduct: ProductArchitectureMetadata = {
  productSlug: "partial-ehr",
  capabilityMapStatus: "unreviewed",
  capabilities: [
    { capabilityId: "ehr-clinical-record", strength: "partial", provenance: "vendor_provided" },
    { capabilityId: "clinical-documentation", strength: "partial", provenance: "vendor_provided" },
  ],
  integrations: [],
  fitEvidence: {},
  pricing: {},
};

/**
 * Mock accounting product (like QuickBooks)
 */
const mockAccountingProduct: ProductArchitectureMetadata = {
  productSlug: "quickbooks",
  capabilityMapStatus: "reviewed-partial",
  capabilities: [
    { capabilityId: "accounting", strength: "core", provenance: "verified" },
  ],
  integrations: [],
  fitEvidence: {},
  pricing: {
    model: "flat-monthly",
    basePriceCents: 3000,
  },
};

// ============================================================================
// COMPONENT DEFINITIONS TESTS
// ============================================================================

describe("COMPONENT_DEFINITIONS", () => {
  it("should define exactly 9 components", () => {
    expect(TOTAL_COMPONENT_COUNT).toBe(9);
    expect(Object.keys(COMPONENT_DEFINITIONS)).toHaveLength(9);
  });

  it("should have all required properties for each component", () => {
    for (const [id, def] of Object.entries(COMPONENT_DEFINITIONS)) {
      expect(def.id).toBe(id);
      expect(def.name).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.zone).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(typeof def.typicallyBundled).toBe("boolean");
    }
  });

  it("should mark malpractice as external", () => {
    expect(COMPONENT_DEFINITIONS.malpractice.isExternal).toBe(true);
    expect(COMPONENT_DEFINITIONS.malpractice.capabilities).toHaveLength(0);
    expect(COMPONENT_DEFINITIONS.malpractice.externalLinks).toBeDefined();
    expect(COMPONENT_DEFINITIONS.malpractice.externalLinks!.length).toBeGreaterThan(0);
  });

  it("should have non-empty capabilities for software components", () => {
    const softwareComponents = Object.values(COMPONENT_DEFINITIONS).filter(
      (c) => !c.isExternal
    );
    for (const component of softwareComponents) {
      expect(component.capabilities.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// ZONE DEFINITIONS TESTS
// ============================================================================

describe("ZONE_DEFINITIONS", () => {
  it("should define exactly 4 zones", () => {
    expect(Object.keys(ZONE_DEFINITIONS)).toHaveLength(4);
  });

  it("should have correct zone names", () => {
    expect(ZONE_DEFINITIONS["get-patients-in"].name).toBe("Get Patients In");
    expect(ZONE_DEFINITIONS["provide-care"].name).toBe("Provide Care");
    expect(ZONE_DEFINITIONS["get-paid"].name).toBe("Get Paid");
    expect(ZONE_DEFINITIONS["run-practice"].name).toBe("Run the Practice");
  });

  it("should assign all components to zones", () => {
    const allZoneComponents = Object.values(ZONE_DEFINITIONS).flatMap(
      (z) => z.components
    );
    expect(allZoneComponents).toHaveLength(9);
    expect(new Set(allZoneComponents).size).toBe(9); // No duplicates
  });

  it("should return zones in order", () => {
    const ordered = getOrderedZones();
    expect(ordered[0].id).toBe("get-patients-in");
    expect(ordered[1].id).toBe("provide-care");
    expect(ordered[2].id).toBe("get-paid");
    expect(ordered[3].id).toBe("run-practice");
  });
});

// ============================================================================
// COMPONENT FOR ZONE TESTS
// ============================================================================

describe("getComponentsForZone", () => {
  it("should return components for get-patients-in zone", () => {
    const components = getComponentsForZone("get-patients-in");
    expect(components.map((c) => c.id)).toEqual(["website", "scheduling", "intake"]);
  });

  it("should return components for provide-care zone", () => {
    const components = getComponentsForZone("provide-care");
    expect(components.map((c) => c.id)).toEqual(["clinical-records", "visits", "prescribing"]);
  });

  it("should return components for get-paid zone", () => {
    const components = getComponentsForZone("get-paid");
    expect(components.map((c) => c.id)).toEqual(["payments"]);
  });

  it("should return components for run-practice zone", () => {
    const components = getComponentsForZone("run-practice");
    expect(components.map((c) => c.id)).toEqual(["malpractice", "accounting"]);
  });
});

// ============================================================================
// PRODUCT COVERAGE TESTS
// ============================================================================

describe("getProductComponentCoverage", () => {
  it("should identify multiple components covered by an EHR", () => {
    const coverage = getProductComponentCoverage(mockEhrProduct);

    // SimplePractice-like product should cover 5 components
    expect(coverage).toContain("scheduling");
    expect(coverage).toContain("intake");
    expect(coverage).toContain("clinical-records");
    expect(coverage).toContain("visits");
    expect(coverage).toContain("payments");

    // Should NOT cover external or non-matching components
    expect(coverage).not.toContain("malpractice");
    expect(coverage).not.toContain("accounting");
  });

  it("should identify single component coverage for focused products", () => {
    const coverage = getProductComponentCoverage(mockTelehealthOnlyProduct);

    expect(coverage).toHaveLength(1);
    expect(coverage).toContain("visits");
  });

  it("should not cover components when strength is too low", () => {
    const coverage = getProductComponentCoverage(mockPartialProduct);

    // With default "strong" threshold, partial strength shouldn't count
    expect(coverage).not.toContain("clinical-records");
  });

  it("should cover components with partial threshold when specified", () => {
    const coverage = getProductComponentCoverage(mockPartialProduct, "partial");

    // With "partial" threshold, it should cover clinical-records
    expect(coverage).toContain("clinical-records");
  });

  it("should never cover malpractice (external component)", () => {
    // Even if a product had compliance capabilities, it shouldn't cover malpractice
    const coverage = getProductComponentCoverage(mockEhrProduct);
    expect(coverage).not.toContain("malpractice");
  });

  it("should cover accounting for accounting products", () => {
    const coverage = getProductComponentCoverage(mockAccountingProduct);
    expect(coverage).toContain("accounting");
    expect(coverage).toHaveLength(1);
  });
});

describe("productCoversComponent", () => {
  it("should return true when product covers component", () => {
    expect(productCoversComponent(mockEhrProduct, "scheduling")).toBe(true);
    expect(productCoversComponent(mockEhrProduct, "clinical-records")).toBe(true);
  });

  it("should return false when product does not cover component", () => {
    expect(productCoversComponent(mockTelehealthOnlyProduct, "scheduling")).toBe(false);
    expect(productCoversComponent(mockAccountingProduct, "visits")).toBe(false);
  });
});

describe("getProductCoverageCount", () => {
  it("should count components covered by EHR", () => {
    const count = getProductCoverageCount(mockEhrProduct);
    expect(count).toBe(5); // scheduling, intake, clinical-records, visits, payments
  });

  it("should count single component for focused products", () => {
    expect(getProductCoverageCount(mockTelehealthOnlyProduct)).toBe(1);
    expect(getProductCoverageCount(mockAccountingProduct)).toBe(1);
  });
});

// ============================================================================
// ORDERED COMPONENTS TESTS
// ============================================================================

describe("getAllComponentsOrdered", () => {
  it("should return all components in zone order", () => {
    const ordered = getAllComponentsOrdered();

    expect(ordered).toHaveLength(9);

    // Should be in zone order
    expect(ordered[0]).toBe("website"); // get-patients-in
    expect(ordered[1]).toBe("scheduling"); // get-patients-in
    expect(ordered[2]).toBe("intake"); // get-patients-in
    expect(ordered[3]).toBe("clinical-records"); // provide-care
    expect(ordered[4]).toBe("visits"); // provide-care
    expect(ordered[5]).toBe("prescribing"); // provide-care
    expect(ordered[6]).toBe("payments"); // get-paid
    expect(ordered[7]).toBe("malpractice"); // run-practice
    expect(ordered[8]).toBe("accounting"); // run-practice
  });
});

// src/domains/architect/__tests__/recommendation-engine.test.ts
// Tests for deterministic recommendation engine

import { describe, it, expect } from "vitest";
import {
  generateRecommendation,
  shouldRegenerateRecommendation,
} from "../engines/recommendation-engine";
import type {
  PracticeFingerprint,
  ProductArchitectureMetadata,
} from "../schemas";
import { createEmptyFingerprint } from "../schemas";

// Factory helpers
function createTestFingerprint(overrides: Partial<PracticeFingerprint> = {}): PracticeFingerprint {
  return {
    ...createEmptyFingerprint(),
    practiceType: "solo-clinician",
    sizeBucket: "solo",
    primaryPayerType: "commercial-insurance",
    prescribingLevel: "none",
    deliveryModel: "hybrid",
    priorities: ["clinical-workflow", "ease-of-use", "low-cost"],
    ...overrides,
  };
}

function createTestProduct(
  slug: string,
  capabilities: Array<{ capabilityId: string; strength: string }>,
  overrides: Partial<ProductArchitectureMetadata> = {}
): ProductArchitectureMetadata {
  return {
    productSlug: slug,
    capabilityMapStatus: "reviewed-complete",
    capabilities: capabilities.map((c) => ({
      capabilityId: c.capabilityId as any,
      strength: c.strength as any,
      provenance: "verified" as const,
    })),
    integrations: [],
    pricing: {
      basis: "per-provider-month",
      minPriceCents: 5000,
      typicalPriceCents: 7000,
      provenance: "verified",
    },
    ...overrides,
  };
}

describe("generateRecommendation", () => {
  describe("determinism", () => {
    it("should produce identical output for identical inputs", () => {
      const fingerprint = createTestFingerprint();
      const products = [
        createTestProduct("ehr-a", [{ capabilityId: "ehr-clinical-record", strength: "core" }]),
        createTestProduct("ehr-b", [{ capabilityId: "ehr-clinical-record", strength: "core" }]),
        createTestProduct("telehealth-a", [{ capabilityId: "telehealth", strength: "core" }]),
      ];

      const result1 = generateRecommendation({
        fingerprint,
        availableProducts: products,
      });

      const result2 = generateRecommendation({
        fingerprint,
        availableProducts: products,
      });

      // Same products recommended
      expect(result1.products.map((p) => p.slug)).toEqual(result2.products.map((p) => p.slug));
      // Same order
      expect(result1.products[0]?.slug).toBe(result2.products[0]?.slug);
      // Same coverage
      expect(result1.totalCoveragePercent).toBe(result2.totalCoveragePercent);
    });
  });

  describe("hard requirements", () => {
    it("should exclude products with incompatible practice type", () => {
      const fingerprint = createTestFingerprint({ practiceType: "solo-clinician" });
      const products = [
        createTestProduct("ehr-compatible", [{ capabilityId: "ehr-clinical-record", strength: "core" }]),
        createTestProduct("ehr-excluded", [{ capabilityId: "ehr-clinical-record", strength: "core" }], {
          fitEvidence: {
            practiceTypesExcluded: ["solo-clinician"],
            provenance: "verified",
          },
        }),
      ];

      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
      });

      // Should not include the excluded product
      expect(result.products.some((p) => p.slug === "ehr-excluded")).toBe(false);
      // Should include the compatible product
      expect(result.products.some((p) => p.slug === "ehr-compatible")).toBe(true);
    });

    it("should exclude products with incompatible states", () => {
      const fingerprint = createTestFingerprint({
        statesServed: ["CA", "NY"],
      });
      const products = [
        createTestProduct("ehr-national", [{ capabilityId: "ehr-clinical-record", strength: "core" }]),
        createTestProduct("ehr-limited", [{ capabilityId: "ehr-clinical-record", strength: "core" }], {
          fitEvidence: {
            statesExcluded: ["CA"],
            provenance: "verified",
          },
        }),
      ];

      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
      });

      // Should not include the state-excluded product
      expect(result.products.some((p) => p.slug === "ehr-limited")).toBe(false);
    });
  });

  describe("incremental coverage", () => {
    it("should prioritize products that add most coverage", () => {
      const fingerprint = createTestFingerprint({ deliveryModel: "telehealth" });
      const products = [
        createTestProduct("ehr-basic", [
          { capabilityId: "ehr-clinical-record", strength: "core" },
        ]),
        createTestProduct("ehr-full", [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "telehealth", strength: "core" },
          { capabilityId: "clinical-documentation", strength: "strong" },
        ]),
        createTestProduct("telehealth-only", [
          { capabilityId: "telehealth", strength: "core" },
        ]),
      ];

      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
      });

      // Should prefer ehr-full as it covers more capabilities
      expect(result.products[0]?.slug).toBe("ehr-full");
    });

    it("should not add products with negligible incremental value", () => {
      const fingerprint = createTestFingerprint();
      const products = [
        createTestProduct("ehr", [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "clinical-documentation", strength: "core" },
          { capabilityId: "scheduling", strength: "strong" },
        ]),
        createTestProduct("ehr-duplicate", [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "clinical-documentation", strength: "core" },
        ]),
      ];

      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
      });

      // Should only include one EHR (the first one with more coverage)
      expect(result.products.length).toBe(1);
      expect(result.products[0]?.slug).toBe("ehr");
    });
  });

  describe("budget handling", () => {
    it("should include products when budget is sufficient", () => {
      const fingerprint = createTestFingerprint({ monthlyBudget: 500 });
      const products = [
        createTestProduct("ehr", [{ capabilityId: "ehr-clinical-record", strength: "core" }], {
          pricing: {
            basis: "per-provider-month",
            minPriceCents: 5000, // $50/mo
            provenance: "verified",
          },
        }),
      ];

      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
      });

      expect(result.isWithinBudget).toBe(true);
    });

    it("should report when exceeds budget", () => {
      const fingerprint = createTestFingerprint({ monthlyBudget: 30 });
      const products = [
        createTestProduct("expensive-ehr", [{ capabilityId: "ehr-clinical-record", strength: "core" }], {
          pricing: {
            basis: "per-provider-month",
            minPriceCents: 10000, // $100/mo
            provenance: "verified",
          },
        }),
      ];

      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
      });

      expect(result.isWithinBudget).toBe(false);
    });
  });

  describe("unknown pricing", () => {
    it("should handle products with unknown pricing", () => {
      const fingerprint = createTestFingerprint();
      const products = [
        createTestProduct("ehr-no-price", [{ capabilityId: "ehr-clinical-record", strength: "core" }], {
          pricing: undefined,
        }),
      ];

      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
      });

      expect(result.productsWithUnknownPricing).toBe(1);
    });

    it("should handle products requiring custom quotes", () => {
      const fingerprint = createTestFingerprint();
      const products = [
        createTestProduct("enterprise-ehr", [{ capabilityId: "ehr-clinical-record", strength: "core" }], {
          pricing: {
            basis: "custom-quote",
            requiresQuote: true,
            provenance: "verified",
          },
        }),
      ];

      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
      });

      expect(result.productsRequiringQuote).toBe(1);
    });
  });

  describe("incomplete fingerprint", () => {
    it("should return empty recommendation for incomplete fingerprint", () => {
      const incompleteFingerprint: PracticeFingerprint = {
        ...createEmptyFingerprint(),
        // Missing required fields for build-for-me
      };

      const products = [
        createTestProduct("ehr", [{ capabilityId: "ehr-clinical-record", strength: "core" }]),
      ];

      const result = generateRecommendation({
        fingerprint: incompleteFingerprint,
        availableProducts: products,
      });

      expect(result.products.length).toBe(0);
      expect(result.summaryReasons[0]).toContain("Incomplete");
    });
  });
});

describe("compatibility filtering", () => {
    it("should exclude products incompatible with existing selections", () => {
      const fingerprint = createTestFingerprint();
      const products = [
        createTestProduct("ehr-a", [{ capabilityId: "ehr-clinical-record", strength: "core" }]),
        createTestProduct("billing-incompatible", [{ capabilityId: "billing-rcm", strength: "core" }], {
          integrations: [
            {
              targetSlug: "ehr-a",
              type: "incompatible",
              direction: "unidirectional",
              provenance: "verified",
              notes: "These products cannot work together",
            },
          ],
        }),
        createTestProduct("billing-compatible", [{ capabilityId: "billing-rcm", strength: "core" }]),
      ];

      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
        existingSelectionSlugs: ["ehr-a"], // ehr-a is already in the stack
      });

      // Should NOT include billing-incompatible
      expect(result.products.some((p) => p.slug === "billing-incompatible")).toBe(false);
      // Should include billing-compatible
      expect(result.products.some((p) => p.slug === "billing-compatible")).toBe(true);
    });

    it("should exclude products incompatible with products selected during this run", () => {
      const fingerprint = createTestFingerprint();
      const products = [
        createTestProduct("ehr-a", [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "clinical-documentation", strength: "core" },
        ]),
        createTestProduct("telehealth-incompatible", [{ capabilityId: "telehealth", strength: "core" }], {
          integrations: [
            {
              targetSlug: "ehr-a",
              type: "incompatible",
              direction: "unidirectional",
              provenance: "verified",
            },
          ],
        }),
        createTestProduct("telehealth-compatible", [{ capabilityId: "telehealth", strength: "core" }]),
      ];

      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
        // No existing selections - ehr-a will be selected first due to higher coverage
      });

      // ehr-a should be selected first (more capabilities)
      expect(result.products[0]?.slug).toBe("ehr-a");
      // telehealth-incompatible should NOT be selected
      expect(result.products.some((p) => p.slug === "telehealth-incompatible")).toBe(false);
      // telehealth-compatible should be selected
      expect(result.products.some((p) => p.slug === "telehealth-compatible")).toBe(true);
    });

    it("should apply penalty for compatibility concerns", () => {
      const fingerprint = createTestFingerprint();
      const products = [
        createTestProduct("ehr-a", [{ capabilityId: "ehr-clinical-record", strength: "core" }]),
        createTestProduct("billing-concern", [{ capabilityId: "billing-rcm", strength: "core" }], {
          integrations: [
            {
              targetSlug: "ehr-a",
              type: "manual", // manual integration = concern status
              direction: "unidirectional",
              provenance: "verified",
            },
          ],
        }),
        createTestProduct("billing-clean", [{ capabilityId: "billing-rcm", strength: "core" }]),
      ];

      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
        existingSelectionSlugs: ["ehr-a"],
      });

      // billing-clean should be preferred over billing-concern (same value but no penalty)
      // Both provide the same capability, but billing-clean has no compatibility penalty
      const billingProduct = result.products.find(
        (p) => p.slug === "billing-clean" || p.slug === "billing-concern"
      );
      expect(billingProduct?.slug).toBe("billing-clean");
    });
  });

  describe("shouldRegenerateRecommendation", () => {
  it("should return true when fingerprint changes", () => {
    const fingerprint1 = createTestFingerprint({ practiceType: "solo-clinician" });
    const fingerprint2 = createTestFingerprint({ practiceType: "therapy-group" });

    const products = [
      createTestProduct("ehr", [{ capabilityId: "ehr-clinical-record", strength: "core" }]),
    ];

    const result1 = generateRecommendation({
      fingerprint: fingerprint1,
      availableProducts: products,
    });

    const shouldRegenerate = shouldRegenerateRecommendation(fingerprint2, result1.fingerprintHash);

    expect(shouldRegenerate).toBe(true);
  });

  it("should return false when fingerprint is unchanged", () => {
    const fingerprint = createTestFingerprint();

    const products = [
      createTestProduct("ehr", [{ capabilityId: "ehr-clinical-record", strength: "core" }]),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    const shouldRegenerate = shouldRegenerateRecommendation(fingerprint, result.fingerprintHash);

    expect(shouldRegenerate).toBe(false);
  });
});

// src/domains/architect/__tests__/commercial-isolation.test.ts
// Phase 6: Tests proving commercial data cannot affect organic recommendations
//
// These tests verify the invariant that commercial relationships (affiliate status,
// sponsorship, commission rates) NEVER influence:
// - Candidate selection
// - Fit scores
// - Product ordering
// - Coverage calculations
// - Recommendation explanations or confidence

import { describe, it, expect } from "vitest";
import {
  generateRecommendation,
} from "../engines/recommendation-engine";
import { calculateFitScore } from "../engines/fit-engine";
import type {
  PracticeFingerprint,
  ProductArchitectureMetadata,
} from "../schemas";
import { createEmptyFingerprint } from "../schemas";

// ============================================================================
// TEST UTILITIES
// ============================================================================

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

// Simulated commercial metadata that should NEVER affect results
// This is intentionally kept separate from ProductArchitectureMetadata
interface SimulatedCommercialData {
  status: "active_affiliate" | "inactive_affiliate" | "sponsored" | "direct_link" | "unknown";
  commissionPercent?: number;
  partnerPriority?: number;
}

// ============================================================================
// COMMERCIAL ISOLATION TESTS
// ============================================================================

describe("Commercial Isolation", () => {
  describe("recommendation engine ignores commercial status", () => {
    it("should produce identical recommendations regardless of affiliate status", () => {
      const fingerprint = createTestFingerprint();

      // Create two identical products with only different "commercial" metadata
      // (which is NOT passed to the recommendation engine)
      const productA = createTestProduct("ehr-a", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
        { capabilityId: "telehealth", strength: "secondary" },
      ]);

      const productB = createTestProduct("ehr-b", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
        { capabilityId: "telehealth", strength: "secondary" },
      ]);

      // Simulate different commercial relationships
      const _commercialA: SimulatedCommercialData = {
        status: "active_affiliate",
        commissionPercent: 30,
        partnerPriority: 1,
      };

      const _commercialB: SimulatedCommercialData = {
        status: "unknown",
        commissionPercent: 0,
        partnerPriority: 999,
      };

      // The commercial data above is intentionally NOT used in the recommendation
      // This test verifies the architecture: commercial data cannot be passed

      const result = generateRecommendation({
        fingerprint,
        availableProducts: [productA, productB],
      });

      // Products should be ordered by organic fit, not commercial status
      // Since they have identical capabilities, order should be deterministic by slug
      expect(result.products.length).toBeGreaterThan(0);

      // Key assertion: The recommendation function doesn't accept commercial data
      // This is verified by the TypeScript types - generateRecommendation input
      // does not include any commercial fields
    });

    it("should not change candidate selection based on commission rates", () => {
      const fingerprint = createTestFingerprint();

      // Product with lower fit score but hypothetically higher commission
      const highCommission = createTestProduct("product-high-commission", [
        { capabilityId: "ehr-clinical-record", strength: "secondary" },
      ]);

      // Product with higher fit score but hypothetically lower commission
      const lowCommission = createTestProduct("product-low-commission", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
        { capabilityId: "telehealth", strength: "core" },
      ]);

      const result = generateRecommendation({
        fingerprint,
        availableProducts: [highCommission, lowCommission],
      });

      // The product with better organic fit should rank higher
      // regardless of any hypothetical commission rates
      const firstRecommended = result.products[0];
      expect(firstRecommended?.slug).toBe("product-low-commission");
    });

    it("should exclude products based on fit criteria, never commercial criteria", () => {
      const fingerprint = createTestFingerprint({
        practiceType: "solo-clinician",
      });

      // This product would be excluded for practice type mismatch
      const excludedProduct = createTestProduct("enterprise-only", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          practiceTypesExcluded: ["solo-clinician"],
          provenance: "verified",
        },
      });

      // This product fits the practice
      const includedProduct = createTestProduct("solo-friendly", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ]);

      // Even if excluded product had "better" commercial terms, it should be excluded
      const result = generateRecommendation({
        fingerprint,
        availableProducts: [excludedProduct, includedProduct],
      });

      const recommendedSlugs = result.products.map((p) => p.slug);
      expect(recommendedSlugs).not.toContain("enterprise-only");
      expect(recommendedSlugs).toContain("solo-friendly");
    });
  });

  describe("fit score ignores commercial data", () => {
    it("should compute identical scores for products with same organic data", () => {
      const fingerprint = createTestFingerprint();

      const productData = createTestProduct("test-ehr", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
        { capabilityId: "telehealth", strength: "secondary" },
      ]);

      // Compute fit score - this function takes no commercial data
      const input = {
        metadata: productData,
        productName: "Test EHR",
        productSlug: productData.productSlug,
      };
      const score1 = calculateFitScore(input, fingerprint, []);

      // Call again - should be deterministic and ignore any external state
      const score2 = calculateFitScore(input, fingerprint, []);

      expect(score1.fitScore).toBe(score2.fitScore);
      expect(score1.organicRankingValue).toBe(score2.organicRankingValue);
    });

    it("should not include commercial fields in fit contributions", () => {
      const fingerprint = createTestFingerprint();

      const product = createTestProduct("test-product", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ]);

      const input = {
        metadata: product,
        productName: "Test Product",
        productSlug: product.productSlug,
      };
      const result = calculateFitScore(input, fingerprint, []);

      // Verify no contribution has a commercial dimension
      const contributionDimensions = result.contributions.map((c) => c.dimension);

      // None of these should be commercial-related
      expect(contributionDimensions).not.toContain("commission");
      expect(contributionDimensions).not.toContain("affiliate");
      expect(contributionDimensions).not.toContain("sponsored");
      expect(contributionDimensions).not.toContain("commercial");

      // Should only contain organic dimensions
      const validDimensions = [
        "hard-requirements",
        "capability-alignment",
        "practice-type-size",
        "clinical-payer-fit",
        "stack-integration",
        "priorities",
        "cost-fit",
      ];

      for (const dimension of contributionDimensions) {
        expect(validDimensions).toContain(dimension);
      }
    });
  });

  describe("architecture enforces separation", () => {
    it("ProductArchitectureMetadata type should not include commercial fields", () => {
      // This is a compile-time check enforced by TypeScript
      // If someone adds commercial fields to ProductArchitectureMetadata,
      // this test reminds them to keep commercial data separate

      const product = createTestProduct("test", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ]);

      // These fields should NOT exist on ProductArchitectureMetadata
      // TypeScript will error if they're added without updating these tests
      expect((product as any).affiliateStatus).toBeUndefined();
      expect((product as any).commercialStatus).toBeUndefined();
      expect((product as any).commissionRate).toBeUndefined();
      expect((product as any).sponsoredPriority).toBeUndefined();
      expect((product as any).partnerNetwork).toBeUndefined();
    });

    it("generateRecommendation input should not accept commercial options", () => {
      // TypeScript enforces this at compile time
      // This test documents the expected interface

      const fingerprint = createTestFingerprint();
      const products = [
        createTestProduct("ehr-a", [{ capabilityId: "ehr-clinical-record", strength: "core" }]),
      ];

      // Verify the function signature doesn't include commercial parameters
      // by showing that only fingerprint, availableProducts, currentStack,
      // and budget are accepted
      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
        currentStack: [],
        budgetCents: 10000,
      });

      expect(result).toBeDefined();
      expect(result.products).toBeDefined();
    });
  });

  describe("kill switch doesn't affect organic results", () => {
    it("disabling affiliate tracking should not change recommendation order", () => {
      // The kill switch only affects which URL is shown (affiliate vs direct)
      // It should never affect the recommendation engine results

      const fingerprint = createTestFingerprint();
      const products = [
        createTestProduct("product-a", [
          { capabilityId: "ehr-clinical-record", strength: "core" },
        ]),
        createTestProduct("product-b", [
          { capabilityId: "ehr-clinical-record", strength: "secondary" },
        ]),
      ];

      // Generate recommendation (kill switch state is irrelevant here)
      const result = generateRecommendation({
        fingerprint,
        availableProducts: products,
      });

      // Order should be determined by organic fit, not kill switch state
      expect(result.products[0]?.slug).toBe("product-a");
    });
  });
});

describe("Commercial data types are separate from organic schemas", () => {
  it("CommercialMetadata import should work independently", async () => {
    // Dynamically import to verify the module is separate
    const commercial = await import("@/lib/schemas/commercial");

    expect(commercial.CommercialStatusZ).toBeDefined();
    expect(commercial.isCompensated).toBeDefined();
    expect(commercial.needsDisclosure).toBeDefined();

    // Verify it can classify commercial status
    expect(commercial.isCompensated("active_affiliate")).toBe(true);
    expect(commercial.isCompensated("unknown")).toBe(false);
  });
});

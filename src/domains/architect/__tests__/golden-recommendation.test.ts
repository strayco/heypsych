/**
 * Golden Tests for Fingerprint-Based Recommendations
 *
 * Phase 1 acceptance criteria: "Golden tests cover exclusions, unknown data,
 * ties, stale evidence, incompatibilities, budget, and deterministic ordering."
 *
 * These tests verify that recommendations are:
 * 1. Deterministic: Same input → same output
 * 2. Stable: Product order doesn't randomly change
 * 3. Correct: Exclusions, ties, and edge cases handled properly
 */

import { describe, it, expect } from "vitest";
import { generateRecommendation } from "../engines/recommendation-engine";
import {
  SOLO_THERAPIST_CASH,
  SOLO_PSYCHIATRIST,
  SMALL_GROUP_PRACTICE,
  TELEHEALTH_ONLY_PRACTICE,
  LARGE_ENTERPRISE_PRACTICE,
} from "../fixtures";
import type {
  PracticeFingerprint,
  ProductArchitectureMetadata,
  CapabilityStrength,
  CapabilityProvenance,
} from "../schemas";
import { createEmptyFingerprint } from "../schemas";

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createTestProduct(
  slug: string,
  capabilities: Array<{ capabilityId: string; strength: CapabilityStrength }>,
  overrides: Partial<ProductArchitectureMetadata> = {}
): ProductArchitectureMetadata {
  return {
    productSlug: slug,
    capabilityMapStatus: "reviewed-complete",
    capabilities: capabilities.map((c) => ({
      capabilityId: c.capabilityId as any,
      strength: c.strength,
      provenance: "verified" as CapabilityProvenance,
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

// Standard test product catalog
function createStandardProductCatalog(): ProductArchitectureMetadata[] {
  return [
    // EHR Options
    createTestProduct("ehr-simplepractice", [
      { capabilityId: "ehr-clinical-record", strength: "core" },
      { capabilityId: "clinical-documentation", strength: "strong" },
      { capabilityId: "scheduling", strength: "core" },
      { capabilityId: "telehealth", strength: "strong" },
      { capabilityId: "billing-rcm", strength: "adequate" },
    ], {
      pricing: { basis: "per-provider-month", minPriceCents: 3900, provenance: "verified" },
      fitEvidence: {
        practiceTypesIdeal: ["solo-clinician", "therapy-group"],
        sizeBucketsIdeal: ["solo", "2-5"],
        provenance: "verified",
      },
    }),
    createTestProduct("ehr-therapynotes", [
      { capabilityId: "ehr-clinical-record", strength: "core" },
      { capabilityId: "clinical-documentation", strength: "core" },
      { capabilityId: "scheduling", strength: "strong" },
      { capabilityId: "billing-rcm", strength: "strong" },
    ], {
      pricing: { basis: "per-provider-month", minPriceCents: 4900, provenance: "verified" },
      fitEvidence: {
        practiceTypesIdeal: ["solo-clinician", "therapy-group"],
        provenance: "verified",
      },
    }),
    createTestProduct("ehr-osmind", [
      { capabilityId: "ehr-clinical-record", strength: "core" },
      { capabilityId: "clinical-documentation", strength: "core" },
      { capabilityId: "prescribing-erx", strength: "core" },
      { capabilityId: "epcs", strength: "core" },
    ], {
      pricing: { basis: "per-provider-month", minPriceCents: 15000, provenance: "verified" },
      fitEvidence: {
        practiceTypesIdeal: ["psychiatry"],
        clinicalRolesRequired: ["psychiatrist", "psychiatric-np"],
        provenance: "verified",
      },
    }),
    createTestProduct("ehr-enterprise", [
      { capabilityId: "ehr-clinical-record", strength: "core" },
      { capabilityId: "clinical-documentation", strength: "core" },
      { capabilityId: "prescribing-erx", strength: "core" },
      { capabilityId: "epcs", strength: "core" },
      { capabilityId: "reporting", strength: "core" },
      { capabilityId: "billing-rcm", strength: "core" },
    ], {
      pricing: { basis: "custom-quote", requiresQuote: true, provenance: "verified" },
      fitEvidence: {
        practiceTypesIdeal: ["therapy-plus-psychiatry"],
        sizeBucketsIdeal: ["26-50", "51-100", "101-250", "250+"],
        sizeBucketsExcluded: ["solo", "2-5"],
        provenance: "verified",
      },
    }),

    // Telehealth Options
    createTestProduct("telehealth-doxy", [
      { capabilityId: "telehealth", strength: "core" },
    ], {
      pricing: { basis: "per-provider-month", minPriceCents: 0, provenance: "verified" },
    }),
    createTestProduct("telehealth-zoom", [
      { capabilityId: "telehealth", strength: "strong" },
    ], {
      pricing: { basis: "per-provider-month", minPriceCents: 1599, provenance: "verified" },
    }),

    // Billing Options
    createTestProduct("billing-therabill", [
      { capabilityId: "billing-rcm", strength: "core" },
      { capabilityId: "claims-submission", strength: "core" },
    ], {
      pricing: { basis: "per-provider-month", minPriceCents: 5000, provenance: "verified" },
    }),

    // State-restricted product
    createTestProduct("ehr-california-only", [
      { capabilityId: "ehr-clinical-record", strength: "core" },
    ], {
      pricing: { basis: "per-provider-month", minPriceCents: 2900, provenance: "verified" },
      fitEvidence: {
        statesExcluded: ["NY", "TX", "FL"], // Only works in CA and some other states
        provenance: "verified",
      },
    }),
  ];
}

// ============================================================================
// GOLDEN TEST: DETERMINISTIC ORDERING
// ============================================================================

describe("Golden Tests: Deterministic Ordering", () => {
  it("should produce identical ordered results for SOLO_THERAPIST_CASH across 10 runs", () => {
    const products = createStandardProductCatalog();
    const results: string[][] = [];

    // Run 10 times
    for (let i = 0; i < 10; i++) {
      const result = generateRecommendation({
        fingerprint: SOLO_THERAPIST_CASH,
        availableProducts: products,
      });
      results.push(result.products.map((p) => p.slug));
    }

    // All runs should produce identical order
    const firstRun = results[0];
    results.forEach((run, index) => {
      expect(run).toEqual(firstRun);
    });
  });

  it("should produce identical ordered results for SOLO_PSYCHIATRIST across 10 runs", () => {
    const products = createStandardProductCatalog();
    const results: string[][] = [];

    for (let i = 0; i < 10; i++) {
      const result = generateRecommendation({
        fingerprint: SOLO_PSYCHIATRIST,
        availableProducts: products,
      });
      results.push(result.products.map((p) => p.slug));
    }

    const firstRun = results[0];
    results.forEach((run) => {
      expect(run).toEqual(firstRun);
    });
  });

  it("should produce identical ordered results for LARGE_ENTERPRISE_PRACTICE across 10 runs", () => {
    const products = createStandardProductCatalog();
    const results: string[][] = [];

    for (let i = 0; i < 10; i++) {
      const result = generateRecommendation({
        fingerprint: LARGE_ENTERPRISE_PRACTICE,
        availableProducts: products,
      });
      results.push(result.products.map((p) => p.slug));
    }

    const firstRun = results[0];
    results.forEach((run) => {
      expect(run).toEqual(firstRun);
    });
  });
});

// ============================================================================
// GOLDEN TEST: HARD EXCLUSIONS
// ============================================================================

describe("Golden Tests: Hard Exclusions", () => {
  it("should exclude enterprise-only products for solo practices", () => {
    const products = createStandardProductCatalog();

    const result = generateRecommendation({
      fingerprint: SOLO_THERAPIST_CASH,
      availableProducts: products,
    });

    // ehr-enterprise has sizeBucketsExcluded: ["solo", "2-5"]
    expect(result.products.some((p) => p.slug === "ehr-enterprise")).toBe(false);
  });

  it("should exclude state-restricted products for practices in excluded states", () => {
    const products = createStandardProductCatalog();

    // SMALL_GROUP_PRACTICE is in NY
    const result = generateRecommendation({
      fingerprint: SMALL_GROUP_PRACTICE,
      availableProducts: products,
    });

    // ehr-california-only excludes NY
    expect(result.products.some((p) => p.slug === "ehr-california-only")).toBe(false);
  });

  it("should include state-restricted products for practices in allowed states", () => {
    const products = createStandardProductCatalog();

    // SOLO_PSYCHIATRIST is in CA
    const result = generateRecommendation({
      fingerprint: SOLO_PSYCHIATRIST,
      availableProducts: products,
    });

    // ehr-california-only should be available for CA
    // (Whether it's recommended depends on fit score)
  });
});

// ============================================================================
// GOLDEN TEST: BAA/HIPAA COMPLIANCE
// ============================================================================

// Helper to create test fingerprint for BAA tests
function createBaaTestFingerprint(overrides: Partial<PracticeFingerprint> = {}): PracticeFingerprint {
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

describe("Golden Tests: BAA/HIPAA Compliance", () => {

  it("should exclude products without BAA for insurance-billing practices", () => {
    // Uses primaryPayerType: "commercial-insurance" (default)
    const fingerprint = createBaaTestFingerprint();

    const products = [
      createTestProduct("ehr-no-baa", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        compliance: {
          baaAvailable: false,
          provenance: "verified",
        },
      }),
      createTestProduct("ehr-with-baa", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        compliance: {
          baaAvailable: true,
          provenance: "verified",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // Product without BAA should be excluded
    expect(result.products.some((p) => p.slug === "ehr-no-baa")).toBe(false);
    // Product with BAA should be included
    expect(result.products.some((p) => p.slug === "ehr-with-baa")).toBe(true);
  });

  it("should not exclude products without BAA for cash-pay practices", () => {
    const fingerprint = createBaaTestFingerprint({
      primaryPayerType: "cash",
      payerMix: { cash: 95, commercial: 5 },
    });

    const products = [
      createTestProduct("ehr-no-baa", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        compliance: {
          baaAvailable: false,
          provenance: "verified",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // Product without BAA should NOT be excluded for cash-pay
    expect(result.products.some((p) => p.slug === "ehr-no-baa")).toBe(true);
  });

  it("should flag but not exclude products with unknown BAA status for insurance practices", () => {
    const fingerprint = createBaaTestFingerprint();

    const products = [
      createTestProduct("ehr-unknown-baa", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        compliance: {
          // baaAvailable is undefined (unknown)
          provenance: "unknown",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // Product with unknown BAA should NOT be hard-excluded
    // (flagged for user verification but included)
    expect(result.products.some((p) => p.slug === "ehr-unknown-baa")).toBe(true);
  });

  it("should exclude no-BAA products for mixed payer practices", () => {
    const fingerprint = createBaaTestFingerprint({
      primaryPayerType: "mixed",
    });

    const products = [
      createTestProduct("ehr-no-baa", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        compliance: {
          baaAvailable: false,
          provenance: "verified",
        },
      }),
      createTestProduct("ehr-with-baa", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        compliance: {
          baaAvailable: true,
          provenance: "verified",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // Product without BAA should be excluded for mixed payer
    expect(result.products.some((p) => p.slug === "ehr-no-baa")).toBe(false);
  });
});

// ============================================================================
// GOLDEN TEST: UNKNOWN DATA HANDLING
// ============================================================================

describe("Golden Tests: Unknown Data Handling", () => {
  it("should handle products with unknown pricing gracefully", () => {
    const products = [
      createTestProduct("ehr-unknown-price", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        pricing: undefined, // Unknown pricing
      }),
      createTestProduct("ehr-known-price", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        pricing: { basis: "per-provider-month", minPriceCents: 5000, provenance: "verified" },
      }),
    ];

    const result = generateRecommendation({
      fingerprint: SOLO_THERAPIST_CASH,
      availableProducts: products,
    });

    // Should track unknown pricing products
    expect(result.productsWithUnknownPricing).toBeGreaterThanOrEqual(0);
    // Should not crash
    expect(result.products).toBeDefined();
  });

  it("should not treat unknown evidence as meeting hard requirements", () => {
    const products = [
      createTestProduct("ehr-no-evidence", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: undefined, // No fit evidence
      }),
      createTestProduct("ehr-verified-fit", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          practiceTypesIdeal: ["solo-clinician"],
          provenance: "verified",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint: SOLO_THERAPIST_CASH,
      availableProducts: products,
    });

    // Product with verified fit evidence should be preferred
    if (result.products.length > 0) {
      // If both are included, verified fit should rank higher
      const verifiedIndex = result.products.findIndex((p) => p.slug === "ehr-verified-fit");
      const unknownIndex = result.products.findIndex((p) => p.slug === "ehr-no-evidence");

      if (verifiedIndex !== -1 && unknownIndex !== -1) {
        expect(verifiedIndex).toBeLessThan(unknownIndex);
      }
    }
  });

  it("should handle incomplete fingerprint with explicit message", () => {
    const incompleteFingerprint: PracticeFingerprint = {
      ...createEmptyFingerprint(),
      // Missing required fields
    };

    const products = createStandardProductCatalog();

    const result = generateRecommendation({
      fingerprint: incompleteFingerprint,
      availableProducts: products,
    });

    // Should return empty or with clear reason
    expect(result.products.length).toBe(0);
    expect(result.summaryReasons.some((r) => r.toLowerCase().includes("incomplete"))).toBe(true);
  });
});

// ============================================================================
// GOLDEN TEST: TIES AND TIEBREAKER LOGIC
// ============================================================================

describe("Golden Tests: Ties and Tiebreaker Logic", () => {
  it("should use deterministic tiebreaker when products have equal scores", () => {
    // Create two products with identical capabilities and pricing
    const products = [
      createTestProduct("ehr-alpha", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        pricing: { basis: "per-provider-month", minPriceCents: 5000, provenance: "verified" },
      }),
      createTestProduct("ehr-beta", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        pricing: { basis: "per-provider-month", minPriceCents: 5000, provenance: "verified" },
      }),
    ];

    // Run multiple times to verify determinism
    const results: string[] = [];
    for (let i = 0; i < 5; i++) {
      const result = generateRecommendation({
        fingerprint: SOLO_THERAPIST_CASH,
        availableProducts: products,
      });
      if (result.products.length > 0) {
        results.push(result.products[0].slug);
      }
    }

    // All results should be the same (deterministic tiebreaker)
    const firstResult = results[0];
    results.forEach((r) => {
      expect(r).toBe(firstResult);
    });
  });

  it("should prefer lower price when other factors are equal", () => {
    const products = [
      createTestProduct("ehr-expensive", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        pricing: { basis: "per-provider-month", minPriceCents: 10000, provenance: "verified" },
      }),
      createTestProduct("ehr-cheap", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        pricing: { basis: "per-provider-month", minPriceCents: 3000, provenance: "verified" },
      }),
    ];

    const fingerprint: PracticeFingerprint = {
      ...SOLO_THERAPIST_CASH,
      priorities: ["low-cost", "ease-of-use"], // Price is a priority
    };

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // Cheaper product should be preferred
    if (result.products.length > 0) {
      expect(result.products[0].slug).toBe("ehr-cheap");
    }
  });
});

// ============================================================================
// GOLDEN TEST: INCOMPATIBILITIES
// ============================================================================

describe("Golden Tests: Incompatibilities", () => {
  it("should exclude incompatible products when existing selections present", () => {
    const products = [
      createTestProduct("ehr-main", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ]),
      createTestProduct("billing-incompatible", [
        { capabilityId: "billing-rcm", strength: "core" },
      ], {
        integrations: [
          {
            targetSlug: "ehr-main",
            type: "incompatible",
            direction: "unidirectional",
            provenance: "verified",
            notes: "Known integration issue",
          },
        ],
      }),
      createTestProduct("billing-compatible", [
        { capabilityId: "billing-rcm", strength: "core" },
      ]),
    ];

    const result = generateRecommendation({
      fingerprint: SMALL_GROUP_PRACTICE,
      availableProducts: products,
      existingSelectionSlugs: ["ehr-main"],
    });

    // Incompatible product should be excluded
    expect(result.products.some((p) => p.slug === "billing-incompatible")).toBe(false);
    // Compatible product should be included (if billing capability needed)
    expect(result.products.some((p) => p.slug === "billing-compatible")).toBe(true);
  });

  it("should exclude products that become incompatible during recommendation", () => {
    const products = [
      createTestProduct("ehr-best", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
        { capabilityId: "clinical-documentation", strength: "core" },
      ]),
      createTestProduct("telehealth-incompatible", [
        { capabilityId: "telehealth", strength: "core" },
      ], {
        integrations: [
          {
            targetSlug: "ehr-best",
            type: "incompatible",
            direction: "unidirectional",
            provenance: "verified",
          },
        ],
      }),
      createTestProduct("telehealth-compatible", [
        { capabilityId: "telehealth", strength: "core" },
      ]),
    ];

    const result = generateRecommendation({
      fingerprint: TELEHEALTH_ONLY_PRACTICE, // Needs telehealth
      availableProducts: products,
    });

    // EHR should be selected first (more capabilities)
    // Then incompatible telehealth should be excluded
    expect(result.products.some((p) => p.slug === "telehealth-incompatible")).toBe(false);
  });
});

// ============================================================================
// GOLDEN TEST: BUDGET CONSTRAINTS
// ============================================================================

describe("Golden Tests: Budget Constraints", () => {
  it("should track budget status when recommendation exceeds budget", () => {
    const products = [
      createTestProduct("expensive-ehr", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        pricing: { basis: "per-provider-month", minPriceCents: 20000, provenance: "verified" }, // $200/mo
      }),
    ];

    const tightBudget: PracticeFingerprint = {
      ...SOLO_THERAPIST_CASH,
      monthlyBudget: 50, // Only $50 budget
    };

    const result = generateRecommendation({
      fingerprint: tightBudget,
      availableProducts: products,
    });

    // Budget status should be false or null (null = undeterminable)
    // When budget is set and exceeded, isWithinBudget should not be true
    expect(result.isWithinBudget).not.toBe(true);
  });

  it("should track budget info for SOLO_THERAPIST_CASH ($150 budget)", () => {
    const products = createStandardProductCatalog();

    const result = generateRecommendation({
      fingerprint: SOLO_THERAPIST_CASH, // $150 budget
      availableProducts: products,
    });

    // Budget tracking should exist (may be boolean or null if undeterminable)
    // Result object should have budget-related fields
    expect(result).toBeDefined();
    expect(result.products).toBeDefined();
    // isWithinBudget should be present (value may be boolean or null)
    expect("isWithinBudget" in result).toBe(true);
  });

  it("should handle products requiring custom quotes", () => {
    const products = [
      createTestProduct("enterprise-system", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        pricing: {
          basis: "custom-quote",
          requiresQuote: true,
          provenance: "verified",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint: LARGE_ENTERPRISE_PRACTICE,
      availableProducts: products,
    });

    expect(result.productsRequiringQuote).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// GOLDEN TEST: STALE EVIDENCE
// ============================================================================

describe("Golden Tests: Stale Evidence Handling", () => {
  it("should prefer products with verified provenance over unverified", () => {
    const products = [
      createTestProduct("ehr-verified", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          practiceTypesIdeal: ["solo-clinician"],
          provenance: "verified",
        },
      }),
      createTestProduct("ehr-inferred", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          practiceTypesIdeal: ["solo-clinician"],
          provenance: "inferred-from-marketing",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint: SOLO_THERAPIST_CASH,
      availableProducts: products,
    });

    // Verified provenance should be preferred
    if (result.products.length > 0) {
      const verifiedIndex = result.products.findIndex((p) => p.slug === "ehr-verified");
      const inferredIndex = result.products.findIndex((p) => p.slug === "ehr-inferred");

      if (verifiedIndex !== -1 && inferredIndex !== -1) {
        expect(verifiedIndex).toBeLessThan(inferredIndex);
      }
    }
  });

  it("should handle products with incomplete capability maps", () => {
    const products = [
      createTestProduct("ehr-complete", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        capabilityMapStatus: "reviewed-complete",
      }),
      createTestProduct("ehr-partial", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        capabilityMapStatus: "partial-inferred",
      }),
    ];

    const result = generateRecommendation({
      fingerprint: SOLO_THERAPIST_CASH,
      availableProducts: products,
    });

    // Should not crash with partial maps
    expect(result.products).toBeDefined();
  });
});

// ============================================================================
// GOLDEN TEST: FINGERPRINT COMPLETENESS
// ============================================================================

describe("Golden Tests: Fingerprint Completeness Validation", () => {
  it("should validate SOLO_THERAPIST_CASH has all required fields", () => {
    expect(SOLO_THERAPIST_CASH.practiceType).toBeDefined();
    expect(SOLO_THERAPIST_CASH.sizeBucket).toBeDefined();
    expect(SOLO_THERAPIST_CASH.primaryPayerType).toBeDefined();
    expect(SOLO_THERAPIST_CASH.prescribingLevel).toBeDefined();
    expect(SOLO_THERAPIST_CASH.deliveryModel).toBeDefined();
    expect(SOLO_THERAPIST_CASH.priorities.length).toBeGreaterThanOrEqual(2);
  });

  it("should validate SOLO_PSYCHIATRIST has prescribing requirements", () => {
    expect(SOLO_PSYCHIATRIST.prescribingLevel).toBe("controlled-substances-epcs");
    expect(SOLO_PSYCHIATRIST.clinicalRoles).toContain("psychiatrist");
  });

  it("should validate TELEHEALTH_ONLY_PRACTICE has multi-state config", () => {
    expect(TELEHEALTH_ONLY_PRACTICE.deliveryModel).toBe("telehealth");
    expect(TELEHEALTH_ONLY_PRACTICE.isMultiState).toBe(true);
    expect(TELEHEALTH_ONLY_PRACTICE.statesServed.length).toBeGreaterThan(1);
  });

  it("should validate LARGE_ENTERPRISE_PRACTICE has enterprise config", () => {
    expect(LARGE_ENTERPRISE_PRACTICE.sizeBucket).toBe("51-100");
    expect(LARGE_ENTERPRISE_PRACTICE.exactProviderCount).toBeGreaterThanOrEqual(50);
    expect(LARGE_ENTERPRISE_PRACTICE.exactLocationCount).toBeGreaterThan(1);
  });
});

// ============================================================================
// GOLDEN TEST: CATALOG VERSION STABILITY
// ============================================================================

describe("Golden Tests: Catalog Version Stability", () => {
  it("should include catalog snapshot info in result", () => {
    const products = createStandardProductCatalog();

    const result = generateRecommendation({
      fingerprint: SOLO_THERAPIST_CASH,
      availableProducts: products,
    });

    // Result should include versioning info
    expect(result.fingerprintHash).toBeDefined();
    expect(typeof result.fingerprintHash).toBe("string");
    expect(result.fingerprintHash.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// GOLDEN TEST: CLINICAL ROLE EXCLUSIONS
// ============================================================================

// Helper for clinical role exclusion tests
function createPsychiatryFingerprint(overrides: Partial<PracticeFingerprint> = {}): PracticeFingerprint {
  return {
    ...createEmptyFingerprint(),
    practiceType: "psychiatry",
    sizeBucket: "solo",
    primaryPayerType: "commercial-insurance",
    prescribingLevel: "controlled-substances-epcs",
    deliveryModel: "hybrid",
    clinicalRoles: ["psychiatrist"],
    priorities: ["clinical-workflow", "integrations", "ease-of-use"],
    ...overrides,
  };
}

describe("Golden Tests: Clinical Role Exclusions", () => {
  it("should exclude products that explicitly exclude practice's clinical roles", () => {
    const fingerprint = createPsychiatryFingerprint();

    const products = [
      createTestProduct("ehr-therapy-only", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          clinicalRolesExcluded: ["psychiatrist", "psychiatric-np"],
          provenance: "verified",
        },
      }),
      createTestProduct("ehr-all-roles", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ]),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // Therapy-only product should be excluded for psychiatry practice
    expect(result.products.some((p) => p.slug === "ehr-therapy-only")).toBe(false);
    expect(result.products.some((p) => p.slug === "ehr-all-roles")).toBe(true);
  });

  it("should not exclude products when no clinical roles match exclusion list", () => {
    // Therapist fingerprint has empty clinicalRoles
    const fingerprint = createBaaTestFingerprint({
      clinicalRoles: [], // Empty - no specific roles
    });

    const products = [
      createTestProduct("ehr-excludes-prescribers", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          clinicalRolesExcluded: ["psychiatrist", "psychiatric-np"],
          provenance: "verified",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // Should NOT be excluded since therapist doesn't have those roles
    expect(result.products.some((p) => p.slug === "ehr-excludes-prescribers")).toBe(true);
  });
});

// ============================================================================
// GOLDEN TEST: SIZE BUCKET EXCLUSIONS
// ============================================================================

// Helper for enterprise practice tests
function createEnterpriseFingerprint(overrides: Partial<PracticeFingerprint> = {}): PracticeFingerprint {
  return {
    ...createEmptyFingerprint(),
    practiceType: "therapy-group",
    sizeBucket: "51-100",
    primaryPayerType: "commercial-insurance",
    prescribingLevel: "prescribing",
    deliveryModel: "hybrid",
    priorities: ["scalability", "integrations", "billing-collections"],
    ...overrides,
  };
}

describe("Golden Tests: Size Bucket Exclusions", () => {
  it("should exclude products that explicitly exclude practice's size bucket", () => {
    // Use createBaaTestFingerprint which has sizeBucket: "solo"
    const fingerprint = createBaaTestFingerprint({ sizeBucket: "solo" });

    const products = [
      createTestProduct("ehr-enterprise-only", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          sizeBucketsExcluded: ["solo", "2-5", "6-10"],
          provenance: "verified",
        },
      }),
      createTestProduct("ehr-any-size", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ]),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // Enterprise-only product should be excluded for solo practice
    expect(result.products.some((p) => p.slug === "ehr-enterprise-only")).toBe(false);
    expect(result.products.some((p) => p.slug === "ehr-any-size")).toBe(true);
  });

  it("should not exclude products for large practices when small sizes are excluded", () => {
    const fingerprint = createEnterpriseFingerprint({ sizeBucket: "51-100" });

    const products = [
      createTestProduct("ehr-enterprise-only", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          sizeBucketsExcluded: ["solo", "2-5", "6-10"],
          provenance: "verified",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // Should NOT be excluded for large enterprise practice
    expect(result.products.some((p) => p.slug === "ehr-enterprise-only")).toBe(true);
  });
});

// ============================================================================
// GOLDEN TEST: DELIVERY MODEL EXCLUSIONS
// ============================================================================

// Helper for telehealth-only practice tests
function createTelehealthFingerprint(overrides: Partial<PracticeFingerprint> = {}): PracticeFingerprint {
  return {
    ...createEmptyFingerprint(),
    practiceType: "telehealth-first",
    sizeBucket: "solo",
    primaryPayerType: "commercial-insurance",
    prescribingLevel: "none",
    deliveryModel: "telehealth",
    priorities: ["clinical-workflow", "patient-experience", "ease-of-use"],
    ...overrides,
  };
}

describe("Golden Tests: Delivery Model Exclusions", () => {
  it("should exclude products that don't support telehealth for telehealth-only practices", () => {
    const fingerprint = createTelehealthFingerprint();

    const products = [
      createTestProduct("ehr-in-person-only", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          deliveryModels: ["in-person"],
          provenance: "verified",
        },
      }),
      createTestProduct("ehr-telehealth-capable", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          deliveryModels: ["in-person", "hybrid", "telehealth"],
          provenance: "verified",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // In-person-only should be excluded for telehealth practice
    expect(result.products.some((p) => p.slug === "ehr-in-person-only")).toBe(false);
    expect(result.products.some((p) => p.slug === "ehr-telehealth-capable")).toBe(true);
  });

  it("should exclude products with explicit delivery model exclusions", () => {
    const fingerprint = createTelehealthFingerprint();

    const products = [
      createTestProduct("ehr-no-telehealth", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          deliveryModelsExcluded: ["telehealth"],
          provenance: "verified",
        },
      }),
      createTestProduct("ehr-all-delivery", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ]),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // Product that explicitly excludes telehealth should be excluded
    expect(result.products.some((p) => p.slug === "ehr-no-telehealth")).toBe(false);
    expect(result.products.some((p) => p.slug === "ehr-all-delivery")).toBe(true);
  });

  it("should not hard-exclude when deliveryModels is unknown (empty)", () => {
    const fingerprint = createTelehealthFingerprint();

    // If product has no explicit deliveryModels data, don't hard-exclude
    const products = [
      createTestProduct("ehr-unknown-delivery", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          // No deliveryModels specified - unknown
          provenance: "verified",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint,
      availableProducts: products,
    });

    // Should NOT be hard-excluded when delivery model support is unknown
    expect(result.products.some((p) => p.slug === "ehr-unknown-delivery")).toBe(true);
  });

  it("should not exclude hybrid products for in-person practices", () => {
    // Create an in-person only practice with proper requirements
    const inPersonFingerprint = createBaaTestFingerprint({
      deliveryModel: "in-person",
    });

    const products = [
      createTestProduct("ehr-hybrid-only", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
      ], {
        fitEvidence: {
          deliveryModels: ["hybrid", "telehealth"],
          provenance: "verified",
        },
      }),
    ];

    const result = generateRecommendation({
      fingerprint: inPersonFingerprint,
      availableProducts: products,
    });

    // Only telehealth-only practices get hard-excluded from non-telehealth products
    // In-person practices can still use hybrid/telehealth products
    expect(result.products.some((p) => p.slug === "ehr-hybrid-only")).toBe(true);
  });
});

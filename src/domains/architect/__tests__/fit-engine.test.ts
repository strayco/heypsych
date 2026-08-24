// src/domains/architect/__tests__/fit-engine.test.ts
// Tests for the fit engine - determinism, scoring, and explanations

import { describe, it, expect } from "vitest";
import { calculateFitScore, sortByFit } from "../engines/fit-engine";
import type { ProductArchitectureMetadata, PracticeFingerprint, FitResult } from "../schemas";
import { createEmptyFingerprint } from "../schemas";

// Factory for creating test product metadata
function createTestMetadata(overrides: Partial<ProductArchitectureMetadata> = {}): ProductArchitectureMetadata {
  return {
    productSlug: overrides.productSlug ?? "test-product",
    capabilityMapStatus: overrides.capabilityMapStatus ?? "reviewed-complete",
    capabilities: overrides.capabilities ?? [
      { capabilityId: "ehr-clinical-record", strength: "core" },
      { capabilityId: "clinical-documentation", strength: "strong" },
    ],
    integrations: overrides.integrations ?? [],
    fitEvidence: overrides.fitEvidence ?? {
      practiceTypes: ["solo-clinician", "therapy-group"],
      idealSizes: ["solo", "2-5", "6-10"],
      provenance: "verified",
    },
    pricing: overrides.pricing ?? {
      basis: "per-provider-month",
      minPriceCents: 4900,
      maxPriceCents: 9900,
      typicalPriceCents: 6900,
      freeTierAvailable: false,
      provenance: "verified",
    },
    ...overrides,
  };
}

// Factory for creating test fingerprints
function createTestFingerprint(overrides: Partial<PracticeFingerprint> = {}): PracticeFingerprint {
  const base = createEmptyFingerprint();
  return {
    ...base,
    practiceType: overrides.practiceType ?? "solo-clinician",
    sizeBucket: overrides.sizeBucket ?? "solo",
    primaryPayerType: overrides.primaryPayerType ?? "mixed",
    prescribingLevel: overrides.prescribingLevel ?? "none",
    deliveryModel: overrides.deliveryModel ?? "hybrid",
    priorities: overrides.priorities ?? ["clinical-workflow", "ease-of-use", "low-cost"],
    monthlyBudget: overrides.monthlyBudget ?? 200,
    ...overrides,
  };
}

describe("calculateFitScore", () => {
  it("should return deterministic results for the same inputs", () => {
    const metadata = createTestMetadata();
    const fingerprint = createTestFingerprint();
    const input = {
      metadata,
      productName: "Test Product",
      productSlug: "test-product",
    };

    const result1 = calculateFitScore(input, fingerprint, []);
    const result2 = calculateFitScore(input, fingerprint, []);

    // Results must be identical for same inputs
    expect(result1.fitScore).toBe(result2.fitScore);
    expect(result1.dataConfidence).toBe(result2.dataConfidence);
    expect(result1.organicRankingValue).toBe(result2.organicRankingValue);
    expect(result1.contributions.length).toBe(result2.contributions.length);
  });

  it("should return null fitScore for products with hard incompatibility", () => {
    const metadata = createTestMetadata({
      fitEvidence: {
        practiceTypesExcluded: ["solo-clinician"],
        provenance: "verified",
      },
    });
    const fingerprint = createTestFingerprint({ practiceType: "solo-clinician" });
    const input = {
      metadata,
      productName: "Test Product",
      productSlug: "test-product",
    };

    const result = calculateFitScore(input, fingerprint, []);

    expect(result.hasHardIncompatibility).toBe(true);
    expect(result.fitScore).toBeNull();
    expect(result.incompatibilityReason).toBeDefined();
  });

  it("should return null fitScore for products with insufficient data", () => {
    const metadata = createTestMetadata({
      capabilityMapStatus: "unreviewed",
      capabilities: [],
      fitEvidence: undefined,
      pricing: undefined,
    });
    const fingerprint = createTestFingerprint();
    const input = {
      metadata,
      productName: "Test Product",
      productSlug: "test-product",
    };

    const result = calculateFitScore(input, fingerprint, []);

    expect(result.isInsufficientData).toBe(true);
    expect(result.fitScore).toBeNull();
    expect(result.dataConfidence).toBeLessThan(25);
  });

  it("should include all fit dimensions in contributions", () => {
    const metadata = createTestMetadata();
    const fingerprint = createTestFingerprint();
    const input = {
      metadata,
      productName: "Test Product",
      productSlug: "test-product",
    };

    const result = calculateFitScore(input, fingerprint, []);

    const dimensions = result.contributions.map((c) => c.dimension);
    expect(dimensions).toContain("hard-requirements");
    expect(dimensions).toContain("capability-alignment");
    expect(dimensions).toContain("practice-type-size");
    expect(dimensions).toContain("clinical-payer-fit");
    expect(dimensions).toContain("stack-integration");
    expect(dimensions).toContain("priorities");
    expect(dimensions).toContain("cost-fit");
  });

  it("should provide reasons for each contribution", () => {
    const metadata = createTestMetadata();
    const fingerprint = createTestFingerprint();
    const input = {
      metadata,
      productName: "Test Product",
      productSlug: "test-product",
    };

    const result = calculateFitScore(input, fingerprint, []);

    for (const contribution of result.contributions) {
      expect(contribution.reasons).toBeDefined();
      expect(Array.isArray(contribution.reasons)).toBe(true);
    }
  });

  it("should calculate higher scores for better practice-type matches", () => {
    const metadata = createTestMetadata({
      fitEvidence: {
        practiceTypes: ["solo-clinician"],
        idealSizes: ["solo"],
        provenance: "verified",
      },
    });

    // Perfect match
    const perfectMatch = createTestFingerprint({
      practiceType: "solo-clinician",
      sizeBucket: "solo",
    });

    // No explicit match data
    const noMatchData = createTestMetadata({
      fitEvidence: undefined,
    });

    const input1 = { metadata, productName: "Test", productSlug: "test" };
    const input2 = { metadata: noMatchData, productName: "Test", productSlug: "test" };

    const result1 = calculateFitScore(input1, perfectMatch, []);
    const result2 = calculateFitScore(input2, perfectMatch, []);

    // Product with explicit match data should have higher confidence
    expect(result1.dataConfidence).toBeGreaterThan(result2.dataConfidence);
  });
});

describe("sortByFit", () => {
  it("should sort products with hard incompatibility last", () => {
    const results: FitResult[] = [
      {
        productSlug: "incompatible",
        score: null,
        fitScore: null,
        dataConfidence: 0,
        organicRankingValue: null,
        contributions: [],
        hasHardIncompatibility: true,
        incompatibilityReason: "Not compatible",
        isLimitedData: true,
        isInsufficientData: true,
      },
      {
        productSlug: "compatible",
        score: 75,
        fitScore: 75,
        dataConfidence: 80,
        organicRankingValue: 76,
        contributions: [],
        hasHardIncompatibility: false,
        isLimitedData: false,
        isInsufficientData: false,
      },
    ];

    const sorted = sortByFit(results);

    expect(sorted[0].productSlug).toBe("compatible");
    expect(sorted[1].productSlug).toBe("incompatible");
  });

  it("should sort products with insufficient data after products with scores", () => {
    const results: FitResult[] = [
      {
        productSlug: "insufficient",
        score: null,
        fitScore: null,
        dataConfidence: 20,
        organicRankingValue: null,
        contributions: [],
        hasHardIncompatibility: false,
        isLimitedData: true,
        isInsufficientData: true,
      },
      {
        productSlug: "sufficient",
        score: 65,
        fitScore: 65,
        dataConfidence: 60,
        organicRankingValue: 63,
        contributions: [],
        hasHardIncompatibility: false,
        isLimitedData: false,
        isInsufficientData: false,
      },
    ];

    const sorted = sortByFit(results);

    expect(sorted[0].productSlug).toBe("sufficient");
    expect(sorted[1].productSlug).toBe("insufficient");
  });

  it("should sort by organic ranking value when both have scores", () => {
    const results: FitResult[] = [
      {
        productSlug: "lower",
        score: 60,
        fitScore: 60,
        dataConfidence: 70,
        organicRankingValue: 63,
        contributions: [],
        hasHardIncompatibility: false,
        isLimitedData: false,
        isInsufficientData: false,
      },
      {
        productSlug: "higher",
        score: 80,
        fitScore: 80,
        dataConfidence: 85,
        organicRankingValue: 81,
        contributions: [],
        hasHardIncompatibility: false,
        isLimitedData: false,
        isInsufficientData: false,
      },
    ];

    const sorted = sortByFit(results);

    expect(sorted[0].productSlug).toBe("higher");
    expect(sorted[1].productSlug).toBe("lower");
  });

  it("should use slug as stable tiebreaker", () => {
    const results: FitResult[] = [
      {
        productSlug: "zebra",
        score: 75,
        fitScore: 75,
        dataConfidence: 80,
        organicRankingValue: 76,
        contributions: [],
        hasHardIncompatibility: false,
        isLimitedData: false,
        isInsufficientData: false,
      },
      {
        productSlug: "alpha",
        score: 75,
        fitScore: 75,
        dataConfidence: 80,
        organicRankingValue: 76,
        contributions: [],
        hasHardIncompatibility: false,
        isLimitedData: false,
        isInsufficientData: false,
      },
    ];

    const sorted = sortByFit(results);

    // Alphabetical order as tiebreaker
    expect(sorted[0].productSlug).toBe("alpha");
    expect(sorted[1].productSlug).toBe("zebra");
  });
});

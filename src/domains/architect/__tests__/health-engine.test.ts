// src/domains/architect/__tests__/health-engine.test.ts
// Tests for the health engine with real fit results integration

import { describe, it, expect } from "vitest";
import { calculateStackHealth, getImprovementSuggestions } from "../engines/health-engine";
import type {
  PracticeStack,
  ProductArchitectureMetadata,
  FitResult,
  StackCoverageResult,
  CompatibilityAssessment,
  CostEstimate,
} from "../schemas";
import { createEmptyStack, createEmptyFingerprint } from "../schemas";

// Factory helpers
function createTestStack(overrides: Partial<PracticeStack> = {}): PracticeStack {
  const base = createEmptyStack();
  return {
    ...base,
    fingerprint: {
      ...createEmptyFingerprint(),
      practiceType: "solo-clinician",
      sizeBucket: "solo",
      monthlyBudget: 200,
    },
    ...overrides,
  };
}

function createTestMetadata(): Map<string, ProductArchitectureMetadata> {
  const map = new Map<string, ProductArchitectureMetadata>();
  map.set("test-ehr", {
    productSlug: "test-ehr",
    capabilityMapStatus: "reviewed-complete",
    capabilities: [
      { capabilityId: "ehr-clinical-record", strength: "core" },
    ],
    integrations: [],
    pricing: {
      basis: "per-provider-month",
      minPriceCents: 5000,
      typicalPriceCents: 7000,
      provenance: "verified",
    },
  });
  return map;
}

function createTestCoverage(): StackCoverageResult {
  return {
    totalCoveragePercent: 50,
    knownCoveragePercent: 60,
    capabilityCoverage: [
      { capabilityId: "ehr-clinical-record", status: "covered", coveredBy: ["test-ehr"] },
      { capabilityId: "billing-rcm", status: "missing", coveredBy: [] },
    ],
    gapCapabilities: ["billing-rcm"],
    dataGapCapabilities: [],
  };
}

function createTestCost(): CostEstimate {
  return {
    productCount: 1,
    knownPricingCount: 1,
    unknownPricingCount: 0,
    knownMinMonthlyCents: 5000,
    knownMaxMonthlyCents: 7000,
    knownTypicalMonthlyCents: 6000,
  };
}

describe("calculateStackHealth", () => {
  it("should calculate health with real fit results", () => {
    const stack = createTestStack({
      selectedProducts: [{ slug: "test-ehr", addedAt: "2024-01-01", isDemo: false }],
    });
    const metadataMap = createTestMetadata();
    const coverageResult = createTestCoverage();
    const costEstimate = createTestCost();

    // Create real fit results (not empty array)
    const fitResults: FitResult[] = [
      {
        productSlug: "test-ehr",
        score: 75,
        fitScore: 75,
        dataConfidence: 80,
        organicRankingValue: 76,
        contributions: [
          { dimension: "hard-requirements", weight: 25, score: 1, evidence: "match", reasons: ["No incompatibilities"] },
          { dimension: "capability-alignment", weight: 20, score: 0.8, evidence: "match", reasons: ["Good coverage"] },
        ],
        hasHardIncompatibility: false,
        isLimitedData: false,
        isInsufficientData: false,
      },
    ];

    const compatibilityAssessments: CompatibilityAssessment[] = [];

    const result = calculateStackHealth({
      stack,
      metadataMap,
      coverageResult,
      fitResults, // Real fit results, not empty
      compatibilityAssessments,
      costEstimate,
    });

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.healthLevel).toBeDefined();
    expect(result.subscores.length).toBe(5);
    expect(result.summary).toBeDefined();
  });

  it("should calculate practice fit subscore from fit results", () => {
    const stack = createTestStack({
      selectedProducts: [{ slug: "test-ehr", addedAt: "2024-01-01", isDemo: false }],
    });
    const metadataMap = createTestMetadata();
    const coverageResult = createTestCoverage();
    const costEstimate = createTestCost();

    const fitResults: FitResult[] = [
      {
        productSlug: "test-ehr",
        score: 90, // High fit score
        fitScore: 90,
        dataConfidence: 85,
        organicRankingValue: 88,
        contributions: [],
        hasHardIncompatibility: false,
        isLimitedData: false,
        isInsufficientData: false,
      },
    ];

    const result = calculateStackHealth({
      stack,
      metadataMap,
      coverageResult,
      fitResults,
      compatibilityAssessments: [],
      costEstimate,
    });

    const practiceFitSubscore = result.subscores.find((s) => s.name === "Practice Fit");
    expect(practiceFitSubscore).toBeDefined();
    expect(practiceFitSubscore!.score).toBeGreaterThan(0);
    expect(practiceFitSubscore!.explanation).toContain("match");
  });

  it("should return zero practice fit score when fit results are empty", () => {
    const stack = createTestStack({
      selectedProducts: [{ slug: "test-ehr", addedAt: "2024-01-01", isDemo: false }],
    });
    const metadataMap = createTestMetadata();
    const coverageResult = createTestCoverage();
    const costEstimate = createTestCost();

    const result = calculateStackHealth({
      stack,
      metadataMap,
      coverageResult,
      fitResults: [], // Empty fit results
      compatibilityAssessments: [],
      costEstimate,
    });

    const practiceFitSubscore = result.subscores.find((s) => s.name === "Practice Fit");
    expect(practiceFitSubscore).toBeDefined();
    expect(practiceFitSubscore!.score).toBe(0);
    expect(practiceFitSubscore!.explanation).toBe("No products to evaluate");
  });

  it("should identify coverage as top concern when coverage is low", () => {
    const stack = createTestStack({
      selectedProducts: [{ slug: "test-ehr", addedAt: "2024-01-01", isDemo: false }],
    });
    const metadataMap = createTestMetadata();

    const lowCoverage: StackCoverageResult = {
      totalCoveragePercent: 20,
      knownCoveragePercent: 25,
      capabilityCoverage: [],
      gapCapabilities: ["billing-rcm", "telehealth", "prescribing-erx", "patient-portal"],
      dataGapCapabilities: [],
    };

    const result = calculateStackHealth({
      stack,
      metadataMap,
      coverageResult: lowCoverage,
      fitResults: [],
      compatibilityAssessments: [],
      costEstimate: createTestCost(),
    });

    expect(result.topConcerns).toContain("Coverage");
  });

  it("should calculate all five subscores", () => {
    const stack = createTestStack({
      selectedProducts: [{ slug: "test-ehr", addedAt: "2024-01-01", isDemo: false }],
    });

    const result = calculateStackHealth({
      stack,
      metadataMap: createTestMetadata(),
      coverageResult: createTestCoverage(),
      fitResults: [],
      compatibilityAssessments: [],
      costEstimate: createTestCost(),
    });

    const subscoreNames = result.subscores.map((s) => s.name);
    expect(subscoreNames).toContain("Coverage");
    expect(subscoreNames).toContain("Practice Fit");
    expect(subscoreNames).toContain("Compatibility");
    expect(subscoreNames).toContain("Cost Efficiency");
    expect(subscoreNames).toContain("Data Confidence");
  });
});

describe("getImprovementSuggestions", () => {
  it("should suggest filling coverage gaps when coverage is low", () => {
    const healthResult = {
      overallScore: 40,
      healthLevel: "fair" as const,
      subscores: [
        { name: "Coverage", score: 30, weight: 0.35, contribution: 10, explanation: "Low coverage" },
        { name: "Practice Fit", score: 70, weight: 0.25, contribution: 17, explanation: "Good fit" },
        { name: "Compatibility", score: 100, weight: 0.2, contribution: 20, explanation: "Compatible" },
        { name: "Cost Efficiency", score: 80, weight: 0.1, contribution: 8, explanation: "On budget" },
        { name: "Data Confidence", score: 60, weight: 0.1, contribution: 6, explanation: "Some data" },
      ],
      topConcerns: ["Coverage"],
      summary: "Needs work",
    };

    const coverageResult: StackCoverageResult = {
      totalCoveragePercent: 30,
      knownCoveragePercent: 35,
      capabilityCoverage: [],
      gapCapabilities: ["billing-rcm", "telehealth"],
      dataGapCapabilities: [],
    };

    const suggestions = getImprovementSuggestions(healthResult, coverageResult);

    expect(suggestions.some((s) => s.includes("gap"))).toBe(true);
  });

  it("should suggest reviewing integrations when compatibility has concerns", () => {
    const healthResult = {
      overallScore: 50,
      healthLevel: "fair" as const,
      subscores: [
        { name: "Coverage", score: 70, weight: 0.35, contribution: 24, explanation: "Good" },
        { name: "Practice Fit", score: 70, weight: 0.25, contribution: 17, explanation: "Good" },
        { name: "Compatibility", score: 40, weight: 0.2, contribution: 8, explanation: "Concerns" },
        { name: "Cost Efficiency", score: 80, weight: 0.1, contribution: 8, explanation: "On budget" },
        { name: "Data Confidence", score: 60, weight: 0.1, contribution: 6, explanation: "Some data" },
      ],
      topConcerns: ["Compatibility"],
      summary: "Review compatibility",
    };

    const coverageResult: StackCoverageResult = {
      totalCoveragePercent: 70,
      knownCoveragePercent: 75,
      capabilityCoverage: [],
      gapCapabilities: [],
      dataGapCapabilities: [],
    };

    const suggestions = getImprovementSuggestions(healthResult, coverageResult);

    expect(suggestions.some((s) => s.includes("integration") || s.includes("compatibility"))).toBe(true);
  });
});

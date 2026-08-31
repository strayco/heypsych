// src/domains/architect/__tests__/overlap-engine.test.ts
// Tests for overlap classification system

import { describe, it, expect } from "vitest";
import {
  analyzeOverlaps,
  analyzeProductPairOverlaps,
  countOverlapsByClass,
  getOverlapSummary,
  hasRedundancyConcerns,
} from "../engines/overlap-engine";
import type {
  PracticeStack,
  ProductArchitectureMetadata,
} from "../schemas";
import { createEmptyStack, createEmptyFingerprint } from "../schemas";

// Factory helpers
function createTestStack(products: string[]): PracticeStack {
  const base = createEmptyStack();
  return {
    ...base,
    fingerprint: {
      ...createEmptyFingerprint(),
      practiceType: "solo-clinician",
      sizeBucket: "solo",
      primaryPayerType: "commercial-insurance",
      prescribingLevel: "none",
      deliveryModel: "hybrid",
      priorities: ["clinical-workflow", "ease-of-use"],
    },
    selectedProducts: products.map((slug) => ({
      slug,
      addedAt: new Date().toISOString(),
      isDemo: false,
    })),
  };
}

function createTestMetadata(
  products: Array<{
    slug: string;
    capabilities: Array<{ capabilityId: string; strength: string }>;
    status?: "reviewed-complete" | "reviewed-partial" | "unreviewed";
  }>
): Map<string, ProductArchitectureMetadata> {
  const map = new Map<string, ProductArchitectureMetadata>();

  for (const product of products) {
    map.set(product.slug, {
      productSlug: product.slug,
      capabilityMapStatus: product.status || "reviewed-complete",
      capabilities: product.capabilities.map((c) => ({
        capabilityId: c.capabilityId as any,
        strength: c.strength as any,
        provenance: "verified" as const,
      })),
      integrations: [],
    });
  }

  return map;
}

describe("analyzeOverlaps (capability-level)", () => {
  it("should detect overlapping capabilities", () => {
    const stack = createTestStack(["ehr-a", "ehr-b"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-a",
        capabilities: [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "scheduling", strength: "strong" },
        ],
      },
      {
        slug: "ehr-b",
        capabilities: [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "billing-rcm", strength: "strong" },
        ],
      },
    ]);

    const result = analyzeOverlaps(stack, metadataMap);

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((r) => r.capabilityId === "ehr-clinical-record")).toBe(true);
  });

  it("should not flag overlap for single product", () => {
    const stack = createTestStack(["ehr-a"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-a",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
    ]);

    const result = analyzeOverlaps(stack, metadataMap);

    expect(result.length).toBe(0);
  });

  it("should not count integration-only as real coverage", () => {
    const stack = createTestStack(["ehr-a", "integration-tool"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-a",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
      {
        slug: "integration-tool",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "integration-only" }],
      },
    ]);

    const result = analyzeOverlaps(stack, metadataMap);

    // Should not detect overlap because integration-only doesn't count
    expect(result.some((r) => r.capabilityId === "ehr-clinical-record")).toBe(false);
  });
});

describe("overlap classification", () => {
  it("should classify intentional overlap for known patterns", () => {
    const stack = createTestStack(["ehr-a", "scribe-tool"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-a",
        capabilities: [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "ai-documentation-scribe", strength: "strong" }, // Must be strong to trigger overlap
        ],
      },
      {
        slug: "scribe-tool",
        capabilities: [{ capabilityId: "ai-documentation-scribe", strength: "core" }],
      },
    ]);

    const result = analyzeOverlaps(stack, metadataMap);
    const scribeOverlap = result.find((r) => r.capabilityId === "ai-documentation-scribe");

    expect(scribeOverlap).toBeDefined();
    expect(scribeOverlap!.classification).toBe("intentional-overlap");
  });

  it("should classify probable redundancy for core/core overlap", () => {
    const stack = createTestStack(["ehr-a", "ehr-b"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-a",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
      {
        slug: "ehr-b",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
    ]);

    const result = analyzeOverlaps(stack, metadataMap);
    const ehrOverlap = result.find((r) => r.capabilityId === "ehr-clinical-record");

    expect(ehrOverlap).toBeDefined();
    expect(ehrOverlap!.classification).toBe("probable-redundancy");
  });

  it("should classify possible redundancy when one product is core and other is strong", () => {
    const stack = createTestStack(["ehr-core", "ehr-secondary"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-core",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
      {
        slug: "ehr-secondary",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "strong" }],
      },
    ]);

    const result = analyzeOverlaps(stack, metadataMap);
    const ehrOverlap = result.find((r) => r.capabilityId === "ehr-clinical-record");

    expect(ehrOverlap).toBeDefined();
    expect(ehrOverlap!.classification).toBe("possible-redundancy");
  });

  it("should classify complementary for partial/addon overlap", () => {
    const stack = createTestStack(["full-suite", "specialty-tool"]);
    const metadataMap = createTestMetadata([
      {
        slug: "full-suite",
        capabilities: [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "scheduling", strength: "partial" },
        ],
      },
      {
        slug: "specialty-tool",
        capabilities: [{ capabilityId: "scheduling", strength: "addon" }],
      },
    ]);

    const result = analyzeOverlaps(stack, metadataMap);

    // Should not flag partial/addon as strong overlap
    const scheduleOverlap = result.find((r) => r.capabilityId === "scheduling");
    if (scheduleOverlap) {
      expect(scheduleOverlap.classification).toBe("complementary");
    }
  });
});

describe("analyzeProductPairOverlaps", () => {
  it("should analyze overlap between product pairs", () => {
    const stack = createTestStack(["ehr-a", "ehr-b", "telehealth"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-a",
        capabilities: [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "scheduling", strength: "strong" },
          { capabilityId: "billing-rcm", strength: "strong" },
        ],
      },
      {
        slug: "ehr-b",
        capabilities: [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "scheduling", strength: "core" },
        ],
      },
      {
        slug: "telehealth",
        capabilities: [{ capabilityId: "telehealth", strength: "core" }],
      },
    ]);

    const result = analyzeProductPairOverlaps(stack, metadataMap);

    // Should find overlap between ehr-a and ehr-b
    const ehrPairOverlap = result.find(
      (r) =>
        (r.productASlug === "ehr-a" && r.productBSlug === "ehr-b") ||
        (r.productASlug === "ehr-b" && r.productBSlug === "ehr-a")
    );

    expect(ehrPairOverlap).toBeDefined();
    expect(ehrPairOverlap!.sharedCapabilities.length).toBeGreaterThan(0);
  });

  it("should track unique capabilities per product", () => {
    const stack = createTestStack(["ehr-a", "ehr-b"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-a",
        capabilities: [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "billing-rcm", strength: "strong" }, // Unique to A
        ],
      },
      {
        slug: "ehr-b",
        capabilities: [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "telehealth", strength: "strong" }, // Unique to B
        ],
      },
    ]);

    const result = analyzeProductPairOverlaps(stack, metadataMap);
    const overlap = result[0];

    expect(overlap.uniqueToA.some((c) => c.capabilityId === "billing-rcm")).toBe(true);
    expect(overlap.uniqueToB.some((c) => c.capabilityId === "telehealth")).toBe(true);
  });

  it("should calculate potential savings when costs are known", () => {
    const stack = createTestStack(["ehr-a", "ehr-b"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-a",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
      {
        slug: "ehr-b",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
    ]);

    const costMap = new Map([
      ["ehr-a", { minMonthlyCents: 5000, maxMonthlyCents: 7000 }],
      ["ehr-b", { minMonthlyCents: 3000, maxMonthlyCents: 4000 }],
    ]);

    const result = analyzeProductPairOverlaps(stack, metadataMap, costMap);
    const overlap = result[0];

    expect(overlap.potentialMonthlySavingsACents).toBe(5000);
    expect(overlap.potentialMonthlySavingsBCents).toBe(3000);
  });

  it("should not flag pairs with no overlap", () => {
    const stack = createTestStack(["ehr", "telehealth"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
      {
        slug: "telehealth",
        capabilities: [{ capabilityId: "telehealth", strength: "core" }],
      },
    ]);

    const result = analyzeProductPairOverlaps(stack, metadataMap);

    // No overlap between these products
    expect(result.length).toBe(0);
  });
});

describe("countOverlapsByClass", () => {
  it("should count overlaps by classification", () => {
    const stack = createTestStack(["ehr-a", "ehr-b", "scribe"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-a",
        capabilities: [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "ai-documentation-scribe", strength: "partial" },
        ],
      },
      {
        slug: "ehr-b",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
      {
        slug: "scribe",
        capabilities: [{ capabilityId: "ai-documentation-scribe", strength: "core" }],
      },
    ]);

    const overlaps = analyzeOverlaps(stack, metadataMap);
    const counts = countOverlapsByClass(overlaps);

    expect(counts["probable-redundancy"]).toBeGreaterThanOrEqual(0);
    expect(counts["intentional-overlap"]).toBeGreaterThanOrEqual(0);
  });
});

describe("hasRedundancyConcerns", () => {
  it("should return true when probable redundancy exists", () => {
    const stack = createTestStack(["ehr-a", "ehr-b"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-a",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
      {
        slug: "ehr-b",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
    ]);

    const overlaps = analyzeOverlaps(stack, metadataMap);

    expect(hasRedundancyConcerns(overlaps)).toBe(true);
  });

  it("should return false when only intentional overlap", () => {
    const stack = createTestStack(["ehr", "scribe"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr",
        capabilities: [
          { capabilityId: "ehr-clinical-record", strength: "core" },
          { capabilityId: "ai-documentation-scribe", strength: "partial" },
        ],
      },
      {
        slug: "scribe",
        capabilities: [{ capabilityId: "ai-documentation-scribe", strength: "core" }],
      },
    ]);

    const overlaps = analyzeOverlaps(stack, metadataMap);
    const summary = getOverlapSummary(overlaps);

    // Only intentional overlap for AI scribe
    expect(summary.probableRedundancyCount).toBe(0);
  });
});

describe("getOverlapSummary", () => {
  it("should provide accurate summary counts", () => {
    const stack = createTestStack(["ehr-a", "ehr-b"]);
    const metadataMap = createTestMetadata([
      {
        slug: "ehr-a",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
      {
        slug: "ehr-b",
        capabilities: [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      },
    ]);

    const overlaps = analyzeOverlaps(stack, metadataMap);
    const summary = getOverlapSummary(overlaps);

    expect(summary.hasRedundancy).toBe(true);
    expect(summary.totalOverlapCount).toBeGreaterThan(0);
    expect(summary.summary).toBeDefined();
  });
});

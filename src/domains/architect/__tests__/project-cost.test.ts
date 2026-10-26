import { describe, expect, it } from "vitest";
import {
  calculateProjectCost,
  formatProjectCost,
} from "../services/project-summary-service";
import { createEmptyProfile, type PracticeProject } from "../schemas/practice-project";
import { profileToFingerprint } from "../adapters/profile-to-fingerprint";
import type { ProductArchitectureMetadata } from "../schemas/product-metadata";

function project(assignments: PracticeProject["assignments"]): PracticeProject {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    version: 3,
    name: "Test",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    profile: { ...createEmptyProfile(), roles: ["therapist"], size: "solo" },
    assignments,
    decisions: [],
    setupTasks: [],
    onboardingComplete: true,
  };
}

describe("unknown pricing is never displayed as zero", () => {
  it("says the price is unpublished when every assigned tool is unpriced", () => {
    const summary = calculateProjectCost(
      project([
        {
          productSlug: "unknown-ehr",
          productName: "Unknown EHR",
          capabilityIds: ["ehr-clinical-record"],
          source: "selected",
          assignedAt: "2026-01-01T00:00:00.000Z",
          needsReview: false,
        },
      ]),
      profileToFingerprint({ ...createEmptyProfile(), roles: ["therapist"], size: "solo" }),
      new Map()
    );

    expect(summary.knownMonthlyCents).toBe(0);
    expect(summary.isIncomplete).toBe(true);
    expect(formatProjectCost(summary)).not.toMatch(/\$0/);
    expect(formatProjectCost(summary)).toMatch(/not published/i);
  });

  it("does not treat a quote-required product as free", () => {
    const metadata: ProductArchitectureMetadata = {
      productSlug: "quoted",
      capabilityMapStatus: "unreviewed",
      capabilities: [],
      integrations: [],
      pricing: {
        basis: "custom-quote",
        currency: "USD",
        minPriceCents: undefined,
        typicalPriceCents: undefined,
        tiers: [],
        freeTierAvailable: false,
        requiresQuote: true,
        assumptions: [],
        provenance: "vendor_provided",
      },
    };

    const summary = calculateProjectCost(
      project([
        {
          productSlug: "quoted",
          productName: "Quoted EHR",
          capabilityIds: ["ehr-clinical-record"],
          source: "selected",
          assignedAt: "2026-01-01T00:00:00.000Z",
          needsReview: false,
        },
      ]),
      profileToFingerprint({ ...createEmptyProfile(), roles: ["therapist"], size: "solo" }),
      new Map([["quoted", metadata]])
    );

    expect(formatProjectCost(summary)).not.toMatch(/\$0/);
    expect(summary.quoteCount).toBe(1);
  });
});

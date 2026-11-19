import { describe, expect, it } from "vitest";
import { calculateProjectCost } from "../services/project-summary-service";
import { previewSelectionCost, projectAfterSelection, type SelectionPlan } from "../services/selection-preview";
import { createEmptyProfile, type PracticeProject } from "../schemas/practice-project";
import { profileToFingerprint } from "../adapters/profile-to-fingerprint";
import type { ProductArchitectureMetadata } from "../schemas/product-metadata";
import type { CapabilityId } from "../schemas/lifecycle";

const profile = { ...createEmptyProfile(), roles: ["therapist"], size: "solo" } as PracticeProject["profile"];
const fingerprint = profileToFingerprint(profile);
const at = "2026-01-01T00:00:00.000Z";

function flat(productSlug: string, cents: number): ProductArchitectureMetadata {
  return {
    productSlug,
    capabilityMapStatus: "unreviewed",
    capabilities: [],
    integrations: [],
    pricing: {
      basis: "per-practice-month",
      currency: "USD",
      minPriceCents: cents,
      typicalPriceCents: cents,
      tiers: [],
      freeTierAvailable: false,
      requiresQuote: false,
      assumptions: [],
      provenance: "vendor_provided",
    },
  } as ProductArchitectureMetadata;
}

const metadata = new Map([
  ["suite", flat("suite", 3500)],
  ["scribe-a", flat("scribe-a", 2000)],
  ["scribe-b", flat("scribe-b", 5000)],
]);

function project(assignments: Array<[string, CapabilityId[]]>): PracticeProject {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    version: 3,
    name: "Test",
    createdAt: at,
    updatedAt: at,
    profile,
    assignments: assignments.map(([productSlug, capabilityIds]) => ({
      productSlug,
      productName: productSlug,
      capabilityIds,
      source: "suggested",
      suggested: true,
      assignedAt: at,
      needsReview: false,
    })),
    decisions: [],
    setupTasks: [],
    onboardingComplete: true,
  } as PracticeProject;
}

function choose(productSlug: string, capabilityIds: CapabilityId[], replaced: string | null): SelectionPlan {
  return {
    assignment: { productSlug, productName: productSlug, capabilityIds, source: "selected", suggested: false, needsReview: false },
    replaced: replaced ? { productSlug: replaced, capabilityIds } : null,
  };
}

const total = (p: PracticeProject) => calculateProjectCost(p, fingerprint, metadata).knownMonthlyCents;

describe("replacement preview is the net change to the whole stack", () => {
  it("charges the full new price when the replaced tool still covers other functions", () => {
    // Regression: a $35 suite covering the EHR and the scribe, replaced on the
    // scribe by a $50 scribe, was previewed as +$15 while the total rose $50.
    const before = project([["suite", ["ehr-clinical-record", "ai-documentation-scribe"]]]);
    const plan = choose("scribe-b", ["ai-documentation-scribe"], "suite");
    const preview = previewSelectionCost(before, plan, fingerprint, metadata);

    expect(preview.deltaCents).toBe(5000);
    expect(preview.replacedLeaves).toBe(false);
    expect(preview.deltaCents).toBe(total(projectAfterSelection(before, plan)) - total(before));
  });

  it("nets out the replaced tool when it leaves the practice", () => {
    const before = project([
      ["suite", ["ehr-clinical-record"]],
      ["scribe-a", ["ai-documentation-scribe"]],
    ]);
    const plan = choose("scribe-b", ["ai-documentation-scribe"], "scribe-a");
    const preview = previewSelectionCost(before, plan, fingerprint, metadata);

    expect(preview.deltaCents).toBe(3000);
    expect(preview.replacedLeaves).toBe(true);
    expect(preview.afterCents).toBe(total(projectAfterSelection(before, plan)));
  });

  it("adds nothing when the chosen tool is already paid for", () => {
    const before = project([
      ["suite", ["ehr-clinical-record"]],
      ["scribe-a", ["ai-documentation-scribe"]],
    ]);
    const plan = choose("suite", ["ai-documentation-scribe"], "scribe-a");
    const preview = previewSelectionCost(before, plan, fingerprint, metadata);

    expect(preview.deltaCents).toBe(-2000);
    expect(preview.deltaCents).toBe(total(projectAfterSelection(before, plan)) - total(before));
  });

  it("reports unknown rather than a number when an unpriced tool enters", () => {
    const before = project([["suite", ["ehr-clinical-record", "ai-documentation-scribe"]]]);
    const plan = choose("unpriced", ["ai-documentation-scribe"], "suite");
    expect(previewSelectionCost(before, plan, fingerprint, metadata).deltaCents).toBeNull();
  });
});

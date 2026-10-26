/**
 * Automatic coverage: choosing a product resolves every open function it
 * covers as an established built-in feature, and nothing else.
 */

import { describe, expect, it } from "vitest";
import type { CapabilityId } from "../schemas/lifecycle";
import {
  createProject,
  type PracticeProject,
  type ToolAssignment,
} from "../schemas/practice-project";
import {
  createEmptyMetadata,
  type ProductArchitectureMetadata,
} from "../schemas/product-metadata";
import { gapFillCapabilities, reconcileCoverage } from "../world/coverage";

const NOW = "2026-10-23T00:00:00.000Z";

function product(
  slug: string,
  caps: Array<[CapabilityId, "core" | "strong" | "partial" | "addon", { addon?: boolean }?]>
): ProductArchitectureMetadata {
  return {
    ...createEmptyMetadata(slug),
    capabilities: caps.map(([capabilityId, strength, opts]) => ({
      capabilityId,
      strength,
      requiresAddon: opts?.addon ?? false,
    })),
  } as ProductArchitectureMetadata;
}

function assignment(slug: string, capabilityIds: CapabilityId[], extra: Partial<ToolAssignment> = {}): ToolAssignment {
  return {
    productSlug: slug,
    productName: slug,
    capabilityIds,
    source: "selected",
    assignedAt: NOW,
    needsReview: false,
    ...extra,
  };
}

function project(overrides: Partial<PracticeProject> = {}): PracticeProject {
  return { ...createProject({ id: "p1", now: NOW }), ...overrides };
}

const ALL: ReadonlySet<CapabilityId> = new Set<CapabilityId>([
  "intake",
  "scheduling",
  "patient-payments",
  "ehr-clinical-record",
  "telehealth",
  "epcs",
]);

const intakeq = product("intakeq", [
  ["ehr-clinical-record", "core"],
  ["intake", "core"],
  ["scheduling", "strong"],
  ["patient-payments", "core"],
  ["telehealth", "addon", { addon: true }],
  ["epcs", "core"],
]);

describe("gapFillCapabilities", () => {
  it("fills every open function the product covers as a built-in feature", () => {
    const filled = gapFillCapabilities({
      project: project(),
      productSlug: "intakeq",
      metadata: intakeq,
      applicable: ALL,
      claimed: new Set<CapabilityId>(["ehr-clinical-record"]),
    });
    expect(filled.sort()).toEqual(["intake", "patient-payments", "scheduling"]);
  });

  it("never claims paid add-ons or unverified regulated capabilities", () => {
    const filled = gapFillCapabilities({
      project: project(),
      productSlug: "intakeq",
      metadata: intakeq,
      applicable: ALL,
    });
    expect(filled).not.toContain("telehealth");
    expect(filled).not.toContain("epcs");
  });

  it("only fills functions that apply to this practice", () => {
    const filled = gapFillCapabilities({
      project: project(),
      productSlug: "intakeq",
      metadata: intakeq,
      applicable: new Set<CapabilityId>(["intake"]),
    });
    expect(filled).toEqual(["intake"]);
  });

  it("does not override another product or a recorded decision", () => {
    const filled = gapFillCapabilities({
      project: project({
        assignments: [assignment("stripe", ["patient-payments"])],
        decisions: [{ capabilityId: "scheduling", decision: "handled-elsewhere", decidedAt: NOW }],
      }),
      productSlug: "intakeq",
      metadata: intakeq,
      applicable: ALL,
    });
    expect(filled.sort()).toEqual(["ehr-clinical-record", "intake"]);
  });

  it("never re-adds a function the user removed the product from", () => {
    const filled = gapFillCapabilities({
      project: project({
        assignments: [
          assignment("intakeq", ["ehr-clinical-record"], {
            declinedCapabilityIds: ["patient-payments"],
          }),
        ],
      }),
      productSlug: "intakeq",
      metadata: intakeq,
      applicable: ALL,
    });
    expect(filled.sort()).toEqual(["intake", "scheduling"]);
  });

  it("returns nothing without catalog metadata", () => {
    expect(
      gapFillCapabilities({ project: project(), productSlug: "x", metadata: undefined, applicable: ALL })
    ).toEqual([]);
  });
});

describe("reconcileCoverage", () => {
  it("brings a saved project up to date and is idempotent", () => {
    const saved = project({ assignments: [assignment("intakeq", ["ehr-clinical-record"])] });
    const metadata = new Map([["intakeq", intakeq]]);

    const first = reconcileCoverage(saved, metadata, ALL);
    expect(first).toEqual([
      { productSlug: "intakeq", capabilityIds: expect.arrayContaining(["intake", "scheduling", "patient-payments"]) },
    ]);

    const applied = project({
      assignments: [
        assignment("intakeq", ["ehr-clinical-record", ...first[0].capabilityIds]),
      ],
    });
    expect(reconcileCoverage(applied, metadata, ALL)).toEqual([]);
  });

  it("lets the earliest choice win a function two products could both fill", () => {
    const simplepractice = product("simplepractice", [
      ["ehr-clinical-record", "core"],
      ["scheduling", "core"],
    ]);
    const saved = project({
      assignments: [
        assignment("simplepractice", ["ehr-clinical-record"], { assignedAt: "2026-10-01T00:00:00.000Z" }),
        assignment("intakeq", ["intake"], { assignedAt: "2026-10-02T00:00:00.000Z" }),
      ],
    });
    const result = reconcileCoverage(
      saved,
      new Map([
        ["simplepractice", simplepractice],
        ["intakeq", intakeq],
      ]),
      ALL
    );
    const sp = result.find((r) => r.productSlug === "simplepractice");
    const iq = result.find((r) => r.productSlug === "intakeq");
    expect(sp?.capabilityIds).toEqual(["scheduling"]);
    expect(iq?.capabilityIds).not.toContain("scheduling");
  });
});

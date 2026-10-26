/**
 * EPCS verification safeguard.
 *
 * EPCS is DEA-regulated. These tests pin the rule that an unreviewed vendor
 * claim of controlled-substance prescribing support may make a product
 * discoverable, but may never read as established capability: it must not
 * count as confirmed coverage, must not silently satisfy the requirement, and
 * must always carry the verification notice.
 */

import { describe, expect, it } from "vitest";
import type { PracticeStack, ProductArchitectureMetadata } from "../schemas";
import { createEmptyStack, createEmptyFingerprint } from "../schemas";
import { calculateStackCoverage } from "../engines/coverage-engine";
import {
  EPCS_UNVERIFIED_DETAIL,
  EPCS_UNVERIFIED_HEADLINE,
  evaluateEligibility,
} from "../engines/eligibility-engine";
import { mapV4ToArchitectCapabilities } from "../adapters/capability-mapping";
import { recommendProductsForCapabilities } from "../services/capability-recommendation-service";

type Provenance = ProductArchitectureMetadata["capabilities"][number]["provenance"];
type MapStatus = ProductArchitectureMetadata["capabilityMapStatus"];

function prescribingStack(slugs: string[]): PracticeStack {
  return {
    ...createEmptyStack(),
    fingerprint: {
      ...createEmptyFingerprint(),
      practiceType: "therapy-plus-psychiatry",
      sizeBucket: "solo",
      clinicalRoles: ["psychiatrist"],
      prescribingLevel: "controlled-substances-epcs",
      deliveryModel: "hybrid",
    },
    selectedProducts: slugs.map((slug) => ({
      slug,
      addedAt: new Date().toISOString(),
      isDemo: false,
    })),
  };
}

function epcsProduct(
  slug: string,
  provenance: Provenance,
  capabilityMapStatus: MapStatus
): ProductArchitectureMetadata {
  return {
    productSlug: slug,
    capabilityMapStatus,
    capabilities: [
      { capabilityId: "epcs", strength: "core", provenance },
      { capabilityId: "prescribing-erx", strength: "core", provenance },
    ],
    integrations: [],
  };
}

describe("unreviewed EPCS claims never count as confirmed coverage", () => {
  it("reports a vendor-claimed EPCS capability as a data gap, not as covered", () => {
    const stack = prescribingStack(["vendor-claimed"]);
    const metadata = new Map([
      ["vendor-claimed", epcsProduct("vendor-claimed", "vendor_provided", "unreviewed")],
    ]);

    const result = calculateStackCoverage(stack, metadata);
    const epcs = result.capabilityCoverage.find((c) => c.capabilityId === "epcs");

    expect(epcs).toBeDefined();
    expect(epcs!.status).toBe("unknown");
    expect(epcs!.coveringProducts).toHaveLength(0);
    expect(epcs!.numericValue).toBe(0);
  });

  it("counts EPCS as covered once the claim is verified", () => {
    const stack = prescribingStack(["verified-product"]);
    const metadata = new Map([
      ["verified-product", epcsProduct("verified-product", "verified", "reviewed-complete")],
    ]);

    const result = calculateStackCoverage(stack, metadata);
    const epcs = result.capabilityCoverage.find((c) => c.capabilityId === "epcs");

    expect(epcs!.status).toBe("strong");
    expect(epcs!.coveringProducts.map((p) => p.slug)).toEqual(["verified-product"]);
  });

  it("does not downgrade other capabilities from the same unreviewed product", () => {
    // The safeguard is scoped to EPCS, not a blanket distrust of the record.
    const stack = prescribingStack(["vendor-claimed"]);
    const metadata = new Map([
      ["vendor-claimed", epcsProduct("vendor-claimed", "vendor_provided", "unreviewed")],
    ]);

    const result = calculateStackCoverage(stack, metadata);
    const erx = result.capabilityCoverage.find(
      (c) => c.capabilityId === "prescribing-erx"
    );

    expect(erx!.coveringProducts.map((p) => p.slug)).toEqual(["vendor-claimed"]);
  });
});

describe("unreviewed EPCS claims surface the verification notice", () => {
  const fingerprint = prescribingStack([]).fingerprint;

  it("attaches the prescribed wording to the uncertainty", () => {
    const result = evaluateEligibility(
      epcsProduct("vendor-claimed", "vendor_provided", "unreviewed"),
      fingerprint
    );

    const finding = result.uncertainties.find((u) => u.policy === "epcs");
    expect(finding).toBeDefined();
    expect(finding!.headline).toBe(EPCS_UNVERIFIED_HEADLINE);
    expect(finding!.detail).toBe(EPCS_UNVERIFIED_DETAIL);
  });

  it("keeps the product eligible, so it stays discoverable", () => {
    const result = evaluateEligibility(
      epcsProduct("vendor-claimed", "vendor_provided", "unreviewed"),
      fingerprint
    );

    expect(result.eligible).toBe(true);
  });

  it("raises no EPCS uncertainty once the claim is verified", () => {
    const result = evaluateEligibility(
      epcsProduct("verified-product", "verified", "reviewed-complete"),
      fingerprint
    );

    expect(result.uncertainties.find((u) => u.policy === "epcs")).toBeUndefined();
  });

  it("never describes an unverified claim in absolute terms", () => {
    const result = evaluateEligibility(
      epcsProduct("vendor-claimed", "vendor_provided", "unreviewed"),
      fingerprint
    );
    const text = JSON.stringify(result.uncertainties).toLowerCase();

    for (const banned of [
      "epcs verified",
      "fully compliant",
      "approved for controlled substances",
      "guaranteed",
    ]) {
      expect(text).not.toContain(banned);
    }
  });
});

describe("recommendation copy never contradicts the verification notice", () => {
  it("omits an unverified EPCS claim from the built-in feature sentence", () => {
    // The card previously read "Covers Prescribing / eRx and EPCS as a
    // built-in feature" directly beneath the notice saying EPCS was
    // unverified. Engine tests passed while the rendered card contradicted
    // itself, so this asserts on the user-facing text.
    const metadata = epcsProduct("vendor-claimed", "vendor_provided", "unreviewed");
    const result = recommendProductsForCapabilities({
      capabilityIds: ["prescribing-erx", "epcs"],
      fingerprint: prescribingStack([]).fingerprint,
      products: [{ metadata, name: "Vendor Claimed EHR" }],
    });

    const option = [result.recommended, ...result.alternatives].find(
      (o) => o?.productSlug === "vendor-claimed"
    );
    expect(option).toBeDefined();

    for (const reason of option!.reasons) {
      expect(reason).not.toContain("EPCS");
    }
  });

  it("does mention EPCS as built-in once the claim is verified", () => {
    const metadata = epcsProduct("verified-product", "verified", "reviewed-complete");
    const result = recommendProductsForCapabilities({
      capabilityIds: ["prescribing-erx", "epcs"],
      fingerprint: prescribingStack([]).fingerprint,
      products: [{ metadata, name: "Verified EHR" }],
    });

    const option = [result.recommended, ...result.alternatives].find(
      (o) => o?.productSlug === "verified-product"
    );
    expect(option!.reasons.some((r) => r.includes("EPCS"))).toBe(true);
  });
});

describe("EPCS is not inferred from adjacent prescribing features", () => {
  it("does not treat PDMP integration as EPCS", () => {
    // A state prescription-database lookup is a different capability from
    // DEA-regulated controlled-substance prescribing.
    expect(mapV4ToArchitectCapabilities(["pdmp-integration"])).not.toContain("epcs");
  });

  it("does not treat general e-prescribing as EPCS", () => {
    expect(mapV4ToArchitectCapabilities(["e-prescribing"])).not.toContain("epcs");
  });

  it("still recognises an explicit controlled-substance claim", () => {
    expect(mapV4ToArchitectCapabilities(["epcs-controlled"])).toContain("epcs");
  });
});

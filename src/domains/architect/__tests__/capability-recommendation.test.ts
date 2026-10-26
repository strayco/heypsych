/**
 * Production-path tests for the capability recommendation service.
 *
 * The v2 workspace ranked products with a hardcoded popularity table and
 * ignored the practice profile entirely, which meant none of the hard
 * exclusion policies ran for a real user. These tests pin the behavior that
 * replaced it:
 *
 * - the profile actually changes the result
 * - every hard exclusion policy fires on the path the UI calls
 * - unknown evidence produces uncertainty, never silent eligibility
 * - ordering is deterministic
 */

import { describe, it, expect } from "vitest";
import { recommendProductsForCapabilities } from "../services/capability-recommendation-service";
import { evaluateEligibility } from "../engines/eligibility-engine";
import {
  profileToFingerprint,
  derivePracticeType,
  derivePrescribingLevel,
  isCapabilityApplicable,
} from "../adapters/profile-to-fingerprint";
import type { PracticeProfile } from "../schemas/practice-project";
import { createEmptyProfile } from "../schemas/practice-project";
import type {
  CapabilityStrength,
  ProductArchitectureMetadata,
} from "../schemas";
import type { CapabilityId } from "../schemas/lifecycle";

// ============================================================================
// FIXTURES
// ============================================================================

function product(
  slug: string,
  capabilities: Array<{
    capabilityId: CapabilityId;
    strength: CapabilityStrength;
    requiresAddon?: boolean;
    addonPriceCents?: number;
    limitation?: string;
    provenance?: "verified" | "vendor_provided" | "public_source" | "unverified" | "unknown";
  }>,
  overrides: Partial<ProductArchitectureMetadata> = {}
): ProductArchitectureMetadata {
  return {
    productSlug: slug,
    capabilityMapStatus: "reviewed-complete",
    capabilities: capabilities.map((c) => ({
      capabilityId: c.capabilityId,
      strength: c.strength,
      includedInBase: c.requiresAddon !== true,
      requiresAddon: c.requiresAddon ?? false,
      addonPriceCents: c.addonPriceCents,
      limitation: c.limitation,
      provenance: c.provenance ?? ("verified" as const),
    })),
    integrations: [],
    pricing: {
      basis: "per-provider-month",
      currency: "USD",
      minPriceCents: 5000,
      typicalPriceCents: 5000,
      tiers: [],
      freeTierAvailable: false,
      requiresQuote: false,
      assumptions: [],
      provenance: "verified",
    },
    compliance: { baaAvailable: true, stateCompliance: [], provenance: "verified" },
    ...overrides,
  };
}

function entry(metadata: ProductArchitectureMetadata, name?: string) {
  return { metadata, name: name ?? metadata.productSlug };
}

const SOLO_CASH_THERAPIST: PracticeProfile = {
  ...createEmptyProfile(),
  roles: ["therapist"],
  stage: "new",
  size: "solo",
  states: ["CA"],
  delivery: "hybrid",
  payment: "cash",
  services: ["psychotherapy"],
  prescribing: "none",
};

const SOLO_PRESCRIBER: PracticeProfile = {
  ...createEmptyProfile(),
  roles: ["psychiatrist"],
  stage: "established",
  size: "solo",
  states: ["NY"],
  delivery: "hybrid",
  payment: "insurance",
  services: ["psychotherapy", "medication-management"],
  prescribing: "controlled",
};

const EHR_CAPS: CapabilityId[] = [
  "ehr-clinical-record",
  "clinical-documentation",
  "treatment-planning",
];

// ============================================================================
// PROFILE NORMALIZATION
// ============================================================================

describe("profile normalization", () => {
  it("derives practice type from services, not job title alone", () => {
    const psychologistTestingOnly: PracticeProfile = {
      ...createEmptyProfile(),
      roles: ["psychologist"],
      size: "solo",
      services: ["psychological-testing"],
    };
    expect(derivePracticeType(psychologistTestingOnly)).toBe(
      "psychological-testing"
    );

    const psychologistDoingTherapy: PracticeProfile = {
      ...psychologistTestingOnly,
      services: ["psychotherapy"],
    };
    expect(derivePracticeType(psychologistDoingTherapy)).toBe("solo-clinician");
  });

  it("treats therapy plus medication as a combined practice", () => {
    expect(derivePracticeType(SOLO_PRESCRIBER)).toBe("therapy-plus-psychiatry");
  });

  it("never infers prescribing authority from a role label", () => {
    const unansweredPrescriber: PracticeProfile = {
      ...createEmptyProfile(),
      roles: ["psychiatrist"],
    };
    // A prescribing-capable role with no answer stays unknown, not "prescribes".
    expect(derivePrescribingLevel(unansweredPrescriber)).toBeUndefined();

    const unansweredTherapist: PracticeProfile = {
      ...createEmptyProfile(),
      roles: ["therapist"],
    };
    // A non-prescribing role can be safely resolved without asking.
    expect(derivePrescribingLevel(unansweredTherapist)).toBe("none");
  });

  it("maps the payment question onto the canonical payer type", () => {
    expect(profileToFingerprint(SOLO_CASH_THERAPIST).primaryPayerType).toBe(
      "cash"
    );
    expect(profileToFingerprint(SOLO_PRESCRIBER).primaryPayerType).toBe(
      "commercial-insurance"
    );
  });

  it("gates prescribing capabilities on the medication service", () => {
    expect(isCapabilityApplicable("prescribing-erx", SOLO_CASH_THERAPIST)).toBe(
      false
    );
    expect(isCapabilityApplicable("epcs", SOLO_CASH_THERAPIST)).toBe(false);
    expect(isCapabilityApplicable("prescribing-erx", SOLO_PRESCRIBER)).toBe(
      true
    );
  });

  it("leaves ungated capabilities applicable to everyone", () => {
    expect(isCapabilityApplicable("scheduling", SOLO_CASH_THERAPIST)).toBe(true);
  });
});

// ============================================================================
// THE PROFILE ACTUALLY DRIVES RESULTS
// ============================================================================

describe("profile drives recommendations", () => {
  const soloFriendly = product("solo-ehr", [
    { capabilityId: "ehr-clinical-record", strength: "core" },
    { capabilityId: "clinical-documentation", strength: "core" },
  ], {
    fitEvidence: {
      practiceTypes: ["solo-clinician"],
      practiceTypesExcluded: [],
      idealSizes: ["solo"],
      sizeBucketsExcluded: ["51-100", "101-250", "250+"],
      clinicalRoles: [],
      clinicalRolesExcluded: [],
      payerTypes: [],
      payerTypesExcluded: [],
      prescribingLevels: [],
      deliveryModels: ["in-person", "hybrid", "telehealth"],
      deliveryModelsExcluded: [],
      statesSupported: [],
      statesExcluded: [],
      idealFor: [],
      notIdealFor: [],
      provenance: "verified",
    },
  });

  const enterpriseOnly = product("enterprise-ehr", [
    { capabilityId: "ehr-clinical-record", strength: "core" },
    { capabilityId: "clinical-documentation", strength: "core" },
  ], {
    fitEvidence: {
      practiceTypes: [],
      practiceTypesExcluded: [],
      idealSizes: ["101-250"],
      sizeBucketsExcluded: ["solo", "2-5"],
      clinicalRoles: [],
      clinicalRolesExcluded: [],
      payerTypes: [],
      payerTypesExcluded: [],
      prescribingLevels: [],
      deliveryModels: [],
      deliveryModelsExcluded: [],
      statesSupported: [],
      statesExcluded: [],
      idealFor: [],
      notIdealFor: [],
      provenance: "verified",
    },
  });

  it("excludes an enterprise-only product for a solo practice", () => {
    const result = recommendProductsForCapabilities({
      capabilityIds: EHR_CAPS,
      fingerprint: profileToFingerprint(SOLO_CASH_THERAPIST),
      products: [entry(soloFriendly), entry(enterpriseOnly)],
    });

    expect(result.recommended?.productSlug).toBe("solo-ehr");
    expect(result.excluded.map((e) => e.productSlug)).toContain(
      "enterprise-ehr"
    );
    expect(result.excluded[0].exclusions[0].policy).toBe("size-bucket");
  });

  it("produces a different result when only the profile changes", () => {
    const large: PracticeProfile = { ...SOLO_CASH_THERAPIST, size: "101-250" };

    const soloResult = recommendProductsForCapabilities({
      capabilityIds: EHR_CAPS,
      fingerprint: profileToFingerprint(SOLO_CASH_THERAPIST),
      products: [entry(soloFriendly), entry(enterpriseOnly)],
    });
    const largeResult = recommendProductsForCapabilities({
      capabilityIds: EHR_CAPS,
      fingerprint: profileToFingerprint(large),
      products: [entry(soloFriendly), entry(enterpriseOnly)],
    });

    expect(soloResult.recommended?.productSlug).toBe("solo-ehr");
    expect(largeResult.recommended?.productSlug).toBe("enterprise-ehr");
  });
});

// ============================================================================
// HARD EXCLUSIONS ON THE PRODUCTION PATH
// ============================================================================

describe("hard exclusion policies", () => {
  const baseFit = {
    practiceTypes: [],
    practiceTypesExcluded: [],
    idealSizes: [],
    sizeBucketsExcluded: [],
    clinicalRoles: [],
    clinicalRolesExcluded: [],
    payerTypes: [],
    payerTypesExcluded: [],
    prescribingLevels: [],
    deliveryModels: [],
    deliveryModelsExcluded: [],
    statesSupported: [],
    statesExcluded: [],
    idealFor: [],
    notIdealFor: [],
    provenance: "verified" as const,
  };

  it("excludes on practice type", () => {
    const p = product("x", [{ capabilityId: "scheduling", strength: "core" }], {
      fitEvidence: { ...baseFit, practiceTypesExcluded: ["solo-clinician"] },
    });
    const result = evaluateEligibility(
      p,
      profileToFingerprint(SOLO_CASH_THERAPIST)
    );
    expect(result.eligible).toBe(false);
    expect(result.exclusions[0].policy).toBe("practice-type");
  });

  it("excludes on state", () => {
    const p = product("x", [{ capabilityId: "scheduling", strength: "core" }], {
      fitEvidence: { ...baseFit, statesExcluded: ["CA"] },
    });
    const result = evaluateEligibility(
      p,
      profileToFingerprint(SOLO_CASH_THERAPIST)
    );
    expect(result.eligible).toBe(false);
    expect(result.exclusions[0].policy).toBe("state");
  });

  it("excludes on clinical role", () => {
    const p = product("x", [{ capabilityId: "scheduling", strength: "core" }], {
      fitEvidence: { ...baseFit, clinicalRolesExcluded: ["therapist"] },
    });
    const result = evaluateEligibility(
      p,
      profileToFingerprint(SOLO_CASH_THERAPIST)
    );
    expect(result.eligible).toBe(false);
    expect(result.exclusions[0].policy).toBe("clinical-role");
  });

  it("excludes a telehealth-only practice from an in-person-only product", () => {
    const telehealthOnly: PracticeProfile = {
      ...SOLO_CASH_THERAPIST,
      delivery: "telehealth",
    };
    const p = product("x", [{ capabilityId: "telehealth", strength: "core" }], {
      fitEvidence: { ...baseFit, deliveryModels: ["in-person"] },
    });
    const result = evaluateEligibility(p, profileToFingerprint(telehealthOnly));
    expect(result.eligible).toBe(false);
    expect(result.exclusions[0].policy).toBe("delivery-model");
  });

  it("excludes a no-BAA product for an insurance practice", () => {
    const p = product("x", [{ capabilityId: "scheduling", strength: "core" }], {
      compliance: {
        baaAvailable: false,
        stateCompliance: [],
        provenance: "verified",
      },
    });
    const result = evaluateEligibility(p, profileToFingerprint(SOLO_PRESCRIBER));
    expect(result.eligible).toBe(false);
    expect(result.exclusions.some((e) => e.policy === "baa-hipaa")).toBe(true);
  });

  it("does not apply the BAA policy to a cash-pay practice", () => {
    const p = product("x", [{ capabilityId: "scheduling", strength: "core" }], {
      compliance: {
        baaAvailable: false,
        stateCompliance: [],
        provenance: "verified",
      },
    });
    const result = evaluateEligibility(
      p,
      profileToFingerprint(SOLO_CASH_THERAPIST)
    );
    expect(result.eligible).toBe(true);
  });

  it("excludes a reviewed prescribing product that lacks EPCS", () => {
    const p = product("erx-no-epcs", [
      { capabilityId: "prescribing-erx", strength: "core" },
    ]);
    const result = evaluateEligibility(p, profileToFingerprint(SOLO_PRESCRIBER));
    expect(result.eligible).toBe(false);
    expect(result.exclusions.some((e) => e.policy === "epcs")).toBe(true);
  });
});

// ============================================================================
// UNKNOWN EVIDENCE
// ============================================================================

describe("unknown evidence handling", () => {
  it("flags rather than excludes when EPCS support is unreviewed", () => {
    const p = product(
      "erx-unreviewed",
      [{ capabilityId: "prescribing-erx", strength: "core" }],
      { capabilityMapStatus: "unreviewed" }
    );
    const result = evaluateEligibility(p, profileToFingerprint(SOLO_PRESCRIBER));
    expect(result.eligible).toBe(true);
    expect(result.uncertainties.some((u) => u.policy === "epcs")).toBe(true);
  });

  it("flags rather than excludes when BAA availability is unknown", () => {
    const p = product("unknown-baa", [
      { capabilityId: "scheduling", strength: "core" },
    ], { compliance: undefined });
    const result = evaluateEligibility(p, profileToFingerprint(SOLO_PRESCRIBER));
    expect(result.eligible).toBe(true);
    expect(result.uncertainties.some((u) => u.policy === "baa-hipaa")).toBe(
      true
    );
  });

  it("never drops an uncertainty from the recommendation", () => {
    const p = product("unknown-baa", [
      { capabilityId: "ehr-clinical-record", strength: "core" },
      { capabilityId: "clinical-documentation", strength: "core" },
    ], { compliance: undefined });

    const result = recommendProductsForCapabilities({
      capabilityIds: EHR_CAPS,
      fingerprint: profileToFingerprint(SOLO_PRESCRIBER),
      products: [entry(p)],
    });

    const surfaced = [
      ...(result.recommended?.uncertainties ?? []),
      ...result.sharedUncertainties,
    ];
    expect(surfaced.some((u) => u.policy === "baa-hipaa")).toBe(true);
  });

  it("reports an uncertainty once when every option shares it", () => {
    // Neither product has BAA evidence, so the gap is in our catalog rather
    // than a difference between the two.
    const products = [
      entry(
        product(
          "no-baa-a",
          [{ capabilityId: "ehr-clinical-record", strength: "core" }],
          { compliance: undefined }
        )
      ),
      entry(
        product(
          "no-baa-b",
          [{ capabilityId: "ehr-clinical-record", strength: "core" }],
          { compliance: undefined }
        )
      ),
    ];

    const result = recommendProductsForCapabilities({
      capabilityIds: EHR_CAPS,
      fingerprint: profileToFingerprint(SOLO_PRESCRIBER),
      products,
    });

    expect(
      result.sharedUncertainties.some((u) => u.policy === "baa-hipaa")
    ).toBe(true);

    const everyOption = [
      result.recommended,
      ...result.alternatives,
      ...result.others,
    ].filter((o) => o !== undefined);

    for (const option of everyOption) {
      expect(option.uncertainties.some((u) => u.policy === "baa-hipaa")).toBe(
        false
      );
    }
  });

  it("keeps an uncertainty on the card when it distinguishes options", () => {
    const products = [
      entry(
        product(
          "baa-known",
          [{ capabilityId: "ehr-clinical-record", strength: "core" }],
          { compliance: { baaAvailable: true } }
        )
      ),
      entry(
        product(
          "baa-unknown",
          [{ capabilityId: "ehr-clinical-record", strength: "core" }],
          { compliance: undefined }
        )
      ),
    ];

    const result = recommendProductsForCapabilities({
      capabilityIds: EHR_CAPS,
      fingerprint: profileToFingerprint(SOLO_PRESCRIBER),
      products,
    });

    expect(
      result.sharedUncertainties.some((u) => u.policy === "baa-hipaa")
    ).toBe(false);

    const unknown = [result.recommended, ...result.alternatives].find(
      (o) => o?.productSlug === "baa-unknown"
    );
    expect(unknown?.uncertainties.some((u) => u.policy === "baa-hipaa")).toBe(
      true
    );
  });
});

describe("ranking legibility", () => {
  it("never ranks a lower fit tier above a higher one at equal coverage", () => {
    const strongFit = product("strong-fit", [
      { capabilityId: "ehr-clinical-record", strength: "strong" },
    ]);
    const weakFit = product(
      "weak-fit",
      [{ capabilityId: "ehr-clinical-record", strength: "core" }],
      { fitEvidence: { idealFor: ["large hospital systems"] } }
    );

    const result = recommendProductsForCapabilities({
      capabilityIds: ["ehr-clinical-record"],
      fingerprint: profileToFingerprint(SOLO_PRESCRIBER),
      products: [entry(weakFit), entry(strongFit)],
    });

    const ordered = [result.recommended, ...result.alternatives].filter(
      (o) => o !== undefined
    );

    for (let i = 1; i < ordered.length; i++) {
      const rank = { strong: 0, good: 1, possible: 2, weak: 3 } as const;
      expect(rank[ordered[i].fitTier]).toBeGreaterThanOrEqual(
        rank[ordered[i - 1].fitTier]
      );
    }
  });

  it("ranks a product that does the job above one that only integrates", () => {
    const native = product("native", [
      { capabilityId: "ehr-clinical-record", strength: "core" },
    ]);
    const integrationOnly = product("integrates", [
      { capabilityId: "ehr-clinical-record", strength: "integration-only" },
    ]);

    const result = recommendProductsForCapabilities({
      capabilityIds: ["ehr-clinical-record"],
      fingerprint: profileToFingerprint(SOLO_PRESCRIBER),
      products: [entry(integrationOnly), entry(native)],
    });

    expect(result.recommended?.productSlug).toBe("native");
  });
});

// ============================================================================
// DETERMINISM AND PRESENTATION
// ============================================================================

describe("ranking", () => {
  const catalog = [
    entry(
      product("alpha", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
        { capabilityId: "clinical-documentation", strength: "core" },
      ])
    ),
    entry(
      product("beta", [
        { capabilityId: "ehr-clinical-record", strength: "core" },
        { capabilityId: "clinical-documentation", strength: "core" },
      ])
    ),
    entry(
      product("gamma", [
        { capabilityId: "ehr-clinical-record", strength: "partial" },
      ])
    ),
  ];

  it("is deterministic across repeated runs", () => {
    const run = () =>
      recommendProductsForCapabilities({
        capabilityIds: EHR_CAPS,
        fingerprint: profileToFingerprint(SOLO_CASH_THERAPIST),
        products: catalog,
      });

    const first = run();
    const second = run();

    const order = (r: ReturnType<typeof run>) =>
      [r.recommended, ...r.alternatives, ...r.others].map(
        (o) => o?.productSlug
      );

    expect(order(first)).toEqual(order(second));
  });

  it("breaks ties on slug so identical products order stably", () => {
    const result = recommendProductsForCapabilities({
      capabilityIds: EHR_CAPS,
      fingerprint: profileToFingerprint(SOLO_CASH_THERAPIST),
      products: catalog,
    });
    // alpha and beta are identical apart from slug.
    expect(result.recommended?.productSlug).toBe("alpha");
    expect(result.alternatives[0]?.productSlug).toBe("beta");
  });

  it("ranks stronger coverage above weaker coverage", () => {
    const result = recommendProductsForCapabilities({
      capabilityIds: EHR_CAPS,
      fingerprint: profileToFingerprint(SOLO_CASH_THERAPIST),
      products: catalog,
    });
    const slugs = [result.recommended, ...result.alternatives].map(
      (o) => o?.productSlug
    );
    expect(slugs.indexOf("gamma")).toBeGreaterThan(slugs.indexOf("alpha"));
  });

  it("ignores products that do not touch the requested capabilities", () => {
    const result = recommendProductsForCapabilities({
      capabilityIds: ["accounting"],
      fingerprint: profileToFingerprint(SOLO_CASH_THERAPIST),
      products: catalog,
    });
    expect(result.isEmpty).toBe(true);
    expect(result.recommended).toBeUndefined();
  });

  it("reports a fit tier instead of a numeric match percentage", () => {
    const result = recommendProductsForCapabilities({
      capabilityIds: EHR_CAPS,
      fingerprint: profileToFingerprint(SOLO_CASH_THERAPIST),
      products: catalog,
    });
    expect(["strong", "good", "possible", "weak"]).toContain(
      result.recommended?.fitTier
    );
  });

  it("names an add-on requirement as the material tradeoff", () => {
    const addonProduct = product("addon-ehr", [
      { capabilityId: "ehr-clinical-record", strength: "core" },
      {
        capabilityId: "treatment-planning",
        strength: "addon",
        requiresAddon: true,
        addonPriceCents: 2000,
      },
    ]);

    const result = recommendProductsForCapabilities({
      capabilityIds: EHR_CAPS,
      fingerprint: profileToFingerprint(SOLO_CASH_THERAPIST),
      products: [entry(addonProduct)],
    });

    expect(result.recommended?.tradeoff).toMatch(/add-on/i);
  });

  it("surfaces coverage a product adds beyond the requested capability", () => {
    const suite = product("suite", [
      { capabilityId: "ehr-clinical-record", strength: "core" },
      { capabilityId: "clinical-documentation", strength: "core" },
      { capabilityId: "scheduling", strength: "core" },
      { capabilityId: "telehealth", strength: "core" },
    ]);

    const result = recommendProductsForCapabilities({
      capabilityIds: EHR_CAPS,
      fingerprint: profileToFingerprint(SOLO_CASH_THERAPIST),
      products: [entry(suite)],
    });

    const additional = result.recommended?.coversAdditional.map(
      (c) => c.capabilityId
    );
    expect(additional).toContain("scheduling");
    expect(additional).toContain("telehealth");
  });
});

describe("EPCS claims are never presented as established", () => {
  it("flags an unverified EPCS claim for a controlled-substance prescriber", () => {
    const p = product(
      "vendor-claims-epcs",
      [
        { capabilityId: "prescribing-erx", strength: "strong" },
        {
          capabilityId: "epcs",
          strength: "strong",
          provenance: "vendor_provided",
        },
      ],
      { capabilityMapStatus: "unreviewed" }
    );

    const result = evaluateEligibility(p, profileToFingerprint(SOLO_PRESCRIBER));

    // The claim may be true, so the product stays selectable.
    expect(result.eligible).toBe(true);
    expect(result.uncertainties.some((u) => u.policy === "epcs")).toBe(true);
  });

  it("does not flag an EPCS claim that has been reviewed", () => {
    const p = product(
      "reviewed-epcs",
      [
        { capabilityId: "prescribing-erx", strength: "strong" },
        { capabilityId: "epcs", strength: "core" },
      ],
      { capabilityMapStatus: "reviewed-complete" }
    );

    const result = evaluateEligibility(p, profileToFingerprint(SOLO_PRESCRIBER));
    expect(result.uncertainties.some((u) => u.policy === "epcs")).toBe(false);
  });

  it("does not raise EPCS questions for a practice that does not prescribe", () => {
    const p = product(
      "vendor-claims-epcs",
      [
        {
          capabilityId: "epcs",
          strength: "strong",
          provenance: "vendor_provided",
        },
      ],
      { capabilityMapStatus: "unreviewed" }
    );

    const nonPrescriber = profileToFingerprint({
      ...SOLO_PRESCRIBER,
      roles: ["therapist"],
      prescribing: "none",
      services: ["psychotherapy"],
    });

    const result = evaluateEligibility(p, nonPrescriber);
    expect(result.uncertainties.some((u) => u.policy === "epcs")).toBe(false);
  });
});

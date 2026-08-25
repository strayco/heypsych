// src/lib/seo/__tests__/quality-measurement.test.ts
//
// Regression tests for the quality gates that decide indexability.
//
// Production evidence (2026-08-25): every one of the 133 condition entities and
// all 484 local treatment records were classified `public_noindex`. The content
// was not thin - condition pages measured a median of 3,460 words - the
// measurement read the wrong shape:
//
//   1. `entity.description` is a structured object on condition records, but was
//      pushed into a string array and stringified to "[object Object]", scoring
//      every condition at exactly 2 words against an 800-word gate.
//   2. Clinical completeness read `data.content.symptoms`, while current records
//      store clinical fields at the top level of `data`, and used field names the
//      corpus does not use (`causes` vs `risk_factors`, section type
//      `side_effects` vs `adverse_effects`).
//   3. The YMYL disclaimer check required a per-entity field for a disclaimer
//      that the page template renders unconditionally.
//
// Each of these silently delisted an entire content cohort, so each gets a test.

import { describe, it, expect } from "vitest";
import type { Entity } from "@/lib/types/database";
import { makeEntityIndexDecision } from "../index-decision-service";

/** Roughly 900 words of prose - comfortably over the 800-word condition gate. */
const PROSE = "clinically meaningful explanatory sentence about the condition ".repeat(150);

/**
 * A condition shaped the way real records are shaped: a structured description
 * object and clinical fields at the top level of `data`.
 */
function realShapedCondition(overrides: Partial<Entity> = {}): Entity {
  return {
    id: "gad",
    slug: "generalized-anxiety-disorder",
    name: "Generalized Anxiety Disorder",
    type: "condition",
    schema_id: "condition-v1",
    status: "active",
    visibility: "public",
    // Structured, not a string - this is what broke the word count.
    description: {
      overview: PROSE,
      common_reactions_to_diagnosis: ["relief at having a name for it"],
      what_it_can_look_like_in_real_life: [
        { title: "The Mental Marathon", story: PROSE },
      ],
    },
    data: {
      // Clinical fields at top level, using the corpus's real field names.
      symptoms: { core: ["excessive worry"], associated: ["restlessness"] },
      risk_factors: { biological: ["family history"], environmental: ["stress"] },
      diagnostic_criteria: { duration: "6 months" },
      treatment_approaches: { psychotherapy: ["CBT"], medications: ["SSRIs"] },
      prognosis: "Good with treatment",
      ui: { layout: "3x3", tiles: [{ id: "what_is", title: "What It Is" }] },
    },
    metadata: { dsm5_code: "300.02", icd10_code: "F41.1" },
    editorial: { reviewBoard: ["john-lee-md"] },
    ...overrides,
  } as unknown as Entity;
}

/** A treatment shaped like a V3 record from data/treatments/. */
function realShapedTreatment(overrides: Partial<Entity> = {}): Entity {
  return {
    id: "sertraline-zoloft",
    slug: "sertraline-zoloft",
    name: "Sertraline (Zoloft)",
    type: "medication",
    schema_id: "treatment-v3",
    status: "active",
    visibility: "public",
    description: PROSE,
    data: {
      clinical_profile: {
        indications: ["major depressive disorder"],
        safety: { contraindications: ["MAOI use"] },
        modality_details: { mechanism: "SSRI" },
      },
      sections: [
        { type: "mechanism", heading: "Mechanism", text: PROSE },
        { type: "indications", heading: "Indications", text: PROSE },
        { type: "adverse_effects", heading: "Adverse Effects", text: PROSE },
        { type: "dosing", heading: "Dosing", text: PROSE },
        { type: "interactions", heading: "Interactions", text: PROSE },
        { type: "warnings", heading: "Warnings", text: PROSE },
      ],
    },
    metadata: {},
    editorial: { reviewBoard: ["john-lee-md"] },
    ...overrides,
  } as unknown as Entity;
}

describe("word count measurement", () => {
  it("counts prose inside a structured description object", () => {
    const decision = makeEntityIndexDecision(
      realShapedCondition(),
      "/conditions/generalized-anxiety-disorder"
    );

    // The bug produced exactly 2 ("[object", "Object]").
    expect(decision.evidence.quality.wordCount).toBeGreaterThan(800);
  });

  it("never stringifies an object into the word count", () => {
    const decision = makeEntityIndexDecision(
      realShapedCondition(),
      "/conditions/generalized-anxiety-disorder"
    );

    expect(decision.evidence.quality.wordCount).not.toBe(2);
  });

  it("reads clinical fields stored at the top level of data", () => {
    const decision = makeEntityIndexDecision(
      realShapedCondition(),
      "/conditions/generalized-anxiety-disorder"
    );

    expect(decision.evidence.quality.wordCount).toBeGreaterThan(800);
  });

  it("still reads the legacy nested content shape", () => {
    const legacy = realShapedCondition({
      description: PROSE,
      data: {
        content: {
          symptoms: { core: ["worry"] },
          causes: ["genetics"],
          diagnosis: "criteria",
          treatment_approaches: "CBT",
          prognosis: "good",
          overview: PROSE,
        },
      },
    } as Partial<Entity>);

    const decision = makeEntityIndexDecision(legacy, "/conditions/legacy");
    expect(decision.evidence.quality.wordCount).toBeGreaterThan(800);
  });

  it("excludes slugs, dates and layout hints from the count", () => {
    const identifiersOnly = realShapedCondition({
      description: "",
      data: {
        slug: "generalized-anxiety-disorder",
        type: "condition",
        status: "active",
        ui: { layout: "3x3" },
        created_at: "2025-11-24",
        metadata: { wikidata_qid: "Q178194" },
      },
    } as Partial<Entity>);

    const decision = makeEntityIndexDecision(identifiersOnly, "/conditions/x");
    // Machine identifiers must not be mistaken for readable content.
    expect(decision.evidence.quality.wordCount).toBeLessThan(10);
  });
});

describe("clinical completeness scoring", () => {
  it("credits condition etiology recorded as risk_factors", () => {
    const decision = makeEntityIndexDecision(
      realShapedCondition(),
      "/conditions/generalized-anxiety-disorder"
    );

    // Previously capped at 0.70 for every record because `causes` and
    // `references` never matched, leaving the whole corpus below the gate.
    expect(decision.evidence.quality.clinicalCompletenessScore).toBeGreaterThanOrEqual(0.7);
  });

  it("credits treatment sections using their real section types", () => {
    const decision = makeEntityIndexDecision(
      realShapedTreatment(),
      "/treatments/sertraline-zoloft"
    );

    // The old lookups (`clinical_metadata`, `side_effects`, `dosage`) matched
    // nothing in a V3 record, capping every treatment at 0.2.
    expect(decision.evidence.quality.clinicalCompletenessScore).toBeGreaterThanOrEqual(0.7);
  });

  it("does not credit a treatment that genuinely lacks clinical sections", () => {
    const hollow = realShapedTreatment({
      data: { clinical_profile: {}, sections: [] },
    } as Partial<Entity>);

    const decision = makeEntityIndexDecision(hollow, "/treatments/hollow");
    expect(decision.evidence.quality.clinicalCompletenessScore).toBeLessThan(0.7);
  });
});

describe("YMYL disclaimer compliance", () => {
  it("recognises the disclaimer rendered by the treatment template", () => {
    const decision = makeEntityIndexDecision(
      realShapedTreatment(),
      "/treatments/sertraline-zoloft"
    );

    expect(decision.evidence.ymyl?.hasDisclaimer).toBe(true);
  });

  it("indexes a controlled substance whose template carries the disclaimer", () => {
    // Controlled substances require a `critical` disclaimer level. 48 of them
    // were held out of the index despite rendering one.
    const controlled = realShapedTreatment({
      name: "Alprazolam (Xanax)",
      slug: "alprazolam-xanax",
      description: `A benzodiazepine. ${PROSE}`,
    } as Partial<Entity>);

    const decision = makeEntityIndexDecision(controlled, "/treatments/alprazolam-xanax");
    expect(decision.evidence.ymyl?.hasDisclaimer).toBe(true);
    expect(decision.indexable).toBe(true);
  });
});

describe("medical review quality credit", () => {
  /** A record short of the raw gate, which board review should offset. */
  const shortButReviewed = (editorial: unknown) =>
    realShapedCondition({
      description: { overview: "reviewed clinical prose ".repeat(240) },
      data: {
        symptoms: { core: ["symptom"] },
        risk_factors: { biological: ["genetics"] },
        diagnostic_criteria: { duration: "6 months" },
        treatment_approaches: { psychotherapy: ["CBT"] },
        prognosis: "Good with treatment",
      },
      editorial,
    } as Partial<Entity>);

  it("credits review recorded as medicalReviewerIds", () => {
    // All 133 conditions store the review this way and none stored a resolved
    // `medicalReviewer` object, so this credit never once applied.
    const decision = makeEntityIndexDecision(
      shortButReviewed({ medicalReviewerIds: ["john-lee-md"], reviewBoard: "official" }),
      "/conditions/reviewed"
    );

    expect(decision.indexable).toBe(true);
  });

  it("still credits an already-resolved reviewer object", () => {
    const decision = makeEntityIndexDecision(
      shortButReviewed({
        medicalReviewer: { name: "Dr. John Lee", credentials: "MD" },
      }),
      "/conditions/resolved-reviewer"
    );

    expect(decision.indexable).toBe(true);
  });

  it("gives no credit for a reviewer ID that names nobody", () => {
    // An unresolvable ID must not buy a lower quality bar.
    const decision = makeEntityIndexDecision(
      shortButReviewed({ medicalReviewerIds: ["not-a-real-reviewer"] }),
      "/conditions/unknown-reviewer"
    );

    expect(decision.indexable).toBe(false);
  });

  it("gives no credit when no reviewer is recorded", () => {
    const decision = makeEntityIndexDecision(
      shortButReviewed({}),
      "/conditions/unreviewed"
    );

    expect(decision.indexable).toBe(false);
  });
});

describe("end-to-end indexability of real-shaped records", () => {
  it("indexes a fully documented condition", () => {
    const decision = makeEntityIndexDecision(
      realShapedCondition(),
      "/conditions/generalized-anxiety-disorder"
    );

    expect(decision.indexable).toBe(true);
    expect(decision.sitemapEligible).toBe(true);
  });

  it("indexes a fully documented treatment", () => {
    const decision = makeEntityIndexDecision(
      realShapedTreatment(),
      "/treatments/sertraline-zoloft"
    );

    expect(decision.indexable).toBe(true);
  });

  it("still refuses a genuinely thin record", () => {
    const thin = realShapedCondition({
      description: "Short.",
      data: { symptoms: {} },
    } as Partial<Entity>);

    const decision = makeEntityIndexDecision(thin, "/conditions/thin");
    expect(decision.indexable).toBe(false);
  });

  it("still honours an explicit noindex flag", () => {
    const flagged = realShapedCondition({ seo: { noindex: true } } as Partial<Entity>);
    const decision = makeEntityIndexDecision(flagged, "/conditions/flagged");
    expect(decision.indexable).toBe(false);
  });
});

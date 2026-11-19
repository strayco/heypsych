/**
 * Draft my practice: one-step first draft from the existing engines.
 * Runs against the real published catalog.
 */
import { describe, expect, it } from "vitest";
import { ArchitectProductService } from "../services/architect-product-service";
import { draftPracticeStack } from "../services/draft-stack-service";
import { recommendProductsForCapabilities } from "../services/capability-recommendation-service";
import { profileToFingerprint } from "../adapters/profile-to-fingerprint";
import { createProject, type PracticeProfile, type PracticeProject } from "../schemas/practice-project";
import { deriveWorldState } from "../world/world-state";
import { isEligible } from "../engines/eligibility-engine";

const NOW = "2026-11-18T00:00:00.000Z";

async function catalog() {
  const { metadataMap, displayMap } = await ArchitectProductService.loadProducts();
  return [...metadataMap.entries()].map(([slug, metadata]) => ({ metadata, name: displayMap.get(slug)?.name ?? slug }));
}

function practice(profile: Partial<PracticeProfile>): PracticeProject {
  const base = createProject({ id: "p", now: NOW });
  return { ...base, onboardingComplete: true, profile: { ...base.profile, ...profile } };
}

const SOLO_THERAPIST = practice({ roles: ["therapist"], stage: "new", size: "solo", states: ["CA"], delivery: "hybrid", payment: "both", services: ["psychotherapy"] });
const PRESCRIBER = practice({ roles: ["psychiatrist"], stage: "new", size: "solo", states: ["NY"], delivery: "telehealth", payment: "cash", services: ["medication-management"], prescribing: "controlled" });

describe("draftPracticeStack", () => {
  it("drafts a usable stack for a solo therapist with few tools", async () => {
    const products = await catalog();
    const draft = draftPracticeStack({ project: SOLO_THERAPIST, fingerprint: profileToFingerprint(SOLO_THERAPIST.profile), products });
    expect(draft.picks.length).toBeGreaterThan(0);
    const tools = new Set(draft.picks.map((p) => p.assignment.productSlug));
    // All-in-one first: far fewer tools than functions.
    expect(tools.size).toBeLessThan(deriveWorldState(SOLO_THERAPIST).applicableCount);
    expect(draft.picks[0].objectName).toMatch(/Clinical records/i);
    for (const p of draft.picks) {
      expect(p.assignment.suggested).toBe(true);
      expect(p.assignment.capabilityIds.length).toBeGreaterThan(0);
    }
    console.log("solo therapist draft", draft.picks.map((p) => `${p.objectName}: ${p.option.productName}`), draft.leftOpen);
  });

  it("only drafts products the eligibility engine allows", async () => {
    const products = await catalog();
    for (const project of [SOLO_THERAPIST, PRESCRIBER]) {
      const fingerprint = profileToFingerprint(project.profile);
      const draft = draftPracticeStack({ project, fingerprint, products });
      for (const p of draft.picks) {
        const meta = products.find((x) => x.metadata.productSlug === p.assignment.productSlug)!.metadata;
        expect(isEligible(meta, fingerprint), p.assignment.productSlug).toBe(true);
      }
    }
  });

  it("picks exactly what the inspector would recommend for the first function", async () => {
    const products = await catalog();
    const fingerprint = profileToFingerprint(SOLO_THERAPIST.profile);
    const draft = draftPracticeStack({ project: SOLO_THERAPIST, fingerprint, products });
    const ehr = deriveWorldState(SOLO_THERAPIST).byId.get("clinical_computer")!;
    const inspector = recommendProductsForCapabilities({ capabilityIds: ehr.definition.capabilityIds, fingerprint, products, assignedSlugs: [], alternativeCount: 2 });
    expect(draft.picks[0].option.productSlug).toBe(inspector.recommended?.productSlug);
  });

  it("is deterministic and never overwrites the clinician's own choices or decisions", async () => {
    const products = await catalog();
    const fingerprint = profileToFingerprint(SOLO_THERAPIST.profile);
    expect(draftPracticeStack({ project: SOLO_THERAPIST, fingerprint, products })).toEqual(draftPracticeStack({ project: SOLO_THERAPIST, fingerprint, products }));

    const withChoice: PracticeProject = {
      ...SOLO_THERAPIST,
      assignments: [{ productSlug: "doxy-me", productName: "Doxy.me", capabilityIds: ["telehealth"], source: "selected", assignedAt: NOW, needsReview: false }],
      decisions: [{ capabilityId: "accounting", decision: "handled-elsewhere", decidedAt: NOW }],
    };
    const draft = draftPracticeStack({ project: withChoice, fingerprint, products });
    expect(draft.picks.some((p) => p.objectName.match(/Telehealth/i))).toBe(false);
    expect(draft.picks.some((p) => p.assignment.capabilityIds.includes("accounting"))).toBe(false);
    expect(draft.picks.some((p) => p.assignment.capabilityIds.includes("telehealth"))).toBe(false);
  });

  it("keeps EPCS uncertainty attached for a controlled-substance prescriber", async () => {
    const products = await catalog();
    const draft = draftPracticeStack({ project: PRESCRIBER, fingerprint: profileToFingerprint(PRESCRIBER.profile), products });
    const prescribing = draft.picks.find((p) => p.objectName.match(/Prescrib/i));
    if (prescribing) expect(prescribing.assignment.needsReview).toBe(true);
    console.log("prescriber draft", draft.picks.map((p) => `${p.objectName}: ${p.option.productName}${p.assignment.needsReview ? " (verify)" : ""}`));
  });
});

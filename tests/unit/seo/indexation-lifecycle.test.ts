/**
 * Indexation Lifecycle Tests
 *
 * End-to-end tests that verify the complete indexation decision flow:
 * 1. Entity with flaws → public_noindex
 * 2. Fix flaws → indexable_pilot or validated
 *
 * These tests prove the firewall works operationally, not just in isolation.
 *
 * @see Phase L of Wave 3 directive
 */

import { describe, it, expect, beforeEach } from "vitest";
import { makeEntityIndexDecision } from "@/lib/seo/index-decision-service";
import type { Entity } from "@/lib/types/database";
import { clearAuthorityGraph } from "@/lib/trust/authority-graph";
import { clearContributorRegistry } from "@/lib/trust/contributor-registry";
import { clearRegistry as clearSourceRegistry } from "@/lib/trust/clinical-source-registry";
import { clearLedger as clearClaimLedger } from "@/lib/trust/medical-claim-ledger";

// Helper function to generate content of approximate word count
function generateLongContent(wordCount: number): string {
  const words = [
    "depression", "treatment", "symptoms", "therapy", "medication",
    "patients", "clinical", "research", "studies", "evidence",
    "effective", "treatment", "outcomes", "health", "mental",
    "disorder", "anxiety", "management", "support", "recovery",
    "professional", "diagnosis", "evaluation", "assessment", "care",
  ];

  const result: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    result.push(words[i % words.length]);
  }
  return result.join(" ");
}

// Test fixtures - use paths that match actual route families
const baseConditionEntity: Entity = {
  id: "test-condition",
  schema_id: "condition",
  name: "Test Depressive Disorder",
  slug: "test-depressive-disorder",
  description: "A test condition for integration testing.",
  type: "condition",
  status: "active",
  visibility: "public",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-01T00:00:00Z",
  data: {},
  metadata: {},
};

// Medication entity - needs proper path override for treatments route family
const baseMedicationEntity: Entity = {
  id: "test-medication",
  schema_id: "treatment",
  name: "Test SSRI Medication",
  slug: "test-ssri-medication",
  description: "A test medication for integration testing.",
  type: "treatment", // Use "treatment" type for proper path routing
  status: "active",
  visibility: "public",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-01T00:00:00Z",
  data: {},
  metadata: {},
};

describe("Indexation Lifecycle - Condition Entities", () => {
  beforeEach(() => {
    // Clear all trust registries to start fresh
    clearAuthorityGraph();
    clearContributorRegistry();
    clearSourceRegistry();
    clearClaimLedger();
  });

  it("should reject entity with insufficient word count", () => {
    const thinEntity: Entity = {
      ...baseConditionEntity,
      description: "This is a very short description with few words.",
      data: {
        content: "Minimal content here.",
      },
    };

    const decision = makeEntityIndexDecision(thinEntity);

    expect(decision.cohort).toBe("public_noindex");
    expect(decision.reasons.some((r) => r.toLowerCase().includes("word count"))).toBe(true);
  });

  it("should reject entity with inactive status", () => {
    const inactiveEntity: Entity = {
      ...baseConditionEntity,
      status: "draft",
      data: {
        content: generateLongContent(500),
      },
    };

    const decision = makeEntityIndexDecision(inactiveEntity);

    // Draft status results in "retired" cohort, not public_noindex
    expect(decision.cohort).toBe("retired");
    expect(decision.reasons.some((r) => r.includes("status"))).toBe(true);
  });

  it("should reject entity with private visibility", () => {
    const privateEntity: Entity = {
      ...baseConditionEntity,
      visibility: "private",
      data: {
        content: generateLongContent(500),
      },
    };

    const decision = makeEntityIndexDecision(privateEntity);

    expect(decision.cohort).toBe("public_noindex");
    expect(decision.reasons.some((r) => r.includes("visibility"))).toBe(true);
  });

  it("should accept entity with sufficient content", () => {
    // Conditions require 800+ words and clinical completeness fields
    const goodEntity: Entity = {
      ...baseConditionEntity,
      description: generateLongContent(300),
      data: {
        // Clinical content fields must be nested under data.content
        content: {
          overview: generateLongContent(200),
          symptoms: {
            core: ["symptom1", "symptom2", "symptom3"],
          },
          causes: ["genetic factors", "environmental factors"],
          treatment_approaches: ["therapy", "medication"],
          prognosis: "Good with treatment",
        },
        sections: [
          { type: "overview", heading: "Overview", content: generateLongContent(200) },
          { type: "symptoms", heading: "Symptoms", content: generateLongContent(150) },
          { type: "causes", heading: "Causes", content: generateLongContent(150) },
        ],
      },
      metadata: {
        dsm5_code: "F32.1",
        references: [
          { title: "Study 1", doi: "10.1234/study1" },
          { title: "Study 2", doi: "10.1234/study2" },
        ],
      },
      editorial: {
        reviewBoard: [{ name: "Dr. Test", credentials: "MD" }],
      },
    };

    const decision = makeEntityIndexDecision(goodEntity);

    // Should be either indexable_pilot or another passing cohort
    expect(["indexable_pilot", "validated", "answer_king"]).toContain(decision.cohort);
  });

  it("should graduate from noindex to indexable when flaws are fixed", () => {
    // Step 1: Start with flawed entity (insufficient content)
    const flawedEntity: Entity = {
      ...baseConditionEntity,
      description: "Short description.",
      data: {
        content: "Too short.",
      },
    };

    const decision1 = makeEntityIndexDecision(flawedEntity);
    expect(decision1.cohort).toBe("public_noindex");

    // Step 2: Fix the flaws - conditions need 800+ words and clinical fields
    const fixedEntity: Entity = {
      ...flawedEntity,
      description: generateLongContent(400),
      data: {
        // Clinical content fields nested under data.content
        content: {
          overview: generateLongContent(200),
          symptoms: {
            core: ["fatigue", "sadness", "anhedonia"],
          },
          causes: ["genetic factors", "brain chemistry"],
          treatment_approaches: ["CBT", "medication"],
          prognosis: "Good with proper treatment",
        },
        sections: [
          { type: "overview", heading: "Overview", content: generateLongContent(200) },
          { type: "causes", heading: "Causes", content: generateLongContent(150) },
          { type: "treatment", heading: "Treatment", content: generateLongContent(150) },
        ],
      },
      metadata: {
        dsm5_code: "F32.1",
        references: [
          { title: "Reference 1", doi: "10.1000/ref1" },
        ],
      },
      editorial: {
        reviewBoard: [{ name: "Dr. Reviewer", credentials: "MD, PhD" }],
      },
    };

    const decision2 = makeEntityIndexDecision(fixedEntity);
    expect(["indexable_pilot", "validated", "answer_king"]).toContain(decision2.cohort);
  });
});

describe("Indexation Lifecycle - Treatment Entities", () => {
  beforeEach(() => {
    clearAuthorityGraph();
    clearContributorRegistry();
    clearSourceRegistry();
    clearClaimLedger();
  });

  it("should evaluate treatments with word count and clinical thresholds", () => {
    // Treatment with minimal content - should fail word count
    const minimalEntity: Entity = {
      ...baseMedicationEntity,
      description: "Short.",
      data: {
        content: "Very brief.",
      },
    };

    const decision = makeEntityIndexDecision(minimalEntity);

    // Should be noindex due to insufficient content
    expect(decision.cohort).toBe("public_noindex");
    expect(decision.reasons.some((r) =>
      r.toLowerCase().includes("word count") ||
      r.toLowerCase().includes("clinical")
    )).toBe(true);
  });

  it("should block medications with unsupported dosage claims (claim ledger gate)", () => {
    // Medications with dosage/interaction/side_effect sections trigger claim tracking.
    // Without explicit evidence levels, these claims are flagged as unsupported.
    // This is the CORRECT behavior of the claim ledger integration!
    const medicationWithUnsupportedClaims: Entity = {
      ...baseMedicationEntity,
      description: generateLongContent(300),
      data: {
        content: generateLongContent(400),
        clinical_metadata: {
          generic_name: "testsertine",
          drug_classes: ["SSRI"],
          mechanism_of_action: "Serotonin reuptake inhibitor",
          primary_indications: ["Major Depressive Disorder"],
          contraindications: ["MAOIs"],
        },
        sections: [
          { type: "overview", heading: "Overview", content: generateLongContent(100) },
          // These sections create medical claims that need evidence levels
          { type: "dosage", heading: "Dosage", content: "10-20mg daily. " + generateLongContent(50) },
          { type: "side_effects", heading: "Side Effects", content: "Nausea, headache. " + generateLongContent(50) },
          { type: "interactions", heading: "Interactions", content: "MAOIs, other SSRIs. " + generateLongContent(50) },
        ],
      },
      metadata: {
        references: [
          { title: "Drug Study 1", doi: "10.1234/drug1" },
        ],
      },
      editorial: {
        reviewBoard: [{ name: "Dr. Pharmacist", credentials: "PharmD" }],
      },
    };

    const decision = makeEntityIndexDecision(medicationWithUnsupportedClaims);

    // Should be blocked by the claim ledger gate
    expect(decision.cohort).toBe("public_noindex");
    expect(decision.reasons.some((r) => r.toLowerCase().includes("unsupported"))).toBe(true);
    expect(decision.evidence.claimTracking?.hasUnsupportedClaims).toBe(true);
  });

  it("should enforce clinical completeness requirements for treatments", () => {
    // Medications WITHOUT dosage/side_effects sections will fail clinical completeness
    // This is correct behavior - medications MUST have these sections for medical accuracy
    const medicationWithoutClinicalSections: Entity = {
      ...baseMedicationEntity,
      description: generateLongContent(300),
      data: {
        content: generateLongContent(400),
        clinical_metadata: {
          generic_name: "testsertine",
          drug_classes: ["SSRI"],
          mechanism_of_action: "Serotonin reuptake inhibitor",
          primary_indications: ["Major Depressive Disorder"],
          contraindications: ["MAOIs"],
        },
        // Only overview sections - no dosage/side_effects/interactions
        sections: [
          { type: "overview", heading: "Overview", content: generateLongContent(200) },
          { type: "mechanism", heading: "How It Works", content: generateLongContent(100) },
        ],
      },
      metadata: {
        references: [
          { title: "Drug Study 1", doi: "10.1234/drug1" },
        ],
      },
      editorial: {
        reviewBoard: [{ name: "Dr. Pharmacist", credentials: "PharmD" }],
      },
    };

    const decision = makeEntityIndexDecision(medicationWithoutClinicalSections);

    // Should be blocked by clinical completeness gate
    expect(decision.cohort).toBe("public_noindex");
    expect(decision.reasons.some((r) => r.toLowerCase().includes("clinical completeness"))).toBe(true);
  });

  it("demonstrates medication gate 1: missing clinical sections fails completeness", () => {
    // Medications MUST have dosage/side_effects sections for clinical completeness
    const noSectionsEntity: Entity = {
      ...baseMedicationEntity,
      description: generateLongContent(300),
      data: {
        content: generateLongContent(400),
        clinical_metadata: { mechanism_of_action: "test", primary_indications: ["test"] },
        sections: [{ type: "overview", heading: "Overview", content: generateLongContent(200) }],
      },
      metadata: { references: [{ title: "Study", doi: "10.1234/test" }] },
    };
    const decision = makeEntityIndexDecision(noSectionsEntity);
    expect(decision.cohort).toBe("public_noindex");
    expect(decision.reasons.some((r) => r.includes("Clinical completeness"))).toBe(true);
  });

  it("demonstrates medication gate 2: clinical sections without registered sources fail claim ledger", () => {
    // When dosage/side_effects sections exist, they create claims
    // Those claims need sources REGISTERED in the source registry (not just referenced)
    const withSectionsEntity: Entity = {
      ...baseMedicationEntity,
      description: generateLongContent(300),
      data: {
        content: generateLongContent(400),
        clinical_metadata: { mechanism_of_action: "test", primary_indications: ["test"] },
        sections: [
          { type: "overview", heading: "Overview", content: generateLongContent(100) },
          { type: "dosage", heading: "Dosage", content: "10mg daily. " + generateLongContent(50) },
          { type: "side_effects", heading: "Side Effects", content: "Nausea. " + generateLongContent(50) },
        ],
      },
      metadata: { references: [{ title: "Study", doi: "10.1234/test" }] },
    };
    const decision = makeEntityIndexDecision(withSectionsEntity);

    // Should be blocked by claim ledger - claims are unsupported
    expect(decision.cohort).toBe("public_noindex");
    expect(decision.reasons.some((r) => r.includes("Unsupported medical claims"))).toBe(true);
  });

  it("should track medical claim evidence", () => {
    const claimyEntity: Entity = {
      ...baseMedicationEntity,
      description: generateLongContent(250),
      data: {
        content: generateLongContent(400),
        clinical_metadata: {
          generic_name: "testsertine",
          drug_classes: ["SSRI"],
        },
        sections: [
          { type: "overview", heading: "Overview", content: generateLongContent(150) },
          { type: "dosage", heading: "Dosage", content: "Take 50mg twice daily. " + generateLongContent(50) },
          { type: "side_effects", heading: "Side Effects", content: "May cause drowsiness. " + generateLongContent(50) },
        ],
      },
      metadata: {
        references: [
          { title: "Source 1", doi: "10.1234/source1" },
        ],
      },
      editorial: {
        reviewBoard: [{ name: "Dr. Test", credentials: "MD" }],
      },
    };

    const decision = makeEntityIndexDecision(claimyEntity);

    // Verify claim tracking evidence is populated
    expect(decision.evidence.claimTracking).toBeDefined();
    expect(typeof decision.evidence.claimTracking?.claimCount).toBe("number");
  });
});

describe("Indexation Lifecycle - YMYL Compliance", () => {
  beforeEach(() => {
    clearAuthorityGraph();
    clearContributorRegistry();
    clearSourceRegistry();
    clearClaimLedger();
  });

  it("should classify controlled substances with elevated YMYL level", () => {
    const controlledSubstanceEntity: Entity = {
      ...baseMedicationEntity,
      name: "Test Benzodiazepine",
      slug: "test-benzodiazepine",
      // Include "benzodiazepine" in description for detection
      description: "This is a test benzodiazepine medication used for anxiety. " + generateLongContent(250),
      data: {
        content: generateLongContent(500),
        clinical_metadata: {
          generic_name: "testazepam",
          drug_classes: ["Benzodiazepine"],
          schedule: "IV",
        },
        sections: [
          { type: "overview", heading: "Overview", content: generateLongContent(150) },
          { type: "warnings", heading: "Warnings", content: "May cause dependence. " + generateLongContent(100) },
        ],
      },
      metadata: {
        references: [{ title: "Study", doi: "10.1234/benzo" }],
      },
      editorial: {
        reviewBoard: [{ name: "Dr. Test", credentials: "MD" }],
      },
    };

    const decision = makeEntityIndexDecision(controlledSubstanceEntity);

    // Check YMYL evidence exists
    expect(decision.evidence.ymyl).toBeDefined();
    expect(decision.evidence.ymyl?.isMedicalContent).toBe(true);

    // Controlled substances should have elevated or critical disclaimer level
    expect(["elevated", "critical"]).toContain(decision.evidence.ymyl?.disclaimerLevel);
  });
});

describe("Indexation Lifecycle - Evidence Collection", () => {
  beforeEach(() => {
    clearAuthorityGraph();
    clearContributorRegistry();
    clearSourceRegistry();
    clearClaimLedger();
  });

  it("should collect complete evidence for indexation decisions", () => {
    const entity: Entity = {
      ...baseConditionEntity,
      description: generateLongContent(300),
      data: {
        content: generateLongContent(500),
        sections: [
          { type: "overview", heading: "Overview", content: generateLongContent(150) },
        ],
        symptoms: {
          core: ["symptom1", "symptom2"],
        },
      },
      metadata: {
        references: [{ title: "Ref 1", doi: "10.1234/ref1" }],
      },
      editorial: {
        medicalReviewer: {
          name: "Dr. Test Reviewer",
          credentials: "MD, Board-Certified Psychiatrist",
          profileUrl: "/team/dr-test",
        },
        reviewBoard: [{ name: "Dr. Test", credentials: "MD" }],
      },
    };

    const decision = makeEntityIndexDecision(entity);

    // Quality evidence
    expect(decision.evidence.quality).toBeDefined();
    expect(decision.evidence.quality.wordCount).toBeGreaterThan(0);
    expect(typeof decision.evidence.quality.hasStructuredContent).toBe("boolean");
    expect(typeof decision.evidence.quality.hasReferences).toBe("boolean");
    expect(typeof decision.evidence.quality.hasMedicalReview).toBe("boolean");

    // Freshness evidence
    expect(decision.evidence.freshness).toBeDefined();
    expect(decision.evidence.freshness.createdAt).toBeDefined();
    expect(decision.evidence.freshness.updatedAt).toBeDefined();

    // YMYL evidence
    expect(decision.evidence.ymyl).toBeDefined();
    expect(decision.evidence.ymyl?.isMedicalContent).toBeDefined();

    // Authority evidence
    expect(decision.evidence.authority).toBeDefined();

    // Contributor evidence
    expect(decision.evidence.contributorIntegrity).toBeDefined();
    expect(typeof decision.evidence.contributorIntegrity?.hasReviewer).toBe("boolean");
  });
});

describe("Indexation Lifecycle - Quality Gates", () => {
  beforeEach(() => {
    clearAuthorityGraph();
    clearContributorRegistry();
    clearSourceRegistry();
    clearClaimLedger();
  });

  it("should provide decision reasons for all outcomes", () => {
    // Good entity
    const goodEntity: Entity = {
      ...baseConditionEntity,
      description: generateLongContent(300),
      data: {
        content: generateLongContent(500),
        sections: [
          { type: "overview", heading: "Overview", content: generateLongContent(200) },
        ],
      },
    };

    const goodDecision = makeEntityIndexDecision(goodEntity);
    expect(goodDecision.reasons.length).toBeGreaterThan(0);
    expect(goodDecision.reasons[0]).toBeTruthy();

    // Bad entity
    const badEntity: Entity = {
      ...baseConditionEntity,
      description: "Too short.",
      data: { content: "Minimal." },
    };

    const badDecision = makeEntityIndexDecision(badEntity);
    expect(badDecision.reasons.length).toBeGreaterThan(0);
    expect(badDecision.reasons[0]).toBeTruthy();
  });

  it("should return consistent decision structure", () => {
    const entity: Entity = {
      ...baseConditionEntity,
      description: generateLongContent(300),
      data: { content: generateLongContent(400) },
    };

    const decision = makeEntityIndexDecision(entity);

    // Verify all required fields exist
    expect(decision.routeFamily).toBeDefined();
    expect(decision.canonicalPath).toBeDefined();
    expect(typeof decision.public).toBe("boolean");
    expect(typeof decision.crawlable).toBe("boolean");
    expect(typeof decision.indexable).toBe("boolean");
    expect(typeof decision.sitemapEligible).toBe("boolean");
    expect(typeof decision.internallyPromotable).toBe("boolean");
    expect(typeof decision.alternateFormatEligible).toBe("boolean");
    expect(decision.cohort).toBeDefined();
    expect(Array.isArray(decision.reasons)).toBe(true);
    expect(decision.evidence).toBeDefined();
  });
});

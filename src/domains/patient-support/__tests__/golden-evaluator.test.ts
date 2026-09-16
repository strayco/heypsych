/**
 * Golden Tests: Patient Support Journey Evaluator
 *
 * These tests verify the deterministic behavior of the support path evaluator.
 * Each test case corresponds to a scenario in the Patient Pilot Contract.
 *
 * INVARIANTS TESTED:
 * - Crisis input ALWAYS returns crisis path immediately
 * - Safety keywords ALWAYS include crisis resources
 * - Unknown/skipped inputs result in broader recommendations, never narrower
 * - Medication interest MUST include psychiatric-eval path
 * - Same input produces same output (determinism)
 */

import { describe, it, expect } from "vitest";
import { evaluateSupportPath, hasCrisisSignal } from "../evaluator";
import { CRISIS_RESOURCES } from "../paths";
import type { PatientJourneyInput } from "../types";

// ============================================================================
// HELPER: Create test inputs
// ============================================================================

function createTestInput(
  overrides: Partial<PatientJourneyInput> = {}
): PatientJourneyInput {
  return {
    urgencyCheck: "planning-ahead",
    primaryConcerns: [],
    goals: [],
    ...overrides,
  };
}

// ============================================================================
// GOLDEN TEST CASE 1: Immediate Crisis
// ============================================================================

describe("Golden Test: Immediate Crisis", () => {
  it("should immediately return crisis path when urgency is immediate-crisis", () => {
    const input = createTestInput({
      urgencyCheck: "immediate-crisis",
    });

    const result = evaluateSupportPath(input);

    // Should return crisis-support as primary path
    expect(result.primaryPath.id).toBe("crisis-support");

    // Should have NO alternatives (crisis path only)
    expect(result.alternatives).toHaveLength(0);

    // Should include crisis resources
    expect(result.urgentResources).toBeDefined();
    expect(result.urgentResources).toHaveLength(CRISIS_RESOURCES.length);
    expect(result.urgentResources?.[0].name).toBe("988 Suicide & Crisis Lifeline");

    // Should have clear confidence
    expect(result.confidence).toBe("clear-path");

    // Should NOT continue to collect more information
    expect(result.missingInfo).toHaveLength(0);
  });

  it("should not continue journey after crisis selection", () => {
    // Even if user provides concerns, crisis takes priority
    const input = createTestInput({
      urgencyCheck: "immediate-crisis",
      primaryConcerns: ["mood-motivation", "worry-fear"],
      goals: ["talk-to-someone-regularly"],
    });

    const result = evaluateSupportPath(input);

    // Crisis still takes priority
    expect(result.primaryPath.id).toBe("crisis-support");
    expect(result.alternatives).toHaveLength(0);
  });
});

// ============================================================================
// GOLDEN TEST CASE 2: Safety Keyword Detection
// ============================================================================

describe("Golden Test: Safety Keyword Detection", () => {
  it("should include crisis resources when safety keywords detected", () => {
    const input = createTestInput({
      urgencyCheck: "struggling-now",
      primaryConcerns: ["mood-motivation"],
      goals: ["talk-to-someone-regularly"],
      safetyKeywordsDetected: true,
    });

    const result = evaluateSupportPath(input);

    // Should still provide a recommendation (not just crisis)
    expect(result.primaryPath.id).not.toBe("crisis-support");

    // But MUST include crisis resources
    expect(result.urgentResources).toBeDefined();
    expect(result.urgentResources).toHaveLength(CRISIS_RESOURCES.length);
  });

  it("hasCrisisSignal should detect both crisis urgency and safety keywords", () => {
    expect(hasCrisisSignal({ urgencyCheck: "immediate-crisis" })).toBe(true);
    expect(hasCrisisSignal({ safetyKeywordsDetected: true })).toBe(true);
    expect(hasCrisisSignal({ urgencyCheck: "planning-ahead" })).toBe(false);
    expect(
      hasCrisisSignal({ urgencyCheck: "struggling-now", safetyKeywordsDetected: false })
    ).toBe(false);
  });
});

// ============================================================================
// GOLDEN TEST CASE 3: Therapy-Seeking Adult
// ============================================================================

describe("Golden Test: Therapy-Seeking Adult", () => {
  it("should recommend therapy for user wanting regular support with prior app experience", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["worry-fear", "mood-motivation"],
      duration: "more-than-3-months",
      goals: ["talk-to-someone-regularly", "learn-coping-strategies"],
      priorSupport: "tried-apps",
      insurancePreference: "use-insurance",
      modalityPreference: "either",
    });

    const result = evaluateSupportPath(input);

    // Primary path should be therapy
    expect(result.primaryPath.id).toBe("therapy-counseling");

    // Should include alternatives
    expect(result.alternatives.length).toBeGreaterThan(0);

    // Should have clear confidence
    expect(result.confidence).toBe("clear-path");

    // Should NOT include crisis resources (no signal)
    expect(result.urgentResources).toBeUndefined();

    // Should include therapy-related action
    expect(result.nextActions.some((a) => a.label.toLowerCase().includes("therapy"))).toBe(true);

    // Should include why reasons
    expect(result.primaryPath.whyThisFits.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// GOLDEN TEST CASE 4: Medication Interest
// ============================================================================

describe("Golden Test: Medication Interest", () => {
  it("should include psychiatric-eval when user wants medication", () => {
    const input = createTestInput({
      urgencyCheck: "struggling-now",
      primaryConcerns: ["mood-motivation", "sleep"],
      duration: "2-weeks-to-3-months",
      goals: ["explore-medication"],
      priorSupport: "tried-therapy",
    });

    const result = evaluateSupportPath(input);

    // INVARIANT: Medication interest must include psychiatric-eval
    const haspsychiatricPath =
      result.primaryPath.id === "psychiatric-eval" ||
      result.alternatives.some((a) => a.id === "psychiatric-eval");

    expect(haspsychiatricPath).toBe(true);

    // Should mention medication in reasons
    expect(
      result.primaryPath.whyThisFits.some((r) => r.toLowerCase().includes("medication"))
    ).toBe(true);
  });

  it("should recommend integrated care when wanting both therapy and medication", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["mood-motivation"],
      goals: ["explore-medication", "talk-to-someone-regularly"],
    });

    const result = evaluateSupportPath(input);

    // Should recommend integrated care
    expect(result.primaryPath.id).toBe("integrated-care");

    // psychiatric-eval and therapy should be alternatives
    expect(result.alternatives.some((a) => a.id === "psychiatric-eval")).toBe(true);
    expect(result.alternatives.some((a) => a.id === "therapy-counseling")).toBe(true);
  });
});

// ============================================================================
// GOLDEN TEST CASE 5: Minimal Input
// ============================================================================

describe("Golden Test: Minimal Input", () => {
  it("should provide broader recommendations when minimal input provided", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: [], // skipped
      goals: [], // skipped
    });

    const result = evaluateSupportPath(input);

    // Should still provide a recommendation
    expect(result.primaryPath).toBeDefined();

    // Confidence should be lower
    expect(result.confidence).toBe("needs-exploration");

    // Should indicate what information would help
    expect(result.missingInfo.length).toBeGreaterThan(0);
    expect(result.missingInfo.some((m) => m.includes("experiencing"))).toBe(true);

    // Should provide multiple alternatives
    expect(result.alternatives.length).toBeGreaterThan(2);
  });

  it("should not narrow recommendations with missing info", () => {
    // With full info
    const fullInput = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["worry-fear"],
      duration: "more-than-3-months",
      goals: ["talk-to-someone-regularly"],
      priorSupport: "tried-apps",
    });

    // With minimal info
    const minimalInput = createTestInput({
      urgencyCheck: "planning-ahead",
    });

    const fullResult = evaluateSupportPath(fullInput);
    const minimalResult = evaluateSupportPath(minimalInput);

    // Minimal should have same or more alternatives (never fewer)
    expect(minimalResult.alternatives.length).toBeGreaterThanOrEqual(
      fullResult.alternatives.length
    );
  });
});

// ============================================================================
// GOLDEN TEST CASE 6: Prior Therapy Experience
// ============================================================================

describe("Golden Test: Prior Experience Handling", () => {
  it("should recommend psychiatric-eval for medication interest after trying therapy", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["mood-motivation"],
      goals: ["explore-medication"],
      priorSupport: "tried-therapy",
    });

    const result = evaluateSupportPath(input);

    // Should recommend psychiatric evaluation since they've tried therapy
    expect(result.primaryPath.id).toBe("psychiatric-eval");
    expect(
      result.primaryPath.whyThisFits.some((r) => r.toLowerCase().includes("tried therapy"))
    ).toBe(true);
  });

  it("should handle currently-in-care appropriately", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["mood-motivation"],
      goals: ["talk-to-someone-regularly"],
      priorSupport: "currently-in-care",
    });

    const result = evaluateSupportPath(input);

    // Should mention they're looking for something different
    expect(
      result.primaryPath.whyThisFits.some((r) => r.includes("different"))
    ).toBe(true);

    // Confidence may be lower since we're not sure what's not working
    expect(["reasonable-options", "needs-exploration"]).toContain(result.confidence);
  });
});

// ============================================================================
// GOLDEN TEST: Determinism
// ============================================================================

describe("Golden Test: Determinism", () => {
  it("should produce identical output for identical input", () => {
    const input = createTestInput({
      urgencyCheck: "struggling-now",
      primaryConcerns: ["worry-fear", "sleep"],
      duration: "2-weeks-to-3-months",
      goals: ["understand-experience", "learn-coping-strategies"],
      priorSupport: "none",
      insurancePreference: "not-sure",
      modalityPreference: "either",
    });

    // Run evaluation multiple times
    const results = Array.from({ length: 5 }, () => evaluateSupportPath(input));

    // All results should be identical
    const firstResult = JSON.stringify(results[0]);
    for (const result of results) {
      expect(JSON.stringify(result)).toBe(firstResult);
    }
  });

  it("should include version information for reproducibility", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["mood-motivation"],
      goals: ["talk-to-someone-regularly"],
    });

    const result = evaluateSupportPath(input);

    expect(result.versions).toBeDefined();
    expect(result.versions.definition).toBeDefined();
    expect(result.versions.evaluator).toBeDefined();
    expect(typeof result.versions.definition).toBe("string");
    expect(typeof result.versions.evaluator).toBe("string");
  });
});

// ============================================================================
// GOLDEN TEST: Required Output Structure
// ============================================================================

describe("Golden Test: Required Output Structure", () => {
  it("should always include disclaimer", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["mood-motivation"],
      goals: ["talk-to-someone-regularly"],
    });

    const result = evaluateSupportPath(input);

    expect(result.disclaimer).toBeDefined();
    expect(result.disclaimer.length).toBeGreaterThan(0);
    expect(result.disclaimer).toContain("not a diagnosis");
  });

  it("should always include next actions", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["mood-motivation"],
      goals: ["talk-to-someone-regularly"],
    });

    const result = evaluateSupportPath(input);

    expect(result.nextActions).toBeDefined();
    expect(result.nextActions.length).toBeGreaterThan(0);

    // Should always include start over option
    expect(result.nextActions.some((a) => a.type === "reset")).toBe(true);
  });

  it("should always include self-assessment action", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["mood-motivation"],
      goals: ["talk-to-someone-regularly"],
    });

    const result = evaluateSupportPath(input);

    expect(
      result.nextActions.some((a) => a.label.toLowerCase().includes("assessment"))
    ).toBe(true);
  });
});

// ============================================================================
// GOLDEN TEST: Crisis Support Goal
// ============================================================================

describe("Golden Test: Crisis Support Goal", () => {
  it("should recommend crisis-support when user selects that goal", () => {
    const input = createTestInput({
      urgencyCheck: "struggling-now", // Not immediate-crisis, but
      primaryConcerns: ["mood-motivation"],
      goals: ["crisis-support"], // explicitly wants crisis support
    });

    const result = evaluateSupportPath(input);

    expect(result.primaryPath.id).toBe("crisis-support");
    expect(result.confidence).toBe("clear-path");
  });
});

// ============================================================================
// GOLDEN TEST: Digital Tools for Mild/Early Concerns
// ============================================================================

describe("Golden Test: Digital Tools Path", () => {
  it("should recommend digital tools for short duration, no prior support, just understanding", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["mood-motivation"],
      duration: "less-than-2-weeks",
      goals: ["understand-experience"],
      priorSupport: "none",
    });

    const result = evaluateSupportPath(input);

    // Should recommend digital tools for mild, recent, first-time exploration
    expect(result.primaryPath.id).toBe("digital-tools");
    expect(result.confidence).toBe("reasonable-options");

    // But therapy should be an alternative
    expect(
      result.alternatives.some((a) => a.id === "therapy-counseling")
    ).toBe(true);
  });
});

// ============================================================================
// GOLDEN TEST: Professional Evaluation Goal
// ============================================================================

describe("Golden Test: Professional Evaluation", () => {
  it("should recommend psychiatric-eval for evaluation goal with prescribing-relevant concerns", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["attention-memory", "mood-motivation"],
      goals: ["professional-evaluation"],
    });

    const result = evaluateSupportPath(input);

    // Should recommend psychiatric evaluation for diagnosis-seeking with relevant concerns
    expect(result.primaryPath.id).toBe("psychiatric-eval");
  });

  it("should recommend therapy for evaluation goal with non-prescribing concerns", () => {
    const input = createTestInput({
      urgencyCheck: "planning-ahead",
      primaryConcerns: ["relationships-social"],
      goals: ["professional-evaluation"],
    });

    const result = evaluateSupportPath(input);

    // Should recommend therapy for relationship-focused evaluation
    expect(result.primaryPath.id).toBe("therapy-counseling");
  });
});

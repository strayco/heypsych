/**
 * Symptom Quality Gate Tests
 *
 * Validates quality gate for indexable symptoms.
 */
import { describe, it, expect } from "vitest";
import {
  validateSymptomEntity,
  validateAllSymptoms,
  getApprovedSymptoms,
  getFailingSymptoms,
  validateUniqueSlugs,
  validateConditionReferences,
  runFullValidation,
} from "../quality-gate";
import { SYMPTOM_REGISTRY } from "../registry";
import type { SymptomEntity } from "../types";

describe("Symptom Quality Gate", () => {
  describe("validateSymptomEntity", () => {
    const validSymptom: SymptomEntity = {
      slug: "test-symptom",
      name: "Test Symptom",
      shortDefinition:
        "This is a valid short definition that explains what this symptom feels like in plain, accessible language.",
      aliases: ["test", "testing"],
      searchPhrases: ["test phrase"],
      category: "mood-motivation",
      examples: [
        { context: "everyday", text: "Example 1" },
        { context: "work-school", text: "Example 2" },
      ],
      relatedSymptoms: [],
      conditionRelationships: [
        {
          conditionSlug: "major-depressive-disorder",
          conditionName: "Major Depressive Disorder",
          context: "This symptom commonly appears in depression.",
        },
      ],
      nonPsychiatricConsiderations: ["Sleep deprivation"],
      whenToSeekHelp: ["When symptoms persist for weeks"],
      assessmentLinks: [],
      indexable: true,
      reviewed: true,
      lastReviewed: "2024-01-15",
    };

    it("passes for valid symptom", () => {
      const result = validateSymptomEntity(validSymptom);
      expect(result.passes).toBe(true);
      expect(result.failures.length).toBe(0);
    });

    it("fails for short definition < 50 chars", () => {
      const symptom = { ...validSymptom, shortDefinition: "Too short" };
      const result = validateSymptomEntity(symptom);
      expect(result.passes).toBe(false);
      expect(result.failures.some((f) => f.includes("definition"))).toBe(true);
    });

    it("fails for < 2 examples", () => {
      const symptom = {
        ...validSymptom,
        examples: [{ context: "everyday" as const, text: "Only one" }],
      };
      const result = validateSymptomEntity(symptom);
      expect(result.passes).toBe(false);
      expect(result.failures.some((f) => f.includes("examples"))).toBe(true);
    });

    it("fails for no condition relationships", () => {
      const symptom = { ...validSymptom, conditionRelationships: [] };
      const result = validateSymptomEntity(symptom);
      expect(result.passes).toBe(false);
      expect(result.failures.some((f) => f.includes("condition"))).toBe(true);
    });

    it("warns for few aliases", () => {
      const symptom = { ...validSymptom, aliases: [] };
      const result = validateSymptomEntity(symptom);
      expect(result.warnings.some((w) => w.includes("aliases"))).toBe(true);
    });

    it("fails for non-indexable symptom", () => {
      const symptom = { ...validSymptom, indexable: false };
      const result = validateSymptomEntity(symptom);
      expect(result.passes).toBe(false);
    });

    it("fails for diagnostic language in definition", () => {
      const symptom = {
        ...validSymptom,
        shortDefinition:
          "This symptom indicates that you have depression or are diagnosed with anxiety disorder and may require treatment.",
      };
      const result = validateSymptomEntity(symptom);
      expect(result.passes).toBe(false);
      expect(result.failures.some((f) => f.includes("diagnostic"))).toBe(true);
    });
  });

  describe("validateAllSymptoms", () => {
    it("validates all symptoms in registry", () => {
      const results = validateAllSymptoms();
      expect(results.size).toBe(SYMPTOM_REGISTRY.length);
    });

    it("results are keyed by symptom slug", () => {
      const results = validateAllSymptoms();
      for (const slug of results.keys()) {
        expect(typeof slug).toBe("string");
        expect(SYMPTOM_REGISTRY.some((s) => s.slug === slug)).toBe(true);
      }
    });
  });

  describe("getApprovedSymptoms", () => {
    it("returns only approved symptoms", () => {
      const approved = getApprovedSymptoms();
      for (const symptom of approved) {
        const result = validateSymptomEntity(symptom);
        expect(result.passes).toBe(true);
      }
    });
  });

  describe("getFailingSymptoms", () => {
    it("returns array with slug and failures", () => {
      const failing = getFailingSymptoms();
      expect(Array.isArray(failing)).toBe(true);
      for (const item of failing) {
        expect(typeof item.slug).toBe("string");
        expect(Array.isArray(item.failures)).toBe(true);
      }
    });
  });

  describe("validateUniqueSlugs", () => {
    it("passes for registry with unique slugs", () => {
      const result = validateUniqueSlugs();
      expect(result.valid).toBe(true);
    });

    it("returns duplicates array", () => {
      const result = validateUniqueSlugs();
      expect(Array.isArray(result.duplicates)).toBe(true);
    });
  });

  describe("validateConditionReferences", () => {
    it("validates all condition references", () => {
      const result = validateConditionReferences();
      // Result should have valid structure
      expect(typeof result.valid).toBe("boolean");
      expect(Array.isArray(result.missing)).toBe(true);
    });
  });

  describe("runFullValidation", () => {
    it("runs all validations", () => {
      const result = runFullValidation();
      expect(typeof result.passed).toBe("number");
      expect(typeof result.failed).toBe("number");
      expect(typeof result.warnings).toBe("number");
      expect(result.details instanceof Map).toBe(true);
      expect(typeof result.uniqueSlugs).toBe("boolean");
      expect(typeof result.summary).toBe("string");
    });

    it("all registry symptoms should pass", () => {
      const result = runFullValidation();
      // If any fail, log them for debugging
      if (result.failed > 0) {
        const failingSymptoms = getFailingSymptoms();
        console.log(
          "Failing symptoms:",
          failingSymptoms.map((f) => `${f.slug}: ${f.failures.join(", ")}`)
        );
      }
      expect(result.failed).toBe(0);
    });
  });
});

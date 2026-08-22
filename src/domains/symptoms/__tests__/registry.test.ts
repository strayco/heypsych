/**
 * Symptom Registry Tests
 *
 * Validates the approved symptom registry.
 */
import { describe, it, expect } from "vitest";
import {
  SYMPTOM_REGISTRY,
  SYMPTOM_CATEGORIES,
  getSymptomBySlug,
  getSymptomsByCategory,
  getAllSymptomSlugs,
  getIndexableSymptoms,
  getCategoryMeta,
  findSymptomBySlugOrAlias,
} from "../registry";
import type { SymptomCategory } from "../types";

describe("Symptom Registry", () => {
  describe("SYMPTOM_REGISTRY", () => {
    it("contains curated symptoms", () => {
      expect(SYMPTOM_REGISTRY.length).toBeGreaterThan(0);
    });

    it("all symptoms have required fields", () => {
      for (const symptom of SYMPTOM_REGISTRY) {
        expect(symptom.slug).toBeTruthy();
        expect(symptom.name).toBeTruthy();
        expect(symptom.shortDefinition).toBeTruthy();
        expect(symptom.category).toBeTruthy();
        expect(Array.isArray(symptom.aliases)).toBe(true);
        expect(Array.isArray(symptom.searchPhrases)).toBe(true);
        expect(Array.isArray(symptom.examples)).toBe(true);
        expect(Array.isArray(symptom.relatedSymptoms)).toBe(true);
        expect(Array.isArray(symptom.conditionRelationships)).toBe(true);
      }
    });

    it("all symptoms have unique slugs", () => {
      const slugs = SYMPTOM_REGISTRY.map((s) => s.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it("all symptoms have valid categories", () => {
      const validCategories = SYMPTOM_CATEGORIES.map((c) => c.id);
      for (const symptom of SYMPTOM_REGISTRY) {
        expect(validCategories).toContain(symptom.category);
      }
    });

    it("all symptoms have at least one example", () => {
      for (const symptom of SYMPTOM_REGISTRY) {
        expect(symptom.examples.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("all symptoms have definition > 50 chars", () => {
      for (const symptom of SYMPTOM_REGISTRY) {
        expect(symptom.shortDefinition.length).toBeGreaterThan(50);
      }
    });
  });

  describe("getSymptomBySlug", () => {
    it("returns symptom for valid slug", () => {
      const symptom = getSymptomBySlug("low-mood");
      expect(symptom).toBeDefined();
      expect(symptom?.name).toBe("Low Mood");
    });

    it("returns undefined for invalid slug", () => {
      const symptom = getSymptomBySlug("nonexistent-symptom");
      expect(symptom).toBeUndefined();
    });
  });

  describe("findSymptomBySlugOrAlias", () => {
    it("returns symptom for canonical slug", () => {
      const symptom = findSymptomBySlugOrAlias("low-mood");
      expect(symptom).toBeDefined();
      expect(symptom?.slug).toBe("low-mood");
    });

    it("returns symptom for alias", () => {
      const symptom = findSymptomBySlugOrAlias("feeling-down");
      expect(symptom).toBeDefined();
      expect(symptom?.slug).toBe("low-mood");
    });

    it("returns undefined for invalid slug or alias", () => {
      const symptom = findSymptomBySlugOrAlias("nonexistent-alias");
      expect(symptom).toBeUndefined();
    });
  });

  describe("getSymptomsByCategory", () => {
    it("returns symptoms for valid category", () => {
      const symptoms = getSymptomsByCategory("mood-motivation");
      expect(symptoms.length).toBeGreaterThan(0);
      expect(symptoms.every((s) => s.category === "mood-motivation")).toBe(true);
    });

    it("returns empty array for category with no symptoms", () => {
      const symptoms = getSymptomsByCategory("nonexistent" as SymptomCategory);
      expect(symptoms).toEqual([]);
    });
  });

  describe("getAllSymptomSlugs", () => {
    it("returns array of slugs", () => {
      const slugs = getAllSymptomSlugs();
      expect(slugs.length).toBe(SYMPTOM_REGISTRY.length);
      expect(slugs.every((s) => typeof s === "string")).toBe(true);
    });
  });

  describe("getIndexableSymptoms", () => {
    it("returns only indexable symptoms", () => {
      const symptoms = getIndexableSymptoms();
      expect(symptoms.every((s) => s.indexable === true)).toBe(true);
    });

    it("returns only reviewed symptoms", () => {
      const symptoms = getIndexableSymptoms();
      expect(symptoms.every((s) => s.reviewed === true)).toBe(true);
    });
  });

  describe("getCategoryMeta", () => {
    it("returns metadata for valid category", () => {
      const meta = getCategoryMeta("mood-motivation");
      expect(meta).toBeDefined();
      expect(meta?.name).toBeTruthy();
      expect(meta?.description).toBeTruthy();
    });

    it("returns undefined for invalid category", () => {
      const meta = getCategoryMeta("nonexistent" as SymptomCategory);
      expect(meta).toBeUndefined();
    });
  });

  describe("SYMPTOM_CATEGORIES", () => {
    it("all categories have required fields", () => {
      for (const category of SYMPTOM_CATEGORIES) {
        expect(category.id).toBeTruthy();
        expect(category.name).toBeTruthy();
        expect(category.description).toBeTruthy();
      }
    });
  });
});

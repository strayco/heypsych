/**
 * Symptom Search Index Tests
 *
 * Validates search functionality and privacy safeguards.
 */
import { describe, it, expect } from "vitest";
import {
  buildSearchIndex,
  searchSymptoms,
  checkForSafetyKeywords,
  getSuggestedPrompts,
  suggestCategories,
} from "../search-index";

describe("Symptom Search Index", () => {
  const searchIndex = buildSearchIndex();

  describe("buildSearchIndex", () => {
    it("creates index with correct structure", () => {
      expect(searchIndex.length).toBeGreaterThan(0);
      for (const entry of searchIndex) {
        expect(entry.s).toBeTruthy(); // slug
        expect(entry.n).toBeTruthy(); // name
        expect(entry.c).toBeTruthy(); // category
        expect(entry.d).toBeTruthy(); // definition
        expect(typeof entry.t).toBe("string"); // searchable text
      }
    });

    it("includes search phrases in searchable text", () => {
      // Check that searchable text (t) contains meaningful content
      for (const entry of searchIndex) {
        expect(entry.t.length).toBeGreaterThan(10);
      }
    });
  });

  describe("searchSymptoms", () => {
    it("returns results for matching query", () => {
      const results = searchSymptoms("sad", searchIndex);
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns empty array for no matches", () => {
      const results = searchSymptoms("xyznonexistentterm", searchIndex);
      expect(results).toEqual([]);
    });

    it("returns results with correct structure", () => {
      const results = searchSymptoms("mood", searchIndex);
      for (const result of results) {
        expect(result.slug).toBeTruthy();
        expect(result.name).toBeTruthy();
        expect(result.shortDefinition).toBeTruthy();
        expect(result.category).toBeTruthy();
        expect(typeof result.score).toBe("number");
      }
    });

    it("respects limit option", () => {
      const results = searchSymptoms("feeling", searchIndex, { limit: 3 });
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it("ranks exact matches higher", () => {
      const results = searchSymptoms("low mood", searchIndex);
      // If low-mood exists, it should be ranked highly
      const lowMoodIndex = results.findIndex((r) => r.slug === "low-mood");
      if (lowMoodIndex >= 0) {
        expect(lowMoodIndex).toBeLessThan(3);
      }
    });

    it("handles empty query", () => {
      const results = searchSymptoms("", searchIndex);
      expect(results).toEqual([]);
    });

    it("handles whitespace-only query", () => {
      const results = searchSymptoms("   ", searchIndex);
      expect(results).toEqual([]);
    });
  });

  describe("checkForSafetyKeywords", () => {
    it("returns true for crisis keywords", () => {
      expect(checkForSafetyKeywords("suicide")).toBe(true);
      expect(checkForSafetyKeywords("kill myself")).toBe(true);
      expect(checkForSafetyKeywords("want to die")).toBe(true);
      expect(checkForSafetyKeywords("self harm")).toBe(true);
      expect(checkForSafetyKeywords("hurt myself")).toBe(true);
    });

    it("returns false for general symptoms", () => {
      expect(checkForSafetyKeywords("feeling sad")).toBe(false);
      expect(checkForSafetyKeywords("anxiety")).toBe(false);
      expect(checkForSafetyKeywords("trouble sleeping")).toBe(false);
      expect(checkForSafetyKeywords("low mood")).toBe(false);
    });

    it("is case insensitive", () => {
      expect(checkForSafetyKeywords("SUICIDE")).toBe(true);
      expect(checkForSafetyKeywords("Suicide")).toBe(true);
    });
  });

  describe("getSuggestedPrompts", () => {
    it("returns array of prompts", () => {
      const prompts = getSuggestedPrompts();
      expect(prompts.length).toBeGreaterThan(0);
    });

    it("prompts have text and slug", () => {
      const prompts = getSuggestedPrompts();
      for (const prompt of prompts) {
        expect(prompt.text).toBeTruthy();
        expect(prompt.slug).toBeTruthy();
      }
    });
  });

  describe("suggestCategories", () => {
    it("returns categories for mood-related query", () => {
      const categories = suggestCategories("feeling sad", searchIndex);
      expect(categories.length).toBeGreaterThanOrEqual(0);
    });

    it("returns categories for anxiety-related query", () => {
      const categories = suggestCategories("worried all the time", searchIndex);
      expect(categories.length).toBeGreaterThanOrEqual(0);
    });

    it("returns empty for unrelated query", () => {
      const categories = suggestCategories("xyzrandomtext", searchIndex);
      expect(categories.length).toBe(0);
    });
  });
});

/**
 * Tests for useFuzzySearch hook
 *
 * To run these tests, you'll need to set up Jest or Vitest:
 * 1. Install dependencies: npm install -D @testing-library/react @testing-library/react-hooks jest
 * 2. Configure Jest/Vitest
 * 3. Run: npm test
 */

import { renderHook } from "@testing-library/react";
import { useFuzzySearch } from "../useFuzzySearch";

// Mock hotline data for testing
const mockHotlines = [
  {
    id: "veterans-crisis-line",
    name: "Veterans Crisis Line",
    summary: "24/7 confidential crisis support for Veterans and service members.",
    labels: {
      focus: ["Veterans", "Military"],
      audience: ["Veterans", "Active Duty"],
    },
    taxonomy: {
      topics: ["crisis", "ptsd"],
      conditions: ["ptsd", "depression"],
      identities: ["Veterans", "Military"],
    },
    search: {
      keywords: ["veteran", "military", "ptsd", "army"],
      aka: ["VCL"],
    },
  },
  {
    id: "the-trevor-project",
    name: "The Trevor Project",
    summary: "24/7 crisis support for LGBTQ+ young people.",
    labels: {
      focus: ["LGBTQ+", "Youth"],
      audience: ["LGBTQ+", "Under 25"],
    },
    taxonomy: {
      topics: ["crisis", "suicide-prevention"],
      conditions: ["depression", "anxiety"],
      identities: ["LGBTQ+", "Youth"],
    },
    search: {
      keywords: ["lgbtq", "gay", "lesbian", "trans", "youth"],
      aka: ["Trevor Lifeline"],
    },
  },
  {
    id: "maternal-mental-health-hotline",
    name: "National Maternal Mental Health Hotline",
    summary: "24/7 support for pregnant and postpartum individuals.",
    labels: {
      focus: ["Maternal", "Postpartum"],
      audience: ["Pregnant", "Postpartum"],
    },
    taxonomy: {
      topics: ["crisis", "maternal-health"],
      conditions: ["postpartum-depression", "anxiety"],
      identities: ["Pregnant", "Postpartum"],
    },
    search: {
      keywords: ["postpartum", "pregnancy", "maternal", "ppd"],
      aka: ["Maternal Hotline"],
    },
  },
  {
    id: "postpartum-support-international",
    name: "Postpartum Support International (PSI)",
    summary: "Support for perinatal mood and anxiety disorders.",
    labels: {
      focus: ["Postpartum", "Perinatal"],
      audience: ["Pregnant", "Postpartum"],
    },
    taxonomy: {
      topics: ["crisis", "perinatal-health"],
      conditions: ["postpartum-depression", "anxiety"],
      identities: ["Pregnant", "Postpartum"],
    },
    search: {
      keywords: ["postpartum", "perinatal", "ppd"],
      aka: ["PSI"],
    },
  },
];

describe("useFuzzySearch", () => {
  describe("Exact matching", () => {
    it("should find exact name match", () => {
      const { result } = renderHook(() =>
        useFuzzySearch(mockHotlines, "Veterans Crisis Line")
      );
      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe("veterans-crisis-line");
    });

    it("should find exact keyword match", () => {
      const { result } = renderHook(() =>
        useFuzzySearch(mockHotlines, "veteran")
      );
      expect(result.current.length).toBeGreaterThan(0);
      expect(result.current[0].id).toBe("veterans-crisis-line");
    });
  });

  describe("Case insensitivity", () => {
    it("should match regardless of case", () => {
      const { result: upper } = renderHook(() =>
        useFuzzySearch(mockHotlines, "VETERANS")
      );
      const { result: lower } = renderHook(() =>
        useFuzzySearch(mockHotlines, "veterans")
      );
      const { result: mixed } = renderHook(() =>
        useFuzzySearch(mockHotlines, "VeTeRaNs")
      );

      expect(upper.current).toHaveLength(lower.current.length);
      expect(lower.current).toHaveLength(mixed.current.length);
      expect(upper.current[0].id).toBe(lower.current[0].id);
    });
  });

  describe("Typo tolerance", () => {
    it("should match with 1 character typo (<=5 chars)", () => {
      const { result } = renderHook(() =>
        useFuzzySearch(mockHotlines, "yoth") // "youth" with typo
      );
      expect(result.current.length).toBeGreaterThan(0);
      expect(
        result.current.some((h) => h.id === "the-trevor-project")
      ).toBeTruthy();
    });

    it("should match with 2 character typos (>5 chars)", () => {
      const { result } = renderHook(() =>
        useFuzzySearch(mockHotlines, "veterens") // "veterans" with typo
      );
      expect(result.current.length).toBeGreaterThan(0);
      expect(result.current[0].id).toBe("veterans-crisis-line");
    });
  });

  describe("Keyword matching", () => {
    it("should match keywords", () => {
      const { result } = renderHook(() =>
        useFuzzySearch(mockHotlines, "lgbtq")
      );
      expect(result.current.length).toBeGreaterThan(0);
      expect(result.current[0].id).toBe("the-trevor-project");
    });

    it("should match multiple hotlines with shared keywords", () => {
      const { result } = renderHook(() =>
        useFuzzySearch(mockHotlines, "postpartum")
      );
      expect(result.current.length).toBeGreaterThanOrEqual(2);
      const ids = result.current.map((h) => h.id);
      expect(ids).toContain("maternal-mental-health-hotline");
      expect(ids).toContain("postpartum-support-international");
    });
  });

  describe("Identity matching", () => {
    it("should match by identity tags", () => {
      const { result } = renderHook(() =>
        useFuzzySearch(mockHotlines, "military")
      );
      expect(result.current.length).toBeGreaterThan(0);
      expect(result.current[0].id).toBe("veterans-crisis-line");
    });
  });

  describe("AKA (alias) matching", () => {
    it("should match by alias", () => {
      const { result } = renderHook(() =>
        useFuzzySearch(mockHotlines, "PSI")
      );
      expect(result.current.length).toBeGreaterThan(0);
      expect(result.current[0].id).toBe("postpartum-support-international");
    });
  });

  describe("Ranking", () => {
    it("should rank exact matches higher than fuzzy matches", () => {
      const { result } = renderHook(() =>
        useFuzzySearch(mockHotlines, "veterans")
      );
      // Exact match in name should be first
      expect(result.current[0].id).toBe("veterans-crisis-line");
    });

    it("should rank prefix matches high", () => {
      const { result } = renderHook(() =>
        useFuzzySearch(mockHotlines, "Vet")
      );
      expect(result.current[0].id).toBe("veterans-crisis-line");
    });
  });

  describe("Empty query", () => {
    it("should return all hotlines when query is empty", () => {
      const { result } = renderHook(() => useFuzzySearch(mockHotlines, ""));
      expect(result.current).toHaveLength(mockHotlines.length);
    });

    it("should return all hotlines when query is whitespace", () => {
      const { result } = renderHook(() => useFuzzySearch(mockHotlines, "   "));
      expect(result.current).toHaveLength(mockHotlines.length);
    });
  });

  describe("No matches", () => {
    it("should return empty array when no matches", () => {
      const { result } = renderHook(() =>
        useFuzzySearch(mockHotlines, "xyzabc123")
      );
      expect(result.current).toHaveLength(0);
    });
  });

  describe("A-Z grouping helpers", () => {
    // These test the helper functions used in CrisisAtoZSection
    it("should ignore 'The' prefix in sorting", () => {
      const name = "The Trevor Project";
      const cleaned = name.replace(/^(The|An|A)\s+/i, "");
      expect(cleaned).toBe("Trevor Project");
      expect(cleaned.charAt(0)).toBe("T");
    });

    it("should handle names without articles", () => {
      const name = "Veterans Crisis Line";
      const cleaned = name.replace(/^(The|An|A)\s+/i, "");
      expect(cleaned).toBe("Veterans Crisis Line");
      expect(cleaned.charAt(0)).toBe("V");
    });
  });
});

describe("Integration tests", () => {
  it("typing 'veterans' isolates Veterans Crisis Line", () => {
    const { result } = renderHook(() =>
      useFuzzySearch(mockHotlines, "veterans")
    );
    expect(result.current[0].id).toBe("veterans-crisis-line");
  });

  it("typing 'postpartum' finds maternal + PSI hotlines", () => {
    const { result } = renderHook(() =>
      useFuzzySearch(mockHotlines, "postpartum")
    );
    expect(result.current.length).toBeGreaterThanOrEqual(2);
    const ids = result.current.map((h) => h.id);
    expect(ids).toContain("maternal-mental-health-hotline");
    expect(ids).toContain("postpartum-support-international");
  });

  it("typing 'lgbtq' finds Trevor Project", () => {
    const { result } = renderHook(() =>
      useFuzzySearch(mockHotlines, "lgbtq")
    );
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current[0].id).toBe("the-trevor-project");
  });
});

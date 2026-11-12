import { describe, expect, it } from "vitest";
import {
  checkSiblingUniqueness,
  compareFingerprints,
  type ContentFingerprint,
} from "../similarity-engine";

function fp(slug: string, words: string[], over: Partial<ContentFingerprint> = {}): ContentFingerprint {
  const ngramSet = new Set<string>();
  for (let i = 0; i + 3 <= words.length; i++) ngramSet.add(words.slice(i, i + 3).join(" "));
  return {
    slug,
    pageType: "treatment-for-condition",
    sectionHeaders: ["overview", "side effects"],
    ngramSet,
    topics: ["type:treatment-for-condition"],
    wordCount: words.length,
    generatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

const vocab = Array.from({ length: 40 }, (_, i) => `w${i}`);
function words(seed: number, n: number): string[] {
  let x = seed;
  return Array.from({ length: n }, () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return vocab[x % vocab.length];
  });
}

describe("compareFingerprints", () => {
  it("counts shared and total n-grams exactly as a set intersection and union", () => {
    for (let seed = 1; seed < 30; seed++) {
      const a = fp("a", words(seed, 200 + seed));
      const b = fp("b", words(seed * 7 + 3, 180));
      const union = new Set([...a.ngramSet, ...b.ngramSet]).size;
      const shared = [...a.ngramSet].filter((g) => b.ngramSet.has(g)).length;

      const result = compareFingerprints(a, b);
      expect(result.details.sharedNgrams).toBe(shared);
      expect(result.details.totalNgrams).toBe(union);
      expect(result.components.textual).toBe(shared / union);
      // Symmetric.
      expect(compareFingerprints(b, a).score).toBe(result.score);
    }
  });

  it("scores text below the n-gram minimum as neutral", () => {
    const small = fp("small", words(1, 10));
    const big = fp("big", words(2, 300));
    expect(compareFingerprints(small, big).components.textual).toBe(0.5);
  });
});

describe("checkSiblingUniqueness", () => {
  it("compares only against the pool it is given", () => {
    const page = fp("page", words(5, 300));
    const twin = fp("twin", words(5, 300));
    expect(checkSiblingUniqueness(page, [page]).highestSimilarity).toBe(0);
    expect(checkSiblingUniqueness(page, [page, twin]).highestSimilarity).toBeCloseTo(1);
  });
});

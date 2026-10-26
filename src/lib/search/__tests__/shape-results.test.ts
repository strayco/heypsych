import { describe, expect, it } from "vitest";
import {
  classifyRow,
  contextSnippet,
  dedupeResults,
  getSearchTerms,
  groupResults,
  isRelevant,
  orderSections,
  rankResults,
  relevanceScore,
  rowToResult,
  type SearchResult,
} from "../shape-results";

function result(partial: Partial<SearchResult> & { name: string }): SearchResult {
  const slug = partial.slug ?? partial.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    type: "treatment",
    id: slug,
    slug,
    description: null,
    category: null,
    snippets: [],
    href: `/treatments/${slug}`,
    ...partial,
  };
}

describe("getSearchTerms", () => {
  it("lower-cases, strips punctuation and de-duplicates", () => {
    expect(getSearchTerms("  ADHD, adhd  meds! ")).toEqual(["adhd", "meds"]);
  });

  it("folds accents so café matches cafe", () => {
    expect(getSearchTerms("café")).toEqual(["cafe"]);
  });

  it("returns nothing for punctuation-only input", () => {
    expect(getSearchTerms("'; --")).toEqual([]);
  });
});

describe("classifyRow", () => {
  it("links conditions and treatments to their routes", () => {
    expect(classifyRow({ slug: "panic-disorder", type: "condition" })).toEqual({
      type: "condition",
      href: "/conditions/panic-disorder",
    });
    expect(classifyRow({ slug: "guanfacine", type: "adhd-medication" })).toEqual({
      type: "treatment",
      href: "/treatments/guanfacine",
    });
  });

  it("files crisis hotlines as resources, not treatments (their treatment URL 404s)", () => {
    expect(
      classifyRow({ slug: "talk-suicide-canada", type: "hotline", category: "support-community" })
    ).toEqual({ type: "resource", href: "/resources/talk-suicide-canada" });
  });

  it("links comparisons to /treatments/compare", () => {
    expect(classifyRow({ slug: "lexapro-vs-zoloft", type: "comparison" })).toEqual({
      type: "treatment",
      href: "/treatments/compare/lexapro-vs-zoloft",
    });
  });

  it("moves patient-app resource stubs to tools", () => {
    expect(classifyRow({ slug: "talkspace", type: "resource" })).toEqual({
      type: "tool",
      href: "/tools/talkspace",
    });
  });

  it("keeps genuine resources that share a slug with a tool", () => {
    expect(classifyRow({ slug: "nami", type: "resource" })).toEqual({
      type: "resource",
      href: "/resources/nami",
    });
  });

  it("drops providers and rows without a slug", () => {
    expect(classifyRow({ slug: "dr-smith", type: "provider" })).toBeNull();
    expect(classifyRow({ slug: "", type: "condition" })).toBeNull();
  });
});

describe("rowToResult", () => {
  it("hides internal category buckets", () => {
    const r = rowToResult(
      { slug: "x", type: "resource", title: "X", category: "knowledge-hub" },
      ["x"]
    );
    expect(r?.category).toBeNull();
  });
});

describe("relevanceScore", () => {
  const terms = (q: string) => getSearchTerms(q);

  it("treats a parenthetical alias as a name", () => {
    const zoloft = result({ name: "Sertraline (Zoloft)" });
    expect(relevanceScore(zoloft, "zoloft", terms("zoloft"))).toBe(100);
  });

  it("scores prefix, all-terms and some-terms name matches in that order", () => {
    const q = "bipolar disorder";
    const prefix = relevanceScore(result({ name: "Bipolar Disorder Due to Another Medical Condition" }), q, terms(q));
    const allTerms = relevanceScore(result({ name: "Disorder, Bipolar II" }), q, terms(q));
    const someTerms = relevanceScore(result({ name: "Bipolar Mood Tracker" }), q, terms(q));
    expect(prefix).toBeGreaterThan(allTerms);
    expect(allTerms).toBeGreaterThan(someTerms);
    expect(someTerms).toBeGreaterThan(0);
  });

  it("matches word starts, not substrings inside words", () => {
    // "add" should not match "Paddington".
    expect(relevanceScore(result({ name: "Paddington Clinic" }), "add", ["add"])).toBe(0);
  });
});

describe("rankResults", () => {
  it("puts the named item above body-text matches, keeping database order otherwise", () => {
    const ranked = rankResults(
      [
        result({ name: "Autism Spectrum Disorder" }),
        result({ name: "Lexapro vs Zoloft" }),
        result({ name: "Sertraline (Zoloft)" }),
        result({ name: "Bupropion" }),
      ],
      "zoloft"
    );
    expect(ranked.map((r) => r.name)).toEqual([
      "Sertraline (Zoloft)",
      "Lexapro vs Zoloft",
      "Autism Spectrum Disorder",
      "Bupropion",
    ]);
  });
});

describe("dedupeResults", () => {
  it("removes repeated names within a type and repeated links across types", () => {
    const kept = dedupeResults([
      result({ name: "Guanfacine (Tenex, Intuniv)", slug: "guanfacine" }),
      result({ name: "Guanfacine (Tenex, Intuniv)", slug: "guanfacine-er" }),
      result({ name: "Talk Suicide Canada", type: "resource", href: "/resources/talk-suicide-canada" }),
      result({ name: "Talk Suicide Canada", type: "resource", href: "/resources/talk-suicide-canada/" }),
    ]);
    expect(kept).toHaveLength(2);
  });

  it("keeps the most specific page when the same name is in two sections", () => {
    const kept = dedupeResults([
      result({ name: "988 Suicide & Crisis Lifeline", type: "tool", href: "/tools/988-suicide-lifeline" }),
      result({ name: "988 Suicide & Crisis Lifeline", type: "resource", href: "/resources/988-lifeline" }),
      result({ name: "Lexapro vs Zoloft", type: "resource", href: "/resources/lexapro-vs-zoloft" }),
      result({ name: "Lexapro vs Zoloft", href: "/treatments/compare/lexapro-vs-zoloft" }),
    ]);
    expect(kept.map((r) => r.href)).toEqual([
      "/resources/988-lifeline",
      "/treatments/compare/lexapro-vs-zoloft",
    ]);
  });

  it("treats a name with and without its parenthetical as the same item", () => {
    const kept = dedupeResults([
      result({ name: "International OCD Foundation (IOCDF)", type: "resource", href: "/resources/iocdf" }),
      result({ name: "International OCD Foundation", type: "resource", href: "/resources/iocdf-2" }),
    ]);
    expect(kept).toHaveLength(1);
  });
});

describe("stemmed name matching", () => {
  it("ranks Major Depressive Disorder above longer depressive names for 'depression'", () => {
    const ranked = rankResults(
      [
        result({ name: "Depressive Disorder Due to Another Medical Condition", type: "condition" }),
        result({ name: "Phencyclidine Use Disorder", type: "condition" }),
        result({ name: "Major Depressive Disorder", type: "condition" }),
      ],
      "depression"
    );
    expect(ranked.map((r) => r.name)).toEqual([
      "Major Depressive Disorder",
      "Depressive Disorder Due to Another Medical Condition",
      "Phencyclidine Use Disorder",
    ]);
  });
});

describe("acronyms", () => {
  it("ranks the spelled-out condition first for 'ptsd' and 'ocd'", () => {
    const ptsd = rankResults(
      [
        result({ name: "Nightmare Disorder", type: "condition" }),
        result({ name: "Posttraumatic Stress Disorder", type: "condition" }),
      ],
      "ptsd"
    );
    expect(ptsd[0].name).toBe("Posttraumatic Stress Disorder");

    const ocd = rankResults(
      [
        result({ name: "Substance/Medication-Induced Obsessive-Compulsive and Related Disorder", type: "condition" }),
        result({ name: "Obsessive-Compulsive Disorder", type: "condition" }),
      ],
      "ocd"
    );
    expect(ocd[0].name).toBe("Obsessive-Compulsive Disorder");
  });

  it("does not let a spelled-out alias outrank a real name match", () => {
    const grouped = groupResults(
      [
        result({ name: "DBSA (Depression and Bipolar Support Alliance)", type: "resource", href: "/resources/dbsa" }),
        result({ name: "Major Depressive Disorder", type: "condition", href: "/conditions/mdd" }),
      ],
      "depression"
    );
    expect(orderSections(grouped, "depression")[0]).toBe("conditions");
  });
});

describe("orderSections", () => {
  it("opens on the section whose top result is the best match", () => {
    const grouped = groupResults(
      [
        result({ name: "Transvestic Disorder", type: "condition", href: "/conditions/t" }),
        result({ name: "Couples Therapy", href: "/treatments/couples-therapy" }),
      ],
      "couples therapy"
    );
    expect(orderSections(grouped, "couples therapy")[0]).toBe("treatments");
  });
});

describe("contextSnippet", () => {
  const sesame = {
    slug: "sesame",
    description: "Cash-pay healthcare marketplace with therapy and psychiatry.",
    seo: { keywords: ["adderall online"], faqs: [{ q: "Can Sesame prescribe Adderall?", a: "No. Sesame providers cannot prescribe controlled substances including stimulants (Adderall, Vyvanse)." }] },
    pricing: { notes: "Cannot prescribe controlled substances (no Adderall, benzos, opioids). Patients can submit bills to insurance." },
  };

  it("finds the sentence containing the term, preferring FAQ answers over notes", () => {
    const snippet = contextSnippet(sesame, ["adderall"]);
    expect(snippet).toBe(
      "Sesame providers cannot prescribe controlled substances including stimulants (Adderall, Vyvanse)."
    );
  });

  it("keeps the first word when the match is in the opening sentence", () => {
    expect(contextSnippet({ notes: "Can Done prescribe Adderall? It depends on state law." }, ["adderall"])).toBe(
      "Can Done prescribe Adderall?"
    );
    expect(contextSnippet({ notes: "Call 988 and press 1." }, ["988"])).toBe("Call 988 and press 1.");
  });

  it("never quotes machinery like keywords or URLs", () => {
    expect(contextSnippet({ seo: { keywords: ["adderall online"] }, url: "https://x.com/adderall" }, ["adderall"])).toBeNull();
  });

  it("trims long sentences around the match", () => {
    const long = `${"word ".repeat(80)}mentions adderall here ${"word ".repeat(80)}`;
    const snippet = contextSnippet({ description: long }, ["adderall"], 120)!;
    expect(snippet.length).toBeLessThanOrEqual(122);
    expect(snippet).toContain("adderall");
  });
});

describe("isRelevant", () => {
  it("rejects substring-only matches such as 'ab' in 'tablet'", () => {
    const tool = result({
      name: "Doxy.me",
      type: "tool",
      description: "Telehealth on any tablet or phone",
    });
    expect(isRelevant(tool, "ab")).toBe(false);
    expect(isRelevant(tool, "telehealth")).toBe(true);
  });
});

describe("groupResults", () => {
  it("sorts every result into its section", () => {
    const grouped = groupResults(
      [
        result({ name: "ADHD", type: "condition", href: "/conditions/adhd" }),
        result({ name: "Talkspace", type: "tool", href: "/tools/talkspace" }),
        result({ name: "Adderall" }),
      ],
      "adhd"
    );
    expect(grouped.conditions).toHaveLength(1);
    expect(grouped.tools).toHaveLength(1);
    expect(grouped.treatments).toHaveLength(1);
    expect(grouped.resources).toHaveLength(0);
  });
});

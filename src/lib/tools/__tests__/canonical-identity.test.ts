import { describe, expect, it } from "vitest";
import {
  dedupeByCanonicalSlug,
  getAliasEntry,
  getAliasesFor,
  isAlias,
  listAliases,
  resolveCanonicalSlug,
} from "../canonical-identity";

describe("canonical identity resolution", () => {
  it("resolves a confirmed duplicate to its canonical slug", () => {
    expect(resolveCanonicalSlug("valant")).toBe("valant-ehr-suite");
    expect(resolveCanonicalSlug("kipu-emr")).toBe("kipu-health");
    expect(resolveCanonicalSlug("qualifacts-insync-ehr")).toBe("qualifacts-insync");
  });

  it("leaves an unknown slug untouched", () => {
    // A product we have no alias information about is its own identity.
    expect(resolveCanonicalSlug("simplepractice")).toBe("simplepractice");
    expect(resolveCanonicalSlug("not-a-real-product")).toBe("not-a-real-product");
  });

  it("treats a canonical slug as canonical, not as an alias", () => {
    expect(isAlias("valant-ehr-suite")).toBe(false);
    expect(isAlias("valant")).toBe(true);
  });

  it("honours the pre-existing redirect map", () => {
    expect(resolveCanonicalSlug("kareo")).toBe("tebra");
  });

  it("does not collapse distinct products that share a parent company", () => {
    // Ensora Health owns several practice systems. They are not one purchase.
    expect(resolveCanonicalSlug("theranest")).toBe("theranest");
    expect(resolveCanonicalSlug("theranest")).not.toBe(
      resolveCanonicalSlug("ensora-fusion")
    );
    // PatientPop is Tebra's marketing product, not the EHR.
    expect(resolveCanonicalSlug("patientpop")).toBe("patientpop");
    expect(resolveCanonicalSlug("tebra")).toBe("tebra");
  });

  it("records why a slug was treated as an alias", () => {
    const entry = getAliasEntry("valant");
    expect(entry?.canonical).toBe("valant-ehr-suite");
    expect(entry?.reason).toBe("duplicate-record");
    expect(entry?.evidence).toBeTruthy();
  });

  it("lists aliases pointing at a canonical product", () => {
    expect(getAliasesFor("valant-ehr-suite")).toContain("valant");
  });

  it("terminates on a chain rather than looping forever", () => {
    // Every alias must reach a fixed point within the hop limit.
    for (const entry of listAliases()) {
      const resolved = resolveCanonicalSlug(entry.alias);
      expect(resolveCanonicalSlug(resolved)).toBe(resolved);
    }
  });
});

describe("dedupeByCanonicalSlug", () => {
  const item = (slug: string) => ({ slug });

  it("collapses an alias and its canonical record into one entry", () => {
    const result = dedupeByCanonicalSlug(
      [item("valant"), item("valant-ehr-suite")],
      (x) => x.slug
    );
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("valant-ehr-suite");
  });

  it("prefers the canonical record regardless of input order", () => {
    const result = dedupeByCanonicalSlug(
      [item("valant-ehr-suite"), item("valant")],
      (x) => x.slug
    );
    expect(result.map((x) => x.slug)).toEqual(["valant-ehr-suite"]);
  });

  it("keeps an alias when its canonical twin is not present", () => {
    // Deduplication must never make a product disappear entirely.
    const result = dedupeByCanonicalSlug([item("valant")], (x) => x.slug);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("valant");
  });

  it("leaves unrelated products alone", () => {
    const result = dedupeByCanonicalSlug(
      [item("simplepractice"), item("therapynotes"), item("jane")],
      (x) => x.slug
    );
    expect(result).toHaveLength(3);
  });

  it("does not merge different products from the same vendor", () => {
    const result = dedupeByCanonicalSlug(
      [item("qualifacts-insync"), item("qualifacts-carelogic-enterprise")],
      (x) => x.slug
    );
    expect(result).toHaveLength(2);
  });
});

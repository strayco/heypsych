import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { computeConsensus, contentHash, groupOf, normalizeRating, recencyWeight } from "../engine";
import { ObservationZ, type Observation } from "../schema";
import { toPublicConsensus } from "../public";

const AS_OF = "2026-11-20";
let n = 0;
function obs(partial: Partial<Observation>): Observation {
  n += 1;
  return ObservationZ.parse({
    id: `o${n}`,
    source: "capterra",
    url: `https://example.com/listing-${n}`,
    listingName: "Product",
    match: "exact",
    scope: "full-product",
    rating: 4.5,
    ratingScale: 5,
    reviewCount: 500,
    observedAt: "2026-11-01",
    acquisition: "manual-public-page",
    permission: "public-display-permitted",
    ...partial,
  });
}

const strong = () => [
  obs({ source: "capterra", rating: 4.6, reviewCount: 1200 }),
  obs({ source: "trustradius", rating: 4.4, reviewCount: 300 }),
  obs({ source: "other", sourceName: "Trustpilot", url: "https://www.trustpilot.com/review/x", rating: 4.5, reviewCount: 400 }),
];

describe("normalisation and weights", () => {
  it("maps 1-5 and 1-10 ratings to 0-100 and clamps", () => {
    expect(normalizeRating(1, 5)).toBe(0);
    expect(normalizeRating(5, 5)).toBe(100);
    expect(normalizeRating(3, 5)).toBe(50);
    expect(normalizeRating(10, 10)).toBe(100);
    expect(normalizeRating(0.5, 5)).toBe(0);
  });
  it("decays recency from full to half weight", () => {
    expect(recencyWeight(0)).toBe(1);
    expect(recencyWeight(6)).toBe(1);
    expect(recencyWeight(15)).toBeCloseTo(0.75);
    expect(recencyWeight(30)).toBe(0.5);
  });
});

describe("scoring", () => {
  it("is deterministic and order-independent", () => {
    const a = strong();
    const r1 = computeConsensus(a, AS_OF);
    const r2 = computeConsensus([...a].reverse(), AS_OF);
    expect(r1).toEqual(r2);
    expect(r1.status).toBe("scored");
    expect(r1.confidence).toBe("High");
    expect(r1.score).toBeGreaterThan(80);
    expect(r1.score).toBeLessThanOrEqual(100);
  });

  it("withholds a single source, however many reviews it has", () => {
    const r = computeConsensus([obs({ reviewCount: 50000 })], AS_OF);
    expect(r.status).toBe("withheld");
    expect(r.score).toBeNull();
    expect(r.confidence).toBeNull();
  });

  it("withholds tiny samples and never shows certainty from a few perfect reviews", () => {
    const tiny = computeConsensus([obs({ source: "capterra", rating: 5, reviewCount: 3 }), obs({ source: "trustradius", rating: 5, reviewCount: 4 })], AS_OF);
    expect(tiny.status).toBe("withheld");
    // Just above the minimum: perfect ratings are pulled well below 100.
    const small = computeConsensus([obs({ source: "capterra", rating: 5, reviewCount: 20 }), obs({ source: "trustradius", rating: 5, reviewCount: 20 })], AS_OF);
    expect(small.status).toBe("scored");
    expect(small.confidence).toBe("Limited");
    expect(small.score!).toBeLessThan(85);
  });

  it("counts the G2 network (G2, Capterra, GetApp, Software Advice) once", () => {
    const r = computeConsensus(
      [
        obs({ source: "capterra", reviewCount: 800 }),
        obs({ source: "getapp", reviewCount: 800 }),
        obs({ source: "software-advice", reviewCount: 790 }),
        obs({ source: "g2", rating: 3.9, reviewCount: 400 }),
        obs({ source: "trustradius", reviewCount: 100 }),
      ],
      AS_OF
    );
    expect(r.independentGroups).toBe(2);
    expect(r.contributions.filter((c) => c.status === "syndicated-duplicate")).toHaveLength(3);
    expect(new Set([groupOf(obs({ source: "getapp" })), groupOf(obs({ source: "g2" })), groupOf(obs({ source: "software-advice" }))])).toEqual(new Set([groupOf(obs({ source: "capterra" }))]));
    // G2 and Capterra alone are one source: withheld.
    expect(computeConsensus([obs({ source: "capterra", reviewCount: 2000 }), obs({ source: "g2", reviewCount: 2000 })], AS_OF).status).toBe("withheld");
  });

  it("ignores the same listing recorded twice", () => {
    const a = obs({ source: "trustradius", url: "https://www.trustradius.com/products/x/reviews" });
    const b = obs({ source: "capterra" });
    const dup = obs({ source: "other", sourceName: "Mirror", url: "https://www.trustradius.com/products/x/reviews/?page=2" });
    const r = computeConsensus([a, b, dup], AS_OF);
    expect(r.contributions.find((c) => c.observationId === dup.id)?.reason).toMatch(/twice/);
  });

  it("drops wrong-product matches, other products, prohibited sources and editor exclusions", () => {
    const bad = [
      obs({ source: "g2", match: "mismatch", rating: 1 }),
      obs({ source: "software-advice", scope: "different-product", rating: 1 }),
      obs({ source: "apple-app-store", permission: "prohibited", rating: 1 }),
      obs({ source: "google-play", excluded: true, rating: 1 }),
    ];
    const withBad = computeConsensus([...strong(), ...bad], AS_OF);
    const without = computeConsensus(strong(), AS_OF);
    expect(withBad.score).toBe(without.score);
    expect(withBad.contributions.filter((c) => c.status === "excluded")).toHaveLength(4);
  });

  it("weighs a probable match and a companion app less than an exact full-product listing", () => {
    const r = computeConsensus(
      [obs({ source: "capterra", reviewCount: 400 }), obs({ source: "apple-app-store", scope: "companion-app", reviewCount: 400 }), obs({ source: "trustradius", match: "probable", reviewCount: 400 })],
      AS_OF
    );
    const share = (s: string) => r.contributions.find((c) => c.source === s)!.share;
    expect(share("capterra")).toBeGreaterThan(share("trustradius"));
    expect(share("trustradius")).toBeGreaterThan(share("apple-app-store"));
  });

  it("scores a small but legitimate second source at Limited confidence, with reduced weight", () => {
    const r = computeConsensus([obs({ source: "capterra", reviewCount: 1200 }), obs({ source: "trustradius", rating: 5, ratingScale: 5, reviewCount: 6 })], AS_OF);
    expect(r.status).toBe("scored");
    expect(r.confidence).toBe("Limited");
    expect(r.independentGroups).toBe(2);
    expect(r.rationale.join(" ")).toMatch(/fewer than 20 reviews; weighted down/);
    const small = r.contributions.find((c) => c.source === "trustradius")!;
    expect(small.share).toBeLessThan(0.01);
    // Six perfect reviews are pulled well below 100 before combining.
    expect(small.normalized!).toBeLessThan(80);
    // Below five reviews it no longer counts toward independence.
    const tooFew = computeConsensus([obs({ source: "capterra", reviewCount: 1200 }), obs({ source: "trustradius", reviewCount: 4 })], AS_OF);
    expect(tooFew.status).toBe("withheld");
    // Two thin sources without one solid source are still withheld.
    const allThin = computeConsensus([obs({ source: "capterra", reviewCount: 15 }), obs({ source: "trustradius", reviewCount: 15 })], AS_OF);
    expect(allThin.status).toBe("withheld");
    const ok = computeConsensus([obs({ source: "capterra", reviewCount: 1200 }), obs({ source: "trustradius", reviewCount: 20 })], AS_OF);
    expect(ok.confidence).toBe("Moderate");
  });

  it("does not count a companion app's store rating as independent confirmation", () => {
    const r = computeConsensus([obs({ source: "capterra", reviewCount: 1200 }), obs({ source: "apple-app-store", scope: "companion-app", reviewCount: 5000 })], AS_OF);
    expect(r.status).toBe("withheld");
    expect(r.contributions.find((c) => c.source === "apple-app-store")!.share).toBeGreaterThan(0);
  });

  it("withholds when only app stores rate the product", () => {
    const r = computeConsensus([obs({ source: "apple-app-store", scope: "companion-app", reviewCount: 5000 }), obs({ source: "google-play", scope: "companion-app", reviewCount: 5000 })], AS_OF);
    expect(r.status).toBe("withheld");
    expect(r.rationale.join(" ")).toMatch(/full product/);
  });

  it("drops stale and future-dated observations and lowers confidence for ageing evidence", () => {
    const stale = computeConsensus([obs({ source: "capterra", observedAt: "2023-01-01" }), obs({ source: "trustradius", observedAt: "2023-01-01" })], AS_OF);
    expect(stale.status).toBe("withheld");
    const future = computeConsensus([obs({ source: "capterra", observedAt: "2027-01-01" }), obs({ source: "trustradius" })], AS_OF);
    expect(future.contributions.find((c) => c.source === "capterra")?.reason).toMatch(/future/);
    const ageing = computeConsensus(strong().map((o) => ({ ...o, observedAt: "2025-08-01" })), AS_OF);
    expect(ageing.confidence).toBe("Moderate");
  });

  it("caps confidence at Limited when sources disagree", () => {
    const r = computeConsensus(
      [obs({ source: "capterra", rating: 4.8, reviewCount: 1000 }), obs({ source: "other", sourceName: "Trustpilot", url: "https://www.trustpilot.com/review/x", rating: 2.5, reviewCount: 1000 }), obs({ source: "trustradius", rating: 4.7, reviewCount: 1000 })],
      AS_OF
    );
    expect(r.confidence).toBe("Limited");
    expect(r.rationale.join(" ")).toMatch(/disagree/);
  });

  it("handles no evidence", () => {
    const r = computeConsensus([], AS_OF);
    expect(r.status).toBe("withheld");
    expect(r.score).toBeNull();
    expect(r.sourceNames).toEqual([]);
  });

  it("caps any one listing's volume so a giant source cannot drown the rest", () => {
    const r = computeConsensus([obs({ source: "capterra", rating: 5, reviewCount: 1_000_000 }), obs({ source: "trustradius", rating: 3, reviewCount: 2000 })], AS_OF);
    const shares = r.contributions.filter((c) => c.status === "used").map((c) => c.share);
    expect(Math.max(...shares)).toBeLessThanOrEqual(0.5);
  });
});

describe("schema guards", () => {
  it("rejects ratings above the scale, http URLs and unnamed other sources", () => {
    expect(() => obs({ rating: 6 })).toThrow();
    expect(() => obs({ url: "http://example.com/x" })).toThrow();
    expect(() => obs({ source: "other" })).toThrow();
  });
});

describe("independence from commercial data", () => {
  it("the engine reads observations only and never imports commercial or affiliate data", () => {
    const code = fs
      .readFileSync(path.join(__dirname, "../engine.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(code).not.toMatch(/commercial|affiliate|sponsor|tools-v4|ClinicianTool|import\s.*from\s+"@\//i);
    expect(computeConsensus.length).toBe(2);
  });
});

describe("approval fingerprint", () => {
  it("changes when evidence or summaries change", () => {
    const o = strong();
    const ed = { strengths: ["Reviewers often praise the scheduling tools."], concerns: [] };
    const h = contentHash({ observations: o, editorial: ed });
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(contentHash({ observations: o, editorial: { ...ed, concerns: ["Some reviewers report slow support replies."] } })).not.toBe(h);
    expect(contentHash({ observations: [{ ...o[0], rating: 4.1 }, ...o.slice(1)], editorial: ed })).not.toBe(h);
  });
});

describe("public projection", () => {
  const approval = { hash: "a".repeat(64), approvedAt: "2026-11-20T00:00:00Z", author: "admin", algorithm: "consensus-v1", result: { score: 84, confidence: "High", sourceNames: ["Capterra", "G2"], asOf: "2026-11-20" } };
  const editorial = { strengths: ["Reviewers often praise the scheduling tools."], concerns: ["Some reviewers report slow support replies."] };

  it("exposes only the approved score, confidence, date, summaries and source names", () => {
    const p = toPublicConsensus("simplepractice", { observations: strong(), editorial, approval })!;
    expect(Object.keys(p).sort()).toEqual(["concerns", "confidence", "explanation", "score", "slug", "strengths", "updatedAt"]);
    const text = JSON.stringify(p);
    expect(text).not.toMatch(/Capterra|"G2"|sourceNames/);
    expect(text).not.toMatch(/example\.com|reviewCount|effectiveReviews|normalized|"share"|"rating"|themes|observ/i);
    expect(p.explanation).toMatch(/^HeyPsych Consensus Score is an independently developed, evidence-informed assessment/);
    expect(p.explanation).toMatch(/Vendor payments do not influence scores\.$/);
  });

  it("shows nothing for unapproved, non-pilot or summary-less records", () => {
    expect(toPublicConsensus("simplepractice", { observations: strong(), editorial })).toBeNull();
    expect(toPublicConsensus("theranest", { observations: strong(), editorial, approval })).toBeNull();
    expect(toPublicConsensus("simplepractice", { editorial: { strengths: [], concerns: [] }, approval })).toBeNull();
    expect(toPublicConsensus("simplepractice", null)).toBeNull();
  });
});

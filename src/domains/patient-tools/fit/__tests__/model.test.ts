import { describe, expect, it } from "vitest";
import { approachesFor, approachesOf, costTier, inApproach, mainApproach, rolePicks } from "../model";
import type { FinderApp } from "../../finder/model";

const app = (slug: string, patch: Partial<FinderApp> = {}): FinderApp => ({
  slug,
  name: slug,
  href: `/tools/${slug}`,
  summary: null,
  goodFor: null,
  cost: "",
  needs: [],
  help: ["self-guided"],
  pay: [],
  evidence: null,
  privacy: null,
  platforms: null,
  open: true,
  limited: null,
  notFirstStop: false,
  approaches: [],
  costTier: null,
  storeRating: null,
  rank: 0,
  ...patch,
});

const rec = (name: string, one_liner: string, extra: Partial<{ tool_types: string[]; ai_attributes: string[]; best_for: string[]; uses: string[] }> = {}) => ({
  name,
  one_liner,
  tool_types: (extra.tool_types ?? ["app"]) as never,
  ai_attributes: (extra.ai_attributes ?? []) as never,
  best_for: extra.best_for ?? [],
  clinical_metadata: { evidence_based: true, evidence_level: "moderate", primary_uses: extra.uses ?? [] } as never,
});

describe("approaches", () => {
  it("leads with what the record says most", () => {
    expect(approachesOf(rec("Sleepio", "A digital CBT program for insomnia with weekly lessons", { uses: ["sleep diary tracking"] }))[0]).toBe("program");
    expect(approachesOf(rec("Daylio", "Mood tracker and journal", { tool_types: ["mood-tracker", "journal"] }))[0]).toBe("track");
  });

  it("lets the record's AI-chat type win over its wording", () => {
    expect(approachesOf(rec("Wysa", "CBT and DBT skills in a CBT-based program", { ai_attributes: ["chatbot"] }))[0]).toBe("chat");
  });

  it("puts every app in exactly one tile on a step", () => {
    const apps = [
      app("a", { approaches: ["program", "calm"] }),
      app("b", { approaches: ["program"] }),
      app("c", { approaches: ["calm", "program"] }),
      app("d", { approaches: ["calm"] }),
      app("e", { approaches: ["specialist", "track"] }),
    ];
    expect(mainApproach(apps[4], "self-guided")).toBe("track");
    const tiles = approachesFor(apps, "self-guided").map((t) => [t.approach.id, t.count]);
    expect(tiles).toEqual([
      ["program", 2],
      ["calm", 2],
    ]);
    expect(apps.filter((a) => inApproach(a, "self-guided", "program")).map((a) => a.slug)).toEqual(["a", "b"]);
  });
});

describe("roles", () => {
  const apps = [
    app("studied", { evidence: "Strong research support", pay: ["self-pay"] }),
    app("free", { evidence: "Some research support", pay: ["free"], cost: "Free" }),
    app("private", { evidence: "Early research", privacy: "A+" }),
    app("popular", { storeRating: { store: "App Store", rating: 4.7, count: 2_000_000 } }),
  ];

  it("gives each role to a different app, with the fact that earned it", () => {
    const picks = rolePicks(apps);
    expect(picks.map((p) => [p.label, p.app.slug, p.because])).toEqual([
      ["Best-studied", "studied", "Strong research support"],
      ["Best free", "free", "Free · Some research support"],
      ["Most private", "private", "Privacy grade A+"],
      ["Most used", "popular", "2.0M ratings on the App Store"],
    ]);
  });

  it("swaps 'best free' for insurance when care comes from people", () => {
    const people = [
      app("t", { help: ["therapist"], pay: ["self-pay"], evidence: "Strong research support" }),
      app("i", { help: ["therapist"], pay: ["insurance"], evidence: "Some research support" }),
      app("u", { help: ["therapist"], pay: ["free"] }),
    ];
    const labels = rolePicks(people, { people: true }).map((p) => p.label);
    expect(labels.slice(0, 2)).toEqual(["Best-studied", "Uses insurance"]);
    expect(labels).not.toContain("Best free");
  });

  it("still offers starting points when no fact separates them", () => {
    const plain = [app("x"), app("y"), app("z")];
    expect(rolePicks(plain).map((p) => p.label)).toEqual(["A good place to start", "A good place to start", "A good place to start"]);
  });
});

describe("price level", () => {
  it("maps a price to one comparable level", () => {
    expect(costTier({ model: "subscription", free_tier: false }, 12.99)).toBe("$");
    expect(costTier({ model: "subscription", free_tier: false }, 260)).toBe("$$$");
    expect(costTier({ model: "freemium", free_tier: true }, 12.99)).toBe("free-start");
    expect(costTier({ model: "insurance-covered", free_tier: false }, null)).toBe("insurance");
    expect(costTier({ model: "subscription", free_tier: false }, null)).toBeNull();
  });
});

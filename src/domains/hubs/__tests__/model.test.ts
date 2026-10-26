import { describe, expect, it } from "vitest";
import { buildGroups, conditionOneLiner, filterItems, searchItems, topFacets, type HubItem } from "../model";

const item = (title: string, extra: Partial<HubItem> = {}): HubItem => ({
  href: `/x/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  title,
  subtitle: null,
  groups: [],
  facets: [],
  keywords: [],
  ...extra,
});

describe("conditionOneLiner", () => {
  it("prefers shortDefinition, then aeo.what_is, then the description", () => {
    expect(conditionOneLiner({ shortDefinition: "A clear one-line definition. More.", aeo: { what_is: "Another definition here." } })).toBe("A clear one-line definition.");
    expect(conditionOneLiner({ aeo: { what_is: "Panic disorder involves sudden surges of fear. More." } })).toBe(
      "Panic disorder involves sudden surges of fear."
    );
    expect(conditionOneLiner({ description: { overview: "An overview sentence here. Then more." } })).toBe(
      "An overview sentence here."
    );
  });

  it("strips inline link markup and returns null when there is nothing", () => {
    expect(conditionOneLiner({ shortDefinition: "Treated with {link:treatment:cbt:CBT} and medication." })).toBe(
      "Treated with CBT and medication."
    );
    expect(conditionOneLiner(null)).toBeNull();
    expect(conditionOneLiner({})).toBeNull();
  });
});

describe("searchItems", () => {
  const items = [
    item("Sertraline (Zoloft)", { keywords: ["Zoloft"] }),
    item("Panic Disorder", { subtitle: "Sudden surges of fear" }),
    item("Fear of flying", { subtitle: "A specific phobia" }),
  ];

  it("matches word starts across title, keywords and subtitle, title first", () => {
    expect(searchItems(items, "zol").map((i) => i.title)).toEqual(["Sertraline (Zoloft)"]);
    expect(searchItems(items, "fear").map((i) => i.title)).toEqual(["Fear of flying", "Panic Disorder"]);
  });

  it("requires every word and ignores substrings inside words", () => {
    expect(searchItems(items, "panic fear").map((i) => i.title)).toEqual(["Panic Disorder"]);
    expect(searchItems(items, "ear")).toEqual([]);
  });

  it("returns everything for an empty query", () => {
    expect(searchItems(items, "  ")).toHaveLength(3);
  });
});

describe("filterItems / buildGroups / topFacets", () => {
  const items = [
    item("A", { groups: ["med"], facets: ["mdd", "gad"] }),
    item("B", { groups: ["med"], facets: ["mdd"] }),
    item("C", { groups: ["therapy"], facets: ["mdd"] }),
  ];

  it("filters by group and facet together", () => {
    expect(filterItems(items, { group: "med", facet: "gad" }).map((i) => i.title)).toEqual(["A"]);
  });

  it("builds groups with counts and top items, dropping empty ones", () => {
    const groups = buildGroups(items, [
      { id: "med", label: "Medications" },
      { id: "empty", label: "Nothing" },
      { id: "therapy", label: "Therapies" },
    ], 1);
    expect(groups.map((g) => [g.id, g.count, g.top.length])).toEqual([
      ["med", 2, 1],
      ["therapy", 1, 1],
    ]);
  });

  it("ranks facets by how many items use them", () => {
    const labels = new Map([["mdd", "Depression"], ["gad", "Anxiety"]]);
    expect(topFacets(items, labels).map((f) => [f.id, f.count])).toEqual([
      ["mdd", 3],
      ["gad", 1],
    ]);
  });
});

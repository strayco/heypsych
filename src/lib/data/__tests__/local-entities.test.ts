import { describe, it, expect } from "vitest";
import { getAllLocalRows, getLocalRowBySlug, getLocalRowsByType } from "../local-entities";
import { getConditionsLocal, getEntityBySlugLocal, getResourcesByCategoryLocal } from "../local-queries";
import entityDates from "../entity-dates.json";

describe("content served from data/ files", () => {
  it("loads every condition file", () => {
    const conditions = getLocalRowsByType("condition");
    expect(conditions.length).toBe(130);
    expect(new Set(conditions.map((c) => c.slug)).size).toBe(conditions.length);
  });

  it("only serves active records", () => {
    expect(getAllLocalRows().every((r) => r.status === "active")).toBe(true);
    // archived in data/resources/tools
    expect(getLocalRowBySlug("woebot-health")).toBeNull();
  });

  it("keeps the database's Published / Last updated dates", () => {
    const row = getLocalRowBySlug("agoraphobia")!;
    expect(row.type).toBe("condition");
    expect(row.created_at).toBe((entityDates as any).condition.agoraphobia[0]);
    expect(row.updated_at).toBe((entityDates as any).condition.agoraphobia[1]);
  });

  it("every dated condition and resource still has a file", () => {
    const dates = entityDates as any;
    for (const type of ["condition", "resource"]) {
      for (const slug of Object.keys(dates[type])) {
        expect(getLocalRowBySlug(slug)?.slug, `${type} ${slug}`).toBe(slug);
      }
    }
  });

  it("maps rows the way the database rows were mapped", () => {
    const entity = getEntityBySlugLocal("generalized-anxiety-disorder")!;
    expect(entity.slug).toBe("generalized-anxiety-disorder");
    expect(entity.type).toBe("condition");
    expect(entity.data).toBeTruthy();

    const hub = getConditionsLocal();
    expect(hub.length).toBe(130);
    expect(hub.find((c) => c.slug === "agoraphobia")?.name).toBe("Agoraphobia");
  });

  it("serves the comparison page as a resource", () => {
    expect(getLocalRowBySlug("lexapro-vs-zoloft")?.type).toBe("resource");
  });

  it("lists assessments in order", () => {
    const slugs = getResourcesByCategoryLocal("assessments-screeners").map((r) => r.slug);
    expect(slugs).toEqual(expect.arrayContaining(["gad-7", "phq-9", "asrs-v1-1", "assist-v3"]));
  });
});

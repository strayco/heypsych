import { describe, expect, it } from "vitest";
import { buildTreatmentExperience, firstSentence, per100 } from "../model";
import { loadTreatment } from "@/lib/comparison/treatment-loader";

describe("per100", () => {
  it("reads the record's own incidence wording", () => {
    expect(per100("26%")).toBe(26);
    expect(per100("11% (adults)")).toBe(11);
    expect(per100("~10-20%")).toBe(15);
    expect(per100("0.4%")).toBe(1);
    expect(per100("Common (rates vary; may be underreported)")).toBeNull();
    expect(per100(undefined)).toBeNull();
  });
});

describe("firstSentence", () => {
  it("returns one sentence, trimmed to length", () => {
    expect(firstSentence("It works. Slowly.")).toBe("It works.");
    expect(firstSentence("a".repeat(300), 20)).toHaveLength(20);
  });
});

describe("every treatment record", () => {
  it("builds without throwing, so the design can apply to all of them", async () => {
    const { getAllTreatmentSlugs } = await import("@/lib/comparison/treatment-loader");
    const counts = { total: 0, uses: 0, sideEffects: 0, rated: 0, situations: 0, warnings: 0 };
    for (const slug of getAllTreatmentSlugs()) {
      const t = await loadTreatment(slug);
      if (!t) continue;
      const x = buildTreatmentExperience(t);
      counts.total += 1;
      if (x.uses.length) counts.uses += 1;
      if (x.sideEffects.length) counts.sideEffects += 1;
      if (x.sideEffects.some((s) => s.per100 !== null)) counts.rated += 1;
      if (x.situations.length) counts.situations += 1;
      if (x.warnings.length || x.boxedWarning) counts.warnings += 1;
      expect(x.name, slug).toBeTruthy();
    }
    console.log("treatment experience coverage", counts);
    expect(counts.total).toBeGreaterThan(500);
  }, 60_000);
});

describe("buildTreatmentExperience (sertraline)", async () => {
  const treatment = await loadTreatment("sertraline-zoloft");
  const x = buildTreatmentExperience(treatment!);

  it("names the class the way people say it", () => {
    expect(x.kind).toBe("SSRI · Antidepressant");
    expect(x.object).toBe("medication");
  });

  it("lists approved uses before off-label ones, all linkable", () => {
    expect(x.uses[0].offLabel).toBe(false);
    expect(x.uses.some((u) => u.offLabel)).toBe(true);
    expect(x.uses.every((u) => u.hasPage)).toBe(true);
  });

  it("sorts side effects by how common they are", () => {
    const rates = x.sideEffects.map((s) => s.per100).filter((n): n is number => n !== null);
    expect(rates).toEqual([...rates].sort((a, b) => b - a));
    expect(x.sideEffects[0]).toMatchObject({ effect: "Nausea", per100: 26 });
  });

  it("leads with the boxed warning and splits risk headlines from detail", () => {
    expect(x.glance.find((g) => g.id === "know")?.tone).toBe("caution");
    const serotonin = x.warnings.find((w) => w.headline === "Serotonin syndrome");
    expect(serotonin?.detail).toMatch(/^Agitation/);
  });

  it("turns 'What People Feel' into a week-by-week journey plus topics", () => {
    expect(x.feel?.stages.map((s) => s.when)).toEqual(["Week 1", "Weeks 2–4", "Weeks 4–8"]);
    expect(x.feel?.stages[0]).toMatchObject({ title: "Side effects before benefits" });
    expect(x.feel?.stages[0].note).toMatch(/Early GI symptoms/);
    expect(x.feel?.topics.map((t) => t.title)).toEqual(
      expect.arrayContaining(["Sexual side effects (real talk)"])
    );
  });

  it("offers each special population that the record covers", () => {
    expect(x.situations.map((s) => s.id)).toEqual(expect.arrayContaining(["pregnancy", "lactation", "interactions"]));
  });
});

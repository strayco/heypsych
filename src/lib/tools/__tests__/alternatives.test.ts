import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { ClinicianToolV4Z, type ClinicianToolV4 } from "@/lib/schemas/clinician-tool-v4";
import {
  getSpecializedRecommendations,
  isSensibleAlternative,
  rankAlternatives,
} from "../alternatives";

// The real catalogue, so these tests fail if a record's positioning drifts.
const ROOT = path.join(process.cwd(), "data/tools-v4/products");
const catalog: ClinicianToolV4[] = fs
  .readdirSync(ROOT)
  .flatMap((dir) => fs.readdirSync(path.join(ROOT, dir)).map((f) => path.join(ROOT, dir, f)))
  .map((file) => ClinicianToolV4Z.parse(JSON.parse(fs.readFileSync(file, "utf8"))));

const bySlug = (slug: string) => {
  const tool = catalog.find((t) => t.slug === slug);
  if (!tool) throw new Error(`missing ${slug}`);
  return tool;
};
const sameCategory = (tool: ClinicianToolV4) =>
  catalog.filter((t) => t.primary_category === tool.primary_category);

describe("every catalogue record", () => {
  it("has positioning with a note for each segment", () => {
    for (const tool of catalog) {
      const segments = tool.positioning?.segments ?? [];
      expect(segments.length, tool.slug).toBeGreaterThan(0);
      for (const segment of segments) {
        expect(tool.positioning?.notes?.[segment], `${tool.slug}:${segment}`).toBeTruthy();
      }
    }
  });
});

describe("alternatives to IntakeQ (the reported case)", () => {
  const intakeq = bySlug("intakeq-practiceq");
  const alternatives = rankAlternatives(intakeq, sameCategory(intakeq));
  const recs = getSpecializedRecommendations(intakeq, alternatives);

  it("never suggests Osmind to a talk-therapy practice", () => {
    expect(isSensibleAlternative(bySlug("osmind"), intakeq)).toBe(false);
    expect(recs.map((r) => r.tool.slug)).not.toContain("osmind");
    expect(alternatives.slice(0, 3).map((t) => t.slug)).not.toContain("osmind");
  });

  it("uses a different tool for every slot", () => {
    const slugs = recs.map((r) => r.tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(recs.length).toBeGreaterThanOrEqual(3);
  });

  it("gives each pick its own positioning note as the reason", () => {
    for (const rec of recs) {
      expect(rec.reason).toBe(rec.tool.positioning?.notes?.[rec.segment]);
    }
  });

  it("routes prescribers to a psychiatry-capable EHR", () => {
    const prescriber = recs.find((r) => r.segment === "prescriber");
    if (prescriber) {
      expect(["icanotes", "luminello", "valant-ehr-suite", "therapyappointment"]).toContain(
        prescriber.tool.slug
      );
    }
  });

  it("only calls something 'budget' if it starts cheaper", () => {
    const budget = recs.find((r) => r.segment === "budget");
    if (budget) {
      expect(budget.tool.pricing?.starting_price_cents ?? Infinity).toBeLessThan(
        intakeq.pricing?.starting_price_cents ?? 0
      );
    }
  });
});

describe("niche tools", () => {
  it("still appear for practices in the same niche", () => {
    const osmind = bySlug("osmind");
    const fakeKetamineClinic = {
      ...bySlug("luminello"),
      slug: "ketamine-clinic-ehr",
      positioning: { segments: ["interventional-psychiatry" as const], notes: {}, niche: true },
    };
    expect(isSensibleAlternative(osmind, fakeKetamineClinic)).toBe(true);
  });
});

describe("billing tools that do different jobs", () => {
  it("offers only other claims options to someone leaving Office Ally", () => {
    const officeAlly = bySlug("office-ally");
    const alternatives = rankAlternatives(officeAlly, sameCategory(officeAlly)).filter((t) =>
      isSensibleAlternative(t, officeAlly)
    );
    const slugs = alternatives.map((t) => t.slug);
    expect(slugs).toEqual(expect.arrayContaining(["claim-md", "availity-essentials", "therathink"]));
    for (const unrelated of ["ivypay", "heard", "mentaya", "thrizer"]) {
      expect(slugs).not.toContain(unrelated);
    }
    const recs = getSpecializedRecommendations(officeAlly, alternatives);
    expect(recs.every((r) => r.tool.positioning?.job === "claims")).toBe(true);
  });
});

describe("other categories", () => {
  it("recommends distinct, positioned tools for AI scribes", () => {
    const mentalyc = bySlug("mentalyc");
    const recs = getSpecializedRecommendations(mentalyc, rankAlternatives(mentalyc, sameCategory(mentalyc)));
    expect(recs.length).toBeGreaterThan(0);
    expect(new Set(recs.map((r) => r.tool.slug)).size).toBe(recs.length);
    expect(recs.find((r) => r.segment === "prescriber")?.tool.slug).toBe("berries");
  });
});

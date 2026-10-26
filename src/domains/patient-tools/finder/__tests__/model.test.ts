import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import {
  NEEDS,
  filterApps,
  isClinicianFacing,
  isCrisisTool,
  isListable,
  optionCounts,
  payOf,
  toFinderApp,
} from "../model";
import { compareRows } from "../../compare/model";

const DIR = join(process.cwd(), "data/resources/tools");
const tools: DigitalToolV3[] = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(DIR, f), "utf-8")) as DigitalToolV3)
  .filter(isListable);
const apps = tools.filter((t) => !isCrisisTool(t) && !isClinicianFacing(t)).map((t) => toFinderApp(t));

describe("patient app finder (real catalog)", () => {
  it("never offers crisis lines or clinician-facing tools as apps", () => {
    const slugs = new Set(apps.map((a) => a.slug));
    for (const s of ["988-suicide-lifeline", "crisis-text-line", "blueprint", "greenspace-health", "wysa-copilot"]) {
      expect(slugs.has(s)).toBe(false);
    }
    for (const s of ["headspace", "talkspace", "mindshift-cbt"]) expect(slugs.has(s)).toBe(true);
  });

  it("gives every app at least one kind of help and one way to pay", () => {
    for (const a of apps) {
      expect(a.help.length).toBeGreaterThan(0);
      expect(a.pay.length).toBeGreaterThan(0);
    }
  });

  it("filters only on facts in the record", () => {
    const res = filterApps(apps, { need: "anxiety-stress", help: "self-guided", pay: "free" });
    expect(res.length).toBeGreaterThan(0);
    for (const a of res) {
      expect(a.needs).toContain("anxiety-stress");
      expect(a.help).toContain("self-guided");
      expect(a.pay).toContain("free");
    }
  });

  it("orders apps anyone can sign up for ahead of employer-only ones", () => {
    const res = filterApps(apps, { need: "find-support", help: null, pay: null });
    const firstClosed = res.findIndex((a) => !a.open);
    const lastOpen = res.map((a) => a.open).lastIndexOf(true);
    if (firstClosed !== -1) expect(lastOpen).toBeLessThan(firstClosed);
  });

  it("counts match what each option would show", () => {
    const counts = optionCounts(apps, { need: "sleep", help: null, pay: null });
    for (const n of NEEDS) {
      expect(counts.need[n.id]).toBe(filterApps(apps, { need: n.id, help: null, pay: null }).length);
    }
  });

  it("maps enterprise pricing to work or school, not self-pay", () => {
    expect(payOf({ model: "enterprise", free_tier: false } as DigitalToolV3["pricing"])).toEqual(["employer"]);
  });

  it("compares two apps without picking a winner", () => {
    const a = tools.find((t) => t.slug === "calm")!;
    const b = tools.find((t) => t.slug === "headspace")!;
    const rows = compareRows(a, b);
    expect(rows.length).toBeGreaterThan(5);
    // No verdict rows or verdict labels; record text like "sleep better" is fine.
    expect(rows.some((r) => /winner|verdict|better|best/i.test(r.label))).toBe(false);
    expect(rows.some((r) => /\bwinner\b/i.test(`${r.a} ${r.b}`))).toBe(false);
  });

  it("never offers discontinued apps or merged duplicates", () => {
    const slugs = new Set(apps.map((a) => a.slug));
    for (const s of ["woebot", "sanvello", "ginger", "cerebral-care", "done"]) expect(slugs.has(s)).toBe(false);
    for (const s of ["wysa", "finch", "how-we-feel"]) expect(slugs.has(s)).toBe(true);
  });

  it("only shows a rating the store published, with the store named", () => {
    for (const a of apps) {
      if (!a.storeRating) continue;
      expect(["App Store", "Google Play"]).toContain(a.storeRating.store);
      expect(a.storeRating.rating).toBeLessThan(5.01);
    }
  });
});

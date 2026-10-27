import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PRACTICE_GRADE_SLUGS,
  isPracticeGrade,
} from "../practice-grade-catalog";
import { ClinicianToolService, isToolPublishable } from "../clinician-tool-service";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (entry.endsWith(".json")) out.push(path);
  }
  return out;
}

describe("practice-grade catalog", () => {
  const slugsOnDisk = new Set(
    walk("data/tools-v4/products").map(
      (file) => JSON.parse(readFileSync(file, "utf8")).slug as string
    )
  );

  it("is the actual shopping set, not a directory", () => {
    expect(PRACTICE_GRADE_SLUGS.size).toBeGreaterThanOrEqual(20);
    // 37 after the 2026-10-23 expansion (claims, AI notes, measurement,
    // networks); 55 after the 2026-10-26 restore of pages that carried search
    // traffic (malpractice, agency EHRs, CE). The cap guards against drifting
    // back into a full directory.
    expect(PRACTICE_GRADE_SLUGS.size).toBeLessThanOrEqual(60);
    expect(slugsOnDisk.size).toBe(PRACTICE_GRADE_SLUGS.size);
  });

  it("only names products that exist on disk", () => {
    const missing = [...PRACTICE_GRADE_SLUGS].filter((slug) => !slugsOnDisk.has(slug));
    expect(missing).toEqual([]);
  });

  it("includes independent-practice staples and excludes hospital EHRs", () => {
    expect(isPracticeGrade("simplepractice")).toBe(true);
    expect(isPracticeGrade("therapynotes")).toBe(true);
    expect(isPracticeGrade("doxy-me")).toBe(true);
    expect(isPracticeGrade("cerner-millennium")).toBe(false);
    expect(isPracticeGrade("epic-cosmos")).toBe(false);
    expect(isPracticeGrade("netsmart-myavatar")).toBe(false);
    expect(isPracticeGrade("qualifacts-insync")).toBe(false);
  });

  it("keeps every retired slug off disk, and every redirect target live", () => {
    const retired = JSON.parse(readFileSync("data/tools-v4/retired-products.json", "utf8")) as string[];
    expect(retired.filter((slug) => slugsOnDisk.has(slug))).toEqual([]);
    const map = JSON.parse(readFileSync("data/tools-v4/retired-redirects.json", "utf8")) as {
      clinician: Record<string, string>;
      patient: Record<string, string>;
    };
    for (const [slug, target] of Object.entries(map.clinician)) {
      expect(retired).toContain(slug);
      expect(isPracticeGrade(target)).toBe(true);
    }
    for (const [slug, target] of Object.entries(map.patient)) {
      expect(retired).toContain(slug);
      expect(statSync(`data/resources/tools/${target}.json`).isFile()).toBe(true);
    }
  });

  it("is the only set Architect and the directory can publish", async () => {
    ClinicianToolService.clearCache();
    const published = await ClinicianToolService.loadClinicianTools();
    expect(published.length).toBeGreaterThan(0);
    expect(published.length).toBeLessThanOrEqual(PRACTICE_GRADE_SLUGS.size);

    for (const tool of published) {
      expect(isPracticeGrade(tool.slug)).toBe(true);
      expect(isToolPublishable(tool)).toBe(true);
    }

    expect(published.some((t) => t.slug === "simplepractice")).toBe(true);
    expect(published.some((t) => t.slug === "cerner-millennium")).toBe(false);
  });
});

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
    // networks). The cap guards against drifting back into a full directory.
    expect(PRACTICE_GRADE_SLUGS.size).toBeLessThanOrEqual(45);
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

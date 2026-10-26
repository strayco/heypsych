import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import type { ClinicianToolV4 } from "@/lib/schemas/clinician-tool-v4";
import {
  CLINICIAN_JOBS,
  buildClinicianHub,
  formatReviewDate,
  sameJobComparisons,
  suitedFor,
  toHubProduct,
} from "../model";

const ROOT = process.cwd();
const PRODUCTS = join(ROOT, "data/tools-v4/products");
const tools: ClinicianToolV4[] = readdirSync(PRODUCTS).flatMap((dir) =>
  readdirSync(join(PRODUCTS, dir))
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(PRODUCTS, dir, f), "utf-8")) as ClinicianToolV4)
);
const comparisons = readdirSync(join(ROOT, "data/tools-v4/comparisons"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(ROOT, "data/tools-v4/comparisons", f), "utf-8")) as { slug: string; tools: string[] });

describe("clinician hub model (real catalog)", () => {
  const hub = buildClinicianHub(tools);

  it("files every product under exactly one job", () => {
    const listed = hub.jobs.flatMap((j) => j.products.map((p) => p.slug));
    expect(new Set(listed).size).toBe(listed.length);
    expect(listed.length).toBe(tools.length);
  });

  it("only shows jobs that have products, in the defined order", () => {
    const order = CLINICIAN_JOBS.map((j) => j.slug);
    const shown = hub.jobs.map((j) => j.slug);
    expect(shown).toEqual(order.filter((s) => shown.includes(s)));
    expect(hub.jobs.every((j) => j.products.length > 0)).toBe(true);
  });

  it("links each product to its profile under the job's URL", () => {
    for (const job of hub.jobs) {
      for (const p of job.products) expect(p.href).toBe(`/tools/for-clinicians/${job.slug}/${p.slug}`);
    }
  });

  it("only suggests a product for a practice its reviewers positioned it for, with their note", () => {
    for (const job of hub.jobs) {
      for (const option of job.practices) {
        const picks = suitedFor(job, option.id);
        expect(picks.length).toBe(option.count);
        for (const p of picks) {
          const fit = p.fit.find((f) => f.id === option.id);
          expect(fit?.note.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("never offers the interventional-psychiatry EHR to a general solo therapist", () => {
    const ehr = hub.jobs.find((j) => j.slug === "ehr-practice-management")!;
    expect(suitedFor(ehr, "solo-therapist").map((p) => p.slug)).not.toContain("osmind");
    // Niche products read last.
    expect(ehr.products.at(-1)?.slug).toBe("osmind");
  });

  it("splits billing by what each product actually does", () => {
    const billing = hub.jobs.find((j) => j.slug === "billing-rcm")!;
    const subgroups = new Set(billing.subgroups!.map((s) => s.id));
    for (const p of billing.products) expect(subgroups.has(p.subgroup ?? "")).toBe(true);
  });

  it("offers head-to-heads only between products doing the same job, once per pair", () => {
    const list = sameJobComparisons(comparisons, tools);
    const pairs = list.map((c) => c.slug);
    expect(new Set(pairs).size).toBe(pairs.length);
    const bySlug = new Map(tools.map((t) => [t.slug, t]));
    for (const c of list) {
      const members = comparisons.find((x) => x.slug === c.slug)!.tools.map((s) => bySlug.get(s)!);
      expect(new Set(members.map((m) => m.positioning?.job ?? null)).size).toBe(1);
    }
    expect(pairs).not.toContain("heard-vs-thrizer");
    const keys = list.map((c) => comparisons.find((x) => x.slug === c.slug)!.tools.slice().sort().join("|"));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("reports BAA only as the record states it", () => {
    for (const t of tools) {
      const p = toHubProduct(t);
      const raw = t.compliance?.baa_available;
      if (raw === "yes" || raw === "no") expect(p.baa).toBe(raw);
      else expect(["unknown", "na"]).toContain(p.baa);
    }
  });

  it("takes the review date from the records", () => {
    const newest = tools.map((t) => t.governance?.last_reviewed).filter(Boolean).sort().at(-1);
    expect(hub.lastReviewed).toBe(newest);
    expect(formatReviewDate("2026-08-22")).toBe("August 22, 2026");
    expect(formatReviewDate(null)).toBeNull();
  });
});

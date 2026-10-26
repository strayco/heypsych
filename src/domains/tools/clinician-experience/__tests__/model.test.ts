import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { ClinicianToolV4Z, type ClinicianToolV4 } from "@/lib/schemas/clinician-tool-v4";
import { EPCS_UNVERIFIED_HEADLINE } from "@/domains/architect/engines/eligibility-engine";
import { buildClinicianToolExperience, formatCents } from "../model";

// The real catalogue, so a record that drifts breaks here, not on the page.
const ROOT = path.join(process.cwd(), "data/tools-v4/products");
const catalog: ClinicianToolV4[] = fs
  .readdirSync(ROOT)
  .flatMap((dir) => fs.readdirSync(path.join(ROOT, dir)).map((f) => path.join(ROOT, dir, f)))
  .filter((f) => f.endsWith(".json"))
  .map((file) => ClinicianToolV4Z.parse(JSON.parse(fs.readFileSync(file, "utf8"))));

const RAW_STATE: Record<string, string> = { yes: "yes", no: "no", unknown: "unknown", not_applicable: "na" };

describe("every clinician tool", () => {
  it("loads the catalogue", () => {
    expect(catalog.length).toBeGreaterThan(30);
  });

  for (const tool of catalog) {
    it(`${tool.slug} builds a page`, () => {
      const x = buildClinicianToolExperience(tool, "Category");
      expect(x.name).toBe(tool.name);
      expect(x.compliance.map((c) => c.id)).toEqual(["hipaa", "baa", "soc2", "hitrust"]);
      // Every fit segment shown has the reviewers' note behind it.
      for (const f of x.fit) expect(f.note, `${tool.slug}:${f.id}`).toBeTruthy();
      for (const g of x.glance) expect(g.value, `${tool.slug}:${g.id}`).toBeTruthy();
    });

    it(`${tool.slug} never upgrades a compliance claim`, () => {
      const x = buildClinicianToolExperience(tool);
      const c = tool.compliance;
      const raw = { hipaa: c?.hipaa_support, baa: c?.baa_available, soc2: c?.soc2, hitrust: c?.hitrust };
      for (const item of x.compliance) {
        const value = raw[item.id];
        const expected = typeof value === "string" ? RAW_STATE[value] ?? "unknown" : value === true ? "yes" : value === false ? "no" : "unknown";
        expect(item.state, `${tool.slug}:${item.id}`).toBe(expected);
        // A source is only shown when the record carries one.
        if (item.source) expect(item.source.url).toMatch(/^https?:\/\//);
      }
    });

    it(`${tool.slug} shows an estimate only from a stated price`, () => {
      const x = buildClinicianToolExperience(tool);
      x.pricing.options.forEach((o, i) => {
        const cents = tool.pricing?.tiers?.[i]?.price_cents;
        if (o.perProviderCents != null || o.flatCents != null) {
          expect(typeof cents === "number" && cents > 0, `${tool.slug}:${o.name}`).toBe(true);
          expect(o.perProviderCents ?? o.flatCents).toBe(cents);
        }
        if (o.perProviderCents != null) expect(tool.pricing?.model).toBe("per-provider-month");
      });
    });

    it(`${tool.slug} says EPCS requires verification when it claims EPCS`, () => {
      const x = buildClinicianToolExperience(tool);
      const claims = tool.capabilities.includes("epcs-controlled");
      expect(Boolean(x.epcs)).toBe(claims);
      if (claims) {
        expect(x.epcs?.headline).toBe(EPCS_UNVERIFIED_HEADLINE);
        expect(x.facts).toContain(EPCS_UNVERIFIED_HEADLINE);
      }
    });
  }

  it("covers at least one EPCS claim and one priced tier", () => {
    expect(catalog.some((t) => t.capabilities.includes("epcs-controlled"))).toBe(true);
    expect(catalog.some((t) => buildClinicianToolExperience(t).pricing.options.some((o) => o.perProviderCents != null))).toBe(true);
  });
});

describe("formatCents", () => {
  it("drops cents on whole dollars", () => {
    expect(formatCents(6900)).toBe("$69");
    expect(formatCents(123456)).toBe("$1,234.56");
  });
});

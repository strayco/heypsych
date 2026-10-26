/**
 * Patient tool records: schema for all, the research standard for researched
 * ones (docs/active/APP_RESEARCH_STANDARD.md).
 *
 * STRICT_SLUGS=a,b   check those slugs against the full standard
 * STRICT=all         check every record that carries privacy.basis
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DigitalToolV3Z, type DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { gradeFromBasis } from "@/domains/patient-tools/privacy";
import { parsePrice } from "@/domains/patient-tools/shelves/model";

const DIR = path.join(process.cwd(), "data/resources/tools");
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
const records = files
  .map((f) => ({ file: f, data: JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as DigitalToolV3 }))
  .filter((r) => r.data && typeof r.data === "object" && (r.data as { slug?: string }).slug);

const TEMPLATE =
  /is a (online|digital|telehealth)[^.]*(designed to support|platform for)|offers comprehensive mental health support|with easy-to-use features|Pricing information needs verification/i;

const strictSlugs = new Set((process.env.STRICT_SLUGS ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const strictAll = process.env.STRICT === "all";

describe("patient tool records", () => {
  it("all parse against the schema", () => {
    const bad = records
      .map((r) => ({ file: r.file, res: DigitalToolV3Z.safeParse(r.data) }))
      .filter((x) => !x.res.success)
      .map((x) => `${x.file}: ${x.res.error!.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    expect(bad).toEqual([]);
  });

  const strict = records.filter((r) => strictSlugs.has(r.data.slug) || (strictAll && r.data.privacy?.basis));
  if (strictSlugs.size) {
    it("every STRICT_SLUGS slug exists", () => {
      const have = new Set(records.map((r) => r.data.slug));
      expect([...strictSlugs].filter((s) => !have.has(s))).toEqual([]);
    });
  }

  for (const { file, data: t } of strict) {
    it(`${t.slug} meets the research standard`, () => {
      const problems: string[] = [];
      const text = `${t.one_liner} ${t.short_description} ${t.long_description} ${t.patient_summary ?? ""} ${t.pricing.notes ?? ""}`;
      if (TEMPLATE.test(text)) problems.push("template copy remains");
      if (!t.patient_summary || t.patient_summary.length < 60) problems.push("patient_summary missing or too short");
      if (t.one_liner.length > 170) problems.push("one_liner too long");
      if (t.best_for.length < 2 || t.not_for.length < 2) problems.push("best_for/not_for need 2+ each");
      if (!t.availability?.checked || !t.availability.sources?.length) problems.push("availability unchecked or unsourced");
      const discontinued = t.availability?.state === "discontinued";
      if (!discontinued) {
        const b = t.privacy.basis;
        if (!b) problems.push("privacy.basis missing");
        else if (t.privacy.grade !== gradeFromBasis(b)) problems.push(`privacy.grade ${t.privacy.grade} != rule ${gradeFromBasis(b)}`);
        if (!t.privacy.sources?.length) problems.push("privacy.sources missing");
        if (!t.pricing.checked || !t.pricing.sources?.length) problems.push("pricing unchecked or unsourced");
        const p = parsePrice(t.pricing.starting_price);
        const stated = p.perMonth || p.perYear || p.perWeek || p.perSession || /^free\b/i.test(t.pricing.starting_price ?? "") || /copay|insurance|employer|contact/i.test(t.pricing.starting_price ?? "");
        if (!stated) problems.push(`starting_price not comparable: "${t.pricing.starting_price ?? ""}"`);
        const lvl = t.clinical_metadata?.evidence_level;
        if (!lvl) problems.push("evidence_level missing");
        if ((lvl === "high" || lvl === "moderate" || lvl === "low") && !(t.clinical_metadata?.clinical_trials ?? []).some((c) => c.citation && (c.citation.doi || c.citation.url)))
          problems.push(`evidence ${lvl} without a cited study`);
        for (const r of t.store_ratings ?? []) {
          const host = new URL(r.url).hostname;
          if (r.store === "App Store" && host !== "apps.apple.com") problems.push("App Store rating url not apps.apple.com");
          if (r.store === "Google Play" && host !== "play.google.com") problems.push("Google Play rating url not play.google.com");
        }
      }
      expect(problems, file).toEqual([]);
    });
  }
});

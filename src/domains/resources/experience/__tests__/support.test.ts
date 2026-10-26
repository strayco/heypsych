import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { buildSupport, isDialable } from "../support";
import { buildAssessmentShell } from "../assessment";

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : d.name.endsWith(".json") ? [path.join(dir, d.name)] : []));
}

const root = path.join(process.cwd(), "data/resources");
const support = walk(path.join(root, "support-community")).map((f) => JSON.parse(fs.readFileSync(f, "utf8")));

describe("support records", () => {
  for (const rec of support) {
    it(`${rec.slug} builds`, () => {
      const x = buildSupport(rec);
      if (!x) return; // directory-style record → original layout
      expect(x.name).toBeTruthy();
      for (const c of x.channels) {
        if (c.href) expect(c.href).toMatch(/^(tel:\+?\d+|sms:\+?\d+(\?body=\w+)?|https?:\/\/)/);
        if (c.kind === "call" && c.href?.startsWith("tel:")) expect(isDialable(c.value)).toBe(true);
      }
      expect(x.regions.every((r) => r.trim().length > 0)).toBe(true);
      // No two rows dial the same number the same way.
      const keys = x.channels.filter((c) => c.value).map((c) => `${c.kind}:${c.value}`);
      expect(new Set(keys).size).toBe(keys.length);
    });
  }

  it("988: call, text, chat and web", () => {
    const x = buildSupport(support.find((r) => r.slug === "988-lifeline"))!;
    expect(x.channels.map((c) => c.kind)).toEqual(["call", "text", "chat", "web"]);
    expect(x.channels[0].href).toBe("tel:988");
    expect(x.is247 && x.free && x.crisis).toBe(true);
  });

  it("keyword texts and press-1 lines", () => {
    const x = buildSupport({
      name: "Line",
      contacts: [{ region: "US", channels: { call: [{ label: "Call 988 then press", value: "1" }], text: [{ label: "Text START to", value: "88788" }] } }],
    })!;
    expect(x.channels[0]).toMatchObject({ label: "Call 988, then press 1", href: "tel:988" });
    expect(x.channels[1]).toMatchObject({ label: "Text START", href: "sms:88788?body=START" });
  });

  it("a channel without a number links to the site, never a dead tel:", () => {
    const x = buildSupport({ name: "Org", actions: { site_url: "https://example.org" }, contacts: [{ channels: { call: [{ label: "Call", value: null }] } }] })!;
    expect(x.channels[0]).toMatchObject({ kind: "call", href: "https://example.org/", note: "Number on their website" });
  });

  it("reads a text keyword from prose when there is no structured channel", () => {
    const x = buildSupport({ name: "Crisis Text Line", long_description: "Text HOME to 741741 to connect.", app_metadata: { website: "https://www.crisistextline.org" } })!;
    expect(x.channels[0]).toMatchObject({ kind: "text", value: "741741", href: "sms:741741?body=HOME" });
  });

  it("prose phone placeholders are not dialled", () => {
    expect(isDialable("Check local listings")).toBe(false);
    expect(isDialable("1-800-950-6264")).toBe(true);
  });
});

describe("assessment shells", () => {
  for (const slug of ["phq-9", "gad-7", "asrs-v1-1", "assist-v3"]) {
    it(`${slug}`, () => {
      const rec = JSON.parse(fs.readFileSync(path.join(root, "assessments-screeners", `${slug}.json`), "utf8"));
      const x = buildAssessmentShell(rec)!;
      expect(x.name).toBeTruthy();
      expect(x.questions).toBeGreaterThan(0);
    });
  }
  it("phq-9 has 9 questions", () => {
    const rec = JSON.parse(fs.readFileSync(path.join(root, "assessments-screeners", "phq-9.json"), "utf8"));
    expect(buildAssessmentShell(rec)!.questions).toBe(9);
  });
});

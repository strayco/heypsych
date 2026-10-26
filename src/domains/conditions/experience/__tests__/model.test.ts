import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { buildConditionExperience, frequencies, labelFor } from "../model";

describe("frequencies", () => {
  it("turns small rates into natural frequencies", () => {
    const f = frequencies("Approximately 5% of children and 2.5% of adults worldwide are estimated to have ADHD.");
    expect(f.map((x) => [x.group, x.display])).toEqual([
      ["children", "1 in 20"],
      ["adults", "1 in 40"],
    ]);
    expect(f[0].dots).toEqual({ total: 20, filled: 1 });
  });

  it("keeps larger rates as people in 100", () => {
    expect(frequencies("About 12% of adults")[0]).toMatchObject({ display: "12 in 100", dots: { total: 100, filled: 12 } });
  });

  it("returns nothing it cannot read", () => {
    expect(frequencies("Rare; exact figures unknown.")).toEqual([]);
    expect(frequencies(null)).toEqual([]);
  });
});

describe("labelFor", () => {
  it("reads record keys as plain labels", () => {
    expect(labelFor("school_work")).toBe("School & work");
    expect(labelFor("inattention")).toBe("Inattention");
    expect(labelFor("hyperactivity_impulsivity")).toBe("Hyperactivity & impulsivity");
  });
});

// Every condition file, so the design is known to hold beyond the preview.
const ROOT = path.join(process.cwd(), "data/conditions");
const files = (function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".json") ? [path.join(dir, e.name)] : []
  );
})(ROOT);

describe("every condition record", () => {
  it("builds without throwing and has an opening", () => {
    let built = 0;
    for (const file of files) {
      const record = JSON.parse(fs.readFileSync(file, "utf8"));
      const content = record?.content?.content ?? record?.content;
      if (!content || typeof content !== "object") continue;
      const x = buildConditionExperience(record.name ?? record.slug, content, record.metadata ?? {});
      expect(x.name, file).toBeTruthy();
      expect(x.lede, file).toBeTruthy();
      built += 1;
    }
    expect(built).toBeGreaterThan(100);
  });
});

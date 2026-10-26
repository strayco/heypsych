import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { buildToolExperience, costHeadline, platformsLine } from "../model";
import { getConditionNames } from "../condition-names";
import { CONDITION_SLUGS } from "@/lib/entities/entity-slugs.generated";

const DIR = path.join(process.cwd(), "data/resources/tools");
const records = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ file: f, tool: JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) }));

describe("helpers", () => {
  it("states cost plainly", () => {
    expect(costHeadline({ model: "free", free_tier: true })).toBe("Free");
    expect(costHeadline({ model: "subscription", free_tier: false, starting_price: "$69/week" })).toBe("From $69/week");
    expect(costHeadline({ model: "freemium", free_tier: true, starting_price: "$12.99/month" })).toBe("Free, or from $12.99/month");
  });

  it("lists platforms", () => {
    expect(platformsLine({ ios: true, android: true, web: false, desktop: false, wearable: false })).toBe("iPhone · Android");
    expect(platformsLine({ ios: false, android: false, web: false, desktop: false, wearable: false })).toBeNull();
  });
});

describe("every patient tool record", () => {
  const names = getConditionNames();
  const counts = { total: 0, uses: 0, conditions: 0, crisis: 0, rated: 0, insurance: 0 };

  for (const { file, tool } of records) {
    it(`${file} builds a complete page`, () => {
      const x = buildToolExperience(tool, names);
      counts.total += 1;
      if (x.uses.length) counts.uses += 1;
      if (x.conditions.length) counts.conditions += 1;
      if (x.crisisCaveat) counts.crisis += 1;
      if (x.privacy.grade) counts.rated += 1;
      if (x.cost.insurance) counts.insurance += 1;

      expect(x.name).toBeTruthy();
      expect(x.lede).toBeTruthy();
      expect(x.glance.length).toBeGreaterThanOrEqual(2);
      expect(x.cost.headline).toBeTruthy();
      // Condition chips only link to pages that exist.
      for (const c of x.conditions) expect(CONDITION_SLUGS.has(c.slug), `${file} → ${c.slug}`).toBe(true);
    });
  }

  it("reports coverage", () => {
    console.log("patient tool experience coverage", counts);
    expect(counts.total).toBe(records.length);
  });
});

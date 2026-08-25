/**
 * Guards the slug manifest that middleware uses to answer unknown
 * `/conditions/*` and `/resources/*` URLs with a true 404.
 *
 * The risk this protects against is asymmetric: a missing slug 404s a live page
 * and destroys its rankings, which is far worse than the soft 404 the manifest
 * exists to fix. These tests assert the manifest is populated, covers the
 * static hub routes that are not database rows, and still rejects junk.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  CONDITION_SLUGS,
  RESOURCE_SLUGS,
  entitySlugExists,
} from "../entity-slugs.generated";

/** Static route directories that are real pages rather than database rows. */
function staticSegments(routeDir: string): string[] {
  const dir = path.join(process.cwd(), "src/app", routeDir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .filter((e) => !e.name.startsWith("[") && !e.name.startsWith("_"))
    .map((e) => e.name);
}

describe("entity slug manifest", () => {
  it("is populated for both routes", () => {
    // An empty manifest means generation failed; middleware would then be
    // deciding 404s from nothing.
    expect(CONDITION_SLUGS.size).toBeGreaterThan(100);
    expect(RESOURCE_SLUGS.size).toBeGreaterThan(50);
  });

  it("includes every static hub route under /conditions", () => {
    // These render from their own page files, so omitting them would 404
    // working hubs like /conditions/anxiety-fear.
    for (const segment of staticSegments("conditions")) {
      expect(entitySlugExists("conditions", segment)).toBe(true);
    }
  });

  it("includes every static hub route under /resources", () => {
    for (const segment of staticSegments("resources")) {
      expect(entitySlugExists("resources", segment)).toBe(true);
    }
  });

  it("recognises known condition and resource pages", () => {
    expect(entitySlugExists("conditions", "generalized-anxiety-disorder")).toBe(true);
    expect(entitySlugExists("conditions", "opioid-use-disorder")).toBe(true);
  });

  it("rejects slugs that resolve to no page", () => {
    expect(entitySlugExists("conditions", "this-does-not-exist")).toBe(false);
    expect(entitySlugExists("resources", "definitely-not-real")).toBe(false);
  });

  it("keeps the two routes separate", () => {
    // A condition slug must not keep a bogus /resources/ URL alive.
    const conditionOnly = [...CONDITION_SLUGS].find((s) => !RESOURCE_SLUGS.has(s));
    expect(conditionOnly).toBeDefined();
    expect(entitySlugExists("resources", conditionOnly!)).toBe(false);
  });
});

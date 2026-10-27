/**
 * Catalog identity.
 *
 * New imports must not create a second canonical product for a slug we
 * already have. Aliases (valant → valant-ehr-suite) are allowed as files;
 * two files with the same slug are not.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isAlias } from "../canonical-identity";

const PRODUCTS_DIR = "data/tools-v4/products";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (entry.endsWith(".json")) out.push(path);
  }
  return out;
}

describe("catalog identity", () => {
  const files = walk(PRODUCTS_DIR);
  const records = files.map((file) => ({
    file,
    data: JSON.parse(readFileSync(file, "utf8")) as {
      slug?: string;
      name?: string;
      website_url?: string;
    },
  }));

  it("parses every remaining product file", () => {
    expect(records.length).toBeGreaterThan(0);
    expect(records.length).toBeLessThanOrEqual(60); // 37 as of 2026-10-23, 55 after the 2026-10-26 restore
  });

  it("does not allow two files to share a slug", () => {
    const bySlug = new Map<string, string[]>();
    for (const { file, data } of records) {
      const slug = data.slug;
      if (!slug) continue;
      const list = bySlug.get(slug) ?? [];
      list.push(file);
      bySlug.set(slug, list);
    }

    const duplicates = [...bySlug.entries()].filter(([, list]) => list.length > 1);
    expect(duplicates, JSON.stringify(duplicates, null, 2)).toEqual([]);
  });

  it("does not keep alias records on disk", () => {
    const aliases = records.filter((r) => r.data.slug && isAlias(r.data.slug));
    expect(aliases.map((r) => r.data.slug)).toEqual([]);
  });
});

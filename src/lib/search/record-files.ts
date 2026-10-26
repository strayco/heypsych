/**
 * Search result → the JSON record behind it, for match-in-context snippets.
 *
 * Every searchable entity also exists as a file under data/ (the database is
 * synced from them), so the full text is available without another database
 * query. Files are found by name (`<slug>.json`), so building the index lists
 * directories but never reads them; a record is read only when one of the few
 * results actually returned needs a snippet.
 *
 * Server-only. The directories are listed in next.config.ts
 * `outputFileTracingIncludes` for /api/search so they ship with the function.
 */

import fs from "fs";
import path from "path";
import type { SearchResultType } from "./shape-results";

const DIRS: Record<SearchResultType, string[]> = {
  condition: ["data/conditions"],
  treatment: ["data/treatments"],
  resource: ["data/resources", "data/learn"],
  tool: ["data/resources/tools", "data/tools-v4/products"],
};

let index: Map<string, string> | null = null;

/**
 * File names do not always equal slugs: `dextroamphetamine-Dexedrine-v2.json`
 * holds `dextroamphetamine-dexedrine`, `valproate-semisodiumdivalproex.legacy`
 * holds `valproate-semisodium-divalproex`. Comparing on lowercase letters and
 * digits only, without `.legacy` or a `-vN` suffix, resolves all of them
 * without reading any file.
 */
export function looseKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.legacy$/, "")
    .replace(/-v\d+$/, "")
    .replace(/[^a-z0-9]/g, "");
}

function buildIndex(): Map<string, string> {
  const map = new Map<string, string>();
  const root = process.cwd();
  for (const [type, dirs] of Object.entries(DIRS)) {
    for (const dir of dirs) {
      const walk = (abs: string) => {
        let entries: fs.Dirent[];
        try {
          entries = fs.readdirSync(abs, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          const full = path.join(abs, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.name.endsWith(".json")) {
            const base = entry.name.slice(0, -5);
            const key = `${type}:${looseKey(base)}`;
            const existing = map.get(key);
            // A current file wins over its `.legacy` predecessor.
            if (!existing || (existing.endsWith(".legacy.json") && !base.endsWith(".legacy"))) {
              map.set(key, full);
            }
          }
        }
      };
      walk(path.join(root, dir));
    }
  }
  return map;
}

/** The parsed record for a result, or null if there is no matching file. */
export function loadRecord(type: SearchResultType, slug: string): unknown | null {
  index ??= buildIndex();
  const file = index.get(`${type}:${looseKey(slug)}`);
  if (!file) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

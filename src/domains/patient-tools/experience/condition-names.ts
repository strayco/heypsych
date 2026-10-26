/**
 * Condition display names by slug, from data/conditions (files, not the
 * database). Read once per server process.
 */

import fs from "fs";
import path from "path";

let names: Record<string, string> | null = null;

export function getConditionNames(): Record<string, string> {
  if (names) return names;
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".json")) {
        try {
          const record = JSON.parse(fs.readFileSync(full, "utf8")) as { slug?: unknown; name?: unknown };
          if (typeof record.slug === "string" && typeof record.name === "string") out[record.slug] = record.name;
        } catch {
          // Unreadable record: the slug-derived name is used instead.
        }
      }
    }
  };
  walk(path.join(process.cwd(), "data/conditions"));
  names = out;
  return out;
}

/**
 * Content served from data/ files instead of the Supabase `entities` table.
 *
 * Conditions, resources and treatment records are written as JSON in data/
 * and are the source of truth. Pages used to read a copy of them from
 * Supabase (kept in step by `npm run sync:content`); they now read the files
 * directly, so a change is live on the next deploy, pages do not use database
 * egress, and the copy can never drift from the files.
 *
 * Rows have the same shape as `entities` rows, produced by the same code the
 * sync script uses (src/lib/content/content-files.ts), so every existing
 * mapper (mapRowToEntity, normalizeEntity) works on them unchanged.
 *
 * Server only: reads the filesystem.
 */

import path from "path";
import { loadContentDir, type ContentDirKey, type ContentEntityRow } from "@/lib/content/content-files";
import entityDates from "@/lib/data/entity-dates.json";
import type { EntitiesRow } from "@/lib/types/database";

export interface LocalEntityRow extends EntitiesRow {
  /** Repo-relative path of the file the row came from */
  file_path: string;
}

const DIRS: ContentDirKey[] = ["treatments", "conditions", "resources"];

type DateMap = Record<string, [string, string]>;
const DATES = entityDates as unknown as { condition: DateMap; resource: DateMap };

/**
 * created_at / updated_at for a row. Conditions and resources keep the
 * timestamps they had in Supabase (entity-dates.json), so Published / Last
 * updated dates on pages do not change. Anything else uses the record's own
 * editorial dates when it has them.
 */
function timestampsFor(row: ContentEntityRow): { created_at: string; updated_at: string } {
  const known = (row.type === "condition" || row.type === "resource") ? DATES[row.type]?.[row.slug] : undefined;
  if (known) return { created_at: known[0], updated_at: known[1] };
  const editorial = { ...(row.metadata?.editorial ?? {}), ...(row.content?.editorial ?? {}) };
  const own: string | undefined =
    editorial.lastUpdated || editorial.lastReviewed || row.metadata?.last_updated || row.content?.last_updated;
  // An empty string is falsy downstream, so mappers fall back the same way
  // they did for a database row without that value.
  return { created_at: own ?? "", updated_at: own ?? "" };
}

let memo: { rows: LocalEntityRow[]; bySlug: Map<string, LocalEntityRow>; byType: Map<string, LocalEntityRow[]> } | null = null;

function load() {
  if (memo) return memo;
  const root = process.cwd();
  const dataDir = path.join(root, "data");
  const rows: LocalEntityRow[] = [];

  for (const dir of DIRS) {
    const { rows: dirRows, errors } = loadContentDir(dataDir, dir, { rootDir: root });
    for (const e of errors) {
      // Same records the sync script rejects; never fatal for the site.
      if (process.env.NODE_ENV !== "test") console.warn(`[local-entities] skipped ${path.relative(root, e.file)}: ${e.error}`);
    }
    for (const { entity, filePath } of dirRows) {
      if (entity.status !== "active") continue;
      rows.push({
        id: `file:${entity.type}:${entity.slug}`,
        type: entity.type,
        slug: entity.slug,
        title: entity.title,
        description: entity.description,
        content: entity.content,
        metadata: entity.metadata,
        status: entity.status,
        ...timestampsFor(entity),
        file_path: path.relative(root, filePath).split(path.sep).join("/"),
      });
    }
  }

  // A slug can exist under more than one type. Match the database's
  // "ORDER BY type ASC LIMIT 1" so the same row wins.
  const sorted = [...rows].sort((a, b) => (a.type < b.type ? -1 : a.type > b.type ? 1 : 0));
  const bySlug = new Map<string, LocalEntityRow>();
  for (const r of sorted) if (!bySlug.has(r.slug)) bySlug.set(r.slug, r);

  const byType = new Map<string, LocalEntityRow[]>();
  for (const r of rows) {
    const list = byType.get(r.type) ?? [];
    list.push(r);
    byType.set(r.type, list);
  }

  memo = { rows, bySlug, byType };
  return memo;
}

/** Sort the way Postgres `ORDER BY title` does for these titles. */
const titleCollator = new Intl.Collator("en", { sensitivity: "variant", ignorePunctuation: false });
export function compareTitles(a: { title: string }, b: { title: string }): number {
  return titleCollator.compare(a.title ?? "", b.title ?? "");
}

/** Every active row. */
export function getAllLocalRows(): LocalEntityRow[] {
  return load().rows;
}

/** Active rows of one type (e.g. "condition", "resource", "medication"). */
export function getLocalRowsByType(type: string): LocalEntityRow[] {
  return load().byType.get(type) ?? [];
}

/** The active row with this slug (lowest type name wins, as in the database). */
export function getLocalRowBySlug(slug: string): LocalEntityRow | null {
  return load().bySlug.get(slug) ?? null;
}

/** For tests: forget the loaded files. */
export function resetLocalEntitiesForTests() {
  memo = null;
}

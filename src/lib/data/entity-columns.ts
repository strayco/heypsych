/**
 * Columns of the `entities` table that the app reads.
 *
 * Matches EntitiesRow (src/lib/types/database.ts). Leaves out `search_vector`,
 * plus the unused `category`/`subcategory` columns (the app reads category
 * from `metadata`). `search_vector` is a tsvector used only inside
 * Postgres for full-text search, and it is about 40% of each row's size
 * (e.g. ~27 KB of agoraphobia's ~64 KB). `select("*")` sent it to the app on
 * every query for nothing, adding to Supabase egress (the project hit its
 * egress quota on 2026-10-27).
 *
 * If you add a column to `entities` that the app needs, add it here.
 */
export const ENTITY_COLUMN_LIST = [
  "id",
  "slug",
  "type",
  "title",
  "description",
  "content",
  "metadata",
  "status",
  "created_at",
  "updated_at",
] as const;

/**
 * For the Supabase client: `.select(ENTITY_COLUMNS)`. A literal (not a join)
 * so the typed client can infer the row type from it.
 */
export const ENTITY_COLUMNS = "id, slug, type, title, description, content, metadata, status, created_at, updated_at" as const;

/** For raw SQL over the direct Postgres connection: `SELECT ${ENTITY_SQL_COLUMNS} FROM entities` */
export const ENTITY_SQL_COLUMNS = ENTITY_COLUMN_LIST.join(", ");

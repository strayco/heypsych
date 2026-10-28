/**
 * Light index of every active entity: id, slug, type, title, status.
 *
 * Link validation only needs to know that an entity exists and what it is
 * called. Built from the data/ files (src/lib/data/local-entities.ts); no
 * database access.
 */

import { getAllLocalRows } from "@/lib/data/local-entities";
import type { Entity } from "@/lib/types/database";

export interface IndexedEntity {
  id: string;
  slug: string;
  type: string;
  title: string;
  status: string;
}

/** Kept for callers that revalidate by tag; content now comes from files. */
export const ENTITY_INDEX_TAG = "supabase-content";

let memo: Map<string, IndexedEntity> | null = null;

function bySlugMap(): Map<string, IndexedEntity> {
  if (memo) return memo;
  // Ordered by slug then type, so the first per slug matches
  // getBySlug's "lowest type name wins".
  const rows = [...getAllLocalRows()].sort((a, b) =>
    a.slug !== b.slug ? (a.slug < b.slug ? -1 : 1) : a.type < b.type ? -1 : a.type > b.type ? 1 : 0
  );
  const map = new Map<string, IndexedEntity>();
  for (const r of rows) {
    if (!map.has(r.slug)) map.set(r.slug, { id: r.id, slug: r.slug, type: r.type, title: r.title, status: r.status });
  }
  memo = map;
  return map;
}

/**
 * The entity with this slug, carrying only id, slug, type, name and status.
 * Enough for link validation; never use it to render an entity's content.
 */
export async function getLightEntityBySlug(slug: string): Promise<Entity | null> {
  const r = bySlugMap().get(slug);
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    type: r.type,
    name: r.title,
    status: r.status,
    data: {},
    metadata: {},
  } as unknown as Entity;
}

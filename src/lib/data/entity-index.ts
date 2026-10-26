/**
 * Light index of every active entity: id, slug, type, title, status.
 *
 * Link validation only needs to know that an entity exists and what it is
 * called. Fetching whole rows (with their full article content) for every
 * linked name on every page regeneration was the main source of Supabase
 * egress. This index is one small query, held in the Next data cache for a
 * day and shared by every page and every server instance.
 */

import { unstable_cache } from "next/cache";
import { supabaseOptional } from "@/lib/config/database";
import type { Entity } from "@/lib/types/database";

export interface IndexedEntity {
  id: string;
  slug: string;
  type: string;
  title: string;
  status: string;
}

const PAGE = 1000;

async function fetchIndex(): Promise<IndexedEntity[]> {
  const db = supabaseOptional();
  if (!db) return [];
  const out: IndexedEntity[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("entities")
      .select("id, slug, type, title, status")
      .eq("status", "active")
      .order("slug")
      .order("type")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...((data ?? []) as IndexedEntity[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export const ENTITY_INDEX_TAG = "supabase-content";

const getIndexCached = unstable_cache(fetchIndex, ["entity-index-v1"], {
  revalidate: 86400,
  tags: [ENTITY_INDEX_TAG],
});

let memo: { at: number; bySlug: Map<string, IndexedEntity> } | null = null;

async function bySlugMap(): Promise<Map<string, IndexedEntity>> {
  if (memo && Date.now() - memo.at < 10 * 60 * 1000) return memo.bySlug;
  let rows: IndexedEntity[];
  try {
    rows = await getIndexCached();
  } catch {
    // Outside a Next request (scripts, tests) the data cache is unavailable.
    rows = await fetchIndex();
  }
  const map = new Map<string, IndexedEntity>();
  // Rows are ordered by slug then type, so the first per slug matches
  // EntityService.getBySlug's "ORDER BY type ASC LIMIT 1".
  for (const r of rows) if (!map.has(r.slug)) map.set(r.slug, r);
  memo = { at: Date.now(), bySlug: map };
  return map;
}

/**
 * The entity with this slug, carrying only id, slug, type, name and status.
 * Enough for link validation; never use it to render an entity's content.
 */
export async function getLightEntityBySlug(slug: string): Promise<Entity | null> {
  const r = (await bySlugMap()).get(slug);
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

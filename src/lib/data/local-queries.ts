/**
 * File-backed replacements for the Supabase content queries used by pages.
 *
 * Each function returns what the database query it replaces returned
 * (same filters, ordering, limits and mapper), but reads data/ files through
 * local-entities.ts. Server only.
 */

import type { Entity } from "@/lib/types/database";
import { mapRowToEntity } from "@/lib/data/entity-mappers";
import { normalizeEntity } from "@/lib/data/entity-service";
import {
  compareTitles,
  getAllLocalRows,
  getLocalRowBySlug,
  getLocalRowsByType,
  type LocalEntityRow,
} from "@/lib/data/local-entities";

const byTitle = (rows: LocalEntityRow[]) => [...rows].sort(compareTitles);
const inCategory = (category: string) => (r: LocalEntityRow) => r.metadata?.category === category;

// ---------------------------------------------------------------------------
// Single entity
// ---------------------------------------------------------------------------

/** EntityService.getBySlug: any type, lowest type name wins. */
export function getEntityBySlugLocal(slug: string): Entity | null {
  const row = getLocalRowBySlug(slug);
  return row ? normalizeEntity(row) : null;
}

// ---------------------------------------------------------------------------
// Lists (server-queries.ts)
// ---------------------------------------------------------------------------

/** getConditionsServer */
export function getConditionsLocal(): Entity[] {
  return byTitle(getLocalRowsByType("condition"))
    .slice(0, 200)
    .map((row) => mapRowToEntity(row, "condition"));
}

/** getConditionsByCategoryServer */
export function getConditionsByCategoryLocal(category: string): Entity[] {
  return byTitle(getLocalRowsByType("condition").filter(inCategory(category)))
    .slice(0, 100)
    .map((row) => mapRowToEntity(row, "condition"));
}

/** getOtherConditionsSubcategoryServer */
export function getOtherConditionsSubcategoryLocal(subcategory: string): Entity[] {
  return byTitle(getLocalRowsByType("condition").filter(inCategory(`other-conditions/${subcategory}`))).map((row) =>
    mapRowToEntity(row, "condition")
  );
}

/** getResourcesServer: one entry per name, keeping the longer (more specific) slug. */
export function getResourcesLocal(): Entity[] {
  const byName = new Map<string, Entity>();
  for (const row of byTitle(getLocalRowsByType("resource")).slice(0, 500)) {
    const entity = mapRowToEntity(row, "resource");
    const existing = byName.get(entity.name);
    if (!existing || entity.slug.length > existing.slug.length) byName.set(entity.name, entity);
  }
  return Array.from(byName.values());
}

/**
 * getResourcesByCategoryServer: ordered by metadata.order (compared as text,
 * as `metadata->>order` is in SQL; rows without one last), then title.
 */
export function getResourcesByCategoryLocal(category: string): Entity[] {
  const orderOf = (r: LocalEntityRow) => {
    const v = r.metadata?.order;
    return v === undefined || v === null ? null : String(v);
  };
  return getLocalRowsByType("resource")
    .filter(inCategory(category))
    .sort((a, b) => {
      const oa = orderOf(a);
      const ob = orderOf(b);
      if (oa !== ob) {
        if (oa === null) return 1;
        if (ob === null) return -1;
        return oa < ob ? -1 : 1;
      }
      return compareTitles(a, b);
    })
    .map((row) => mapRowToEntity(row, "resource"));
}

// ---------------------------------------------------------------------------
// EntityService equivalents for server callers
// ---------------------------------------------------------------------------

/** EntityService.getByType / getByEntityType: ordered by title, at most 500. */
export function getByTypeLocal(entityType: string): Entity[] {
  return byTitle(getLocalRowsByType(entityType)).slice(0, 500).map(normalizeEntity);
}

/** EntityService.getByTypeAndCategory: ordered by title, at most 100. */
export function getByTypeAndCategoryLocal(entityType: string, category: string): Entity[] {
  return byTitle(getLocalRowsByType(entityType).filter(inCategory(category))).slice(0, 100).map(normalizeEntity);
}

/** EntityService.getAll: every active entity, ordered by type then title. */
export function getAllLocal(): Entity[] {
  return [...getAllLocalRows()]
    .sort((a, b) => (a.type !== b.type ? (a.type < b.type ? -1 : 1) : compareTitles(a, b)))
    .map(normalizeEntity);
}

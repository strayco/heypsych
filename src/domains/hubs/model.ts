/**
 * Hub model
 *
 * Shapes the three hubs (Conditions, Treatments, Symptoms) into one form the
 * HubBrowser renders: items to open, groups to browse by, and optional
 * "what it's for" facets. Pure; everything comes from the records.
 */

export interface HubItem {
  href: string;
  title: string;
  /** One readable line. */
  subtitle: string | null;
  /** Group ids this item belongs to (category, modality). */
  groups: string[];
  /** Facet ids (condition slugs a treatment is used for). */
  facets: string[];
  /** Extra words the search matches (aliases, brand names). */
  keywords: string[];
}

export interface HubGroup {
  id: string;
  label: string;
  description: string | null;
  href: string | null;
  count: number;
  /** A few items to show on the tile, so it reads like a shelf. */
  top: { href: string; title: string }[];
}

export interface HubFacet {
  id: string;
  label: string;
  count: number;
}

// ---------------------------------------------------------------------------

function clean(text: string): string {
  return text.replace(/\{link:[^:}]+:[^:}]+:([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
}

export function firstSentence(text: string | null | undefined, max = 140): string | null {
  if (!text || typeof text !== "string") return null;
  const t = clean(text);
  if (!t) return null;
  const sentence = (t.match(/^.+?[.!?](\s|$)/)?.[0] ?? t).trim();
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

/**
 * A condition's one-line definition from its content (entity.data), in the
 * same order the condition page uses: shortDefinition, aeo.what_is, then the
 * description.
 */
export function conditionOneLiner(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const aeo = d.aeo as Record<string, unknown> | undefined;
  const description = d.description;
  const candidates: unknown[] = [
    d.shortDefinition,
    d.short_definition,
    aeo?.what_is,
    typeof description === "string" ? description : (description as Record<string, unknown> | undefined)?.overview,
    (description as Record<string, unknown> | undefined)?.summary,
    d.summary,
    d.overview,
  ];
  for (const c of candidates) {
    const s = typeof c === "string" ? firstSentence(c) : null;
    if (s && s.length > 15) return s;
  }
  return null;
}

/** Normalise for matching: lower case, letters and digits only. */
export function normalise(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Items matching every word of the query (by word start, in the title,
 * keywords or subtitle), with title matches first. An empty query returns
 * everything in its original order.
 */
export function searchItems(items: HubItem[], query: string): HubItem[] {
  const words = normalise(query).split(" ").filter(Boolean);
  if (words.length === 0) return items;
  const startsWord = (hay: string, w: string) => ` ${hay}`.includes(` ${w}`);
  const scored: { item: HubItem; score: number; index: number }[] = [];
  items.forEach((item, index) => {
    const title = normalise(item.title);
    const keys = normalise(item.keywords.join(" "));
    const sub = normalise(item.subtitle ?? "");
    let score = 0;
    for (const w of words) {
      if (startsWord(title, w)) score += 3;
      else if (startsWord(keys, w)) score += 2;
      else if (startsWord(sub, w)) score += 1;
      else return;
    }
    scored.push({ item, score, index });
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((s) => s.item);
}

export function filterItems(items: HubItem[], opts: { query?: string; group?: string | null; facet?: string | null }): HubItem[] {
  let out = items;
  if (opts.group) out = out.filter((i) => i.groups.includes(opts.group!));
  if (opts.facet) out = out.filter((i) => i.facets.includes(opts.facet!));
  return searchItems(out, opts.query ?? "");
}

/** Groups in the given order with counts and their first few items. */
export function buildGroups(
  items: HubItem[],
  defs: { id: string; label: string; description?: string | null; href?: string | null }[],
  topCount = 3
): HubGroup[] {
  return defs
    .map((def) => {
      const members = items.filter((i) => i.groups.includes(def.id));
      return {
        id: def.id,
        label: def.label,
        description: def.description ?? null,
        href: def.href ?? null,
        count: members.length,
        top: members.slice(0, topCount).map((m) => ({ href: m.href, title: m.title })),
      };
    })
    .filter((g) => g.count > 0);
}

/** The most-used facets, for a row of "what it's for" chips. */
export function topFacets(items: HubItem[], labels: Map<string, string>, max = 12): HubFacet[] {
  const counts = new Map<string, number>();
  for (const item of items) for (const f of new Set(item.facets)) counts.set(f, (counts.get(f) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([id]) => labels.has(id))
    .sort((a, b) => b[1] - a[1] || labels.get(a[0])!.localeCompare(labels.get(b[0])!))
    .slice(0, max)
    .map(([id, count]) => ({ id, label: labels.get(id)!, count }));
}

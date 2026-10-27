"use client";

/**
 * HubBrowser
 *
 * The browsing half of a hub: a fast search, category tiles that read like
 * shelves (count, a line, the first few things on them) and filter the list
 * when chosen, optional "what it's for" chips, and the full list.
 *
 * Every item is rendered in the server HTML. Filtering and "show more" only
 * toggle `hidden`, so every link stays crawlable and find-in-page works.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { filterItems, type HubFacet, type HubGroup, type HubItem } from "@/domains/hubs/model";

const TONES = ["bg-accent", "bg-treatment", "bg-positive", "bg-caution", "bg-negative", "bg-label-tertiary"];
const PAGE = 48;
/** Cards per family shelf before "Show all". */
const SHELF = 9;

export function HubBrowser({
  items,
  groups = [],
  facets = [],
  groupsTitle = "Browse by type",
  facetsTitle = "What it's for",
  listTitle,
  searchLabel,
  searchPlaceholder,
  showSearch = true,
  noun = "results",
  sectioned = false,
}: {
  items: HubItem[];
  groups?: HubGroup[];
  facets?: HubFacet[];
  groupsTitle?: string;
  facetsTitle?: string;
  listTitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  showSearch?: boolean;
  noun?: string;
  /**
   * Shelve the list by group (medication families): a compact jump bar
   * instead of big tiles, then one section per group, so every family's
   * members are on screen rather than behind a filter below the tiles.
   */
  sectioned?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [facet, setFacet] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [openShelves, setOpenShelves] = useState<Set<string>>(() => new Set());

  const matches = useMemo(() => filterItems(items, { query, group, facet }), [items, query, group, facet]);
  const filtering = Boolean(query.trim() || group || facet);
  // Matching items in match order first, then the rest (hidden), so the DOM
  // always holds every link.
  const ordered = useMemo(() => {
    const set = new Set(matches);
    return [...matches, ...items.filter((i) => !set.has(i))];
  }, [matches, items]);
  const visibleCount = expanded || filtering ? matches.length : Math.min(PAGE, matches.length);
  const activeGroup = groups.find((g) => g.id === group);
  const activeFacet = facets.find((f) => f.id === facet);

  // Sectioned: matches per group, in match order.
  const sections = useMemo(() => {
    if (!sectioned) return [];
    return groups.map((g) => ({ group: g, members: matches.filter((m) => m.groups.includes(g.id)) }));
  }, [sectioned, groups, matches]);
  const sectionCounts = useMemo(() => new Map(sections.map((x) => [x.group.id, x.members.length])), [sections]);

  const scrollToResults = () => {
    if (typeof window === "undefined") return;
    // After React applies the filter, so the list is its final height.
    requestAnimationFrame(() => {
      const el = document.getElementById("hub-list-title");
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  };

  const clear = () => {
    setQuery("");
    setGroup(null);
    setFacet(null);
  };

  return (
    <div>
      {showSearch && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <label htmlFor="hub-search" className="sr-only">
            {searchLabel}
          </label>
          <div className="relative">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="text-label-tertiary pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="9" r="6" />
              <path d="m14 14 4 4" strokeLinecap="round" />
            </svg>
            <input
              id="hub-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
              enterKeyHint="search"
              className="border-separator bg-surface text-label-primary placeholder:text-label-tertiary focus:border-accent focus:ring-accent w-full rounded-full border py-4 pr-5 text-[17px] shadow-card-1 transition-shadow focus:ring-2 focus:outline-none"
              style={{ paddingLeft: "3.25rem" }}
            />
          </div>
        </div>
      )}

      {/* Shelves ------------------------------------------------------------- */}
      {groups.length > 0 && sectioned && (
        <nav aria-label={groupsTitle} className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
          <h2 className="text-label-tertiary text-[13px] font-semibold tracking-wide uppercase">{groupsTitle}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {groups.map((g, i) => {
              const n = sectionCounts.get(g.id) ?? 0;
              return (
                <li key={g.id}>
                  <a
                    href={`#shelf-${g.id}`}
                    aria-disabled={n === 0}
                    className={`focus-visible:ring-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[14px] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                      n === 0
                        ? "border-separator text-label-tertiary pointer-events-none opacity-50"
                        : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
                    }`}
                  >
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${TONES[i % TONES.length]}`} />
                    {g.label}
                    <span className="opacity-60 tabular-nums">{n}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      {groups.length > 0 && !sectioned && (
        <section aria-labelledby="hub-groups-title" className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
          <h2 id="hub-groups-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
            {groupsTitle}
          </h2>
          {/* grid-cols-1 (minmax(0,1fr)): an implicit track would grow to fit the
              truncated top links and push tiles past a phone screen. */}
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g, i) => {
              const selected = g.id === group;
              const head = (
                <>
                  <span aria-hidden="true" className={`mt-2 h-2 w-2 shrink-0 rounded-full ${TONES[i % TONES.length]}`} />
                  <span className="min-w-0 flex-1">
                    <span className="text-label-primary group-hover/tile:text-accent block text-[17px] font-semibold leading-snug">{g.label}</span>
                    {g.description && <span className="text-label-secondary mt-0.5 line-clamp-2 text-[14px]">{g.description}</span>}
                  </span>
                  <span className="text-label-tertiary shrink-0 text-[14px] tabular-nums">
                    {g.count}
                    {g.href && <span aria-hidden="true" className="text-accent ml-1.5">→</span>}
                  </span>
                </>
              );
              const headClass =
                "focus-visible:ring-accent flex w-full items-start gap-3 rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none";
              return (
                <li
                  key={g.id}
                  className={`group/tile min-w-0 rounded-2xl border p-5 transition-[transform,box-shadow,border-color] duration-300 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none ${
                    selected
                      ? "border-accent bg-accent-tint shadow-card-2"
                      : "border-separator bg-surface shadow-card-1 hover:-translate-y-0.5 hover:shadow-card-2 motion-reduce:hover:translate-y-0"
                  }`}
                >
                  {/* A tile with its own page opens it; one without filters the list below. */}
                  {g.href ? (
                    <Link href={g.href} className={headClass}>
                      {head}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setGroup(selected ? null : g.id);
                        setExpanded(false);
                        if (!selected) scrollToResults();
                      }}
                      aria-pressed={selected}
                      aria-controls="hub-results"
                      className={headClass}
                    >
                      {head}
                    </button>
                  )}
                  {g.top.length > 0 && (
                    <ul className="mt-3 space-y-1 pl-5">
                      {g.top.map((t) => (
                        <li key={t.href} className="truncate">
                          <Link href={t.href} className="text-label-secondary hover:text-accent text-[14px]">
                            {t.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* What it's for --------------------------------------------------------- */}
      {facets.length > 0 && (
        <section aria-labelledby="hub-facets-title" className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
          <h2 id="hub-facets-title" className="font-display text-label-primary text-[24px] leading-tight">
            {facetsTitle}
          </h2>
          <div role="group" aria-label={facetsTitle} className="mt-4 flex flex-wrap gap-2">
            {facets.map((f) => {
              const selected = f.id === facet;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFacet(selected ? null : f.id);
                    setExpanded(false);
                    if (!selected) scrollToResults();
                  }}
                  aria-pressed={selected}
                  aria-controls="hub-results"
                  className={`focus-visible:ring-accent rounded-full border px-3.5 py-1.5 text-[14px] transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none ${
                    selected ? "border-label-primary bg-label-primary text-canvas" : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
                  }`}
                >
                  {f.label}
                  <span className="ml-1.5 opacity-60 tabular-nums">{f.count}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* The list ----------------------------------------------------------- */}
      <section aria-labelledby="hub-list-title" className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="hub-list-title" className="scroll-mt-24 font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
            {activeGroup ? activeGroup.label : listTitle}
            {activeFacet && <span className="text-label-tertiary"> · for {activeFacet.label}</span>}
          </h2>
          <p aria-live="polite" className="text-label-tertiary text-[14px]">
            {matches.length} {noun}
            {filtering && (
              <button type="button" onClick={clear} className="text-accent hover:text-accent-hover ml-3 font-medium">
                Clear
              </button>
            )}
          </p>
        </div>

        {matches.length === 0 && (
          <p className="text-label-secondary mt-6 text-[16px]">
            Nothing matches “{query}”. Try a different spelling, a brand name, or{" "}
            <Link href={`/search?q=${encodeURIComponent(query)}`} className="text-accent hover:underline">
              search the whole site
            </Link>
            .
          </p>
        )}

        {sectioned ? (
          <div id="hub-results" className="mt-2">
            {groups.map((g, i) => {
              const all = items.filter((it) => it.groups.includes(g.id));
              const shown = sections.find((x) => x.group.id === g.id)?.members ?? [];
              const shownSet = new Set(shown);
              const open = filtering || openShelves.has(g.id);
              const limit = open ? Infinity : SHELF;
              // Matches first (in match order), then the rest hidden, so every link stays in the HTML.
              const list = [...shown, ...all.filter((it) => !shownSet.has(it))];
              return (
                <section key={g.id} id={`shelf-${g.id}`} hidden={shown.length === 0} aria-labelledby={`shelf-${g.id}-title`} className="scroll-mt-24 pt-10">
                  <div className="border-separator flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b pb-3">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 self-center rounded-full ${TONES[i % TONES.length]}`} />
                    <h3 id={`shelf-${g.id}-title`} className="text-label-primary text-[22px] font-semibold leading-tight">
                      {g.label}
                    </h3>
                    <span className="text-label-tertiary text-[14px] tabular-nums">{shown.length}</span>
                    {g.description && <p className="text-label-secondary w-full text-[14px] sm:w-auto sm:flex-1">{g.description}</p>}
                  </div>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((item, index) => (
                      <li key={item.href} hidden={!shownSet.has(item) || index >= limit}>
                        <ItemCard item={item} />
                      </li>
                    ))}
                  </ul>
                  {!open && shown.length > SHELF && (
                    <button
                      type="button"
                      onClick={() => setOpenShelves((prev) => new Set(prev).add(g.id))}
                      className="text-accent hover:text-accent-hover mt-3 text-[15px] font-medium"
                    >
                      Show all {shown.length} {g.label}
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <>
            <ul id="hub-results" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ordered.map((item, index) => (
                <li key={item.href} hidden={index >= visibleCount}>
                  <ItemCard item={item} />
                </li>
              ))}
            </ul>

            {!filtering && !expanded && matches.length > PAGE && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="border-separator bg-surface text-label-primary hover:bg-fill-quaternary rounded-full border px-6 py-2.5 text-[15px] font-medium"
                >
                  Show all {matches.length}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function ItemCard({ item }: { item: HubItem }) {
  return (
    <Link
      href={item.href}
      className="border-separator bg-surface hover:border-accent/40 focus-visible:ring-accent group block h-full rounded-2xl border px-4 py-3.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="text-label-primary group-hover:text-accent block text-[15px] font-medium leading-snug">{item.title}</span>
      {item.subtitle && <span className="text-label-secondary mt-1 line-clamp-2 text-[13px] leading-snug">{item.subtitle}</span>}
    </Link>
  );
}

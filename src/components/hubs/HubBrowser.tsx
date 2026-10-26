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
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [facet, setFacet] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

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
      {groups.length > 0 && (
        <section aria-labelledby="hub-groups-title" className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
          <h2 id="hub-groups-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
            {groupsTitle}
          </h2>
          {/* grid-cols-1 (minmax(0,1fr)): an implicit track would grow to fit the
              truncated top links and push tiles past a phone screen. */}
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g, i) => {
              const selected = g.id === group;
              return (
                <li
                  key={g.id}
                  className={`group/tile min-w-0 rounded-2xl border p-5 transition-[transform,box-shadow,border-color] duration-300 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none ${
                    selected
                      ? "border-accent bg-accent-tint shadow-card-2"
                      : "border-separator bg-surface shadow-card-1 hover:-translate-y-0.5 hover:shadow-card-2 motion-reduce:hover:translate-y-0"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setGroup(selected ? null : g.id);
                      setExpanded(false);
                    }}
                    aria-pressed={selected}
                    aria-controls="hub-results"
                    className="focus-visible:ring-accent flex w-full items-start gap-3 rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span aria-hidden="true" className={`mt-2 h-2 w-2 shrink-0 rounded-full ${TONES[i % TONES.length]}`} />
                    <span className="min-w-0 flex-1">
                      <span className="text-label-primary block text-[17px] font-semibold leading-snug">{g.label}</span>
                      {g.description && <span className="text-label-secondary mt-0.5 line-clamp-2 text-[14px]">{g.description}</span>}
                    </span>
                    <span className="text-label-tertiary shrink-0 text-[14px] tabular-nums">{g.count}</span>
                  </button>
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
                  {g.href && (
                    <Link href={g.href} className="text-accent hover:text-accent-hover mt-3 inline-block pl-5 text-[14px] font-medium">
                      All {g.count} <span aria-hidden="true">→</span>
                    </Link>
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
          <h2 id="hub-list-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
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

        <ul id="hub-results" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((item, index) => (
            <li key={item.href} hidden={index >= visibleCount}>
              <Link
                href={item.href}
                className="border-separator bg-surface hover:border-accent/40 focus-visible:ring-accent group block h-full rounded-2xl border px-4 py-3.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="text-label-primary group-hover:text-accent block text-[15px] font-medium leading-snug">{item.title}</span>
                {item.subtitle && <span className="text-label-secondary mt-1 line-clamp-2 text-[13px] leading-snug">{item.subtitle}</span>}
              </Link>
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
      </section>
    </div>
  );
}

"use client";

/**
 * Search results page.
 *
 * Reads `?q=` from the URL, asks `/api/search` for the top results in each
 * section, and lets each section expand to its full list. The API decides
 * what each result is and where it links; this page only lays them out.
 */

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Brain, Pill, Search, Wrench, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trackSearchSubmit } from "@/lib/analytics/product-events";
import { logger } from "@/lib/utils/logger";
import { safeHighlight } from "@/lib/utils/safe-highlight";

type ResultType = "condition" | "treatment" | "resource" | "tool";
type SectionKey = "conditions" | "treatments" | "tools" | "resources";

interface SearchResult {
  type: ResultType;
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category?: string | null;
  snippets?: Array<{ term: string; field: string; snippet: string }>;
  href: string;
}

interface SectionState {
  results: SearchResult[];
  totalCount: number;
}

type Sections = Record<SectionKey, SectionState>;

const PREVIEW_COUNT = 5;
const EXPANDED_COUNT = 100;
const MIN_QUERY_LENGTH = 2;

const SECTION_CONFIG: Array<{
  key: SectionKey;
  type: ResultType;
  label: string;
  icon: LucideIcon;
  iconClass: string;
}> = [
  { key: "conditions", type: "condition", label: "Conditions", icon: Brain, iconClass: "text-accent" },
  { key: "treatments", type: "treatment", label: "Treatments", icon: Pill, iconClass: "text-blue-400" },
  { key: "tools", type: "tool", label: "Apps & tools", icon: Wrench, iconClass: "text-treatment" },
  { key: "resources", type: "resource", label: "Articles & resources", icon: BookOpen, iconClass: "text-positive-600" },
];

const EMPTY_SECTIONS: Sections = {
  conditions: { results: [], totalCount: 0 },
  treatments: { results: [], totalCount: 0 },
  tools: { results: [], totalCount: 0 },
  resources: { results: [], totalCount: 0 },
};

type Status = "idle" | "loading" | "done" | "error";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = (searchParams.get("q") ?? "").trim();
  const isSearchable = query.length >= MIN_QUERY_LENGTH;

  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sections, setSections] = useState<Sections>(EMPTY_SECTIONS);
  const [order, setOrder] = useState<SectionKey[]>(SECTION_CONFIG.map((s) => s.key));
  // Start in "loading" when arriving with a query, so the first paint is a
  // spinner rather than a flash of the empty state.
  const [status, setStatus] = useState<Status>(isSearchable ? "loading" : "idle");
  const [expanded, setExpanded] = useState<Partial<Record<SectionKey, boolean>>>({});
  const [expanding, setExpanding] = useState<SectionKey | null>(null);

  // The live query, for discarding late "show more" answers.
  const currentQuery = useRef(query);
  useEffect(() => {
    currentQuery.current = query;
  }, [query]);

  // Keep the box in step with the URL (back/forward, header search).
  useEffect(() => setInputValue(query), [query]);

  useEffect(() => {
    if (!query) inputRef.current?.focus();
  }, [query]);

  // Fetch the grouped preview whenever the query changes.
  useEffect(() => {
    setExpanded({});
    setExpanding(null);

    if (!isSearchable) {
      setSections(EMPTY_SECTIONS);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);
    setStatus("loading");

    (async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=${PREVIEW_COUNT}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Search returned ${response.status}`);
        const data = await response.json();

        const next = Object.fromEntries(
          SECTION_CONFIG.map(({ key }) => [
            key,
            {
              results: (data[key]?.results ?? []) as SearchResult[],
              totalCount: Number(data[key]?.totalCount) || 0,
            },
          ])
        ) as Sections;

        setSections(next);
        const known = new Set(SECTION_CONFIG.map((s) => s.key));
        const apiOrder = Array.isArray(data.order)
          ? (data.order as string[]).filter((k): k is SectionKey => known.has(k as SectionKey))
          : [];
        setOrder(
          apiOrder.length === SECTION_CONFIG.length ? apiOrder : SECTION_CONFIG.map((s) => s.key)
        );
        setStatus(data.error ? "error" : "done");

        // Privacy-safe analytics: query length only, never content.
        const total = SECTION_CONFIG.reduce((sum, { key }) => sum + next[key].totalCount, 0);
        trackSearchSubmit(query.length, "all", total > 0);
      } catch (error) {
        // Superseded by a newer query or unmounted: nothing to show.
        if (controller.signal.aborted && !timedOut) return;
        logger.error("Search error", error);
        setSections(EMPTY_SECTIONS);
        setStatus("error");
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, isSearchable]);

  // Jump to #tools etc. once results are on the page.
  useEffect(() => {
    if (status !== "done") return;
    const hash = window.location.hash.slice(1);
    if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [status]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length >= MIN_QUERY_LENGTH && trimmed !== query) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const toggleSection = async (key: SectionKey, type: ResultType) => {
    if (expanded[key]) {
      setExpanded((prev) => ({ ...prev, [key]: false }));
      return;
    }
    // Already have the full list from an earlier expand.
    if (sections[key].results.length >= Math.min(sections[key].totalCount, EXPANDED_COUNT)) {
      setExpanded((prev) => ({ ...prev, [key]: true }));
      return;
    }

    setExpanding(key);
    const forQuery = query;
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(forQuery)}&type=${type}&limit=${EXPANDED_COUNT}`
      );
      if (!response.ok) throw new Error(`Search returned ${response.status}`);
      const data = await response.json();
      // Ignore a late answer for a query the reader has moved on from.
      if (forQuery !== currentQuery.current) return;
      setSections((prev) => ({
        ...prev,
        [key]: {
          results: (data.results ?? []) as SearchResult[],
          totalCount: Number(data.totalCount) || prev[key].totalCount,
        },
      }));
      setExpanded((prev) => ({ ...prev, [key]: true }));
    } catch (error) {
      logger.error(`Could not load more ${key}`, error);
    } finally {
      setExpanding(null);
    }
  };

  const visibleSections = order
    .map((key) => SECTION_CONFIG.find((s) => s.key === key)!)
    .filter(({ key }) => sections[key].results.length > 0);
  const totalCount = SECTION_CONFIG.reduce((sum, { key }) => sum + sections[key].totalCount, 0);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-label-primary">Search</h1>

        <form onSubmit={handleSubmit} role="search" className="mb-6">
          <label htmlFor="site-search" className="sr-only">
            Search HeyPsych
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-tertiary"
            />
            <input
              id="site-search"
              ref={inputRef}
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search conditions, treatments, apps..."
              autoComplete="off"
              enterKeyHint="search"
              className="w-full rounded-full border border-separator bg-surface py-3.5 pl-12 pr-4 text-label-primary shadow-subtle transition-all duration-200 placeholder:text-label-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            />
          </div>
        </form>

        <div aria-live="polite">
          {status === "done" && (
            <p className="mb-8 text-lg text-label-secondary">
              {totalCount.toLocaleString("en-US")} {totalCount === 1 ? "result" : "results"} for{" "}
              <span className="font-semibold text-label-primary">&ldquo;{query}&rdquo;</span>
            </p>
          )}
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center py-12" role="status">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
            <span className="sr-only">Searching…</span>
          </div>
        )}

        {status === "idle" && (
          <EmptyState
            title={query ? "Keep typing" : "Start searching"}
            body={
              query
                ? "Enter at least two characters to search."
                : "Find conditions, treatments, apps, and mental health resources."
            }
          />
        )}

        {status === "error" && visibleSections.length === 0 && (
          <EmptyState
            title="Search is unavailable right now"
            body="Please try again in a moment."
          />
        )}

        {status === "done" && visibleSections.length === 0 && (
          <EmptyState
            title="No results found"
            body={`Nothing matched “${query}”. Try a different spelling, a brand or generic drug name, or a broader term.`}
          />
        )}

        {(status === "done" || status === "error") && visibleSections.length > 0 && (
          <div className="space-y-10">
            {visibleSections.map(({ key, type, label, icon: Icon, iconClass }) => {
              const section = sections[key];
              const isExpanded = Boolean(expanded[key]);
              const shown = isExpanded ? section.results : section.results.slice(0, PREVIEW_COUNT);
              const canExpand = section.totalCount > PREVIEW_COUNT;

              return (
                <section key={key} id={key} aria-labelledby={`${key}-heading`}>
                  <div className="mb-4 flex items-center gap-2 border-b border-separator pb-3">
                    <Icon aria-hidden="true" className={`h-5 w-5 ${iconClass}`} />
                    <h2 id={`${key}-heading`} className="text-lg font-semibold text-label-primary">
                      {label}{" "}
                      <span className="font-normal text-label-tertiary">
                        ({section.totalCount.toLocaleString("en-US")})
                      </span>
                    </h2>
                  </div>

                  <ul className="space-y-2">
                    {shown.map((result) => (
                      <li key={result.href}>
                        <ResultCard result={result} icon={Icon} iconClass={iconClass} terms={terms} />
                      </li>
                    ))}
                  </ul>

                  {canExpand && (
                    <button
                      type="button"
                      onClick={() => toggleSection(key, type)}
                      disabled={expanding === key}
                      aria-expanded={isExpanded}
                      className="mt-4 w-full rounded-xl border border-separator bg-surface px-4 py-2.5 text-sm font-medium text-label-secondary transition-colors hover:bg-surface-grouped hover:text-label-primary disabled:opacity-60"
                    >
                      {expanding === key
                        ? "Loading…"
                        : isExpanded
                          ? "Show less"
                          : section.totalCount <= EXPANDED_COUNT
                            ? `Show all ${section.totalCount} ${label.toLowerCase()}`
                            : `Show top ${EXPANDED_COUNT} ${label.toLowerCase()}`}
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  result,
  icon: Icon,
  iconClass,
  terms,
}: {
  result: SearchResult;
  icon: LucideIcon;
  iconClass: string;
  terms: string[];
}) {
  const snippet = result.snippets?.find((s) => s.snippet?.trim())?.snippet ?? result.description ?? null;

  return (
    <Link
      href={result.href}
      className="block rounded-xl border border-separator bg-surface-grouped px-3 py-2.5 shadow-card-1 transition-all hover:border-accent-border hover:bg-fill-secondary hover:shadow-card-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-start gap-2.5">
        <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-label-primary">
              {safeHighlight(result.name, terms) ?? result.name}
            </h3>
            {result.category && (
              <Badge variant="outline" size="sm" className="shrink-0 text-xs">
                {formatCategory(result.category)}
              </Badge>
            )}
          </div>
          {snippet && (
            <p className="line-clamp-2 text-xs text-label-tertiary">
              {safeHighlight(snippet, terms) ?? snippet}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-separator bg-surface-grouped p-12 text-center">
      <Search aria-hidden="true" className="mx-auto mb-4 h-16 w-16 text-label-quaternary" />
      <h2 className="mb-2 text-xl font-semibold text-label-primary">{title}</h2>
      <p className="text-label-tertiary">{body}</p>
    </div>
  );
}

/** "substance-use-disorders" → "Substance use disorders"; titles pass through. */
function formatCategory(category: string): string {
  if (!/^[a-z0-9_-]+$/.test(category)) return category;
  const words = category.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

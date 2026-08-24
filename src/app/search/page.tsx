"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Pill, Brain, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/utils/logger";
import { trackSearchSubmit } from "@/lib/analytics/product-events";
import { safeHighlight } from "@/lib/utils/safe-highlight";

interface SearchResult {
  type: "treatment" | "condition" | "resource";
  id: string;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  snippets?: Array<{ term: string; field: string; snippet: string }>;
}

interface GroupedResults {
  conditions: SearchResult[];
  treatments: SearchResult[];
  resources: SearchResult[];
  conditionsTotal: number;
  treatmentsTotal: number;
  resourcesTotal: number;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const [groupedResults, setGroupedResults] = useState<GroupedResults>({
    conditions: [],
    treatments: [],
    resources: [],
    conditionsTotal: 0,
    treatmentsTotal: 0,
    resourcesTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState(""); // Track which query the results are for
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    condition: false,
    treatment: false,
    resource: false,
  });

  // Sync input value with URL query
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Auto-focus input when landing on page with no query
  useEffect(() => {
    if (!query && inputRef.current) {
      inputRef.current.focus();
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      return;
    }

    // Create controller for this effect - will be cleaned up on unmount or re-run
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout;

    const fetchResults = async () => {
      setIsLoading(true);

      try {
        // Add timeout to prevent hanging indefinitely
        timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        logger.info('Fetching search results', { query });

        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Search API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        logger.info('Search results received', {
          query,
          conditionsCount: data.conditions?.results?.length || 0,
          treatmentsCount: data.treatments?.results?.length || 0,
          resourcesCount: data.resources?.results?.length || 0,
        });

        const resultsData = {
          conditions: data.conditions?.results || [],
          treatments: data.treatments?.results || [],
          resources: data.resources?.results || [],
          conditionsTotal: Number(data.conditions?.totalCount) || 0,
          treatmentsTotal: Number(data.treatments?.totalCount) || 0,
          resourcesTotal: Number(data.resources?.totalCount) || 0,
        };

        setGroupedResults(resultsData);
        setSearchedQuery(query); // Mark this query as completed

        // Track search analytics (privacy-safe: only length, not content)
        const totalResults = resultsData.conditionsTotal + resultsData.treatmentsTotal + resultsData.resourcesTotal;
        trackSearchSubmit(query.length, "all", totalResults > 0);
      } catch (error: unknown) {
        // Ignore abort errors - they're expected when component unmounts or query changes
        if (error instanceof Error && error.name === 'AbortError') {
          logger.info('Search request aborted', { query });
          return;
        }

        logger.error("Search error", error);

        setGroupedResults({
          conditions: [],
          treatments: [],
          resources: [],
          conditionsTotal: 0,
          treatmentsTotal: 0,
          resourcesTotal: 0,
        });
        setSearchedQuery(query); // Mark this query as completed (with error)
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();

    // Cleanup: abort the request if component unmounts or query changes
    return () => {
      controller.abort();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [query]);

  // Scroll to section based on URL hash after results load
  useEffect(() => {
    if (searchedQuery && !isLoading) {
      const hash = window.location.hash.slice(1); // Remove the #
      if (hash) {
        // Small delay to ensure the section is rendered
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    }
  }, [searchedQuery, isLoading]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case "treatment":
        return <Pill className="h-5 w-5 text-blue-400" />;
      case "condition":
        return <Brain className="h-5 w-5 text-accent" />;
      case "resource":
        return <BookOpen className="h-5 w-5 text-positive-600" />;
      default:
        return null;
    }
  };

  const getResultUrl = (result: SearchResult) => {
    switch (result.type) {
      case "treatment":
        return `/treatments/${result.slug}`;
      case "condition":
        return `/conditions/${result.slug}`;
      case "resource":
        return `/resources/${result.slug}`;
      default:
        return "/";
    }
  };

  const formatCategory = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' & ');
  };

  const toggleCategory = async (category: "condition" | "treatment" | "resource") => {
    const isExpanded = expandedCategories[category];

    if (isExpanded) {
      // Collapse - just update state
      setExpandedCategories((prev) => ({
        ...prev,
        [category]: false,
      }));
    } else {
      // Expand - fetch all results for this category
      setExpandedCategories((prev) => ({
        ...prev,
        [category]: true,
      }));

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=${category}&limit=100`
        );
        const data = await response.json();

        setGroupedResults((prev) => ({
          ...prev,
          [`${category}s` as keyof GroupedResults]: data.results || [],
        }));
      } catch (error) {
        logger.error(`Error fetching expanded ${category} results`, error);
      }
    }
  };

  const getDisplayedResults = (category: "condition" | "treatment" | "resource") => {
    const isExpanded = expandedCategories[category];
    const key = `${category}s` as keyof Pick<GroupedResults, 'conditions' | 'treatments' | 'resources'>;
    const results = groupedResults[key] || [];
    return isExpanded ? results : results.slice(0, 5);
  };

  const renderResult = (result: SearchResult, index: number) => {
    const snippets = result.snippets || [];
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

    return (
      <Link key={result.id} href={getResultUrl(result)}>
        <div className="rounded-xl border border-separator bg-surface-grouped px-3 py-2.5 transition-all hover:border-accent-border hover:bg-fill-secondary shadow-card-1 hover:shadow-card-2">
            <div className="flex items-start gap-2.5">
              {/* Icon */}
              <div className="mt-0.5 shrink-0">{getResultIcon(result.type)}</div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {/* Title and Category */}
                <div className="mb-0.5 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-label-primary hover:text-accent-700 truncate">
                    {result.name}
                  </h3>
                  {result.category && (
                    <Badge variant="outline" size="sm" className="text-xs shrink-0">
                      {formatCategory(result.category)}
                    </Badge>
                  )}
                </div>

                {/* Show snippets from API (with search terms) - XSS-safe rendering */}
                {(() => {
                  // Use API snippets if available - show all snippets with content
                  // even if they don't contain the exact search term (for related matches)
                  const validSnippets = snippets.filter(s => s.snippet && s.snippet.trim().length > 0);

                  if (validSnippets.length > 0) {
                    return (
                      <div className="space-y-0.5">
                        {validSnippets.map((snippet, idx) => {
                          // Use safe highlighting - no dangerouslySetInnerHTML
                          const highlighted = safeHighlight(snippet.snippet, snippet.term);

                          return (
                            <div
                              key={idx}
                              className="text-xs text-label-tertiary overflow-hidden text-ellipsis whitespace-nowrap block"
                            >
                              {highlighted}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // Fallback: use description if it contains search term
                  if (result.description) {
                    const descLower = result.description.toLowerCase();
                    const hasSearchTerm = searchTerms.some(term => descLower.includes(term));

                    if (hasSearchTerm) {
                      // Use safe highlighting - no dangerouslySetInnerHTML
                      const highlighted = safeHighlight(result.description, searchTerms);

                      return (
                        <div className="text-xs text-label-tertiary overflow-hidden text-ellipsis whitespace-nowrap block">
                          {highlighted}
                        </div>
                      );
                    }
                  }

                  return null;
                })()}
              </div>
            </div>
          </div>
      </Link>
    );
  };

  const totalCount =
    groupedResults.conditionsTotal + groupedResults.treatmentsTotal + groupedResults.resourcesTotal;
  const hasResults =
    groupedResults.conditions.length > 0 ||
    groupedResults.treatments.length > 0 ||
    groupedResults.resources.length > 0;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-soft">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-label-primary">Search</h1>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-tertiary" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search conditions, treatments, tools..."
                className="w-full rounded-full border border-separator bg-surface py-3.5 pl-12 pr-4 text-label-primary placeholder:text-label-tertiary shadow-subtle transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              />
            </div>
          </form>

          {query && (
            <div className="text-lg text-label-secondary">
              {Number(totalCount).toLocaleString('en-US')} {totalCount === 1 ? 'result' : 'results'} for{" "}
              <span className="font-semibold text-label-primary">&ldquo;{query}&rdquo;</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent"></div>
          </div>
        )}

        {/* No Query */}
        {!query && !isLoading && (
          <div className="rounded-xl border border-separator bg-surface-grouped p-12 text-center">
            <Search className="mx-auto mb-4 h-16 w-16 text-label-quaternary" />
            <h3 className="mb-2 text-xl font-semibold text-label-primary">Start searching</h3>
            <p className="text-label-tertiary">
              Find conditions, treatments, and mental health resources.
            </p>
          </div>
        )}

        {/* No Results - only show when search for this exact query is complete */}
        {query && !isLoading && searchedQuery === query && !hasResults && (
          <div className="rounded-xl border border-separator bg-surface-grouped p-12 text-center">
            <Search className="mx-auto mb-4 h-16 w-16 text-label-quaternary" />
            <h3 className="mb-2 text-xl font-semibold text-label-primary">No results found</h3>
            <p className="text-label-tertiary">
              No results found for &ldquo;{query}&rdquo;. Try searching with different keywords.
            </p>
          </div>
        )}

        {/* Results Grouped by Type */}
        {!isLoading && hasResults && (
          <div className="space-y-8">
            {/* Conditions */}
            {groupedResults.conditions.length > 0 && (
              <div id="conditions">
                <div className="mb-4 flex items-center gap-2 border-b border-separator pb-3">
                  <Brain className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-semibold text-label-primary">
                    Conditions ({groupedResults.conditionsTotal})
                  </h2>
                </div>
                <div className="space-y-2">
                  {getDisplayedResults("condition").map((result, index) =>
                    renderResult(result, index)
                  )}
                </div>
                {groupedResults.conditionsTotal > 5 && (
                  <button
                    onClick={() => toggleCategory("condition")}
                    className="mt-4 w-full rounded-xl border border-separator bg-surface px-4 py-2.5 text-sm font-medium text-label-secondary transition-colors hover:bg-surface-grouped hover:text-label-primary"
                  >
                    {expandedCategories.condition
                      ? "Show Less"
                      : `Show All ${groupedResults.conditionsTotal} Conditions`}
                  </button>
                )}
              </div>
            )}

            {/* Treatments */}
            {groupedResults.treatments.length > 0 && (
              <div id="treatments">
                <div className="mb-4 flex items-center gap-2 border-b border-separator pb-3">
                  <Pill className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-label-primary">
                    Treatments ({groupedResults.treatmentsTotal})
                  </h2>
                </div>
                <div className="space-y-2">
                  {getDisplayedResults("treatment").map((result, index) =>
                    renderResult(result, index)
                  )}
                </div>
                {groupedResults.treatmentsTotal > 5 && (
                  <button
                    onClick={() => toggleCategory("treatment")}
                    className="mt-4 w-full rounded-xl border border-separator bg-surface px-4 py-2.5 text-sm font-medium text-label-secondary transition-colors hover:bg-surface-grouped hover:text-label-primary"
                  >
                    {expandedCategories.treatment
                      ? "Show Less"
                      : `Show All ${groupedResults.treatmentsTotal} Treatments`}
                  </button>
                )}
              </div>
            )}

            {/* Resources */}
            {groupedResults.resources.length > 0 && (
              <div id="resources">
                <div className="mb-4 flex items-center gap-2 border-b border-separator pb-3">
                  <BookOpen className="h-5 w-5 text-positive-600" />
                  <h2 className="text-lg font-semibold text-label-primary">
                    Resources ({groupedResults.resourcesTotal})
                  </h2>
                </div>
                <div className="space-y-2">
                  {getDisplayedResults("resource").map((result, index) =>
                    renderResult(result, index)
                  )}
                </div>
                {groupedResults.resourcesTotal > 5 && (
                  <button
                    onClick={() => toggleCategory("resource")}
                    className="mt-4 w-full rounded-xl border border-separator bg-surface px-4 py-2.5 text-sm font-medium text-label-secondary transition-colors hover:bg-surface-grouped hover:text-label-primary"
                  >
                    {expandedCategories.resource
                      ? "Show Less"
                      : `Show All ${groupedResults.resourcesTotal} Resources`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

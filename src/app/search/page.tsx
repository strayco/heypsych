"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Pill, Brain, BookOpen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "@/lib/utils/logger";

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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [groupedResults, setGroupedResults] = useState<GroupedResults>({
    conditions: [],
    treatments: [],
    resources: [],
    conditionsTotal: 0,
    treatmentsTotal: 0,
    resourcesTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    condition: false,
    treatment: false,
    resource: false,
  });

  useEffect(() => {
    if (!query) {
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();

        setGroupedResults({
          conditions: data.conditions?.results || [],
          treatments: data.treatments?.results || [],
          resources: data.resources?.results || [],
          conditionsTotal: Number(data.conditions?.totalCount) || 0,
          treatmentsTotal: Number(data.treatments?.totalCount) || 0,
          resourcesTotal: Number(data.resources?.totalCount) || 0,
        });
      } catch (error) {
        logger.error("Search error", error);
        setGroupedResults({
          conditions: [],
          treatments: [],
          resources: [],
          conditionsTotal: 0,
          treatmentsTotal: 0,
          resourcesTotal: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case "treatment":
        return <Pill className="h-5 w-5 text-blue-500" />;
      case "condition":
        return <Brain className="h-5 w-5 text-purple-500" />;
      case "resource":
        return <BookOpen className="h-5 w-5 text-green-500" />;
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
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02 }}
        >
          <div className="rounded-lg border border-neutral-200 bg-white px-1.5 py-1 transition-all hover:border-blue-300 hover:shadow-sm">
            <div className="flex items-start gap-1.5">
              {/* Icon */}
              <div className="mt-0.5 shrink-0">{getResultIcon(result.type)}</div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {/* Title and Category */}
                <div className="mb-0.5 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900 hover:text-blue-600 truncate">
                    {result.name}
                  </h3>
                  {result.category && (
                    <Badge variant="outline" size="sm" className="text-xs shrink-0">
                      {formatCategory(result.category)}
                    </Badge>
                  )}
                </div>

                {/* Show snippets from API (with search terms) */}
                {(() => {
                  // Use API snippets if available - show all snippets with content
                  // even if they don't contain the exact search term (for related matches)
                  const validSnippets = snippets.filter(s => s.snippet && s.snippet.trim().length > 0);

                  if (validSnippets.length > 0) {
                    return (
                      <div className="space-y-0.5">
                        {validSnippets.map((snippet, idx) => {
                          const termPattern = snippet.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          const termRegex = new RegExp(`(${termPattern})`, "gi");
                          const highlighted = snippet.snippet.replace(termRegex, (match) =>
                            `<mark class="bg-yellow-200 px-0.5 font-medium">${match}</mark>`
                          );

                          return (
                            <div
                              key={idx}
                              className="text-xs text-neutral-800 overflow-hidden text-ellipsis whitespace-nowrap block"
                              dangerouslySetInnerHTML={{ __html: highlighted }}
                            />
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
                      let highlighted = result.description;
                      searchTerms.forEach(term => {
                        const termPattern = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const termRegex = new RegExp(`(${termPattern})`, "gi");
                        highlighted = highlighted.replace(termRegex, (match) =>
                          `<mark class="bg-yellow-200 px-0.5 font-medium">${match}</mark>`
                        );
                      });

                      return (
                        <div
                          className="text-xs text-neutral-800 overflow-hidden text-ellipsis whitespace-nowrap block"
                          dangerouslySetInnerHTML={{ __html: highlighted }}
                        />
                      );
                    }
                  }

                  return null;
                })()}
              </div>
            </div>
          </div>
        </motion.div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">Search Results</h1>
          </div>

          {query && (
            <div className="text-lg text-neutral-800">
              {Number(totalCount).toLocaleString('en-US')} {totalCount === 1 ? 'result' : 'results'} for{" "}
              <span className="font-semibold">"{query}"</span>
            </div>
          )}
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* No Query */}
        {!query && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-xl font-semibold text-neutral-900">No search query</h3>
              <p className="text-neutral-800">
                Use the search bar above to search for treatments, conditions, and resources.
              </p>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {query && !isLoading && !hasResults && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-xl font-semibold text-neutral-900">No results found</h3>
              <p className="text-neutral-800">
                No results found for "{query}". Try searching with different keywords.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Grouped by Type */}
        {!isLoading && hasResults && (
          <div className="space-y-6">
            {/* Conditions */}
            {groupedResults.conditions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="mb-3 flex items-center gap-2 border-b border-neutral-200 pb-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Conditions ({groupedResults.conditionsTotal})
                  </h2>
                </div>
                <div className="space-y-1.5">
                  {getDisplayedResults("condition").map((result, index) =>
                    renderResult(result, index)
                  )}
                </div>
                {groupedResults.conditionsTotal > 5 && (
                  <button
                    onClick={() => toggleCategory("condition")}
                    className="mt-3 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {expandedCategories.condition
                      ? "Show Less"
                      : `Show All ${groupedResults.conditionsTotal} Conditions`}
                  </button>
                )}
              </motion.div>
            )}

            {/* Treatments */}
            {groupedResults.treatments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="mb-3 flex items-center gap-2 border-b border-neutral-200 pb-2">
                  <Pill className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Treatments ({groupedResults.treatmentsTotal})
                  </h2>
                </div>
                <div className="space-y-1.5">
                  {getDisplayedResults("treatment").map((result, index) =>
                    renderResult(result, index)
                  )}
                </div>
                {groupedResults.treatmentsTotal > 5 && (
                  <button
                    onClick={() => toggleCategory("treatment")}
                    className="mt-3 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {expandedCategories.treatment
                      ? "Show Less"
                      : `Show All ${groupedResults.treatmentsTotal} Treatments`}
                  </button>
                )}
              </motion.div>
            )}

            {/* Resources */}
            {groupedResults.resources.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="mb-3 flex items-center gap-2 border-b border-neutral-200 pb-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">
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
                    className="mt-3 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {expandedCategories.resource
                      ? "Show Less"
                      : `Show All ${groupedResults.resourcesTotal} Resources`}
                  </button>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

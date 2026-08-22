"use client";

// Search Form Client Component
// Tracks search submissions and filter applications

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";
import {
  trackToolsSearchSubmit,
  trackToolsFilterApply,
} from "@/lib/analytics/product-events";

interface SearchFormClientProps {
  initialQuery: string;
  initialAudience?: string;
  initialHub?: string;
  initialHipaa: boolean;
  initialFree: boolean;
  initialSort: string;
  resultCount: number;
}

export function SearchFormClient({
  initialQuery,
  initialAudience,
  initialHub,
  initialHipaa,
  initialFree,
  initialSort,
  resultCount,
}: SearchFormClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [audience, setAudience] = useState(initialAudience || "");
  const [hipaa, setHipaa] = useState(initialHipaa);
  const [free, setFree] = useState(initialFree);
  const [sort, setSort] = useState(initialSort);

  // Track search results when they change (page load with results)
  useEffect(() => {
    if (initialQuery && resultCount >= 0) {
      trackToolsSearchSubmit(initialQuery.length, resultCount, initialAudience);
    }
  }, [initialQuery, resultCount, initialAudience]);

  const buildSearchUrl = useCallback(
    (overrides?: {
      q?: string;
      audience?: string;
      hipaa?: boolean;
      free?: boolean;
      sort?: string;
    }) => {
      const params = new URLSearchParams();
      const q = overrides?.q ?? query;
      const aud = overrides?.audience ?? audience;
      const h = overrides?.hipaa ?? hipaa;
      const f = overrides?.free ?? free;
      const s = overrides?.sort ?? sort;

      if (q) params.set("q", q);
      if (aud) params.set("audience", aud);
      if (initialHub) params.set("hub", initialHub);
      if (h) params.set("hipaa", "true");
      if (f) params.set("free", "true");
      if (s && s !== "relevance") params.set("sort", s);

      return `/tools/search?${params.toString()}`;
    },
    [query, audience, hipaa, free, sort, initialHub]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      router.push(buildSearchUrl());
    },
    [router, buildSearchUrl]
  );

  const handleAudienceChange = useCallback(
    (newAudience: string) => {
      setAudience(newAudience);
      if (newAudience !== audience) {
        trackToolsFilterApply("audience", newAudience || "all", newAudience);
        router.push(buildSearchUrl({ audience: newAudience }));
      }
    },
    [audience, router, buildSearchUrl]
  );

  const handleHipaaChange = useCallback(
    (checked: boolean) => {
      setHipaa(checked);
      if (checked !== hipaa) {
        trackToolsFilterApply("hipaa", checked ? "true" : "false", audience);
        router.push(buildSearchUrl({ hipaa: checked }));
      }
    },
    [hipaa, audience, router, buildSearchUrl]
  );

  const handleFreeChange = useCallback(
    (checked: boolean) => {
      setFree(checked);
      if (checked !== free) {
        trackToolsFilterApply("free_tier", checked ? "true" : "false", audience);
        router.push(buildSearchUrl({ free: checked }));
      }
    },
    [free, audience, router, buildSearchUrl]
  );

  const handleSortChange = useCallback(
    (newSort: string) => {
      setSort(newSort);
      if (newSort !== sort) {
        trackToolsFilterApply("sort", newSort, audience);
        router.push(buildSearchUrl({ sort: newSort }));
      }
    },
    [sort, audience, router, buildSearchUrl]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Main Search Input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-tertiary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools, apps, platforms..."
          className="h-12 w-full rounded-xl border border-separator bg-canvas pl-12 pr-4 text-base text-label-primary placeholder:text-label-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
          autoComplete="off"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-label-tertiary">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>

        {/* Audience Filter */}
        <select
          value={audience}
          onChange={(e) => handleAudienceChange(e.target.value)}
          className="h-9 rounded-lg border border-separator bg-surface px-3 text-sm text-label-primary focus:border-accent focus:outline-none"
        >
          <option value="">All audiences</option>
          <option value="patient">For Patients</option>
          <option value="clinician">For Clinicians</option>
        </select>

        {/* HIPAA Filter */}
        <label className="flex items-center gap-2 rounded-lg border border-separator bg-surface px-3 py-1.5 text-sm cursor-pointer hover:bg-fill-secondary transition-colors">
          <input
            type="checkbox"
            checked={hipaa}
            onChange={(e) => handleHipaaChange(e.target.checked)}
            className="h-4 w-4 rounded border-separator text-accent focus:ring-accent"
          />
          <span className="text-label-primary">HIPAA Compliant</span>
        </label>

        {/* Free Filter */}
        <label className="flex items-center gap-2 rounded-lg border border-separator bg-surface px-3 py-1.5 text-sm cursor-pointer hover:bg-fill-secondary transition-colors">
          <input
            type="checkbox"
            checked={free}
            onChange={(e) => handleFreeChange(e.target.checked)}
            className="h-4 w-4 rounded border-separator text-accent focus:ring-accent"
          />
          <span className="text-label-primary">Free Tier</span>
        </label>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="h-9 rounded-lg border border-separator bg-surface px-3 text-sm text-label-primary focus:border-accent focus:outline-none"
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="rating">Sort: Rating</option>
          <option value="name">Sort: A-Z</option>
        </select>

        {/* Submit */}
        <button
          type="submit"
          className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}

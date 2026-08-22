"use client";

// Tools Hero Search Component
// Client-side search with URL-backed state

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { trackToolsSearchSubmit } from "@/lib/analytics/product-events";

export function ToolsHeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        // Track search submission (result count will be tracked on results page)
        trackToolsSearchSubmit(query.trim().length, 0);
        // Navigate to search results with query
        router.push(`/tools/search?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [query, router]
  );

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-tertiary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools, apps, platforms..."
          className="h-12 w-full rounded-xl border border-separator bg-surface pl-12 pr-12 text-base text-label-primary placeholder:text-label-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-label-tertiary hover:bg-fill-secondary hover:text-label-secondary transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick suggestions */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-label-tertiary">Popular:</span>
        {["therapy apps", "AI scribes", "anxiety", "mood tracker"].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setQuery(suggestion);
              trackToolsSearchSubmit(suggestion.length, 0);
              router.push(`/tools/search?q=${encodeURIComponent(suggestion)}`);
            }}
            className="rounded-full bg-fill-tertiary px-3 py-1 text-xs font-medium text-label-secondary hover:bg-fill-secondary transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </form>
  );
}

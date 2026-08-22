"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { Entity } from "@/lib/types/database";

interface ResourceSearchProps {
  resources: Entity[];
}

export function ResourceSearch({ resources }: ResourceSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter resources based on search query - using useMemo to compute synchronously
  const filteredResources = useMemo(() => {
    if (query.length === 0) return [];

    const lowerQuery = query.toLowerCase();
    return resources
      .filter((resource) => {
        const name = (resource.name || "").toLowerCase();
        const description = (resource.description || "").toLowerCase();
        const keywords = (resource.seo?.keywords || resource.tags || []).join(" ").toLowerCase();

        return (
          name.includes(lowerQuery) ||
          description.includes(lowerQuery) ||
          keywords.includes(lowerQuery)
        );
      })
      .slice(0, 8); // Show max 8 results
  }, [query, resources]);

  // Sync isOpen state with query changes
  useEffect(() => {
    if (query.length === 0) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      // Go to full search results, scroll to resources section
      router.push(`/search?q=${encodeURIComponent(query.trim())}#resources`);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-5 w-5 text-label-primary0" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredResources.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder="Search resources (PHQ-9, therapy, crisis support...)"
          className="w-full rounded-xl border border-separator bg-surface-grouped py-3 pl-12 pr-12 text-label-primary placeholder:text-label-quaternary transition-all focus:border-separator focus:outline-none focus:ring-2 focus:ring-separator hover:border-separator"
        />

        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-label-primary0 hover:text-label-secondary"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Typeahead dropdown */}
      {isOpen && filteredResources.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-separator bg-surface-grouped shadow-card-2">
          <div className="max-h-96 overflow-y-auto p-2">
            {filteredResources.map((resource) => (
              <Link
                key={resource.slug}
                href={`/resources/${resource.slug}`}
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                }}
                className="block rounded-lg px-4 py-3 transition-colors hover:bg-fill-secondary"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-label-primary">
                      {resource.name}
                    </div>
                    {resource.description && (
                      <div className="mt-1 line-clamp-2 text-sm text-label-secondary">
                        {resource.description}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-label-tertiary">
                      {resource.metadata?.category?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredResources.length === 8 && (
            <div className="border-t border-separator px-4 py-2 text-center text-xs text-label-primary0">
              Showing first 8 results
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {isOpen && query && filteredResources.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-separator bg-surface-grouped p-6 text-center shadow-card-2">
          <p className="text-sm text-label-secondary">
            No resources found for "{query}"
          </p>
          <p className="mt-2 text-xs text-label-tertiary">
            Try different keywords or browse categories below
          </p>
        </div>
      )}
    </div>
  );
}

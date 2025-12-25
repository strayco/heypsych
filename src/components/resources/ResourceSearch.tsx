"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { Entity } from "@/lib/types";

interface ResourceSearchProps {
  resources: Entity[];
}

export function ResourceSearch({ resources }: ResourceSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredResources, setFilteredResources] = useState<Entity[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter resources based on search query
  useEffect(() => {
    if (query.length === 0) {
      setFilteredResources([]);
      setIsOpen(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = resources
      .filter((resource) => {
        const name = (resource.name || resource.title || "").toLowerCase();
        const summary = (resource.summary || "").toLowerCase();
        const keywords = (resource.search?.keywords || []).join(" ").toLowerCase();

        return (
          name.includes(lowerQuery) ||
          summary.includes(lowerQuery) ||
          keywords.includes(lowerQuery)
        );
      })
      .slice(0, 8); // Show max 8 results

    setFilteredResources(filtered);
    setIsOpen(filtered.length > 0);
  }, [query, resources]);

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
    setFilteredResources([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-5 w-5 text-neutral-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (filteredResources.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder="Search resources (PHQ-9, therapy, crisis support...)"
          className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-12 pr-12 text-neutral-900 placeholder-neutral-500 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />

        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-neutral-600"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Typeahead dropdown */}
      {isOpen && filteredResources.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl">
          <div className="max-h-96 overflow-y-auto p-2">
            {filteredResources.map((resource) => (
              <Link
                key={resource.slug}
                href={`/resources/${resource.slug}`}
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                }}
                className="block rounded-lg px-4 py-3 transition-colors hover:bg-neutral-50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-neutral-900">
                      {resource.name || resource.title}
                    </div>
                    {resource.summary && (
                      <div className="mt-1 line-clamp-2 text-sm text-neutral-600">
                        {resource.summary}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-neutral-500">
                      {resource.metadata?.category?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredResources.length === 8 && (
            <div className="border-t border-neutral-100 px-4 py-2 text-center text-xs text-neutral-500">
              Showing first 8 results
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {isOpen && query && filteredResources.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-lg">
          <p className="text-sm text-neutral-600">
            No resources found for "{query}"
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Try different keywords or browse categories below
          </p>
        </div>
      )}
    </div>
  );
}

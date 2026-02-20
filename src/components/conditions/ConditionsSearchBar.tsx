"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { Entity } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";

interface ConditionsSearchBarProps {
  conditions: Entity[];
  placeholder?: string;
}

/**
 * ConditionsSearchBar Component
 *
 * Typeahead search bar for finding mental health conditions.
 * Features:
 * - Fuzzy search on condition names + aliases
 * - Typeahead dropdown (top 5 matches)
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Mobile-friendly touch targets
 * - Reserved space to prevent CLS (Cumulative Layout Shift)
 *
 * Based on existing CrisisSearchInput pattern with enhancements.
 */
export function ConditionsSearchBar({
  conditions,
  placeholder = "Search conditions... (e.g., ADHD, Depression, Anxiety)",
}: ConditionsSearchBarProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter conditions based on search term
  const filteredConditions = React.useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();

    return conditions
      .filter((condition) => {
        const nameMatch = condition.name.toLowerCase().includes(term);

        // Check aliases if they exist (from condition.metadata.aliases or condition.data.metadata.aliases)
        const aliases =
          condition.metadata?.aliases ||
          (condition.data as any)?.metadata?.aliases ||
          [];
        const aliasMatch = aliases.some((alias: string) =>
          alias.toLowerCase().includes(term)
        );

        return nameMatch || aliasMatch;
      })
      .slice(0, 5); // Top 5 matches
  }, [searchTerm, conditions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || filteredConditions.length === 0) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredConditions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredConditions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredConditions.length) {
          // Navigate to selected condition
          const selected = filteredConditions[highlightedIndex];
          router.push(`/conditions/${selected.slug}`);
        } else if (searchTerm.trim()) {
          // No item selected - go to full search results, scroll to conditions section
          router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}#conditions`);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  }

  function clearSearch() {
    setSearchTerm("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pl-12 pr-10",
            "text-slate-900 placeholder-slate-400",
            "transition-all duration-200",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200",
            "hover:border-slate-400"
          )}
          aria-label="Search mental health conditions"
          aria-autocomplete="list"
          aria-controls="conditions-search-results"
          aria-expanded={isOpen && filteredConditions.length > 0}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Typeahead Dropdown */}
      {isOpen && filteredConditions.length > 0 && (
        <div
          ref={dropdownRef}
          id="conditions-search-results"
          className={cn(
            "absolute z-50 mt-2 w-full",
            "rounded-lg border border-slate-200 bg-white shadow-lg",
            "overflow-hidden"
          )}
          role="listbox"
        >
          {filteredConditions.map((condition, index) => {
            const category =
              condition.metadata?.category || (condition.data as any)?.metadata?.category;

            return (
              <Link
                key={condition.slug}
                href={`/conditions/${condition.slug}`}
                className={cn(
                  "block px-4 py-3 transition-colors",
                  "hover:bg-blue-50",
                  index === highlightedIndex && "bg-blue-50",
                  index !== filteredConditions.length - 1 && "border-b border-slate-100"
                )}
                role="option"
                aria-selected={index === highlightedIndex}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="font-medium text-slate-900">{condition.name}</div>
                {category && (
                  <div className="text-xs text-slate-600 mt-0.5">
                    Category: {category.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchTerm && filteredConditions.length === 0 && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 mt-2 w-full",
            "rounded-lg border border-slate-200 bg-white shadow-lg",
            "px-4 py-3 text-center text-sm text-slate-600"
          )}
        >
          No conditions found for "{searchTerm}"
        </div>
      )}

      {/* Reserved space for dropdown to prevent CLS */}
      {!isOpen && <div className="h-0" aria-hidden="true" />}
    </div>
  );
}

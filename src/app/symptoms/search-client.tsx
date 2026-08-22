"use client";

/**
 * Symptoms Search Client Component
 *
 * Client-side search enhancement for the symptoms hub.
 * Provides instant search with privacy-safe behavior.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, AlertTriangle, ArrowRight } from "lucide-react";
import type { SymptomSearchIndexEntry, SymptomSearchResult } from "@/domains/symptoms/types";
import { searchSymptoms, checkForSafetyKeywords } from "@/domains/symptoms";
import { cn } from "@/lib/utils";

interface SymptomsSearchClientProps {
  searchIndex: SymptomSearchIndexEntry[];
  suggestedPrompts: Array<{ text: string; slug: string }>;
}

export function SymptomsSearchClient({
  searchIndex,
  suggestedPrompts,
}: SymptomsSearchClientProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymptomSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSafetyPanel, setShowSafetyPanel] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Perform search when query changes
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowSafetyPanel(false);
      return;
    }

    // Check for safety keywords (local only, no transmission)
    if (checkForSafetyKeywords(query)) {
      setShowSafetyPanel(true);
    } else {
      setShowSafetyPanel(false);
    }

    // Perform search
    const searchResults = searchSymptoms(query, searchIndex, { limit: 6 });
    setResults(searchResults);
    setSelectedIndex(-1);
  }, [query, searchIndex]);

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) {
        if (e.key === "ArrowDown" && query.length > 0) {
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            router.push(`/symptoms/${results[selectedIndex].slug}`);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [isOpen, results, selectedIndex, router, query]
  );

  // Handle prompt click
  const handlePromptClick = (slug: string) => {
    router.push(`/symptoms/${slug}`);
  };

  // Handle clear
  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setShowSafetyPanel(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div
        className={cn(
          "relative flex items-center rounded-2xl bg-surface shadow-subtle transition-all",
          isOpen && results.length > 0 && "rounded-b-none shadow-card-2"
        )}
      >
        <Search className="ml-4 h-5 w-5 shrink-0 text-label-tertiary" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="What have you been noticing?"
          className="h-14 flex-1 bg-transparent px-3 text-label-primary placeholder:text-label-tertiary focus:outline-none"
          role="combobox"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="symptom-search-results"
          aria-autocomplete="list"
          aria-activedescendant={
            selectedIndex >= 0 ? `result-${selectedIndex}` : undefined
          }
        />
        {query && (
          <button
            onClick={handleClear}
            className="mr-3 rounded-full p-1.5 text-label-tertiary hover:bg-fill-tertiary hover:text-label-secondary"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Safety Panel */}
      {showSafetyPanel && (
        <div className="mt-4 rounded-xl border border-caution/30 bg-caution-tint p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-caution" />
            <div>
              <p className="font-medium text-label-primary">
                If you&apos;re in crisis or having thoughts of self-harm
              </p>
              <p className="mt-1 text-sm text-label-secondary">
                This tool cannot assess immediate risk. Please reach out for
                support:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="tel:988"
                  className="inline-flex items-center rounded-lg bg-surface px-3 py-2 text-sm font-medium text-label-primary shadow-subtle hover:shadow-card-2"
                >
                  988 Suicide & Crisis Lifeline
                </a>
                <Link
                  href="/resources/support-community/immediate-crisis"
                  className="inline-flex items-center rounded-lg bg-surface px-3 py-2 text-sm font-medium text-label-primary shadow-subtle hover:shadow-card-2"
                >
                  More crisis resources
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <p className="mt-3 text-sm text-label-tertiary">
                You can still explore symptom information below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          id="symptom-search-results"
          role="listbox"
          className="absolute left-0 right-0 z-50 rounded-b-2xl border-t border-separator bg-surface shadow-elevated"
        >
          {results.map((result, index) => (
            <Link
              key={result.slug}
              id={`result-${index}`}
              href={`/symptoms/${result.slug}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                "flex items-start gap-3 px-4 py-3 transition-colors",
                index === selectedIndex
                  ? "bg-accent-tint"
                  : "hover:bg-fill-quaternary",
                index === results.length - 1 && "rounded-b-2xl"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex-1">
                <div className="font-medium text-label-primary">
                  {result.name}
                </div>
                <div className="mt-0.5 line-clamp-1 text-sm text-label-secondary">
                  {result.shortDefinition}
                </div>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-label-quaternary" />
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {isOpen && query.length >= 2 && results.length === 0 && !showSafetyPanel && (
        <div
          ref={resultsRef}
          className="absolute left-0 right-0 z-50 rounded-b-2xl border-t border-separator bg-surface px-4 py-6 text-center shadow-elevated"
        >
          <p className="text-label-secondary">
            No matching symptoms found for &ldquo;{query}&rdquo;
          </p>
          <p className="mt-1 text-sm text-label-tertiary">
            Try different words or browse categories below
          </p>
        </div>
      )}

      {/* Suggested Prompts */}
      {!query && (
        <div className="mt-4">
          <p className="text-center text-sm text-label-tertiary">
            Or try describing what you&apos;re experiencing:
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt.slug}
                onClick={() => handlePromptClick(prompt.slug)}
                className="rounded-full border border-separator bg-surface px-4 py-2 text-sm text-label-secondary transition-all hover:border-accent/30 hover:bg-accent-tint hover:text-accent"
              >
                &ldquo;{prompt.text}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screen reader announcement for results count */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {results.length > 0 && (
          <>
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </>
        )}
        {query.length >= 2 && results.length === 0 && "No results found"}
      </div>
    </div>
  );
}

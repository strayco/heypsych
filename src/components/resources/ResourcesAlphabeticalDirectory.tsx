"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import type { Entity } from "@/lib/types/database";

interface ResourcesAlphabeticalDirectoryProps {
  resources: Entity[];
  page?: number;
}

const ITEMS_PER_PAGE = 30;
const SCROLL_FLAG_KEY = "az-section-scroll";

export function ResourcesAlphabeticalDirectory({ resources, page = 1 }: ResourcesAlphabeticalDirectoryProps) {
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);

  // Scroll to A-Z section only when explicitly navigating within the section
  useEffect(() => {
    // Check if this navigation was triggered by clicking within the A-Z section
    const shouldScroll = sessionStorage.getItem(SCROLL_FLAG_KEY) === "true";

    if (shouldScroll && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      // Clear the flag after scrolling
      sessionStorage.removeItem(SCROLL_FLAG_KEY);
    }
  }, [page]);

  // Set flag when clicking navigation elements within A-Z section
  const handleAZNavigation = () => {
    sessionStorage.setItem(SCROLL_FLAG_KEY, "true");
  };

  // Pagination logic
  const { paginatedResources, totalPages } = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginated = resources.slice(startIndex, endIndex);
    const total = Math.ceil(resources.length / ITEMS_PER_PAGE);
    return { paginatedResources: paginated, totalPages: total };
  }, [resources, page]);

  // Group paginated resources by first letter
  const groupedResources: Record<string, Entity[]> = {};

  paginatedResources.forEach((resource) => {
    const firstLetter = (resource.name || "").charAt(0).toUpperCase();
    if (!groupedResources[firstLetter]) {
      groupedResources[firstLetter] = [];
    }
    groupedResources[firstLetter].push(resource);
  });

  // Sort each group alphabetically
  Object.keys(groupedResources).forEach((letter) => {
    groupedResources[letter].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  });

  const letters = Object.keys(groupedResources).sort();

  // Calculate letter index for navigation (which page each letter starts on)
  const letterIndex = useMemo(() => {
    const index: Record<string, number> = {};
    resources.forEach((resource, idx) => {
      const firstLetter = (resource.name || "").charAt(0).toUpperCase();
      if (!index[firstLetter]) {
        index[firstLetter] = Math.floor(idx / ITEMS_PER_PAGE) + 1;
      }
    });
    return index;
  }, [resources]);

  // All possible letters for navigation
  const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Calculate which letters are actually visible on the current page
  const lettersOnCurrentPage = useMemo(() => {
    const lettersSet = new Set<string>();
    paginatedResources.forEach((resource) => {
      const firstLetter = (resource.name || "").charAt(0).toUpperCase();
      lettersSet.add(firstLetter);
    });
    return lettersSet;
  }, [paginatedResources]);

  const toggleLetter = (letter: string) => {
    const newExpanded = new Set(expandedLetters);
    if (newExpanded.has(letter)) {
      newExpanded.delete(letter);
    } else {
      newExpanded.add(letter);
    }
    setExpandedLetters(newExpanded);
  };

  return (
    <div ref={sectionRef} className="mt-12 border-t border-neutral-200 pt-8">
      <h2 className="mb-6 text-2xl font-bold text-neutral-900">
        All Resources A-Z
      </h2>

      {/* Letter Navigation Bar */}
      <div className="mb-6">
        <div className="mb-3 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {allLetters.map((letter) => {
              const hasResources = letterIndex[letter] !== undefined;
              const isVisibleOnPage = lettersOnCurrentPage.has(letter);
              const targetPage = letterIndex[letter] || 1;

              return (
                <Link
                  key={letter}
                  href={hasResources ? `/resources?page=${targetPage}` : "#"}
                  scroll={false}
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-all
                    ${
                      hasResources
                        ? isVisibleOnPage
                          ? "bg-blue-500 text-white shadow-md ring-2 ring-blue-200 ring-offset-2"
                          : "bg-white border-2 border-neutral-300 text-neutral-800 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
                        : "bg-neutral-100 border-2 border-neutral-200 text-neutral-400 cursor-not-allowed"
                    }
                  `}
                  onClick={(e) => {
                    if (!hasResources) {
                      e.preventDefault();
                    } else {
                      handleAZNavigation();
                    }
                  }}
                  title={
                    hasResources
                      ? isVisibleOnPage
                        ? `${letter} (visible on this page)`
                        : `Go to page ${targetPage} for ${letter}`
                      : `No resources starting with ${letter}`
                  }
                >
                  {letter}
                </Link>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-neutral-600">
          <span className="font-semibold">Highlighted letters</span> are currently visible on this page.
          Click any letter to jump to its page.
        </p>
      </div>

      {/* Desktop: Multi-column layout */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-3 gap-x-8 gap-y-6">
          {letters.map((letter) => (
            <div key={letter}>
              <h3 className="mb-3 text-lg font-semibold text-neutral-800">
                {letter}
              </h3>
              <ul className="space-y-2">
                {groupedResources[letter].map((resource) => {
                  // Support & Community resources link to category page, not individual pages
                  const isSupportResource = resource.metadata?.category === "support-community";
                  const href = isSupportResource
                    ? "/resources/support-community"
                    : `/resources/${resource.slug}`;

                  return (
                    <li key={resource.slug}>
                      <Link
                        href={href}
                        className="text-sm text-neutral-700 hover:text-blue-600 hover:underline"
                      >
                        {resource.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile/Tablet: Collapsible per letter */}
      <div className="lg:hidden space-y-4">
        {letters.map((letter) => {
          const isExpanded = expandedLetters.has(letter);

          return (
            <div key={letter} className="border border-neutral-200 rounded-lg">
              <button
                onClick={() => toggleLetter(letter)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                aria-expanded={isExpanded}
              >
                <span className="text-lg font-semibold text-neutral-800">
                  {letter}
                </span>
                <span className="flex items-center gap-2 text-sm text-neutral-600">
                  <span>{groupedResources[letter].length} resources</span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </span>
              </button>

              {/* Always render links in DOM for crawlability */}
              {/* Use max-height transition instead of display:none for SEO */}
              <ul
                className={`space-y-2 overflow-hidden px-4 transition-all duration-300 ${
                  isExpanded ? "max-h-[2000px] pb-3" : "max-h-0"
                }`}
              >
                {groupedResources[letter].map((resource) => {
                  // Support & Community resources link to category page, not individual pages
                  const isSupportResource = resource.metadata?.category === "support-community";
                  const href = isSupportResource
                    ? "/resources/support-community"
                    : `/resources/${resource.slug}`;

                  return (
                    <li key={resource.slug}>
                      <Link
                        href={href}
                        className="text-sm text-neutral-700 hover:text-blue-600 hover:underline"
                      >
                        {resource.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8" onClick={handleAZNavigation}>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/resources"
          />
        </div>
      )}

      <p className="mt-6 text-sm text-neutral-600">
        {totalPages > 1 ? (
          <>
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(page * ITEMS_PER_PAGE, resources.length)} of {resources.length} resources
          </>
        ) : (
          <>{resources.length} resources available</>
        )}
      </p>
    </div>
  );
}

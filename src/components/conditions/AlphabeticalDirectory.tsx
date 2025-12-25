"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Entity } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";

interface AlphabeticalDirectoryProps {
  conditions: Entity[];
}

/**
 * Alphabetical Directory Component
 *
 * CRITICAL FOR SEO: All conditions listed A–Z with plain <a href> links in the DOM.
 * No JavaScript-only navigation. Links must be crawlable on initial render (SSR/SSG).
 *
 * Features:
 * - Groups conditions by first letter (A-Z)
 * - Skips letters with no conditions
 * - Mobile: collapsible sections per letter (links remain in DOM, just visually hidden)
 * - Desktop: multi-column layout
 * - Next.js <Link> is used (renders as <a href> in HTML)
 *
 * Based on existing CrisisLetterIndex pattern.
 */
export function AlphabeticalDirectory({ conditions }: AlphabeticalDirectoryProps) {
  // Group conditions by first letter
  const groupedConditions = React.useMemo(() => {
    const groups: Record<string, Entity[]> = {};

    conditions.forEach((condition) => {
      const firstLetter = condition.name.charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstLetter)) {
        if (!groups[firstLetter]) {
          groups[firstLetter] = [];
        }
        groups[firstLetter].push(condition);
      }
    });

    // Sort conditions within each letter
    Object.keys(groups).forEach((letter) => {
      groups[letter].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [conditions]);

  const availableLetters = Object.keys(groupedConditions).sort();

  // Mobile: track expanded sections
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(
    new Set(availableLetters)
  );

  function toggleLetter(letter: string) {
    setExpandedLetters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(letter)) {
        newSet.delete(letter);
      } else {
        newSet.add(letter);
      }
      return newSet;
    });
  }

  if (availableLetters.length === 0) {
    return null;
  }

  return (
    <section className="bg-slate-50 border-t border-slate-200 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          All Conditions A–Z
        </h2>
        <p className="mb-8 text-center text-sm text-slate-600">
          Complete directory of mental health conditions
        </p>

        <div className="space-y-6">
          {availableLetters.map((letter) => {
            const letterConditions = groupedConditions[letter];
            const isExpanded = expandedLetters.has(letter);

            return (
              <div
                key={letter}
                className="rounded-lg border border-slate-200 bg-white shadow-sm"
              >
                {/* Letter Header (mobile: clickable to expand/collapse) */}
                <button
                  onClick={() => toggleLetter(letter)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3",
                    "text-left font-bold text-slate-900",
                    "transition-colors hover:bg-slate-50",
                    "sm:cursor-default sm:pointer-events-none"
                  )}
                  aria-expanded={isExpanded}
                  aria-controls={`letter-${letter}-content`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xl font-bold text-blue-700">
                      {letter}
                    </div>
                    <span className="text-sm text-slate-600">
                      {letterConditions.length} condition{letterConditions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {/* Mobile expand/collapse icon */}
                  <span className="sm:hidden">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </span>
                </button>

                {/* Conditions List (always in DOM, just hidden on mobile when collapsed) */}
                <div
                  id={`letter-${letter}-content`}
                  className={cn(
                    "border-t border-slate-100 px-4 py-4",
                    // Mobile: hide with display-none (links still in DOM)
                    // Desktop: always visible
                    !isExpanded && "hidden sm:block"
                  )}
                >
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {letterConditions.map((condition) => (
                      <li key={condition.slug}>
                        <Link
                          href={`/conditions/${condition.slug}`}
                          className={cn(
                            "block rounded-md px-3 py-2 text-sm text-slate-700",
                            "transition-colors hover:bg-blue-50 hover:text-blue-700"
                          )}
                        >
                          {condition.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

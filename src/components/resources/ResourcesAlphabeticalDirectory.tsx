"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Entity } from "@/lib/types/database";

interface ResourcesAlphabeticalDirectoryProps {
  resources: Entity[];
}

export function ResourcesAlphabeticalDirectory({ resources }: ResourcesAlphabeticalDirectoryProps) {
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set());

  // Group resources by first letter
  const groupedResources: Record<string, Entity[]> = {};

  resources.forEach((resource) => {
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
    <div className="mt-12 border-t border-neutral-200 pt-8">
      <h2 className="mb-6 text-2xl font-bold text-neutral-900">
        All Resources A-Z
      </h2>

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

      <p className="mt-6 text-sm text-neutral-600">
        {resources.length} resources available
      </p>
    </div>
  );
}

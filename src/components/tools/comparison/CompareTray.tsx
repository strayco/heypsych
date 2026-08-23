"use client";

/**
 * CompareTray
 *
 * Floating tray at the bottom of the screen for managing selected tools.
 * Shows selected tools with quick-add search.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ToolManifestEntry {
  slug: string;
  name: string;
  category: string;
  company?: string;
}

interface CompareTrayProps {
  selectedSlugs: string[];
  toolsManifest: ToolManifestEntry[];
  onToggle: (slug: string) => void;
  onRemove: (slug: string) => void;
  onClear: () => void;
}

export function CompareTray({
  selectedSlugs,
  toolsManifest,
  onToggle,
  onRemove,
  onClear,
}: CompareTrayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Filter tools for quick-add
  const quickAddResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return toolsManifest
      .filter(
        (t) =>
          !selectedSlugs.includes(t.slug) &&
          (t.name.toLowerCase().includes(query) ||
            t.company?.toLowerCase().includes(query))
      )
      .slice(0, 5);
  }, [searchQuery, toolsManifest, selectedSlugs]);

  // Selected tools info
  const selectedTools = useMemo(() => {
    return selectedSlugs
      .map((slug) => toolsManifest.find((t) => t.slug === slug))
      .filter(Boolean) as ToolManifestEntry[];
  }, [selectedSlugs, toolsManifest]);

  const handleAddTool = useCallback(
    (slug: string) => {
      onToggle(slug);
      setSearchQuery("");
      setIsExpanded(false);
    },
    [onToggle]
  );

  // Don't show tray if no tools selected and not expanded
  if (selectedSlugs.length === 0 && !isExpanded) {
    return null;
  }

  const canAddMore = selectedSlugs.length < 4;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4">
      <div
        className={cn(
          "bg-surface/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-separator",
          "transition-all duration-300 ease-out"
        )}
      >
        {/* Collapsed view: selected tools pills */}
        <div className="p-3 flex items-center gap-2 flex-wrap">
          {selectedTools.map((tool) => (
            <div
              key={tool.slug}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-fill-tertiary rounded-full text-sm"
            >
              <span className="font-medium text-label-primary truncate max-w-24">
                {tool.name}
              </span>
              <button
                onClick={() => onRemove(tool.slug)}
                className="text-label-quaternary hover:text-negative p-0.5"
                aria-label={`Remove ${tool.name}`}
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Add button */}
          {canAddMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium",
                "border border-dashed border-separator text-label-tertiary",
                "hover:border-accent hover:text-accent transition-colors"
              )}
            >
              <PlusIcon className="w-4 h-4" />
              Add tool
            </button>
          )}

          {/* Clear all */}
          {selectedSlugs.length > 0 && (
            <button
              onClick={onClear}
              className="ml-auto text-xs text-label-quaternary hover:text-label-secondary"
            >
              Clear
            </button>
          )}
        </div>

        {/* Expanded view: search */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t border-separator">
            <div className="relative mt-3">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-label-quaternary" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-separator rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-surface"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-label-quaternary hover:text-label-secondary"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick results */}
            {quickAddResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {quickAddResults.map((tool) => (
                  <button
                    key={tool.slug}
                    onClick={() => handleAddTool(tool.slug)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-fill-tertiary text-sm transition-colors"
                  >
                    <span className="font-medium text-label-primary">
                      {tool.name}
                    </span>
                    {tool.company && (
                      <span className="text-label-tertiary ml-2">
                        {tool.company}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {searchQuery && quickAddResults.length === 0 && (
              <p className="mt-2 text-sm text-label-tertiary text-center py-2">
                No tools found
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ICONS
// =============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

export default CompareTray;

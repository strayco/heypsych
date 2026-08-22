"use client";

/**
 * CompareButton Component
 *
 * Floating action button for treatment comparison functionality.
 * - Adds current treatment to comparison selection
 * - Shows current selection count (2-4 treatments)
 * - Navigates to comparison page when ready
 * - Persists selection via localStorage (survives navigation)
 * - Syncs to URL for shareable links
 *
 * Uses canonical slugs exclusively - never exposes file suffixes.
 *
 * Query-State Contract:
 * - `?compare=` on treatment pages: pending selection while browsing
 * - `?items=` on /treatments/compare: active comparison selections
 *
 * State Precedence:
 * 1. URL state always takes precedence over localStorage
 * 2. localStorage persists across navigation when URL has no params
 * 3. When navigating to compare page, items are passed via ?items=
 * 4. Only canonical slugs are stored (no file suffixes, no aliases)
 */

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Plus, Check, X, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MIN_COMPARISON_ITEMS = 2;
const MAX_COMPARISON_ITEMS = 4;
const STORAGE_KEY = "heypsych_compare_items";

interface CompareButtonProps {
  /** Canonical slug for this treatment (never file-derived) */
  treatmentSlug: string;
  /** Display name for this treatment */
  treatmentName: string;
  /** Modality for grouping (optional) */
  modality?: string;
}

/**
 * Gets comparison items with URL taking precedence over localStorage.
 *
 * Precedence order:
 * 1. URL ?compare= param (for shared links) - synced to localStorage for persistence
 * 2. localStorage (for cross-navigation persistence when no URL param)
 *
 * This ensures shared links work correctly while maintaining state across page navigation.
 */
function getComparisonItems(): string[] {
  if (typeof window === "undefined") return [];

  // URL takes precedence for shareable links
  const params = new URLSearchParams(window.location.search);
  const urlItems = params.get("compare");
  if (urlItems) {
    const items = urlItems.split(",").filter(Boolean);
    // Sync URL state to localStorage for cross-navigation persistence
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage unavailable
    }
    return items;
  }

  // Fallback to localStorage for normal navigation
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Saves comparison items to localStorage
 */
function saveComparisonItems(items: string[]) {
  if (typeof window === "undefined") return;
  try {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}

export function CompareButton({
  treatmentSlug,
  treatmentName,
  modality,
}: CompareButtonProps) {
  const router = useRouter();
  const [items, setItems] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage (or URL for shared links) on mount
  useEffect(() => {
    setMounted(true);
    setItems(getComparisonItems());
  }, []);

  // Persist to localStorage when items change
  useEffect(() => {
    if (mounted) {
      saveComparisonItems(items);
    }
  }, [items, mounted]);

  const isInComparison = items.includes(treatmentSlug);
  const canAdd = items.length < MAX_COMPARISON_ITEMS && !isInComparison;
  const canCompare = items.length >= MIN_COMPARISON_ITEMS;

  const handleAdd = useCallback(() => {
    if (canAdd) {
      setItems((prev) => [...prev, treatmentSlug]);
    }
  }, [canAdd, treatmentSlug]);

  const handleRemove = useCallback(
    (slug: string) => {
      setItems((prev) => prev.filter((s) => s !== slug));
    },
    []
  );

  const handleClear = useCallback(() => {
    setItems([]);
    setIsExpanded(false);
  }, []);

  const handleCompare = useCallback(() => {
    // Route to canonical /treatments/compare (not /universal)
    const compareUrl = `/treatments/compare?items=${items.join(",")}`;
    router.push(compareUrl);
  }, [items, router]);

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Floating Compare Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 left-6 z-50"
      >
        <div className="flex flex-col items-start gap-2">
          {/* Selection Preview (when expanded) */}
          <AnimatePresence>
            {isExpanded && items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="shadow-xl border-separator bg-surface min-w-[200px] max-w-[280px]">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-label-primary">
                        Compare ({items.length}/{MAX_COMPARISON_ITEMS})
                      </span>
                      <button
                        onClick={handleClear}
                        className="p-1 text-label-tertiary hover:text-negative-600 transition-colors"
                        title="Clear all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((slug) => (
                        <div
                          key={slug}
                          className="flex items-center justify-between gap-2 text-sm bg-fill-secondary rounded-lg px-2.5 py-1.5"
                        >
                          <span className="truncate text-label-secondary">
                            {slug === treatmentSlug ? treatmentName : formatSlugToName(slug)}
                          </span>
                          <button
                            onClick={() => handleRemove(slug)}
                            className="p-0.5 text-label-tertiary hover:text-negative-600 transition-colors shrink-0"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {canCompare && (
                      <Button
                        onClick={handleCompare}
                        variant="primary"
                        size="sm"
                        className="w-full mt-3 gap-1.5"
                      >
                        Compare Now
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                    {!canCompare && items.length > 0 && (
                      <p className="text-xs text-label-tertiary mt-2 text-center">
                        Add {MIN_COMPARISON_ITEMS - items.length} more to compare
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Button */}
          <div className="flex items-center gap-2">
            {/* Toggle expand button (when items exist) */}
            {items.length > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                  relative flex items-center justify-center
                  w-12 h-12 rounded-full shadow-lg
                  transition-all duration-200
                  ${isExpanded
                    ? "bg-accent text-white"
                    : "bg-surface text-accent border border-accent-border hover:bg-accent-tint"
                  }
                `}
                title={isExpanded ? "Hide comparison" : "Show comparison"}
              >
                <Scale className="h-5 w-5" />
                {/* Badge */}
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-xs font-bold">
                  {items.length}
                </span>
              </motion.button>
            )}

            {/* Add/Added button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={isInComparison ? () => handleRemove(treatmentSlug) : handleAdd}
              disabled={!canAdd && !isInComparison}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg
                font-medium text-sm transition-all duration-200
                ${isInComparison
                  ? "bg-positive-500 text-white hover:bg-positive-600"
                  : canAdd
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "bg-fill-secondary text-label-tertiary cursor-not-allowed"
                }
              `}
              title={
                isInComparison
                  ? "Remove from comparison"
                  : canAdd
                    ? "Add to comparison"
                    : `Maximum ${MAX_COMPARISON_ITEMS} treatments`
              }
            >
              {isInComparison ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="hidden sm:inline">Added</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Compare</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/**
 * Formats a slug to a human-readable name
 * e.g., "sertraline-zoloft" -> "Sertraline Zoloft"
 */
function formatSlugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default CompareButton;

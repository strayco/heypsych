"use client";

/**
 * Compare Page Client Component
 *
 * Unified comparison experience:
 * - Selector mode: treatment search + curated comparisons list
 * - Comparison mode: unified side-by-side comparison table
 *
 * Routes to /treatments/compare?items=... (not /universal)
 */

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TreatmentV3 } from "@/lib/schemas/treatment-v3";
import type { SerializableComparisonResult } from "@/lib/comparison/comparison-engine";
import { TreatmentSelector } from "./universal/treatment-selector";
import { UnifiedComparison } from "@/components/comparison";

// =============================================================================
// TYPES
// =============================================================================

interface CuratedComparison {
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  drug_class?: string;
}

interface ComparePageClientProps {
  initialTreatments: TreatmentV3[];
  comparison: SerializableComparisonResult | null;
  error?: string;
  initialCondition?: string;
  curatedComparisons: CuratedComparison[];
}

type DepthLevel = "essential" | "detailed" | "clinical";
type ViewMode = "all" | "differences" | "similarities";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ComparePageClient({
  initialTreatments,
  comparison,
  error,
  initialCondition,
  curatedComparisons,
}: ComparePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [depthLevel, setDepthLevel] = useState<DepthLevel>("detailed");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [showSelector, setShowSelector] = useState(initialTreatments.length === 0);
  const [copied, setCopied] = useState(false);

  // Computed
  const hasComparison = comparison !== null && comparison.treatments.length >= 2;

  // Local selection state - only update URL when 2+ items selected
  const [pendingSelection, setPendingSelection] = useState<string[]>(
    initialTreatments.map((t) => t.identity.slug)
  );

  // Handlers - routes to /treatments/compare (NOT /universal)
  const handleTreatmentsChange = useCallback(
    (slugs: string[]) => {
      // Always update local state
      setPendingSelection(slugs);

      // Only update URL when 2+ treatments or clearing
      if (slugs.length >= 2 || slugs.length === 0) {
        const params = new URLSearchParams(searchParams);
        if (slugs.length > 0) {
          params.set("items", slugs.join(","));
        } else {
          params.delete("items");
        }
        // Route to /treatments/compare (canonical URL)
        router.push(`/treatments/compare?${params.toString()}`);
      }
    },
    [router, searchParams]
  );

  const handleRemoveTreatment = useCallback(
    (slug: string) => {
      const currentItems = searchParams.get("items")?.split(",").filter(Boolean) || [];
      handleTreatmentsChange(currentItems.filter((s) => s !== slug));
    },
    [searchParams, handleTreatmentsChange]
  );

  const handleClear = useCallback(() => {
    handleTreatmentsChange([]);
  }, [handleTreatmentsChange]);

  const handleShare = useCallback(() => {
    if (comparison) {
      const url = new URL(window.location.href);
      navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [comparison]);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="hp-material border-b border-separator sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <nav className="text-sm text-label-tertiary mb-1 flex items-center gap-1">
                <Link
                  href="/treatments"
                  className="hover:text-accent transition-colors"
                >
                  Treatments
                </Link>
                <ChevronRightIcon className="w-3 h-3" />
                <span className="text-label-primary font-medium">Compare</span>
              </nav>
              <h1 className="text-2xl font-semibold text-label-primary tracking-tight">
                {hasComparison
                  ? comparison.treatments.map((t) => t.identity.name).join(" vs ")
                  : "Compare Treatments"}
              </h1>
            </div>

            {hasComparison && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSelector(true)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    "text-label-secondary hover:text-label-primary hover:bg-fill-tertiary",
                    "min-h-11 min-w-11"
                  )}
                >
                  Edit
                </button>
                <button
                  onClick={handleShare}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    "bg-accent text-white hover:bg-accent-hover active:bg-accent-pressed",
                    "flex items-center gap-2 min-h-11",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  )}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <ShareIcon className="w-4 h-4" />
                      Share
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-negative-50 border border-negative-200 rounded-xl text-negative-700 flex items-start gap-3">
            <AlertIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Selector or Comparison */}
        {showSelector || !hasComparison ? (
          <div className="space-y-12">
            {/* Treatment Selector */}
            <TreatmentSelector
              selectedSlugs={pendingSelection}
              onSelectionChange={handleTreatmentsChange}
              onCompare={() => setShowSelector(false)}
              maxSelections={4}
            />

            {/* Curated Comparisons Section */}
            {curatedComparisons.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-xl font-semibold text-label-primary mb-2">
                  Medically Reviewed Comparisons
                </h2>
                <p className="text-label-secondary mb-6">
                  These comparisons have been reviewed by our medical team for accuracy and clinical relevance.
                </p>
                <div className="grid gap-3">
                  {curatedComparisons.map((comp) => (
                    <Link
                      key={comp.slug}
                      href={`/treatments/compare/${comp.slug}`}
                      className={cn(
                        "block p-4 bg-surface rounded-xl border border-separator",
                        "hover:border-accent-border hover:shadow-card-1 transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-label-primary mb-1">
                            {comp.name}
                          </h3>
                          <p className="text-sm text-label-secondary line-clamp-2">
                            {comp.description}
                          </p>
                        </div>
                        {comp.drug_class && (
                          <span className="shrink-0 text-xs bg-accent-tint text-accent px-2.5 py-1 rounded-full font-medium">
                            {comp.drug_class}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Unified Comparison Experience */}
            <UnifiedComparison
              comparison={comparison}
              depthLevel={depthLevel}
              viewMode={viewMode}
              onDepthChange={setDepthLevel}
              onViewModeChange={setViewMode}
              onRemoveTreatment={handleRemoveTreatment}
              onClear={handleClear}
            />

            {/* Disclaimer */}
            <div className="mt-10 p-5 bg-caution-50 border border-caution-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <InfoIcon className="w-5 h-5 text-caution-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-caution-800 mb-1">
                    Medical Disclaimer
                  </p>
                  <p className="text-sm text-caution-700">
                    This comparison is for educational purposes only and does not constitute medical advice.
                    Treatment decisions should be made with a qualified healthcare provider who knows your
                    individual situation.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


// =============================================================================
// ICONS
// =============================================================================

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

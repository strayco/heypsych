"use client";

/**
 * Treatment Selector Component
 *
 * Allows users to search and select treatments for comparison.
 * Supports filtering by modality and shows up to 4 selections.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface TreatmentOption {
  slug: string;
  name: string;
  modality: string;
  category: string;
}

interface TreatmentSelectorProps {
  selectedSlugs: string[];
  onSelectionChange: (slugs: string[]) => void;
  onCompare: () => void;
  maxSelections?: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TreatmentSelector({
  selectedSlugs,
  onSelectionChange,
  onCompare,
  maxSelections = 4,
}: TreatmentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [treatments, setTreatments] = useState<TreatmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load treatment manifest
  useEffect(() => {
    async function loadTreatments() {
      try {
        const response = await fetch("/api/treatments/manifest");
        const data = await response.json();
        setTreatments(data.treatments || []);
      } catch (err) {
        console.error("Failed to load treatment manifest:", err);
        // Fallback: Load from static JSON if API fails
        setTreatments([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadTreatments();
  }, []);

  // Filter treatments based on search
  const filteredTreatments = useMemo(() => {
    let result = treatments;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.slug.includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    // Sort: selected first, then alphabetically
    result = [...result].sort((a, b) => {
      const aSelected = selectedSlugs.includes(a.slug);
      const bSelected = selectedSlugs.includes(b.slug);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.name.localeCompare(b.name);
    });

    return result.slice(0, 50); // Limit for performance
  }, [treatments, searchQuery, selectedSlugs]);

  // Selected treatments info
  const selectedTreatments = useMemo(() => {
    return selectedSlugs
      .map((slug) => treatments.find((t) => t.slug === slug))
      .filter(Boolean) as TreatmentOption[];
  }, [selectedSlugs, treatments]);

  // Handlers
  const handleToggle = useCallback(
    (slug: string) => {
      if (selectedSlugs.includes(slug)) {
        onSelectionChange(selectedSlugs.filter((s) => s !== slug));
      } else if (selectedSlugs.length < maxSelections) {
        onSelectionChange([...selectedSlugs, slug]);
      }
    },
    [selectedSlugs, onSelectionChange, maxSelections]
  );

  const handleClear = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const canCompare = selectedSlugs.length >= 2;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Selection summary */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Selected Treatments ({selectedSlugs.length}/{maxSelections})
          </h2>
          {selectedSlugs.length > 0 && (
            <button
              onClick={handleClear}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
        </div>

        {selectedTreatments.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTreatments.map((t) => (
              <div
                key={t.slug}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg"
              >
                <span className="text-sm font-medium">{t.name}</span>
                <button
                  onClick={() => handleToggle(t.slug)}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-4">
            Select 2-4 treatments to compare
          </p>
        )}

        {/* Compare button */}
        <button
          disabled={!canCompare}
          onClick={canCompare ? onCompare : undefined}
          className={cn(
            "w-full py-3 rounded-lg font-medium text-white transition-colors",
            canCompare
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 cursor-not-allowed"
          )}
        >
          {canCompare
            ? `Compare ${selectedSlugs.length} Treatments`
            : `Select at least 2 treatments to compare`}
        </button>
      </div>

      {/* Search and filter */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          {/* Search input */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search treatments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Treatment list - only show when searching */}
      {searchQuery.trim() && (
        <>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredTreatments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No treatments found. Try a different search.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filteredTreatments.map((treatment) => {
                const isSelected = selectedSlugs.includes(treatment.slug);
                const isDisabled = !isSelected && selectedSlugs.length >= maxSelections;

                return (
                  <button
                    key={treatment.slug}
                    onClick={() => !isDisabled && handleToggle(treatment.slug)}
                    disabled={isDisabled}
                    className={cn(
                      "p-4 text-left rounded-lg border transition-all",
                      isSelected
                        ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500"
                        : isDisabled
                        ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-2",
                            getModalityColor(treatment.modality)
                          )}
                        >
                          {formatModality(treatment.modality)}
                        </span>
                        <h3 className="font-medium text-gray-900 truncate">
                          {treatment.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {treatment.category}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="ml-3 flex-shrink-0">
                          <CheckIcon className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Popular comparisons */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Popular Comparisons
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {POPULAR_COMPARISONS.map((comp) => (
            <button
              key={comp.label}
              onClick={() => onSelectionChange(comp.slugs)}
              className="p-4 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <p className="font-medium text-gray-900">{comp.label}</p>
              <p className="text-sm text-gray-500">{comp.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// POPULAR COMPARISONS
// =============================================================================

const POPULAR_COMPARISONS = [
  {
    label: "SSRIs Comparison",
    description: "Compare Lexapro, Zoloft, and Prozac",
    slugs: ["escitalopram-lexapro", "sertraline-zoloft", "fluoxetine-prozac"],
  },
  {
    label: "ADHD Medications",
    description: "Compare Adderall, Vyvanse, and Strattera",
    slugs: ["dextroamphetamine-amphetamine-adderall", "lisdexamfetamine-vyvanse", "atomoxetine-strattera"],
  },
  {
    label: "Anxiety Treatments",
    description: "Compare medication vs therapy vs breathing exercises",
    slugs: ["sertraline-zoloft", "cognitive-behavioral-therapy", "4-7-8-breathing"],
  },
  {
    label: "Depression Treatments",
    description: "Compare medication, therapy, and TMS",
    slugs: ["sertraline-zoloft", "cognitive-behavioral-therapy", "transcranial-magnetic-stimulation"],
  },
];

// =============================================================================
// ICONS
// =============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatModality(modality: string): string {
  const labels: Record<string, string> = {
    medication: "Medication",
    therapy: "Therapy",
    interventional: "Interventional",
    investigational: "Investigational",
    supplement: "Supplement",
    alternative: "Alternative",
  };
  return labels[modality] || modality;
}

function getModalityColor(modality: string): string {
  const colors: Record<string, string> = {
    medication: "bg-blue-100 text-blue-700",
    therapy: "bg-purple-100 text-purple-700",
    interventional: "bg-orange-100 text-orange-700",
    investigational: "bg-pink-100 text-pink-700",
    supplement: "bg-green-100 text-green-700",
    alternative: "bg-teal-100 text-teal-700",
  };
  return colors[modality] || "bg-gray-100 text-gray-700";
}

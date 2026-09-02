"use client";

// ClinicianFilters Component
// Filter UI for clinician tool listings

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Filter,
  X,
  ChevronDown,
  Shield,
  Bot,
  Video,
  DollarSign,
  Building2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface ClinicianFiltersProps {
  category?: string;
  totalCount: number;
  filteredCount: number;
  className?: string;
}

const priceRangeOptions: FilterOption[] = [
  { value: "budget", label: "Budget-friendly" },
  { value: "mid-market", label: "Mid-market" },
  { value: "enterprise", label: "Enterprise" },
];

const practiceSizeOptions: FilterOption[] = [
  { value: "solo", label: "Solo practice" },
  { value: "small-2-10", label: "Small (2-10)" },
  { value: "medium-11-50", label: "Medium (11-50)" },
  { value: "large-50+", label: "Large (50+)" },
];

const featureOptions: FilterOption[] = [
  { value: "hipaa", label: "HIPAA compliant" },
  { value: "baa", label: "BAA available" },
  { value: "ai", label: "AI-powered" },
  { value: "telehealth", label: "Telehealth" },
  { value: "free-tier", label: "Free tier" },
  { value: "e-prescribing", label: "e-Prescribing" },
];

export function ClinicianFilters({
  category,
  totalCount,
  filteredCount,
  className,
}: ClinicianFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get current filter values from URL
  const currentPriceRange = searchParams.get("priceRange") || "";
  const currentPracticeSize = searchParams.get("practiceSize") || "";
  const currentFeatures = searchParams.get("features")?.split(",").filter(Boolean) || [];

  // Count active filters
  const activeFilterCount =
    (currentPriceRange ? 1 : 0) +
    (currentPracticeSize ? 1 : 0) +
    currentFeatures.length;

  // Update filters in URL
  const updateFilters = useCallback(
    (key: string, value: string | string[] | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === null || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else {
        params.set(key, value);
      }

      const basePath = category
        ? `/tools/for-clinicians/${category}/`
        : "/tools/for-clinicians/";
      router.push(`${basePath}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, category]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    const basePath = category
      ? `/tools/for-clinicians/${category}/`
      : "/tools/for-clinicians/";
    router.push(basePath, { scroll: false });
  }, [router, category]);

  // Toggle feature filter
  const toggleFeature = (feature: string) => {
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature];
    updateFilters("features", newFeatures);
  };

  return (
    <div className={cn("rounded-xl border border-separator bg-surface", className)}>
      {/* Filter header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-separator">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-label-primary hover:text-treatment transition-colors"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-treatment text-xs text-white">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-label-tertiary">
            {filteredCount === totalCount
              ? `${totalCount} tools`
              : `${filteredCount} of ${totalCount} tools`}
          </span>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-label-secondary hover:text-negative transition-colors"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Price Range */}
          <div>
            <h4 className="text-sm font-medium text-label-primary mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-label-tertiary" />
              Price Range
            </h4>
            <div className="flex flex-wrap gap-2">
              {priceRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    updateFilters(
                      "priceRange",
                      currentPriceRange === option.value ? null : option.value
                    )
                  }
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm transition-all",
                    currentPriceRange === option.value
                      ? "bg-treatment text-white"
                      : "bg-canvas border border-separator text-label-secondary hover:border-treatment/30"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Practice Size */}
          <div>
            <h4 className="text-sm font-medium text-label-primary mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-label-tertiary" />
              Practice Size
            </h4>
            <div className="flex flex-wrap gap-2">
              {practiceSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    updateFilters(
                      "practiceSize",
                      currentPracticeSize === option.value ? null : option.value
                    )
                  }
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm transition-all",
                    currentPracticeSize === option.value
                      ? "bg-treatment text-white"
                      : "bg-canvas border border-separator text-label-secondary hover:border-treatment/30"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-medium text-label-primary mb-2">
              Features
            </h4>
            <div className="flex flex-wrap gap-2">
              {featureOptions.map((option) => {
                const isSelected = currentFeatures.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleFeature(option.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all",
                      isSelected
                        ? "bg-treatment text-white"
                        : "bg-canvas border border-separator text-label-secondary hover:border-treatment/30"
                    )}
                  >
                    {option.value === "hipaa" && <Shield className="h-3 w-3" />}
                    {option.value === "ai" && <Bot className="h-3 w-3" />}
                    {option.value === "telehealth" && <Video className="h-3 w-3" />}
                    {option.label}
                    {isSelected && <Check className="h-3 w-3 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick filters (always visible) */}
      {!isExpanded && (
        <div className="px-4 py-3 flex flex-wrap gap-2">
          <button
            onClick={() => toggleFeature("hipaa")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all",
              currentFeatures.includes("hipaa")
                ? "bg-treatment text-white"
                : "bg-canvas border border-separator text-label-secondary hover:border-treatment/30"
            )}
          >
            <Shield className="h-3 w-3" />
            HIPAA
          </button>

          <button
            onClick={() => toggleFeature("ai")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all",
              currentFeatures.includes("ai")
                ? "bg-treatment text-white"
                : "bg-canvas border border-separator text-label-secondary hover:border-treatment/30"
            )}
          >
            <Bot className="h-3 w-3" />
            AI-powered
          </button>

          <button
            onClick={() => toggleFeature("free-tier")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all",
              currentFeatures.includes("free-tier")
                ? "bg-treatment text-white"
                : "bg-canvas border border-separator text-label-secondary hover:border-treatment/30"
            )}
          >
            <DollarSign className="h-3 w-3" />
            Free tier
          </button>
        </div>
      )}
    </div>
  );
}

export default ClinicianFilters;

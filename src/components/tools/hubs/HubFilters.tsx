"use client";

import { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface HubFiltersProps {
  tools: DigitalToolV3[];
  onFilterChange: (filtered: DigitalToolV3[]) => void;
  hubSlug?: string;
}

interface FilterState {
  cost: ("free" | "has-free" | "paid")[];
  platform: ("ios" | "android" | "web")[];
}

/**
 * HubFilters Component
 *
 * Simple filters for patients: Cost and Platform.
 * No technical jargon, no privacy grades, no AI features.
 */
export function HubFilters({ tools, onFilterChange }: HubFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    cost: [],
    platform: [],
  });

  // Apply filters
  const applyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);

    let filtered = [...tools];

    if (newFilters.cost.length > 0) {
      filtered = filtered.filter((t) => {
        const model = t.pricing.model;
        const hasFree = t.pricing.free_tier;

        if (newFilters.cost.includes("free") && model === "free") return true;
        if (newFilters.cost.includes("has-free") && (model === "freemium" || hasFree)) return true;
        if (newFilters.cost.includes("paid") && model === "subscription" && !hasFree) return true;
        return false;
      });
    }

    if (newFilters.platform.length > 0) {
      filtered = filtered.filter((t) =>
        newFilters.platform.some((p) => t.platforms[p])
      );
    }

    onFilterChange(filtered);
  };

  const toggleFilter = (category: keyof FilterState, value: string) => {
    const current = filters[category] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    applyFilters({ ...filters, [category]: updated });
  };

  const clearAllFilters = () => {
    applyFilters({ cost: [], platform: [] });
  };

  const activeCount = filters.cost.length + filters.platform.length;

  return (
    <div className="rounded-xl border border-separator bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-label-tertiary" />
          <h3 className="font-medium text-label-primary">Filter</h3>
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-label-secondary hover:text-accent transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Cost Filter */}
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-label-tertiary">
            Cost
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "free", label: "Free" },
              { value: "has-free", label: "Has free version" },
              { value: "paid", label: "Paid only" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleFilter("cost", value)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
                  filters.cost.includes(value as any)
                    ? "bg-neutral-900 text-white"
                    : "bg-canvas text-label-secondary border border-separator hover:border-neutral-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Filter */}
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-label-tertiary">
            Works on
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "ios", label: "iPhone" },
              { value: "android", label: "Android" },
              { value: "web", label: "Website" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleFilter("platform", value)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
                  filters.platform.includes(value as any)
                    ? "bg-neutral-900 text-white"
                    : "bg-canvas text-label-secondary border border-separator hover:border-neutral-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HubFilters;

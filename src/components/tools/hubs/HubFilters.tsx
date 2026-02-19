"use client";

import { useState, useMemo } from "react";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import type { DigitalToolV3, ToolType, PrivacyGrade } from "@/lib/schemas/digital-tool-v3";

interface HubFiltersProps {
  tools: DigitalToolV3[];
  onFilterChange: (filtered: DigitalToolV3[]) => void;
  hubSlug?: string;
}

interface FilterState {
  toolTypes: ToolType[];
  pricing: string[];
  privacy: PrivacyGrade[];
  platforms: ("ios" | "android" | "web")[];
  aiAttributes: string[];
}

/**
 * HubFilters Component
 * 
 * Client-side filtering for hub pages.
 * Filter states are noindex, canonical to base hub.
 */
export function HubFilters({ tools, onFilterChange, hubSlug }: HubFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    toolTypes: [],
    pricing: [],
    privacy: [],
    platforms: [],
    aiAttributes: [],
  });

  // Extract available filter options from tools
  const filterOptions = useMemo(() => {
    const toolTypes = new Set<string>();
    const pricingModels = new Set<string>();
    const privacyGrades = new Set<string>();
    const aiAttributes = new Set<string>();

    tools.forEach((tool) => {
      tool.tool_types.forEach((tt) => toolTypes.add(tt));
      pricingModels.add(tool.pricing.model);
      if (tool.privacy.grade !== "unknown") {
        privacyGrades.add(tool.privacy.grade);
      }
      tool.ai_attributes.forEach((ai) => {
        if (ai !== "no-ai") aiAttributes.add(ai);
      });
    });

    return {
      toolTypes: Array.from(toolTypes).sort(),
      pricingModels: Array.from(pricingModels).sort(),
      privacyGrades: Array.from(privacyGrades).sort(),
      aiAttributes: Array.from(aiAttributes).sort(),
    };
  }, [tools]);

  // Apply filters
  const applyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);

    let filtered = [...tools];

    if (newFilters.toolTypes.length > 0) {
      filtered = filtered.filter((t) =>
        newFilters.toolTypes.some((tt) => t.tool_types.includes(tt))
      );
    }

    if (newFilters.pricing.length > 0) {
      filtered = filtered.filter((t) =>
        newFilters.pricing.includes(t.pricing.model)
      );
    }

    if (newFilters.privacy.length > 0) {
      filtered = filtered.filter((t) =>
        newFilters.privacy.includes(t.privacy.grade)
      );
    }

    if (newFilters.platforms.length > 0) {
      filtered = filtered.filter((t) =>
        newFilters.platforms.some((p) => t.platforms[p])
      );
    }

    if (newFilters.aiAttributes.length > 0) {
      filtered = filtered.filter((t) =>
        newFilters.aiAttributes.some((a) => t.ai_attributes.includes(a as any))
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
    const empty: FilterState = {
      toolTypes: [],
      pricing: [],
      privacy: [],
      platforms: [],
      aiAttributes: [],
    };
    applyFilters(empty);
  };

  const activeCount = 
    filters.toolTypes.length +
    filters.pricing.length +
    filters.privacy.length +
    filters.platforms.length +
    filters.aiAttributes.length;

  return (
    <Card className="border-neutral-200 bg-white/80 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeCount > 0 && (
              <Badge variant="primary" className="ml-2">
                {activeCount} active
              </Badge>
            )}
          </div>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-indigo-600 hover:text-indigo-700"
            >
              <X className="mr-1 h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tool Type Filter */}
        {filterOptions.toolTypes.length > 1 && (
          <FilterSection
            title="Tool Type"
            options={filterOptions.toolTypes}
            selected={filters.toolTypes}
            onToggle={(v) => toggleFilter("toolTypes", v)}
            formatLabel={formatToolType}
          />
        )}

        {/* Pricing Filter */}
        {filterOptions.pricingModels.length > 1 && (
          <FilterSection
            title="Pricing"
            options={filterOptions.pricingModels}
            selected={filters.pricing}
            onToggle={(v) => toggleFilter("pricing", v)}
            formatLabel={formatPricing}
          />
        )}

        {/* Privacy Filter */}
        {filterOptions.privacyGrades.length > 1 && (
          <FilterSection
            title="Privacy Grade"
            options={filterOptions.privacyGrades}
            selected={filters.privacy}
            onToggle={(v) => toggleFilter("privacy", v)}
          />
        )}

        {/* Platform Filter */}
        <FilterSection
          title="Platform"
          options={["ios", "android", "web"]}
          selected={filters.platforms}
          onToggle={(v) => toggleFilter("platforms", v)}
          formatLabel={formatPlatform}
        />

        {/* AI Filter */}
        {filterOptions.aiAttributes.length > 0 && (
          <FilterSection
            title="AI Features"
            options={filterOptions.aiAttributes}
            selected={filters.aiAttributes}
            onToggle={(v) => toggleFilter("aiAttributes", v)}
            formatLabel={formatAI}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Filter Section Component
interface FilterSectionProps {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  formatLabel?: (value: string) => string;
}

function FilterSection({ title, options, selected, onToggle, formatLabel }: FilterSectionProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-neutral-700">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              selected.includes(option)
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {formatLabel ? formatLabel(option) : option}
          </button>
        ))}
      </div>
    </div>
  );
}

// Format helpers
function formatToolType(slug: string): string {
  const type = TaxonomyService.getToolType(slug);
  return type?.filter_label || slug.replace(/-/g, " ");
}

function formatPricing(model: string): string {
  const labels: Record<string, string> = {
    free: "Free",
    freemium: "Freemium",
    subscription: "Subscription",
    "one-time": "One-time",
    enterprise: "Enterprise",
    "insurance-covered": "Insurance",
  };
  return labels[model] || model;
}

function formatPlatform(platform: string): string {
  const labels: Record<string, string> = {
    ios: "iOS",
    android: "Android",
    web: "Web",
  };
  return labels[platform] || platform;
}

function formatAI(attr: string): string {
  const labels: Record<string, string> = {
    "ai-powered": "AI-Powered",
    "ai-assisted": "AI-Assisted",
    "ai-matching": "AI Matching",
    chatbot: "Chatbot",
  };
  return labels[attr] || attr;
}

export default HubFilters;

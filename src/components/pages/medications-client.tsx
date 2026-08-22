"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TreatmentGrid } from "@/components/blocks/treatment-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Pill,
  AlertCircle,
  Filter,
  X,
  ChevronDown,
  Search,
  ChevronRight,
} from "lucide-react";
import { Entity } from "@/lib/types/database";

type FilterCategory = {
  id: string;
  label: string;
  options: string[];
  getValues: (entity: Entity) => string[];
};

interface MedicationsClientProps {
  medications: Entity[];
}

// Filter category definitions - static, moved outside component to avoid dependency issues
const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: "mechanism",
    label: "Mechanism of Action",
    options: [],
    getValues: (entity) => {
      const values = entity.metadata?.mechanism_categories || [];
      return Array.isArray(values) ? values.filter(Boolean) : [];
    },
  },
  {
    id: "uses",
    label: "Uses",
    options: [],
    getValues: (entity) => {
      const values = entity.data?.clinical_metadata?.primary_indications || [];
      return Array.isArray(values) ? values.filter(Boolean) : [];
    },
  },
  {
    id: "route",
    label: "Route of Administration",
    options: [],
    getValues: (entity) => {
      const values = entity.metadata?.administration_routes || [];
      return Array.isArray(values) ? values.filter(Boolean) : [];
    },
  },
];

export function MedicationsClient({ medications }: MedicationsClientProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("a-z");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(20);
  const ITEMS_PER_PAGE = 20;

  // Extract unique options for each filter category
  const enrichedFilterCategories = useMemo(() => {
    return FILTER_CATEGORIES.map((category) => {
      const allValues = new Set<string>();
      medications.forEach((med) => {
        const values = category.getValues(med);
        values.forEach((value) => {
          if (value && typeof value === "string") {
            allValues.add(value);
          }
        });
      });

      return {
        ...category,
        options: Array.from(allValues).sort(),
      };
    });
  }, [medications]);

  // Search and filter medications
  const filteredMedications = useMemo(() => {
    let results = medications;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter((med) => {
        const name = med.name?.toLowerCase() || "";
        const description = med.description?.toLowerCase() || "";
        const indications = med.data?.clinical_metadata?.primary_indications?.join(" ") || "";
        const brandNames = med.metadata?.brand_names?.join(" ") || "";
        const mechanisms = med.metadata?.mechanism_categories?.join(" ") || "";
        const searchableContent = `${indications} ${brandNames} ${mechanisms}`.toLowerCase();

        return name.includes(query) || description.includes(query) || searchableContent.includes(query);
      });
    }

    // Apply filters
    results = results.filter((med) => {
      return Object.entries(activeFilters).every(([categoryId, selectedValues]) => {
        if (selectedValues.length === 0) return true;

        const category = enrichedFilterCategories.find((c) => c.id === categoryId);
        if (!category) return true;

        const medValues = category.getValues(med);
        return selectedValues.some((selectedValue) => medValues.includes(selectedValue));
      });
    });

    return results;
  }, [medications, activeFilters, enrichedFilterCategories, searchQuery]);

  // Sort medications
  const sortedMedications = useMemo(() => {
    const sorted = [...filteredMedications].sort((a, b) => {
      switch (sortBy) {
        case "a-z":
          return a.name.localeCompare(b.name);
        case "z-a":
          return b.name.localeCompare(a.name);
        case "newest":
          const aYear = a.data?.metadata?.fda_approval_year || 0;
          const bYear = b.data?.metadata?.fda_approval_year || 0;
          if (bYear !== aYear) return bYear - aYear;
          return a.name.localeCompare(b.name);
        case "oldest":
          const aYearOld = a.data?.metadata?.fda_approval_year || 9999;
          const bYearOld = b.data?.metadata?.fda_approval_year || 9999;
          if (aYearOld !== bYearOld) return aYearOld - bYearOld;
          return a.name.localeCompare(b.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [filteredMedications, sortBy]);

  const handleFilterToggle = (categoryId: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[categoryId] || [];
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      return {
        ...prev,
        [categoryId]: newValues,
      };
    });
    setVisibleCount(20);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchInput("");
    setSearchQuery("");
    setVisibleCount(20);
  };

  const visibleMedications = useMemo(() => {
    return sortedMedications.slice(0, visibleCount);
  }, [sortedMedications, visibleCount]);

  const hasMore = visibleCount < sortedMedications.length;

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, values) => count + values.length, 0);
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => window.history.back()} className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back
            </Button>

            <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
              <span className="bg-linear-to-r from-accent-600 to-accent bg-clip-text text-transparent">
                Medications
              </span>
            </h1>

            <div className="w-[100px]"></div>
          </div>

          <div className="mb-4 text-center">
            <p className="mx-auto mb-3 max-w-2xl text-sm text-label-secondary">
              FDA-approved prescription medications for depression, anxiety, and other mental health
              conditions. All medications should be prescribed and monitored by a qualified healthcare
              provider.
            </p>

            <div className="flex items-center justify-center gap-4 text-xs text-label-primary">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-tint0"></div>
                {sortedMedications?.length || 0} Medications
                {filteredMedications?.length !== medications?.length && (
                  <span className="text-orange-600">(filtered from {medications?.length})</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-positive-tint0"></div>
                FDA Approved
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                Evidence-Based
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="px-4 py-2 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-primary" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchQuery(searchInput);
                  setVisibleCount(20);
                }
              }}
              placeholder="Search medications by name, description, or indication... (Press Enter)"
              className="w-full rounded-xl border border-separator bg-surface py-3 pl-12 pr-4 text-sm text-label-primary placeholder:text-label-tertiary shadow-sm transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </section>

      {/* Filters and Sorting */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge variant="primary" size="sm">
                    {getActiveFilterCount()}
                  </Badge>
                )}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </Button>

              {getActiveFilterCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-label-primary hover:text-label-secondary"
                >
                  <X className="mr-1 h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-label-secondary">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setVisibleCount(20);
                }}
                className="rounded-md border border-separator bg-surface px-3 py-1 text-sm"
              >
                <option value="a-z">A-Z</option>
                <option value="z-a">Z-A</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {enrichedFilterCategories.map((category) => (
                      <div key={category.id}>
                        <h4 className="mb-3 font-semibold text-label-primary">{category.label}</h4>
                        <div className="max-h-48 space-y-2 overflow-y-auto">
                          {category.options.map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={activeFilters[category.id]?.includes(option) || false}
                                onChange={() => handleFilterToggle(category.id, option)}
                                className="mr-2 rounded border-separator text-accent"
                              />
                              <span className="text-sm text-label-secondary">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Active Filters Display */}
          {getActiveFilterCount() > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([categoryId, values]) =>
                  values.map((value) => {
                    const category = enrichedFilterCategories.find((c) => c.id === categoryId);
                    return (
                      <Badge
                        key={`${categoryId}-${value}`}
                        variant="outline"
                        className="cursor-pointer hover:bg-surface"
                        onClick={() => handleFilterToggle(categoryId, value)}
                      >
                        {category?.label}: {value} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Medications Grid */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {sortedMedications && sortedMedications.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TreatmentGrid
                  entities={visibleMedications}
                  title=""
                  variant="default"
                  showFilters={false}
                  showComparison={true}
                  className="rounded-3xl bg-surface p-8 shadow-xl"
                />
              </motion.div>

              {/* Load More Button */}
              {hasMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex flex-col items-center gap-4"
                >
                  <p className="text-sm text-label-secondary">
                    Showing {visibleCount} of {sortedMedications.length} medications
                  </p>
                  <Button
                    onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    Load More
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12 text-center"
            >
              <Card className="mx-auto max-w-md">
                <CardContent className="p-8">
                  <Pill className="mx-auto mb-4 h-16 w-16 text-label-quaternary" />
                  <h3 className="mb-2 text-xl font-semibold text-label-primary">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "No Medications Match"
                      : "No Medications Found"}
                  </h3>
                  <p className="mb-6 text-label-secondary">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "Try adjusting your search or filter criteria."
                      : "It looks like the medications data hasn't been imported yet."}
                  </p>
                  {getActiveFilterCount() > 0 || searchQuery.trim() ? (
                    <Button onClick={clearAllFilters}>Clear All Filters</Button>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* Important Notice */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <h3 className="mb-2 font-semibold text-yellow-900">Important Medical Disclaimer</h3>
                  <p className="text-sm text-yellow-800">
                    The information provided here is for educational purposes only and should not replace
                    professional medical advice. Always consult with a qualified healthcare provider before
                    starting, stopping, or changing any medication regimen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

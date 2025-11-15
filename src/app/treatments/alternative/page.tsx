"use client";


import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAlternativeTreatments } from "@/lib/hooks/use-entities";
import { TreatmentGrid } from "@/components/blocks/treatment-grid";
import { Entity } from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sun, AlertCircle, Filter, X, ChevronDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type FilterCategory = {
  id: string;
  label: string;
  options: string[];
  getValues: (entity: Entity) => string[];
};

export default function AlternativeTreatmentsPage() {
  const { data: alternativeTreatments, isLoading, error } = useAlternativeTreatments();
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(20);

  // Normalize treatment type values into user-friendly categories
  const normalizeTreatmentType = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    // Traditional Medicine
    if (
      lowerValue.includes("acupuncture") ||
      lowerValue.includes("traditional chinese") ||
      lowerValue.includes("tcm") ||
      lowerValue.includes("ayurveda") ||
      lowerValue.includes("homeopathy") ||
      lowerValue.includes("naturopathy")
    ) {
      return "Traditional Medicine";
    }

    // Body-Based Therapies
    if (
      lowerValue.includes("massage") ||
      lowerValue.includes("chiropractic") ||
      lowerValue.includes("craniosacral") ||
      lowerValue.includes("rolfing") ||
      lowerValue.includes("myofascial") ||
      lowerValue.includes("alexander") ||
      lowerValue.includes("feldenkrais") ||
      lowerValue.includes("bodywork")
    ) {
      return "Body-Based Therapies";
    }

    // Energy Medicine
    if (
      lowerValue.includes("reiki") ||
      lowerValue.includes("therapeutic touch") ||
      lowerValue.includes("chakra") ||
      lowerValue.includes("crystal") ||
      lowerValue.includes("energy healing") ||
      lowerValue.includes("sound therapy") ||
      lowerValue.includes("vibroacoustic") ||
      lowerValue.includes("binaural")
    ) {
      return "Energy Medicine";
    }

    // Creative Arts Therapies
    if (
      lowerValue.includes("art therapy") ||
      lowerValue.includes("music therapy") ||
      lowerValue.includes("dance") ||
      lowerValue.includes("drama therapy") ||
      lowerValue.includes("expressive arts") ||
      lowerValue.includes("poetry") ||
      lowerValue.includes("bibliotherapy")
    ) {
      return "Creative Arts Therapies";
    }

    // Mind-Body Practices
    if (
      lowerValue.includes("yoga") ||
      lowerValue.includes("tai chi") ||
      lowerValue.includes("qigong") ||
      lowerValue.includes("meditation") ||
      lowerValue.includes("mindfulness") ||
      lowerValue.includes("progressive muscle") ||
      lowerValue.includes("autogenic") ||
      lowerValue.includes("guided imagery") ||
      lowerValue.includes("visualization")
    ) {
      return "Mind-Body Practices";
    }

    // Breathwork
    if (
      lowerValue.includes("breathwork") ||
      lowerValue.includes("pranayama") ||
      lowerValue.includes("breathing") ||
      lowerValue.includes("wim hof") ||
      lowerValue.includes("holotropic") ||
      lowerValue.includes("rebirthing")
    ) {
      return "Breathwork";
    }

    // Hypnotherapy
    if (
      lowerValue.includes("hypnotherapy") ||
      lowerValue.includes("hypnosis") ||
      lowerValue.includes("self-hypnosis") ||
      lowerValue.includes("ericksonian")
    ) {
      return "Hypnotherapy";
    }

    // Animal/Nature Therapies
    if (
      lowerValue.includes("animal") ||
      lowerValue.includes("equine") ||
      lowerValue.includes("dolphin") ||
      lowerValue.includes("horticultural") ||
      lowerValue.includes("wilderness") ||
      lowerValue.includes("adventure") ||
      lowerValue.includes("recreational")
    ) {
      return "Animal & Nature Therapies";
    }

    // Other
    return "Other";
  };

  // Normalize evidence level values
  const normalizeEvidenceLevel = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    if (lowerValue.includes("strong") || lowerValue.includes("well-established")) {
      return "Strong Evidence";
    }
    if (lowerValue.includes("moderate") || lowerValue.includes("probably efficacious")) {
      return "Moderate Evidence";
    }
    if (lowerValue.includes("promising") || lowerValue.includes("possibly efficacious")) {
      return "Promising Evidence";
    }
    if (lowerValue.includes("limited") || lowerValue.includes("experimental")) {
      return "Limited Evidence";
    }
    if (lowerValue.includes("insufficient") || lowerValue.includes("not established")) {
      return "Insufficient Evidence";
    }

    return "Evidence Level Unknown";
  };

  // Normalize condition values to match main categories
  const normalizeConditionValue = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    // Mood & Depression
    if (
      lowerValue.includes("depression") ||
      lowerValue.includes("depressive") ||
      lowerValue.includes("bipolar") ||
      lowerValue.includes("mood")
    ) {
      return "Mood & Depression";
    }

    // Anxiety & Fear
    if (
      lowerValue.includes("anxiety") ||
      lowerValue.includes("panic") ||
      lowerValue.includes("phobia") ||
      lowerValue.includes("stress") ||
      lowerValue.includes("worry")
    ) {
      return "Anxiety & Fear";
    }

    // Trauma & PTSD
    if (
      lowerValue.includes("ptsd") ||
      lowerValue.includes("trauma") ||
      lowerValue.includes("post-traumatic")
    ) {
      return "Trauma & Stress";
    }

    // Sleep & Insomnia
    if (
      lowerValue.includes("sleep") ||
      lowerValue.includes("insomnia") ||
      lowerValue.includes("sleep disorder")
    ) {
      return "Sleep Disorders";
    }

    // Pain Management
    if (
      lowerValue.includes("pain") ||
      lowerValue.includes("chronic pain") ||
      lowerValue.includes("fibromyalgia") ||
      lowerValue.includes("headache") ||
      lowerValue.includes("migraine")
    ) {
      return "Pain Management";
    }

    // Addiction & Substance Use
    if (
      lowerValue.includes("addiction") ||
      lowerValue.includes("substance") ||
      lowerValue.includes("alcohol") ||
      lowerValue.includes("smoking")
    ) {
      return "Substance Use Disorders";
    }

    // Attention & ADHD
    if (
      lowerValue.includes("adhd") ||
      lowerValue.includes("attention") ||
      lowerValue.includes("concentration") ||
      lowerValue.includes("focus")
    ) {
      return "Attention & Learning";
    }

    // General Wellness
    if (
      lowerValue.includes("wellness") ||
      lowerValue.includes("general") ||
      lowerValue.includes("overall") ||
      lowerValue.includes("quality of life")
    ) {
      return "General Wellness";
    }

    return "Other Conditions";
  };

  // Define filter categories
  const filterCategories: FilterCategory[] = [
    {
      id: "treatment_types",
      label: "Treatment Type",
      options: [],
      getValues: (entity) => {
        const values =
          entity.data?.metadata?.treatment_types || entity.data?.metadata?.categories || [];
        return values.map(normalizeTreatmentType);
      },
    },
    {
      id: "evidence_level",
      label: "Evidence Level",
      options: [],
      getValues: (entity) => {
        const value =
          entity.data?.metadata?.evidence_level || entity.data?.clinical_metadata?.evidence_level;
        return value ? [normalizeEvidenceLevel(value)] : [];
      },
    },
  ];

  // Extract unique options for each filter category
  const enrichedFilterCategories = useMemo(() => {
    if (!alternativeTreatments) return filterCategories;

    return filterCategories.map((category) => {
      if (category.options.length > 0) return category;

      const allValues = new Set<string>();
      alternativeTreatments.forEach((treatment: Entity) => {
        const normalizedValues = category.getValues(treatment);
        normalizedValues.forEach((value) => {
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
  }, [alternativeTreatments, filterCategories]);

  // Filter treatments based on search and active filters
  const filteredTreatments = useMemo(() => {
    if (!alternativeTreatments) return [];

    let results = alternativeTreatments;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter((treatment) => {
        const name = treatment.name?.toLowerCase() || "";
        const description = treatment.description?.toLowerCase() || "";
        const content = JSON.stringify(treatment.data || {}).toLowerCase();

        return name.includes(query) || description.includes(query) || content.includes(query);
      });
    }

    // Apply filters
    return results.filter((treatment: Entity) => {
      return Object.entries(activeFilters).every(([categoryId, selectedValues]) => {
        if (selectedValues.length === 0) return true;

        const category = enrichedFilterCategories.find((c) => c.id === categoryId);
        if (!category) return true;

        const normalizedTreatmentValues = category.getValues(treatment);

        return selectedValues.some((selectedValue) =>
          normalizedTreatmentValues.includes(selectedValue)
        );
      });
    });
  }, [alternativeTreatments, activeFilters, enrichedFilterCategories, searchQuery]);

  // Sort treatments
  const sortedTreatments = useMemo(() => {
    if (!filteredTreatments) return [];

    const sorted = [...filteredTreatments].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [filteredTreatments, sortBy]);

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
    // Reset visible count when filters change
    setVisibleCount(20);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchInput("");
    setSearchQuery("");
    setVisibleCount(20);
  };

  const visibleTreatments = useMemo(() => {
    return sortedTreatments.slice(0, visibleCount);
  }, [sortedTreatments, visibleCount]);

  const hasMore = visibleCount < sortedTreatments.length;

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, values) => count + values.length, 0);
  };

  const handleTreatmentClick = (entity: Entity) => {
    window.location.href = `/treatments/${entity.slug}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
          <h1 className="text-2xl font-bold text-neutral-900">Loading alternative treatments...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Card className="mx-4 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h1 className="mb-2 text-xl font-bold text-neutral-900">
              Error Loading Alternative Treatments
            </h1>
            <p className="mb-4 text-neutral-800">We couldn't load the alternative treatments data.</p>
            <Link
              href="/treatments"
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Treatments
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      {/* Header */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Back Button + Title Row */}
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="group"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back
            </Button>

            <h1 className="text-2xl font-bold sm:text-3xl">
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Alternative Treatments
              </span>
            </h1>

            <div className="w-[100px]"></div>
          </div>

          {/* Description Section */}
          <div className="mb-4 text-center">
            <p className="mx-auto mb-3 max-w-2xl text-sm text-slate-600">
              Evidence-based alternative and complementary treatments including traditional
              medicine, mind-body practices, creative therapies, and holistic approaches to mental
              health and wellness.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                {sortedTreatments?.length || 0} Treatments
                {filteredTreatments?.length !== alternativeTreatments?.length && (
                  <span className="text-orange-600">
                    (filtered from {alternativeTreatments?.length})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                Evidence-Based
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                Complementary
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Sorting */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
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
                placeholder="Search alternative treatments by name or practice... (Press Enter)"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Filter Controls */}
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
                  className="text-neutral-700 hover:text-neutral-800"
                >
                  <X className="mr-1 h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-800">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setVisibleCount(20);
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
              >
                <option value="name">A-Z</option>
                <option value="name-desc">Z-A</option>
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
                        <h4 className="mb-3 font-semibold text-neutral-900">{category.label}</h4>
                        <div className="max-h-48 space-y-2 overflow-y-auto">
                          {category.options.map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={activeFilters[category.id]?.includes(option) || false}
                                onChange={() => handleFilterToggle(category.id, option)}
                                className="mr-2 rounded border-gray-300 text-yellow-600"
                              />
                              <span className="text-sm text-neutral-800">{option}</span>
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
                        className="cursor-pointer hover:bg-gray-200"
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

      {/* Alternative Treatments Grid */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {sortedTreatments && sortedTreatments.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TreatmentGrid
                  key={`alternative-grid-${visibleCount}`}
                  entities={visibleTreatments}
                  title=""
                  variant="default"
                  showFilters={false}
                  showComparison={true}
                  onEntityClick={handleTreatmentClick}
                  className="rounded-3xl bg-white p-8 shadow-xl"
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
                  <p className="text-sm text-slate-600">
                    Showing {visibleCount} of {sortedTreatments.length} treatments
                  </p>
                  <Button
                    onClick={() => setVisibleCount((prev) => prev + 20)}
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
                  <Sun className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "No Treatments Match"
                      : "No Alternative Treatments Found"}
                  </h3>
                  <p className="mb-6 text-slate-600">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "Try adjusting your search or filter criteria."
                      : "It looks like the alternative treatments data hasn't been imported yet."}
                  </p>
                  {getActiveFilterCount() > 0 || searchQuery.trim() ? (
                    <Button onClick={clearAllFilters}>Clear All Filters</Button>
                  ) : (
                    <Link
                      href="/treatments"
                      className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to All Treatments
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* Important Notice */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h3 className="mb-2 font-semibold text-amber-900">
                    Alternative Treatment Considerations
                  </h3>
                  <p className="text-sm text-amber-800">
                    Alternative treatments can be valuable complements to conventional care. Always
                    discuss these options with your healthcare provider, especially if you're taking
                    medications or have medical conditions. Evidence levels vary, and what works for
                    one person may not work for another.
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

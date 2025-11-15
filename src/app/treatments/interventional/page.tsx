"use client";


import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useInterventionalTreatments } from "@/lib/hooks/use-entities";
import { TreatmentGrid } from "@/components/blocks/treatment-grid";
import { Entity } from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, AlertCircle, Filter, X, ChevronDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type FilterCategory = {
  id: string;
  label: string;
  options: string[];
  getValues: (entity: Entity) => string[];
};

export default function InterventionalTreatmentsPage() {
  const { data: interventionalTreatments, isLoading, error } = useInterventionalTreatments();
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(20);

  // Normalize intervention type values into user-friendly categories
  const normalizeInterventionType = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    // Neuromodulation
    if (
      lowerValue.includes("tms") ||
      lowerValue.includes("transcranial magnetic") ||
      lowerValue.includes("rtms") ||
      lowerValue.includes("repetitive tms") ||
      lowerValue.includes("deep tms") ||
      lowerValue.includes("dtms")
    ) {
      return "Transcranial Magnetic Stimulation";
    }

    if (
      lowerValue.includes("ect") ||
      lowerValue.includes("electroconvulsive") ||
      lowerValue.includes("electric shock") ||
      lowerValue.includes("shock therapy")
    ) {
      return "Electroconvulsive Therapy";
    }

    if (
      lowerValue.includes("vns") ||
      lowerValue.includes("vagus nerve") ||
      lowerValue.includes("vagal nerve")
    ) {
      return "Vagus Nerve Stimulation";
    }

    if (
      lowerValue.includes("dbs") ||
      lowerValue.includes("deep brain") ||
      lowerValue.includes("brain stimulation")
    ) {
      return "Deep Brain Stimulation";
    }

    if (
      lowerValue.includes("tdcs") ||
      lowerValue.includes("transcranial direct current") ||
      lowerValue.includes("direct current")
    ) {
      return "Transcranial Direct Current Stimulation";
    }

    if (
      lowerValue.includes("epidural") ||
      lowerValue.includes("spinal cord") ||
      lowerValue.includes("peripheral nerve") ||
      lowerValue.includes("neurostimulation")
    ) {
      return "Other Neurostimulation";
    }

    // Ketamine & Anesthetics
    if (
      lowerValue.includes("ketamine") ||
      lowerValue.includes("esketamine") ||
      lowerValue.includes("spravato")
    ) {
      return "Ketamine Therapy";
    }

    if (
      lowerValue.includes("nitrous oxide") ||
      lowerValue.includes("xenon") ||
      lowerValue.includes("anesthetic")
    ) {
      return "Anesthetic Therapy";
    }

    // Light Therapy
    if (
      lowerValue.includes("light therapy") ||
      lowerValue.includes("bright light") ||
      lowerValue.includes("phototherapy") ||
      lowerValue.includes("light treatment")
    ) {
      return "Light Therapy";
    }

    if (
      lowerValue.includes("dawn simulation") ||
      lowerValue.includes("circadian light") ||
      lowerValue.includes("wake light")
    ) {
      return "Circadian Light Therapy";
    }

    if (
      lowerValue.includes("red light") ||
      lowerValue.includes("near infrared") ||
      lowerValue.includes("photobiomodulation") ||
      lowerValue.includes("lllt")
    ) {
      return "Photobiomodulation";
    }

    // Neurofeedback & Biofeedback
    if (
      lowerValue.includes("neurofeedback") ||
      lowerValue.includes("eeg feedback") ||
      lowerValue.includes("brainwave") ||
      lowerValue.includes("neurotherapy")
    ) {
      return "Neurofeedback";
    }

    if (
      lowerValue.includes("biofeedback") ||
      lowerValue.includes("hrv") ||
      lowerValue.includes("heart rate variability") ||
      lowerValue.includes("emg") ||
      lowerValue.includes("galvanic skin")
    ) {
      return "Biofeedback";
    }

    if (
      lowerValue.includes("fmri") ||
      lowerValue.includes("real-time") ||
      lowerValue.includes("rtfmri")
    ) {
      return "Real-time fMRI";
    }

    // Other
    return "Other Interventional";
  };

  // Normalize invasiveness level
  const normalizeInvasivenessLevel = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    if (
      lowerValue.includes("non-invasive") ||
      lowerValue.includes("noninvasive") ||
      lowerValue.includes("external")
    ) {
      return "Non-invasive";
    }

    if (
      lowerValue.includes("minimally invasive") ||
      lowerValue.includes("minimal") ||
      lowerValue.includes("minor")
    ) {
      return "Minimally Invasive";
    }

    if (
      lowerValue.includes("invasive") ||
      lowerValue.includes("surgical") ||
      lowerValue.includes("implant")
    ) {
      return "Invasive";
    }

    return "Unknown Invasiveness";
  };

  // Normalize safety profile
  const normalizeSafetyProfile = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    if (
      lowerValue.includes("excellent") ||
      lowerValue.includes("very safe") ||
      lowerValue.includes("minimal risk")
    ) {
      return "Excellent Safety";
    }

    if (
      lowerValue.includes("good") ||
      lowerValue.includes("well tolerated") ||
      lowerValue.includes("low risk")
    ) {
      return "Good Safety";
    }

    if (
      lowerValue.includes("moderate") ||
      lowerValue.includes("acceptable") ||
      lowerValue.includes("some risk")
    ) {
      return "Moderate Safety";
    }

    if (
      lowerValue.includes("requires monitoring") ||
      lowerValue.includes("careful") ||
      lowerValue.includes("higher risk")
    ) {
      return "Requires Monitoring";
    }

    return "Safety Profile Unknown";
  };

  // Normalize condition values to match main categories
  const normalizeConditionValue = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    // Treatment-Resistant Depression (special category for interventions)
    if (
      lowerValue.includes("treatment-resistant") ||
      lowerValue.includes("treatment resistant") ||
      lowerValue.includes("refractory") ||
      lowerValue.includes("resistant depression")
    ) {
      return "Treatment-Resistant Depression";
    }

    // Mood & Depression
    if (
      lowerValue.includes("depression") ||
      lowerValue.includes("depressive") ||
      lowerValue.includes("major depressive") ||
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

    // OCD & Related
    if (
      lowerValue.includes("ocd") ||
      lowerValue.includes("obsessive") ||
      lowerValue.includes("compulsive")
    ) {
      return "Obsessive & Compulsive";
    }

    // Trauma & PTSD
    if (
      lowerValue.includes("ptsd") ||
      lowerValue.includes("trauma") ||
      lowerValue.includes("post-traumatic")
    ) {
      return "Trauma & Stress";
    }

    // Psychotic Disorders
    if (
      lowerValue.includes("schizophrenia") ||
      lowerValue.includes("psychosis") ||
      lowerValue.includes("psychotic") ||
      lowerValue.includes("hallucination")
    ) {
      return "Psychotic Disorders";
    }

    // Chronic Pain (common for interventions)
    if (
      lowerValue.includes("pain") ||
      lowerValue.includes("chronic pain") ||
      lowerValue.includes("fibromyalgia") ||
      lowerValue.includes("neuropathic")
    ) {
      return "Chronic Pain";
    }

    // Movement Disorders
    if (
      lowerValue.includes("parkinson") ||
      lowerValue.includes("dystonia") ||
      lowerValue.includes("tremor") ||
      lowerValue.includes("movement")
    ) {
      return "Movement Disorders";
    }

    // Epilepsy & Seizures
    if (
      lowerValue.includes("epilepsy") ||
      lowerValue.includes("seizure") ||
      lowerValue.includes("convulsion")
    ) {
      return "Epilepsy & Seizures";
    }

    // Sleep Disorders
    if (
      lowerValue.includes("sleep") ||
      lowerValue.includes("insomnia") ||
      lowerValue.includes("circadian") ||
      lowerValue.includes("seasonal")
    ) {
      return "Sleep & Circadian";
    }

    // Cognitive Enhancement
    if (
      lowerValue.includes("cognitive") ||
      lowerValue.includes("memory") ||
      lowerValue.includes("attention") ||
      lowerValue.includes("enhancement")
    ) {
      return "Cognitive Enhancement";
    }

    return "Other Conditions";
  };

  // Define filter categories (empty - filters removed as requested)
  const filterCategories: FilterCategory[] = [];

  // Extract unique options for each filter category
  const enrichedFilterCategories = useMemo(() => {
    if (!interventionalTreatments) return filterCategories;

    return filterCategories.map((category) => {
      if (category.options.length > 0) return category;

      const allValues = new Set<string>();
      interventionalTreatments.forEach((treatment: Entity) => {
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
  }, [interventionalTreatments, filterCategories]);

  // Filter treatments based on search and active filters
  const filteredTreatments = useMemo(() => {
    if (!interventionalTreatments) return [];

    let results = interventionalTreatments;

    // Apply search query with relevance scoring
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();

      // Map treatments to include relevance score
      const scoredResults = results.map((treatment) => {
        const name = treatment.name?.toLowerCase() || "";
        const description = treatment.description?.toLowerCase() || "";
        const content = JSON.stringify(treatment.data || {}).toLowerCase();

        let score = 0;
        const nameIncludes = name.includes(query);
        const descIncludes = description.includes(query);
        const contentIncludes = content.includes(query);

        // Scoring system: prioritize name matches heavily
        if (nameIncludes) {
          // Exact match or starts with gets highest score
          if (name === query || name.startsWith(query + " ") || name.startsWith(query + "(")) {
            score = 1000;
          }
          // Name contains query as standalone word
          else if (name.includes(" " + query + " ") || name.includes(" " + query + ")") || name.includes("(" + query + ")")) {
            score = 500;
          }
          // Name contains query anywhere
          else {
            score = 100;
          }
        } else if (descIncludes) {
          score = 10;
        } else if (contentIncludes) {
          score = 1;
        }

        return { treatment, score };
      });

      // Filter based on query length and relevance score
      // For short queries (3 chars or less), only show high-relevance matches
      const minScore = query.length <= 3 ? 100 : 0;

      results = scoredResults
        .filter(({ score }) => score > minScore)
        .sort((a, b) => {
          // Sort by score (descending), then by name (ascending)
          if (b.score !== a.score) return b.score - a.score;
          return a.treatment.name.localeCompare(b.treatment.name);
        })
        .map(({ treatment }) => treatment);
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
  }, [interventionalTreatments, activeFilters, enrichedFilterCategories, searchQuery]);

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
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <h1 className="text-2xl font-bold text-neutral-900">Loading interventional treatments...</h1>
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
              Error Loading Interventional Treatments
            </h1>
            <p className="mb-4 text-neutral-800">
              We couldn't load the interventional treatments data.
            </p>
            <Link
              href="/treatments"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Interventional Treatments
              </span>
            </h1>

            <div className="w-[100px]"></div>
          </div>

          {/* Description Section */}
          <div className="mb-4 text-center">
            <p className="mx-auto mb-3 max-w-2xl text-sm text-slate-600">
              Advanced medical interventions including brain stimulation, neurofeedback, and other
              evidence-based procedures for treatment-resistant mental health conditions.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                {sortedTreatments?.length || 0} Interventions
                {filteredTreatments?.length !== interventionalTreatments?.length && (
                  <span className="text-orange-600">
                    (filtered from {interventionalTreatments?.length})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                Evidence-Based
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                Medical Procedures
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
                placeholder="Search interventional treatments by name or procedure... (Press Enter)"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
              <Card className="border border-purple-100 bg-white/80 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                                className="mr-2 rounded border-gray-300 text-purple-600"
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
                        className="cursor-pointer border-purple-200 hover:bg-purple-50"
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

      {/* Interventional Treatments Grid */}
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
                  key={`interventional-grid-${visibleCount}`}
                  entities={visibleTreatments}
                  title=""
                  variant="default"
                  showFilters={false}
                  showComparison={true}
                  onEntityClick={handleTreatmentClick}
                  className="rounded-3xl border border-purple-100 bg-white/90 p-8 shadow-2xl shadow-purple-100/50 backdrop-blur-xl"
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
              <Card className="mx-auto max-w-md bg-white/80 backdrop-blur-xl">
                <CardContent className="p-8">
                  <Zap className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "No Treatments Match"
                      : "No Interventional Treatments Found"}
                  </h3>
                  <p className="mb-6 text-slate-600">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "Try adjusting your search or filter criteria."
                      : "It looks like the interventional treatments data hasn't been imported yet."}
                  </p>
                  {getActiveFilterCount() > 0 || searchQuery.trim() ? (
                    <Button onClick={clearAllFilters} className="bg-purple-600 hover:bg-purple-700">
                      Clear All Filters
                    </Button>
                  ) : (
                    <Link
                      href="/treatments"
                      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
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
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-purple-600" />
                <div>
                  <h3 className="mb-2 font-semibold text-purple-900">
                    Medical Intervention Requirements
                  </h3>
                  <p className="text-sm text-purple-800">
                    These interventional treatments require specialized medical facilities and
                    trained professionals. They are typically considered when standard treatments
                    haven't been effective. Always consult with qualified specialists to determine
                    if these interventions are appropriate for your specific condition.
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

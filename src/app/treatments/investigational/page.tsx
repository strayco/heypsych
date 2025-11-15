"use client";


import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useInvestigationalTreatments } from "@/lib/hooks/use-entities";
import { TreatmentGrid } from "@/components/blocks/treatment-grid";
import { Entity } from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Beaker,
  AlertCircle,
  Filter,
  X,
  ChevronDown,
  Lock,
  Users,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

type FilterCategory = {
  id: string;
  label: string;
  options: string[];
  getValues: (entity: Entity) => string[];
};

export default function InvestigationalTreatmentsPage() {
  const { data: investigationalTreatments, isLoading, error } = useInvestigationalTreatments();
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

    // Psychedelics & Entheogens
    if (
      lowerValue.includes("psilocybin") ||
      lowerValue.includes("magic mushroom") ||
      lowerValue.includes("psilocin") ||
      lowerValue.includes("mushroom therapy")
    ) {
      return "Psilocybin Therapy";
    }

    if (
      lowerValue.includes("mdma") ||
      lowerValue.includes("methylenedioxymethamphetamine") ||
      lowerValue.includes("ecstasy") ||
      lowerValue.includes("molly")
    ) {
      return "MDMA-Assisted Therapy";
    }

    if (
      lowerValue.includes("lsd") ||
      lowerValue.includes("lysergic acid") ||
      lowerValue.includes("acid") ||
      lowerValue.includes("psychedelic therapy")
    ) {
      return "LSD Therapy";
    }

    if (
      lowerValue.includes("ayahuasca") ||
      lowerValue.includes("dmt") ||
      lowerValue.includes("dimethyltryptamine") ||
      lowerValue.includes("5-meo-dmt")
    ) {
      return "Plant Medicine Therapy";
    }

    if (
      lowerValue.includes("mescaline") ||
      lowerValue.includes("san pedro") ||
      lowerValue.includes("peyote") ||
      lowerValue.includes("cactus medicine")
    ) {
      return "Mescaline Therapy";
    }

    if (
      lowerValue.includes("ibogaine") ||
      lowerValue.includes("iboga") ||
      lowerValue.includes("addiction medicine")
    ) {
      return "Ibogaine Therapy";
    }

    // Novel Medications
    if (
      lowerValue.includes("brexanolone") ||
      lowerValue.includes("zulresso") ||
      lowerValue.includes("allopregnanolone")
    ) {
      return "Neurosteroid Therapy";
    }

    if (
      lowerValue.includes("zuranolone") ||
      lowerValue.includes("sage-217") ||
      lowerValue.includes("postpartum depression")
    ) {
      return "Novel Neurosteroids";
    }

    if (
      lowerValue.includes("glutamate") ||
      lowerValue.includes("nmda") ||
      lowerValue.includes("ampa") ||
      lowerValue.includes("metabotropic")
    ) {
      return "Glutamate Modulators";
    }

    if (
      lowerValue.includes("triple reuptake") ||
      lowerValue.includes("multimodal") ||
      lowerValue.includes("novel antidepressant") ||
      lowerValue.includes("experimental antidepressant")
    ) {
      return "Novel Antidepressants";
    }

    if (
      lowerValue.includes("opioid antagonist") ||
      lowerValue.includes("kappa opioid") ||
      lowerValue.includes("delta opioid") ||
      lowerValue.includes("opioid system")
    ) {
      return "Opioid System Modulators";
    }

    // Gene & Cell Therapy
    if (
      lowerValue.includes("gene therapy") ||
      lowerValue.includes("crispr") ||
      lowerValue.includes("genetic modification") ||
      lowerValue.includes("viral vector")
    ) {
      return "Gene Therapy";
    }

    if (
      lowerValue.includes("stem cell") ||
      lowerValue.includes("cell therapy") ||
      lowerValue.includes("regenerative") ||
      lowerValue.includes("cellular therapy")
    ) {
      return "Cell Therapy";
    }

    // Advanced Technology
    if (
      lowerValue.includes("brain computer") ||
      lowerValue.includes("bci") ||
      lowerValue.includes("neural interface") ||
      lowerValue.includes("implant")
    ) {
      return "Brain-Computer Interface";
    }

    if (
      lowerValue.includes("optogenetics") ||
      lowerValue.includes("chemogenetics") ||
      lowerValue.includes("light activation") ||
      lowerValue.includes("genetic control")
    ) {
      return "Optogenetics/Chemogenetics";
    }

    if (
      lowerValue.includes("closed loop") ||
      lowerValue.includes("adaptive") ||
      lowerValue.includes("responsive stimulation") ||
      lowerValue.includes("smart device")
    ) {
      return "Closed-Loop Systems";
    }

    if (
      lowerValue.includes("focused ultrasound") ||
      lowerValue.includes("hifu") ||
      lowerValue.includes("ultrasound therapy") ||
      lowerValue.includes("acoustic therapy")
    ) {
      return "Focused Ultrasound";
    }

    // Digital Therapeutics
    if (
      lowerValue.includes("digital therapeutic") ||
      lowerValue.includes("app therapy") ||
      lowerValue.includes("digital medicine") ||
      lowerValue.includes("software therapy")
    ) {
      return "Digital Therapeutics";
    }

    if (
      lowerValue.includes("virtual reality") ||
      lowerValue.includes("vr therapy") ||
      lowerValue.includes("augmented reality") ||
      lowerValue.includes("immersive therapy")
    ) {
      return "Virtual Reality Therapy";
    }

    // Other
    return "Other Investigational";
  };

  // Normalize trial phase
  const normalizeTrialPhase = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    if (
      lowerValue.includes("phase i") ||
      lowerValue.includes("phase 1") ||
      lowerValue.includes("phase-1") ||
      lowerValue.includes("phase one")
    ) {
      return "Phase I";
    }

    if (
      lowerValue.includes("phase ii") ||
      lowerValue.includes("phase 2") ||
      lowerValue.includes("phase-2") ||
      lowerValue.includes("phase two")
    ) {
      return "Phase II";
    }

    if (
      lowerValue.includes("phase iii") ||
      lowerValue.includes("phase 3") ||
      lowerValue.includes("phase-3") ||
      lowerValue.includes("phase three")
    ) {
      return "Phase III";
    }

    if (
      lowerValue.includes("pre-clinical") ||
      lowerValue.includes("preclinical") ||
      lowerValue.includes("animal") ||
      lowerValue.includes("laboratory")
    ) {
      return "Pre-clinical";
    }

    if (
      lowerValue.includes("compassionate use") ||
      lowerValue.includes("expanded access") ||
      lowerValue.includes("emergency use") ||
      lowerValue.includes("breakthrough therapy")
    ) {
      return "Expanded Access";
    }

    if (
      lowerValue.includes("approved") ||
      lowerValue.includes("fda approved") ||
      lowerValue.includes("marketed")
    ) {
      return "FDA Approved";
    }

    return "Phase Unknown";
  };

  // Normalize regulatory status
  const normalizeRegulatoryStatus = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    if (
      lowerValue.includes("breakthrough") ||
      lowerValue.includes("fast track") ||
      lowerValue.includes("accelerated approval") ||
      lowerValue.includes("priority review")
    ) {
      return "Breakthrough Designation";
    }

    if (
      lowerValue.includes("orphan") ||
      lowerValue.includes("rare disease") ||
      lowerValue.includes("orphan drug")
    ) {
      return "Orphan Drug Status";
    }

    if (
      lowerValue.includes("investigational") ||
      lowerValue.includes("ind") ||
      lowerValue.includes("clinical trial") ||
      lowerValue.includes("experimental")
    ) {
      return "Investigational";
    }

    if (
      lowerValue.includes("schedule i") ||
      lowerValue.includes("controlled") ||
      lowerValue.includes("restricted") ||
      lowerValue.includes("dea schedule")
    ) {
      return "Controlled Substance";
    }

    if (
      lowerValue.includes("legal") ||
      lowerValue.includes("decriminalized") ||
      lowerValue.includes("permitted") ||
      lowerValue.includes("authorized")
    ) {
      return "Legal/Authorized";
    }

    return "Status Unknown";
  };

  // Normalize condition values to match main categories
  const normalizeConditionValue = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    // Treatment-Resistant Conditions (key for investigational)
    if (
      lowerValue.includes("treatment-resistant") ||
      lowerValue.includes("treatment resistant") ||
      lowerValue.includes("refractory") ||
      lowerValue.includes("resistant")
    ) {
      return "Treatment-Resistant Conditions";
    }

    // PTSD & Trauma (major focus for psychedelics)
    if (
      lowerValue.includes("ptsd") ||
      lowerValue.includes("trauma") ||
      lowerValue.includes("post-traumatic") ||
      lowerValue.includes("complex trauma") ||
      lowerValue.includes("c-ptsd")
    ) {
      return "PTSD & Trauma";
    }

    // Depression & Mood
    if (
      lowerValue.includes("depression") ||
      lowerValue.includes("depressive") ||
      lowerValue.includes("major depressive") ||
      lowerValue.includes("bipolar") ||
      lowerValue.includes("mood") ||
      lowerValue.includes("suicidal")
    ) {
      return "Depression & Mood Disorders";
    }

    // Anxiety & Phobias
    if (
      lowerValue.includes("anxiety") ||
      lowerValue.includes("panic") ||
      lowerValue.includes("phobia") ||
      lowerValue.includes("social anxiety") ||
      lowerValue.includes("generalized anxiety")
    ) {
      return "Anxiety Disorders";
    }

    // Addiction & Substance Use
    if (
      lowerValue.includes("addiction") ||
      lowerValue.includes("substance") ||
      lowerValue.includes("alcohol") ||
      lowerValue.includes("opioid") ||
      lowerValue.includes("cocaine") ||
      lowerValue.includes("dependence") ||
      lowerValue.includes("withdrawal")
    ) {
      return "Addiction & Substance Use";
    }

    // End-of-Life & Terminal
    if (
      lowerValue.includes("terminal") ||
      lowerValue.includes("end-of-life") ||
      lowerValue.includes("palliative") ||
      lowerValue.includes("death anxiety") ||
      lowerValue.includes("existential distress")
    ) {
      return "End-of-Life Care";
    }

    // Eating Disorders
    if (
      lowerValue.includes("anorexia") ||
      lowerValue.includes("bulimia") ||
      lowerValue.includes("eating disorder") ||
      lowerValue.includes("binge eating")
    ) {
      return "Eating Disorders";
    }

    // OCD & Related
    if (
      lowerValue.includes("ocd") ||
      lowerValue.includes("obsessive") ||
      lowerValue.includes("compulsive")
    ) {
      return "OCD & Related Disorders";
    }

    // Autism & Neurodevelopmental
    if (
      lowerValue.includes("autism") ||
      lowerValue.includes("adhd") ||
      lowerValue.includes("neurodevelopmental") ||
      lowerValue.includes("social communication")
    ) {
      return "Neurodevelopmental Disorders";
    }

    // Neurodegenerative
    if (
      lowerValue.includes("alzheimer") ||
      lowerValue.includes("dementia") ||
      lowerValue.includes("parkinson") ||
      lowerValue.includes("neurodegenerative")
    ) {
      return "Neurodegenerative Diseases";
    }

    // Chronic Pain
    if (
      lowerValue.includes("chronic pain") ||
      lowerValue.includes("fibromyalgia") ||
      lowerValue.includes("neuropathic pain") ||
      lowerValue.includes("cluster headache")
    ) {
      return "Chronic Pain Conditions";
    }

    return "Other Conditions";
  };

  // Define filter categories (empty - filters removed as requested)
  const filterCategories: FilterCategory[] = [];

  // Extract unique options for each filter category
  const enrichedFilterCategories = useMemo(() => {
    if (!investigationalTreatments) return filterCategories;

    return filterCategories.map((category) => {
      if (category.options.length > 0) return category;

      const allValues = new Set<string>();
      investigationalTreatments.forEach((treatment: Entity) => {
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
  }, [investigationalTreatments, filterCategories]);

  // Filter treatments based on search and active filters
  const filteredTreatments = useMemo(() => {
    if (!investigationalTreatments) return [];

    let results = investigationalTreatments;

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
  }, [investigationalTreatments, activeFilters, enrichedFilterCategories, searchQuery]);

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
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Loading investigational treatments...
          </h1>
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
              Error Loading Investigational Treatments
            </h1>
            <p className="mb-4 text-neutral-800">
              We couldn't load the investigational treatments data.
            </p>
            <Link
              href="/treatments"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
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
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Investigational Treatments
              </span>
            </h1>

            <div className="w-[100px]"></div>
          </div>

          {/* Description Section */}
          <div className="mb-4 text-center">
            <p className="mx-auto mb-3 max-w-2xl text-sm text-slate-600">
              Breakthrough therapies in clinical trials including psychedelic medicine, novel
              medications, gene therapy, and cutting-edge technologies for mental health conditions.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                {sortedTreatments?.length || 0} Treatments
                {filteredTreatments?.length !== investigationalTreatments?.length && (
                  <span className="text-orange-600">
                    (filtered from {investigationalTreatments?.length})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                Clinical Research
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                Breakthrough Science
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
                placeholder="Search investigational treatments by name or trial phase... (Press Enter)"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
              <Card className="border border-amber-100 bg-white/80 backdrop-blur-xl">
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
                                className="mr-2 rounded border-gray-300 text-amber-600"
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
                        className="cursor-pointer border-amber-200 hover:bg-amber-50"
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

      {/* Investigational Treatments Grid */}
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
                  key={`investigational-grid-${visibleCount}`}
                  entities={visibleTreatments}
                  title=""
                  variant="default"
                  showFilters={false}
                  showComparison={true}
                  onEntityClick={handleTreatmentClick}
                  className="rounded-3xl border border-amber-100 bg-white/90 p-8 shadow-2xl shadow-amber-100/50 backdrop-blur-xl"
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
                  <Beaker className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "No Treatments Match"
                      : "No Investigational Treatments Found"}
                  </h3>
                  <p className="mb-6 text-slate-600">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "Try adjusting your search or filter criteria."
                      : "It looks like the investigational treatments data hasn't been imported yet."}
                  </p>
                  {getActiveFilterCount() > 0 || searchQuery.trim() ? (
                    <Button onClick={clearAllFilters} className="bg-amber-600 hover:bg-amber-700">
                      Clear All Filters
                    </Button>
                  ) : (
                    <Link
                      href="/treatments"
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
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

      {/* Clinical Trial Information */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* How to Participate */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">How to Participate</h3>
                </div>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Contact research centers directly</li>
                  <li>• Check eligibility criteria carefully</li>
                  <li>• Discuss with your healthcare provider</li>
                  <li>• Review informed consent thoroughly</li>
                  <li>• Consider travel and time commitments</li>
                </ul>
              </CardContent>
            </Card>

            {/* Understanding Phases */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold text-green-900">Trial Phases</h3>
                </div>
                <div className="space-y-2 text-sm text-green-800">
                  <div>
                    <strong>Phase I:</strong> Safety testing, small groups
                  </div>
                  <div>
                    <strong>Phase II:</strong> Efficacy testing, larger groups
                  </div>
                  <div>
                    <strong>Phase III:</strong> Comparison to standard care
                  </div>
                  <div>
                    <strong>Expanded Access:</strong> For serious conditions
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Considerations */}
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Lock className="h-6 w-6 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Key Considerations</h3>
                </div>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li>• Experimental treatments carry risks</li>
                  <li>• Benefits are not guaranteed</li>
                  <li>• May require stopping current treatments</li>
                  <li>• Close monitoring is required</li>
                  <li>• Consider backup treatment plans</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Research Resources */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <h3 className="mb-4 text-2xl font-bold text-slate-900">Find Clinical Trials</h3>
              <p className="mx-auto mb-6 max-w-2xl text-slate-600">
                These investigational treatments are available only through clinical trials. Search
                ClinicalTrials.gov for current studies in your area.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href="https://clinicaltrials.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex transform items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-amber-700 hover:to-orange-700 hover:shadow-xl"
                >
                  Search ClinicalTrials.gov
                  <ArrowLeft className="h-5 w-5 rotate-180" />
                </a>
                <Link
                  href="/psychiatrists"
                  className="inline-flex transform items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 font-semibold text-slate-700 transition-all duration-300 hover:scale-105 hover:border-slate-300 hover:bg-slate-50"
                >
                  Find Research Centers
                  <Users className="h-5 w-5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Important Disclaimer */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-red-600" />
                <div>
                  <h3 className="mb-2 font-semibold text-red-900">
                    Investigational Treatment Disclaimer
                  </h3>
                  <p className="text-sm text-red-800">
                    These treatments are experimental and not approved for general use. They are
                    available only through clinical trials under strict medical supervision.
                    Participation involves risks and potential benefits should be carefully weighed
                    with qualified researchers and your healthcare team. Always maintain current
                    treatment plans unless advised otherwise by trial investigators.
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

"use client";


import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useSupplements } from "@/lib/hooks/use-entities";
import { TreatmentGrid } from "@/components/blocks/treatment-grid";
import { Entity } from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Leaf,
  AlertCircle,
  Filter,
  X,
  ChevronDown,
  Shield,
  Heart,
  Brain,
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

export default function SupplementsPage() {
  const { data: supplements, isLoading, error } = useSupplements();
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(20);

  // Normalize supplement type values into user-friendly categories
  const normalizeSupplementType = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    // Amino Acids & Proteins
    if (
      lowerValue.includes("5-htp") ||
      lowerValue.includes("5-hydroxytryptophan") ||
      lowerValue.includes("tryptophan") ||
      lowerValue.includes("l-tryptophan")
    ) {
      return "Serotonin Precursors";
    }

    if (
      lowerValue.includes("tyrosine") ||
      lowerValue.includes("l-tyrosine") ||
      lowerValue.includes("phenylalanine") ||
      lowerValue.includes("l-phenylalanine")
    ) {
      return "Dopamine Precursors";
    }

    if (
      lowerValue.includes("theanine") ||
      lowerValue.includes("l-theanine") ||
      lowerValue.includes("gaba") ||
      lowerValue.includes("gamma-aminobutyric") ||
      lowerValue.includes("taurine") ||
      lowerValue.includes("glycine")
    ) {
      return "Calming Amino Acids";
    }

    if (
      lowerValue.includes("glutamine") ||
      lowerValue.includes("carnitine") ||
      lowerValue.includes("acetyl-l-carnitine") ||
      lowerValue.includes("creatine") ||
      lowerValue.includes("arginine")
    ) {
      return "Performance Amino Acids";
    }

    // Vitamins & Minerals
    if (
      lowerValue.includes("vitamin d") ||
      lowerValue.includes("cholecalciferol") ||
      lowerValue.includes("vitamin d3") ||
      lowerValue.includes("calciferol")
    ) {
      return "Vitamin D";
    }

    if (
      lowerValue.includes("b-complex") ||
      lowerValue.includes("b complex") ||
      lowerValue.includes("vitamin b") ||
      lowerValue.includes("thiamine") ||
      lowerValue.includes("riboflavin") ||
      lowerValue.includes("niacin") ||
      lowerValue.includes("b6") ||
      lowerValue.includes("b12") ||
      lowerValue.includes("folate") ||
      lowerValue.includes("biotin")
    ) {
      return "B-Complex Vitamins";
    }

    if (
      lowerValue.includes("magnesium") ||
      lowerValue.includes("zinc") ||
      lowerValue.includes("iron") ||
      lowerValue.includes("selenium") ||
      lowerValue.includes("chromium") ||
      lowerValue.includes("lithium orotate") ||
      lowerValue.includes("calcium") ||
      lowerValue.includes("potassium")
    ) {
      return "Essential Minerals";
    }

    if (
      lowerValue.includes("vitamin c") ||
      lowerValue.includes("ascorbic acid") ||
      lowerValue.includes("vitamin e") ||
      lowerValue.includes("tocopherol") ||
      lowerValue.includes("vitamin k") ||
      lowerValue.includes("vitamin a")
    ) {
      return "Antioxidant Vitamins";
    }

    // Omega Fatty Acids
    if (
      lowerValue.includes("fish oil") ||
      lowerValue.includes("omega-3") ||
      lowerValue.includes("omega 3") ||
      lowerValue.includes("epa") ||
      lowerValue.includes("dha") ||
      lowerValue.includes("krill oil") ||
      lowerValue.includes("algae oil")
    ) {
      return "Omega-3 Fatty Acids";
    }

    if (
      lowerValue.includes("evening primrose") ||
      lowerValue.includes("borage oil") ||
      lowerValue.includes("black currant") ||
      lowerValue.includes("gla") ||
      lowerValue.includes("omega-6")
    ) {
      return "Omega-6 Fatty Acids";
    }

    // Herbal Adaptogens
    if (
      lowerValue.includes("ashwagandha") ||
      lowerValue.includes("withania") ||
      lowerValue.includes("rhodiola") ||
      lowerValue.includes("rhodiola rosea") ||
      lowerValue.includes("ginseng") ||
      lowerValue.includes("panax ginseng") ||
      lowerValue.includes("american ginseng") ||
      lowerValue.includes("siberian ginseng")
    ) {
      return "Adaptogenic Herbs";
    }

    // Cognitive & Nootropic Herbs
    if (
      lowerValue.includes("ginkgo") ||
      lowerValue.includes("ginkgo biloba") ||
      lowerValue.includes("bacopa") ||
      lowerValue.includes("bacopa monnieri") ||
      lowerValue.includes("lion mane") ||
      lowerValue.includes("lions mane") ||
      lowerValue.includes("hericium")
    ) {
      return "Cognitive Herbs";
    }

    // Calming Herbs
    if (
      lowerValue.includes("valerian") ||
      lowerValue.includes("valerian root") ||
      lowerValue.includes("passionflower") ||
      lowerValue.includes("passiflora") ||
      lowerValue.includes("chamomile") ||
      lowerValue.includes("lemon balm") ||
      lowerValue.includes("melissa") ||
      lowerValue.includes("lavender") ||
      lowerValue.includes("hops") ||
      lowerValue.includes("skullcap") ||
      lowerValue.includes("california poppy")
    ) {
      return "Calming Herbs";
    }

    if (
      lowerValue.includes("kava") ||
      lowerValue.includes("kava kava") ||
      lowerValue.includes("piper methysticum")
    ) {
      return "Anti-Anxiety Herbs";
    }

    // Mood & Depression Herbs
    if (
      lowerValue.includes("st. john") ||
      lowerValue.includes("st john") ||
      lowerValue.includes("hypericum") ||
      lowerValue.includes("johns wort")
    ) {
      return "Mood Support Herbs";
    }

    // Mushrooms & Fungi
    if (
      lowerValue.includes("reishi") ||
      lowerValue.includes("cordyceps") ||
      lowerValue.includes("chaga") ||
      lowerValue.includes("turkey tail") ||
      lowerValue.includes("shiitake") ||
      lowerValue.includes("maitake")
    ) {
      return "Medicinal Mushrooms";
    }

    // Probiotics & Gut Health
    if (
      lowerValue.includes("probiotic") ||
      lowerValue.includes("lactobacillus") ||
      lowerValue.includes("bifidobacterium") ||
      lowerValue.includes("acidophilus") ||
      lowerValue.includes("gut bacteria") ||
      lowerValue.includes("microbiome")
    ) {
      return "Probiotics";
    }

    if (
      lowerValue.includes("prebiotic") ||
      lowerValue.includes("fiber") ||
      lowerValue.includes("digestive enzyme") ||
      lowerValue.includes("betaine hcl")
    ) {
      return "Digestive Support";
    }

    // Brain & Cognitive Support
    if (
      lowerValue.includes("phosphatidylserine") ||
      lowerValue.includes("phosphatidylcholine") ||
      lowerValue.includes("alpha-gpc") ||
      lowerValue.includes("citicoline") ||
      lowerValue.includes("cdp-choline")
    ) {
      return "Brain Phospholipids";
    }

    if (
      lowerValue.includes("coq10") ||
      lowerValue.includes("coenzyme q10") ||
      lowerValue.includes("ubiquinol") ||
      lowerValue.includes("nad") ||
      lowerValue.includes("nicotinamide") ||
      lowerValue.includes("nmn")
    ) {
      return "Cellular Energy Support";
    }

    // Antioxidants
    if (
      lowerValue.includes("resveratrol") ||
      lowerValue.includes("curcumin") ||
      lowerValue.includes("turmeric") ||
      lowerValue.includes("quercetin") ||
      lowerValue.includes("green tea") ||
      lowerValue.includes("egcg") ||
      lowerValue.includes("grape seed") ||
      lowerValue.includes("milk thistle")
    ) {
      return "Antioxidant Compounds";
    }

    // Sleep Support
    if (
      lowerValue.includes("melatonin") ||
      lowerValue.includes("melatonin extended") ||
      lowerValue.includes("time release melatonin")
    ) {
      return "Sleep Hormones";
    }

    // Other
    return "Other Supplements";
  };

  // Normalize evidence level
  const normalizeEvidenceLevel = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    if (
      lowerValue.includes("strong") ||
      lowerValue.includes("well-established") ||
      lowerValue.includes("conclusive") ||
      lowerValue.includes("robust")
    ) {
      return "Strong Evidence";
    }

    if (
      lowerValue.includes("moderate") ||
      lowerValue.includes("good") ||
      lowerValue.includes("substantial") ||
      lowerValue.includes("promising")
    ) {
      return "Moderate Evidence";
    }

    if (
      lowerValue.includes("limited") ||
      lowerValue.includes("preliminary") ||
      lowerValue.includes("emerging") ||
      lowerValue.includes("some evidence")
    ) {
      return "Limited Evidence";
    }

    if (
      lowerValue.includes("insufficient") ||
      lowerValue.includes("conflicting") ||
      lowerValue.includes("mixed") ||
      lowerValue.includes("unclear")
    ) {
      return "Insufficient Evidence";
    }

    if (
      lowerValue.includes("traditional use") ||
      lowerValue.includes("historical") ||
      lowerValue.includes("anecdotal") ||
      lowerValue.includes("folk medicine")
    ) {
      return "Traditional Use Only";
    }

    return "Evidence Level Unknown";
  };

  // Normalize safety profile
  const normalizeSafetyProfile = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    if (
      lowerValue.includes("generally safe") ||
      lowerValue.includes("well tolerated") ||
      lowerValue.includes("safe for most") ||
      lowerValue.includes("excellent safety")
    ) {
      return "Generally Safe";
    }

    if (
      lowerValue.includes("caution") ||
      lowerValue.includes("drug interaction") ||
      lowerValue.includes("medical supervision") ||
      lowerValue.includes("contraindication")
    ) {
      return "Use with Caution";
    }

    if (
      lowerValue.includes("pregnancy") ||
      lowerValue.includes("breastfeeding") ||
      lowerValue.includes("children") ||
      lowerValue.includes("elderly")
    ) {
      return "Special Populations";
    }

    if (
      lowerValue.includes("side effects") ||
      lowerValue.includes("adverse") ||
      lowerValue.includes("monitor") ||
      lowerValue.includes("supervision required")
    ) {
      return "Monitor for Side Effects";
    }

    return "Safety Profile Unknown";
  };

  // Normalize condition values to match main categories
  const normalizeConditionValue = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    // Mood & Depression
    if (
      lowerValue.includes("depression") ||
      lowerValue.includes("depressive") ||
      lowerValue.includes("mood") ||
      lowerValue.includes("seasonal affective") ||
      lowerValue.includes("low mood")
    ) {
      return "Mood & Depression";
    }

    // Anxiety & Stress
    if (
      lowerValue.includes("anxiety") ||
      lowerValue.includes("stress") ||
      lowerValue.includes("worry") ||
      lowerValue.includes("nervousness") ||
      lowerValue.includes("panic") ||
      lowerValue.includes("social anxiety")
    ) {
      return "Anxiety & Stress";
    }

    // Sleep & Insomnia
    if (
      lowerValue.includes("sleep") ||
      lowerValue.includes("insomnia") ||
      lowerValue.includes("sleep quality") ||
      lowerValue.includes("sleep disorder") ||
      lowerValue.includes("circadian")
    ) {
      return "Sleep Disorders";
    }

    // Cognitive Function
    if (
      lowerValue.includes("cognitive") ||
      lowerValue.includes("memory") ||
      lowerValue.includes("focus") ||
      lowerValue.includes("concentration") ||
      lowerValue.includes("brain fog") ||
      lowerValue.includes("mental clarity") ||
      lowerValue.includes("attention")
    ) {
      return "Cognitive Function";
    }

    // Energy & Fatigue
    if (
      lowerValue.includes("energy") ||
      lowerValue.includes("fatigue") ||
      lowerValue.includes("tired") ||
      lowerValue.includes("exhaustion") ||
      lowerValue.includes("vitality") ||
      lowerValue.includes("stamina")
    ) {
      return "Energy & Fatigue";
    }

    // ADHD & Attention
    if (
      lowerValue.includes("adhd") ||
      lowerValue.includes("attention deficit") ||
      lowerValue.includes("hyperactivity") ||
      lowerValue.includes("focus disorder")
    ) {
      return "ADHD & Attention";
    }

    // Immune Support
    if (
      lowerValue.includes("immune") ||
      lowerValue.includes("immunity") ||
      lowerValue.includes("infection") ||
      lowerValue.includes("cold") ||
      lowerValue.includes("flu") ||
      lowerValue.includes("viral")
    ) {
      return "Immune Support";
    }

    // Inflammation
    if (
      lowerValue.includes("inflammation") ||
      lowerValue.includes("inflammatory") ||
      lowerValue.includes("anti-inflammatory") ||
      lowerValue.includes("joint pain") ||
      lowerValue.includes("arthritis")
    ) {
      return "Inflammation";
    }

    // Digestive Health
    if (
      lowerValue.includes("digestive") ||
      lowerValue.includes("gut health") ||
      lowerValue.includes("microbiome") ||
      lowerValue.includes("ibs") ||
      lowerValue.includes("bloating") ||
      lowerValue.includes("digestion")
    ) {
      return "Digestive Health";
    }

    // Heart Health
    if (
      lowerValue.includes("cardiovascular") ||
      lowerValue.includes("heart") ||
      lowerValue.includes("blood pressure") ||
      lowerValue.includes("cholesterol") ||
      lowerValue.includes("circulation")
    ) {
      return "Cardiovascular Health";
    }

    // General Wellness
    if (
      lowerValue.includes("general health") ||
      lowerValue.includes("wellness") ||
      lowerValue.includes("overall health") ||
      lowerValue.includes("nutritional support") ||
      lowerValue.includes("vitamin deficiency")
    ) {
      return "General Wellness";
    }

    return "Other Conditions";
  };

  // Define filter categories (empty - filters removed as requested)
  const filterCategories: FilterCategory[] = [];

  // Extract unique options for each filter category
  const enrichedFilterCategories = useMemo(() => {
    if (!supplements) return filterCategories;

    return filterCategories.map((category) => {
      if (category.options.length > 0) return category;

      const allValues = new Set<string>();
      supplements.forEach((supplement: Entity) => {
        const normalizedValues = category.getValues(supplement);
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
  }, [supplements, filterCategories]);

  // Filter supplements based on search and active filters
  const filteredSupplements = useMemo(() => {
    if (!supplements) return [];

    let results = supplements;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter((supplement) => {
        const name = supplement.name?.toLowerCase() || "";
        const description = supplement.description?.toLowerCase() || "";
        const content = JSON.stringify(supplement.data || {}).toLowerCase();

        return name.includes(query) || description.includes(query) || content.includes(query);
      });
    }

    // Apply filters
    return results.filter((supplement: Entity) => {
      return Object.entries(activeFilters).every(([categoryId, selectedValues]) => {
        if (selectedValues.length === 0) return true;

        const category = enrichedFilterCategories.find((c) => c.id === categoryId);
        if (!category) return true;

        const normalizedSupplementValues = category.getValues(supplement);

        return selectedValues.some((selectedValue) =>
          normalizedSupplementValues.includes(selectedValue)
        );
      });
    });
  }, [supplements, activeFilters, enrichedFilterCategories, searchQuery]);

  // Sort supplements
  const sortedSupplements = useMemo(() => {
    if (!filteredSupplements) return [];

    const sorted = [...filteredSupplements].sort((a, b) => {
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
  }, [filteredSupplements, sortBy]);

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

  const visibleSupplements = useMemo(() => {
    return sortedSupplements.slice(0, visibleCount);
  }, [sortedSupplements, visibleCount]);

  const hasMore = visibleCount < sortedSupplements.length;

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, values) => count + values.length, 0);
  };

  const handleSupplementClick = (entity: Entity) => {
    window.location.href = `/treatments/${entity.slug}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <h1 className="text-2xl font-bold text-neutral-900">Loading supplements...</h1>
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
            <h1 className="mb-2 text-xl font-bold text-neutral-900">Error Loading Supplements</h1>
            <p className="mb-4 text-neutral-800">We couldn't load the supplements data.</p>
            <Link
              href="/treatments"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
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
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Nutritional Supplements
              </span>
            </h1>

            <div className="w-[100px]"></div>
          </div>

          {/* Description Section */}
          <div className="mb-4 text-center">
            <p className="mx-auto mb-3 max-w-2xl text-sm text-slate-600">
              Evidence-based vitamins, minerals, herbs, and natural compounds that may support
              mental health and overall wellbeing. Quality and dosage matter - consult healthcare
              providers for guidance.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                {sortedSupplements?.length || 0} Supplements
                {filteredSupplements?.length !== supplements?.length && (
                  <span className="text-orange-600">(filtered from {supplements?.length})</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                Evidence-Based
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                Natural Compounds
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
                placeholder="Search supplements by name, ingredient, or benefit... (Press Enter)"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
              <Card className="border border-emerald-100 bg-white/80 backdrop-blur-xl">
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
                                className="mr-2 rounded border-gray-300 text-emerald-600"
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
                        className="cursor-pointer border-emerald-200 hover:bg-emerald-50"
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

      {/* Supplements Grid */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {sortedSupplements && sortedSupplements.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TreatmentGrid
                  key={`supplements-grid-${visibleCount}`}
                  entities={visibleSupplements}
                  title=""
                  variant="default"
                  showFilters={false}
                  showComparison={true}
                  onEntityClick={handleSupplementClick}
                  className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-2xl shadow-emerald-100/50 backdrop-blur-xl"
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
                    Showing {visibleCount} of {sortedSupplements.length} supplements
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
                  <Leaf className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "No Supplements Match"
                      : "No Supplements Found"}
                  </h3>
                  <p className="mb-6 text-slate-600">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "Try adjusting your search or filter criteria."
                      : "It looks like the supplements data hasn't been imported yet."}
                  </p>
                  {getActiveFilterCount() > 0 || searchQuery.trim() ? (
                    <Button
                      onClick={clearAllFilters}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Clear All Filters
                    </Button>
                  ) : (
                    <Link
                      href="/treatments"
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
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

      {/* Supplement Education */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Quality Matters */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Shield className="h-6 w-6 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900">Quality & Purity</h3>
                </div>
                <ul className="space-y-2 text-sm text-emerald-800">
                  <li>• Look for third-party testing</li>
                  <li>• Choose reputable manufacturers</li>
                  <li>• Check for standardized extracts</li>
                  <li>• Verify dosage accuracy</li>
                  <li>• Avoid unnecessary additives</li>
                </ul>
              </CardContent>
            </Card>

            {/* Safety Considerations */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Brain className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Safety First</h3>
                </div>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Check for drug interactions</li>
                  <li>• Start with lower doses</li>
                  <li>• Monitor for side effects</li>
                  <li>• Inform your healthcare provider</li>
                  <li>• Consider timing with meals</li>
                </ul>
              </CardContent>
            </Card>

            {/* Evidence-Based Approach */}
            <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Heart className="h-6 w-6 text-teal-600" />
                  <h3 className="font-semibold text-teal-900">Research-Based</h3>
                </div>
                <ul className="space-y-2 text-sm text-teal-800">
                  <li>• Review scientific evidence</li>
                  <li>• Understand study limitations</li>
                  <li>• Consider individual variation</li>
                  <li>• Track your response</li>
                  <li>• Combine with lifestyle changes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <h3 className="mb-4 text-2xl font-bold text-slate-900">
                Popular Supplement Categories
              </h3>
              <p className="mx-auto mb-6 max-w-2xl text-slate-600">
                From omega-3s for brain health to adaptogens for stress management, explore
                evidence-based natural compounds that support mental wellness.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="font-semibold text-emerald-800">Omega-3s</div>
                  <div className="text-emerald-600">Brain Health</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="font-semibold text-blue-800">B-Vitamins</div>
                  <div className="text-blue-600">Energy Support</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="font-semibold text-purple-800">Adaptogens</div>
                  <div className="text-purple-600">Stress Relief</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="font-semibold text-amber-800">Probiotics</div>
                  <div className="text-amber-600">Gut-Brain Health</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Important Disclaimers */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* FDA Disclaimer */}
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h3 className="mb-2 font-semibold text-amber-900">FDA Regulatory Notice</h3>
                  <p className="text-sm text-amber-800">
                    These statements have not been evaluated by the Food and Drug Administration.
                    Dietary supplements are not intended to diagnose, treat, cure, or prevent any
                    disease. The supplement industry is less regulated than pharmaceuticals -
                    quality and potency can vary significantly between brands.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Consultation */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <h3 className="mb-2 font-semibold text-blue-900">
                    Healthcare Provider Consultation
                  </h3>
                  <p className="text-sm text-blue-800">
                    Always consult with a qualified healthcare provider before starting any
                    supplement regimen, especially if you're taking medications, have medical
                    conditions, are pregnant or breastfeeding, or are considering supplements for
                    children. Some supplements can interact with medications or affect medical
                    conditions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Limitations */}
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Brain className="mt-1 h-5 w-5 flex-shrink-0 text-purple-600" />
                <div>
                  <h3 className="mb-2 font-semibold text-purple-900">Evidence-Based Approach</h3>
                  <p className="text-sm text-purple-800">
                    While many supplements show promising research, evidence levels vary widely.
                    Individual responses differ significantly, and what works for one person may not
                    work for another. Supplements work best as part of a comprehensive approach
                    including proper nutrition, exercise, sleep, and professional mental health care
                    when needed.
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

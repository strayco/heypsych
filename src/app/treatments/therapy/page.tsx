"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useTherapyTreatments } from "@/lib/hooks/use-entities";
import { TreatmentGrid } from "@/components/blocks/treatment-grid";
import { Entity } from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Brain,
  AlertCircle,
  Filter,
  X,
  ChevronDown,
  Users,
  Clock,
  Heart,
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

export default function TherapyTreatmentsPage() {
  const { data: therapyTreatments, isLoading, error } = useTherapyTreatments();
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(20);
  const ITEMS_PER_PAGE = 20;

  // Normalize therapy type values into user-friendly categories
  const normalizeTherapyType = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    // Cognitive-Behavioral Therapies
    if (
      lowerValue.includes("cognitive behavioral") ||
      lowerValue.includes("cognitive-behavioral") ||
      lowerValue.includes("cbt")
    ) {
      return "Cognitive Behavioral Therapy (CBT)";
    }

    if (
      lowerValue.includes("dialectical behavior") ||
      lowerValue.includes("dialectical behaviour") ||
      lowerValue.includes("dbt")
    ) {
      return "Dialectical Behavior Therapy (DBT)";
    }

    if (
      lowerValue.includes("acceptance commitment") ||
      lowerValue.includes("acceptance and commitment") ||
      lowerValue.includes("act")
    ) {
      return "Acceptance & Commitment Therapy (ACT)";
    }

    if (
      lowerValue.includes("mindfulness-based cognitive") ||
      lowerValue.includes("mindfulness based cognitive") ||
      lowerValue.includes("mbct")
    ) {
      return "Mindfulness-Based Cognitive Therapy (MBCT)";
    }

    if (
      lowerValue.includes("rational emotive") ||
      lowerValue.includes("rebt") ||
      lowerValue.includes("rational-emotive")
    ) {
      return "Rational Emotive Behavior Therapy (REBT)";
    }

    if (
      lowerValue.includes("cognitive processing") ||
      lowerValue.includes("cpt") ||
      lowerValue.includes("cognitive therapy")
    ) {
      return "Cognitive Processing Therapy (CPT)";
    }

    if (
      lowerValue.includes("behavioral activation") ||
      lowerValue.includes("behaviour activation") ||
      lowerValue.includes("ba")
    ) {
      return "Behavioral Activation";
    }

    if (
      (lowerValue.includes("exposure") && lowerValue.includes("response prevention")) ||
      lowerValue.includes("erp") ||
      lowerValue.includes("exposure therapy")
    ) {
      return "Exposure & Response Prevention (ERP)";
    }

    // Trauma-Focused Therapies
    if (
      lowerValue.includes("emdr") ||
      lowerValue.includes("eye movement") ||
      lowerValue.includes("desensitization and reprocessing")
    ) {
      return "EMDR";
    }

    if (
      lowerValue.includes("trauma-focused") ||
      lowerValue.includes("trauma focused") ||
      lowerValue.includes("tf-cbt")
    ) {
      return "Trauma-Focused CBT";
    }

    if (
      lowerValue.includes("somatic experiencing") ||
      lowerValue.includes("somatic therapy") ||
      lowerValue.includes("body-based")
    ) {
      return "Somatic Experiencing";
    }

    if (
      lowerValue.includes("prolonged exposure") ||
      lowerValue.includes("pe therapy") ||
      lowerValue.includes("pe")
    ) {
      return "Prolonged Exposure Therapy";
    }

    if (
      lowerValue.includes("narrative exposure") ||
      lowerValue.includes("net") ||
      lowerValue.includes("narrative therapy")
    ) {
      return "Narrative Exposure Therapy";
    }

    if (
      lowerValue.includes("accelerated resolution") ||
      lowerValue.includes("art therapy") ||
      lowerValue.includes("accelerated")
    ) {
      return "Accelerated Resolution Therapy";
    }

    if (lowerValue.includes("brainspotting") || lowerValue.includes("brain spotting")) {
      return "Brainspotting";
    }

    if (lowerValue.includes("havening") || lowerValue.includes("havening techniques")) {
      return "Havening Techniques";
    }

    // Psychodynamic Therapies
    if (
      lowerValue.includes("psychoanalysis") ||
      lowerValue.includes("psychoanalytic") ||
      lowerValue.includes("freudian")
    ) {
      return "Psychoanalysis";
    }

    if (
      lowerValue.includes("brief dynamic") ||
      lowerValue.includes("short-term dynamic") ||
      lowerValue.includes("brief psychodynamic")
    ) {
      return "Brief Dynamic Therapy";
    }

    if (lowerValue.includes("object relations") || lowerValue.includes("object-relations")) {
      return "Object Relations Therapy";
    }

    if (
      lowerValue.includes("interpersonal") ||
      lowerValue.includes("ipt") ||
      lowerValue.includes("interpersonal therapy")
    ) {
      return "Interpersonal Therapy (IPT)";
    }

    if (
      lowerValue.includes("mentalization") ||
      lowerValue.includes("mbt") ||
      lowerValue.includes("mentalization-based")
    ) {
      return "Mentalization-Based Therapy (MBT)";
    }

    if (
      lowerValue.includes("transference-focused") ||
      lowerValue.includes("transference focused") ||
      lowerValue.includes("tfp")
    ) {
      return "Transference-Focused Therapy (TFP)";
    }

    // Humanistic & Experiential Therapies
    if (
      lowerValue.includes("person-centered") ||
      lowerValue.includes("person centered") ||
      lowerValue.includes("client-centered") ||
      lowerValue.includes("rogerian")
    ) {
      return "Person-Centered Therapy";
    }

    if (lowerValue.includes("gestalt") || lowerValue.includes("gestalt therapy")) {
      return "Gestalt Therapy";
    }

    if (lowerValue.includes("existential") || lowerValue.includes("existential therapy")) {
      return "Existential Therapy";
    }

    if (lowerValue.includes("logotherapy") || lowerValue.includes("meaning therapy")) {
      return "Logotherapy";
    }

    if (lowerValue.includes("reality therapy") || lowerValue.includes("choice theory")) {
      return "Reality Therapy";
    }

    if (
      lowerValue.includes("solution-focused") ||
      lowerValue.includes("solution focused") ||
      lowerValue.includes("sfbt") ||
      lowerValue.includes("brief therapy")
    ) {
      return "Solution-Focused Brief Therapy";
    }

    // Family & Couples Therapies
    if (
      lowerValue.includes("family therapy") ||
      lowerValue.includes("family systems") ||
      lowerValue.includes("systemic therapy")
    ) {
      return "Family Therapy";
    }

    if (
      lowerValue.includes("couples therapy") ||
      lowerValue.includes("couples counseling") ||
      lowerValue.includes("marital therapy")
    ) {
      return "Couples Therapy";
    }

    if (lowerValue.includes("gottman") || lowerValue.includes("gottman method")) {
      return "Gottman Method";
    }

    if (
      lowerValue.includes("emotionally focused") ||
      lowerValue.includes("eft") ||
      lowerValue.includes("emotion-focused")
    ) {
      return "Emotionally Focused Therapy (EFT)";
    }

    if (lowerValue.includes("structural family") || lowerValue.includes("structural therapy")) {
      return "Structural Family Therapy";
    }

    if (lowerValue.includes("strategic family") || lowerValue.includes("strategic therapy")) {
      return "Strategic Family Therapy";
    }

    if (
      lowerValue.includes("bowen") ||
      lowerValue.includes("bowen family") ||
      lowerValue.includes("multigenerational")
    ) {
      return "Bowen Family Systems";
    }

    // Specialized Child/Adolescent Therapies
    if (lowerValue.includes("multisystemic") || lowerValue.includes("mst")) {
      return "Multisystemic Therapy (MST)";
    }

    if (lowerValue.includes("functional family") || lowerValue.includes("fft")) {
      return "Functional Family Therapy (FFT)";
    }

    if (lowerValue.includes("multidimensional family") || lowerValue.includes("mdft")) {
      return "Multidimensional Family Therapy (MDFT)";
    }

    if (lowerValue.includes("parent-child interaction") || lowerValue.includes("pcit")) {
      return "Parent-Child Interaction Therapy (PCIT)";
    }

    if (lowerValue.includes("child-parent psychotherapy") || lowerValue.includes("cpp")) {
      return "Child-Parent Psychotherapy (CPP)";
    }

    if (lowerValue.includes("play therapy") || lowerValue.includes("therapeutic play")) {
      return "Play Therapy";
    }

    // Group Therapies
    if (lowerValue.includes("group therapy") || lowerValue.includes("group psychotherapy")) {
      return "Group Therapy";
    }

    if (lowerValue.includes("process group") || lowerValue.includes("process-oriented")) {
      return "Process Groups";
    }

    if (lowerValue.includes("support group") || lowerValue.includes("peer support")) {
      return "Support Groups";
    }

    if (lowerValue.includes("psychoeducational") || lowerValue.includes("psychoeducation")) {
      return "Psychoeducational Groups";
    }

    if (lowerValue.includes("skills training") || lowerValue.includes("skills group")) {
      return "Skills Training Groups";
    }

    // Mindfulness & Body-Based
    if (lowerValue.includes("mindfulness-based stress") || lowerValue.includes("mbsr")) {
      return "Mindfulness-Based Stress Reduction (MBSR)";
    }

    if (lowerValue.includes("yoga therapy") || lowerValue.includes("therapeutic yoga")) {
      return "Yoga Therapy";
    }

    if (lowerValue.includes("meditation") || lowerValue.includes("meditation therapy")) {
      return "Meditation-Based Therapy";
    }

    // Creative Arts Therapies
    if (lowerValue.includes("art therapy") || lowerValue.includes("expressive arts")) {
      return "Art Therapy";
    }

    if (lowerValue.includes("music therapy") || lowerValue.includes("sound therapy")) {
      return "Music Therapy";
    }

    if (lowerValue.includes("dance") || lowerValue.includes("movement therapy")) {
      return "Dance/Movement Therapy";
    }

    if (lowerValue.includes("drama therapy") || lowerValue.includes("psychodrama")) {
      return "Drama Therapy";
    }

    // Other
    return "Other Therapy Approaches";
  };

  // Normalize therapy format
  const normalizeTherapyFormat = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    if (
      lowerValue.includes("individual") ||
      lowerValue.includes("one-on-one") ||
      lowerValue.includes("personal")
    ) {
      return "Individual Therapy";
    }

    if (
      lowerValue.includes("couple") ||
      lowerValue.includes("marital") ||
      lowerValue.includes("relationship")
    ) {
      return "Couples Therapy";
    }

    if (lowerValue.includes("family") || lowerValue.includes("family system")) {
      return "Family Therapy";
    }

    if (lowerValue.includes("group") || lowerValue.includes("group therapy")) {
      return "Group Therapy";
    }

    if (
      lowerValue.includes("intensive") ||
      lowerValue.includes("intensive outpatient") ||
      lowerValue.includes("iop")
    ) {
      return "Intensive Programs";
    }

    if (
      lowerValue.includes("online") ||
      lowerValue.includes("teletherapy") ||
      lowerValue.includes("virtual") ||
      lowerValue.includes("telehealth")
    ) {
      return "Online/Teletherapy";
    }

    return "Flexible Format";
  };

  // Normalize evidence level
  const normalizeEvidenceLevel = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    if (
      lowerValue.includes("evidence-based") ||
      lowerValue.includes("empirically supported") ||
      lowerValue.includes("research-supported") ||
      lowerValue.includes("gold standard")
    ) {
      return "Evidence-Based";
    }

    if (
      lowerValue.includes("well-established") ||
      lowerValue.includes("strong evidence") ||
      lowerValue.includes("robust")
    ) {
      return "Well-Established";
    }

    if (
      lowerValue.includes("probably efficacious") ||
      lowerValue.includes("moderate evidence") ||
      lowerValue.includes("promising")
    ) {
      return "Moderate Evidence";
    }

    if (
      lowerValue.includes("possibly efficacious") ||
      lowerValue.includes("emerging") ||
      lowerValue.includes("preliminary")
    ) {
      return "Emerging Evidence";
    }

    if (
      lowerValue.includes("practice-based") ||
      lowerValue.includes("clinical experience") ||
      lowerValue.includes("theoretical")
    ) {
      return "Practice-Based";
    }

    return "Evidence Level Unknown";
  };

  // Normalize condition values to match main categories
  const normalizeConditionValue = (value: string): string => {
    if (!value) return value;

    const lowerValue = value.toLowerCase();

    // Depression & Mood Disorders
    if (
      lowerValue.includes("depression") ||
      lowerValue.includes("depressive") ||
      lowerValue.includes("major depressive") ||
      lowerValue.includes("bipolar") ||
      lowerValue.includes("mood") ||
      lowerValue.includes("seasonal affective") ||
      lowerValue.includes("dysthymia")
    ) {
      return "Depression & Mood Disorders";
    }

    // Anxiety Disorders
    if (
      lowerValue.includes("anxiety") ||
      lowerValue.includes("panic") ||
      lowerValue.includes("phobia") ||
      lowerValue.includes("social anxiety") ||
      lowerValue.includes("generalized anxiety") ||
      lowerValue.includes("agoraphobia") ||
      lowerValue.includes("separation anxiety")
    ) {
      return "Anxiety Disorders";
    }

    // Trauma & PTSD
    if (
      lowerValue.includes("ptsd") ||
      lowerValue.includes("trauma") ||
      lowerValue.includes("post-traumatic") ||
      lowerValue.includes("complex trauma") ||
      lowerValue.includes("c-ptsd") ||
      lowerValue.includes("acute stress")
    ) {
      return "Trauma & PTSD";
    }

    // OCD & Related Disorders
    if (
      lowerValue.includes("ocd") ||
      lowerValue.includes("obsessive") ||
      lowerValue.includes("compulsive") ||
      lowerValue.includes("body dysmorphic") ||
      lowerValue.includes("hoarding") ||
      lowerValue.includes("trichotillomania") ||
      lowerValue.includes("excoriation")
    ) {
      return "OCD & Related Disorders";
    }

    // Eating Disorders
    if (
      lowerValue.includes("eating") ||
      lowerValue.includes("anorexia") ||
      lowerValue.includes("bulimia") ||
      lowerValue.includes("binge eating") ||
      lowerValue.includes("body image") ||
      lowerValue.includes("food restriction")
    ) {
      return "Eating Disorders";
    }

    // Personality Disorders
    if (
      lowerValue.includes("personality") ||
      lowerValue.includes("borderline") ||
      lowerValue.includes("narcissistic") ||
      lowerValue.includes("antisocial") ||
      lowerValue.includes("avoidant") ||
      lowerValue.includes("dependent") ||
      lowerValue.includes("histrionic")
    ) {
      return "Personality Disorders";
    }

    // Relationship Issues
    if (
      lowerValue.includes("relationship") ||
      lowerValue.includes("couples") ||
      lowerValue.includes("marital") ||
      lowerValue.includes("family conflict") ||
      lowerValue.includes("communication") ||
      lowerValue.includes("intimacy")
    ) {
      return "Relationship Issues";
    }

    // Addiction & Substance Use
    if (
      lowerValue.includes("addiction") ||
      lowerValue.includes("substance") ||
      lowerValue.includes("alcohol") ||
      lowerValue.includes("drug") ||
      lowerValue.includes("gambling") ||
      lowerValue.includes("behavioral addiction")
    ) {
      return "Addiction & Substance Use";
    }

    // ADHD & Attention
    if (
      lowerValue.includes("adhd") ||
      lowerValue.includes("attention deficit") ||
      lowerValue.includes("hyperactivity") ||
      lowerValue.includes("attention") ||
      lowerValue.includes("focus")
    ) {
      return "ADHD & Attention Issues";
    }

    // Autism & Developmental
    if (
      lowerValue.includes("autism") ||
      lowerValue.includes("asperger") ||
      lowerValue.includes("developmental") ||
      lowerValue.includes("social communication") ||
      lowerValue.includes("sensory processing")
    ) {
      return "Autism & Developmental";
    }

    // Grief & Loss
    if (
      lowerValue.includes("grief") ||
      lowerValue.includes("loss") ||
      lowerValue.includes("bereavement") ||
      lowerValue.includes("death") ||
      lowerValue.includes("mourning")
    ) {
      return "Grief & Loss";
    }

    // Life Transitions
    if (
      lowerValue.includes("transition") ||
      lowerValue.includes("life change") ||
      lowerValue.includes("adjustment") ||
      lowerValue.includes("career") ||
      lowerValue.includes("divorce") ||
      lowerValue.includes("retirement")
    ) {
      return "Life Transitions";
    }

    // Chronic Illness
    if (
      lowerValue.includes("chronic illness") ||
      lowerValue.includes("medical") ||
      lowerValue.includes("health condition") ||
      lowerValue.includes("chronic pain") ||
      lowerValue.includes("disability")
    ) {
      return "Chronic Illness & Medical";
    }

    // General Mental Health
    if (
      lowerValue.includes("stress") ||
      lowerValue.includes("self-esteem") ||
      lowerValue.includes("confidence") ||
      lowerValue.includes("personal growth") ||
      lowerValue.includes("emotional regulation") ||
      lowerValue.includes("coping skills")
    ) {
      return "General Mental Health";
    }

    return "Other Conditions";
  };

  // Define filter categories (empty - filters removed as requested)
  const filterCategories: FilterCategory[] = [];

  // Extract unique options for each filter category
  const enrichedFilterCategories = useMemo(() => {
    if (!therapyTreatments) return filterCategories;

    return filterCategories.map((category) => {
      if (category.options.length > 0) return category;

      const allValues = new Set<string>();
      therapyTreatments.forEach((therapy: Entity) => {
        const normalizedValues = category.getValues(therapy);
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
  }, [therapyTreatments, filterCategories]);

  // Filter therapies based on search and active filters
  const filteredTherapies = useMemo(() => {
    if (!therapyTreatments) return [];

    let results = therapyTreatments;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter((therapy) => {
        const name = therapy.name?.toLowerCase() || "";
        const description = therapy.description?.toLowerCase() || "";
        const content = JSON.stringify(therapy.data || {}).toLowerCase();

        return name.includes(query) || description.includes(query) || content.includes(query);
      });
    }

    // Apply filters
    return results.filter((therapy: Entity) => {
      return Object.entries(activeFilters).every(([categoryId, selectedValues]) => {
        if (selectedValues.length === 0) return true;

        const category = enrichedFilterCategories.find((c) => c.id === categoryId);
        if (!category) return true;

        const normalizedTherapyValues = category.getValues(therapy);

        return selectedValues.some((selectedValue) =>
          normalizedTherapyValues.includes(selectedValue)
        );
      });
    });
  }, [therapyTreatments, activeFilters, enrichedFilterCategories, searchQuery]);

  // Sort therapies
  const sortedTherapies = useMemo(() => {
    if (!filteredTherapies) return [];

    const sorted = [...filteredTherapies].sort((a, b) => {
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
  }, [filteredTherapies, sortBy]);

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

  // Visible therapies (Load More pattern)
  const visibleTherapies = useMemo(() => {
    return sortedTherapies.slice(0, visibleCount);
  }, [sortedTherapies, visibleCount]);

  const hasMore = visibleCount < sortedTherapies.length;

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, values) => count + values.length, 0);
  };

  const handleTherapyClick = (entity: Entity) => {
    window.location.href = `/treatments/${entity.slug}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
          <h1 className="text-2xl font-bold text-neutral-900">Loading therapy treatments...</h1>
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
              Error Loading Therapy Treatments
            </h1>
            <p className="mb-4 text-neutral-800">We couldn't load the therapy treatments data.</p>
            <Link
              href="/treatments"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
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
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Psychotherapy & Counseling
              </span>
            </h1>

            <div className="w-[100px]"></div>
          </div>

          {/* Description Section */}
          <div className="mb-4 text-center">
            <p className="mx-auto mb-3 max-w-2xl text-sm text-slate-600">
              Evidence-based psychotherapy approaches for mental health conditions, personal growth,
              and relationship healing. Find the right therapeutic modality for your unique needs.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                {sortedTherapies?.length || 0} Approaches
                {filteredTherapies?.length !== therapyTreatments?.length && (
                  <span className="text-orange-600">
                    (filtered from {therapyTreatments?.length})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                Research-Supported
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                Professional Practice
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
                placeholder="Search therapies by name, type, or technique... (Press Enter)"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
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
              <Card className="border border-green-100 bg-white/80 backdrop-blur-xl">
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
                                className="mr-2 rounded border-gray-300 text-green-600"
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
                        className="cursor-pointer border-green-200 hover:bg-green-50"
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

      {/* Therapy Treatments Grid */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {sortedTherapies && sortedTherapies.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TreatmentGrid
                  key={`therapy-grid-${visibleCount}`}
                  entities={visibleTherapies}
                  title=""
                  variant="default"
                  showFilters={false}
                  showComparison={true}
                  onEntityClick={handleTherapyClick}
                  className="rounded-3xl border border-green-100 bg-white/90 p-8 shadow-2xl shadow-green-100/50 backdrop-blur-xl"
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
                    Showing {visibleCount} of {sortedTherapies.length} therapies
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
              <Card className="mx-auto max-w-md bg-white/80 backdrop-blur-xl">
                <CardContent className="p-8">
                  <Brain className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "No Therapies Match"
                      : "No Therapy Treatments Found"}
                  </h3>
                  <p className="mb-6 text-slate-600">
                    {getActiveFilterCount() > 0 || searchQuery.trim()
                      ? "Try adjusting your search or filter criteria."
                      : "It looks like the therapy treatments data hasn't been imported yet."}
                  </p>
                  {getActiveFilterCount() > 0 || searchQuery.trim() ? (
                    <Button onClick={clearAllFilters} className="bg-green-600 hover:bg-green-700">
                      Clear All Filters
                    </Button>
                  ) : (
                    <Link
                      href="/treatments"
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
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

      {/* Therapy Education */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Finding the Right Therapist */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Users className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold text-green-900">Finding the Right Therapist</h3>
                </div>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Consider therapeutic approach fit</li>
                  <li>• Look for relevant specializations</li>
                  <li>• Check licensing and credentials</li>
                  <li>• Assess personal rapport and comfort</li>
                  <li>• Verify insurance coverage</li>
                </ul>
              </CardContent>
            </Card>

            {/* What to Expect */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">What to Expect</h3>
                </div>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Initial assessment and goal setting</li>
                  <li>• Regular sessions (weekly/biweekly)</li>
                  <li>• Homework and skill practice</li>
                  <li>• Progress monitoring and adjustments</li>
                  <li>• Collaborative treatment planning</li>
                </ul>
              </CardContent>
            </Card>

            {/* Types of Therapy */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Heart className="h-6 w-6 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Therapy Approaches</h3>
                </div>
                <div className="space-y-2 text-sm text-purple-800">
                  <div>
                    <strong>CBT:</strong> Thoughts, feelings, behaviors
                  </div>
                  <div>
                    <strong>DBT:</strong> Emotional regulation skills
                  </div>
                  <div>
                    <strong>EMDR:</strong> Trauma processing
                  </div>
                  <div>
                    <strong>Family:</strong> Relationship dynamics
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Therapy Types */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <h3 className="mb-4 text-2xl font-bold text-slate-900">Evidence-Based Approaches</h3>
              <p className="mx-auto mb-6 max-w-2xl text-slate-600">
                From cognitive-behavioral therapy to specialized trauma treatments, explore proven
                therapeutic modalities tailored to different mental health needs.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="font-semibold text-green-800">CBT</div>
                  <div className="text-green-600">Cognitive-Behavioral</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="font-semibold text-blue-800">DBT</div>
                  <div className="text-blue-600">Dialectical Behavior</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="font-semibold text-purple-800">EMDR</div>
                  <div className="text-purple-600">Trauma Processing</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="font-semibold text-amber-800">Family</div>
                  <div className="text-amber-600">Systems Approach</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Find Therapists */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <h3 className="mb-4 text-2xl font-bold text-slate-900">Ready to Start Therapy?</h3>
              <p className="mx-auto mb-6 max-w-2xl text-slate-600">
                Find qualified therapists in your area who specialize in the approaches and
                conditions most relevant to your needs.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/psychiatrists"
                  className="inline-flex transform items-center gap-2 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl"
                >
                  Find Therapists
                  <Users className="h-5 w-5" />
                </Link>
                <a
                  href="https://www.psychologytoday.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex transform items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 font-semibold text-slate-700 transition-all duration-300 hover:scale-105 hover:border-slate-300 hover:bg-slate-50"
                >
                  Psychology Today
                  <ArrowLeft className="h-5 w-5 rotate-180" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Important Information */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h3 className="mb-2 font-semibold text-amber-900">
                    Important Therapy Considerations
                  </h3>
                  <p className="text-sm text-amber-800">
                    Therapy is most effective when there's a good fit between therapist and client.
                    Don't hesitate to try different therapists or approaches if the first isn't
                    working well. Progress takes time, and it's normal to experience ups and downs
                    during the therapeutic process. Always work with licensed mental health
                    professionals and communicate openly about your needs and concerns.
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

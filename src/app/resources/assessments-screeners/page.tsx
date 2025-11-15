"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useResources } from "@/lib/hooks/use-entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackToResourcesButton } from "@/components/resources/BackToResourcesButton";
import {
  ClipboardCheck,
  Heart,
  Brain,
  Zap,
  Target,
  Users,
  AlertTriangle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Calculator,
  Shield,
  Award,
  BookOpen,
  MoreHorizontal,
  Filter,
  X,
  ArrowRight,
} from "lucide-react";

/** Category tiles (optional landing tiles to sub-pages you may create later) */
const assessmentCategories = [
  {
    title: "Depression Screening",
    description: "PHQ-9, PHQ-2, Beck Depression Inventory, and other depression assessment tools",
    icon: Heart,
    gradient: "from-blue-500 to-cyan-500",
    hoverGradient: "group-hover:from-blue-600 group-hover:to-cyan-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/resources/assessments/depression",
    count: "8 tools",
  },
  {
    title: "Anxiety & Panic",
    description:
      "GAD-7, Beck Anxiety Inventory, Panic Disorder Severity Scale, social anxiety measures",
    icon: Zap,
    gradient: "from-yellow-500 to-orange-500",
    hoverGradient: "group-hover:from-yellow-600 group-hover:to-orange-600",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600",
    href: "/resources/assessments/anxiety",
    count: "12 tools",
  },
  {
    title: "ADHD & Attention",
    description: "ASRS, Conners scales, ADHD rating scales for children and adults",
    icon: Target,
    gradient: "from-purple-500 to-pink-500",
    hoverGradient: "group-hover:from-purple-600 group-hover:to-pink-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    href: "/resources/assessments/adhd",
    count: "6 tools",
  },
  {
    title: "PTSD & Trauma",
    description: "PCL-5, PTSD Checklist, Childhood Trauma Questionnaire, trauma screening",
    icon: Shield,
    gradient: "from-red-500 to-rose-500",
    hoverGradient: "group-hover:from-red-600 group-hover:to-rose-600",
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
    href: "/resources/assessments/ptsd-trauma",
    count: "9 tools",
  },
  {
    title: "Bipolar & Mood",
    description: "Mood Disorder Questionnaire, Young Mania Rating Scale, bipolar screening",
    icon: Brain,
    gradient: "from-indigo-500 to-violet-500",
    hoverGradient: "group-hover:from-indigo-600 group-hover:to-violet-600",
    bgColor: "bg-indigo-50",
    iconColor: "text-indigo-600",
    href: "/resources/assessments/bipolar-mood",
    count: "5 tools",
  },
  {
    title: "Substance Use",
    description: "CAGE, AUDIT, Drug Abuse Screening Test, addiction assessment tools",
    icon: AlertTriangle,
    gradient: "from-amber-500 to-orange-500",
    hoverGradient: "group-hover:from-amber-600 group-hover:to-orange-600",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
    href: "/resources/assessments/substance-use",
    count: "7 tools",
  },
  {
    title: "Eating Disorders",
    description: "EAT-26, SCOFF questionnaire, Eating Disorder Examination Questionnaire",
    icon: Heart,
    gradient: "from-pink-500 to-fuchsia-500",
    hoverGradient: "group-hover:from-pink-600 group-hover:to-fuchsia-600",
    bgColor: "bg-pink-50",
    iconColor: "text-pink-600",
    href: "/resources/assessments/eating-disorders",
    count: "4 tools",
  },
  {
    title: "Sleep Disorders",
    description: "Pittsburgh Sleep Quality Index, Epworth Sleepiness Scale, insomnia screening",
    icon: Clock,
    gradient: "from-slate-500 to-gray-500",
    hoverGradient: "group-hover:from-slate-600 group-hover:to-gray-600",
    bgColor: "bg-slate-50",
    iconColor: "text-neutral-800",
    href: "/resources/assessments/sleep",
    count: "6 tools",
  },
  {
    title: "Autism Spectrum",
    description: "AQ-10, ADOS, autism screening questionnaires for children and adults",
    icon: Users,
    gradient: "from-emerald-500 to-green-500",
    hoverGradient: "group-hover:from-emerald-600 group-hover:to-green-600",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
    href: "/resources/assessments/autism",
    count: "5 tools",
  },
  {
    title: "Personality Assessment",
    description: "Personality disorder screening, Big Five, temperament assessments",
    icon: Users,
    gradient: "from-teal-500 to-emerald-500",
    hoverGradient: "group-hover:from-teal-600 group-hover:to-emerald-600",
    bgColor: "bg-teal-50",
    iconColor: "text-teal-600",
    href: "/resources/assessments/personality",
    count: "8 tools",
  },
  {
    title: "Cognitive Assessment",
    description: "Mini-Mental State Exam, Montreal Cognitive Assessment, memory screening",
    icon: Brain,
    gradient: "from-violet-500 to-purple-500",
    hoverGradient: "group-hover:from-violet-600 group-hover:to-purple-600",
    bgColor: "bg-violet-50",
    iconColor: "text-violet-600",
    href: "/resources/assessments/cognitive",
    count: "6 tools",
  },
  {
    title: "General Wellness",
    description: "Quality of life scales, stress assessments, general mental health screening",
    icon: Award,
    gradient: "from-green-500 to-emerald-500",
    hoverGradient: "group-hover:from-green-600 group-hover:to-emerald-600",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    href: "/resources/assessments/wellness",
    count: "10 tools",
  },
];

const otherAssessmentsCategory = {
  title: "Other Assessments",
  description: "Specialized screening tools, research instruments, and domain-specific measures",
  icon: MoreHorizontal,
  gradient: "from-slate-400 to-gray-400",
  hoverGradient: "group-hover:from-slate-500 group-hover:to-gray-500",
  bgColor: "bg-slate-50",
  iconColor: "text-neutral-800",
  href: "/resources/assessments/other",
  count: "15+ tools",
  isSecondary: true,
};

export default function AssessmentsPage() {
  const { data: allResources, isLoading, error } = useResources();

  // Keep only assessment resources
  const assessments = useMemo(
    () =>
      (allResources ?? []).filter((r: any) => r?.metadata?.category === "assessments-screeners"),
    [allResources]
  );

  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedCondition, setSelectedCondition] = useState<string>("all");

  // Unique conditions across items
  const conditions = useMemo(() => {
    const set = new Set<string>();
    for (const a of assessments) {
      const d = a?.data ?? {};
      const m = a?.metadata ?? {};
      const list = [
        ...(Array.isArray(d.conditions) ? d.conditions : []),
        ...(Array.isArray(d.targets) ? d.targets : []),
        ...(Array.isArray(d.disorders) ? d.disorders : []),
        ...(Array.isArray(m.conditions) ? m.conditions : []),
        typeof d.primary_condition === "string" ? d.primary_condition : null,
        typeof m.primary_condition === "string" ? m.primary_condition : null,
      ].filter(Boolean) as string[];
      list.forEach((v) => set.add(v));
    }
    return Array.from(set).sort();
  }, [assessments]);

  // Filter + sort visible list
  const filteredAssessments = useMemo(() => {
    const out = assessments.filter((a: any) => {
      const d = a?.data ?? {};
      const m = a?.metadata ?? {};

      if (selectedCondition !== "all") {
        const list = [
          ...(Array.isArray(d.conditions) ? d.conditions : []),
          ...(Array.isArray(d.targets) ? d.targets : []),
          ...(Array.isArray(d.disorders) ? d.disorders : []),
          ...(Array.isArray(m.conditions) ? m.conditions : []),
          typeof d.primary_condition === "string" ? d.primary_condition : null,
          typeof m.primary_condition === "string" ? m.primary_condition : null,
        ].filter(Boolean) as string[];

        if (!list.includes(selectedCondition)) return false;
      }

      return true;
    });

    out.sort((a: any, b: any) => {
      const oa = a?.metadata?.order ?? a?.data?.order ?? 999999;
      const ob = b?.metadata?.order ?? b?.data?.order ?? 999999;
      return Number(oa) - Number(ob);
    });

    return out;
  }, [assessments, selectedCondition]);

  const clearFilters = () => {
    setSelectedCondition("all");
  };

  const activeFiltersCount = selectedCondition !== "all" ? 1 : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          <h1 className="text-2xl font-bold text-neutral-900">Loading assessments...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Card className="mx-4 max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="mb-2 text-xl font-bold text-neutral-900">Error Loading Assessments</h1>
            <p className="mb-4 text-neutral-800">We couldn't load the assessments data.</p>
            <Link href="/resources">
              <Button>Back to Resources</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderAssessmentCategoryTile = (category: any, index: number) => {
    const IconComponent = category.icon;
    return (
      <Link key={category.href} href={category.href} className="group block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className={`relative h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg transition-all duration-500 group-hover:-translate-y-1 hover:shadow-xl ${
            category.isSecondary ? "opacity-90 hover:opacity-100" : ""
          }`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${category.gradient} ${category.hoverGradient} opacity-5 transition-opacity duration-500 group-hover:opacity-10`}
          />
          <div className="relative p-6">
            <div className="mb-4 text-center">
              <div className="mb-3 flex items-center justify-center">
                <div
                  className={`inline-flex rounded-xl p-3 ${category.bgColor} transition-transform duration-300 group-hover:scale-110`}
                >
                  <IconComponent className={`h-6 w-6 ${category.iconColor}`} />
                </div>
              </div>
              <h3
                className={`mb-2 text-lg font-bold text-neutral-900 transition-colors group-hover:text-neutral-800 ${category.isSecondary ? "text-base" : ""}`}
              >
                {category.title}
              </h3>
              <Badge variant="outline" className="text-xs">
                {category.count}
              </Badge>
            </div>
            <p className="mb-4 min-h-[3rem] text-center text-sm leading-relaxed text-neutral-800">
              {category.description}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-semibold">
              <span
                className={`bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent`}
              >
                View Tools
              </span>
              <ClipboardCheck className="h-4 w-4 text-neutral-600 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-300 group-hover:ring-slate-200" />
        </motion.div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-4 flex justify-center sm:justify-start">
            <BackToResourcesButton />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-neutral-900 sm:text-3xl">
            <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              Assessments & Screeners
            </span>
          </h1>

          <p className="mx-auto mb-3 max-w-2xl text-sm text-neutral-800">
            Evidence-based screening tools and assessments for mental health conditions. These tools
            are for educational purposes and do not replace professional diagnosis.
          </p>

          <div className="mb-4 flex items-center justify-center gap-4 text-xs text-neutral-700">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {assessments.length}+ Assessment Tools
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Clinically Validated
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Free to Use
            </div>
          </div>
        </div>
      </section>

      {/* Optional category tiles (comment out if you’re not using category subpages yet) */}
      {/* <section className="py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {assessmentCategories.map((c, i) => renderAssessmentCategoryTile(c, i))}
          {renderAssessmentCategoryTile(otherAssessmentsCategory, assessmentCategories.length)}
        </div>
      </section> */}

      {/* Disclaimer */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  <p className="mb-1 font-semibold">Important Disclaimer</p>
                  <p>
                    These screening tools are for educational and informational purposes only. They
                    do not provide a diagnosis and should not replace consultation with a qualified
                    healthcare professional. If you're experiencing mental health concerns, please
                    consult with a licensed clinician.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-neutral-800" />
                  <span className="text-sm font-medium text-neutral-800">Filter by:</span>
                </div>

                {/* Condition */}
                <div>
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="all">All Conditions</option>
                    {conditions.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond.charAt(0).toUpperCase() + cond.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear */}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-neutral-800 hover:text-neutral-900"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters ({activeFiltersCount})
                  </Button>
                )}

                <div className="ml-auto text-sm text-neutral-800">
                  Showing {filteredAssessments.length} of {assessments.length} assessments
                </div>
              </div>

              {/* Active indicators */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 flex items-center space-x-2 border-t border-neutral-200 pt-4">
                  <span className="text-sm text-neutral-800">Active filters:</span>
                  <div className="flex space-x-2">
                    {selectedCondition !== "all" && (
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <span>
                          {selectedCondition.charAt(0).toUpperCase() + selectedCondition.slice(1)}
                        </span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setSelectedCondition("all")}
                        />
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Assessment list */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Card className="rounded-3xl bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-neutral-900">
                All Assessment Tools
              </CardTitle>
              <p className="text-center text-neutral-800">
                Browse our complete collection of validated screening instruments
              </p>
            </CardHeader>
            <CardContent className="p-8">
              {filteredAssessments.length > 0 ? (
                <div className="space-y-4">
                  {filteredAssessments.slice(0, visibleCount).map((a: any, index: number) => {
                    const d = a?.data ?? {};
                    const m = a?.metadata ?? {};
                    const name = a?.name ?? d?.name ?? "Untitled Assessment";
                    const fullName = d?.full_name ?? d?.fullName ?? name;
                    const description =
                      (typeof d?.description === "string" ? d.description : a?.description) ??
                      "No description available";
                    const subCategory = m?.assessment_category ?? d?.category ?? "General";
                    const duration = d?.duration ?? "Variable";
                    const ageRange = d?.age_range ?? d?.ageRange ?? "Not specified";
                    const validated = d?.validated !== false;
                    const free = d?.free !== false;
                    const slug = encodeURIComponent(a?.slug ?? `assessment-${index}`);

                    return (
                      <Link key={slug} href={`/resources/${slug}`} className="group block">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="rounded-xl border border-neutral-200 p-6 transition-all duration-300 group-hover:bg-sky-50 hover:border-sky-300 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                              <div className="rounded-lg bg-sky-50 p-3 transition-colors group-hover:bg-sky-100">
                                <ClipboardCheck className="h-6 w-6 text-sky-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-2 flex items-center gap-3">
                                  <h3 className="text-lg font-bold text-neutral-900 transition-colors group-hover:text-sky-600">
                                    {name}
                                  </h3>
                                  <div className="flex gap-2">
                                    {validated && (
                                      <Badge
                                        variant="outline"
                                        className="border-green-200 text-xs text-green-600"
                                      >
                                        Validated
                                      </Badge>
                                    )}
                                    {free && (
                                      <Badge
                                        variant="outline"
                                        className="border-blue-200 text-xs text-blue-600"
                                      >
                                        Free
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="mb-2 text-sm text-neutral-700">{fullName}</p>
                                <p className="mb-3 text-sm text-neutral-800">
                                  {description.length > 120
                                    ? `${description.substring(0, 120)}…`
                                    : description}
                                </p>
                                <div className="grid grid-cols-3 gap-4 text-xs text-neutral-700">
                                  <div>
                                    <span className="font-medium text-neutral-800">Duration: </span>
                                    {duration}
                                  </div>
                                  <div>
                                    <span className="font-medium text-neutral-800">Age: </span>
                                    {ageRange}
                                  </div>
                                  <div>
                                    <span className="font-medium text-neutral-800">Category: </span>
                                    {subCategory}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 flex-shrink-0 text-neutral-600 transition-all group-hover:translate-x-1 group-hover:text-sky-500" />
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <ClipboardCheck className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                    No Assessments Found
                  </h3>
                  <p className="mb-6 text-neutral-800">No assessment tools were returned.</p>
                  <Button onClick={() => window.location.reload()}>Refresh Page</Button>
                </div>
              )}

              {/* Load more */}
              {filteredAssessments.length > visibleCount && (
                <div className="mt-8 space-y-4 text-center">
                  <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setVisibleCount((prev) => prev + 20)}
                    >
                      Load More Assessments ({filteredAssessments.length - visibleCount} remaining)
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={() => setVisibleCount(filteredAssessments.length)}
                    >
                      Show All {filteredAssessments.length}
                    </Button>
                  </div>
                </div>
              )}

              {/* Show less */}
              {filteredAssessments.length > 20 && visibleCount >= filteredAssessments.length && (
                <div className="mt-8 text-center">
                  <p className="mb-4 text-neutral-800">
                    Showing all {filteredAssessments.length} assessments
                  </p>
                  <Button size="lg" variant="ghost" onClick={() => setVisibleCount(20)}>
                    Show Less
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}

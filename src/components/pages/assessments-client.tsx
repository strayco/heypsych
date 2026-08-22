"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  AlertTriangle,
  Filter,
  X,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import type { Entity } from "@/lib/types/database";

interface AssessmentsClientProps {
  assessments: Entity[];
}

export function AssessmentsClient({ assessments }: AssessmentsClientProps) {
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedCondition, setSelectedCondition] = useState<string>("all");

  // Unique conditions across items - only from conditions field
  const conditions = useMemo(() => {
    const set = new Set<string>();
    for (const a of assessments) {
      const d = a?.data ?? {};
      const list = Array.isArray(d.conditions) ? d.conditions : [];
      list.forEach((v: string) => set.add(v));
    }
    return Array.from(set).sort();
  }, [assessments]);

  // Filter + sort visible list
  const filteredAssessments = useMemo(() => {
    const out = assessments.filter((a: any) => {
      const d = a?.data ?? {};

      if (selectedCondition !== "all") {
        const list = Array.isArray(d.conditions) ? d.conditions : [];
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

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => window.history.back()} className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back
            </Button>

            <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
              <span className="bg-linear-to-r from-accent-600 to-accent bg-clip-text text-transparent">
                Assessments & Screeners
              </span>
            </h1>

            <div className="w-[100px]"></div>
          </div>

          <div className="mb-4 text-center">
            <p className="mx-auto mb-3 max-w-2xl text-sm text-label-secondary">
              Evidence-based screening tools and assessments for mental health conditions. These
              tools are for educational purposes and do not replace professional diagnosis.
            </p>

            <div className="flex items-center justify-center gap-4 text-xs text-label-secondary">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-tint0"></div>
                {assessments.length} Assessment Tools
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-positive-tint0"></div>
                Clinically Validated
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                Free to Use
              </div>
            </div>
          </div>
        </div>
      </section>

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
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-label-secondary" />
                  <span className="text-sm font-medium text-label-secondary">Filter by Condition:</span>
                </div>

                <div>
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="rounded-lg border border-separator px-4 py-2 text-sm shadow-sm transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="all">All Conditions</option>
                    {conditions.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond.charAt(0).toUpperCase() + cond.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-label-secondary hover:text-label-primary"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}

                <div className="ml-auto text-sm text-label-secondary">
                  Showing {filteredAssessments.length} of {assessments.length}
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-4 flex items-center space-x-2 border-t border-separator pt-4">
                  <span className="text-sm text-label-secondary">Active filter:</span>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <span>
                      {selectedCondition.charAt(0).toUpperCase() + selectedCondition.slice(1)}
                    </span>
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-negative"
                      onClick={() => setSelectedCondition("all")}
                    />
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Assessment list */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Card className="rounded-3xl bg-surface shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-label-primary">
                Assessment Tools
              </CardTitle>
              <p className="text-center text-sm text-label-secondary">
                Browse our collection of validated screening instruments
              </p>
            </CardHeader>
            <CardContent className="p-8">
              {filteredAssessments.length > 0 ? (
                <div className="space-y-4">
                  {filteredAssessments.slice(0, visibleCount).map((a: any, index: number) => {
                    const d = a?.data ?? {};
                    const name = a?.name ?? d?.name ?? "Untitled Assessment";
                    const fullName = d?.full_name ?? d?.fullName ?? name;
                    const description =
                      (typeof d?.description === "string" ? d.description : a?.description) ??
                      "No description available";
                    const duration = d?.duration ?? "Variable";
                    const ageRange = d?.age_range ?? d?.ageRange ?? "Not specified";
                    const validated = d?.validated !== false;
                    const free = d?.free !== false;
                    const slug = a?.slug ?? `assessment-${index}`;

                    return (
                      <Link key={slug} href={`/resources/${slug}`} className="group block">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="rounded-xl border border-separator bg-surface p-6 shadow-sm transition-all duration-300 hover:border-accent-border hover:shadow-md group-hover:bg-accent-tint/30"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                              <div className="flex-shrink-0 rounded-lg bg-accent-tint p-3 transition-colors group-hover:bg-accent-tint-hover">
                                <ClipboardCheck className="h-6 w-6 text-accent" />
                              </div>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <h3 className="break-words text-lg font-bold text-label-primary transition-colors group-hover:text-accent">
                                    {name}
                                  </h3>
                                  <div className="flex flex-wrap gap-2">
                                    {validated && (
                                      <Badge
                                        variant="outline"
                                        className="border-positive-border bg-positive-tint text-xs text-positive-700"
                                      >
                                        Validated
                                      </Badge>
                                    )}
                                    {free && (
                                      <Badge
                                        variant="outline"
                                        className="border-accent-border bg-accent-tint text-xs text-accent-700"
                                      >
                                        Free
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="mb-2 break-words text-sm text-label-secondary">{fullName}</p>
                                <p className="mb-3 break-words text-sm text-label-secondary">
                                  {description.length > 150
                                    ? `${description.substring(0, 150)}...`
                                    : description}
                                </p>
                                <div className="grid grid-cols-1 gap-2 text-xs text-label-secondary sm:grid-cols-3 sm:gap-4">
                                  <div>
                                    <span className="font-medium text-label-secondary">Duration: </span>
                                    {duration}
                                  </div>
                                  <div>
                                    <span className="font-medium text-label-secondary">Age: </span>
                                    {ageRange}
                                  </div>
                                  <div>
                                    <span className="font-medium text-label-secondary">Items: </span>
                                    {Array.isArray(d?.items) ? d.items.length : "N/A"}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="hidden h-5 w-5 flex-shrink-0 text-label-quaternary transition-all group-hover:translate-x-1 group-hover:text-accent sm:block" />
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <ClipboardCheck className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
                  <h3 className="mb-2 text-xl font-semibold text-label-primary">
                    No Assessments Found
                  </h3>
                  <p className="mb-6 text-label-secondary">
                    Try adjusting your filters or clearing them to see all assessments.
                  </p>
                  {activeFiltersCount > 0 && (
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  )}
                </div>
              )}

              {filteredAssessments.length > visibleCount && (
                <div className="mt-8 space-y-4 text-center">
                  <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setVisibleCount((prev) => prev + 20)}
                    >
                      Load More ({filteredAssessments.length - visibleCount} remaining)
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

              {filteredAssessments.length > 20 && visibleCount >= filteredAssessments.length && (
                <div className="mt-8 text-center">
                  <p className="mb-4 text-sm text-label-secondary">
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


















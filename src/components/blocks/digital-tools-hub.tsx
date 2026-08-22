"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Star,
  Shield,
  ArrowRight,
  ArrowLeft,
  Filter,
  X,
} from "lucide-react";
import type { Entity } from "@/lib/types/database";

interface DigitalToolsHubProps {
  resources: Entity[];
}

export function DigitalToolsHub({ resources }: DigitalToolsHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");

  // Extract unique app categories
  const appCategories = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) {
      const category = r?.metadata?.app_category || r?.data?.app_category;
      if (category) set.add(category);
    }
    return Array.from(set).sort();
  }, [resources]);

  // Extract unique conditions
  const conditions = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) {
      const condList =
        r?.data?.clinical_metadata?.linked_conditions ||
        r?.data?.conditions ||
        [];
      if (Array.isArray(condList)) {
        condList.forEach((c: any) => {
          const slug = typeof c === "string" ? c : c?.slug;
          if (slug) set.add(slug);
        });
      }
    }
    return Array.from(set).sort();
  }, [resources]);

  // Filter and sort
  const filteredResources = useMemo(() => {
    const out = resources.filter((r: any) => {
      // Category filter
      if (selectedCategory !== "all") {
        const category =
          r?.metadata?.app_category || r?.data?.app_category;
        if (category !== selectedCategory) return false;
      }

      // Condition filter
      if (selectedCondition !== "all") {
        const condList =
          r?.data?.clinical_metadata?.linked_conditions ||
          r?.data?.conditions ||
          [];
        const matchesCondition = Array.isArray(condList)
          ? condList.some((c: any) => {
              const slug = typeof c === "string" ? c : c?.slug;
              return slug === selectedCondition;
            })
          : false;
        if (!matchesCondition) return false;
      }

      return true;
    });

    // Sort by order
    out.sort((a: any, b: any) => {
      const oa = a?.order ?? a?.data?.order ?? 999999;
      const ob = b?.order ?? b?.data?.order ?? 999999;
      return Number(oa) - Number(ob);
    });

    return out;
  }, [resources, selectedCategory, selectedCondition]);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedCondition("all");
  };

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedCondition !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="group"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back
            </Button>

            <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Digital Tools & Apps
              </span>
            </h1>

            <div className="w-20"></div>
          </div>

          <p className="mt-2 text-center text-label-secondary">
            Curated mental health apps with clinical evidence, privacy ratings,
            and expert reviews.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="border-separator bg-surface/80 backdrop-blur">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg">Filters</CardTitle>
                  {activeFiltersCount > 0 && (
                    <Badge variant="primary" className="ml-2">
                      {activeFiltersCount} active
                    </Badge>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Clear all
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* App Category Filter */}
              {appCategories.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-label-primary">
                    App Category
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        selectedCategory === "all"
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-surface-grouped text-label-secondary hover:bg-fill-secondary"
                      }`}
                    >
                      All
                    </button>
                    {appCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          selectedCategory === cat
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-surface-grouped text-label-secondary hover:bg-fill-secondary"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Condition Filter */}
              {conditions.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-label-primary">
                    Condition
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCondition("all")}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        selectedCondition === "all"
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-surface-grouped text-label-secondary hover:bg-fill-secondary"
                      }`}
                    >
                      All Conditions
                    </button>
                    {conditions.slice(0, 10).map((cond) => (
                      <button
                        key={cond}
                        onClick={() => setSelectedCondition(cond)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          selectedCondition === cond
                            ? "bg-purple-600 text-white shadow-md"
                            : "bg-surface-grouped text-label-secondary hover:bg-fill-secondary"
                        }`}
                      >
                        {cond
                          .split("-")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 text-sm text-label-secondary">
            Showing {filteredResources.length} of {resources.length} tools
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((tool: any) => {
              const isV2 =
                tool.data?.version === "2.0" ||
                tool.data?.patient_summary ||
                tool.data?.clinical_metadata;
              const rating = tool.data?.app_rating;
              const reviews = tool.data?.total_reviews;
              const platforms =
                tool.metadata?.platforms || tool.data?.platforms || [];
              const privacyCertified =
                tool.metadata?.privacy_certified ||
                tool.data?.privacy_certified;
              const privacyGrade = tool.data?.privacy_rating?.grade;
              const appCategory =
                tool.metadata?.app_category || tool.data?.app_category;

              return (
                <Link
                  key={tool.slug}
                  href={`/resources/${tool.slug}`}
                  className="group block"
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-separator bg-surface">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                            {tool.name}
                          </CardTitle>
                          {appCategory && (
                            <p className="mt-1 text-sm text-label-secondary">
                              {appCategory}
                            </p>
                          )}
                        </div>
                        {isV2 && (
                          <Badge
                            variant="primary"
                            className="ml-2 flex-shrink-0 bg-indigo-100 text-indigo-800"
                          >
                            V2
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Rating */}
                      {rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                            <span className="ml-1 font-bold text-label-primary">
                              {rating}
                            </span>
                          </div>
                          {reviews && (
                            <span className="text-sm text-label-secondary">
                              ({reviews >= 1000000
                                ? `${(reviews / 1000000).toFixed(1)}M`
                                : reviews >= 1000
                                ? `${Math.round(reviews / 1000)}K`
                                : reviews}{" "}
                              reviews)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      <p className="line-clamp-2 text-sm text-label-primary">
                        {tool.data?.patient_summary ||
                          tool.description ||
                          tool.data?.description ||
                          tool.summary}
                      </p>

                      {/* Platforms */}
                      {platforms.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {platforms.slice(0, 4).map((p: string) => (
                            <Badge
                              key={p}
                              variant="outline"
                              className="text-xs"
                            >
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Privacy Badge */}
                      <div className="flex items-center gap-2">
                        {privacyCertified && (
                          <div className="flex items-center gap-1 text-positive-700">
                            <Shield className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              Privacy Certified
                            </span>
                          </div>
                        )}
                        {privacyGrade && (
                          <Badge
                            variant="outline"
                            className="border-accent-border bg-accent-tint text-accent-700"
                          >
                            Privacy: {privacyGrade}
                          </Badge>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-2 pt-2 text-indigo-600 group-hover:text-indigo-700">
                        <span className="text-sm font-semibold">View Details</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {filteredResources.length === 0 && (
            <div className="py-12 text-center">
              <Smartphone className="mx-auto h-12 w-12 text-label-tertiary" />
              <h3 className="mt-4 text-lg font-semibold text-label-primary">
                No tools found
              </h3>
              <p className="mt-2 text-label-secondary">
                Try adjusting your filters to see more results.
              </p>
              <Button onClick={clearFilters} className="mt-4" variant="outline">
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

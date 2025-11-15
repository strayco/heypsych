"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  GraduationCap,
  FileText,
  Heart,
  Users,
  Shield,
  TrendingUp,
  ArrowRight,
  Filter,
  X,
  Download,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Entity } from "@/lib/types/database";

interface EducationGuidesHubProps {
  resources: Entity[];
}

export function EducationGuidesHub({ resources }: EducationGuidesHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  // Extract unique categories and difficulty levels
  const categories = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      const data = r.data as any;
      const cat = data?.category || data?.topic;
      if (cat) set.add(cat);
    });
    return Array.from(set).sort();
  }, [resources]);

  const levels = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      const data = r.data as any;
      const level = data?.difficulty_level || data?.level;
      if (level) set.add(level);
    });
    return Array.from(set).sort();
  }, [resources]);

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const data = resource.data as any;
      const name = resource.name?.toLowerCase() || "";
      const description = (resource.description || data?.description || "")?.toLowerCase();
      const query = searchQuery.toLowerCase();

      // Search filter
      if (query && !name.includes(query) && !description.includes(query)) {
        return false;
      }

      // Category filter
      const cat = data?.category || data?.topic;
      if (selectedCategory !== "all" && cat !== selectedCategory) {
        return false;
      }

      // Level filter
      const level = data?.difficulty_level || data?.level;
      if (selectedLevel !== "all" && level !== selectedLevel) {
        return false;
      }

      return true;
    });
  }, [resources, searchQuery, selectedCategory, selectedLevel]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLevel("all");
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedLevel !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Hero */}
      <section className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="rounded-xl bg-amber-100 p-3">
                <BookOpen className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  Education & Guides
                </span>
              </h1>
            </div>
            <p className="mx-auto mb-6 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Practical how-tos for finding care, understanding therapy types, navigating insurance,
              learning about treatments, and advocating for your mental health.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick links to popular guides */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              { title: "Finding a Therapist", icon: Users, color: "blue" },
              { title: "Insurance Guide", icon: Shield, color: "green" },
              { title: "Therapy Types", icon: Heart, color: "purple" },
              { title: "Getting Started", icon: TrendingUp, color: "orange" },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="cursor-pointer text-center transition-shadow hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className={`inline-flex rounded-xl p-3 bg-${item.color}-50 mb-3`}>
                        <Icon className={`h-6 w-6 text-${item.color}-600`} />
                      </div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Find guides:</span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search guides..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 py-2 pr-3 pl-10 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Category filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">All Topics</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>

                  {/* Level filter */}
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">All Levels</option>
                    {levels.map((l) => (
                      <option key={l} value={l}>
                        {l.charAt(0).toUpperCase() + l.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-slate-600">
                      Showing {filteredResources.length} of {resources.length} guides
                    </span>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="mr-2 h-4 w-4" />
                      Clear Filters ({activeFiltersCount})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Guides list */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {filteredResources.length > 0 ? (
            <div className="space-y-4">
              {filteredResources.map((resource, index) => {
                const data = resource.data as any;
                const readingTime = data?.reading_time || data?.duration;
                const level = data?.difficulty_level || data?.level;
                const downloadable = data?.downloadable;
                const objectives = data?.learning_objectives || [];

                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/resources/${resource.slug}`}>
                      <Card className="cursor-pointer transition-all hover:border-amber-300 hover:shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-3">
                                <div className="rounded-lg bg-amber-50 p-2">
                                  <FileText className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-amber-600">
                                    {resource.name}
                                  </h3>
                                  <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                                    {readingTime && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {readingTime}
                                      </div>
                                    )}
                                    {level && (
                                      <Badge variant="outline" className="text-xs">
                                        {level}
                                      </Badge>
                                    )}
                                    {downloadable && (
                                      <Badge
                                        variant="outline"
                                        className="border-green-200 text-xs text-green-600"
                                      >
                                        <Download className="mr-1 h-3 w-3" />
                                        PDF
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {resource.description && (
                                <p className="mb-3 ml-12 text-sm text-slate-600">
                                  {resource.description}
                                </p>
                              )}

                              {objectives.length > 0 && (
                                <div className="ml-12">
                                  <p className="mb-1 text-xs font-medium text-slate-700">
                                    What you'll learn:
                                  </p>
                                  <ul className="space-y-1 text-xs text-slate-600">
                                    {objectives.slice(0, 3).map((obj: string, i: number) => (
                                      <li key={i}>• {obj}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <ArrowRight className="mt-2 h-5 w-5 flex-shrink-0 text-slate-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <GraduationCap className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                <h3 className="mb-2 text-xl font-semibold text-slate-900">No guides found</h3>
                <p className="mb-6 text-slate-600">Try adjusting your filters</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

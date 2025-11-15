"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Shield,
  Users,
  Heart,
  Flame,
  Phone,
  MessageCircle,
  Globe,
  Clock,
  ArrowRight,
  Filter,
  X,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Entity } from "@/lib/types/database";

interface SupportCommunityHubProps {
  resources: Entity[];
}

export function SupportCommunityHub({ resources }: SupportCommunityHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");

  // Parse subcategory from metadata or data
  const getSubcategory = (resource: Entity): string => {
    const meta = resource.metadata as any;
    const data = resource.data as any;

    // Check for subcategory in various formats
    const subcategory = meta?.subcategory || data?.subcategory || meta?.type || data?.type;

    if (subcategory) return subcategory;

    // Try to infer from slug structure (e.g., "crisis/988-lifeline" -> "crisis")
    if (resource.slug?.includes("/")) {
      const parts = resource.slug.split("/");
      if (parts.length >= 2) return parts[0];
    }

    return "other";
  };

  // Parse condition tags from resources
  const getConditions = (resource: Entity): string[] => {
    const meta = resource.metadata as any;
    const data = resource.data as any;

    const conditions = [
      ...(Array.isArray(meta?.conditions) ? meta.conditions : []),
      ...(Array.isArray(data?.conditions) ? data.conditions : []),
      ...(Array.isArray(meta?.tags) ? meta.tags : []),
      ...(Array.isArray(data?.tags) ? data.tags : []),
      typeof meta?.condition === "string" ? meta.condition : null,
      typeof data?.condition === "string" ? data.condition : null,
    ].filter(Boolean) as string[];

    return conditions;
  };

  // Group resources by subcategory
  const resourcesByCategory = useMemo(() => {
    return resources.reduce(
      (acc, resource) => {
        const category = getSubcategory(resource);
        if (!acc[category]) acc[category] = [];
        acc[category].push(resource);
        return acc;
      },
      {} as Record<string, Entity[]>
    );
  }, [resources]);

  // Get all unique conditions
  const allConditions = useMemo(() => {
    const conditionSet = new Set<string>();
    resources.forEach((resource) => {
      getConditions(resource).forEach((c) => conditionSet.add(c));
    });
    return Array.from(conditionSet).sort();
  }, [resources]);

  // Category definitions
  const categories = [
    {
      id: "crisis",
      name: "Crisis Support",
      icon: Shield,
      gradient: "from-red-500 to-rose-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
      description: "24/7 immediate help and emergency hotlines",
      count: resourcesByCategory.crisis?.length || 0,
      emoji: "🆘",
    },
    {
      id: "communities",
      name: "Support Communities",
      icon: Users,
      gradient: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
      description: "Peer support groups and online forums",
      count: resourcesByCategory.communities?.length || 0,
      emoji: "👥",
    },
    {
      id: "recovery",
      name: "Recovery Programs",
      icon: Flame,
      gradient: "from-orange-500 to-amber-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200",
      description: "12-step and alternative recovery programs",
      count: resourcesByCategory.recovery?.length || 0,
      emoji: "🔥",
    },
    {
      id: "identity",
      name: "Identity & Faith",
      icon: Heart,
      gradient: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
      description: "Faith-based and identity-specific support",
      count: resourcesByCategory.identity?.length || 0,
      emoji: "🤲",
    },
  ];

  // Filter resources
  const filteredResources = useMemo(() => {
    let filtered = resources;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((r) => getSubcategory(r) === selectedCategory);
    }

    // Filter by condition
    if (selectedCondition !== "all") {
      filtered = filtered.filter((r) => getConditions(r).includes(selectedCondition));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          (r.data as any)?.organization?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [resources, selectedCategory, selectedCondition, searchQuery]);

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) + (selectedCondition !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedCondition("all");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Support & Community
                </span>
              </h1>
            </div>
            <p className="mx-auto max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Find help, connect with others, and access support resources for your mental health
              journey
            </p>
          </motion.div>

          {/* Emergency Crisis Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-8 border-red-400 bg-gradient-to-r from-red-500 to-rose-600 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-white">
                      <div className="text-lg font-bold">In Crisis? Get Help Now</div>
                      <div className="text-sm text-red-100">
                        24/7 confidential support available
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href="tel:988"
                      className="rounded-xl bg-white px-5 py-2.5 font-bold text-red-600 shadow-lg transition-all hover:bg-red-50 hover:shadow-xl"
                    >
                      <Phone className="mr-2 inline h-4 w-4" />
                      Call 988
                    </a>
                    <a
                      href="sms:741741&body=HELLO"
                      className="rounded-xl bg-red-400 px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:bg-red-500 hover:shadow-xl"
                    >
                      <MessageCircle className="mr-2 inline h-4 w-4" />
                      Text 741741
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Category Tiles */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  interactive
                  onClick={() =>
                    setSelectedCategory(category.id === selectedCategory ? "all" : category.id)
                  }
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedCategory === category.id
                      ? `ring-2 ring-offset-2 ${category.borderColor.replace("border-", "ring-")} shadow-lg`
                      : "hover:shadow-lg"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div
                        className={`inline-flex rounded-xl p-3 ${category.bgColor} mb-3 transition-transform group-hover:scale-110`}
                      >
                        <category.icon className={`h-6 w-6 ${category.iconColor}`} />
                      </div>
                      <div className="mb-2 text-3xl">{category.emoji}</div>
                      <h3 className="mb-2 font-bold text-slate-900">{category.name}</h3>
                      <p className="mb-3 min-h-[2.5rem] text-sm text-slate-600">
                        {category.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {category.count} {category.count === 1 ? "resource" : "resources"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="mb-6">
            <CardContent className="p-6">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search organizations, support groups, or resources..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-12 transition-all focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Filter by:</span>
                </div>

                {/* Condition Filter */}
                {allConditions.length > 0 && (
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Conditions</option>
                    {allConditions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition.charAt(0).toUpperCase() + condition.slice(1)}
                      </option>
                    ))}
                  </select>
                )}

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-slate-600 hover:text-slate-800"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters ({activeFiltersCount})
                  </Button>
                )}

                {/* Results Count */}
                <div className="ml-auto text-sm text-slate-600">
                  Showing {filteredResources.length} of {resources.length} resources
                </div>
              </div>

              {/* Active Filter Tags */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-4">
                  <span className="text-sm text-slate-600">Active filters:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory !== "all" && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <span>{categories.find((c) => c.id === selectedCategory)?.name}</span>
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() => setSelectedCategory("all")}
                        />
                      </Badge>
                    )}
                    {selectedCondition !== "all" && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <span>
                          {selectedCondition.charAt(0).toUpperCase() + selectedCondition.slice(1)}
                        </span>
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
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

      {/* Resources List */}
      <section className="px-4 py-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-slate-900">
                {selectedCategory !== "all"
                  ? categories.find((c) => c.id === selectedCategory)?.name
                  : "All Support Resources"}
              </CardTitle>
              <p className="text-center text-sm text-slate-600">
                Click on any resource to view full details
              </p>
            </CardHeader>
            <CardContent className="p-8">
              {filteredResources.length > 0 ? (
                <div className="grid gap-4">
                  {filteredResources.map((resource, index) => {
                    const data = resource.data as any;
                    const meta = resource.metadata as any;
                    const subcategory = getSubcategory(resource);
                    const conditions = getConditions(resource);
                    const is24_7 =
                      data?.availability === "24/7" ||
                      data?.hours === "24/7" ||
                      meta?.availability === "24/7";
                    const isFree =
                      data?.cost === "free" || data?.cost === "Free" || meta?.cost === "free";
                    const isOnline =
                      data?.format === "online" ||
                      data?.type === "online" ||
                      meta?.format === "online";

                    return (
                      <Link key={resource.id || index} href={`/resources/${resource.slug}`}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-emerald-300 hover:shadow-lg"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Title and Badges */}
                              <div className="mb-2 flex items-start gap-3">
                                <div
                                  className={`rounded-lg p-2 ${
                                    subcategory === "crisis"
                                      ? "bg-red-50"
                                      : subcategory === "communities"
                                        ? "bg-purple-50"
                                        : subcategory === "recovery"
                                          ? "bg-orange-50"
                                          : "bg-emerald-50"
                                  } transition-transform group-hover:scale-110`}
                                >
                                  {subcategory === "crisis" ? (
                                    <Shield className="h-5 w-5 text-red-600" />
                                  ) : subcategory === "communities" ? (
                                    <Users className="h-5 w-5 text-purple-600" />
                                  ) : subcategory === "recovery" ? (
                                    <Flame className="h-5 w-5 text-orange-600" />
                                  ) : (
                                    <Heart className="h-5 w-5 text-emerald-600" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="mb-1 text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-600">
                                    {resource.name}
                                  </h3>
                                  {data?.organization && (
                                    <p className="mb-2 text-sm text-slate-500">
                                      {data.organization}
                                    </p>
                                  )}
                                  <div className="mb-3 flex flex-wrap gap-2">
                                    <Badge variant="outline" size="sm">
                                      {subcategory}
                                    </Badge>
                                    {is24_7 && (
                                      <Badge variant="success" size="sm">
                                        <Clock className="mr-1 h-3 w-3" />
                                        24/7
                                      </Badge>
                                    )}
                                    {isFree && (
                                      <Badge variant="primary" size="sm">
                                        Free
                                      </Badge>
                                    )}
                                    {isOnline && (
                                      <Badge variant="outline" size="sm">
                                        <Globe className="mr-1 h-3 w-3" />
                                        Online
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              <p className="mb-3 line-clamp-2 text-sm text-slate-600">
                                {resource.description || "Support resource"}
                              </p>

                              {/* Conditions Tags */}
                              {conditions.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {conditions.slice(0, 3).map((condition, idx) => (
                                    <span
                                      key={idx}
                                      className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                                    >
                                      {condition}
                                    </span>
                                  ))}
                                  {conditions.length > 3 && (
                                    <span className="px-2 py-1 text-xs text-slate-500">
                                      +{conditions.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <ArrowRight className="mt-1 h-5 w-5 flex-shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-emerald-500" />
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">No Resources Found</h3>
                  <p className="mb-6 text-slate-600">
                    {searchQuery ? `No results for "${searchQuery}"` : "Try adjusting your filters"}
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Help Info Section */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  <p className="mb-1 font-semibold">Important Information</p>
                  <p>
                    These resources are provided for informational purposes. They do not replace
                    professional medical advice, diagnosis, or treatment. If you are experiencing a
                    mental health emergency, call 988 or 911 immediately.
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

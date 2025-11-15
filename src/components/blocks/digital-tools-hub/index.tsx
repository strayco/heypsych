"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Smartphone,
  Star,
  Shield,
  Download,
  Globe,
  DollarSign,
  ArrowRight,
  Filter,
  X,
  Lock,
  Zap,
  Heart,
  Moon,
  Brain,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Entity } from "@/lib/types/database";
import { BackToResourcesButton } from "@/components/resources/BackToResourcesButton";

interface DigitalToolsHubProps {
  resources: Entity[];
}

export function DigitalToolsHub({ resources }: DigitalToolsHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Extract unique categories and platforms
  const categories = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      const data = r.data as any;
      const cat = data?.category || data?.type;
      if (cat) set.add(cat);
    });
    return Array.from(set).sort();
  }, [resources]);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      const data = r.data as any;
      const platformList = data?.platforms || [];
      platformList.forEach((p: string) => set.add(p));
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
      const cat = data?.category || data?.type;
      if (selectedCategory !== "all" && cat !== selectedCategory) {
        return false;
      }

      // Platform filter
      const platformList = data?.platforms || [];
      if (selectedPlatform !== "all" && !platformList.includes(selectedPlatform)) {
        return false;
      }

      // Free filter
      if (showFreeOnly) {
        const isFree = data?.free || data?.cost === "free" || data?.subscription_model === "free";
        if (!isFree) return false;
      }

      return true;
    });
  }, [resources, searchQuery, selectedCategory, selectedPlatform, showFreeOnly]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPlatform("all");
    setShowFreeOnly(false);
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedPlatform !== "all" ? 1 : 0) +
    (showFreeOnly ? 1 : 0);

  const categoryIcons: Record<string, any> = {
    "mood-tracking": Heart,
    meditation: Brain,
    sleep: Moon,
    therapy: Users,
    crisis: Shield,
    wellness: Zap,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-4 flex justify-center sm:justify-start">
            <BackToResourcesButton />
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Digital Tools & Apps
              </span>
            </h1>
            <p className="mx-auto mb-3 max-w-2xl text-sm text-slate-600">
              Curated mental health apps and digital tools for mood tracking, meditation, sleep,
              therapy, and wellness — with privacy ratings and evidence-based reviews.
            </p>
          </motion.div>
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
                  <span className="text-sm font-medium text-slate-700">Find apps:</span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {/* Search */}
                  <div className="relative md:col-span-2">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search apps..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 py-2 pr-3 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Category filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>

                  {/* Platform filter */}
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Platforms</option>
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Free only toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="free-only"
                    checked={showFreeOnly}
                    onChange={(e) => setShowFreeOnly(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="free-only" className="cursor-pointer text-sm text-slate-700">
                    Show free apps only
                  </label>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-slate-600">
                      Showing {filteredResources.length} of {resources.length} apps
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

      {/* Apps grid */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource, index) => {
                const data = resource.data as any;
                const rating = data?.app_rating || 0;
                const totalReviews = data?.total_reviews;
                const platforms = data?.platforms || [];
                const privacyCertified = data?.privacy_certified;
                const free = data?.free || data?.cost === "free";
                const subscriptionModel = data?.subscription_model;
                const appStoreUrl = data?.app_store_url;
                const website = data?.website;

                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full transition-shadow hover:shadow-xl">
                      <CardHeader>
                        <div className="mb-3 flex items-start justify-between">
                          <div className="rounded-xl bg-blue-50 p-3">
                            <Smartphone className="h-6 w-6 text-blue-600" />
                          </div>
                          {privacyCertified && (
                            <Badge variant="outline" className="border-green-200 text-green-600">
                              <Lock className="mr-1 h-3 w-3" />
                              Privacy Certified
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="mb-2 text-lg">{resource.name}</CardTitle>

                        {/* Rating */}
                        {rating > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              <span className="ml-1 text-sm font-semibold">
                                {rating.toFixed(1)}
                              </span>
                            </div>
                            {totalReviews && (
                              <span className="text-xs text-slate-500">
                                ({totalReviews.toLocaleString()})
                              </span>
                            )}
                          </div>
                        )}

                        {resource.description && (
                          <p className="mt-2 text-sm text-slate-600">{resource.description}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Metadata */}
                        <div className="flex flex-wrap gap-2">
                          {platforms.map((platform: string) => (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                          {free ? (
                            <Badge className="bg-green-100 text-xs text-green-700">Free</Badge>
                          ) : subscriptionModel ? (
                            <Badge variant="outline" className="text-xs">
                              {subscriptionModel}
                            </Badge>
                          ) : null}
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          {appStoreUrl && (
                            <a href={appStoreUrl} target="_blank" rel="noopener noreferrer">
                              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                <Download className="mr-2 h-4 w-4" />
                                Download App
                              </Button>
                            </a>
                          )}
                          {website && !appStoreUrl && (
                            <a href={website} target="_blank" rel="noopener noreferrer">
                              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                <Globe className="mr-2 h-4 w-4" />
                                Visit Website
                              </Button>
                            </a>
                          )}
                          <Link href={`/resources/${resource.slug}`}>
                            <Button variant="outline" className="w-full">
                              View Details
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Smartphone className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                <h3 className="mb-2 text-xl font-semibold text-slate-900">No apps found</h3>
                <p className="mb-6 text-slate-600">Try adjusting your filters</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Privacy notice */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div className="text-sm text-blue-800">
                  <p className="mb-1 font-semibold">Privacy & Security</p>
                  <p>
                    Always review an app's privacy policy before use. Apps marked "Privacy
                    Certified" have been independently reviewed for data protection practices.
                    HeyPsych does not collect data from third-party apps.
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

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Phone,
  MessageSquare,
  Globe,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  X,
  Shield,
  Heart,
  Languages,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Entity } from "@/lib/types/database";

interface CrisisHelplinesHubProps {
  resources: Entity[];
}

export function CrisisHelplinesHub({ resources }: CrisisHelplinesHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  // Extract unique types and regions
  const types = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      const data = r.data as any;
      const type = data?.type || data?.service_type;
      if (type) set.add(type);
    });
    return Array.from(set).sort();
  }, [resources]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      const data = r.data as any;
      const region = data?.coverage_area || data?.region;
      if (region) set.add(region);
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

      // Type filter
      const type = data?.type || data?.service_type;
      if (selectedType !== "all" && type !== selectedType) {
        return false;
      }

      // Region filter
      const region = data?.coverage_area || data?.region;
      if (selectedRegion !== "all" && region !== selectedRegion) {
        return false;
      }

      return true;
    });
  }, [resources, searchQuery, selectedType, selectedRegion]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedRegion("all");
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) + (selectedType !== "all" ? 1 : 0) + (selectedRegion !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      {/* Hero */}
      <section className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="rounded-xl bg-rose-100 p-3">
                <Shield className="h-8 w-8 text-rose-600" />
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                <span className="bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                  Crisis & Helplines
                </span>
              </h1>
            </div>
            <p className="mx-auto mb-6 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Immediate help is available 24/7. You are not alone — crisis support, suicide
              prevention hotlines, and emergency resources are here for you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Prominent 988 CTA */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-0 bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-2xl">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12" />
                <h2 className="mb-3 text-2xl font-bold">If you're in crisis right now</h2>
                <p className="mb-6 text-lg text-rose-50">
                  The 988 Suicide & Crisis Lifeline provides free and confidential support 24/7
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <a href="tel:988">
                    <Button
                      size="lg"
                      className="bg-white px-8 text-lg text-rose-600 hover:bg-rose-50"
                    >
                      <Phone className="mr-2 h-5 w-5" />
                      Call 988
                    </Button>
                  </a>
                  <a href="sms:988">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white px-8 text-lg text-white hover:bg-rose-700"
                    >
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Text 988
                    </Button>
                  </a>
                </div>
                <p className="mt-4 text-sm text-rose-100">
                  Available in English & Spanish • Completely confidential • Trained counselors
                </p>
              </CardContent>
            </Card>
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
                  <span className="text-sm font-medium text-slate-700">Find helplines:</span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search helplines..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 py-2 pr-3 pl-10 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* Type filter */}
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="all">All Types</option>
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>

                  {/* Region filter */}
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="all">All Regions</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-slate-600">
                      Showing {filteredResources.length} of {resources.length} helplines
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

      {/* Helplines list */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredResources.map((resource, index) => {
                const data = resource.data as any;
                const phone = data?.phone;
                const textNumber = data?.text_number || data?.text;
                const hours = data?.hours || "24/7";
                const languages = data?.languages || [];
                const specialties = data?.specialties || [];

                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full transition-shadow hover:shadow-lg">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="mb-2 text-lg">{resource.name}</CardTitle>
                            {resource.description && (
                              <p className="text-sm text-slate-600">{resource.description}</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Contact methods */}
                        <div className="space-y-2">
                          {phone && (
                            <a href={`tel:${phone}`}>
                              <Button className="w-full bg-rose-600 hover:bg-rose-700">
                                <Phone className="mr-2 h-4 w-4" />
                                Call {phone}
                              </Button>
                            </a>
                          )}
                          {textNumber && (
                            <a href={`sms:${textNumber}`}>
                              <Button variant="outline" className="w-full">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Text {textNumber}
                              </Button>
                            </a>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="h-4 w-4" />
                            <span>{hours}</span>
                          </div>
                          {languages.length > 0 && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Languages className="h-4 w-4" />
                              <span>{languages.join(", ")}</span>
                            </div>
                          )}
                        </div>

                        {/* Specialties */}
                        {specialties.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {specialties.slice(0, 3).map((spec: string) => (
                              <Badge key={spec} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* View details link */}
                        <Link href={`/resources/${resource.slug}`}>
                          <Button
                            variant="ghost"
                            className="w-full text-rose-600 hover:text-rose-700"
                          >
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                <h3 className="mb-2 text-xl font-semibold text-slate-900">No helplines found</h3>
                <p className="mb-6 text-slate-600">Try adjusting your filters</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Emergency notice */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-600" />
              <h3 className="mb-2 font-bold text-amber-900">If you are in immediate danger</h3>
              <p className="mb-4 text-sm text-amber-800">
                Call 911 or go to your nearest emergency room
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

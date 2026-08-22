"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TreatmentGrid } from "@/components/blocks/treatment-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  AlertCircle,
  Filter,
  X,
  ChevronDown,
  Search,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { Entity } from "@/lib/types/database";

interface TreatmentsClientProps {
  treatments: Entity[];
  title: string;
  description: string;
  icon?: LucideIcon;
  showDisclaimer?: boolean;
}

export function TreatmentsClient({
  treatments,
  title,
  description,
  showDisclaimer = true,
}: TreatmentsClientProps) {
  const [sortBy, setSortBy] = useState<string>("a-z");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(20);
  const ITEMS_PER_PAGE = 20;

  // Search and filter
  const filteredTreatments = useMemo(() => {
    let results = treatments;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter((treatment) => {
        const name = treatment.name?.toLowerCase() || "";
        const description = treatment.description?.toLowerCase() || "";
        return name.includes(query) || description.includes(query);
      });
    }

    return results;
  }, [treatments, searchQuery]);

  // Sort
  const sortedTreatments = useMemo(() => {
    const sorted = [...filteredTreatments].sort((a, b) => {
      switch (sortBy) {
        case "a-z":
          return a.name.localeCompare(b.name);
        case "z-a":
          return b.name.localeCompare(a.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [filteredTreatments, sortBy]);

  const visibleTreatments = useMemo(() => {
    return sortedTreatments.slice(0, visibleCount);
  }, [sortedTreatments, visibleCount]);

  const hasMore = visibleCount < sortedTreatments.length;

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setVisibleCount(20);
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => window.history.back()} className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back
            </Button>

            <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
              <span className="bg-linear-to-r from-accent-600 to-accent bg-clip-text text-transparent">
                {title}
              </span>
            </h1>

            <div className="w-[100px]"></div>
          </div>

          <div className="mb-4 text-center">
            <p className="mx-auto mb-3 max-w-2xl text-sm text-label-secondary">{description}</p>

            <div className="flex items-center justify-center gap-4 text-xs text-label-primary">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-tint0"></div>
                {sortedTreatments?.length || 0} {title}
                {filteredTreatments?.length !== treatments?.length && (
                  <span className="text-orange-600">(filtered from {treatments?.length})</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-positive-tint0"></div>
                Evidence-Based
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="px-4 py-2 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-primary" />
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
              placeholder="Search by name or description... (Press Enter)"
              className="w-full rounded-xl border border-separator bg-surface py-3 pl-12 pr-4 text-sm text-label-primary placeholder:text-label-tertiary shadow-sm transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-label-quaternary hover:text-label-primary"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Sorting */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-end">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-label-secondary">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setVisibleCount(20);
                }}
                className="rounded-md border border-separator bg-surface px-3 py-1 text-sm"
              >
                <option value="a-z">A-Z</option>
                <option value="z-a">Z-A</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
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
                  entities={visibleTreatments}
                  title=""
                  variant="default"
                  showFilters={false}
                  showComparison={true}
                  className="rounded-3xl bg-surface p-8 shadow-xl"
                />
              </motion.div>

              {hasMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex flex-col items-center gap-4"
                >
                  <p className="text-sm text-label-secondary">
                    Showing {visibleCount} of {sortedTreatments.length} items
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
              <Card className="mx-auto max-w-md">
                <CardContent className="p-8">
                  <h3 className="mb-2 text-xl font-semibold text-label-primary">
                    {searchQuery.trim() ? "No Results Found" : "No Data Available"}
                  </h3>
                  <p className="mb-6 text-label-secondary">
                    {searchQuery.trim()
                      ? "Try adjusting your search."
                      : "Data hasn't been imported yet."}
                  </p>
                  {searchQuery.trim() && <Button onClick={clearSearch}>Clear Search</Button>}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      {showDisclaimer && (
        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-600" />
                  <div>
                    <h3 className="mb-2 font-semibold text-yellow-900">Important Medical Disclaimer</h3>
                    <p className="text-sm text-yellow-800">
                      The information provided here is for educational purposes only and should not replace
                      professional medical advice. Always consult with a qualified healthcare provider before
                      starting any new treatment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useConditionsByCategory } from "@/lib/hooks/use-entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Brain, ArrowRight } from "lucide-react";
import type { Entity, MappedEntity } from "@/lib/types/database";

// Type for condition content structure based on your JSON
interface ConditionContent {
  description?: string | object;
  symptoms?: string[];
  diagnostic_criteria?: string;
  prevalence?: string;
  summary?: string;
  overview?: string;
  [key: string]: any;
}

export default function CategoryPage() {
  const { data: conditions, isLoading, error } = useConditionsByCategory("anxiety-fear");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
          <h1 className="text-2xl font-bold text-neutral-900">Loading conditions...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Card className="mx-4 max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="mb-2 text-xl font-bold text-neutral-900">Error Loading Conditions</h1>
            <p className="mb-4 text-neutral-800">We couldn't load the conditions data.</p>
            <p className="mb-4 text-sm text-red-500">Error: {error?.message || "Unknown error"}</p>
            <Link href="/conditions">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Conditions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
      {/* Header */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Row */}
          <div className="mb-8 flex items-start justify-between">
            {/* Back Button */}
            <Link href="/conditions">
              <Button variant="ghost" className="group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Conditions
              </Button>
            </Link>

            {/* Title Section */}
            <div className="flex-1 text-center">
              <div className="mb-4 inline-flex rounded-2xl bg-yellow-50 p-4">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>

              <h1 className="mb-4 bg-gradient-to-r from-slate-900 via-yellow-900 to-slate-900 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
                <span className="bg-gradient-to-r from-yellow-600 to-yellow-600 bg-clip-text text-transparent">
                  😰 Anxiety & Fear
                </span>
              </h1>

              <p className="mx-auto mb-6 max-w-3xl text-lg text-neutral-800">
                Generalized anxiety, panic disorder, social anxiety, phobias, and fear-based
                conditions
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 text-sm text-neutral-700">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  {conditions?.length || 0} Conditions
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Evidence-Based
                </div>
              </div>
            </div>

            {/* Spacer for alignment */}
            <div className="w-[180px]"></div>
          </div>
        </div>
      </section>

      {/* Conditions List */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="rounded-3xl bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-neutral-900">
                All Anxiety & Fear Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {conditions && conditions.length > 0 ? (
                <div className="space-y-4">
                  {conditions.map((condition: MappedEntity<any> | Entity, index) => {
                    // Access the normalized entity structure from EntityService
                    const conditionName = condition.name || "Unknown Condition";

                    // The EntityService normalizes data to condition.data
                    const conditionData = condition.data as ConditionContent | null;

                    // Safely extract description - handle both string and object cases
                    let conditionDescription = "No description available";

                    if (conditionData?.description) {
                      if (typeof conditionData.description === "string") {
                        conditionDescription = conditionData.description;
                      } else if (typeof conditionData.description === "object") {
                        // If description is an object, try to extract meaningful text
                        const descObj = conditionData.description as any;
                        if (descObj.summary) {
                          conditionDescription = String(descObj.summary);
                        } else if (descObj.overview) {
                          conditionDescription = String(descObj.overview);
                        } else if (descObj.general) {
                          conditionDescription = String(descObj.general);
                        } else {
                          // Fallback: create description from object keys
                          const keys = Object.keys(descObj);
                          conditionDescription = `Covers: ${keys.join(", ")}`;
                        }
                      }
                    }

                    // If still no good description, check other fields
                    if (conditionDescription === "No description available" && conditionData) {
                      if (conditionData.summary && typeof conditionData.summary === "string") {
                        conditionDescription = conditionData.summary;
                      } else if (
                        conditionData.overview &&
                        typeof conditionData.overview === "string"
                      ) {
                        conditionDescription = conditionData.overview;
                      }
                    }

                    const conditionSlug = condition.slug || `condition-${index}`;

                    return (
                      <Link
                        key={conditionSlug}
                        href={`/conditions/${conditionSlug}`}
                        className="group block"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="rounded-xl border border-neutral-200 p-6 transition-all duration-300 group-hover:bg-yellow-50 hover:border-yellow-300 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="rounded-lg bg-yellow-50 p-3 transition-colors group-hover:bg-yellow-100">
                                <Brain className="h-6 w-6 text-yellow-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-neutral-900 transition-colors group-hover:text-yellow-600">
                                  {conditionName}
                                </h3>
                                <p className="mt-1 text-sm text-neutral-800">
                                  {typeof conditionDescription === "string"
                                    ? conditionDescription.length > 100
                                      ? `${conditionDescription.substring(0, 100)}...`
                                      : conditionDescription
                                    : "Complex condition data - click to view details"}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-neutral-600 transition-all group-hover:translate-x-1 group-hover:text-yellow-500" />
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Zap className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
                  <h3 className="mb-2 text-xl font-semibold text-neutral-900">No Conditions Found</h3>
                  <p className="mb-6 text-neutral-800">
                    We couldn't find any conditions in this category yet.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-700">Debug info:</p>
                    <p className="text-xs text-neutral-600">Looking for category: "anxiety-fear"</p>
                    <p className="text-xs text-neutral-600">
                      Conditions found: {conditions?.length || 0}
                    </p>
                    <p className="text-xs text-neutral-600">
                      Raw conditions data:{" "}
                      {JSON.stringify(
                        conditions?.slice(0, 1)?.map((c) => ({
                          name: c.name,
                          slug: c.slug,
                          dataKeys: c.data ? Object.keys(c.data) : [],
                          descriptionType: c.data?.description
                            ? typeof c.data.description
                            : "undefined",
                        })),
                        null,
                        2
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Back to Conditions */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Link href="/conditions">
            <Button variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Conditions
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

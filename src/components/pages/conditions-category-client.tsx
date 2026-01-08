"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, ArrowRight, AlertCircle } from "lucide-react";
import type { Entity } from "@/lib/types/database";
import type { CategoryConfig } from "@/lib/config/condition-categories";
import { ConditionBreadcrumbs } from "@/components/conditions/ConditionBreadcrumbs";

interface ConditionContent {
  description?: string | object;
  symptoms?: string[];
  diagnostic_criteria?: string;
  prevalence?: string;
  summary?: string;
  overview?: string;
  [key: string]: any;
}

// Client-safe category config (without React component icon)
type SerializableCategoryConfig = Omit<CategoryConfig, 'icon'>;

interface ConditionsCategoryClientProps {
  conditions: Entity[];
  category: SerializableCategoryConfig;
}

export function ConditionsCategoryClient({ conditions, category }: ConditionsCategoryClientProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${category.bgColor} via-white to-${category.bgColor}`}>
      {/* Header */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <ConditionBreadcrumbs category={category} />
          </div>

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
              <div className={`mb-4 inline-flex rounded-2xl ${category.bgColor} p-4`}>
                <Brain className={`h-8 w-8 ${category.iconColor}`} />
              </div>

              <h1 className="mb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
                <span className={`bg-linear-to-r ${category.gradient} bg-clip-text text-transparent`}>
                  {category.emoji} {category.displayTitle}
                </span>
              </h1>

              <p className="mx-auto mb-6 max-w-3xl text-lg text-neutral-800">
                {category.subtitle}
              </p>

              {/* Educational Disclaimer */}
              <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <strong>Educational Resource:</strong> This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider.
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 text-sm text-neutral-700">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${category.iconColor.replace('text-', 'bg-')}`}></div>
                  {conditions.length} Conditions
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
                All {category.displayTitle} Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {conditions && conditions.length > 0 ? (
                <div className="space-y-4">
                  {conditions.map((condition, index) => {
                    const conditionName = condition.name || "Unknown Condition";
                    const conditionData = condition.data as ConditionContent | null;

                    let conditionDescription = "No description available";

                    if (conditionData?.description) {
                      if (typeof conditionData.description === "string") {
                        conditionDescription = conditionData.description;
                      } else if (typeof conditionData.description === "object") {
                        const descObj = conditionData.description as any;
                        if (descObj.summary) {
                          conditionDescription = String(descObj.summary);
                        } else if (descObj.overview) {
                          conditionDescription = String(descObj.overview);
                        } else if (descObj.general) {
                          conditionDescription = String(descObj.general);
                        } else {
                          const keys = Object.keys(descObj);
                          conditionDescription = `Covers: ${keys.join(", ")}`;
                        }
                      }
                    }

                    if (conditionDescription === "No description available" && conditionData) {
                      if (conditionData.summary && typeof conditionData.summary === "string") {
                        conditionDescription = conditionData.summary;
                      } else if (conditionData.overview && typeof conditionData.overview === "string") {
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
                          className={`rounded-xl border border-neutral-200 p-6 transition-all duration-300 group-hover:${category.bgColor} hover:border-${category.iconColor.replace('text-', '')} hover:shadow-md`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`rounded-lg ${category.bgColor} p-3 transition-colors group-hover:opacity-80`}>
                                <Brain className={`h-6 w-6 ${category.iconColor}`} />
                              </div>
                              <div>
                                <h3 className={`text-lg font-semibold text-neutral-900 transition-colors group-hover:${category.iconColor}`}>
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
                            <ArrowRight className={`h-5 w-5 text-neutral-600 transition-all group-hover:translate-x-1 group-hover:${category.iconColor}`} />
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Brain className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
                  <h3 className="mb-2 text-xl font-semibold text-neutral-900">No Conditions Found</h3>
                  <p className="mb-6 text-neutral-800">
                    We couldn't find any conditions in this category yet.
                  </p>
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


















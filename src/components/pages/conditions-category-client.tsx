"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
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
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <ConditionBreadcrumbs category={category} />
          </div>

          {/* Back Link */}
          <Link
            href="/conditions"
            className="mb-6 inline-flex items-center gap-2 text-sm text-label-secondary hover:text-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Conditions
          </Link>

          {/* Title Section */}
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              Condition Category
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-label-primary sm:text-4xl">
              {category.displayTitle}
            </h1>
            <p className="mt-3 text-lg text-label-secondary">
              {category.subtitle}
            </p>

            {/* Stats */}
            <div className="mt-4 text-sm text-label-tertiary">
              {conditions.length} conditions
            </div>
          </div>

          {/* Educational Disclaimer */}
          <div className="mt-8 rounded-lg border border-separator bg-canvas p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-label-tertiary mt-0.5" />
              <p className="text-sm text-label-secondary">
                <strong className="text-label-primary">Educational Resource:</strong> This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions List */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            Browse
          </p>
          <h2 className="mt-1 text-xl font-semibold text-label-primary">
            All {category.displayTitle} Conditions
          </h2>

          {conditions && conditions.length > 0 ? (
            <div className="mt-6 space-y-3">
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
                      // Try to extract first meaningful string from any field
                      const values = Object.values(descObj);
                      const firstString = values.find(
                        (v): v is string => typeof v === "string" && v.length > 20
                      );
                      if (firstString) {
                        conditionDescription = firstString;
                      } else {
                        conditionDescription = `Learn about ${conditionName}, including symptoms, causes, and treatment options.`;
                      }
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
                    <div className="flex items-center justify-between rounded-xl border border-separator bg-surface p-5 transition-all hover:border-neutral-300 hover:shadow-soft">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-label-primary group-hover:text-accent transition-colors">
                          {conditionName}
                        </h3>
                        <p className="mt-1 text-sm text-label-secondary line-clamp-2">
                          {typeof conditionDescription === "string"
                            ? conditionDescription.length > 120
                              ? `${conditionDescription.substring(0, 120)}...`
                              : conditionDescription
                            : "View details"}
                        </p>
                      </div>
                      <ArrowRight className="ml-4 h-4 w-4 flex-shrink-0 text-label-quaternary transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-separator bg-surface p-12 text-center">
              <h3 className="text-lg font-medium text-label-primary">No Conditions Found</h3>
              <p className="mt-2 text-label-secondary">
                We couldn't find any conditions in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Back to Conditions */}
      <section className="border-t border-separator px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/conditions"
            className="inline-flex items-center gap-2 text-sm font-medium text-label-secondary hover:text-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Conditions
          </Link>
        </div>
      </section>
    </div>
  );
}

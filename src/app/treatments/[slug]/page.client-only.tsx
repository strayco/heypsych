"use client";

import React, { useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { EntityService } from "@/lib/data/entity-service";
import { supabase } from "@/lib/config/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Indications, ParsedContent, ParsedLinkList } from "@/components/ui/parsed-content";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Info,
  Pill,
  Calendar,
  Activity,
  Users,
  DollarSign,
  Clock,
  FileText,
  Heart,
  Target,
  Book,
  Zap,
  Settings,
} from "lucide-react";
import Link from "next/link";

// Generic section type - handles ANY section structure
type DynamicSection = {
  type: string;
  [key: string]: any; // Allow any additional properties
};

export default function TreatmentPage() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: entity,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["treatment", slug],
    queryFn: () => EntityService.getBySlug(String(slug)),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <h1 className="text-2xl font-bold text-neutral-900">Loading treatment...</h1>
        </div>
      </div>
    );
  }

  if (error || !entity) {
    notFound();
  }

  const data = (entity!.data || {}) as {
    name?: string;
    summary?: string;
    description?: string;
    sections?: DynamicSection[];
    category?: string;
    metadata?: { fda_approval_year?: number };
  };

  const title = entity!.name || data.name || "";
  const summary: string | undefined = data.summary;
  const description: string | undefined = data.description;
  const sections: DynamicSection[] = data.sections || [];
  const category: string | undefined = data.category;
  const metadata = data.metadata || (entity!.data as any)?.metadata || {};
  const fdaApprovalYear = metadata.fda_approval_year;

  // Don't display category badges
  const displayCategory = null;

  // Dynamic badge from category
  const treatmentType = (() => {
    if (!category) return "treatment";
    if (category.includes("medication")) return "medication";
    if (category.includes("interventional")) return "interventional";
    if (category.includes("investigational")) return "investigational";
    if (category.includes("alternative")) return "alternative";
    if (category.includes("therapy")) return "therapy";
    if (category.includes("supplement")) return "supplement";
    return "treatment";
  })();

  // Dynamic icon mapping
  const getIconForSectionType = (type: string) => {
    const iconMap: Record<string, any> = {
      indications: Shield,
      mechanism: Zap,
      protocol: Settings,
      treatment_variants: Activity,
      expected_outcomes: Target,
      side_effects: AlertTriangle,
      contraindications: AlertTriangle,
      patient_selection: Users,
      integration_support: Heart,
      cost_considerations: DollarSign,
      clinical_notes: FileText,
      references: Book,
      dosing: Pill,
      adverse_effects: AlertTriangle,
      monitoring: Activity,
      special_populations: Users,
      // Add more as needed
    };
    return iconMap[type] || Info;
  };

  // Dynamic section title formatting
  const formatSectionTitle = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Dynamic section renderer - this is the key function
  const renderSection = (section: DynamicSection) => {
    const { type, ...sectionData } = section;
    const Icon = getIconForSectionType(type);
    const title = formatSectionTitle(type);

    // Handle different data structures dynamically
    return (
      <Card key={type} className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{renderSectionContent(sectionData, type)}</CardContent>
      </Card>
    );
  };

  // Dynamic content renderer based on data structure
  const renderSectionContent = (sectionData: any, type: string) => {
    // Handle text content with link parsing
    if (sectionData.text) {
      return <ParsedContent content={sectionData.text} className="text-neutral-800" />;
    }

    // Handle simple items array
    if (sectionData.items && Array.isArray(sectionData.items)) {
      // Special handling for references
      if (type === "references" && sectionData.items[0]?.url) {
        return (
          <div className="space-y-2">
            {sectionData.items.map((ref: any, i: number) => (
              <a
                key={i}
                href={ref.url}
                target="_blank"
                rel="noreferrer"
                className="block text-blue-600 hover:underline"
              >
                {ref.label}
              </a>
            ))}
          </div>
        );
      }

      // Special handling for interactions (objects with with/risk/action)
      if (type === "interactions" && sectionData.items[0]?.with) {
        return (
          <div className="space-y-3">
            {sectionData.items.map((interaction: any, i: number) => (
              <div key={i} className="rounded-lg bg-neutral-50 p-3">
                <p className="text-neutral-900">
                  <span className="font-semibold">With:</span> {interaction.with}
                </p>
                <p className="text-neutral-900">
                  <span className="font-semibold">Risk:</span> {interaction.risk}
                </p>
                <p className="text-neutral-900">
                  <span className="font-semibold">Action:</span> {interaction.action}
                </p>
              </div>
            ))}
          </div>
        );
      }

      // Special handling for indications with ParsedContent
      if (type === "indications") {
        return <Indications indications={sectionData.items} />;
      }

      // Check if items contain link tokens
      const hasLinks = sectionData.items.some(
        (item: any) => typeof item === "string" && item.includes("{link:")
      );

      if (hasLinks) {
        return (
          <ParsedLinkList
            items={sectionData.items}
            className="space-y-1"
            itemClassName="block"
            separator=""
          />
        );
      }

      // Default items list - ensure we handle objects properly
      return (
        <ul className="list-disc space-y-1 pl-6 text-neutral-800">
          {sectionData.items.map((item: any, i: number) => (
            <li key={i}>
              {typeof item === "string" ? (
                <ParsedContent content={item} />
              ) : typeof item === "object" ? (
                <pre className="mt-1 rounded bg-neutral-100 p-2 text-xs text-neutral-900">
                  {JSON.stringify(item, null, 2)}
                </pre>
              ) : (
                String(item)
              )}
            </li>
          ))}
        </ul>
      );
    }

    // Handle protocol structure with link parsing
    if (type === "protocol") {
      return (
        <div className="space-y-4">
          {sectionData.preparation && (
            <div>
              <h4 className="mb-2 font-semibold text-neutral-900">Preparation</h4>
              <ParsedContent content={sectionData.preparation} className="text-neutral-800" />
            </div>
          )}
          {sectionData.procedure && Array.isArray(sectionData.procedure) && (
            <div>
              <h4 className="mb-2 font-semibold text-neutral-900">Procedure</h4>
              <ol className="list-decimal space-y-1 pl-6 text-neutral-800">
                {sectionData.procedure.map((step: string, i: number) => (
                  <li key={i}>
                    <ParsedContent content={step} />
                  </li>
                ))}
              </ol>
            </div>
          )}
          {sectionData.frequency && (
            <p className="text-neutral-900">
              <span className="font-semibold">Frequency:</span>{" "}
              <ParsedContent content={sectionData.frequency} />
            </p>
          )}
          {sectionData.duration && (
            <p className="text-neutral-900">
              <span className="font-semibold">Duration:</span>{" "}
              <ParsedContent content={sectionData.duration} />
            </p>
          )}
          {sectionData.total_treatment_time && (
            <p className="text-neutral-900">
              <span className="font-semibold">Total Treatment Time:</span>{" "}
              <ParsedContent content={sectionData.total_treatment_time} />
            </p>
          )}
        </div>
      );
    }

    // Handle expected outcomes structure with link parsing
    if (type === "expected_outcomes") {
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {sectionData.immediate && (
            <div>
              <h4 className="mb-2 font-semibold text-green-700">Immediate</h4>
              <ul className="list-disc space-y-1 pl-4 text-neutral-800">
                {sectionData.immediate.map((outcome: string, i: number) => (
                  <li key={i}>
                    <ParsedContent content={outcome} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sectionData.short_term && (
            <div>
              <h4 className="mb-2 font-semibold text-blue-700">Short Term</h4>
              <ul className="list-disc space-y-1 pl-4 text-neutral-800">
                {sectionData.short_term.map((outcome: string, i: number) => (
                  <li key={i}>
                    <ParsedContent content={outcome} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sectionData.long_term && (
            <div>
              <h4 className="mb-2 font-semibold text-purple-700">Long Term</h4>
              <ul className="list-disc space-y-1 pl-4 text-neutral-800">
                {sectionData.long_term.map((outcome: string, i: number) => (
                  <li key={i}>
                    <ParsedContent content={outcome} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Handle side effects / contraindications with severity levels and link parsing
    if (
      (type === "side_effects" || type === "contraindications") &&
      typeof sectionData === "object"
    ) {
      return (
        <div className="space-y-4">
          {Object.entries(sectionData).map(([severity, items]: [string, any]) => {
            if (!Array.isArray(items)) return null;

            const severityColors = {
              common: "text-yellow-700 bg-yellow-50 border-yellow-200",
              uncommon: "text-orange-700 bg-orange-50 border-orange-200",
              rare: "text-red-700 bg-red-50 border-red-200",
              absolute: "text-red-700 bg-red-50 border-red-200",
              relative: "text-yellow-700 bg-yellow-50 border-yellow-200",
              special_considerations: "text-blue-700 bg-blue-50 border-blue-200",
            };

            const colorClass =
              severityColors[severity as keyof typeof severityColors] ||
              "text-neutral-800 bg-neutral-50 border-neutral-200";

            return (
              <div key={severity} className={`rounded-lg border p-4 ${colorClass}`}>
                <h4 className="mb-2 font-semibold text-neutral-900 capitalize">
                  {severity.replace(/_/g, " ")}
                </h4>
                <ul className="list-disc space-y-1 pl-4">
                  {items.map((item: string, i: number) => (
                    <li key={i}>
                      <ParsedContent content={item} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      );
    }

    // Handle cost considerations with link parsing
    if (type === "cost_considerations") {
      return (
        <div className="space-y-3 text-neutral-800">
          {Object.entries(sectionData).map(([key, value]: [string, any]) => (
            <p key={key}>
              <span className="font-semibold capitalize">{key.replace(/_/g, " ")}:</span>{" "}
              <ParsedContent content={String(value)} />
            </p>
          ))}
        </div>
      );
    }

    // Handle any nested object structure generically with link parsing
    if (typeof sectionData === "object" && sectionData !== null) {
      return (
        <div className="space-y-3">
          {Object.entries(sectionData).map(([key, value]: [string, any]) => {
            if (Array.isArray(value)) {
              return (
                <div key={key}>
                  <h4 className="mb-2 font-semibold text-neutral-900 capitalize">
                    {key.replace(/_/g, " ")}
                  </h4>
                  <ul className="list-disc space-y-1 pl-6 text-neutral-800">
                    {value.map((item: any, i: number) => (
                      <li key={i}>
                        {typeof item === "string" ? (
                          <ParsedContent content={item} />
                        ) : typeof item === "object" ? (
                          <div className="mt-1">
                            {Object.entries(item).map(([itemKey, itemValue]: [string, any]) => (
                              <div key={itemKey} className="text-neutral-900">
                                <span className="font-medium">{itemKey}:</span>{" "}
                                <ParsedContent content={String(itemValue)} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          String(item)
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }

            if (typeof value === "string") {
              return (
                <p key={key} className="text-neutral-800">
                  <span className="font-semibold capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                  <ParsedContent content={value} />
                </p>
              );
            }

            if (typeof value === "object" && value !== null) {
              return (
                <div key={key}>
                  <h4 className="mb-2 font-semibold text-neutral-900 capitalize">
                    {key.replace(/_/g, " ")}
                  </h4>
                  <div className="space-y-1 pl-4">
                    {Object.entries(value).map(([subKey, subValue]: [string, any]) => (
                      <p key={subKey} className="text-neutral-900">
                        <span className="font-semibold capitalize">
                          {subKey.replace(/_/g, " ")}:
                        </span>{" "}
                        <ParsedContent content={String(subValue)} />
                      </p>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <p key={key} className="text-neutral-800">
                <span className="font-semibold capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                <ParsedContent content={String(value)} />
              </p>
            );
          })}
        </div>
      );
    }

    // Fallback - just display the raw data
    return (
      <pre className="overflow-auto rounded bg-neutral-100 p-4 text-sm text-neutral-900">
        {JSON.stringify(sectionData, null, 2)}
      </pre>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" onClick={() => window.history.back()} className="group">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              {displayCategory && (
                <Badge variant={treatmentType as any} size="md">
                  {displayCategory}
                </Badge>
              )}
              <h1 className="text-4xl font-bold text-neutral-900">{title}</h1>
              {fdaApprovalYear && (
                <div className="flex items-center gap-2 text-sm text-neutral-800">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {fdaApprovalYear >= 1900 && fdaApprovalYear < 2000
                      ? `Introduced ${fdaApprovalYear}`
                      : fdaApprovalYear >= 2000
                        ? `FDA Approved ${fdaApprovalYear}`
                        : `Traditional use since ${fdaApprovalYear}`}
                  </span>
                </div>
              )}
              {summary && (
                <ParsedContent content={summary} className="max-w-2xl text-neutral-800" />
              )}
              {description && (
                <div className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <ParsedContent content={description} className="text-neutral-800" />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Dynamic Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {sections.map(renderSection)}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-8 text-center">
              <h3 className="mb-4 text-2xl font-bold text-neutral-900">
                Interested in this treatment?
              </h3>
              <p className="mx-auto mb-6 max-w-2xl text-neutral-800">
                This information is for educational purposes. Always consult with a qualified
                healthcare provider before starting any new treatment.
              </p>
              <div className="flex justify-center space-x-4">
                <Button size="lg">Find Providers</Button>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import React, { use, useState } from "react";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEntityByType } from "@/lib/hooks/use-entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParsedContent, ParsedLinkList } from "@/components/ui/parsed-content";
import {
  ArrowLeft,
  Brain,
  AlertCircle,
  TrendingUp,
  Heart,
  Shield,
  Target,
  Info,
  Stethoscope,
  Activity,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Pill,
  MessageCircle,
  Globe,
  BarChart3,
  Eye,
  Settings,
  ChevronDown,
} from "lucide-react";

interface ConditionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// SAFE TEXT EXTRACTION FUNCTION - Now includes link parsing
const extractSafeText = (data: any, fallback = "No information available"): string => {
  if (typeof data === "string") return data;
  if (!data) return fallback;

  if (typeof data === "object") {
    // Try common text fields
    const textFields = [
      "description",
      "summary",
      "overview",
      "general",
      "text",
      "content",
      "definition",
    ];
    for (const field of textFields) {
      if (data[field] && typeof data[field] === "string") {
        return data[field];
      }
    }

    // If it's an array, join strings
    if (Array.isArray(data)) {
      const strings = data.filter((item) => typeof item === "string").slice(0, 3);
      if (strings.length > 0) return strings.join(", ");
    }

    // For objects, create descriptive text
    const keys = Object.keys(data);
    if (keys.length > 0) {
      // Special handling for substance use disorder objects
      if (
        keys.includes("withdrawal") ||
        keys.includes("intoxication") ||
        keys.includes("use_disorder")
      ) {
        return `Substance-related information covering: ${keys.join(", ")}`;
      }
      return `Information covers: ${keys.join(", ")}`;
    }
  }

  return String(data) || fallback;
};

// Icon mapping for different field types
const getIconForField = (fieldName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    // Core info
    description: <Info className="h-5 w-5" />,
    overview: <Info className="h-5 w-5" />,
    diagnostic_criteria: <Stethoscope className="h-5 w-5" />,
    evaluation: <Stethoscope className="h-5 w-5" />,
    prognosis: <TrendingUp className="h-5 w-5" />,
    neurobiology: <Brain className="h-5 w-5" />,

    // Symptoms and presentation
    symptoms: <AlertCircle className="h-5 w-5" />,
    signs: <AlertCircle className="h-5 w-5" />,
    presentation: <Eye className="h-5 w-5" />,
    severity_levels: <BarChart3 className="h-5 w-5" />,
    warning_signs: <AlertTriangle className="h-5 w-5" />,

    // Risk and impact
    risk_factors: <Shield className="h-5 w-5" />,
    impact_on_life: <Target className="h-5 w-5" />,
    complications: <AlertTriangle className="h-5 w-5" />,
    comorbidities: <Activity className="h-5 w-5" />,

    // Treatment
    treatment_approaches: <Heart className="h-5 w-5" />,
    treatment_goals: <CheckCircle className="h-5 w-5" />,
    medications: <Pill className="h-5 w-5" />,
    psychotherapy: <MessageCircle className="h-5 w-5" />,
    interventions: <Settings className="h-5 w-5" />,
    therapy: <MessageCircle className="h-5 w-5" />,

    // Self-help and practical
    self_help_strategies: <Lightbulb className="h-5 w-5" />,
    coping_strategies: <Lightbulb className="h-5 w-5" />,
    lifestyle_interventions: <Heart className="h-5 w-5" />,
    prevention: <Shield className="h-5 w-5" />,

    // Substance use specific
    withdrawal: <AlertTriangle className="h-5 w-5" />,
    intoxication: <AlertCircle className="h-5 w-5" />,
    use_disorder: <Brain className="h-5 w-5" />,

    // Default fallback
    default: <Globe className="h-5 w-5" />,
  };

  // Try exact match first
  if (iconMap[fieldName]) return iconMap[fieldName];

  // Try partial matches
  for (const [key, icon] of Object.entries(iconMap)) {
    if (fieldName.includes(key) || key.includes(fieldName)) {
      return icon;
    }
  }

  return iconMap["default"];
};

// Color mapping for different field types
const getColorForField = (fieldName: string): string => {
  const colorMap: Record<string, string> = {
    symptoms: "blue",
    risk_factors: "red",
    treatment: "green",
    prognosis: "purple",
    warning: "red",
    help: "orange",
    self_help: "yellow",
    severity: "orange",
    impact: "purple",
    evaluation: "indigo",
    examples: "teal",
    withdrawal: "red",
    intoxication: "orange",
    use_disorder: "purple",
  };

  for (const [key, color] of Object.entries(colorMap)) {
    if (fieldName.includes(key)) return color;
  }

  return "gray";
};

// Smart title formatting
const formatTitle = (fieldName: string): string => {
  return fieldName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ConditionPage({ params }: ConditionPageProps) {
  const { slug } = use(params);
  const { data: condition, isLoading, error } = useEntityByType("condition", slug);

  // State for tracking which fields are expanded
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  const toggleField = (fieldName: string) => {
    setExpandedFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <h1 className="text-2xl font-bold text-neutral-900">Loading condition...</h1>
        </div>
      </div>
    );
  }

  if (error || !condition) {
    notFound();
  }

  const data = condition.data;

  // Extract header fields (shown in the top section)
  const headerFields = ["description", "prevalence", "age_of_onset", "dsm5_code", "icd10_code"];

  // Extract always visible fields (shown in overview card without collapse)
  const alwaysVisibleFields = ["description", "prevalence", "age_of_onset"];

  // Get all other fields for dynamic rendering
  const getDynamicFields = () => {
    const allFields = Object.keys(data || {});
    const excludeFields = [...headerFields, ...alwaysVisibleFields];
    const otherFields = allFields.filter((field) => !excludeFields.includes(field));

    // Ensure diagnostic_criteria appears first if it exists
    const fieldsWithPriority = [];
    if (otherFields.includes("diagnostic_criteria")) {
      fieldsWithPriority.push("diagnostic_criteria");
    }
    fieldsWithPriority.push(...otherFields.filter((field) => field !== "diagnostic_criteria"));

    return fieldsWithPriority;
  };

  // Universal renderer for any data structure - Enhanced with link parsing
  const renderDynamicField = (fieldName: string, fieldData: any, index: number) => {
    if (!fieldData) return null;

    const title = formatTitle(fieldName);
    const icon = getIconForField(fieldName);
    const color = getColorForField(fieldName);
    const isExpanded = expandedFields[fieldName] || false;

    return (
      <motion.div
        key={fieldName}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 * (index + 3) }}
      >
        <Card>
          <CardHeader
            className="cursor-pointer transition-colors hover:bg-neutral-50"
            onClick={() => toggleField(fieldName)}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-900">
                {icon}
                {title}
              </div>
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-5 w-5 text-neutral-600" />
              </motion.div>
            </CardTitle>
          </CardHeader>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <CardContent className="pt-0">
                  {renderFieldContent(fieldData, color, fieldName)}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };

  // Enhanced content renderer with link parsing
  const renderFieldContent = (fieldData: any, color: string = "gray", fieldName?: string) => {
    // Handle null/undefined
    if (!fieldData) {
      return <p className="text-neutral-600 italic">No information available</p>;
    }

    // Special handling for diagnostic criteria - format as bullets with links
    if (fieldName === "diagnostic_criteria" && typeof fieldData === "string") {
      const listPatterns = [
        /(?=[A-Z]\.)/, // A., B., C., D.
        /(?=\(\d+\))/, // (1), (2), (3)
        /(?=\d+\.)/, // 1., 2., 3.
        /(?=\d+\))/, // 1), 2), 3)
        /(?=[ivx]+\.)/i, // i., ii., iii., iv.
        /(?=[a-z]\.)/, // a., b., c., d.
        /(?=\([a-z]\))/, // (a), (b), (c)
        /(?=\([ivx]+\))/i, // (i), (ii), (iii)
        /(?=•)/, // • bullet points
        /(?=-\s)/, // - dash lists
        /(?=\*\s)/, // * asterisk lists
      ];

      let criteria: string[] = [];
      for (const pattern of listPatterns) {
        const testSplit = fieldData.split(pattern).filter((item) => item.trim().length > 0);
        if (testSplit.length > 1) {
          criteria = testSplit;
          break;
        }
      }

      if (criteria.length > 1) {
        return (
          <ul className="space-y-3">
            {criteria.map((criterion: string, index: number) => (
              <li key={index} className="flex items-start gap-3 text-sm text-neutral-800">
                <div className={`h-2 w-2 bg-${color}-500 mt-2 flex-shrink-0 rounded-full`} />
                <ParsedContent content={criterion.trim()} />
              </li>
            ))}
          </ul>
        );
      }
    }

    // Handle arrays with link parsing
    if (Array.isArray(fieldData)) {
      // Check if it's an array of strings that might contain links
      const hasStringLinks = fieldData.some(
        (item) => typeof item === "string" && item.includes("{link:")
      );

      if (hasStringLinks) {
        return (
          <ParsedLinkList
            items={fieldData.filter((item) => typeof item === "string")}
            className="space-y-2"
            itemClassName="flex items-start gap-3 text-sm text-neutral-800"
            separator=""
          />
        );
      }

      return (
        <ul className="space-y-2">
          {fieldData.map((item: any, index: number) => (
            <li key={index} className="flex items-start gap-3 text-sm text-neutral-800">
              <div className={`h-1.5 w-1.5 bg-${color}-500 mt-2 flex-shrink-0 rounded-full`} />
              {typeof item === "object" ? (
                <div className="space-y-1">
                  {item?.name ? (
                    <>
                      <span className="font-medium text-neutral-900">{String(item.name)}</span>
                      {(item.dsm5_code || item.icd10_code) && (
                        <div className="flex gap-2 text-xs">
                          {item.dsm5_code && (
                            <span className="rounded bg-indigo-100 px-2 py-1 font-mono text-indigo-700">
                              DSM-5: {String(item.dsm5_code)}
                            </span>
                          )}
                          {item.icd10_code && (
                            <span className="rounded bg-amber-100 px-2 py-1 font-mono text-amber-700">
                              ICD-10: {String(item.icd10_code)}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  ) : item?.note ? (
                    <ParsedContent content={String(item.note)} className="text-neutral-800" />
                  ) : (
                    <ParsedContent content={extractSafeText(item)} className="text-neutral-800" />
                  )}
                </div>
              ) : (
                <ParsedContent content={String(item)} />
              )}
            </li>
          ))}
        </ul>
      );
    }

    // Handle objects with link parsing
    if (typeof fieldData === "object" && fieldData !== null) {
      return (
        <div className="space-y-6">
          {Object.entries(fieldData).map(([key, value]) => (
            <div key={key} className="space-y-3">
              <h4 className="border-b pb-2 font-semibold text-neutral-900 capitalize">
                {formatTitle(key)}
              </h4>
              {Array.isArray(value) ? (
                <ul className="space-y-2">
                  {value.map((item: any, index: number) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-neutral-800">
                      <div
                        className={`h-1.5 w-1.5 bg-${color}-500 mt-2 flex-shrink-0 rounded-full`}
                      />
                      <ParsedContent content={extractSafeText(item)} />
                    </li>
                  ))}
                </ul>
              ) : typeof value === "object" && value !== null ? (
                <div className="ml-4 space-y-2">
                  {Object.entries(value).map(([subKey, subValue]) => (
                    <div key={subKey} className="border-l-2 border-neutral-200 pl-3">
                      <h5 className="text-sm font-medium text-neutral-900 capitalize">
                        {formatTitle(subKey)}
                      </h5>
                      <div className="mt-1">
                        <ParsedContent
                          content={String(subValue)}
                          className="text-sm text-neutral-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ParsedContent content={String(value)} className="text-sm text-neutral-800" />
              )}
            </div>
          ))}
        </div>
      );
    }

    // Handle strings and primitives with link parsing
    return <ParsedContent content={String(fieldData)} className="text-neutral-800" />;
  };

  const dynamicFields = getDynamicFields();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" className="group" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="space-y-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="primary" size="md">
                Mental Health Condition
              </Badge>
            </div>
            <h1 className="text-4xl font-bold text-neutral-900">{condition.name}</h1>
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Overview - Enhanced with link parsing */}
          {(data.description || data.prevalence || data.age_of_onset) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.description && (
                      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                        <h4 className="mb-2 font-semibold text-blue-900">Description</h4>
                        <div className="text-sm text-blue-800">
                          <ParsedContent content={extractSafeText(data.description)} />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {data.prevalence && (
                        <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-3">
                          <h4 className="mb-1 font-semibold text-green-900">Prevalence</h4>
                          <div className="text-sm text-green-800">
                            <ParsedContent content={String(data.prevalence)} />
                          </div>
                        </div>
                      )}

                      {data.age_of_onset && (
                        <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50 p-3">
                          <h4 className="mb-1 font-semibold text-purple-900">Age of Onset</h4>
                          <div className="text-sm text-purple-800">
                            <ParsedContent content={String(data.age_of_onset)} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DSM-5 and ICD-10 Codes */}
                    {(() => {
                      const dsm5 = (condition as any)?.raw?.metadata?.dsm5_code;
                      const icd10 = (condition as any)?.raw?.metadata?.icd10_code;

                      return dsm5 || icd10 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {dsm5 && (
                            <div className="rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-3">
                              <h4 className="mb-1 font-semibold text-indigo-900">DSM-5 Code</h4>
                              <p className="font-mono text-sm text-indigo-800">{String(dsm5)}</p>
                            </div>
                          )}

                          {icd10 && (
                            <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-3">
                              <h4 className="mb-1 font-semibold text-amber-900">ICD-10 Code</h4>
                              <p className="font-mono text-sm text-amber-800">{String(icd10)}</p>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Actions */}
          {dynamicFields.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-end gap-2"
            >
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const allExpanded = dynamicFields.every((field) => expandedFields[field]);
                  const newState = dynamicFields.reduce(
                    (acc, field) => ({
                      ...acc,
                      [field]: !allExpanded,
                    }),
                    {}
                  );
                  setExpandedFields(newState);
                }}
              >
                {dynamicFields.every((field) => expandedFields[field])
                  ? "Collapse All"
                  : "Expand All"}
              </Button>
            </motion.div>
          )}

          {/* Dynamic Fields */}
          {dynamicFields.map((fieldName, index) =>
            renderDynamicField(fieldName, data[fieldName], index)
          )}

          {/* Call to Action with links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (dynamicFields.length + 4) }}
          >
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-8 text-center">
                <h3 className="mb-4 text-2xl font-bold text-neutral-900">
                  Seeking Help for {condition.name}?
                </h3>
                <div className="mx-auto mb-6 max-w-2xl text-neutral-800">
                  <ParsedContent content="If you recognize these symptoms in yourself or a loved one, know that help is available. Mental health conditions are treatable with options like {link:treatment:cognitive-behavioral-therapy}, and early intervention can make a significant difference." />
                </div>
                <div className="flex justify-center space-x-4">
                  <Button size="lg">Find Treatment Options</Button>
                  <Button size="lg" variant="outline">
                    Locate Providers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

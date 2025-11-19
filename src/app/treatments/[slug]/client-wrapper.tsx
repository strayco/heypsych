"use client";

// CLIENT WRAPPER - Handles interactive features
// Data is passed from server component (already fetched)

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParsedContent, Indications, ParsedLinkList } from "@/components/ui/parsed-content";
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
  FileText,
  Heart,
  Target,
  Book,
  Zap,
  Settings,
} from "lucide-react";
import { Entity } from "@/lib/types/database";
import type { PageLinkResult } from "@/lib/linking/link-service";
import {
  TreatmentOptionsSection,
  RelatedConditionsSection,
  AssessmentCTASection,
  RelatedArticlesSection,
} from "@/components/linking";
import {
  AuthorByline,
  MedicalReviewBadge,
  ContentTimestamps,
  MedicalDisclaimer,
  CitationList,
} from "@/components/eat";

type DynamicSection = {
  type: string;
  [key: string]: any;
};

interface TreatmentClientWrapperProps {
  entity: Entity;
  pageLinks: PageLinkResult;
}

export default function TreatmentClientWrapper({ entity, pageLinks }: TreatmentClientWrapperProps) {
  const data = (entity.data || {}) as {
    name?: string;
    summary?: string;
    description?: string;
    sections?: DynamicSection[];
    category?: string;
    metadata?: { fda_approval_year?: number };
  };

  const title = entity.name || data.name || "";
  const summary: string | undefined = data.summary;
  const description: string | undefined = data.description;
  const sections: DynamicSection[] = data.sections || [];
  const category: string | undefined = data.category;
  const metadata = data.metadata || (entity.data as any)?.metadata || {};
  const fdaApprovalYear = metadata.fda_approval_year;

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
    };
    return iconMap[type] || Info;
  };

  const formatSectionTitle = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderSectionContent = (sectionData: any, type: string): React.ReactNode => {
    // All rendering logic from original page.tsx
    if (sectionData.text) {
      return <ParsedContent content={sectionData.text} className="text-neutral-800" />;
    }

    if (sectionData.items && Array.isArray(sectionData.items)) {
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

      if (type === "indications") {
        return <Indications indications={sectionData.items} />;
      }

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

    return (
      <pre className="overflow-auto rounded bg-neutral-100 p-4 text-sm text-neutral-900">
        {JSON.stringify(sectionData, null, 2)}
      </pre>
    );
  };

  const renderSection = (section: DynamicSection) => {
    const { type, ...sectionData } = section;
    const Icon = getIconForSectionType(type);
    const title = formatSectionTitle(type);
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

  const displayCategory = null;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {displayCategory && (
                  <Badge variant={treatmentType as any} size="md">
                    {displayCategory}
                  </Badge>
                )}
                {(entity as any)?.metadata?.medical_review?.reviewed && (
                  <MedicalReviewBadge reviewInfo={(entity as any).metadata.medical_review} compact />
                )}
              </div>
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

        {/* Author & Review Information */}
        {(() => {
          const metadata = (entity as any)?.metadata || {};
          const author = metadata.author;
          const medicalReviewer = metadata.medical_reviewer;
          const timestamps = {
            published_date: metadata.published_date || (entity as any)?.created_at,
            last_updated: metadata.last_updated || (entity as any)?.updated_at,
            last_reviewed: metadata.medical_review?.review_date,
          };

          return (author || medicalReviewer || timestamps.published_date) ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-8"
            >
              <div className="space-y-4">
                {(author || medicalReviewer) && (
                  <AuthorByline
                    author={author}
                    medicalReviewer={medicalReviewer}
                    publishedDate={timestamps.published_date}
                    lastUpdated={timestamps.last_updated}
                  />
                )}
                {!author && !medicalReviewer && timestamps.published_date && (
                  <ContentTimestamps timestamps={timestamps} />
                )}
              </div>
            </motion.div>
          ) : null;
        })()}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {sections.map(renderSection)}
        </motion.div>

        {/* Conditions Treated Links */}
        {pageLinks.linksBySlot.related_conditions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8"
          >
            <RelatedConditionsSection
              links={pageLinks.linksBySlot.related_conditions}
              title="Conditions Treated"
            />
          </motion.div>
        )}

        {/* Related Treatments Links */}
        {pageLinks.linksBySlot.treatment_options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
            className="mt-8"
          >
            <TreatmentOptionsSection
              links={pageLinks.linksBySlot.treatment_options}
              title="Related Treatments"
              description="Alternative and complementary treatment approaches"
            />
          </motion.div>
        )}

        {/* Assessment Tools Links */}
        {pageLinks.linksBySlot.screening_tools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.19 }}
            className="mt-8"
          >
            <AssessmentCTASection
              links={pageLinks.linksBySlot.screening_tools}
              title="Assessment Tools"
              description="Evaluate symptoms and track progress"
            />
          </motion.div>
        )}

        {/* Related Resources Links */}
        {pageLinks.linksBySlot.related_articles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.21 }}
            className="mt-8"
          >
            <RelatedArticlesSection
              links={pageLinks.linksBySlot.related_articles}
              title="Related Resources"
            />
          </motion.div>
        )}

        {/* Citations/References */}
        {(() => {
          const references = data.sections?.find((s: any) => s.type === 'references')?.references ||
            (entity as any)?.metadata?.references;
          return references && references.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.23 }}
              className="mt-8"
            >
              <CitationList citations={references} title="Scientific References" />
            </motion.div>
          ) : null;
        })()}

        {/* Medical Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-8"
        >
          <MedicalDisclaimer
            config={{
              entity_type: treatmentType === 'medication' ? 'medication' :
                         treatmentType === 'therapy' ? 'therapy' : 'treatment',
              prominent: false,
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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

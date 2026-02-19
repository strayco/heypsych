"use client";

// CLIENT WRAPPER - Handles interactive features
// Data is passed from server component (already fetched)

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ParsedContent, Indications, ParsedLinkList } from "@/components/ui/parsed-content";
import { CollapsibleContent } from "@/components/ui/collapsible-button";
import { FastFacts } from "@/components/ui/fast-facts";
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
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
} from "lucide-react";
import { Entity } from "@/lib/types/database";
import {
  AuthorByline,
  MedicalDisclaimer,
  CitationList,
} from "@/components/eat";
import { StatCard } from "@/components/ui/stat-card";
import { QuoteCarousel } from "@/components/ui/quote-carousel";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Timeline } from "@/components/ui/timeline";
import type { UIHints } from "@/lib/ui/apple-design-system";
import { getSectionUIHints, getSectionLayout } from "@/lib/content/section-registry";

type DynamicSection = {
  type: string;
  [key: string]: any;
};

interface TreatmentClientWrapperProps {
  entity: Entity;
}

export default function TreatmentClientWrapper({ entity }: TreatmentClientWrapperProps) {
  const data = (entity.data || {}) as {
    name?: string;
    summary?: string;
    description?: string;
    patient_summary?: string;
    sections?: DynamicSection[];
    category?: string;
    metadata?: { fda_approval_year?: number };
    clinical_metadata?: any;
    faqs?: Array<{ q: string; a: string }>;
  };

  const title = entity.name || data.name || "";
  const summary: string | undefined = data.summary;
  const description: string | undefined = data.description;
  const patientSummary: string | undefined = data.patient_summary;
  const sections: DynamicSection[] = data.sections || [];

  // Global expand/collapse state for all sections
  const [expandAll, setExpandAll] = React.useState<boolean | null>(null);
  
  // Debug: Log section order at runtime (client-side only to avoid hydration issues)
  React.useEffect(() => {
    if (entity.slug === "alprazolam-xanax") {
      console.log("[XANAX ENTITY PAYLOAD]", JSON.parse(JSON.stringify(entity)));
      console.log(
        "[XANAX SECTIONS RUNTIME ORDER]",
        sections.map((s: any, idx: number) => `${idx}: ${s.type} – ${s.heading || 'no heading'}`)
      );
      console.log("[XANAX ENTITY NAME]", entity.name);
      console.log("[XANAX ENTITY SLUG]", entity.slug);
      console.log("[XANAX DATA SOURCE]", entity.metadata?.source || "database");
      
      // Also log the final render order after DOM is ready
      setTimeout(() => {
        const renderedSections = Array.from(document.querySelectorAll('section[id], h2[id]')).map((el, idx) => `${idx}: ${el.id}`);
        console.log("[XANAX FINAL RENDER ORDER]", renderedSections);
      }, 100);
    }
  }, [entity.slug, sections, entity.metadata, data.patient_summary]);
  
  const category: string | undefined = data.category;
  const metadata = data.metadata || entity.data?.metadata || {};
  const fdaApprovalYear = metadata.fda_approval_year;
  const faqs = data.faqs || [];

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
      efficacy: Target,
    };
    return iconMap[type] || Info;
  };

  const formatSectionTitle = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Generate semantic section ID from heading or type
  // Prioritizes heading-based slug for SEO-friendly URLs, falls back to type
  // Strips emojis, collapses multiple hyphens, ensures lowercase
  const getSectionId = (type: string, heading?: string): string => {
    if (heading) {
      // Convert heading to URL-friendly slug
      return heading
        .toLowerCase()
        // Remove all emojis and non-ASCII symbols (more comprehensive)
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Emojis
        .replace(/[\u{1F600}-\u{1F64F}]/gu, "") // Emoticons
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") // Transport & Map
        .replace(/[\u{2600}-\u{26FF}]/gu, "") // Misc symbols
        .replace(/[\u{2700}-\u{27BF}]/gu, "") // Dingbats
        .replace(/[\u{2000}-\u{206F}]/gu, "") // General punctuation
        .replace(/[^\x00-\x7F]/g, "") // Remove any other non-ASCII
        // Replace non-alphanumeric with hyphens (including spaces, punctuation, etc.)
        .replace(/[^a-z0-9]+/g, "-")
        // Collapse multiple hyphens into single hyphen
        .replace(/-+/g, "-")
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, "");
    }
    // Fallback to type-based ID
    return type.toLowerCase().replace(/_/g, "-");
  };

  // Helper: Check if two text strings are nearly identical (redundancy control)
  const isNearDuplicate = (text1: string, text2: string, threshold: number = 0.7): boolean => {
    if (!text1 || !text2) return false;
    // Normalize: lowercase, remove punctuation, split into words
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3) // Only consider words > 3 chars
        .join(" ");
    const norm1 = normalize(text1);
    const norm2 = normalize(text2);
    // Simple word overlap check
    const words1 = new Set(norm1.split(" "));
    const words2 = new Set(norm2.split(" "));
    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    const similarity = intersection.size / union.size;
    return similarity >= threshold;
  };

  // Helper: Determine if a section should be expanded by default
  const shouldSectionBeExpandedByDefault = (sectionType: string): boolean => {
    // Only these sections are expanded by default per v2 requirements
    return ["indications", "patient_experience", "onset_duration"].includes(sectionType);
  };

  // Helper to render patient-friendly text block
  const renderPatientText = (patientText: string | undefined) => {
    if (!patientText) return null;
    return (
      <div className="mt-4 rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
        <p className="text-sm font-medium uppercase tracking-wide text-green-700 mb-1">
          Patient-Friendly Explanation
        </p>
        <ParsedContent content={patientText} className="text-neutral-800" />
      </div>
    );
  };

  const renderSectionContent = (sectionData: any, type: string): React.ReactNode => {
    // Extract ux_display mode (default to "fully_visible")
    const uxDisplay = sectionData.ux_display || "fully_visible";

    // Get ui_hints: from JSON (legacy) or from section registry (v2)
    const uiHints: UIHints | undefined = getSectionUIHints(type, sectionData);

    // APPLE VISUAL SYSTEM: Route to enhanced components based on ui_hints.layout
    // ========================================================================

    // Patient Experience: Quote Carousel
    if (uiHints?.layout === "quote_carousel" && type === "patient_experience") {
      const quotes = sectionData.items?.flatMap((item: any) =>
        item.quotes?.map((quote: string) => ({
          text: quote,
          category: item.category
        })) || []
      ) || [];

      return (
        <QuoteCarousel
          quotes={quotes}
          intro={sectionData.intro}
          uiHints={uiHints}
        />
      );
    }

    // Efficacy: Stat Card with animated numbers
    if (uiHints?.layout === "stat_card" && type === "efficacy") {
      const clinicalEfficacy = (data.clinical_metadata as any)?.efficacy_response;
      const efficacyValue = sectionData.value || clinicalEfficacy?.percentage_value;
      const efficacyComparison = sectionData.comparison || clinicalEfficacy?.comparison_data?.replace(/with\s+/i, "").trim();
      const efficacyMetric = sectionData.metric || clinicalEfficacy?.metric;

      // Extract NNT from patient_text (e.g., "NNT=5")
      const nntMatch = sectionData.patient_text?.match(/NNT[=\s]+(\d+)/i);
      const nnt = nntMatch ? parseInt(nntMatch[1]) : undefined;

      if (efficacyValue) {
        return (
          <StatCard
            metric={efficacyMetric}
            value={efficacyValue}
            comparison={efficacyComparison}
            nnt={nnt}
            description={sectionData.text}
            clinicalDetails={sectionData.clinical_details}
            citation={sectionData.citation}
            uiHints={uiHints}
          />
        );
      }
    }

    // Warnings: Alert Banner
    if (uiHints?.layout === "alert_banner" && type === "warnings") {
      return (
        <AlertBanner
          title={sectionData.heading || "Critical Safety Information"}
          message={sectionData.highlight || sectionData.black_box || ""}
          items={sectionData.patient_counseling || sectionData.other}
          severity={sectionData.black_box ? "critical" : "warning"}
          uiHints={uiHints}
        />
      );
    }

    // Onset/Duration: Timeline
    if (uiHints?.layout === "timeline" && type === "onset_duration") {
      // Parse key_points into timeline items
      const timelineItems = sectionData.key_points?.map((point: string) => {
        // Try to extract time from point (e.g., "30-60 minutes: Initial effects")
        const match = point.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          return {
            time: match[1].trim(),
            label: match[2].trim(),
            description: ""
          };
        }
        return {
          time: "",
          label: point,
          description: ""
        };
      }) || [];

      if (timelineItems.length > 0) {
        return (
          <Timeline
            items={timelineItems}
            intro={sectionData.text}
            uiHints={uiHints}
          />
        );
      }
    }

    // LEGACY RENDERING: Fall back to existing logic if no ui_hints match
    // ===================================================================

    // Handle efficacy section with comparison data and citation
    // Check both section data and clinical_metadata for efficacy data
    const clinicalEfficacy = (data.clinical_metadata as any)?.efficacy_response;
    const hasEfficacyData = sectionData.value || sectionData.metric || clinicalEfficacy?.percentage_value;
    
    if (type === "efficacy" && hasEfficacyData) {
      // Merge section data with clinical_metadata if needed
      const efficacyValue = sectionData.value || clinicalEfficacy?.percentage_value;
      const efficacyMetric = sectionData.metric || clinicalEfficacy?.metric;
      const efficacyComparison = sectionData.comparison || clinicalEfficacy?.comparison_data?.replace(/with\s+/i, "").trim();
      const efficacyText = sectionData.text || "";
      const efficacyPatientText = sectionData.patient_text || clinicalEfficacy?.patient_text;
      const efficacyCitation = sectionData.citation;
      // patient_text_only mode: Show patient text first, then clinical details
      if (uxDisplay === "patient_text_only") {
        return (
          <div className="space-y-6">
            {/* Enhanced Efficacy Stat Card (Hero Element) - only show if we have value */}
            {efficacyValue && (
              <div className="rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-6 sm:p-8 shadow-lg">
                <div className="text-center sm:text-left">
                  {efficacyMetric && (
                    <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-green-700 mb-2">
                      {efficacyMetric}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 justify-center sm:justify-start">
                    <span className="text-5xl sm:text-6xl font-bold text-green-800 leading-none">
                      {efficacyValue}
                    </span>
                    {efficacyComparison && (
                      <span className="text-base sm:text-lg text-neutral-600 font-medium">
                        vs {efficacyComparison}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Patient-friendly explanation */}
            {efficacyPatientText && (
              <div className="text-base sm:text-lg text-neutral-800 leading-relaxed">
                <ParsedContent content={efficacyPatientText} />
              </div>
            )}

            {/* Clinical details (always visible) */}
            {efficacyText && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <ParsedContent content={efficacyText} className="text-neutral-800" />
                {efficacyCitation && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-neutral-500 border-t border-neutral-200 pt-4">
                    <Book className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Source:{" "}
                      <a
                        href={efficacyCitation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {efficacyCitation.label}
                      </a>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // fully_visible mode: Show everything with enhanced stat card
      return (
        <div className="space-y-6">
          {/* Enhanced Efficacy Stat Card (Hero Element) - only show if we have value */}
          {efficacyValue && (
            <div className="rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-6 sm:p-8 shadow-lg">
              <div className="text-center sm:text-left">
                {efficacyMetric && (
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-green-700 mb-2">
                    {efficacyMetric}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 justify-center sm:justify-start">
                  <span className="text-5xl sm:text-6xl font-bold text-green-800 leading-none">
                    {efficacyValue}
                  </span>
                  {efficacyComparison && (
                    <span className="text-base sm:text-lg text-neutral-600 font-medium">
                      vs {efficacyComparison}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Patient-friendly explanation */}
          {efficacyPatientText && (
            <div className="text-base sm:text-lg text-neutral-800 leading-relaxed">
              <ParsedContent content={efficacyPatientText} />
            </div>
          )}

          {/* Clinical text */}
          {efficacyText && (
            <ParsedContent content={efficacyText} className="text-neutral-800" />
          )}

          {/* Citation displayed inline */}
          {efficacyCitation && (
            <div className="mt-3 flex items-start gap-2 text-sm text-neutral-500 border-t border-neutral-200 pt-4">
              <Book className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Source:{" "}
                <a
                  href={efficacyCitation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {efficacyCitation.label}
                </a>
              </span>
            </div>
          )}
        </div>
      );
    }

    // Handle adverse_effects with incidence rates (new structure)
    if (type === "adverse_effects" && sectionData.common && Array.isArray(sectionData.common)) {
      const hasIncidenceData = sectionData.common[0]?.incidence;
      const CollapsibleAdverseEffects = () => {
        const renderEffectList = (effects: any[]) => (
          <div className="space-y-2">
            {effects.map((effect: any, i: number) => (
              <div key={i} className="flex items-start gap-2">
                {hasIncidenceData ? (
                  <>
                    <span className="inline-flex min-w-[3.5rem] items-center justify-center rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-bold text-yellow-800">
                      {effect.incidence}
                    </span>
                    <div className="flex-1">
                      <span className="font-medium text-neutral-900">{effect.symptom}</span>
                      {effect.patient_note && (
                        <span className="ml-2 text-sm text-neutral-600">
                          — <ParsedContent content={effect.patient_note} className="inline" />
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-neutral-800">• {typeof effect === 'string' ? effect : effect.symptom}</span>
                )}
              </div>
            ))}
          </div>
        );

        return (
          <div className="space-y-4">
            {/* Summary text if provided */}
            {sectionData.summary && (
              <p className="text-neutral-800"><ParsedContent content={sectionData.summary} /></p>
            )}

            {/* Plain language list if provided */}
            {sectionData.plain_language_list && Array.isArray(sectionData.plain_language_list) && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-800">Common Things People Notice</h3>
                <ul className="list-disc space-y-1 pl-4 text-neutral-800">
                  {sectionData.plain_language_list.map((item: string, i: number) => (
                    <li key={i}><ParsedContent content={item} /></li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common side effects - show all */}
            {sectionData.common && sectionData.common.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 sm:p-4">
                <h3 className="mb-2 sm:mb-3 font-semibold text-yellow-800 text-base sm:text-lg">Common Side Effects</h3>
                {renderEffectList(sectionData.common)}
              </div>
            )}

            {/* Serious side effects */}
            {sectionData.serious && sectionData.serious.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4">
                <h3 className="mb-2 sm:mb-3 font-semibold text-red-800 text-base sm:text-lg">⚠️ Serious Side Effects</h3>
                <ul className="list-disc space-y-1 pl-4 text-neutral-800">
                  {sectionData.serious.map((effect: any, i: number) => (
                    <li key={i}>
                      <ParsedContent content={typeof effect === 'string' ? effect : effect.symptom || effect} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sectionData.patient_text && renderPatientText(sectionData.patient_text)}
          </div>
        );
      };

      // symptom_only mode: Show only symptom names, no incidence or patient notes
      if (uxDisplay === "symptom_only") {
        return (
          <div className="space-y-4">
            {sectionData.common && sectionData.common.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <h3 className="mb-3 font-semibold text-yellow-800">Common Side Effects</h3>
                <ul className="list-disc space-y-1 pl-4 text-neutral-800">
                  {sectionData.common.map((effect: any, i: number) => (
                    <li key={i}>
                      {typeof effect === 'string' ? effect : effect.symptom}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sectionData.serious && sectionData.serious.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="mb-3 font-semibold text-red-800">⚠️ Serious Side Effects</h3>
                <ul className="list-disc space-y-1 pl-4 text-neutral-800">
                  {sectionData.serious.map((effect: any, i: number) => (
                    <li key={i}>
                      {typeof effect === 'string' ? effect : effect.symptom || effect}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      return <CollapsibleAdverseEffects />;
    }

    // Handle warnings with patient_counseling
    if (type === "warnings" && (sectionData.other || sectionData.patient_counseling || sectionData.black_box || sectionData.highlight)) {
      const WarningsContent = () => {
        return (
          <div className="space-y-4">
            {sectionData.highlight && (
              <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
                <p className="text-neutral-800 font-medium"><ParsedContent content={sectionData.highlight} /></p>
              </div>
            )}

            {sectionData.black_box && (
              <div className="rounded-lg border-2 border-black bg-black p-4 text-white">
                <h3 className="mb-2 font-bold">⚠️ BLACK BOX WARNING</h3>
                <ParsedContent content={sectionData.black_box} className="text-white" />
              </div>
            )}

            {sectionData.other && sectionData.other.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-neutral-900">Clinical Warnings</h3>
                <ul className="list-disc space-y-1 pl-6 text-neutral-800">
                  {sectionData.other.map((warning: string, i: number) => (
                    <li key={i}><ParsedContent content={warning} /></li>
                  ))}
                </ul>
              </div>
            )}
            
            {sectionData.patient_counseling && sectionData.patient_counseling.length > 0 && (
              <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
                <h3 className="mb-2 font-semibold text-amber-800">Key Patient Counseling Points</h3>
                <ul className="space-y-2">
                  {sectionData.patient_counseling.map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 text-amber-600">→</span>
                      <ParsedContent content={point} className="text-neutral-800" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      };

      return <WarningsContent />;
    }

    // Handle onset_duration section
    if (type === "onset_duration") {
      return (
        <div className="space-y-4">
          {sectionData.text && (
            <ParsedContent content={sectionData.text} className="text-neutral-800" />
          )}
          {sectionData.key_points && Array.isArray(sectionData.key_points) && (
            <ul className="list-disc space-y-2 pl-6 text-neutral-800">
              {sectionData.key_points.map((point: string, i: number) => (
                <li key={i}><ParsedContent content={point} /></li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // Handle tapering section
    if (type === "tapering") {
      return (
        <div className="space-y-4">
          {sectionData.text && (
            <ParsedContent content={sectionData.text} className="text-neutral-800" />
          )}
          {sectionData.patient_text && renderPatientText(sectionData.patient_text)}

          {sectionData.key_points && Array.isArray(sectionData.key_points) && (
            <div>
              <h3 className="mb-2 font-semibold text-neutral-900">Key Points</h3>
              <ul className="list-disc space-y-2 pl-6 text-neutral-800">
                {sectionData.key_points.map((point: string, i: number) => (
                  <li key={i}><ParsedContent content={point} /></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Handle special_populations section
    if (type === "special_populations") {
      return (
        <div className="space-y-4">
          {/* Patient-friendly summary text */}
          {sectionData.text && (
            <ParsedContent content={sectionData.text} className="text-neutral-800" />
          )}

          {/* All special population details - always visible */}
          <div className="space-y-4">
            {sectionData.pregnancy && (
              <div className="rounded-lg bg-white p-3 border border-neutral-200">
                <h4 className="mb-2 font-semibold text-neutral-900 flex items-center gap-2">
                  <span className="text-amber-600">👶</span>
                  Pregnancy
                </h4>
                <ParsedContent content={sectionData.pregnancy} className="text-sm text-neutral-800" />
              </div>
            )}
            {sectionData.lactation && (
              <div className="rounded-lg bg-white p-3 border border-neutral-200">
                <h4 className="mb-2 font-semibold text-neutral-900 flex items-center gap-2">
                  <span className="text-blue-600">🤱</span>
                  Breastfeeding
                </h4>
                <ParsedContent content={sectionData.lactation} className="text-sm text-neutral-800" />
              </div>
            )}
            {sectionData.pediatrics && (
              <div className="rounded-lg bg-white p-3 border border-neutral-200">
                <h4 className="mb-2 font-semibold text-neutral-900 flex items-center gap-2">
                  <span className="text-purple-600">👧</span>
                  Children & Adolescents (Under 18)
                </h4>
                <ParsedContent content={sectionData.pediatrics} className="text-sm text-neutral-800" />
              </div>
            )}
            {sectionData.geriatrics && (
              <div className="rounded-lg bg-white p-3 border border-neutral-200">
                <h4 className="mb-2 font-semibold text-neutral-900 flex items-center gap-2">
                  <span className="text-green-600">👴</span>
                  Older Adults (65+)
                </h4>
                <ParsedContent content={sectionData.geriatrics} className="text-sm text-neutral-800" />
              </div>
            )}
            {sectionData.hepatic && (
              <div className="rounded-lg bg-white p-3 border border-neutral-200">
                <h4 className="mb-2 font-semibold text-neutral-900 flex items-center gap-2">
                  <span className="text-orange-600">🔬</span>
                  Liver Impairment
                </h4>
                <ParsedContent content={sectionData.hepatic} className="text-sm text-neutral-800" />
              </div>
            )}
            {sectionData.renal && (
              <div className="rounded-lg bg-white p-3 border border-neutral-200">
                <h4 className="mb-2 font-semibold text-neutral-900 flex items-center gap-2">
                  <span className="text-blue-600">💧</span>
                  Kidney Impairment
                </h4>
                <ParsedContent content={sectionData.renal} className="text-sm text-neutral-800" />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Handle dosage_forms section
    if (type === "dosage_forms") {
      return (
        <div className="space-y-4">
          {sectionData.items && Array.isArray(sectionData.items) && (
            <ul className="list-disc space-y-2 pl-6 text-neutral-800">
              {sectionData.items.map((item: string, i: number) => (
                <li key={i}><ParsedContent content={item} /></li>
              ))}
            </ul>
          )}
          {sectionData.patient_note && (
            <div className="mt-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
              <p className="text-neutral-800"><ParsedContent content={sectionData.patient_note} /></p>
            </div>
          )}
        </div>
      );
    }

    // Handle clinical_notes section
    if (type === "clinical_notes") {
      return (
        <div className="space-y-4">
          {sectionData.items && Array.isArray(sectionData.items) && (
            <ul className="list-disc space-y-2 pl-6 text-neutral-800">
              {sectionData.items.map((item: string, i: number) => (
                <li key={i}><ParsedContent content={item} /></li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // Handle monitoring section
    if (type === "monitoring") {
      return (
        <div className="space-y-4">
          {sectionData.items && Array.isArray(sectionData.items) && (
            <ul className="list-disc space-y-2 pl-6 text-neutral-800">
              {sectionData.items.map((item: string, i: number) => (
                <li key={i}><ParsedContent content={item} /></li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // Handle dosing with renal/hepatic adjustments
    if (type === "dosing" && (sectionData.adult || sectionData.renal_adjustments || sectionData.patient_text || sectionData.text)) {
      // patient_text_only mode: Show patient text first, then all clinical details
      const patientText = sectionData.patient_text || sectionData.text;
      if (uxDisplay === "patient_text_only" && patientText) {
        const hasClinicalDetails = sectionData.adult || sectionData.renal_adjustments || sectionData.hepatic_adjustments;

        return (
          <div className="space-y-4">
            {/* Patient-friendly text */}
            {renderPatientText(patientText)}

            {/* Clinical dosing details (always visible) */}
            {hasClinicalDetails && (
              <div className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                {sectionData.adult && (
                  <div>
                    <h3 className="mb-2 font-semibold text-neutral-900">Adult Dosing</h3>
                    <div className="rounded-lg bg-white p-3 space-y-2">
                      {Object.entries(sectionData.adult).map(([key, value]) => (
                        <p key={key} className="text-neutral-900 text-sm">
                          <span className="font-medium capitalize">
                            {key.replace(/_/g, " ")}:
                          </span>{" "}
                          {String(value)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {sectionData.renal_adjustments && (
                  <div>
                    <h3 className="mb-2 font-semibold text-neutral-900">Renal Dose Adjustments</h3>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-neutral-900">
                        <span className="font-medium">{sectionData.renal_adjustments.condition}:</span>{" "}
                        {sectionData.renal_adjustments.dose}
                      </p>
                      {sectionData.renal_adjustments.patient_note && (
                        <p className="text-sm text-neutral-600 mt-2">{sectionData.renal_adjustments.patient_note}</p>
                      )}
                    </div>
                  </div>
                )}

                {sectionData.hepatic_adjustments && (
                  <div>
                    <h3 className="mb-2 font-semibold text-neutral-900">Hepatic Dose Adjustments</h3>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-neutral-900">
                        <span className="font-medium">{sectionData.hepatic_adjustments.condition}:</span>{" "}
                        {sectionData.hepatic_adjustments.dose}
                      </p>
                      {sectionData.hepatic_adjustments.patient_note && (
                        <p className="text-sm text-neutral-600 mt-2">{sectionData.hepatic_adjustments.patient_note}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // fully_visible mode: Show all dosing details
      return (
        <div className="space-y-4">
          {sectionData.adult && typeof sectionData.adult === 'object' && (
            <div>
              <h3 className="mb-2 font-semibold text-neutral-900">Adult Dosing</h3>
              <div className="rounded-lg bg-neutral-50 p-3 space-y-2">
                {Object.entries(sectionData.adult).map(([key, value]: [string, any]) => (
                  <p key={key} className="text-neutral-900">
                    <span className="font-medium capitalize">
                      {key.replace(/_/g, " ")}:
                    </span>{" "}
                    {String(value)}
                  </p>
                ))}
              </div>
            </div>
          )}

          {sectionData.renal_adjustments && sectionData.renal_adjustments.length > 0 && (
                      <div>
                        <h3 className="mb-2 font-semibold text-neutral-900">Renal Dose Adjustments</h3>
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">Condition</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">Dose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {sectionData.renal_adjustments.map((adj: any, i: number) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-sm text-neutral-800">{adj.condition}</td>
                        <td className="px-4 py-2 text-sm font-medium text-neutral-900">{adj.dose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {sectionData.hepatic_adjustments && (
                      <div>
                        <h3 className="mb-2 font-semibold text-neutral-900">Hepatic Dose Adjustments</h3>
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-neutral-900">
                  <span className="font-medium">{sectionData.hepatic_adjustments.condition}:</span>{" "}
                  {sectionData.hepatic_adjustments.dose}
                </p>
              </div>
            </div>
          )}

          {sectionData.patient_text && renderPatientText(sectionData.patient_text)}

          {sectionData.simple_explanation && (
            <div className="mt-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
              <p className="text-sm font-medium uppercase tracking-wide text-blue-700 mb-1">
                Simple Explanation
              </p>
              <ParsedContent content={sectionData.simple_explanation} className="text-neutral-800" />
            </div>
          )}
        </div>
      );
    }

    // All rendering logic from original page.tsx
    // IMPORTANT: Skip generic text handler for types with custom renderers (indications, etc.)
    if (sectionData.text && type !== "indications") {
      // patient_text_only mode: Show patient text first, then technical details
      if (uxDisplay === "patient_text_only" && sectionData.patient_text) {
        return (
          <div className="space-y-4">
            {/* Patient-friendly text */}
            {renderPatientText(sectionData.patient_text)}

            {/* Technical details (always visible) */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <ParsedContent content={sectionData.text} className="text-neutral-800" />
            </div>
          </div>
        );
      }

      // fully_visible mode: Show both clinical and patient text
      return (
        <>
          <ParsedContent content={sectionData.text} className="text-neutral-800" />
          {sectionData.patient_text && renderPatientText(sectionData.patient_text)}
        </>
      );
    }

    if (sectionData.items && Array.isArray(sectionData.items)) {
      // Handle patient_experience section with quotes
      if (type === "patient_experience" && sectionData.items[0]?.category) {
        return (
          <div className="space-y-6">
            {sectionData.intro && (
              <p className="text-neutral-800 mb-4"><ParsedContent content={sectionData.intro} /></p>
            )}
            {sectionData.items.map((item: any, i: number) => (
              <div key={i} className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-3 font-semibold text-blue-900">{item.category}</h3>
                {item.quotes && item.quotes.length > 0 && (
                  <div className="space-y-3 mb-3">
                    {item.quotes.map((quote: string, qi: number) => (
                      <div key={qi} className="border-l-4 border-blue-400 pl-4 italic text-neutral-700">
                        {quote}
                      </div>
                    ))}
                  </div>
                )}
                {item.note && (
                  <p className="text-sm text-blue-800 bg-blue-100 rounded p-2 mt-3">
                    <span className="font-semibold">Note:</span> {item.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      }

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
            {sectionData.intro && (
              <p className="text-neutral-800"><ParsedContent content={sectionData.intro} /></p>
            )}
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
        return (
          <>
            {sectionData.text && (
              <div className="mb-4 text-neutral-800">
                <ParsedContent content={sectionData.text} />
              </div>
            )}
            <Indications indications={sectionData.items} />
            {sectionData.off_label && sectionData.off_label.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-neutral-600 mb-2">Off-Label Uses</h3>
                <div className="flex flex-wrap gap-2">
                  {sectionData.off_label.map((item: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700"
                    >
                      <ParsedContent content={item} />
                    </span>
                  ))}
                </div>
              </div>
            )}
            {sectionData.patient_text && renderPatientText(sectionData.patient_text)}
          </>
        );
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
              <h3 className="mb-2 font-semibold text-neutral-900">Preparation</h3>
              <ParsedContent content={sectionData.preparation} className="text-neutral-800" />
            </div>
          )}
          {sectionData.procedure && Array.isArray(sectionData.procedure) && (
            <div>
              <h3 className="mb-2 font-semibold text-neutral-900">Procedure</h3>
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
              <h3 className="mb-2 font-semibold text-green-700">Immediate</h3>
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
              <h3 className="mb-2 font-semibold text-blue-700">Short Term</h3>
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
              <h3 className="mb-2 font-semibold text-purple-700">Long Term</h3>
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
            // Skip null and undefined values
            if (value === null || value === undefined) {
              return null;
            }
            if (Array.isArray(value)) {
              return (
                <div key={key}>
                  <h3 className="mb-2 font-semibold text-neutral-900 capitalize">
                    {key.replace(/_/g, " ")}
                  </h3>
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
                  <h3 className="mb-2 font-semibold text-neutral-900 capitalize">
                    {key.replace(/_/g, " ")}
                  </h3>
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
    const { type, heading, ux_display, collapsible, ...sectionData } = section;
    const Icon = getIconForSectionType(type);
    // Use custom heading from JSON if available, otherwise auto-generate from type
    const title = heading || formatSectionTitle(type);
    const sectionId = getSectionId(type, heading);

    // v2 Collapse Strategy: Only indications, patient_experience, onset_duration expanded by default
    const shouldBeExpandedByDefault = shouldSectionBeExpandedByDefault(type);
    const [isExpanded, setIsExpanded] = React.useState(shouldBeExpandedByDefault);

    // If section has collapsible: false, always show it expanded
    const isAlwaysExpanded = collapsible === false;

    // Apply global expand/collapse state when triggered
    // expandAll: null = individual control, true = force expand, false = force collapse
    const effectiveIsExpanded = isAlwaysExpanded
      ? true
      : expandAll !== null
        ? expandAll
        : isExpanded;

    // Only wrap in collapsible if it shouldn't be expanded by default AND collapsible is not false
    const needsCollapsibleWrapper = !shouldBeExpandedByDefault && collapsible !== false;

    return (
      <Card key={type} className="mt-4 sm:mt-6">
        <CardHeader
          className={`pb-3 sm:pb-4 ${needsCollapsibleWrapper ? 'cursor-pointer hover:bg-neutral-50 transition-colors' : ''}`}
          onClick={needsCollapsibleWrapper ? () => {
            // Reset global expand state to allow individual control
            setExpandAll(null);
            setIsExpanded(!isExpanded);
          } : undefined}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id={sectionId} className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-neutral-900 scroll-mt-20 sm:scroll-mt-24 leading-tight flex-1">
              <Icon className="h-5 w-5 shrink-0" />
              {title}
            </h2>
            {needsCollapsibleWrapper && (
              <div className="shrink-0">
                {effectiveIsExpanded ? (
                  <ChevronUp className="h-5 w-5 text-neutral-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-neutral-600" />
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {needsCollapsibleWrapper ? (
            <CollapsibleContent isExpanded={effectiveIsExpanded}>
              {renderSectionContent({ ...sectionData, ux_display, collapsible, heading }, type)}
            </CollapsibleContent>
          ) : (
            renderSectionContent({ ...sectionData, ux_display, collapsible, heading }, type)
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <main className="min-h-screen bg-white" itemScope itemType="https://schema.org/MedicalWebPage">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight" itemProp="name headline">{title}</h1>
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

              {/* Author & Medical Review - Minimal for E-A-T/SEO */}
              {(() => {
                const entityMetadata = entity.metadata || {};
                const editorial = entity.editorial || {};

                const timestamps = {
                  published_date: editorial.dates?.published || entityMetadata.published_date || entity.created_at,
                  last_updated: editorial.dates?.lastUpdated || entityMetadata.last_updated || entity.updated_at,
                  last_reviewed: editorial.dates?.lastMedicallyReviewed || entityMetadata.medical_review?.review_date || entity.updated_at,
                };

                const formatDate = (date: string | undefined) => {
                  if (!date) return '';
                  return new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                };

                return (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-semibold text-neutral-900 leading-snug">
                          Reviewed by the{' '}
                          <Link
                            href="/about/medical-review-board"
                            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                          >
                            HeyPsych Medical Review Board
                          </Link>
                        </p>
                        <p className="text-xs text-neutral-600 leading-relaxed">
                          Board-certified psychiatrists and mental health professionals
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 pt-1.5 border-t border-blue-100/50">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {timestamps.published_date && (
                              <span className="whitespace-nowrap">Published {formatDate(timestamps.published_date)}</span>
                            )}
                            {timestamps.last_updated && (
                              <>
                                <span className="text-neutral-300">•</span>
                                <span className="whitespace-nowrap">Updated {formatDate(timestamps.last_updated)}</span>
                              </>
                            )}
                            {timestamps.last_reviewed && (
                              <>
                                <span className="text-neutral-300">•</span>
                                <span className="whitespace-nowrap">Reviewed {formatDate(timestamps.last_reviewed)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Patient-friendly summary */}
              {patientSummary && (
                <article itemProp="abstract description" className="mt-3 sm:mt-4 text-base sm:text-lg text-neutral-800 leading-relaxed max-w-3xl">
                  <p>
                    <strong>Clinical summary for {title}:</strong> <ParsedContent content={patientSummary} />
                  </p>
                </article>
              )}
            </div>
          </div>
        </motion.div>

        {/* Floating Expand All / Collapse All Button */}
        {sections.some((s) => s.collapsible !== false && !shouldSectionBeExpandedByDefault(s.type)) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => setExpandAll((prev) => (prev === true ? false : true))}
              className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-6 h-auto"
              title={expandAll === true ? "Collapse all sections" : "Expand all sections"}
            >
              {expandAll === true ? (
                <>
                  <ChevronsUp className="h-5 w-5" />
                  <span className="hidden sm:inline">Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronsDown className="h-5 w-5" />
                  <span className="hidden sm:inline">Expand All</span>
                </>
              )}
            </Button>
          </motion.div>
        )}

        <section itemProp="mainEntityOfPage">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 sm:space-y-6"
          >
            {sections.filter(s => s.type !== 'references').map(renderSection)}
          </motion.div>
        </section>

        {/* FAQs */}
        {faqs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                      <h4 className="font-semibold text-neutral-900 mb-2">{faq.q}</h4>
                      <p className="text-neutral-700">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Citations/References */}
        {(() => {
          const references = data.sections?.find((s: any) => s.type === 'references')?.references ||
            entity.metadata?.references;
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
              <div className="flex justify-center">
                <Link
                  href="/psychiatrists"
                  className="inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg h-14 px-8 text-lg"
                >
                  Locate Psychiatrists
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

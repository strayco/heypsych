"use client";

/**
 * Unified Treatment Comparison Component
 *
 * A single, cohesive comparison experience with:
 * - One unified container with consistent column system
 * - Sticky treatment headers
 * - Section navigation with scroll-spy
 * - Segmented controls for filters
 * - Section dividers within one continuous table
 * - Responsive desktop table / mobile stacked layout
 *
 * Design principles:
 * - Apple-like clarity and restraint
 * - No universal "winner" implied
 * - Key differences highlighted subtly
 * - All medical qualifications preserved
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { TreatmentV3 } from "@/lib/schemas/treatment-v3";
import type {
  SerializableComparisonResult,
  SerializableComparisonRow,
  ComparisonGroup,
  TreatmentDifferentiator,
} from "@/lib/comparison/comparison-engine";
import { getGroupOrder } from "@/lib/comparison/comparison-engine";

// =============================================================================
// TYPES
// =============================================================================

type DepthLevel = "essential" | "detailed" | "clinical";
type ViewMode = "all" | "differences" | "similarities";

interface UnifiedComparisonProps {
  comparison: SerializableComparisonResult;
  depthLevel: DepthLevel;
  viewMode: ViewMode;
  onDepthChange: (level: DepthLevel) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onRemoveTreatment: (slug: string) => void;
  onClear: () => void;
}

// Treatment accent colors (subtle, consistent column styling)
const TREATMENT_ACCENTS = [
  {
    bg: "bg-blue-50/60",
    border: "border-blue-100",
    text: "text-blue-700",
    headerBg: "bg-blue-50",
    dot: "bg-blue-400",
  },
  {
    bg: "bg-violet-50/60",
    border: "border-violet-100",
    text: "text-violet-700",
    headerBg: "bg-violet-50",
    dot: "bg-violet-400",
  },
  {
    bg: "bg-emerald-50/60",
    border: "border-emerald-100",
    text: "text-emerald-700",
    headerBg: "bg-emerald-50",
    dot: "bg-emerald-400",
  },
  {
    bg: "bg-amber-50/60",
    border: "border-amber-100",
    text: "text-amber-700",
    headerBg: "bg-amber-50",
    dot: "bg-amber-400",
  },
];

// Group labels and icons
const GROUP_CONFIG: Record<
  ComparisonGroup,
  { label: string; shortLabel: string }
> = {
  overview: { label: "Overview", shortLabel: "Overview" },
  indications: { label: "Uses", shortLabel: "Uses" },
  evidence: { label: "Effectiveness", shortLabel: "Evidence" },
  experience: { label: "Experience", shortLabel: "Exp." },
  delivery: { label: "Delivery", shortLabel: "Delivery" },
  safety: { label: "Side Effects", shortLabel: "Safety" },
  access: { label: "Cost & Access", shortLabel: "Cost" },
  medication_specific: { label: "Dosing", shortLabel: "Dosing" },
  therapy_specific: { label: "Therapy Details", shortLabel: "Therapy" },
  interventional_specific: { label: "Procedure", shortLabel: "Procedure" },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function UnifiedComparison({
  comparison,
  depthLevel,
  viewMode,
  onDepthChange,
  onViewModeChange,
  onRemoveTreatment,
  onClear,
}: UnifiedComparisonProps) {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const treatments = comparison.treatments;
  const treatmentCount = treatments.length;

  // Filter rows based on view mode and depth
  const filteredRows = useMemo(() => {
    let rows = comparison.rows;

    if (viewMode === "differences") {
      rows = rows.filter((r) => r.hasDifferences);
    } else if (viewMode === "similarities") {
      rows = rows.filter((r) => !r.hasDifferences);
    }

    if (depthLevel === "essential") {
      rows = rows.filter((r) => r.attribute.order < 50);
    }

    return rows;
  }, [comparison.rows, viewMode, depthLevel]);

  // Group filtered rows
  const groupedRows = useMemo(() => {
    const groups = new Map<ComparisonGroup, SerializableComparisonRow[]>();
    for (const row of filteredRows) {
      const group = row.attribute.group;
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(row);
    }
    return groups;
  }, [filteredRows]);

  // Get ordered groups that have content
  const activeGroups = useMemo(() => {
    return getGroupOrder().filter(({ key }) => groupedRows.has(key));
  }, [groupedRows]);

  // Scroll spy for section navigation
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const scrollTop = window.scrollY;
      const offset = 240; // Account for page header + controls + treatment header

      for (const { key } of activeGroups) {
        const element = sectionRefs.current.get(key);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= offset && rect.bottom > offset) {
            setActiveSection(key);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeGroups]);

  // Scroll to section (respects prefers-reduced-motion)
  const scrollToSection = useCallback((key: string) => {
    const element = sectionRefs.current.get(key);
    if (element) {
      const yOffset = -200; // Account for page header + controls + treatment header
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      window.scrollTo({
        top: y,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  }, []);

  // Register section ref
  const registerSection = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) {
        sectionRefs.current.set(key, el);
      }
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="motion-safe:animate-fade-in"
    >
      {/* Controls & Navigation Bar - sticks below page header (~72px) */}
      <div className="sticky top-[72px] z-30 bg-canvas/95 backdrop-blur-md border-b border-separator py-3 -mx-4 px-4 md:-mx-6 md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Section Navigation */}
          <SectionNavigation
            groups={activeGroups}
            activeSection={activeSection}
            onSectionClick={scrollToSection}
          />

          {/* Segmented Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <SegmentedControl
              label="Show"
              options={[
                { value: "all", label: "All" },
                { value: "differences", label: "Differences" },
                { value: "similarities", label: "Similarities" },
              ]}
              value={viewMode}
              onChange={(v) => onViewModeChange(v as ViewMode)}
            />
            <SegmentedControl
              label="Detail"
              options={[
                { value: "essential", label: "Essential" },
                { value: "detailed", label: "Detailed" },
                { value: "clinical", label: "Clinical" },
              ]}
              value={depthLevel}
              onChange={(v) => onDepthChange(v as DepthLevel)}
            />
          </div>
        </div>
      </div>

      {/* Unified Comparison Container */}
      <div className="mt-6 bg-surface rounded-3xl border border-separator shadow-card-2 overflow-hidden">
        {/* Sticky Treatment Header */}
        <TreatmentHeaderRow
          treatments={treatments}
          onRemove={onRemoveTreatment}
        />

        {/* Key Differentiators - Inside the container as first section */}
        {comparison.differentiators.length > 0 && (
          <KeyDifferentiators differentiators={comparison.differentiators} />
        )}

        {/* Comparison Sections - All within one container */}
        <div className="divide-y divide-separator/50">
          {activeGroups.map(({ key, label }) => (
            <ComparisonSection
              key={key}
              groupKey={key}
              label={GROUP_CONFIG[key]?.label || label}
              rows={groupedRows.get(key)!}
              treatments={treatments}
              depthLevel={depthLevel}
              registerRef={registerSection(key)}
            />
          ))}
        </div>
      </div>

      {/* Clear Comparison Link */}
      <div className="mt-6 text-center">
        <button
          onClick={onClear}
          className="text-sm text-label-tertiary hover:text-label-secondary motion-safe:transition-colors"
        >
          Clear comparison
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// KEY DIFFERENTIATORS
// =============================================================================

function KeyDifferentiators({
  differentiators,
}: {
  differentiators: TreatmentDifferentiator[];
}) {
  return (
    <div className="px-4 md:px-5 py-4 bg-treatment-50/40 border-b border-separator/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-treatment-600 uppercase tracking-wider">
          Key Differences
        </span>
        <span className="text-xs text-label-quaternary">at a glance</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {differentiators.map((d, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-2 bg-surface/80 rounded-lg px-3 py-2 border border-treatment-100"
          >
            <span className="text-sm font-medium text-treatment-700">
              {d.treatmentName}:
            </span>
            <span className="text-sm text-label-secondary">{d.statement}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// SECTION NAVIGATION
// =============================================================================

function SectionNavigation({
  groups,
  activeSection,
  onSectionClick,
}: {
  groups: { key: ComparisonGroup; label: string }[];
  activeSection: string;
  onSectionClick: (key: string) => void;
}) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto scrollbar-thin -mx-1 px-1"
      aria-label="Comparison sections"
    >
      {groups.map(({ key }) => {
        const config = GROUP_CONFIG[key];
        const isActive = activeSection === key;

        return (
          <button
            key={key}
            onClick={() => onSectionClick(key)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap motion-safe:transition-all motion-safe:duration-200",
              "min-h-9 min-w-11", // Touch target
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              isActive
                ? "bg-accent text-white shadow-subtle"
                : "text-label-secondary hover:text-label-primary hover:bg-fill-tertiary"
            )}
            aria-current={isActive ? "true" : undefined}
          >
            <span className="hidden sm:inline">{config?.label || key}</span>
            <span className="sm:hidden">{config?.shortLabel || key}</span>
          </button>
        );
      })}
    </nav>
  );
}

// =============================================================================
// SEGMENTED CONTROL
// =============================================================================

interface SegmentedControlProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-label-tertiary font-medium hidden lg:inline">
        {label}:
      </span>
      <div className="inline-flex rounded-lg bg-fill-tertiary p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md motion-safe:transition-all motion-safe:duration-200",
              "min-h-8 min-w-11", // Touch target
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
              value === option.value
                ? "bg-surface text-label-primary shadow-subtle"
                : "text-label-secondary hover:text-label-primary"
            )}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// TREATMENT HEADER ROW
// =============================================================================

function TreatmentHeaderRow({
  treatments,
  onRemove,
}: {
  treatments: TreatmentV3[];
  onRemove: (slug: string) => void;
}) {
  const treatmentCount = treatments.length;

  return (
    <div className="sticky top-[124px] z-20 bg-surface border-b border-separator">
      {/* Desktop: Table-like header */}
      <div className="hidden md:block">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `minmax(160px, 1fr) repeat(${treatmentCount}, minmax(140px, 1fr))`,
          }}
        >
          {/* Attribute column header */}
          <div className="p-4 border-r border-separator/50">
            <span className="sr-only">Attribute</span>
          </div>

          {/* Treatment column headers */}
          {treatments.map((treatment, idx) => {
            const accent = TREATMENT_ACCENTS[idx % TREATMENT_ACCENTS.length];
            return (
              <div
                key={treatment.identity.slug}
                className={cn(
                  "p-4 relative group",
                  idx < treatmentCount - 1 && "border-r border-separator/30",
                  accent.headerBg
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full mb-1.5",
                        getModalityBadgeStyles(treatment.taxonomy.modality)
                      )}
                    >
                      {formatModality(treatment.taxonomy.modality)}
                    </span>
                    <h3 className="font-semibold text-label-primary truncate">
                      {treatment.identity.name}
                    </h3>
                    {treatment.identity.brand_names &&
                      treatment.identity.brand_names.length > 0 && (
                        <p className="text-xs text-label-tertiary truncate mt-0.5">
                          {treatment.identity.brand_names.slice(0, 2).join(", ")}
                        </p>
                      )}
                  </div>
                  <button
                    onClick={() => onRemove(treatment.identity.slug)}
                    className="p-1.5 rounded-full text-label-quaternary hover:text-negative hover:bg-negative-50 motion-safe:transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove ${treatment.identity.name}`}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Color indicator bar */}
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-0.5",
                    accent.dot.replace("bg-", "bg-")
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Compact treatment pills */}
      <div className="md:hidden p-3 flex gap-2 overflow-x-auto scrollbar-thin">
        {treatments.map((treatment, idx) => {
          const accent = TREATMENT_ACCENTS[idx % TREATMENT_ACCENTS.length];
          return (
            <div
              key={treatment.identity.slug}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full shrink-0",
                accent.bg,
                accent.border,
                "border"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", accent.dot)} />
              <span className="text-sm font-medium text-label-primary whitespace-nowrap">
                {treatment.identity.name}
              </span>
              <button
                onClick={() => onRemove(treatment.identity.slug)}
                className="p-1 rounded-full text-label-quaternary hover:text-negative min-w-6 min-h-6 flex items-center justify-center"
                aria-label={`Remove ${treatment.identity.name}`}
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// COMPARISON SECTION
// =============================================================================

interface ComparisonSectionProps {
  groupKey: string;
  label: string;
  rows: SerializableComparisonRow[];
  treatments: TreatmentV3[];
  depthLevel: DepthLevel;
  registerRef: (el: HTMLElement | null) => void;
}

function ComparisonSection({
  groupKey,
  label,
  rows,
  treatments,
  depthLevel,
  registerRef,
}: ComparisonSectionProps) {
  const treatmentCount = treatments.length;

  return (
    <section ref={registerRef} id={`section-${groupKey}`}>
      {/* Section Header - acts as a divider within the unified table */}
      <div className="px-4 md:px-5 py-3 bg-fill-quaternary border-b border-separator/30">
        <h3 className="text-sm font-semibold text-label-primary uppercase tracking-wider">
          {label}
        </h3>
      </div>

      {/* Rows */}
      <div className="divide-y divide-separator/30">
        {rows.map((row) => (
          <ComparisonRow
            key={row.attribute.key}
            row={row}
            treatments={treatments}
            depthLevel={depthLevel}
          />
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// COMPARISON ROW
// =============================================================================

interface ComparisonRowProps {
  row: SerializableComparisonRow;
  treatments: TreatmentV3[];
  depthLevel: DepthLevel;
}

function ComparisonRow({ row, treatments, depthLevel }: ComparisonRowProps) {
  const { attribute, values, hasDifferences } = row;
  const treatmentCount = treatments.length;

  return (
    <>
      {/* Desktop: Grid row */}
      <div
        className={cn(
          "hidden md:grid items-stretch",
          hasDifferences && "bg-caution-50/30"
        )}
        style={{
          gridTemplateColumns: `minmax(160px, 1fr) repeat(${treatmentCount}, minmax(140px, 1fr))`,
        }}
      >
        {/* Attribute label column */}
        <div className="p-4 border-r border-separator/30 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-label-primary">
              {attribute.label}
            </span>
            {hasDifferences && (
              <span className="text-2xs uppercase tracking-wider font-semibold text-caution-600 bg-caution-100 px-1.5 py-0.5 rounded">
                Key difference
              </span>
            )}
          </div>
          {attribute.clinicalCaution && depthLevel === "clinical" && (
            <p className="text-xs text-caution-600 mt-1">
              {attribute.clinicalCaution}
            </p>
          )}
        </div>

        {/* Treatment value columns */}
        {treatments.map((treatment, idx) => {
          const value = values[treatment.identity.slug];
          const accent = TREATMENT_ACCENTS[idx % TREATMENT_ACCENTS.length];

          return (
            <div
              key={treatment.identity.slug}
              className={cn(
                "p-4 flex flex-col justify-center",
                idx < treatmentCount - 1 && "border-r border-separator/20",
                accent.bg
              )}
            >
              <ComparisonValue
                value={value}
                dataType={attribute.dataType}
                hasDifferences={hasDifferences}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile: Stacked card */}
      <div
        className={cn(
          "md:hidden p-4",
          hasDifferences && "bg-caution-50/30"
        )}
      >
        {/* Attribute label */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-medium text-sm text-label-primary">
            {attribute.label}
          </span>
          {hasDifferences && (
            <span className="text-2xs uppercase tracking-wider font-semibold text-caution-600 bg-caution-100 px-1.5 py-0.5 rounded">
              Differs
            </span>
          )}
        </div>

        {/* Treatment values stacked */}
        <div className="space-y-3">
          {treatments.map((treatment, idx) => {
            const value = values[treatment.identity.slug];
            const accent = TREATMENT_ACCENTS[idx % TREATMENT_ACCENTS.length];

            return (
              <div
                key={treatment.identity.slug}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl",
                  accent.bg,
                  "border",
                  accent.border
                )}
              >
                <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", accent.dot)} />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-label-tertiary block mb-1">
                    {treatment.identity.name}
                  </span>
                  <ComparisonValue
                    value={value}
                    dataType={attribute.dataType}
                    hasDifferences={hasDifferences}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {attribute.clinicalCaution && depthLevel === "clinical" && (
          <p className="text-xs text-caution-600 mt-3 pl-5">
            {attribute.clinicalCaution}
          </p>
        )}
      </div>
    </>
  );
}

// =============================================================================
// COMPARISON VALUE
// =============================================================================

interface ComparisonValueProps {
  value?: {
    display: string;
    status: string;
    isHighlight?: boolean;
    notes?: string;
  };
  dataType: string;
  hasDifferences: boolean;
}

function ComparisonValue({ value, dataType, hasDifferences }: ComparisonValueProps) {
  if (!value) {
    return (
      <span className="text-sm text-label-quaternary italic">Not available</span>
    );
  }

  const isUnknown = value.status === "unknown" || value.status === "not_reviewed";

  return (
    <div>
      <span
        className={cn(
          "text-sm",
          isUnknown && "text-label-quaternary italic",
          !isUnknown && "text-label-primary",
          value.isHighlight && hasDifferences && "font-medium"
        )}
      >
        {isUnknown && value.display === "Not available"
          ? "Not available"
          : value.display}
      </span>
      {value.notes && (
        <p className="text-xs text-label-tertiary mt-1">{value.notes}</p>
      )}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatModality(modality: string): string {
  const labels: Record<string, string> = {
    medication: "Medication",
    therapy: "Therapy",
    interventional: "Interventional",
    investigational: "Investigational",
    supplement: "Supplement",
    alternative: "Alternative",
  };
  return labels[modality] || modality;
}

function getModalityBadgeStyles(modality: string): string {
  const styles: Record<string, string> = {
    medication: "bg-accent-tint text-accent border border-accent-border",
    therapy: "bg-treatment-tint text-treatment border border-treatment-border",
    interventional: "bg-caution-tint text-caution-700 border border-caution-border",
    investigational: "bg-tools-tint text-tools-700 border border-tools-border",
    supplement: "bg-positive-tint text-positive-700 border border-positive-border",
    alternative: "bg-positive-tint text-positive-700 border border-positive-border",
  };
  return styles[modality] || "bg-fill-secondary text-label-primary";
}

// =============================================================================
// ICONS
// =============================================================================

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export default UnifiedComparison;

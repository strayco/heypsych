"use client";

/**
 * Tool Comparison Client Component
 *
 * A unified comparison experience with:
 * - Tool selector when no tools selected
 * - Sticky tool headers
 * - Comparison matrix/table
 * - Differences-only toggle
 * - Mobile-responsive (stacked on small screens)
 * - Per-cell provenance (source, verified date)
 * - "Unknown" explicitly shown (not hidden)
 *
 * Design principles:
 * - Sponsorship CANNOT affect comparison results
 * - Apple-like clarity and restraint
 * - No universal "winner" implied
 * - Key differences highlighted subtly
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CompareToolCard,
  CompareRow,
  CompareCell,
  CompareTray,
} from "@/components/tools/comparison";
import type {
  ClinicianTool,
  SerializableToolComparisonResult,
  SerializableToolComparisonRow,
  ToolComparisonGroup,
  ToolDifferentiator,
} from "./comparison-engine";
import { getToolGroupOrder } from "./comparison-engine";
import { DemoRequestForm } from "@/components/tools/clinician/DemoRequestForm";

// =============================================================================
// TYPES
// =============================================================================

type DepthLevel = "essential" | "detailed";
type ViewMode = "all" | "differences" | "similarities";

interface CuratedComparison {
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  tools: string[];
}

interface ToolManifestEntry {
  slug: string;
  name: string;
  category: string;
  company?: string;
}

interface ComparePageClientProps {
  initialTools: ClinicianTool[];
  comparison: SerializableToolComparisonResult | null;
  error?: string;
  curatedComparisons: CuratedComparison[];
  toolsManifest: ToolManifestEntry[];
}

// Tool accent colors (subtle, consistent column styling)
const TOOL_ACCENTS = [
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

// Group configuration
const GROUP_CONFIG: Record<ToolComparisonGroup, { label: string; shortLabel: string }> = {
  overview: { label: "Overview", shortLabel: "Overview" },
  pricing: { label: "Pricing", shortLabel: "Pricing" },
  compliance: { label: "Compliance & Security", shortLabel: "Compliance" },
  features: { label: "Features", shortLabel: "Features" },
  integrations: { label: "Integrations", shortLabel: "Integrations" },
  ehr_specific: { label: "EHR Features", shortLabel: "EHR" },
  ai_scribe_specific: { label: "AI Scribe Features", shortLabel: "AI Scribe" },
  billing_specific: { label: "Billing Features", shortLabel: "Billing" },
  support: { label: "Support & Fit", shortLabel: "Support" },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ComparePageClient({
  initialTools,
  comparison,
  error,
  curatedComparisons,
  toolsManifest,
}: ComparePageClientProps) {
  const router = useRouter();

  // NOTE: do not reintroduce `useSearchParams()` here.
  //
  // Reading search params opts the nearest Suspense boundary out of
  // prerendering, so the server emitted only the loading skeleton and the entire
  // comparison arrived after hydration. In a production build that reduced
  // /tools/compare/* to 86 words with no <h1>, on the highest-intent pages the
  // site has. The value was never read. Selection state comes from props.
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    initialTools.map((t) => t.slug)
  );
  const [depthLevel, setDepthLevel] = useState<DepthLevel>("detailed");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Update URL when selection changes
  const updateUrl = useCallback(
    (slugs: string[]) => {
      if (slugs.length === 0) {
        router.push("/tools/compare");
      } else {
        router.push(`/tools/compare?tools=${slugs.join(",")}`);
      }
    },
    [router]
  );

  // Handle tool selection
  const handleToggleTool = useCallback(
    (slug: string) => {
      setSelectedSlugs((prev) => {
        const newSlugs = prev.includes(slug)
          ? prev.filter((s) => s !== slug)
          : prev.length < 4
          ? [...prev, slug]
          : prev;
        updateUrl(newSlugs);
        return newSlugs;
      });
    },
    [updateUrl]
  );

  // Handle remove tool
  const handleRemoveTool = useCallback(
    (slug: string) => {
      setSelectedSlugs((prev) => {
        const newSlugs = prev.filter((s) => s !== slug);
        updateUrl(newSlugs);
        return newSlugs;
      });
    },
    [updateUrl]
  );

  // Handle clear all
  const handleClear = useCallback(() => {
    setSelectedSlugs([]);
    router.push("/tools/compare");
  }, [router]);

  // Handle curated comparison selection
  const handleCuratedComparison = useCallback(
    (comp: CuratedComparison) => {
      setSelectedSlugs(comp.tools);
      updateUrl(comp.tools);
    },
    [updateUrl]
  );

  // Handle compare button click
  const handleCompare = useCallback(() => {
    if (selectedSlugs.length >= 2) {
      updateUrl(selectedSlugs);
    }
  }, [selectedSlugs, updateUrl]);

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    let result = toolsManifest;

    if (selectedCategory) {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.slug.includes(query) ||
          t.company?.toLowerCase().includes(query)
      );
    }

    // Sort: selected first, then alphabetically
    return [...result].sort((a, b) => {
      const aSelected = selectedSlugs.includes(a.slug);
      const bSelected = selectedSlugs.includes(b.slug);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [toolsManifest, selectedCategory, searchQuery, selectedSlugs]);

  // Get unique categories
  const categories = useMemo(() => {
    const unique = Array.from(new Set(toolsManifest.map((t) => t.category)));
    return unique.sort();
  }, [toolsManifest]);

  // Filter rows based on view mode and depth
  const filteredRows = useMemo(() => {
    if (!comparison) return [];
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
  }, [comparison, viewMode, depthLevel]);

  // Group filtered rows
  const groupedRows = useMemo(() => {
    const groups = new Map<ToolComparisonGroup, SerializableToolComparisonRow[]>();
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
    return getToolGroupOrder().filter(({ key }) => groupedRows.has(key));
  }, [groupedRows]);

  // Scroll spy for section navigation
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const offset = 240;

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

  // Scroll to section
  const scrollToSection = useCallback((key: string) => {
    const element = sectionRefs.current.get(key);
    if (element) {
      const yOffset = -200;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  const canCompare = selectedSlugs.length >= 2;

  // =============================================================================
  // RENDER: SELECTOR VIEW (NO COMPARISON)
  // =============================================================================

  if (!comparison || initialTools.length === 0) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-label-primary mb-2">
              Compare Clinician Tools
            </h1>
            <p className="text-lg text-label-secondary">
              Select 2-4 tools to compare features, pricing, and more side by side.
            </p>
          </header>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-caution-50 border border-caution-200 rounded-lg text-caution-700">
              {error}
            </div>
          )}

          {/* Selection Summary + Compare Button */}
          <div className="mb-8 p-6 bg-surface rounded-xl shadow-sm border border-separator">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-label-primary">
                Selected Tools ({selectedSlugs.length}/4)
              </h2>
              {selectedSlugs.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-sm text-label-tertiary hover:text-label-secondary"
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedSlugs.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSlugs.map((slug, idx) => {
                  const tool = toolsManifest.find((t) => t.slug === slug);
                  const accent = TOOL_ACCENTS[idx % TOOL_ACCENTS.length];
                  return (
                    <div
                      key={slug}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
                        accent.bg,
                        accent.border,
                        "border"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", accent.dot)} />
                      <span className="text-sm font-medium text-label-primary">
                        {tool?.name || slug}
                      </span>
                      <button
                        onClick={() => handleRemoveTool(slug)}
                        className="text-label-quaternary hover:text-negative p-0.5"
                        aria-label={`Remove ${tool?.name || slug}`}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-label-tertiary mb-4">
                Select 2-4 tools below to compare
              </p>
            )}

            <button
              disabled={!canCompare}
              onClick={canCompare ? handleCompare : undefined}
              className={cn(
                "w-full py-3 rounded-lg font-medium text-white transition-colors",
                canCompare
                  ? "bg-accent hover:bg-accent-hover"
                  : "bg-fill-tertiary cursor-not-allowed text-label-quaternary"
              )}
            >
              {canCompare
                ? `Compare ${selectedSlugs.length} Tools`
                : `Select at least 2 tools to compare`}
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-label-quaternary" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-separator rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-surface"
                />
              </div>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors",
                  selectedCategory === null
                    ? "bg-accent text-white"
                    : "bg-fill-tertiary text-label-secondary hover:bg-fill-secondary"
                )}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full transition-colors",
                    selectedCategory === category
                      ? "bg-accent text-white"
                      : "bg-fill-tertiary text-label-secondary hover:bg-fill-secondary"
                  )}
                >
                  {formatCategory(category)}
                </button>
              ))}
            </div>
          </div>

          {/* Tool Grid - Show when searching */}
          {searchQuery.trim() && (
            <div className="mb-12">
              <h3 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider mb-4">
                Search Results
              </h3>
              {filteredTools.length === 0 ? (
                <p className="text-center py-8 text-label-tertiary">
                  No tools found. Try a different search.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {filteredTools.slice(0, 20).map((tool) => {
                    const isSelected = selectedSlugs.includes(tool.slug);
                    const isDisabled = !isSelected && selectedSlugs.length >= 4;

                    return (
                      <button
                        key={tool.slug}
                        onClick={() => !isDisabled && handleToggleTool(tool.slug)}
                        disabled={isDisabled}
                        className={cn(
                          "p-4 text-left rounded-lg border transition-all",
                          isSelected
                            ? "bg-blue-50 border-blue-200 ring-2 ring-accent"
                            : isDisabled
                            ? "bg-fill-quaternary border-separator opacity-50 cursor-not-allowed"
                            : "bg-surface border-separator hover:border-accent hover:bg-blue-50/50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-fill-tertiary text-label-secondary mb-2">
                              {formatCategory(tool.category)}
                            </span>
                            <h3 className="font-medium text-label-primary truncate">
                              {tool.name}
                            </h3>
                            {tool.company && (
                              <p className="text-sm text-label-tertiary truncate">
                                {tool.company}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="ml-3 flex-shrink-0">
                              <CheckIcon className="w-5 h-5 text-accent" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Popular Comparisons */}
          {curatedComparisons.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-label-primary mb-4">
                Popular Comparisons
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {curatedComparisons.slice(0, 6).map((comp) => (
                  <Link
                    key={comp.slug}
                    href={`/tools/compare/${comp.slug}`}
                    className="p-4 text-left bg-surface border border-separator rounded-lg hover:border-accent hover:bg-blue-50/50 transition-colors"
                  >
                    <p className="font-medium text-label-primary">{comp.name}</p>
                    <p className="text-sm text-label-tertiary">{comp.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Browse All Tools */}
          <div className="mt-12 text-center">
            <Link
              href="/tools"
              className="text-accent hover:text-accent-hover font-medium"
            >
              Browse all tools
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER: COMPARISON VIEW
  // =============================================================================

  const tools = comparison.tools;
  const toolCount = tools.length;

  return (
    <div className="min-h-screen bg-canvas" ref={containerRef}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2 text-sm text-label-tertiary mb-2">
            <Link href="/tools" className="hover:text-accent">
              Tools
            </Link>
            <span>/</span>
            <span>Compare</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-label-primary">
            {tools.map((t) => t.name).join(" vs ")}
          </h1>
        </header>

        {/* Controls & Navigation Bar - sticks below page header */}
        <div className="sticky top-[72px] z-30 bg-canvas/95 backdrop-blur-md border-b border-separator py-3 -mx-4 px-4 md:-mx-6 md:px-6 mb-6">
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
                onChange={(v) => setViewMode(v as ViewMode)}
              />
              <SegmentedControl
                label="Detail"
                options={[
                  { value: "essential", label: "Essential" },
                  { value: "detailed", label: "Detailed" },
                ]}
                value={depthLevel}
                onChange={(v) => setDepthLevel(v as DepthLevel)}
              />
            </div>
          </div>
        </div>

        {/* Unified Comparison Container */}
        <div className="bg-surface rounded-3xl border border-separator shadow-lg overflow-hidden">
          {/* Sticky Tool Header */}
          <ToolHeaderRow tools={tools} onRemove={handleRemoveTool} />

          {/* Key Differentiators */}
          {comparison.differentiators.length > 0 && (
            <KeyDifferentiators differentiators={comparison.differentiators} />
          )}

          {/* Comparison Sections */}
          <div className="divide-y divide-separator/50">
            {activeGroups.map(({ key, label }) => (
              <ComparisonSection
                key={key}
                groupKey={key}
                label={GROUP_CONFIG[key]?.label || label}
                rows={groupedRows.get(key)!}
                tools={tools}
                depthLevel={depthLevel}
                registerRef={registerSection(key)}
              />
            ))}
          </div>
        </div>

        {/* Demo Request Section */}
        <DemoRequestSection tools={tools} />

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleClear}
            className="text-sm text-label-tertiary hover:text-label-secondary motion-safe:transition-colors"
          >
            Clear comparison
          </button>
          <div className="flex gap-4 text-sm">
            <Link href="/tools" className="text-accent hover:text-accent-hover">
              Browse all tools
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Compare Tray (for adding more tools) */}
      <CompareTray
        selectedSlugs={selectedSlugs}
        toolsManifest={toolsManifest}
        onToggle={handleToggleTool}
        onRemove={handleRemoveTool}
        onClear={handleClear}
      />
    </div>
  );
}

// =============================================================================
// KEY DIFFERENTIATORS
// =============================================================================

function KeyDifferentiators({
  differentiators,
}: {
  differentiators: ToolDifferentiator[];
}) {
  return (
    <div className="px-4 md:px-5 py-4 bg-tools-50/40 border-b border-separator/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-tools-600 uppercase tracking-wider">
          Key Differences
        </span>
        <span className="text-xs text-label-quaternary">at a glance</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {differentiators.map((d, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-2 bg-surface/80 rounded-lg px-3 py-2 border border-tools-100"
          >
            <span className="text-sm font-medium text-tools-700">
              {d.toolName}:
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
  groups: { key: ToolComparisonGroup; label: string }[];
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
              "min-h-9 min-w-11",
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
              "min-h-8 min-w-11",
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
// TOOL HEADER ROW
// =============================================================================

function ToolHeaderRow({
  tools,
  onRemove,
}: {
  tools: ClinicianTool[];
  onRemove: (slug: string) => void;
}) {
  const toolCount = tools.length;

  return (
    <div className="sticky top-[124px] z-20 bg-surface border-b border-separator">
      {/* Desktop: Table-like header */}
      <div className="hidden md:block">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `minmax(160px, 1fr) repeat(${toolCount}, minmax(140px, 1fr))`,
          }}
        >
          {/* Attribute column header */}
          <div className="p-4 border-r border-separator/50">
            <span className="sr-only">Attribute</span>
          </div>

          {/* Tool column headers */}
          {tools.map((tool, idx) => {
            const accent = TOOL_ACCENTS[idx % TOOL_ACCENTS.length];
            return (
              <CompareToolCard
                key={tool.slug}
                tool={tool}
                accent={accent}
                onRemove={() => onRemove(tool.slug)}
                isLast={idx === toolCount - 1}
              />
            );
          })}
        </div>
      </div>

      {/* Mobile: Compact tool pills */}
      <div className="md:hidden p-3 flex gap-2 overflow-x-auto scrollbar-thin">
        {tools.map((tool, idx) => {
          const accent = TOOL_ACCENTS[idx % TOOL_ACCENTS.length];
          return (
            <div
              key={tool.slug}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full shrink-0",
                accent.bg,
                accent.border,
                "border"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", accent.dot)} />
              <span className="text-sm font-medium text-label-primary whitespace-nowrap">
                {tool.name}
              </span>
              <button
                onClick={() => onRemove(tool.slug)}
                className="p-1 rounded-full text-label-quaternary hover:text-negative min-w-6 min-h-6 flex items-center justify-center"
                aria-label={`Remove ${tool.name}`}
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
  rows: SerializableToolComparisonRow[];
  tools: ClinicianTool[];
  depthLevel: DepthLevel;
  registerRef: (el: HTMLElement | null) => void;
}

function ComparisonSection({
  groupKey,
  label,
  rows,
  tools,
  depthLevel,
  registerRef,
}: ComparisonSectionProps) {
  return (
    <section ref={registerRef} id={`section-${groupKey}`}>
      {/* Section Header */}
      <div className="px-4 md:px-5 py-3 bg-fill-quaternary border-b border-separator/30">
        <h3 className="text-sm font-semibold text-label-primary uppercase tracking-wider">
          {label}
        </h3>
      </div>

      {/* Rows */}
      <div className="divide-y divide-separator/30">
        {rows.map((row) => (
          <CompareRow
            key={row.attribute.key}
            row={row}
            tools={tools}
            depthLevel={depthLevel}
            accents={TOOL_ACCENTS}
          />
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// DEMO REQUEST / AFFILIATE SECTION
// =============================================================================

function DemoRequestSection({ tools }: { tools: ClinicianTool[] }) {
  const [selectedTool, setSelectedTool] = useState<ClinicianTool | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Check if any tools have affiliate links
  const toolsWithAffiliates = tools.filter((t) => t.affiliate_url);
  const toolsWithoutAffiliates = tools.filter((t) => !t.affiliate_url);

  const handleRequestDemo = (tool: ClinicianTool) => {
    setSelectedTool(tool);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    // Keep the form open to show success message
    // User can close manually
  };

  return (
    <div className="mt-8 bg-gradient-to-b from-tools-50 to-transparent rounded-2xl border border-tools-100 p-6 md:p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-label-primary mb-2">
          Ready to Get Started?
        </h2>
        <p className="text-label-secondary">
          {toolsWithAffiliates.length > 0
            ? "Visit these tools to learn more or request a personalized demo."
            : "Request a personalized demo to see how these tools can help your practice."}
        </p>
      </div>

      {!isFormOpen ? (
        <div className="flex flex-wrap justify-center gap-3">
          {/* Affiliate links - direct to vendor */}
          {toolsWithAffiliates.map((tool, idx) => {
            const accent = TOOL_ACCENTS[idx % TOOL_ACCENTS.length];
            return (
              <a
                key={tool.slug}
                href={tool.affiliate_url!}
                target="_blank"
                rel="noopener nofollow sponsored"
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium",
                  "border transition-all",
                  accent.bg,
                  accent.border,
                  "hover:shadow-md hover:scale-[1.02]"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", accent.dot)} />
                <span className="text-label-primary">Try {tool.name}</span>
                <svg
                  className="w-4 h-4 text-label-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            );
          })}

          {/* Demo request buttons - for tools without affiliate links */}
          {toolsWithoutAffiliates.map((tool, idx) => {
            const accent = TOOL_ACCENTS[(toolsWithAffiliates.length + idx) % TOOL_ACCENTS.length];
            return (
              <button
                key={tool.slug}
                onClick={() => handleRequestDemo(tool)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium",
                  "border transition-all",
                  accent.bg,
                  accent.border,
                  "hover:shadow-md hover:scale-[1.02]"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", accent.dot)} />
                <span className="text-label-primary">Request {tool.name} Demo</span>
              </button>
            );
          })}
        </div>
      ) : selectedTool ? (
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-label-primary">
              Request Demo for {selectedTool.name}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-label-tertiary hover:text-label-secondary p-1"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
          <DemoRequestForm
            toolSlug={selectedTool.slug}
            toolName={selectedTool.name}
            onSuccess={handleFormSuccess}
          />
        </div>
      ) : null}

      {/* Commission disclosure for affiliate links */}
      {toolsWithAffiliates.length > 0 && (
        <p className="mt-4 text-xs text-label-quaternary text-center">
          HeyPsych may earn a commission from some links
        </p>
      )}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    "ehr-practice-management": "EHR",
    "ai-scribe-documentation": "AI Scribe",
    "billing-rcm-insurance": "Billing",
    "billing-rcm": "Billing",
    "telehealth-communication": "Telehealth",
    "measurement-outcomes": "Measurement",
    "measurement-dtx": "Measurement",
    "provider-networks": "Networks",
    "intake-scheduling-forms": "Scheduling",
  };
  return labels[category] || category;
}

// =============================================================================
// ICONS
// =============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export default ComparePageClient;

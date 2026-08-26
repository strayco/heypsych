"use client";

// CLIENT WRAPPER - Handles interactive features for condition pages
// Supports both legacy flat structure and new ui.tiles dynamic layout
// Data is passed from server component (already fetched)

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
  ChevronRight,
  Users,
  BookOpen,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Entity } from "@/lib/types/database";
import {
  AuthorByline,
  MedicalReviewBadge,
  MedicalDisclaimer,
  CrisisSupportBanner,
  CitationList,
} from "@/components/eat";
import { ConditionBreadcrumbs } from "@/components/conditions/ConditionBreadcrumbs";
import { MedicationsList } from "@/components/conditions/MedicationsList";
import { getCategoryBySlug } from "@/lib/config/condition-categories";
import { NextStepsSection } from "@/components/navigation";
import type { NextStep } from "@/domains/navigation/types";

interface ConditionClientWrapperProps {
  entity: Entity;
  /** Optional next steps for contextual navigation (Navigation V1) */
  nextSteps?: NextStep[];
}

// Tile configuration from JSON
interface TileConfig {
  id: string;
  title: string;
  teaser?: string;
  summary?: string;
  content_refs?: string[];
  nav?: { prev: string | null; next: string | null };
  deep_link?: string;
}

interface UIConfig {
  layout?: string;
  tiles?: TileConfig[];
}

// Icon mapping for tile IDs and field types
const getIconForTile = (id: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    // New V2 tile IDs (hyphenated)
    "what-this-is": <Info className="h-5 w-5" />,
    "what-it-feels-like": <Heart className="h-5 w-5" />,
    "real-life-stories": <BookOpen className="h-5 w-5" />,
    "signs-and-symptoms": <AlertCircle className="h-5 w-5" />,
    "early-warning-signs": <AlertTriangle className="h-5 w-5" />,
    "why-it-happens": <Brain className="h-5 w-5" />,
    "how-its-told-apart": <Stethoscope className="h-5 w-5" />,
    "x-vs-other-conditions": <Target className="h-5 w-5" />,
    "treatment-and-next-steps": <Heart className="h-5 w-5" />,
    // Common tile IDs from data
    what_is: <Info className="h-5 w-5" />,
    stories: <BookOpen className="h-5 w-5" />,
    faqs: <HelpCircle className="h-5 w-5" />,
    comparisons: <Target className="h-5 w-5" />,
    common_reactions: <MessageCircle className="h-5 w-5" />,
    first_person_voices: <Users className="h-5 w-5" />,
    full_examples: <BookOpen className="h-5 w-5" />,
    frequently_asked_questions: <HelpCircle className="h-5 w-5" />,
    // Legacy tile IDs (underscored)
    overview: <Info className="h-5 w-5" />,
    symptoms: <AlertCircle className="h-5 w-5" />,
    diagnosis: <Stethoscope className="h-5 w-5" />,
    causes: <Brain className="h-5 w-5" />,
    treatment: <Heart className="h-5 w-5" />,
    living_with: <Lightbulb className="h-5 w-5" />,
    support: <Users className="h-5 w-5" />,
    resources: <BookOpen className="h-5 w-5" />,
    prognosis: <TrendingUp className="h-5 w-5" />,
    risk_factors: <Shield className="h-5 w-5" />,
    complications: <AlertTriangle className="h-5 w-5" />,
    prevention: <Shield className="h-5 w-5" />,
    research: <Sparkles className="h-5 w-5" />,
    faq: <HelpCircle className="h-5 w-5" />,
    // Legacy field mappings
    description: <Info className="h-5 w-5" />,
    diagnostic_criteria: <Stethoscope className="h-5 w-5" />,
    evaluation: <Stethoscope className="h-5 w-5" />,
    neurobiology: <Brain className="h-5 w-5" />,
    signs: <AlertCircle className="h-5 w-5" />,
    presentation: <Eye className="h-5 w-5" />,
    severity_levels: <BarChart3 className="h-5 w-5" />,
    warning_signs: <AlertTriangle className="h-5 w-5" />,
    impact_on_life: <Target className="h-5 w-5" />,
    comorbidities: <Activity className="h-5 w-5" />,
    treatment_approaches: <Heart className="h-5 w-5" />,
    treatment_goals: <CheckCircle className="h-5 w-5" />,
    medications: <Pill className="h-5 w-5" />,
    psychotherapy: <MessageCircle className="h-5 w-5" />,
    interventions: <Settings className="h-5 w-5" />,
    therapy: <MessageCircle className="h-5 w-5" />,
    self_help_strategies: <Lightbulb className="h-5 w-5" />,
    coping_strategies: <Lightbulb className="h-5 w-5" />,
    lifestyle_interventions: <Heart className="h-5 w-5" />,
    withdrawal: <AlertTriangle className="h-5 w-5" />,
    intoxication: <AlertCircle className="h-5 w-5" />,
    use_disorder: <Brain className="h-5 w-5" />,
    default: <Globe className="h-5 w-5" />,
  };

  // Direct match
  if (iconMap[id]) return iconMap[id];

  // Partial match (with null safety)
  if (id) {
    for (const [key, icon] of Object.entries(iconMap)) {
      if (id.includes(key) || key.includes(id)) {
        return icon;
      }
    }
  }

  return iconMap["default"];
};

// Smart title formatting
const formatTitle = (fieldName: string): string => {
  return fieldName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Resolve a content reference path like "description.overview" or "symptoms.inattention"
// Also handles paths that start with "content." prefix (strips it since we're already in content)
const resolveContentRef = (content: Record<string, any>, ref: string): any => {
  // Strip "content." prefix if present since we're already working with the content object
  const normalizedRef = ref.startsWith("content.") ? ref.slice(8) : ref;
  const parts = normalizedRef.split(".");
  let current: any = content;

  for (const part of parts) {
    if (current === null || current === undefined) return null;
    current = current[part];
  }

  return current;
};

// Safe text extraction from various data types
const extractSafeText = (data: any, fallback = "No information available"): string => {
  if (typeof data === "string") return data;
  if (typeof data === "number" || typeof data === "boolean") return String(data);
  if (!data) return fallback;

  if (typeof data === "object") {
    // Check for common text fields (includes short forms q/a for FAQs)
    const textFields = [
      "description",
      "summary",
      "overview",
      "general",
      "text",
      "content",
      "definition",
      "answer",
      "a",
      "question",
      "q",
      "title",
      "name",
      "story",
      "note",
    ];
    for (const field of textFields) {
      if (data[field] && typeof data[field] === "string") {
        return data[field];
      }
    }

    // Handle arrays
    if (Array.isArray(data)) {
      const strings = data.filter((item) => typeof item === "string").slice(0, 3);
      if (strings.length > 0) return strings.join(", ");
      // Try to extract text from array of objects
      const extracted = data.slice(0, 3).map(item => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item) {
          return item.name || item.title || item.question || item.q || item.description || item.summary || '';
        }
        return '';
      }).filter(Boolean);
      if (extracted.length > 0) return extracted.join(", ");
    }

    // For other objects, try to get first string value
    const values = Object.values(data);
    for (const val of values) {
      if (typeof val === "string" && val.length > 0 && val.length < 500) {
        return val;
      }
    }

    // Return keys as description of what's available
    const keys = Object.keys(data);
    if (keys.length > 0) {
      return `Contains: ${keys.slice(0, 5).join(", ")}${keys.length > 5 ? '...' : ''}`;
    }
  }

  // Never return [object Object]
  const str = String(data);
  if (str === "[object Object]") return fallback;
  return str || fallback;
};

export default function ConditionClientWrapper({ entity, nextSteps }: ConditionClientWrapperProps) {
  const [expandedTiles, setExpandedTiles] = useState<Record<string, boolean>>({});
  const [activeTile, setActiveTile] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  // Scroll to detail panel when a tile is selected
  useEffect(() => {
    if (activeTile && detailPanelRef.current) {
      // Small delay to allow the panel to render/animate in
      setTimeout(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [activeTile]);

  const toggleTile = (tileId: string) => {
    setExpandedTiles((prev) => ({
      ...prev,
      [tileId]: !prev[tileId],
    }));
  };

  const rawData = entity.data || {};

  // Detect new structure: ui config exists (normalizeEntityContent flattens content but preserves ui)
  const hasNewStructure = rawData.ui && typeof rawData.ui === 'object';

  // Content is now flattened to top level by normalizeEntityContent
  // UI config is preserved at rawData.ui
  const content: Record<string, any> = rawData;
  const uiConfig: UIConfig = rawData.ui || {};
  const tiles = uiConfig.tiles || [];
  const hasTiles = tiles.length > 0;

  // Get category config for breadcrumbs
  const categorySlug = entity.metadata?.category as string | undefined;
  const category = categorySlug ? getCategoryBySlug(categorySlug) : undefined;

  // Extract shortDefinition
  const shortDefinition = content.shortDefinition || content.short_definition || content.aeo?.what_is;

  // Get description text for crisis detection
  const getDescriptionText = (): string => {
    if (typeof content.description === 'string') return content.description;
    if (content.description?.overview) return content.description.overview;
    return '';
  };

  // Universal object renderer - handles any object structure
  const renderObject = (obj: Record<string, any>, depth = 0): React.ReactNode => {
    if (!obj || typeof obj !== 'object') return null;

    return (
      <div className={depth > 0 ? "pl-3 border-l-2 border-separator" : ""}>
        {Object.entries(obj).map(([key, value]) => {
          // Skip internal/meta fields
          if (['id', 'nav', 'deep_link', 'content_refs'].includes(key)) return null;

          return (
            <div key={key} className="mb-3">
              <h5 className="text-sm font-medium text-label-secondary capitalize mb-1">
                {formatTitle(key)}
              </h5>
              <div className="text-sm text-label-secondary">
                {renderAnyValue(value, depth + 1)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Universal value renderer - handles any value type
  const renderAnyValue = (value: any, depth = 0): React.ReactNode => {
    // Null/undefined
    if (value === null || value === undefined) {
      return <span className="text-label-primary0 italic">Not available</span>;
    }

    // Primitives
    if (typeof value === 'string') {
      // Check if it's a quote
      if (value.startsWith('"') && value.endsWith('"')) {
        return (
          <blockquote className="border-l-2 border-separator pl-3 py-1 text-label-secondary italic">
            {value}
          </blockquote>
        );
      }
      return <ParsedContent content={value} className="text-label-secondary" />;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return <span className="text-label-secondary">{String(value)}</span>;
    }

    // Arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-label-primary0 italic">None</span>;

      const firstItem = value[0];

      // Array of strings
      if (typeof firstItem === 'string') {
        // Check if quotes (lived experience)
        if (firstItem.startsWith('"')) {
          return (
            <div className="space-y-2">
              {value.map((item, i) => (
                <blockquote key={i} className="border-l-2 border-separator pl-3 py-1 text-sm text-label-secondary italic">
                  {item}
                </blockquote>
              ))}
            </div>
          );
        }

        // Check if "Condition — explanation" pattern (comparison strings)
        // Em-dash (—) or en-dash (–) separator indicates comparison format
        const hasComparisonPattern = value.every(item =>
          typeof item === 'string' && (item.includes(' — ') || item.includes(' – '))
        );

        if (hasComparisonPattern) {
          return (
            <div className="space-y-4">
              {value.map((item, i) => {
                // Split on em-dash or en-dash
                const [condition, ...rest] = item.split(/ [—–] /);
                const explanation = rest.join(' — ');
                return (
                  <div key={i} className="rounded-lg border border-separator bg-surface p-4">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-label-tertiary shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-label-primary">{condition}</h5>
                        <p className="text-sm text-label-secondary mt-1">{explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Regular string list
        return (
          <ul className="space-y-1">
            {value.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 bg-label-quaternary rounded-full mt-1.5 shrink-0" />
                <ParsedContent content={String(item)} className="text-label-secondary" />
              </li>
            ))}
          </ul>
        );
      }

      // Array of objects
      if (typeof firstItem === 'object') {
        // FAQ pattern: question/answer or q/a (handle both formats)
        if ((firstItem.question && firstItem.answer) || (firstItem.q && firstItem.a)) {
          return (
            <div className="space-y-3">
              {value.map((item, i) => (
                <div key={i} className="rounded-lg border border-separator bg-surface-grouped p-4">
                  <h5 className="font-semibold text-label-primary mb-2">{item.question || item.q}</h5>
                  <p className="text-sm text-label-secondary">{item.answer || item.a}</p>
                </div>
              ))}
            </div>
          );
        }

        // Story pattern: age_group/story
        if (firstItem.story) {
          return (
            <div className="space-y-3">
              {value.map((item, i) => (
                <div key={i} className="rounded-lg border border-separator bg-surface-grouped/50 p-4">
                  {(item.age_group || item.demographic) && (
                    <div className="flex gap-2 mb-2">
                      {item.age_group && (
                        <Badge variant="default" className="capitalize">
                          {String(item.age_group).replace(/_/g, ' ')}
                        </Badge>
                      )}
                      {item.demographic && (
                        <Badge variant="outline" className="text-xs">
                          {item.demographic}
                        </Badge>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-label-secondary italic">&ldquo;{item.story}&rdquo;</p>
                </div>
              ))}
            </div>
          );
        }

        // Condition comparison pattern: condition + explanation (for "vs. Other Conditions" tiles)
        if (firstItem.condition && firstItem.explanation) {
          return (
            <div className="space-y-4">
              {value.map((item, i) => (
                <div key={i} className="rounded-lg border border-separator bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-label-tertiary shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-label-primary">{item.condition}</h5>
                      <p className="text-sm text-label-secondary mt-1">{item.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        }

        // Name pattern
        if (firstItem.name) {
          return (
            <ul className="space-y-2">
              {value.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 bg-label-quaternary rounded-full mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium text-label-primary">{item.name}</span>
                    {item.description && (
                      <p className="text-sm text-label-tertiary mt-0.5">{item.description}</p>
                    )}
                    {item.dsm5_code && (
                      <span className="text-xs bg-canvas text-label-tertiary px-1.5 py-0.5 rounded border border-separator ml-2">
                        DSM-5: {item.dsm5_code}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          );
        }

        // Narrative story pattern: title + baseline/first_change/behaviors/consequences/aftermath
        if (firstItem.title && (firstItem.baseline || firstItem.first_change || firstItem.behaviors)) {
          return (
            <div className="space-y-4">
              {value.map((item, i) => {
                const storyId = `story-${i}`;
                const isStoryExpanded = expandedTiles[storyId] || false;

                return (
                  <div key={i} className="rounded-lg border border-separator bg-surface overflow-hidden">
                    <button
                      onClick={() => toggleTile(storyId)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-fill-quaternary transition-colors"
                    >
                      <h6 className="font-semibold text-label-primary">{item.title}</h6>
                      <ChevronDown className={`h-5 w-5 text-label-tertiary transition-transform ${isStoryExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isStoryExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-separator">
                        {item.baseline && (
                          <div className="pt-3">
                            <h6 className="text-xs font-medium text-label-tertiary uppercase tracking-wide mb-1">Background</h6>
                            <p className="text-sm text-label-secondary">{item.baseline}</p>
                          </div>
                        )}
                        {item.first_change && (
                          <div>
                            <h6 className="text-xs font-medium text-label-tertiary uppercase tracking-wide mb-1">First Signs</h6>
                            <p className="text-sm text-label-secondary">{item.first_change}</p>
                          </div>
                        )}
                        {item.behaviors && (
                          <div>
                            <h6 className="text-xs font-medium text-label-tertiary uppercase tracking-wide mb-1">Behaviors</h6>
                            <p className="text-sm text-label-secondary">{item.behaviors}</p>
                          </div>
                        )}
                        {item.consequences && (
                          <div>
                            <h6 className="text-xs font-medium text-label-tertiary uppercase tracking-wide mb-1">Impact</h6>
                            <p className="text-sm text-label-secondary">{item.consequences}</p>
                          </div>
                        )}
                        {item.aftermath && (
                          <div>
                            <h6 className="text-xs font-medium text-label-tertiary uppercase tracking-wide mb-1">Resolution</h6>
                            <p className="text-sm text-label-secondary">{item.aftermath}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        // Person story pattern: objects with a "person" field containing full narrative
        if (firstItem.person) {
          return (
            <div className="space-y-4">
              {value.map((item, i) => {
                const storyId = `person-story-${i}`;
                const isStoryExpanded = expandedTiles[storyId] || false;
                // Create preview from first 150 characters
                const preview = item.person.length > 150 ? item.person.substring(0, 150) + "..." : item.person;

                return (
                  <div key={i} className="rounded-lg border border-separator bg-surface overflow-hidden">
                    <button
                      onClick={() => toggleTile(storyId)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-fill-quaternary transition-colors"
                    >
                      <p className="text-sm text-label-secondary line-clamp-2 pr-4">{preview}</p>
                      <ChevronDown className={`h-5 w-5 text-label-tertiary shrink-0 transition-transform ${isStoryExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isStoryExpanded && (
                      <div className="px-4 pb-4 border-t border-separator pt-3">
                        <p className="text-sm text-label-secondary leading-relaxed">{item.person}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        // Scenario pattern: title + scenario + optional clinical_note (clinical vignettes)
        if (firstItem.scenario && firstItem.title) {
          return (
            <div className="space-y-4">
              {value.map((item, i) => {
                const storyId = `scenario-${i}`;
                const isStoryExpanded = expandedTiles[storyId] || false;

                return (
                  <div key={i} className="rounded-lg border border-separator bg-surface overflow-hidden">
                    <button
                      onClick={() => toggleTile(storyId)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-fill-quaternary transition-colors"
                    >
                      <h6 className="font-semibold text-label-primary">{item.title}</h6>
                      <ChevronDown className={`h-5 w-5 text-label-tertiary transition-transform ${isStoryExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isStoryExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-separator">
                        <div className="pt-3">
                          <p className="text-sm text-label-secondary leading-relaxed">{item.scenario}</p>
                        </div>
                        {item.clinical_note && (
                          <div className="bg-surface-grouped rounded-lg p-3 border-l-2 border-separator">
                            <h6 className="text-xs font-medium text-label-tertiary uppercase tracking-wide mb-1">Clinical Note</h6>
                            <p className="text-sm text-label-secondary">{item.clinical_note}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        // Simple scenario pattern: just scenario text (no title)
        if (firstItem.scenario) {
          return (
            <div className="space-y-4">
              {value.map((item, i) => {
                const storyId = `scenario-simple-${i}`;
                const isStoryExpanded = expandedTiles[storyId] || false;
                const preview = item.scenario.length > 120 ? item.scenario.substring(0, 120) + "..." : item.scenario;

                return (
                  <div key={i} className="rounded-lg border border-separator bg-surface overflow-hidden">
                    <button
                      onClick={() => toggleTile(storyId)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-fill-quaternary transition-colors"
                    >
                      <p className="text-sm text-label-secondary line-clamp-2 pr-4">{preview}</p>
                      <ChevronDown className={`h-5 w-5 text-label-tertiary shrink-0 transition-transform ${isStoryExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isStoryExpanded && (
                      <div className="px-4 pb-4 border-t border-separator pt-3">
                        <p className="text-sm text-label-secondary leading-relaxed">{item.scenario}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        // Title pattern (simple titles with optional description/teaser)
        if (firstItem.title) {
          return (
            <div className="space-y-3">
              {value.map((item, i) => (
                <div key={i} className="p-3 bg-surface-grouped/50 rounded-lg">
                  <h6 className="font-medium text-label-primary">{item.title}</h6>
                  {item.description && <p className="text-sm text-label-tertiary mt-1">{item.description}</p>}
                  {item.teaser && <p className="text-sm text-label-tertiary mt-1">{item.teaser}</p>}
                </div>
              ))}
            </div>
          );
        }

        // Generic object array - render each object
        return (
          <div className="space-y-3">
            {value.map((item, i) => (
              <div key={i} className="p-3 bg-surface-grouped/50 rounded-lg">
                {renderObject(item, depth)}
              </div>
            ))}
          </div>
        );
      }

      // Fallback for other arrays
      return (
        <ul className="space-y-1">
          {value.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 bg-label-quaternary rounded-full mt-1.5 shrink-0" />
              <span className="text-label-secondary">{String(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    // Objects
    if (typeof value === 'object') {
      // Check for special object patterns first
      if (value.overview) {
        return (
          <div className="space-y-3">
            <p className="text-label-secondary">{value.overview}</p>
            {Object.entries(value).map(([k, v]) => {
              if (k === 'overview') return null;
              return (
                <div key={k}>
                  <h5 className="text-sm font-medium text-label-secondary capitalize mb-1">{formatTitle(k)}</h5>
                  {renderAnyValue(v, depth + 1)}
                </div>
              );
            })}
          </div>
        );
      }

      // Generic object
      return renderObject(value, depth);
    }

    // Fallback
    return <span className="text-label-secondary">{String(value)}</span>;
  };

  // Render content from a single reference - now using universal renderer
  const renderContentRef = (contentData: any, refPath: string): React.ReactNode => {
    return renderAnyValue(contentData, 0);
  };

  // Check if using grid layout
  const isGridLayout = uiConfig.layout === "3x3" || uiConfig.layout === "2x2" || uiConfig.layout === "2x3";

  // Render a single tile - grid mode shows compact cards, list mode shows accordions
  const renderTile = (tile: TileConfig, index: number) => {
    const isExpanded = expandedTiles[tile.id] || false;
    const icon = getIconForTile(tile.id);

    // Resolve all content refs for this tile
    const contentRefs = Array.isArray(tile.content_refs) ? tile.content_refs : [];
    const resolvedContent = contentRefs
      .map((ref) => ({
        ref,
        data: resolveContentRef(content, ref),
      }))
      .filter(({ data }) => data !== null && data !== undefined);

    const hasContent = resolvedContent.length > 0;
    const tileDescription = tile.teaser || tile.summary || "";

    // Grid mode: compact clickable cards
    if (isGridLayout) {
      return (
        <div key={tile.id} className="h-full">
          <Card
            className={`h-full transition-all ${hasContent ? "cursor-pointer hover:shadow-soft hover:border-neutral-300" : "opacity-75"}`}
            onClick={hasContent ? () => setActiveTile(activeTile === tile.id ? null : tile.id) : undefined}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-label-tertiary">
                  {icon}
                </div>
                {hasContent && (
                  <ChevronRight className="h-5 w-5 text-label-quaternary" />
                )}
              </div>
              <CardTitle className="text-base font-semibold text-label-primary leading-tight">
                {tile.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-label-secondary line-clamp-3">{tileDescription}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // List mode requires content to expand
    if (!hasContent) return null;

    // List mode: expandable accordion
    return (
      <div key={tile.id}>
        <Card className="overflow-hidden">
          <CardHeader
            className="cursor-pointer transition-colors hover:bg-fill-quaternary"
            onClick={() => toggleTile(tile.id)}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-label-tertiary">
                  {icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-label-primary">{tile.title}</h3>
                  {!isExpanded && (
                    <p className="text-sm text-label-tertiary font-normal mt-0.5">{tile.teaser}</p>
                  )}
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-label-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
          {isExpanded && (
            <CardContent className="pt-0 space-y-6">
              {resolvedContent.map(({ ref, data }, idx) => (
                <div key={ref} className={idx > 0 ? "pt-4 border-t border-separator" : ""}>
                  {renderContentRef(data, ref)}
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </div>
    );
  };

  // Legacy field rendering for backwards compatibility
  const renderLegacyFields = () => {
    const metadataFields = ["name", "slug", "type", "status", "metadata", "editorial", "id", "created_at", "updated_at", "content", "ui", "aeo", "kind"];
    const headerFields = ["description", "prevalence", "age_of_onset", "shortDefinition", "short_definition"];
    const dedicatedFields = ["linkedMedications", "linked_medications", "citations", "references"];
    const excludeFields = [...metadataFields, ...headerFields, ...dedicatedFields];

    const dynamicFields = Object.keys(content).filter(
      (field) => !excludeFields.includes(field) && content[field]
    );

    return dynamicFields.map((fieldName) => {
      const fieldData = content[fieldName];
      const isExpanded = expandedTiles[fieldName] || false;
      const icon = getIconForTile(fieldName);

      return (
        <div key={fieldName}>
          <Card>
            <CardHeader
              className="cursor-pointer transition-colors hover:bg-fill-quaternary"
              onClick={() => toggleTile(fieldName)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-label-primary">
                  <span className="text-label-tertiary">{icon}</span>
                  {formatTitle(fieldName)}
                </div>
                <ChevronDown className={`h-5 w-5 text-label-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
            {isExpanded && (
              <CardContent className="pt-0">
                {renderContentRef(fieldData, fieldName)}
              </CardContent>
            )}
          </Card>
        </div>
      );
    });
  };

  // Check if this is a sensitive condition
  const descriptionText = getDescriptionText();
  const isSensitive = entity.name?.toLowerCase().includes('suicide') ||
    entity.name?.toLowerCase().includes('self-harm') ||
    entity.name?.toLowerCase().includes('depression') ||
    descriptionText?.toLowerCase().includes('suicide');

  return (
    <main className="min-h-screen bg-canvas" itemScope itemType="https://schema.org/MedicalWebPage">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        {category && (
          <div className="mb-6">
            <ConditionBreadcrumbs category={category} conditionName={entity.name} />
          </div>
        )}

        {/* Back Button */}
        <div className="mb-8">
          <Button variant="ghost" className="group" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="space-y-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="primary" size="md">
                Mental Health Condition
              </Badge>
              {entity.metadata?.medical_review?.reviewed && (
                <MedicalReviewBadge
                  reviewInfo={{
                    reviewed: entity.metadata.medical_review.reviewed,
                    reviewer_name: entity.metadata.medical_review.reviewer_name,
                    reviewer_credentials: entity.metadata.medical_review.reviewer_credentials,
                    review_date: entity.metadata.medical_review.review_date,
                  }}
                  compact
                />
              )}
            </div>
            <h1 className="text-4xl font-bold text-label-primary" itemProp="name headline">{entity.name}</h1>
            {shortDefinition && (
              <article itemProp="abstract description" className="text-lg text-label-secondary leading-relaxed max-w-4xl">
                <p>
                  <strong className="text-label-primary">To define {entity.name}:</strong> {shortDefinition}
                </p>
              </article>
            )}
          </div>
        </div>

        {/* Crisis Support Banner (for sensitive conditions) */}
        {isSensitive && (
          <div className="mb-8">
            <CrisisSupportBanner prominent />
          </div>
        )}

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Overview Card - Always show for key stats */}
          {(content.description || content.prevalence || content.age_of_onset) && (
            <section itemProp="mainEntityOfPage">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-label-tertiary" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {content.description && (
                      <article className="rounded-lg border-l-2 border-separator bg-surface-grouped p-4" itemProp="description">
                        <h4 className="mb-2 font-semibold text-label-primary">Description</h4>
                        <div className="text-sm text-label-secondary">
                          <ParsedContent content={extractSafeText(content.description)} />
                        </div>
                      </article>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {content.prevalence && (
                        <div className="rounded-lg border border-separator bg-surface p-3">
                          <h4 className="mb-1 font-semibold text-label-primary">Prevalence</h4>
                          <div className="text-sm text-label-secondary">
                            <ParsedContent content={String(content.prevalence)} />
                          </div>
                        </div>
                      )}

                      {content.age_of_onset && (
                        <div className="rounded-lg border border-separator bg-surface p-3">
                          <h4 className="mb-1 font-semibold text-label-primary">Age of Onset</h4>
                          <div className="text-sm text-label-secondary">
                            <ParsedContent content={String(content.age_of_onset)} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DSM-5 and ICD-10 Codes */}
                    {(() => {
                      const dsm5 = entity.metadata?.dsm5_code;
                      const icd10 = entity.metadata?.icd10_code;

                      return dsm5 || icd10 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {dsm5 && (
                            <div className="rounded-lg border border-separator bg-surface p-3">
                              <h4 className="mb-1 font-semibold text-label-primary">DSM-5 Code</h4>
                              <p className="font-mono text-sm text-label-secondary">{String(dsm5)}</p>
                            </div>
                          )}

                          {icd10 && (
                            <div className="rounded-lg border border-separator bg-surface p-3">
                              <h4 className="mb-1 font-semibold text-label-primary">ICD-10 Code</h4>
                              <p className="font-mono text-sm text-label-secondary">{String(icd10)}</p>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Author & Review Information */}
          {(() => {
            const metadata = entity.metadata || {};
            const editorial = entity.editorial || {};

            const metadataAuthor = metadata.author ? {
              name: metadata.author.name || '',
              slug: metadata.author.name?.toLowerCase().replace(/\s+/g, '-') || '',
              credentials: metadata.author.credentials || '',
              bio: metadata.author.bio || '',
              profileUrl: `/about/authors/${metadata.author.name?.toLowerCase().replace(/\s+/g, '-') || ''}`,
            } : undefined;

            const metadataReviewer = metadata.medical_reviewer ? {
              name: metadata.medical_reviewer.name || '',
              slug: metadata.medical_reviewer.name?.toLowerCase().replace(/\s+/g, '-') || '',
              credentials: metadata.medical_reviewer.credentials || '',
              specialty: metadata.medical_reviewer.role || 'Psychiatry',
              bio: metadata.medical_reviewer.bio || '',
              profileUrl: `/about/medical-review-board`,
            } : undefined;

            const author = editorial.author || metadataAuthor;
            const medicalReviewer = editorial.medicalReviewer || metadataReviewer;
            const timestamps = {
              published_date: editorial.dates?.published || metadata.published_date || entity.created_at,
              last_updated: editorial.dates?.lastUpdated || metadata.last_updated || entity.updated_at,
              last_reviewed: editorial.dates?.lastMedicallyReviewed || metadata.medical_review?.review_date || entity.updated_at,
            };

            return (
              <AuthorByline
                author={author}
                medicalReviewer={medicalReviewer}
                publishedDate={timestamps.published_date}
                lastUpdated={timestamps.last_updated}
                lastReviewed={timestamps.last_reviewed}
              />
            );
          })()}

          {/* Dynamic Content - Tiles or Legacy Fields */}
          {hasTiles ? (
            <>
              {/* Grid layout */}
              <div className={
                uiConfig.layout === "3x3" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" :
                uiConfig.layout === "2x2" ? "grid grid-cols-1 md:grid-cols-2 gap-4" :
                uiConfig.layout === "2x3" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" :
                uiConfig.layout === "1x3" ? "grid grid-cols-1 gap-4" :
                "space-y-4"
              }>
                {tiles.map((tile, index) => renderTile(tile, index))}
              </div>

              {/* Expanded tile detail panel (for grid mode) */}
              {isGridLayout && activeTile && (() => {
                const tile = tiles.find(t => t.id === activeTile);
                if (!tile) return null;

                const contentRefs = Array.isArray(tile.content_refs) ? tile.content_refs : [];
                const resolvedContent = contentRefs
                  .map((ref) => ({
                    ref,
                    data: resolveContentRef(content, ref),
                  }))
                  .filter(({ data }) => data !== null && data !== undefined);

                const icon = getIconForTile(tile.id);

                return (
                  <div ref={detailPanelRef}>
                    <Card className="border border-separator shadow-soft">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-label-tertiary">
                            {icon}
                          </div>
                          <CardTitle className="text-xl">{tile.title}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTile(null)}
                        >
                          Close
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {resolvedContent.map(({ ref, data }, idx) => (
                          <div key={ref} className={idx > 0 ? "pt-4 border-t border-separator" : ""}>
                            {renderContentRef(data, ref)}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </>
          ) : (
            // Legacy field-based layout
            <div className="space-y-4">
              {renderLegacyFields()}
            </div>
          )}

          {/* Medications List */}
          {(() => {
            const linkedMedications = content.linkedMedications || content.linked_medications;
            const treatmentApproaches = content.treatment_approaches || content.treatmentApproaches;
            const medications = treatmentApproaches?.linkedMedications || linkedMedications;

            return medications && Array.isArray(medications) && medications.length > 0 ? (
              <MedicationsList medications={medications} />
            ) : null;
          })()}

          {/* Citations/References */}
          {(() => {
            const citations = content.citations || content.references || entity.metadata?.references;
            return citations && citations.length > 0 ? (
              <CitationList citations={citations} title="Scientific References" />
            ) : null;
          })()}

          {/* Medical Disclaimer */}
          <MedicalDisclaimer
            config={{
              entity_type: 'condition',
              prominent: false,
              include_crisis_line: isSensitive,
            }}
          />

          {/* Contextual Next Steps (Navigation V1) */}
          {nextSteps && nextSteps.length > 0 && (
            <NextStepsSection
              steps={nextSteps}
              heading="What's Next?"
              audience="patient"
              maxSteps={6}
              sourceType="condition"
              sourceSlug={entity.slug}
            />
          )}

          {/* Call to Action (fallback when no next steps) */}
          {(!nextSteps || nextSteps.length === 0) && (
            <Card className="border-separator">
              <CardContent className="p-8 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-label-secondary mb-2">
                  Get Support
                </p>
                <h3 className="mb-4 text-2xl font-bold text-label-primary">
                  Seeking Help for {entity.name}?
                </h3>
                <div className="mx-auto mb-6 max-w-2xl text-label-secondary">
                  <ParsedContent content="If you recognize these symptoms in yourself or a loved one, know that help is available. Mental health conditions are treatable, and connecting with a qualified professional can make a significant difference." />
                </div>
                <div className="flex justify-center">
                  <Link
                    href="/psychiatrists"
                    className="inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-treatment focus:ring-offset-2 bg-treatment text-white hover:bg-treatment-600 h-14 px-8 text-lg"
                  >
                    Locate Psychiatrists
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

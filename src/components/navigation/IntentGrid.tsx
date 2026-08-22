"use client";

import Link from "next/link";
import {
  Search,
  Stethoscope,
  Scale,
  MapPin,
  Smartphone,
  GraduationCap,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import type { IntentGridProps, IntentEntryPoint } from "@/domains/navigation/types";
import { cn } from "@/lib/utils";
import { trackIntentSelect } from "@/lib/analytics/product-events";

/**
 * Icon mapping for intent entry points
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search,
  stethoscope: Stethoscope,
  scale: Scale,
  "map-pin": MapPin,
  smartphone: Smartphone,
  "graduation-cap": GraduationCap,
};

/**
 * Semantic colors for intent categories
 */
const intentColors: Record<string, { bg: string; icon: string; hover: string }> = {
  understand_symptoms: {
    bg: "bg-accent-tint",
    icon: "text-accent",
    hover: "hover:bg-accent-tint-hover",
  },
  understand_diagnosis: {
    bg: "bg-treatment-tint",
    icon: "text-treatment",
    hover: "hover:bg-treatment/10",
  },
  compare_treatments: {
    bg: "bg-positive-tint",
    icon: "text-positive",
    hover: "hover:bg-positive/10",
  },
  find_care: {
    bg: "bg-positive-tint",
    icon: "text-positive-600",
    hover: "hover:bg-positive/10",
  },
  find_tool: {
    bg: "bg-tools-tint",
    icon: "text-tools",
    hover: "hover:bg-tools/10",
  },
  clinician_resources: {
    bg: "bg-fill-secondary",
    icon: "text-label-secondary",
    hover: "hover:bg-fill-primary",
  },
};

/**
 * Default intent entry points for the Navigation V1 homepage
 */
export const defaultIntents: IntentEntryPoint[] = [
  {
    id: "understand_symptoms",
    label: "I'm concerned about symptoms",
    description: "Explore what you're experiencing and learn what it might mean",
    href: "/symptoms",
    icon: "search",
    audience: "patient",
  },
  {
    id: "understand_diagnosis",
    label: "I want to understand a diagnosis",
    description: "Learn about mental health conditions and their treatments",
    href: "/conditions",
    icon: "stethoscope",
    audience: "patient",
  },
  {
    id: "compare_treatments",
    label: "I'm comparing treatments",
    description: "Compare therapy, medication, and alternative treatment options",
    href: "/treatments/compare",
    icon: "scale",
    audience: "patient",
  },
  {
    id: "find_care",
    label: "I need to find care",
    description: "Search for psychiatrists and mental health providers",
    href: "/psychiatrists",
    icon: "map-pin",
    audience: "patient",
  },
  {
    id: "find_tool",
    label: "I'm looking for a mental-health tool",
    description: "Discover apps and digital tools for mental wellness",
    href: "/tools",
    icon: "smartphone",
    audience: "patient",
  },
  {
    id: "clinician_resources",
    label: "I'm a clinician",
    description: "Clinical resources, tools, and treatment information",
    href: "/for-clinicians",
    icon: "graduation-cap",
    audience: "clinician",
  },
];

/**
 * IntentGrid - Editorial composition for homepage navigation
 *
 * Replaces uniform card grid with a hierarchical layout:
 * - Featured primary actions (larger, more prominent)
 * - Grouped secondary actions (compact rows)
 * - Clear visual hierarchy without repetitive cards
 */
export function IntentGrid({
  intents = defaultIntents,
}: IntentGridProps) {
  // Separate patient intents from clinician intent
  const patientIntents = intents.filter((i) => i.audience === "patient");
  const clinicianIntent = intents.find((i) => i.audience === "clinician");

  // Primary actions (first 2 patient intents - most common entry points)
  const primaryIntents = patientIntents.slice(0, 2);
  // Secondary actions (remaining patient intents)
  const secondaryIntents = patientIntents.slice(2);

  return (
    <div className="space-y-6">
      {/* Primary Intent Cards - Featured, larger */}
      <div className="grid gap-4 sm:grid-cols-2">
        {primaryIntents.map((intent) => {
          const IconComponent = iconMap[intent.icon] || Search;
          const colors = intentColors[intent.id] || intentColors.understand_symptoms;

          return (
            <Link
              key={intent.id}
              href={intent.href}
              onClick={() => trackIntentSelect(intent.id)}
              className={cn(
                "group relative flex flex-col gap-4 rounded-2xl bg-surface p-6",
                "border border-separator shadow-subtle",
                "transition-all duration-200",
                "hover:shadow-card-2 hover:border-accent/30",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    colors.bg
                  )}
                >
                  <IconComponent className={cn("h-6 w-6", colors.icon)} />
                </div>
                <ArrowRight className="h-5 w-5 text-label-quaternary transition-transform group-hover:translate-x-1 group-hover:text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-label-primary group-hover:text-accent">
                  {intent.label}
                </h3>
                <p className="mt-1 text-sm text-label-secondary">
                  {intent.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Secondary Intent Rows - Compact, grouped */}
      <div className="rounded-2xl bg-surface border border-separator overflow-hidden">
        {secondaryIntents.map((intent, index) => {
          const IconComponent = iconMap[intent.icon] || Search;
          const colors = intentColors[intent.id] || intentColors.understand_symptoms;
          const isLast = index === secondaryIntents.length - 1;

          return (
            <Link
              key={intent.id}
              href={intent.href}
              onClick={() => trackIntentSelect(intent.id)}
              className={cn(
                "group flex items-center gap-4 px-5 py-4",
                "transition-colors duration-150",
                "hover:bg-fill-quaternary",
                "focus:outline-none focus-visible:bg-accent-tint",
                !isLast && "border-b border-separator"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  colors.bg
                )}
              >
                <IconComponent className={cn("h-5 w-5", colors.icon)} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-label-primary group-hover:text-accent">
                  {intent.label}
                </h3>
                <p className="text-sm text-label-tertiary truncate">
                  {intent.description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-label-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
            </Link>
          );
        })}
      </div>

      {/* Clinician Section - Distinct, professional */}
      {clinicianIntent && (
        <Link
          href={clinicianIntent.href}
          onClick={() => trackIntentSelect(clinicianIntent.id)}
          className={cn(
            "group flex items-center justify-between rounded-xl px-5 py-4",
            "bg-surface-grouped border border-transparent",
            "transition-all duration-150",
            "hover:bg-fill-tertiary",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fill-secondary">
              <GraduationCap className="h-5 w-5 text-label-secondary" />
            </div>
            <div>
              <h3 className="font-medium text-label-primary group-hover:text-accent">
                {clinicianIntent.label}
              </h3>
              <p className="text-sm text-label-tertiary">
                {clinicianIntent.description}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-label-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
        </Link>
      )}
    </div>
  );
}

export default IntentGrid;

"use client";

import Link from "next/link";
import {
  ClipboardCheck,
  BookOpen,
  Pill,
  Scale,
  Smartphone,
  MapPin,
  GraduationCap,
  FileText,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import type { NextStepCardProps, NextStepKind } from "@/domains/navigation/types";
import { cn } from "@/lib/utils";
import { trackNextStepClick } from "@/lib/analytics/product-events";

/**
 * Icon mapping for next step kinds
 */
const kindIconMap: Record<NextStepKind, React.ComponentType<{ className?: string }>> = {
  assessment: ClipboardCheck,
  condition: BookOpen,
  treatment: Pill,
  comparison: Scale,
  tool: Smartphone,
  find_care: MapPin,
  clinician_resource: GraduationCap,
  article: FileText,
  external: ExternalLink,
};

/**
 * Background color mapping for next step kinds
 */
const kindColorMap: Record<NextStepKind, string> = {
  assessment: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
  condition: "bg-accent-tint text-accent group-hover:bg-accent-tint-hover",
  treatment: "bg-positive-tint text-green-600 group-hover:bg-positive-tint",
  comparison: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
  tool: "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100",
  find_care: "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
  clinician_resource: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
  article: "bg-fill-quaternary text-label-secondary group-hover:bg-fill-tertiary",
  external: "bg-fill-quaternary text-label-secondary group-hover:bg-fill-tertiary",
};

/**
 * NextStepCard - A single contextual recommendation
 *
 * Displays a next step with appropriate icon, title, and optional description.
 * Used within NextStepsSection on condition and treatment pages.
 */
export function NextStepCard({ step, sourceType, sourceSlug }: NextStepCardProps) {
  const IconComponent = kindIconMap[step.kind];
  const colorClasses = kindColorMap[step.kind];
  const isExternal = step.kind === "external" || step.href.startsWith("http");

  const handleClick = () => {
    trackNextStepClick(
      step.id,
      step.kind,
      step.title,
      sourceType || "unknown",
      sourceSlug || "unknown"
    );
  };

  const CardContent = (
    <>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
            colorClasses
          )}
        >
          <IconComponent className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-label-primary group-hover:text-accent-700">
            {step.title}
          </h4>
          {step.description && (
            <p className="mt-1 text-sm text-label-secondary line-clamp-2">
              {step.description}
            </p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-label-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
      {step.reason && (
        <p className="mt-2 text-xs text-label-tertiary italic pl-12">
          {step.reason}
        </p>
      )}
    </>
  );

  const sharedClasses = cn(
    "group block rounded-lg border border-separator bg-white p-4",
    "transition-all duration-200 hover:border-accent-border hover:shadow-sm",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
  );

  if (isExternal) {
    return (
      <a
        href={step.href}
        target="_blank"
        rel="noopener noreferrer"
        className={sharedClasses}
        onClick={handleClick}
      >
        {CardContent}
      </a>
    );
  }

  return (
    <Link href={step.href} className={sharedClasses} onClick={handleClick}>
      {CardContent}
    </Link>
  );
}

export default NextStepCard;

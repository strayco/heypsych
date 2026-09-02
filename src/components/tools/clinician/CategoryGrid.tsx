"use client";

// CategoryGrid Component
// Grid of V4 clinician categories with tool counts

import Link from "next/link";
import {
  Laptop,
  Mic,
  Receipt,
  Video,
  Network,
  LineChart,
  Pill,
  BadgeCheck,
  Heart,
  Brain,
  Calendar,
  ShieldCheck,
  BarChart3,
  Users,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryData {
  slug: string;
  display_name: string;
  short_name?: string;
  count: number;
  url: string;
  intro?: string;
}

interface CategoryGridProps {
  categories: CategoryData[];
  variant?: "default" | "compact";
  className?: string;
}

// Icon mapping for V4 categories
const categoryIcons: Record<string, LucideIcon> = {
  "ehr-practice-management": Laptop,
  "ai-scribe-documentation": Mic,
  "billing-rcm": Receipt,
  "telehealth-communication": Video,
  "provider-networks": Network,
  "measurement-outcomes": LineChart,
  "prescribing-erx": Pill,
  "credentialing-workforce": BadgeCheck,
  "patient-engagement": Heart,
  "clinical-decision-support": Brain,
  "scheduling-intake": Calendar,
  "compliance-security": ShieldCheck,
  "analytics-reporting": BarChart3,
  "care-coordination": Users,
  "digital-therapeutics": Sparkles,
};

// Color mapping for V4 categories using semantic design tokens
const categoryColors: Record<string, string> = {
  "ehr-practice-management": "bg-accent/10 text-accent-600",
  "ai-scribe-documentation": "bg-treatment/10 text-treatment-600",
  "billing-rcm": "bg-positive/10 text-positive-600",
  "telehealth-communication": "bg-tools/10 text-tools-600",
  "provider-networks": "bg-treatment/10 text-treatment-600",
  "measurement-outcomes": "bg-positive/10 text-positive-600",
  "prescribing-erx": "bg-negative/10 text-negative-600",
  "credentialing-workforce": "bg-caution/10 text-caution-600",
  "patient-engagement": "bg-treatment/10 text-treatment-600",
  "clinical-decision-support": "bg-accent/10 text-accent-600",
  "scheduling-intake": "bg-caution/10 text-caution-600",
  "compliance-security": "bg-fill-tertiary text-label-secondary",
  "analytics-reporting": "bg-treatment/10 text-treatment-600",
  "care-coordination": "bg-tools/10 text-tools-600",
  "digital-therapeutics": "bg-treatment/10 text-treatment-600",
};

export function CategoryGrid({
  categories,
  variant = "default",
  className,
}: CategoryGridProps) {
  const isCompact = variant === "compact";

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 text-label-tertiary">
        No categories available
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        isCompact
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          : "sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {categories.map((category) => {
        const Icon = categoryIcons[category.slug] || Laptop;
        const colorClass =
          categoryColors[category.slug] || "bg-fill-tertiary text-label-secondary";

        return (
          <Link
            key={category.slug}
            href={category.url}
            className={cn(
              "group relative flex flex-col rounded-xl border border-separator bg-surface transition-all",
              "hover:border-treatment/30 hover:shadow-soft",
              isCompact ? "p-4" : "p-5"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex items-center justify-center rounded-xl",
                colorClass,
                isCompact ? "h-10 w-10" : "h-12 w-12"
              )}
            >
              <Icon className={cn(isCompact ? "h-5 w-5" : "h-6 w-6")} />
            </div>

            {/* Title */}
            <h3
              className={cn(
                "font-semibold text-label-primary transition-colors",
                "group-hover:text-treatment",
                isCompact ? "mt-3 text-sm" : "mt-4 text-base"
              )}
            >
              {category.short_name || category.display_name}
            </h3>

            {/* Tool count */}
            <p className="mt-1 text-xs text-label-tertiary">
              {category.count} {category.count === 1 ? "tool" : "tools"}
            </p>

            {/* Intro (non-compact only) */}
            {!isCompact && category.intro && (
              <p className="mt-2 text-sm text-label-secondary line-clamp-2">
                {category.intro.slice(0, 100)}...
              </p>
            )}

            {/* CTA */}
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium text-treatment opacity-0 transition-opacity",
                "group-hover:opacity-100",
                isCompact ? "mt-2" : "mt-3"
              )}
            >
              Browse
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default CategoryGrid;

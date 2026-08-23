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

// Color mapping for V4 categories
const categoryColors: Record<string, string> = {
  "ehr-practice-management": "bg-blue-500/10 text-blue-600",
  "ai-scribe-documentation": "bg-purple-500/10 text-purple-600",
  "billing-rcm": "bg-emerald-500/10 text-emerald-600",
  "telehealth-communication": "bg-cyan-500/10 text-cyan-600",
  "provider-networks": "bg-indigo-500/10 text-indigo-600",
  "measurement-outcomes": "bg-emerald-500/10 text-emerald-600",
  "prescribing-erx": "bg-red-500/10 text-red-600",
  "credentialing-workforce": "bg-amber-500/10 text-amber-600",
  "patient-engagement": "bg-pink-500/10 text-pink-600",
  "clinical-decision-support": "bg-blue-500/10 text-blue-600",
  "scheduling-intake": "bg-orange-500/10 text-orange-600",
  "compliance-security": "bg-slate-500/10 text-slate-600",
  "analytics-reporting": "bg-violet-500/10 text-violet-600",
  "care-coordination": "bg-sky-500/10 text-sky-600",
  "digital-therapeutics": "bg-pink-500/10 text-pink-600",
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
          categoryColors[category.slug] || "bg-gray-500/10 text-gray-600";

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

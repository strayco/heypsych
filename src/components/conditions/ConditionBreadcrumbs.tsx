import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CategoryConfig } from "@/lib/config/condition-categories";
import { cn } from "@/lib/utils/cn";

// Client-safe category config (only needs fields used by breadcrumbs)
type BreadcrumbCategoryConfig = Pick<CategoryConfig, 'href' | 'displayTitle'>;

interface ConditionBreadcrumbsProps {
  category?: BreadcrumbCategoryConfig;
  conditionName?: string;
  className?: string;
}

/**
 * Condition Breadcrumbs Component
 *
 * Pattern: Home > Conditions > {Category} > {Condition}
 *
 * Styling: Subtle (small type, muted color) matching Apple aesthetic
 *
 * Examples:
 * - Home > Conditions > ADHD & Learning Disorders > Attention-Deficit/Hyperactivity Disorder
 * - Home > Conditions > ADHD & Learning Disorders (category hub page)
 * - Home > Conditions (hub page)
 */
export function ConditionBreadcrumbs({
  category,
  conditionName,
  className,
}: ConditionBreadcrumbsProps) {
  return (
    <nav
      className={cn("flex items-center gap-2 text-sm text-slate-600", className)}
      aria-label="Breadcrumb"
    >
      {/* Home */}
      <Link
        href="/"
        className="transition-colors hover:text-slate-900"
      >
        Home
      </Link>

      <ChevronRight className="h-4 w-4 text-slate-400" />

      {/* Conditions */}
      <Link
        href="/conditions"
        className="transition-colors hover:text-slate-900"
      >
        Conditions
      </Link>

      {/* Category (if provided) */}
      {category && (
        <>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          {conditionName ? (
            <Link
              href={category.href}
              className="transition-colors hover:text-slate-900"
            >
              {category.displayTitle}
            </Link>
          ) : (
            <span className="font-medium text-slate-900">{category.displayTitle}</span>
          )}
        </>
      )}

      {/* Condition Name (if provided) */}
      {conditionName && (
        <>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-900">{conditionName}</span>
        </>
      )}
    </nav>
  );
}

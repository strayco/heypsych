// Category Grid Component
// Displays hub categories in a responsive grid

import Link from "next/link";
import {
  Moon,
  Heart,
  Brain,
  Zap,
  Shield,
  Pill,
  Users,
  Search,
  FileText,
  Receipt,
  Building2,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  slug: string;
  url: string;
  display_name: string;
  intro?: string;
}

interface CategoryGridProps {
  categories: Category[];
  variant: "patient" | "clinician";
  className?: string;
}

// Hub icon mapping
const patientIcons: Record<string, LucideIcon> = {
  sleep: Moon,
  "anxiety-stress": Heart,
  "mood-depression": Brain,
  "focus-adhd": Zap,
  "trauma-ptsd": Shield,
  "substance-use": Pill,
  "serious-mental-illness": Brain,
  "find-support": Users,
};

const clinicianIcons: Record<string, LucideIcon> = {
  "clinical-answers-evidence": Search,
  "ai-scribes-documentation": FileText,
  "billing-coding": Receipt,
  "prescribing-medication-support": Pill,
  "practice-admin-operations": Building2,
  "patient-engagement-between-visits": MessageSquare,
};

// Accent colors for variety
const patientColors: Record<string, string> = {
  sleep: "bg-indigo-500/10 text-indigo-600",
  "anxiety-stress": "bg-rose-500/10 text-rose-600",
  "mood-depression": "bg-amber-500/10 text-amber-600",
  "focus-adhd": "bg-violet-500/10 text-violet-600",
  "trauma-ptsd": "bg-emerald-500/10 text-emerald-600",
  "substance-use": "bg-teal-500/10 text-teal-600",
  "serious-mental-illness": "bg-purple-500/10 text-purple-600",
  "find-support": "bg-blue-500/10 text-blue-600",
};

const clinicianColors: Record<string, string> = {
  "clinical-answers-evidence": "bg-blue-500/10 text-blue-600",
  "ai-scribes-documentation": "bg-purple-500/10 text-purple-600",
  "billing-coding": "bg-emerald-500/10 text-emerald-600",
  "prescribing-medication-support": "bg-orange-500/10 text-orange-600",
  "practice-admin-operations": "bg-slate-500/10 text-slate-600",
  "patient-engagement-between-visits": "bg-cyan-500/10 text-cyan-600",
};

export function CategoryGrid({ categories, variant, className }: CategoryGridProps) {
  const icons = variant === "patient" ? patientIcons : clinicianIcons;
  const colors = variant === "patient" ? patientColors : clinicianColors;

  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
        variant === "clinician" && "lg:grid-cols-3",
        className
      )}
    >
      {categories.map((category) => {
        const Icon = icons[category.slug] || Heart;
        const colorClass = colors[category.slug] || "bg-gray-500/10 text-gray-600";

        return (
          <Link
            key={category.slug}
            href={category.url}
            className="group relative flex items-start gap-3 rounded-xl border border-separator bg-surface p-4 transition-all hover:border-accent/20 hover:shadow-soft"
          >
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", colorClass)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-label-primary group-hover:text-accent transition-colors">
                {category.display_name}
              </div>
              {category.intro && (
                <p className="mt-0.5 text-sm text-label-tertiary line-clamp-2">
                  {category.intro.slice(0, 60)}...
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

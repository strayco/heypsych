"use client";

// ClinicianToolCard Component
// Card component for V4 clinician tool listings
// P0 FIX: Use proper compliance checking, not JavaScript truthiness

import Link from "next/link";
import {
  Shield,
  ArrowRight,
  Bot,
  Video,
  Receipt,
  Laptop,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { cn } from "@/lib/utils";
import { isComplianceConfirmedYes } from "@/lib/schemas/tool-editorial";

interface ClinicianToolCardProps {
  tool: ClinicianToolV4;
  variant?: "default" | "compact" | "featured";
  showCategory?: boolean;
}

// Category display names
const categoryNames: Record<string, string> = {
  "ehr-practice-management": "EHR",
  "ai-scribe-documentation": "AI Scribe",
  "billing-rcm": "Billing",
  "telehealth-communication": "Telehealth",
  "provider-networks": "Network",
  "measurement-outcomes": "Outcomes",
  "prescribing-erx": "e-Rx",
  "credentialing-workforce": "Credentialing",
  "patient-engagement": "Engagement",
  "clinical-decision-support": "CDS",
  "scheduling-intake": "Scheduling",
  "compliance-security": "Compliance",
  "analytics-reporting": "Analytics",
  "care-coordination": "Coordination",
  "digital-therapeutics": "DTx",
};

export function ClinicianToolCard({
  tool,
  variant = "default",
  showCategory = false,
}: ClinicianToolCardProps) {
  const isCompact = variant === "compact";
  const isFeatured = variant === "featured";

  return (
    <Link
      href={`/tools/for-clinicians/${tool.primary_category}/${tool.slug}/`}
      className={cn(
        "group relative flex rounded-xl border border-separator bg-surface transition-all",
        "hover:border-treatment/30 hover:shadow-soft",
        isCompact ? "p-3" : "p-4",
        isFeatured && "ring-1 ring-treatment/20"
      )}
    >
      {/* Featured badge */}
      {isFeatured && (
        <div className="absolute -top-2 right-3">
          <Badge className="bg-treatment text-white text-[10px] px-2 py-0.5">
            Featured
          </Badge>
        </div>
      )}

      <div className="flex w-full items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-treatment/5",
            isCompact ? "h-10 w-10" : "h-12 w-12"
          )}
        >
          {tool.feature_flags.has_ai ? (
            <Bot
              className={cn(
                "text-purple-600",
                isCompact ? "h-5 w-5" : "h-6 w-6"
              )}
            />
          ) : tool.feature_flags.has_telehealth ? (
            <Video
              className={cn(
                "text-cyan-600",
                isCompact ? "h-5 w-5" : "h-6 w-6"
              )}
            />
          ) : tool.feature_flags.has_rcm ? (
            <Receipt
              className={cn(
                "text-emerald-600",
                isCompact ? "h-5 w-5" : "h-6 w-6"
              )}
            />
          ) : (
            <Laptop
              className={cn(
                "text-treatment/70",
                isCompact ? "h-5 w-5" : "h-6 w-6"
              )}
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3
                className={cn(
                  "font-semibold text-label-primary transition-colors truncate",
                  "group-hover:text-treatment",
                  isCompact ? "text-sm" : "text-base"
                )}
              >
                {tool.name}
              </h3>

              {/* Category badge */}
              {showCategory && (
                <span className="mt-0.5 inline-block text-xs text-label-tertiary">
                  {categoryNames[tool.primary_category] || tool.primary_category}
                </span>
              )}
            </div>

            {/* Pricing */}
            <div className="shrink-0 text-right max-w-[140px]">
              {tool.pricing?.free_tier ? (
                <span className="text-xs font-medium text-positive-700">
                  Free tier
                </span>
              ) : (
                <span className="text-xs text-label-tertiary line-clamp-2">
                  {tool.pricing?.starting_price_display}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {!isCompact && (
            <p className="mt-1 text-sm text-label-secondary line-clamp-2">
              {tool.one_liner || tool.short_description}
            </p>
          )}

          {/* Feature badges */}
          {/* P0 FIX: Only show compliance badges for confirmed YES values, not "unknown" */}
          <div className={cn("flex flex-wrap gap-1.5", isCompact ? "mt-2" : "mt-3")}>
            {isComplianceConfirmedYes(tool.compliance.hipaa_support) && (
              <span className="inline-flex items-center gap-0.5 rounded bg-treatment/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-treatment-700">
                <Shield className="h-2.5 w-2.5" />
                HIPAA
              </span>
            )}

            {isComplianceConfirmedYes(tool.compliance.baa_available) && (
              <span className="rounded bg-positive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-positive-700">
                BAA
              </span>
            )}

            {tool.feature_flags.has_ai && (
              <span className="inline-flex items-center gap-0.5 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-purple-700">
                <Bot className="h-2.5 w-2.5" />
                AI
              </span>
            )}

            {tool.feature_flags.has_telehealth && !tool.feature_flags.has_ai && (
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-700">
                Telehealth
              </span>
            )}

            {tool.feature_flags.has_e_prescribing && (
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-700">
                e-Rx
              </span>
            )}

            {(tool.pricing?.free_trial_days ?? 0) > 0 && (
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                {tool.pricing?.free_trial_days}d trial
              </span>
            )}
          </div>

          {/* Best for (featured only) */}
          {isFeatured && (tool.best_for?.length ?? 0) > 0 && (
            <div className="mt-3 border-t border-separator pt-3">
              <p className="text-xs font-medium text-label-tertiary mb-1">
                Best for:
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-label-secondary">
                  {tool.best_for?.[0]}
                </span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium text-treatment opacity-0 transition-opacity",
              "group-hover:opacity-100",
              isCompact ? "mt-2" : "mt-3"
            )}
          >
            View details
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ClinicianToolCard;

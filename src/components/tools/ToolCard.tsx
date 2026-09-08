"use client";

import Link from "next/link";
import { Star, ArrowRight, Shield } from "lucide-react";
import type { DigitalToolV3, SupportLevel } from "@/lib/schemas/digital-tool-v3";

interface ToolCardProps {
  tool: DigitalToolV3;
  showHubBadge?: boolean;
}

/**
 * Get accurate pricing label based on model and free_tier.
 * Distinguishes between truly free, freemium, and trial-only products.
 */
function getPricingLabel(pricing: DigitalToolV3["pricing"]): {
  label: string;
  sublabel?: string;
  highlight?: boolean;
} {
  const { model, free_tier, starting_price } = pricing;

  switch (model) {
    case "free":
      // Completely free with no in-app purchases
      return { label: "Free", highlight: true };

    case "freemium":
      // Has ongoing free functionality (not just a trial)
      return { label: "Free tier", sublabel: starting_price ? `Premium from ${starting_price}` : undefined };

    case "subscription":
      if (free_tier) {
        // Trial only - important distinction
        return {
          label: "Free trial",
          sublabel: starting_price || undefined,
        };
      }
      // Paid subscription, no free access
      return { label: starting_price || "Subscription" };

    case "one-time":
      return { label: starting_price || "One-time purchase" };

    case "enterprise":
      return { label: "Enterprise pricing" };

    case "insurance-covered":
      return { label: "Insurance covered", sublabel: starting_price ? `or ${starting_price}` : undefined };

    default:
      return { label: starting_price || "See pricing" };
  }
}

/**
 * Get human-readable support level label.
 * Answers: "What type of support am I actually getting?"
 */
function getSupportLabel(level: SupportLevel): string {
  switch (level) {
    case "self-help":
      return "Self-guided";
    case "coached":
      return "With coaching";
    case "clinical":
      return "Clinical care";
    case "crisis":
      return "Crisis support";
    default:
      return "";
  }
}

/**
 * ToolCard Component
 *
 * Reusable card for displaying tools in grids and lists.
 * Shows clear pricing labels to help users understand what's truly free vs. trial-only.
 */
export function ToolCard({ tool, showHubBadge = false }: ToolCardProps) {
  const pricingInfo = getPricingLabel(tool.pricing);
  const supportLabel = getSupportLabel(tool.support_level);
  // Show privacy badge only for verified positive facts (no data selling)
  const showPrivacyBadge = tool.privacy.data_sold === false;

  return (
    <Link href={`/tools/${tool.slug}/`} className="group block h-full">
      <div className="h-full rounded-xl border border-separator bg-surface p-5 transition-all hover:border-neutral-300 hover:shadow-soft">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-label-primary group-hover:text-accent transition-colors truncate">
              {tool.name}
            </h3>

            {/* Rating */}
            {tool.app_rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3 w-3 fill-current text-label-tertiary" />
                <span className="text-sm text-label-secondary">
                  {tool.app_rating}
                </span>
                {tool.total_reviews && (
                  <span className="text-xs text-label-tertiary">
                    ({formatReviews(tool.total_reviews)})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Badges - support type and AI */}
          <div className="flex items-center gap-1.5">
            {supportLabel && (
              <span className="text-xs text-label-tertiary px-2 py-0.5 rounded bg-canvas border border-separator">
                {supportLabel}
              </span>
            )}
            {tool.ai_attributes.includes("ai-powered") && (
              <span className="text-xs font-medium text-label-tertiary px-2 py-0.5 rounded bg-canvas border border-separator">
                AI
              </span>
            )}
          </div>
        </div>

        {/* One-liner */}
        <p className="mt-3 text-sm text-label-secondary line-clamp-2">
          {tool.short_description || tool.one_liner}
        </p>

        {/* Platforms */}
        <div className="mt-3 flex flex-wrap gap-1">
          {tool.platforms.ios && (
            <span className="text-xs text-label-tertiary">iOS</span>
          )}
          {tool.platforms.ios && (tool.platforms.android || tool.platforms.web) && (
            <span className="text-label-quaternary">·</span>
          )}
          {tool.platforms.android && (
            <span className="text-xs text-label-tertiary">Android</span>
          )}
          {tool.platforms.android && tool.platforms.web && (
            <span className="text-label-quaternary">·</span>
          )}
          {tool.platforms.web && (
            <span className="text-xs text-label-tertiary">Web</span>
          )}
        </div>

        {/* Bottom row */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-separator">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {/* Pricing - clear distinction between free, freemium, and trial */}
            <span className={pricingInfo.highlight ? "font-medium text-emerald-600" : "text-label-secondary"}>
              {pricingInfo.label}
            </span>
            {pricingInfo.sublabel && (
              <>
                <span className="text-label-quaternary">·</span>
                <span className="text-label-tertiary">
                  {pricingInfo.sublabel}
                </span>
              </>
            )}
            {/* Privacy - factual indicator, not unexplained grade */}
            {showPrivacyBadge && (
              <>
                <span className="text-label-quaternary">·</span>
                <span className="inline-flex items-center gap-1 text-label-tertiary" title="This app states they do not sell user data">
                  <Shield className="h-3 w-3" />
                  <span>No data selling</span>
                </span>
              </>
            )}
          </div>

          {/* CTA */}
          <ArrowRight className="h-4 w-4 text-label-quaternary transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
      </div>
    </Link>
  );
}

function formatReviews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return count.toString();
}

export default ToolCard;

"use client";

import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface ToolCardProps {
  tool: DigitalToolV3;
  showHubBadge?: boolean;
}

/**
 * ToolCard Component
 *
 * Reusable card for displaying tools in grids and lists.
 */
export function ToolCard({ tool, showHubBadge = false }: ToolCardProps) {
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

          {/* AI Badge */}
          {tool.ai_attributes.includes("ai-powered") && (
            <span className="text-xs font-medium text-label-tertiary px-2 py-0.5 rounded bg-canvas border border-separator">
              AI
            </span>
          )}
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
          <div className="flex items-center gap-3 text-xs">
            {/* Pricing */}
            {tool.pricing.free_tier && (
              <span className="text-label-secondary">Free tier</span>
            )}

            {/* Privacy */}
            {tool.privacy.grade && tool.privacy.grade !== "unknown" && (
              <span className="text-label-tertiary">
                Privacy: {tool.privacy.grade}
              </span>
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

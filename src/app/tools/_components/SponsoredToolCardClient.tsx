"use client";

// Client component for sponsored tool cards with analytics tracking
// Tracks sponsored impressions on mount and clicks on CTA

import { useEffect } from "react";
import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import {
  trackToolsSponsoredImpression,
  trackToolsSponsoredClick,
} from "@/lib/analytics/product-events";

interface SponsoredToolCardClientProps {
  toolSlug: string;
  toolName: string;
  toolRating?: number;
  shortDescription: string;
  disclosureLabel: string;
  destinationUrl: string;
  campaignId: string;
  placement: string;
  trackingId?: string;
}

export function SponsoredToolCardClient({
  toolSlug,
  toolName,
  toolRating,
  shortDescription,
  disclosureLabel,
  destinationUrl,
  campaignId,
  placement,
  trackingId,
}: SponsoredToolCardClientProps) {
  // Track impression on mount (deduplicated in trackToolsSponsoredImpression)
  useEffect(() => {
    trackToolsSponsoredImpression(toolSlug, campaignId, placement);
  }, [toolSlug, campaignId, placement]);

  const isExternal =
    destinationUrl.startsWith("http") &&
    !destinationUrl.includes("heypsych.com");

  const handleClick = () => {
    trackToolsSponsoredClick(toolSlug, campaignId, placement);
  };

  return (
    <div className="relative rounded-xl border border-separator bg-surface p-4 shadow-subtle">
      {/* Sponsored badge */}
      <div className="absolute right-3 top-3">
        <span
          className="rounded bg-caution/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-caution-700"
          aria-label="Sponsored listing"
        >
          {disclosureLabel}
        </span>
      </div>

      {/* Tool info */}
      <div className="pr-16">
        <h3 className="font-semibold text-label-primary">{toolName}</h3>
        {toolRating && (
          <div className="mt-1 flex items-center gap-1 text-sm text-label-secondary">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{toolRating}</span>
          </div>
        )}
      </div>

      <p className="mt-2 text-sm text-label-secondary line-clamp-2">
        {shortDescription}
      </p>

      {/* CTA */}
      <div className="mt-4">
        {isExternal ? (
          <a
            href={destinationUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            data-tracking-id={trackingId}
            onClick={handleClick}
          >
            Learn more
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <Link
            href={destinationUrl}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            onClick={handleClick}
          >
            View details
          </Link>
        )}
      </div>
    </div>
  );
}

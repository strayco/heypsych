"use client";

import Link from "next/link";
import { Shield, Info } from "lucide-react";

interface BoardAttributionProps {
  /**
   * Review label to display (e.g., "Reviewed by HeyPsych Board").
   * When undefined or empty, shows link to review methodology instead.
   */
  label?: string;
  /** URL for the review board or methodology page */
  url?: string;
  /** Date of last review (ISO format) */
  lastReviewed?: string;
  className?: string;
}

/**
 * BoardAttribution Component
 *
 * Displays review attribution ONLY when actual review evidence exists.
 * When no review evidence (label is undefined/empty), shows a link to
 * the review methodology for transparency.
 *
 * Phase 4 requirement: No unconditional review claims.
 */
export function BoardAttribution({
  label,
  url = "/about/medical-review-board",
  lastReviewed,
  className = "",
}: BoardAttributionProps) {
  // Gate: Only show review claim when we have actual review evidence
  const hasReviewEvidence = Boolean(label && label.trim());

  if (hasReviewEvidence) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Shield className="h-4 w-4 text-positive-600" />
        <Link
          href={url}
          className="text-label-secondary hover:text-accent hover:underline font-medium"
        >
          {label}
        </Link>
        {lastReviewed && (
          <span className="text-label-tertiary">
            · Last reviewed {formatDate(lastReviewed)}
          </span>
        )}
      </div>
    );
  }

  // No review evidence - show link to review methodology
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Info className="h-4 w-4 text-label-tertiary" />
      <Link
        href="/about/review-methodology"
        className="text-label-tertiary hover:text-accent hover:underline"
      >
        About our review process
      </Link>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default BoardAttribution;

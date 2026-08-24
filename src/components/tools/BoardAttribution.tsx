"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

interface BoardAttributionProps {
  label?: string;
  url?: string;
  lastReviewed?: string;
  className?: string;
}

/**
 * BoardAttribution Component
 * 
 * MANDATORY on all tool pages per spec.
 * Displays "Reviewed by HeyPsych Board" with link to review board page.
 */
export function BoardAttribution({
  label = "Reviewed by HeyPsych Board",
  url = "https://heypsych.com/about/medical-review-board",
  lastReviewed,
  className = "",
}: BoardAttributionProps) {
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Shield className="h-4 w-4 text-label-tertiary" />
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

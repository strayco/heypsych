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
      <Shield className="h-4 w-4 text-emerald-600" />
      <Link
        href={url}
        className="text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
      >
        {label}
      </Link>
      {lastReviewed && (
        <span className="text-neutral-500">
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

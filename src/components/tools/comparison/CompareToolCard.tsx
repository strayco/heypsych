"use client";

/**
 * CompareToolCard
 *
 * Tool card shown in the sticky header of comparison view.
 * Shows tool name, category badge, and remove button.
 */

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ClinicianTool } from "@/app/tools/compare/comparison-engine";

interface ToolAccent {
  bg: string;
  border: string;
  text: string;
  headerBg: string;
  dot: string;
}

interface CompareToolCardProps {
  tool: ClinicianTool;
  accent: ToolAccent;
  onRemove: () => void;
  isLast?: boolean;
}

export function CompareToolCard({
  tool,
  accent,
  onRemove,
  isLast = false,
}: CompareToolCardProps) {
  return (
    <div
      className={cn(
        "p-4 relative group",
        !isLast && "border-r border-separator/30",
        accent.headerBg
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Category Badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full mb-1.5",
              "bg-fill-tertiary text-label-secondary"
            )}
          >
            {formatCategory(tool.primary_category)}
          </span>

          {/* Tool Name */}
          <h3 className="font-semibold text-label-primary truncate">
            <Link
              href={`/tools/for-clinicians/${tool.primary_category}/${tool.slug}`}
              className="hover:text-accent transition-colors"
            >
              {tool.name}
            </Link>
          </h3>

          {/* Company - only show if different from tool name */}
          {tool.company_name && tool.company_name !== tool.name && (
            <p className="text-xs text-label-tertiary truncate mt-0.5">
              {tool.company_name}
            </p>
          )}
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="p-1.5 rounded-full text-label-quaternary hover:text-negative hover:bg-negative-50 motion-safe:transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label={`Remove ${tool.name}`}
        >
          <XIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Color indicator bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5",
          accent.dot.replace("bg-", "bg-")
        )}
      />
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    "ehr-practice-management": "EHR",
    "ai-scribe-documentation": "AI Scribe",
    "billing-rcm-insurance": "Billing",
    "billing-rcm": "Billing",
    "telehealth-communication": "Telehealth",
    "measurement-outcomes": "Measurement",
    "measurement-dtx": "Measurement",
    "provider-networks": "Networks",
    "intake-scheduling-forms": "Scheduling",
  };
  return labels[category] || category;
}

// =============================================================================
// ICONS
// =============================================================================

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default CompareToolCard;

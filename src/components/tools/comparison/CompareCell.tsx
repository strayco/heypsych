"use client";

/**
 * CompareCell
 *
 * Individual cell in a comparison showing a value with provenance.
 * Handles different data types and "Unknown" explicitly shown.
 */

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  ToolComparisonValue,
  ComparisonDataType,
} from "@/app/tools/compare/comparison-engine";

interface CompareCellProps {
  value?: ToolComparisonValue;
  dataType: ComparisonDataType;
  hasDifferences: boolean;
}

export function CompareCell({ value, dataType, hasDifferences }: CompareCellProps) {
  const [showProvenance, setShowProvenance] = useState(false);

  if (!value) {
    return (
      <span className="text-sm text-label-quaternary italic">Not available</span>
    );
  }

  const isUnknown = value.status === "unknown" || value.status === "not_verified";

  // Render based on data type
  const renderValue = () => {
    switch (dataType) {
      case "boolean":
        return renderBooleanValue(value);
      case "price":
        return renderPriceValue(value);
      case "list":
      case "tags":
        return renderListValue(value);
      case "integration_count":
        return renderIntegrationCount(value);
      case "capability":
        return renderCapabilityValue(value);
      default:
        return renderTextValue(value, hasDifferences);
    }
  };

  return (
    <div className="group relative">
      {renderValue()}

      {/* Provenance indicator */}
      {value.provenance && (
        <button
          onClick={() => setShowProvenance(!showProvenance)}
          className="ml-1 inline-flex items-center text-label-quaternary hover:text-label-secondary"
          aria-label="Show source information"
        >
          <ProvenanceIcon className="w-3 h-3" />
        </button>
      )}

      {/* Provenance popover */}
      {showProvenance && value.provenance && (
        <ProvenancePopover provenance={value.provenance} />
      )}

      {/* Notes */}
      {value.notes && (
        <p className="text-xs text-label-tertiary mt-1">{value.notes}</p>
      )}
    </div>
  );
}

// =============================================================================
// VALUE RENDERERS
// =============================================================================

function renderTextValue(value: ToolComparisonValue, hasDifferences: boolean) {
  const isUnknown = value.status === "unknown" || value.status === "not_verified";

  return (
    <span
      className={cn(
        "text-sm",
        isUnknown && "text-label-quaternary italic",
        !isUnknown && "text-label-primary",
        value.isHighlight && hasDifferences && "font-medium"
      )}
    >
      {value.display}
    </span>
  );
}

function renderBooleanValue(value: ToolComparisonValue) {
  const raw = value.raw;
  const isYes = raw === true || value.display.toLowerCase().startsWith("yes");
  const isNo = raw === false || value.display.toLowerCase().startsWith("no");
  const isUnknown = value.status === "unknown" || value.display === "Unknown";

  if (isUnknown) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-label-quaternary italic">
        <UnknownIcon className="w-4 h-4" />
        Unknown
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium",
        isYes && "text-positive-600",
        isNo && "text-label-tertiary"
      )}
    >
      {isYes ? (
        <CheckIcon className="w-4 h-4" />
      ) : isNo ? (
        <XIcon className="w-4 h-4" />
      ) : null}
      {value.display}
    </span>
  );
}

function renderPriceValue(value: ToolComparisonValue) {
  const isUnknown = value.status === "unknown" || value.display === "Contact for pricing";

  return (
    <span
      className={cn(
        "text-sm",
        isUnknown && "text-label-quaternary italic",
        !isUnknown && "text-label-primary font-medium"
      )}
    >
      {value.display}
    </span>
  );
}

function renderListValue(value: ToolComparisonValue) {
  const items = value.raw as string[] | undefined;
  const isUnknown = value.status === "unknown" || !items || items.length === 0;

  if (isUnknown) {
    return (
      <span className="text-sm text-label-quaternary italic">
        {value.display}
      </span>
    );
  }

  // Show first 3 items, with indicator if more
  const displayItems = items.slice(0, 3);
  const moreCount = items.length - 3;

  return (
    <div className="text-sm text-label-primary">
      {displayItems.join(", ")}
      {moreCount > 0 && (
        <span className="text-label-tertiary"> +{moreCount} more</span>
      )}
    </div>
  );
}

function renderIntegrationCount(value: ToolComparisonValue) {
  const count = value.raw as number | undefined;
  const isUnknown = value.status === "unknown" || count === undefined || count === 0;

  return (
    <span
      className={cn(
        "text-sm",
        isUnknown && "text-label-quaternary italic",
        !isUnknown && count && count > 5 && "font-medium text-positive-600",
        !isUnknown && "text-label-primary"
      )}
    >
      {value.display}
    </span>
  );
}

function renderCapabilityValue(value: ToolComparisonValue) {
  const hasCapability = value.raw === true;
  const isUnknown = value.status === "unknown";

  if (isUnknown) {
    return (
      <span className="text-sm text-label-quaternary italic">Unknown</span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        hasCapability && "text-positive-600",
        !hasCapability && "text-label-tertiary"
      )}
    >
      {hasCapability ? (
        <CheckIcon className="w-4 h-4" />
      ) : (
        <XIcon className="w-4 h-4" />
      )}
      {hasCapability ? "Yes" : "No"}
    </span>
  );
}

// =============================================================================
// PROVENANCE POPOVER
// =============================================================================

interface Provenance {
  source?: string;
  sourceUrl?: string;
  verifiedDate?: string;
  confidence?: "high" | "medium" | "low" | "unknown";
}

function ProvenancePopover({ provenance }: { provenance: Provenance }) {
  const confidenceColors: Record<string, string> = {
    high: "bg-positive-100 text-positive-700",
    medium: "bg-caution-100 text-caution-700",
    low: "bg-negative-100 text-negative-700",
    unknown: "bg-fill-tertiary text-label-tertiary",
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 z-50 bg-surface rounded-lg shadow-lg border border-separator p-3 min-w-48 motion-safe:animate-fade-in">
      <div className="text-xs space-y-1.5">
        {provenance.confidence && (
          <div className="flex items-center gap-2">
            <span className="text-label-tertiary">Confidence:</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-2xs font-medium",
                confidenceColors[provenance.confidence]
              )}
            >
              {provenance.confidence}
            </span>
          </div>
        )}
        {provenance.verifiedDate && (
          <div className="flex items-center gap-2">
            <span className="text-label-tertiary">Verified:</span>
            <span className="text-label-primary">{provenance.verifiedDate}</span>
          </div>
        )}
        {provenance.sourceUrl && (
          <div>
            <a
              href={provenance.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              View source
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ICONS
// =============================================================================

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

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

function UnknownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ProvenanceIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default CompareCell;

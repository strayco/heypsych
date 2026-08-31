// src/app/architect/_components/OverlapReviewPanel.tsx
// Detailed overlap review modal/panel for inspecting redundant products

"use client";

import { useMemo, useState } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle,
  Layers,
  Trash2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Info,
} from "lucide-react";
import type {
  ProductPairOverlap,
  OverlapAssessment,
  OverlapClassification,
} from "@/domains/architect/schemas";
import {
  OVERLAP_CLASSIFICATION_LABELS,
  OVERLAP_CLASSIFICATION_DESCRIPTIONS,
  OVERLAP_SEVERITY,
} from "@/domains/architect/schemas";
import { formatCost } from "@/domains/architect/engines";
import type { ArchitectProductDisplay } from "@/domains/architect/services";
import type { DemoProductDisplay } from "@/domains/architect/fixtures";

type ProductDisplay = DemoProductDisplay | ArchitectProductDisplay;

interface OverlapReviewPanelProps {
  overlaps: ProductPairOverlap[];
  legacyOverlaps?: OverlapAssessment[]; // For backwards compatibility
  productDisplayMap: Map<string, ProductDisplay>;
  onRemoveProduct: (slug: string) => void;
  onKeepBoth: (productASlug: string, productBSlug: string) => void;
  onClose: () => void;
}

export function OverlapReviewPanel({
  overlaps,
  legacyOverlaps,
  productDisplayMap,
  onRemoveProduct,
  onKeepBoth,
  onClose,
}: OverlapReviewPanelProps) {
  const [expandedPair, setExpandedPair] = useState<string | null>(null);

  // Get classification styling
  const getClassificationStyles = (classification: OverlapClassification) => {
    const severity = OVERLAP_SEVERITY[classification];
    switch (severity) {
      case "high":
        return {
          bg: "bg-error/10",
          border: "border-error/30",
          text: "text-error",
          icon: AlertTriangle,
        };
      case "medium":
        return {
          bg: "bg-warning/10",
          border: "border-warning/30",
          text: "text-warning",
          icon: Layers,
        };
      case "low":
      default:
        return {
          bg: "bg-accent/10",
          border: "border-accent/30",
          text: "text-accent",
          icon: CheckCircle,
        };
    }
  };

  // Sort overlaps by severity
  const sortedOverlaps = useMemo(() => {
    const severityOrder: OverlapClassification[] = [
      "probable-redundancy",
      "possible-redundancy",
      "intentional-overlap",
      "complementary",
    ];

    return [...overlaps].sort(
      (a, b) =>
        severityOrder.indexOf(a.classification) -
        severityOrder.indexOf(b.classification)
    );
  }, [overlaps]);

  // Count by severity
  const counts = useMemo(() => {
    const result = {
      probableRedundancy: 0,
      possibleRedundancy: 0,
      intentional: 0,
      complementary: 0,
    };

    for (const overlap of overlaps) {
      switch (overlap.classification) {
        case "probable-redundancy":
          result.probableRedundancy++;
          break;
        case "possible-redundancy":
          result.possibleRedundancy++;
          break;
        case "intentional-overlap":
          result.intentional++;
          break;
        case "complementary":
          result.complementary++;
          break;
      }
    }

    return result;
  }, [overlaps]);

  if (overlaps.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="mx-4 max-w-lg rounded-2xl bg-surface p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-label-primary">Feature Overlap Review</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-label-tertiary hover:bg-fill-secondary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-success" />
            <p className="mt-4 text-label-secondary">
              No significant overlap detected in your stack.
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-8">
      <div className="mx-4 w-full max-w-2xl rounded-2xl bg-surface shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-separator bg-surface px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-label-primary">Feature Overlap Review</h2>
            <p className="text-sm text-label-secondary">
              {overlaps.length} product pair{overlaps.length > 1 ? "s" : ""} with shared capabilities
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-label-tertiary hover:bg-fill-secondary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 border-b border-separator px-6 py-3">
          {counts.probableRedundancy > 0 && (
            <span className="rounded-full bg-error/10 px-3 py-1 text-xs font-medium text-error">
              {counts.probableRedundancy} probable redundanc{counts.probableRedundancy > 1 ? "ies" : "y"}
            </span>
          )}
          {counts.possibleRedundancy > 0 && (
            <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
              {counts.possibleRedundancy} possible redundanc{counts.possibleRedundancy > 1 ? "ies" : "y"}
            </span>
          )}
          {counts.intentional > 0 && (
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {counts.intentional} intentional
            </span>
          )}
          {counts.complementary > 0 && (
            <span className="rounded-full bg-fill-secondary px-3 py-1 text-xs font-medium text-label-tertiary">
              {counts.complementary} complementary
            </span>
          )}
        </div>

        {/* Overlap pairs */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {sortedOverlaps.map((overlap) => {
              const pairKey = `${overlap.productASlug}-${overlap.productBSlug}`;
              const isExpanded = expandedPair === pairKey;
              const styles = getClassificationStyles(overlap.classification);
              const IconComponent = styles.icon;

              const productAName =
                productDisplayMap.get(overlap.productASlug)?.name || overlap.productASlug;
              const productBName =
                productDisplayMap.get(overlap.productBSlug)?.name || overlap.productBSlug;

              return (
                <div
                  key={pairKey}
                  className={`rounded-xl border ${styles.border} ${styles.bg}`}
                >
                  {/* Pair header */}
                  <button
                    onClick={() => setExpandedPair(isExpanded ? null : pairKey)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-5 w-5 ${styles.text}`} />
                      <div>
                        <span className="font-medium text-label-primary">
                          {productAName} & {productBName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${styles.text}`}>
                            {OVERLAP_CLASSIFICATION_LABELS[overlap.classification]}
                          </span>
                          <span className="text-xs text-label-tertiary">
                            • {overlap.sharedCapabilities.length} shared capabilities
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-label-tertiary" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-label-tertiary" />
                    )}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-separator/50 px-4 py-4">
                      {/* Explanation */}
                      <p className="text-sm text-label-secondary">{overlap.explanation}</p>

                      {/* Classification description */}
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface/50 p-3 text-xs text-label-tertiary">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {OVERLAP_CLASSIFICATION_DESCRIPTIONS[overlap.classification]}
                      </div>

                      {/* Shared capabilities */}
                      <div className="mt-4">
                        <h4 className="text-xs font-medium uppercase tracking-wider text-label-tertiary">
                          Shared Capabilities
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {overlap.sharedCapabilities.map((cap) => (
                            <span
                              key={cap.capabilityId}
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                cap.isCoreForA || cap.isCoreForB
                                  ? "bg-error/10 text-error"
                                  : "bg-fill-secondary text-label-secondary"
                              }`}
                            >
                              {cap.capabilityName}
                              {(cap.isCoreForA || cap.isCoreForB) && " (core)"}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Unique capabilities */}
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {/* Product A unique */}
                        <div>
                          <h4 className="text-xs font-medium text-label-tertiary">
                            Unique to {productAName}
                          </h4>
                          {overlap.uniqueToA.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {overlap.uniqueToA.slice(0, 5).map((cap) => (
                                <span
                                  key={cap.capabilityId}
                                  className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success"
                                >
                                  {cap.capabilityName}
                                </span>
                              ))}
                              {overlap.uniqueToA.length > 5 && (
                                <span className="rounded-full bg-fill-secondary px-2 py-0.5 text-xs text-label-tertiary">
                                  +{overlap.uniqueToA.length - 5} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-label-tertiary">
                              No unique capabilities
                            </p>
                          )}
                        </div>

                        {/* Product B unique */}
                        <div>
                          <h4 className="text-xs font-medium text-label-tertiary">
                            Unique to {productBName}
                          </h4>
                          {overlap.uniqueToB.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {overlap.uniqueToB.slice(0, 5).map((cap) => (
                                <span
                                  key={cap.capabilityId}
                                  className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success"
                                >
                                  {cap.capabilityName}
                                </span>
                              ))}
                              {overlap.uniqueToB.length > 5 && (
                                <span className="rounded-full bg-fill-secondary px-2 py-0.5 text-xs text-label-tertiary">
                                  +{overlap.uniqueToB.length - 5} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-label-tertiary">
                              No unique capabilities
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Potential savings */}
                      {(overlap.potentialMonthlySavingsACents != null ||
                        overlap.potentialMonthlySavingsBCents != null) && (
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface/50 p-3">
                          <DollarSign className="h-4 w-4 text-success" />
                          <span className="text-sm text-label-secondary">
                            Potential savings:{" "}
                            {overlap.potentialMonthlySavingsACents != null && (
                              <span className="font-medium text-success">
                                {formatCost(overlap.potentialMonthlySavingsACents)}/mo
                              </span>
                            )}
                            {overlap.potentialMonthlySavingsACents != null &&
                              overlap.potentialMonthlySavingsBCents != null && " or "}
                            {overlap.potentialMonthlySavingsBCents != null && (
                              <span className="font-medium text-success">
                                {formatCost(overlap.potentialMonthlySavingsBCents)}/mo
                              </span>
                            )}
                            {" "}if one product removed
                          </span>
                        </div>
                      )}

                      {/* Confidence note */}
                      {overlap.confidenceLevel === "low" && (
                        <div className="mt-3 flex items-start gap-2 text-xs text-amber-600">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          Limited data confidence. Verify with vendors before making changes.
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-separator/50 pt-4">
                        <button
                          onClick={() => onRemoveProduct(overlap.productASlug)}
                          className="flex items-center gap-1.5 rounded-lg border border-separator px-3 py-1.5 text-sm text-label-secondary hover:bg-fill-secondary"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove {productAName}
                        </button>
                        <button
                          onClick={() => onRemoveProduct(overlap.productBSlug)}
                          className="flex items-center gap-1.5 rounded-lg border border-separator px-3 py-1.5 text-sm text-label-secondary hover:bg-fill-secondary"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove {productBName}
                        </button>
                        <button
                          onClick={() => onKeepBoth(overlap.productASlug, overlap.productBSlug)}
                          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Keep Both
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between rounded-b-2xl border-t border-separator bg-surface px-6 py-4">
          <p className="text-xs text-label-tertiary">
            Recommendations are based on capability data. Verify with vendors before purchase.
          </p>
          <button
            onClick={onClose}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// src/app/architect/_components/RecommendationSummary.tsx
// Displays the generated recommendation summary for "Build for Me" mode

"use client";

import { useMemo } from "react";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  DollarSign,
  Layers,
  Plus,
  ChevronRight,
  Sparkles,
  Info,
  RefreshCw,
} from "lucide-react";
import type { StackRecommendation, RecommendedProduct } from "@/domains/architect/engines";
import { formatCost } from "@/domains/architect/engines";
import { CAPABILITY_REGISTRY } from "@/domains/architect/schemas";
import type { ArchitectProductDisplay } from "@/domains/architect/services";
import type { DemoProductDisplay } from "@/domains/architect/fixtures";

interface RecommendationSummaryProps {
  recommendation: StackRecommendation;
  productDisplayMap: Map<string, DemoProductDisplay | ArchitectProductDisplay>;
  onAcceptAll: () => void;
  onAcceptProduct: (slug: string) => void;
  onRejectProduct: (slug: string) => void;
  onEditProfile: () => void;
  onRegenerate: () => void;
  onContinueManually: () => void;
}

export function RecommendationSummary({
  recommendation,
  productDisplayMap,
  onAcceptAll,
  onAcceptProduct,
  onRejectProduct,
  onEditProfile,
  onRegenerate,
  onContinueManually,
}: RecommendationSummaryProps) {
  const {
    products,
    totalCoveragePercent,
    totalEstimatedMonthlyCostCents,
    productsWithUnknownPricing,
    productsRequiringQuote,
    remainingGaps,
    summaryReasons,
    overallDataConfidence,
    hasLimitedData,
    isWithinBudget,
  } = recommendation;

  // Get coverage status
  const coverageStatus = useMemo(() => {
    if (totalCoveragePercent >= 90) return { level: "excellent", color: "text-success", bg: "bg-success/10" };
    if (totalCoveragePercent >= 70) return { level: "good", color: "text-accent", bg: "bg-accent/10" };
    if (totalCoveragePercent >= 50) return { level: "fair", color: "text-warning", bg: "bg-warning/10" };
    return { level: "limited", color: "text-error", bg: "bg-error/10" };
  }, [totalCoveragePercent]);

  // Group products by their primary added capability
  const productsByStage = useMemo(() => {
    const grouped = new Map<string, RecommendedProduct[]>();

    for (const product of products) {
      const primaryCap = product.addedCapabilities[0];
      const stage = primaryCap
        ? CAPABILITY_REGISTRY[primaryCap.capabilityId]?.stageId || "care"
        : "care";

      const existing = grouped.get(stage) || [];
      existing.push(product);
      grouped.set(stage, existing);
    }

    return grouped;
  }, [products]);

  // If no products recommended
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-2xl border border-separator bg-surface p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-warning" />
            <h2 className="mt-4 text-xl font-semibold text-label-primary">
              No Recommendations Available
            </h2>
            <p className="mt-2 text-label-secondary">
              {summaryReasons[0] || "We couldn't generate recommendations based on your profile."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={onEditProfile}
                className="rounded-lg bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-hover"
              >
                Complete Profile
              </button>
              <button
                onClick={onContinueManually}
                className="rounded-lg border border-separator px-6 py-2.5 font-medium text-label-primary hover:bg-fill-secondary"
              >
                Build Manually
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-24">
      {/* Header */}
      <div className="border-b border-separator bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-accent/10 p-3">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-label-primary">
                Your Recommended Stack
              </h1>
              <p className="mt-1 text-label-secondary">
                Based on your practice profile, here's a technology stack recommendation.
              </p>

              {/* Data confidence note */}
              {hasLimitedData && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Some product data is limited. Verify details with vendors before purchasing.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Products */}
          <div className="rounded-xl border border-separator bg-surface p-4">
            <div className="flex items-center gap-2 text-label-tertiary">
              <Layers className="h-4 w-4" />
              <span className="text-sm">Products</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-label-primary">
              {products.length}
            </div>
            <p className="text-xs text-label-tertiary">recommended</p>
          </div>

          {/* Coverage */}
          <div className={`rounded-xl border border-separator p-4 ${coverageStatus.bg}`}>
            <div className="flex items-center gap-2 text-label-tertiary">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Coverage</span>
            </div>
            <div className={`mt-2 text-2xl font-semibold ${coverageStatus.color}`}>
              {totalCoveragePercent}%
            </div>
            <p className="text-xs text-label-tertiary">of your needs</p>
          </div>

          {/* Cost */}
          <div className="rounded-xl border border-separator bg-surface p-4">
            <div className="flex items-center gap-2 text-label-tertiary">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">
                {productsWithUnknownPricing > 0 || productsRequiringQuote > 0 ? "Known Cost" : "Est. Monthly"}
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-label-primary">
              {totalEstimatedMonthlyCostCents !== null
                ? formatCost(totalEstimatedMonthlyCostCents)
                : "Varies"}
            </div>
            {/* Show incomplete pricing counts - both types are amber since they affect total accuracy */}
            {productsWithUnknownPricing > 0 && (
              <p className="text-xs text-amber-600">
                + {productsWithUnknownPricing} product{productsWithUnknownPricing > 1 ? "s" : ""} with unknown pricing
              </p>
            )}
            {productsRequiringQuote > 0 && (
              <p className="text-xs text-amber-600">
                + {productsRequiringQuote} requiring custom quote{productsRequiringQuote > 1 ? "s" : ""}
              </p>
            )}
            {/* Budget status with appropriate caveat when cost data is incomplete */}
            {isWithinBudget !== null && (
              <p className={`text-xs ${isWithinBudget ? "text-success" : "text-warning"}`}>
                {isWithinBudget
                  ? productsWithUnknownPricing > 0 || productsRequiringQuote > 0
                    ? "Known costs within budget"
                    : "Within budget"
                  : "Over budget"}
              </p>
            )}
          </div>

          {/* Gaps */}
          <div className="rounded-xl border border-separator bg-surface p-4">
            <div className="flex items-center gap-2 text-label-tertiary">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Gaps</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-label-primary">
              {remainingGaps.length}
            </div>
            <p className="text-xs text-label-tertiary">
              {remainingGaps.length === 0 ? "none remaining" : "to address manually"}
            </p>
          </div>
        </div>

        {/* Summary Reasons */}
        <div className="mt-6 rounded-xl border border-separator bg-surface p-4">
          <h3 className="text-sm font-medium text-label-primary">Why this stack?</h3>
          <ul className="mt-3 space-y-2">
            {summaryReasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-label-secondary">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Products */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h2 className="text-lg font-semibold text-label-primary">Recommended Products</h2>
        <p className="mt-1 text-sm text-label-secondary">
          Review each product and add them to your stack.
        </p>

        <div className="mt-4 space-y-4">
          {products.map((product) => {
            const display = productDisplayMap.get(product.slug);
            const name = display?.name || product.slug;

            return (
              <div
                key={product.slug}
                className="rounded-xl border border-separator bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-label-primary">{name}</h3>
                      {product.fitScore !== null && product.fitScore >= 70 && (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          {product.fitScore}% fit
                        </span>
                      )}
                      {product.isLimitedData && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                          Limited data
                        </span>
                      )}
                    </div>

                    {/* Reasoning */}
                    {product.reasoning.length > 0 && (
                      <p className="mt-1 text-sm text-label-secondary">
                        {product.reasoning.join(" • ")}
                      </p>
                    )}

                    {/* Added capabilities */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {product.addedCapabilities.slice(0, 5).map((cap) => (
                        <span
                          key={cap.capabilityId}
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            cap.relevance === "required"
                              ? "bg-accent/10 text-accent"
                              : cap.relevance === "strongly-recommended"
                              ? "bg-success/10 text-success"
                              : "bg-fill-secondary text-label-tertiary"
                          }`}
                        >
                          {cap.capabilityName}
                        </span>
                      ))}
                      {product.addedCapabilities.length > 5 && (
                        <span className="rounded-full bg-fill-secondary px-2 py-0.5 text-xs text-label-tertiary">
                          +{product.addedCapabilities.length - 5} more
                        </span>
                      )}
                    </div>

                    {/* Limitations */}
                    {product.knownLimitations.length > 0 && (
                      <div className="mt-2 text-xs text-amber-600">
                        <span className="font-medium">Note:</span>{" "}
                        {product.knownLimitations[0]}
                      </div>
                    )}
                  </div>

                  {/* Cost & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {product.estimatedMonthlyCostCents !== null ? (
                      <span className="text-sm font-medium text-label-primary">
                        {formatCost(product.estimatedMonthlyCostCents)}/mo
                      </span>
                    ) : product.requiresQuote ? (
                      <span className="text-xs text-label-tertiary">Custom quote</span>
                    ) : (
                      <span className="text-xs text-label-tertiary">Price varies</span>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => onRejectProduct(product.slug)}
                        className="rounded-lg border border-separator px-3 py-1.5 text-sm text-label-secondary hover:bg-fill-secondary"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => onAcceptProduct(product.slug)}
                        className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Remaining Gaps */}
      {remainingGaps.length > 0 && (
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h2 className="text-lg font-semibold text-label-primary">Gaps to Address</h2>
          <p className="mt-1 text-sm text-label-secondary">
            These capabilities weren't covered by the recommended products.
          </p>

          <div className="mt-4 rounded-xl border border-separator bg-surface">
            {remainingGaps.slice(0, 5).map((gap, idx) => (
              <div
                key={gap.capabilityId}
                className={`flex items-center justify-between px-4 py-3 ${
                  idx > 0 ? "border-t border-separator" : ""
                }`}
              >
                <div>
                  <span className="text-sm font-medium text-label-primary">
                    {gap.capabilityName}
                  </span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      gap.relevance === "required"
                        ? "bg-error/10 text-error"
                        : gap.relevance === "strongly-recommended"
                        ? "bg-warning/10 text-warning"
                        : "bg-fill-secondary text-label-tertiary"
                    }`}
                  >
                    {gap.relevance.replace("-", " ")}
                  </span>
                </div>
                <span className="text-xs text-label-tertiary">{gap.reason}</span>
              </div>
            ))}
            {remainingGaps.length > 5 && (
              <div className="border-t border-separator px-4 py-2 text-center text-xs text-label-tertiary">
                + {remainingGaps.length - 5} more gaps
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-separator bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex gap-2">
            <button
              onClick={onEditProfile}
              className="rounded-lg border border-separator px-4 py-2 text-sm font-medium text-label-secondary hover:bg-fill-secondary"
            >
              Edit Profile
            </button>
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 rounded-lg border border-separator px-4 py-2 text-sm font-medium text-label-secondary hover:bg-fill-secondary"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onContinueManually}
              className="rounded-lg border border-separator px-4 py-2 text-sm font-medium text-label-secondary hover:bg-fill-secondary"
            >
              Build Manually
            </button>
            <button
              onClick={onAcceptAll}
              className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Accept All ({products.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

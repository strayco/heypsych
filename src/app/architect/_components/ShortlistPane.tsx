// src/app/architect/_components/ShortlistPane.tsx
// Right pane showing product shortlist for selected capability

"use client";

import { useMemo, useState } from "react";
import { Plus, Check, Star, Info, ChevronRight, X, AlertCircle, HelpCircle } from "lucide-react";
import {
  type PracticeStack,
  type ProductArchitectureMetadata,
  type CapabilityId,
  type FitResult,
  getCapability,
  hasProduct,
} from "@/domains/architect/schemas";
import type { DemoProductDisplay } from "@/domains/architect/fixtures";
import type { ArchitectProductDisplay } from "@/domains/architect/services";
import { trackShortlistView, trackFitScoreView } from "@/domains/architect/analytics";

// Common display interface that both demo and real products satisfy
type ProductDisplay = DemoProductDisplay | ArchitectProductDisplay;

interface ShortlistPaneProps {
  stack: PracticeStack;
  metadataMap: Map<string, ProductArchitectureMetadata>;
  productDisplayMap: Map<string, ProductDisplay>;
  fitResultsMap: Map<string, FitResult>;
  selectedCapability: CapabilityId | null;
  onAddProduct: (slug: string, category: string) => void;
  isDemo: boolean;
}

interface ShortlistProduct {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  strength: string;
  fitScore: number | null;
  dataConfidence: number;
  isInStack: boolean;
  fitResult: FitResult | null;
  hasInsufficientData: boolean;
  hasHardIncompatibility: boolean;
}

export function ShortlistPane({
  stack,
  metadataMap,
  productDisplayMap,
  fitResultsMap,
  selectedCapability,
  onAddProduct,
  isDemo,
}: ShortlistPaneProps) {
  // State for fit explanation modal
  const [showFitExplanation, setShowFitExplanation] = useState<ShortlistProduct | null>(null);

  // Generate shortlist for selected capability using real fit scores
  const shortlist = useMemo((): ShortlistProduct[] => {
    if (!selectedCapability) return [];

    const products: ShortlistProduct[] = [];

    for (const [slug, metadata] of metadataMap) {
      const capMatch = metadata.capabilities.find(
        (c) => c.capabilityId === selectedCapability
      );

      if (capMatch) {
        const display = productDisplayMap.get(slug);
        const fitResult = fitResultsMap.get(slug) || null;

        // Use real fit score from engine, not hardcoded strength-based scores
        const fitScore = fitResult?.fitScore ?? null;
        const dataConfidence = fitResult?.dataConfidence ?? 0;
        const hasInsufficientData = fitResult?.isInsufficientData ?? true;
        const hasHardIncompatibility = fitResult?.hasHardIncompatibility ?? false;

        products.push({
          slug,
          name: display?.name || slug,
          tagline: display?.tagline || "",
          category: display?.category || "Unknown",
          strength: capMatch.strength,
          fitScore,
          dataConfidence,
          isInStack: hasProduct(stack, slug),
          fitResult,
          hasInsufficientData,
          hasHardIncompatibility,
        });
      }
    }

    // Sort by organic ranking value (fit score weighted by confidence), then in-stack first
    return products.sort((a, b) => {
      // Products already in stack come first
      if (a.isInStack !== b.isInStack) return a.isInStack ? -1 : 1;
      // Products with hard incompatibility go last
      if (a.hasHardIncompatibility !== b.hasHardIncompatibility) {
        return a.hasHardIncompatibility ? 1 : -1;
      }
      // Products with insufficient data go after products with scores
      if (a.hasInsufficientData !== b.hasInsufficientData) {
        return a.hasInsufficientData ? 1 : -1;
      }
      // Use organic ranking value (score + confidence) for ranking
      const aRank = a.fitResult?.organicRankingValue ?? 0;
      const bRank = b.fitResult?.organicRankingValue ?? 0;
      return bRank - aRank;
    });
  }, [selectedCapability, metadataMap, productDisplayMap, fitResultsMap, stack]);

  // Get capability info
  const capabilityInfo = selectedCapability
    ? getCapability(selectedCapability)
    : null;

  if (!selectedCapability) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-fill-secondary">
          <Info className="h-6 w-6 text-label-tertiary" />
        </div>
        <h3 className="mt-4 text-sm font-medium text-label-primary">
          Select a Capability
        </h3>
        <p className="mt-1 text-xs text-label-secondary">
          Choose a capability from the left to see product recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-separator p-4">
        <h3 className="text-sm font-semibold text-label-primary">
          {capabilityInfo?.name || "Products"}
        </h3>
        <p className="mt-1 text-xs text-label-secondary">
          {shortlist.length} product{shortlist.length === 1 ? "" : "s"} available
        </p>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-auto">
        {shortlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-label-secondary">
              No products found for this capability
            </p>
          </div>
        ) : (
          <div className="divide-y divide-separator">
            {shortlist.map((product) => (
              <div
                key={product.slug}
                onClick={() => {
                  if (!product.isInStack) {
                    onAddProduct(product.slug, product.category);
                  }
                }}
                className={`p-4 transition-all ${
                  product.isInStack
                    ? "bg-success/5"
                    : "hover:bg-fill-secondary/50 cursor-pointer"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-label-primary truncate">
                        {product.name}
                      </h4>
                      {product.isInStack && (
                        <span className="shrink-0 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                          In Stack
                        </span>
                      )}
                    </div>
                    {product.tagline && (
                      <p className="mt-0.5 text-xs text-label-tertiary truncate">
                        {product.tagline}
                      </p>
                    )}
                  </div>

                  {/* Add/In Stack button */}
                  {product.isInStack ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddProduct(product.slug, product.category);
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent hover:bg-accent/20"
                      title="Add to stack"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Fit Score & Strength */}
                <div className="mt-3 flex items-center gap-3">
                  {/* Fit Score - Real from engine */}
                  {product.hasHardIncompatibility ? (
                    <div className="flex items-center gap-1.5 text-xs text-error">
                      <AlertCircle className="h-3 w-3" />
                      <span>Not compatible</span>
                    </div>
                  ) : product.hasInsufficientData ? (
                    <div className="flex items-center gap-1.5 text-xs text-label-tertiary">
                      <HelpCircle className="h-3 w-3" />
                      <span>Limited data</span>
                    </div>
                  ) : product.fitScore !== null ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= Math.round(product.fitScore! / 20)
                                ? "fill-warning text-warning"
                                : "text-separator"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-label-secondary">
                        {product.fitScore}
                      </span>
                      {product.dataConfidence < 50 && (
                        <span className="text-[10px] text-label-tertiary" title="Data confidence">
                          ({product.dataConfidence}% data)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-label-tertiary">
                      <HelpCircle className="h-3 w-3" />
                      <span>Not evaluated</span>
                    </div>
                  )}

                  {/* Capability Strength */}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      product.strength === "core"
                        ? "bg-success/10 text-success"
                        : product.strength === "strong"
                        ? "bg-accent/10 text-accent"
                        : product.strength === "partial"
                        ? "bg-warning/10 text-warning"
                        : "bg-fill-secondary text-label-tertiary"
                    }`}
                  >
                    {product.strength}
                  </span>
                </div>

                {/* View Details Link - Now functional */}
                <button
                  className="mt-2 flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackFitScoreView(product.slug, product.fitScore ?? 0);
                    setShowFitExplanation(product);
                  }}
                >
                  Why this fits
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fit Explanation Modal */}
      {showFitExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-separator p-4">
              <h3 className="font-semibold text-label-primary">
                Fit Analysis: {showFitExplanation.name}
              </h3>
              <button
                onClick={() => setShowFitExplanation(null)}
                className="rounded-lg p-1.5 text-label-tertiary hover:bg-fill-secondary hover:text-label-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-[60vh] overflow-auto p-4">
              {showFitExplanation.hasHardIncompatibility ? (
                <div className="rounded-lg bg-error/10 p-4 text-sm text-error">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">Not Compatible</p>
                      <p className="mt-1 text-error/80">
                        {showFitExplanation.fitResult?.incompatibilityReason ||
                          "This product has hard requirements that don't match your practice profile."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : showFitExplanation.hasInsufficientData ? (
                <div className="rounded-lg bg-warning/10 p-4 text-sm text-warning">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">Limited Data Available</p>
                      <p className="mt-1 text-warning/80">
                        We don&apos;t have enough verified information about this product to calculate
                        a reliable fit score. Data confidence: {showFitExplanation.dataConfidence}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : showFitExplanation.fitResult ? (
                <div className="space-y-4">
                  {/* Overall Score */}
                  <div className="flex items-center justify-between rounded-lg bg-fill-secondary p-3">
                    <span className="text-sm font-medium text-label-primary">Practice Fit Score</span>
                    <span className="text-lg font-semibold text-accent">
                      {showFitExplanation.fitScore}
                    </span>
                  </div>

                  {/* Data Confidence */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-label-secondary">Data Confidence</span>
                    <span className={`font-medium ${
                      showFitExplanation.dataConfidence >= 70
                        ? "text-success"
                        : showFitExplanation.dataConfidence >= 40
                        ? "text-warning"
                        : "text-label-tertiary"
                    }`}>
                      {showFitExplanation.dataConfidence}%
                    </span>
                  </div>

                  {/* Dimension Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-label-tertiary">
                      Score Breakdown
                    </h4>
                    {showFitExplanation.fitResult.contributions.map((contrib) => (
                      <div
                        key={contrib.dimension}
                        className="rounded-lg border border-separator p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-label-primary capitalize">
                            {contrib.dimension.replace(/-/g, " ")}
                          </span>
                          <span className={`text-sm font-medium ${
                            contrib.evidence === "match"
                              ? "text-success"
                              : contrib.evidence === "partial"
                              ? "text-warning"
                              : contrib.evidence === "mismatch"
                              ? "text-error"
                              : "text-label-tertiary"
                          }`}>
                            {contrib.evidence === "unknown"
                              ? "Unknown"
                              : `${Math.round(contrib.score * 100)}%`}
                          </span>
                        </div>
                        {contrib.reasons.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {contrib.reasons.map((reason, idx) => (
                              <li key={idx} className="text-xs text-label-secondary">
                                • {reason}
                              </li>
                            ))}
                          </ul>
                        )}
                        {contrib.provenance && (
                          <p className="mt-1 text-[10px] text-label-tertiary">
                            Source: {contrib.provenance}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-fill-secondary p-4 text-center text-sm text-label-secondary">
                  No fit analysis available for this product.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-separator p-4">
              <button
                onClick={() => setShowFitExplanation(null)}
                className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

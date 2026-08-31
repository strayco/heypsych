/**
 * ProductDrawer Component
 *
 * Focused drawer/sheet for selecting a product when tapping
 * on an unresolved practice item. Shows:
 * - What this part does
 * - Why it applies to this practice
 * - Best-fit recommendation
 * - Simpler/advanced alternatives
 * - Coverage, pricing, limitations
 * - Add to practice action
 */

"use client";

import { useMemo, useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  Check,
  Star,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Plus,
  Sparkles,
  Info,
  Zap,
  Shield,
} from "lucide-react";
import type {
  ProductArchitectureMetadata,
  PracticeStack,
  CapabilityId,
  FitResult,
  StackCoverageResult,
} from "@/domains/architect/schemas";
import type { PracticeAreaItem, PracticeAreaId } from "./practice-areas";
import { PRACTICE_AREAS, getCapabilitiesForItem } from "./practice-areas";
import type { DemoProductDisplay } from "@/domains/architect/fixtures";
import type { ArchitectProductDisplay } from "@/domains/architect/services";
import {
  trackProductDrawerOpen,
  trackProductDrawerClose,
  trackRecommendationShown,
  trackRecommendationAccepted,
  trackProductDetailView,
} from "@/domains/architect/analytics";

type ProductDisplay = DemoProductDisplay | ArchitectProductDisplay;

interface RecommendedProduct {
  slug: string;
  display: ProductDisplay;
  metadata: ProductArchitectureMetadata;
  fitResult: FitResult;
  isPrimary?: boolean;
  isSimpler?: boolean;
  isAdvanced?: boolean;
  coveringCapabilities: CapabilityId[];
  alsoCovers?: string[]; // Other practice items this covers
}

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  areaId: PracticeAreaId;
  itemId: string;
  stack: PracticeStack;
  metadataMap: Map<string, ProductArchitectureMetadata>;
  productDisplayMap: Map<string, ProductDisplay>;
  fitResultsMap: Map<string, FitResult>;
  coverageResult: StackCoverageResult;
  onAddProduct: (slug: string, category: string) => void;
  onMarkComplete?: () => void; // For foundational items
  onMarkNotNeeded?: () => void;
  onDeferItem?: () => void;
  isDemo?: boolean;
}

export function ProductDrawer({
  isOpen,
  onClose,
  areaId,
  itemId,
  stack,
  metadataMap,
  productDisplayMap,
  fitResultsMap,
  coverageResult,
  onAddProduct,
  onMarkComplete,
  onMarkNotNeeded,
  onDeferItem,
  isDemo,
}: ProductDrawerProps) {
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Get the practice area and item
  const area = PRACTICE_AREAS[areaId];
  const item = area.items.find((i) => i.id === itemId);

  // Get capabilities for this item - memoized to stabilize dependencies
  const itemCapabilities = useMemo(
    () => (item ? getCapabilitiesForItem(areaId, itemId) : []),
    [item, areaId, itemId]
  );

  // For malpractice, find products by category instead of capability
  const malpracticeProducts = useMemo((): RecommendedProduct[] => {
    if (!item || itemId !== "malpractice") return [];

    const products: RecommendedProduct[] = [];

    for (const [slug, display] of productDisplayMap) {
      if (display.category !== "malpractice-insurance") continue;

      const metadata = metadataMap.get(slug);
      const fitResult = fitResultsMap.get(slug);

      if (!metadata || !fitResult) continue;

      products.push({
        slug,
        display,
        metadata,
        fitResult,
        coveringCapabilities: [],
      });
    }

    // Sort by fit score
    products.sort((a, b) => (b.fitResult.score || 0) - (a.fitResult.score || 0));

    // Mark primary
    if (products.length > 0) {
      products[0].isPrimary = true;
    }

    return products;
  }, [item, itemId, metadataMap, productDisplayMap, fitResultsMap]);

  // Find products that cover this item's capabilities
  const recommendations = useMemo((): RecommendedProduct[] => {
    if (!item || item.isFoundational) return [];

    const products: RecommendedProduct[] = [];

    for (const [slug, metadata] of metadataMap) {
      // Check which of this item's capabilities this product covers
      const coveringCaps = itemCapabilities.filter((cap) =>
        metadata.capabilities.some(
          (c) => c.capabilityId === cap && (c.strength === "core" || c.strength === "strong")
        )
      );

      if (coveringCaps.length === 0) continue;

      const display = productDisplayMap.get(slug);
      const fitResult = fitResultsMap.get(slug);

      if (!display || !fitResult) continue;

      // Check what other items this product covers
      const alsoCovers: string[] = [];
      for (const a of Object.values(PRACTICE_AREAS)) {
        for (const i of a.items) {
          if (a.id === areaId && i.id === itemId) continue;
          const iCaps = getCapabilitiesForItem(a.id, i.id);
          const covers = iCaps.some((cap) =>
            metadata.capabilities.some(
              (c) => c.capabilityId === cap && (c.strength === "core" || c.strength === "strong")
            )
          );
          if (covers) {
            alsoCovers.push(i.name);
          }
        }
      }

      products.push({
        slug,
        display,
        metadata,
        fitResult,
        coveringCapabilities: coveringCaps,
        alsoCovers: alsoCovers.slice(0, 5), // Limit display
      });
    }

    // Sort by fit score
    products.sort((a, b) => (b.fitResult.score || 0) - (a.fitResult.score || 0));

    // Mark primary, simpler, advanced
    if (products.length > 0) {
      products[0].isPrimary = true;
    }
    if (products.length > 2) {
      // Find simpler (fewer capabilities, lower price) and advanced (more capabilities)
      const primary = products[0];
      const primaryCapCount = primary.metadata.capabilities.length;

      for (let i = 1; i < products.length; i++) {
        const p = products[i];
        const capCount = p.metadata.capabilities.length;

        if (!products.some((x) => x.isSimpler) && capCount < primaryCapCount * 0.7) {
          p.isSimpler = true;
        } else if (!products.some((x) => x.isAdvanced) && capCount > primaryCapCount * 1.3) {
          p.isAdvanced = true;
        }
      }
    }

    return products;
  }, [item, itemCapabilities, metadataMap, productDisplayMap, fitResultsMap, areaId, itemId]);

  const primaryProduct = recommendations.find((p) => p.isPrimary);
  const simplerProduct = recommendations.find((p) => p.isSimpler);
  const advancedProduct = recommendations.find((p) => p.isAdvanced);
  const otherProducts = recommendations.filter(
    (p) => !p.isPrimary && !p.isSimpler && !p.isAdvanced
  );

  // Track drawer open and recommendations shown
  useEffect(() => {
    if (isOpen && item) {
      trackProductDrawerOpen(areaId, itemId, recommendations.length);

      // Track each recommendation shown
      if (primaryProduct) {
        trackRecommendationShown(
          primaryProduct.slug,
          1,
          "primary",
          primaryProduct.fitResult.score || 0
        );
      }
      if (simplerProduct) {
        trackRecommendationShown(
          simplerProduct.slug,
          2,
          "simpler",
          simplerProduct.fitResult.score || 0
        );
      }
      if (advancedProduct) {
        trackRecommendationShown(
          advancedProduct.slug,
          3,
          "advanced",
          advancedProduct.fitResult.score || 0
        );
      }
    }
  }, [isOpen, item, areaId, itemId, recommendations.length, primaryProduct, simplerProduct, advancedProduct]);

  // Track drawer close
  const handleClose = () => {
    trackProductDrawerClose(areaId, itemId);
    onClose();
  };

  // Check if item is already covered
  const isAlreadyCovered = useMemo(() => {
    for (const selected of stack.selectedProducts) {
      const metadata = metadataMap.get(selected.slug);
      if (metadata) {
        const covers = itemCapabilities.some((cap) =>
          metadata.capabilities.some(
            (c) => c.capabilityId === cap && (c.strength === "core" || c.strength === "strong")
          )
        );
        if (covers) return selected.slug;
      }
    }
    return null;
  }, [stack, metadataMap, itemCapabilities]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-hidden rounded-t-3xl bg-surface shadow-2xl animate-in slide-in-from-bottom duration-300 lg:left-auto lg:right-0 lg:top-0 lg:bottom-0 lg:w-[480px] lg:max-h-none lg:rounded-l-3xl lg:rounded-t-none">
        {/* Handle (mobile) */}
        <div className="flex justify-center py-3 lg:hidden">
          <div className="h-1 w-12 rounded-full bg-separator" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-separator px-6 pb-4 pt-2 lg:pt-6">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  areaId === "foundation"
                    ? "bg-slate-100 text-slate-700"
                    : areaId === "front-door"
                    ? "bg-blue-100 text-blue-700"
                    : areaId === "care"
                    ? "bg-rose-100 text-rose-700"
                    : areaId === "money"
                    ? "bg-emerald-100 text-emerald-700"
                    : areaId === "back-office"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {area.name}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold text-label-primary">{item.name}</h2>
            <p className="mt-1 text-sm text-label-secondary">{item.description}</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-label-tertiary hover:bg-fill-secondary hover:text-label-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto overscroll-contain px-6 py-4" style={{ maxHeight: "calc(90vh - 200px)" }}>
          {/* Foundation items - non-software */}
          {item.isFoundational && (
            <div className="space-y-4">
              <div className="rounded-xl border border-separator bg-fill-secondary p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 shrink-0 text-label-tertiary mt-0.5" />
                  <div>
                    <p className="text-sm text-label-primary">
                      This is a foundational requirement, not software. Mark it complete when you have it in place.
                    </p>
                    {itemId === "malpractice" && (
                      <p className="mt-2 text-xs text-label-tertiary">
                        Tip: Specialized mental health malpractice insurance is recommended over general liability coverage.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Malpractice has special handling - show insurance options */}
              {itemId === "malpractice" && malpracticeProducts.length > 0 && (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-label-secondary">Insurance Options</span>
                  </div>
                  <div className="space-y-2">
                    {malpracticeProducts.map((product) => (
                      <a
                        key={product.slug}
                        href={'websiteUrl' in product.display && product.display.websiteUrl ? product.display.websiteUrl : `/tools/for-clinicians/malpractice-insurance/${product.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-3 rounded-xl border border-separator bg-surface p-3 text-left transition-all hover:border-accent/30 hover:shadow-sm"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fill-secondary text-label-tertiary">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-label-primary">{product.display.name}</span>
                            {product.isPrimary && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                Popular
                              </span>
                            )}
                            <ExternalLink className="h-3 w-3 text-label-tertiary opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                          </div>
                          <p className="mt-0.5 text-xs text-label-secondary line-clamp-2">
                            {product.display.tagline}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {/* Malpractice has special handling - own vs employer coverage vs no coverage */}
                {itemId === "malpractice" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-label-tertiary text-center mb-1">Already have coverage?</p>
                    {/* Own coverage option - primary action */}
                    <button
                      onClick={() => {
                        onMarkComplete?.();
                        handleClose();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      I have my own coverage
                    </button>

                    {/* Employer coverage option - also counts as complete */}
                    <button
                      onClick={() => {
                        onMarkComplete?.();
                        handleClose();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-separator py-3 text-sm font-medium text-label-secondary hover:bg-fill-secondary transition-colors"
                    >
                      I have coverage through my employer
                    </button>

                    {/* No coverage option - acknowledged risk */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-amber-800">
                            Professional liability insurance is strongly recommended. Requirements vary by state, employer, payer, and contract.
                          </p>
                          <button
                            onClick={() => {
                              onMarkNotNeeded?.();
                              handleClose();
                            }}
                            className="mt-2 text-xs text-amber-700 underline underline-offset-2 hover:text-amber-800"
                          >
                            Continue without coverage
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onMarkNotNeeded?.();
                      handleClose();
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-separator py-3 text-sm font-medium text-label-secondary hover:bg-fill-secondary transition-colors"
                  >
                    Not Applicable to My Practice
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Software items - product recommendations */}
          {!item.isFoundational && (
            <div className="space-y-6">
              {/* Already covered notice */}
              {isAlreadyCovered && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">Already covered</p>
                      <p className="mt-0.5 text-sm text-emerald-700">
                        {productDisplayMap.get(isAlreadyCovered)?.name || isAlreadyCovered} includes this capability.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary recommendation */}
              {primaryProduct && !isAlreadyCovered && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-label-secondary">Best Fit</span>
                  </div>
                  <ProductCard
                    product={primaryProduct}
                    isPrimary
                    onAdd={() => {
                      onAddProduct(primaryProduct.slug, primaryProduct.display.category || "unknown");
                      handleClose();
                    }}
                    isDemo={isDemo}
                    recommendationPosition={1}
                    recommendationCount={recommendations.length}
                  />
                </div>
              )}

              {/* Alternatives */}
              {(simplerProduct || advancedProduct) && !isAlreadyCovered && (
                <div>
                  <div className="text-sm font-medium text-label-secondary mb-3">Alternatives</div>
                  <div className="space-y-3">
                    {simplerProduct && (
                      <ProductCard
                        product={simplerProduct}
                        badge={{ label: "Simpler", icon: Zap }}
                        onAdd={() => {
                          onAddProduct(simplerProduct.slug, simplerProduct.display.category || "unknown");
                          handleClose();
                        }}
                        isDemo={isDemo}
                        recommendationPosition={2}
                        recommendationCount={recommendations.length}
                      />
                    )}
                    {advancedProduct && (
                      <ProductCard
                        product={advancedProduct}
                        badge={{ label: "More Advanced", icon: TrendingUp }}
                        onAdd={() => {
                          onAddProduct(advancedProduct.slug, advancedProduct.display.category || "unknown");
                          handleClose();
                        }}
                        isDemo={isDemo}
                        recommendationPosition={3}
                        recommendationCount={recommendations.length}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Other products */}
              {otherProducts.length > 0 && !isAlreadyCovered && (
                <div>
                  <button
                    onClick={() => setShowAllProducts(!showAllProducts)}
                    className="flex w-full items-center justify-between py-2 text-sm font-medium text-label-secondary"
                  >
                    <span>
                      {showAllProducts ? "Hide" : "Show"} {otherProducts.length} more option{otherProducts.length > 1 ? "s" : ""}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${showAllProducts ? "rotate-90" : ""}`}
                    />
                  </button>
                  {showAllProducts && (
                    <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                      {otherProducts.map((product, idx) => (
                        <ProductCard
                          key={product.slug}
                          product={product}
                          compact
                          onAdd={() => {
                            onAddProduct(product.slug, product.display.category || "unknown");
                            handleClose();
                          }}
                          isDemo={isDemo}
                          recommendationPosition={4 + idx}
                          recommendationCount={recommendations.length}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No products found */}
              {recommendations.length === 0 && !isAlreadyCovered && (
                <div className="rounded-xl border border-separator bg-fill-secondary p-6 text-center">
                  <p className="text-sm text-label-secondary">
                    No products found for this capability yet.
                  </p>
                  <p className="mt-2 text-xs text-label-tertiary">
                    We&apos;re always adding new products to our catalog.
                  </p>
                </div>
              )}

              {/* Quick actions */}
              {!isAlreadyCovered && (
                <div className="border-t border-separator pt-4 flex gap-2">
                  <button
                    onClick={() => {
                      onDeferItem?.();
                      handleClose();
                    }}
                    className="flex-1 rounded-xl border border-separator py-2.5 text-sm text-label-secondary hover:bg-fill-secondary transition-colors"
                  >
                    Add Later
                  </button>
                  <button
                    onClick={() => {
                      onMarkNotNeeded?.();
                      handleClose();
                    }}
                    className="flex-1 rounded-xl border border-separator py-2.5 text-sm text-label-secondary hover:bg-fill-secondary transition-colors"
                  >
                    Not Needed
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Product card within the drawer
 */
function ProductCard({
  product,
  isPrimary,
  badge,
  compact,
  onAdd,
  isDemo,
  recommendationPosition,
  recommendationCount,
}: {
  product: RecommendedProduct;
  isPrimary?: boolean;
  badge?: { label: string; icon: typeof Star };
  compact?: boolean;
  onAdd: () => void;
  isDemo?: boolean;
  recommendationPosition?: number;
  recommendationCount?: number;
}) {
  const { display, metadata, fitResult, alsoCovers, coveringCapabilities } = product;

  // Wrap onAdd to also track recommendation_accepted
  const handleAdd = () => {
    if (recommendationPosition !== undefined && recommendationCount !== undefined) {
      trackRecommendationAccepted(product.slug, recommendationPosition, recommendationCount);
    }
    onAdd();
  };

  // Format price
  const formatPrice = () => {
    if (!metadata.pricing) return "Contact for pricing";

    const { minPriceCents, maxPriceCents, basis } = metadata.pricing;

    if (!minPriceCents && !maxPriceCents) return "Contact for pricing";

    const formatAmount = (cents: number) => {
      if (cents >= 100) return `$${Math.round(cents / 100)}`;
      return `$${(cents / 100).toFixed(2)}`;
    };

    const basisLabel =
      basis === "per-provider-month"
        ? "/provider/mo"
        : basis === "per-practice-month"
        ? "/mo"
        : basis === "percentage-collections"
        ? "% of collections"
        : "/mo";

    if (minPriceCents && maxPriceCents && minPriceCents !== maxPriceCents) {
      return `${formatAmount(minPriceCents)}–${formatAmount(maxPriceCents)}${basisLabel}`;
    }

    const price = minPriceCents || maxPriceCents;
    return price ? `${formatAmount(price)}${basisLabel}` : "Contact for pricing";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-separator p-3 hover:border-accent/50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-label-primary truncate">{display.name}</div>
          <div className="text-xs text-label-tertiary">{formatPrice()}</div>
        </div>
        <button
          onClick={handleAdd}
          className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
        >
          Add
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isPrimary
          ? "border-accent/30 bg-accent/5 shadow-sm"
          : "border-separator bg-surface hover:border-accent/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {badge && (
            <div className="mb-2 flex items-center gap-1.5">
              <badge.icon className="h-3.5 w-3.5 text-label-tertiary" />
              <span className="text-xs font-medium text-label-tertiary">{badge.label}</span>
            </div>
          )}
          <h3 className="font-semibold text-label-primary">{display.name}</h3>
          {'tagline' in display && display.tagline && (
            <p className="mt-0.5 text-sm text-label-secondary">{display.tagline}</p>
          )}
        </div>

        {/* Fit score */}
        {fitResult.score !== null && (
          <div className="ml-4 flex flex-col items-end">
            <div
              className={`text-lg font-bold ${
                fitResult.score >= 80
                  ? "text-emerald-600"
                  : fitResult.score >= 60
                  ? "text-amber-600"
                  : "text-label-secondary"
              }`}
            >
              {Math.round(fitResult.score)}
            </div>
            <div className="text-xs text-label-tertiary">fit score</div>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="mt-3 text-sm font-medium text-label-primary">{formatPrice()}</div>

      {/* Also covers */}
      {alsoCovers && alsoCovers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-xs text-label-tertiary">Also covers:</span>
          {alsoCovers.slice(0, 3).map((name) => (
            <span
              key={name}
              className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
            >
              {name}
            </span>
          ))}
          {alsoCovers.length > 3 && (
            <span className="rounded-full bg-fill-secondary px-2 py-0.5 text-xs text-label-tertiary">
              +{alsoCovers.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Limitations */}
      {metadata.capabilities.some((c) => c.limitation) && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            {metadata.capabilities.find((c) => c.limitation)?.limitation}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleAdd}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            isPrimary
              ? "bg-accent text-white hover:bg-accent-hover"
              : "bg-fill-secondary text-label-primary hover:bg-fill-tertiary"
          }`}
        >
          <Plus className="h-4 w-4" />
          Add to Practice
        </button>
        {!isDemo && (
          <a
            href={`/tools/for-clinicians/${display.category || "ehr"}/${product.slug}`}
            onClick={() => {
              // Track internal product detail view (not vendor visit - that's for external vendor links)
              trackProductDetailView(product.slug, display.category || "ehr");
            }}
            className="rounded-xl border border-separator px-3 py-2.5 text-label-secondary hover:bg-fill-secondary transition-colors"
            title="View full details"
          >
            <Info className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

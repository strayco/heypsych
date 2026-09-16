/**
 * Recommendation Panel
 *
 * Shows all product options for a component:
 * - Recommended (meet coverage threshold)
 * - Other options (partial coverage)
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, ChevronDown, ChevronUp, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ComponentId, PracticeProfile } from "@/domains/architect/schemas/practice-v2";
import {
  COMPONENT_DEFINITIONS,
  getProductComponentCoverage,
  getProductCapabilityCoverageForComponent,
  productHasAnyCapabilityForComponent,
} from "@/domains/architect/component-mapping";
import { useArchitectProducts } from "@/domains/architect/hooks/useArchitectProducts";
import type { ProductArchitectureMetadata } from "@/domains/architect/schemas/product-metadata";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";

/**
 * Popular tools in the mental health space, ranked by recognition/adoption.
 * Lower number = higher priority. Tools not in list get priority 999.
 */
const POPULAR_TOOLS: Record<string, number> = {
  // Top EHR/Practice Management - most recognized in mental health
  "simplepractice": 1,
  "therapynotes": 2,
  "jane-app": 3,
  "headway": 4,  // Very popular for insurance
  "alma": 5,
  // Strong second tier
  "luminello": 10,
  "valant": 11,
  "theranest": 12,
  "session-health": 13,
  "practice-better": 14,
  "healthie": 15,
  "owl-practice": 16,
  "my-clients-plus": 17,
  // Specialized/niche but well-known
  "blueprint-health": 20,
  "measurement-care": 21,
  "mirah": 22,
  // Telehealth specific
  "doxy-me": 30,
  "zoom-healthcare": 31,
  // Billing specific
  "ivypay": 40,
  "rectangle-health": 41,
  "tebra": 42,
  "kareo": 43,
  // Documentation/AI scribes
  "freed-ai": 50,
  "mentalyc": 51,
  "upheal": 52,
  "autonotes": 53,
  // Intake specific
  "intakeq": 60,
  "jotform-hipaa": 61,
  // General EHR (multi-specialty but used in mental health)
  "drchrono": 70,
  "athenahealth": 71,
  "advancedmd": 72,
  "elation-health": 73,
};

/** Maximum products to show initially */
const INITIAL_DISPLAY_LIMIT = 10;

interface RecommendationPanelProps {
  componentId: ComponentId;
  profile?: PracticeProfile;
  /** Slugs of products already in the stack */
  selectedSlugs?: string[];
  onSelectSolution: (
    product: ProductArchitectureMetadata,
    productName: string,
    coverage: ComponentId[]
  ) => void;
  /** Handler to remove a solution from the stack */
  onRemoveSolution?: (productSlug: string) => void;
}

interface ProductOption {
  product: ProductArchitectureMetadata;
  displayProduct: {
    name: string;
    tagline?: string;
    priceCents?: number;
  };
  coverage: ComponentId[];
  componentCoverage: {
    covered: number;
    total: number;
    ratio: number;
  };
  isRecommended: boolean;
  /** URL to the detailed tool page */
  toolPageUrl: string;
  /** Add-on pricing info for the current component (if capability requires add-on) */
  addonPricing?: {
    priceCents: number;
    capabilityName: string;
  };
}

/**
 * Get add-on pricing for a product's coverage of a specific component.
 * Returns pricing info if any of the component's capabilities require an add-on.
 */
function getAddonPricingForComponent(
  product: ProductArchitectureMetadata,
  componentId: ComponentId
): { priceCents: number; capabilityName: string } | undefined {
  const componentDef = COMPONENT_DEFINITIONS[componentId];
  if (!componentDef.capabilities.length) return undefined;

  // Check each of the component's capabilities to see if it's an add-on for this product
  for (const capId of componentDef.capabilities) {
    const capability = product.capabilities.find((c) => c.capabilityId === capId);
    if (capability?.requiresAddon && capability.addonPriceCents) {
      return {
        priceCents: capability.addonPriceCents,
        capabilityName: componentDef.name,
      };
    }
  }

  return undefined;
}

export function RecommendationPanel({
  componentId,
  profile,
  selectedSlugs = [],
  onSelectSolution,
  onRemoveSolution,
}: RecommendationPanelProps) {
  const { metadataMap, displayMap, isLoading, loadingProgress } = useArchitectProducts();
  const [justSelectedSlug, setJustSelectedSlug] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Create a Set for O(1) lookup
  const selectedSlugSet = useMemo(() => new Set(selectedSlugs), [selectedSlugs]);

  // Check if a product is already in the stack
  const isInStack = useCallback(
    (slug: string) => selectedSlugSet.has(slug),
    [selectedSlugSet]
  );

  const component = COMPONENT_DEFINITIONS[componentId];

  // Build all products with coverage info for this component
  const allProducts = useMemo((): ProductOption[] => {
    const result: ProductOption[] = [];

    for (const [slug, metadata] of metadataMap) {
      // Check if this product has ANY capability for this component
      if (!productHasAnyCapabilityForComponent(metadata, componentId)) {
        continue;
      }

      const display = displayMap.get(slug);
      const fullCoverage = getProductComponentCoverage(metadata);
      // Use "addon" threshold to include products that offer capability via add-on
      const componentCoverageInfo = getProductCapabilityCoverageForComponent(
        metadata,
        componentId,
        "addon"
      );

      if (!componentCoverageInfo) continue;

      result.push({
        product: metadata,
        displayProduct: {
          name: display?.name ?? slug,
          tagline: display?.tagline,
          priceCents: metadata.pricing?.minPriceCents,
        },
        coverage: fullCoverage,
        componentCoverage: {
          covered: componentCoverageInfo.coveredCapabilities,
          total: componentCoverageInfo.totalCapabilities,
          ratio: componentCoverageInfo.coverageRatio,
        },
        isRecommended: componentCoverageInfo.meetsThreshold,
        toolPageUrl: `/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[display?.category as keyof typeof SCHEMA_TO_TAXONOMY_CATEGORY] ?? display?.category ?? "ehr-practice-management"}/${slug}/`,
        addonPricing: getAddonPricingForComponent(metadata, componentId),
      });
    }

    // Sort: in-stack first, then by popularity, then recommended, then by coverage
    result.sort((a, b) => {
      const aInStack = selectedSlugSet.has(a.product.productSlug);
      const bInStack = selectedSlugSet.has(b.product.productSlug);

      // In-stack products always come first
      if (aInStack !== bInStack) {
        return aInStack ? -1 : 1;
      }

      // Then by popularity (lower number = more popular)
      const aPopularity = POPULAR_TOOLS[a.product.productSlug] ?? 999;
      const bPopularity = POPULAR_TOOLS[b.product.productSlug] ?? 999;
      if (aPopularity !== bPopularity) {
        return aPopularity - bPopularity;
      }

      // Then by recommended status
      if (a.isRecommended !== b.isRecommended) {
        return a.isRecommended ? -1 : 1;
      }

      // Then by coverage ratio
      const ratioDiff = b.componentCoverage.ratio - a.componentCoverage.ratio;
      if (Math.abs(ratioDiff) > 0.01) return ratioDiff;

      return a.displayProduct.name.localeCompare(b.displayProduct.name);
    });

    return result;
  }, [metadataMap, displayMap, componentId, selectedSlugSet]);

  // Split products into two groups: in-stack and available
  const inStackProducts = useMemo(
    () => allProducts.filter((p) => selectedSlugSet.has(p.product.productSlug)),
    [allProducts, selectedSlugSet]
  );

  const availableProducts = useMemo(
    () => allProducts.filter((p) => !selectedSlugSet.has(p.product.productSlug)),
    [allProducts, selectedSlugSet]
  );

  // Handle selection
  const handleSelect = (option: ProductOption) => {
    // Don't allow selecting if already in stack
    if (isInStack(option.product.productSlug)) return;

    setJustSelectedSlug(option.product.productSlug);
    onSelectSolution(option.product, option.displayProduct.name, option.coverage);
  };

  // Skip for external components (malpractice)
  if (component.isExternal) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-label-primary">
          Finding options...
        </h3>
        <div className="flex items-center gap-2 text-sm text-label-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading products ({Math.round(loadingProgress)}%)</span>
        </div>
      </div>
    );
  }

  // No products
  if (allProducts.length === 0) {
    return (
      <div className="rounded-xl border border-separator bg-fill-quaternary p-4 text-center">
        <p className="text-sm text-label-secondary">
          No products found for {component.name.toLowerCase()}.
        </p>
      </div>
    );
  }

  // Products to display (limited initially)
  const displayedProducts = showAll
    ? availableProducts
    : availableProducts.slice(0, INITIAL_DISPLAY_LIMIT);
  const hiddenCount = availableProducts.length - displayedProducts.length;

  return (
    <div className="space-y-4">
      {/* In-stack section - always at top */}
      {inStackProducts.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-positive">
            <Check className="h-4 w-4" />
            In your stack ({inStackProducts.length})
          </h3>

          {/* Overlap warning */}
          {inStackProducts.length > 1 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <p className="text-xs font-medium text-amber-800">
                {inStackProducts.length} tools overlap on {component.name.toLowerCase()}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                You may be paying for duplicate functionality.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {inStackProducts.map((option, index) => (
              <ProductCard
                key={option.product.productSlug}
                option={option}
                currentComponentId={componentId}
                isInStack={true}
                isJustSelected={false}
                onSelect={() => {}}
                onRemove={onRemoveSolution ? () => onRemoveSolution(option.product.productSlug) : undefined}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available options - sorted by popularity */}
      {availableProducts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-label-primary">
            Popular options
          </h3>
          <div className="space-y-2">
            {displayedProducts.map((option, index) => (
              <ProductCard
                key={option.product.productSlug}
                option={option}
                currentComponentId={componentId}
                isInStack={false}
                isJustSelected={justSelectedSlug === option.product.productSlug}
                onSelect={() => handleSelect(option)}
                index={inStackProducts.length + index}
              />
            ))}
          </div>

          {/* Load more button */}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-separator bg-fill-quaternary py-2.5 text-sm font-medium text-label-secondary hover:bg-fill-tertiary transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
              Load {hiddenCount} more options
            </button>
          )}

          {/* Show less button when expanded */}
          {showAll && availableProducts.length > INITIAL_DISPLAY_LIMIT && (
            <button
              onClick={() => setShowAll(false)}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-separator bg-fill-quaternary py-2.5 text-sm font-medium text-label-secondary hover:bg-fill-tertiary transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  option,
  currentComponentId,
  isInStack,
  isJustSelected,
  onSelect,
  onRemove,
  index,
}: {
  option: ProductOption;
  currentComponentId: ComponentId;
  isInStack: boolean;
  isJustSelected: boolean;
  onSelect: () => void;
  onRemove?: () => void;
  index: number;
}) {
  const formatPrice = (cents?: number): string => {
    if (!cents) return "Contact for pricing";
    return `$${Math.round(cents / 100)}/mo`;
  };

  const coverageLabel = `${option.componentCoverage.covered}/${option.componentCoverage.total} capabilities`;
  const coveragePercent = Math.round(option.componentCoverage.ratio * 100);

  // Products in stack get special styling
  const isDisabled = isInStack || isJustSelected;

  return (
    <motion.div
      className={`
        w-full rounded-xl border p-3 text-left transition-all
        ${isInStack
          ? "bg-positive/10 border-positive/40 ring-2 ring-positive/30"
          : option.isRecommended
            ? "bg-accent/5 border-accent/30 ring-1 ring-accent/10"
            : "bg-surface border-separator"
        }
        ${!isDisabled && "hover:shadow-soft cursor-pointer"}
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
        ${isDisabled ? "cursor-default" : ""}
      `}
      onClick={isDisabled ? undefined : onSelect}
      role={isDisabled ? undefined : "button"}
      tabIndex={isDisabled ? undefined : 0}
      onKeyDown={isDisabled ? undefined : (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* In stack badge */}
          {isInStack && (
            <span className="inline-flex items-center gap-1 rounded-full bg-positive px-2 py-0.5 text-xs font-medium text-white mb-1">
              <Check className="h-3 w-3" />
              In your stack
            </span>
          )}

          {/* Product name */}
          <h4 className="font-semibold text-label-primary text-sm">
            {option.displayProduct.name}
          </h4>

          {/* Tagline */}
          {option.displayProduct.tagline && (
            <p className="mt-0.5 text-xs text-label-secondary line-clamp-1">
              {option.displayProduct.tagline}
            </p>
          )}

          {/* Coverage info */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-fill-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isInStack
                    ? "bg-positive"
                    : option.isRecommended
                      ? "bg-accent"
                      : "bg-label-tertiary"
                }`}
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <span className="text-xs text-label-tertiary whitespace-nowrap">
              {coverageLabel}
            </span>
          </div>

          {/* Coverage visualization - show all components this product covers */}
          {option.coverage.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {option.coverage.map((compId) => {
                const comp = COMPONENT_DEFINITIONS[compId];
                const isCurrent = compId === currentComponentId;
                return (
                  <span
                    key={compId}
                    className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      isCurrent
                        ? isInStack
                          ? "bg-positive/20 text-positive"
                          : "bg-accent/20 text-accent"
                        : "bg-fill-tertiary text-label-tertiary"
                    }`}
                  >
                    <Check className="h-2.5 w-2.5" />
                    {comp.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Price, status, and info link */}
        <div className="shrink-0 text-right space-y-1">
          <span className="text-sm font-medium text-label-primary">
            {formatPrice(option.displayProduct.priceCents)}
          </span>
          {/* Add-on pricing for current component */}
          {option.addonPricing && (
            <div className="text-xs text-amber-600 font-medium">
              +{formatPrice(option.addonPricing.priceCents)} add-on
            </div>
          )}
          {isJustSelected && !isInStack && (
            <div className="flex items-center justify-end gap-1 text-xs font-medium text-positive">
              <Check className="h-3 w-3" />
              Added
            </div>
          )}
          <Link
            href={option.toolPageUrl}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-end gap-1 text-xs text-accent hover:underline"
          >
            Details
            <ExternalLink className="h-3 w-3" />
          </Link>
          {isInStack && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="flex items-center justify-end gap-1 text-xs text-negative hover:underline"
            >
              Remove
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

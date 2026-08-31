/**
 * PracticeCanvas Component
 *
 * A true spatial practice configurator where products are placed once
 * and visually connect to the requirements they cover.
 *
 * Core principles:
 * - Each product appears exactly ONCE as a visual object in its "home" area
 * - Covered requirements show status indicators, not repeated product names
 * - Connections (when selected) show relationships between products and needs
 * - The experience feels like furnishing a space, not filling a spreadsheet
 */

"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  DoorOpen,
  Heart,
  DollarSign,
  Briefcase,
  TrendingUp,
  Check,
  Plus,
  X,
  ChevronRight,
  Link as LinkIcon,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  type PracticeAreaId,
  type PracticeAreaItem,
  type PracticeItemStatus,
  type ItemRelevance,
  PRACTICE_AREAS,
  getOrderedPracticeAreas,
  getItemRelevance,
} from "./practice-areas";
import type {
  PracticeStack,
  ProductArchitectureMetadata,
  StackCoverageResult,
  CapabilityId,
} from "@/domains/architect/schemas";
import { getItemDecision } from "@/domains/architect/schemas";
import { getAllCapabilityRelevance, type RelevanceResult } from "@/domains/architect/engines/relevance-engine";

// ============================================================================
// Types
// ============================================================================

interface ProductDisplay {
  slug: string;
  name: string;
  category?: string;
  tagline?: string;
}

/**
 * A placed product with its home location and coverage analysis
 */
interface PlacedProduct {
  slug: string;
  name: string;
  category: string;
  homeArea: PracticeAreaId;
  homeItemId: string;
  coveredItems: Array<{
    areaId: PracticeAreaId;
    itemId: string;
    itemName: string;
  }>;
  coverageByArea: Map<PracticeAreaId, string[]>;
  totalCoverage: number;
}

/**
 * A requirement slot with its coverage status
 */
interface RequirementSlot {
  item: PracticeAreaItem;
  status: "empty" | "covered" | "included" | "complete" | "deferred" | "not-needed";
  relevance: ItemRelevance;
  isRelevant: boolean;
  coveringProductSlug?: string;
  isHomeForProduct?: string; // If this slot is where a product "lives"
}

/**
 * An area with its slots and any products placed in it
 */
interface AreaData {
  areaId: PracticeAreaId;
  config: AreaConfig;
  slots: RequirementSlot[];
  placedProducts: PlacedProduct[];
  coveredCount: number;
  totalCount: number;
  isComplete: boolean;
}

interface AreaConfig {
  icon: LucideIcon;
  color: string;
  bgLight: string;
  bgMedium: string;
  border: string;
  text: string;
  label: string;
}

// ============================================================================
// Configuration
// ============================================================================

const AREA_CONFIG: Record<PracticeAreaId, AreaConfig> = {
  foundation: {
    icon: Shield,
    color: "slate",
    bgLight: "bg-slate-50",
    bgMedium: "bg-slate-100",
    border: "border-slate-300",
    text: "text-slate-700",
    label: "Foundation",
  },
  "front-door": {
    icon: DoorOpen,
    color: "blue",
    bgLight: "bg-blue-50",
    bgMedium: "bg-blue-100",
    border: "border-blue-300",
    text: "text-blue-700",
    label: "Front Door",
  },
  care: {
    icon: Heart,
    color: "rose",
    bgLight: "bg-rose-50",
    bgMedium: "bg-rose-100",
    border: "border-rose-300",
    text: "text-rose-700",
    label: "Care",
  },
  money: {
    icon: DollarSign,
    color: "emerald",
    bgLight: "bg-emerald-50",
    bgMedium: "bg-emerald-100",
    border: "border-emerald-300",
    text: "text-emerald-700",
    label: "Money",
  },
  "back-office": {
    icon: Briefcase,
    color: "amber",
    bgLight: "bg-amber-50",
    bgMedium: "bg-amber-100",
    border: "border-amber-300",
    text: "text-amber-700",
    label: "Back Office",
  },
  growth: {
    icon: TrendingUp,
    color: "purple",
    bgLight: "bg-purple-50",
    bgMedium: "bg-purple-100",
    border: "border-purple-300",
    text: "text-purple-700",
    label: "Growth",
  },
};

// ============================================================================
// Main Component
// ============================================================================

interface PracticeCanvasProps {
  stack: PracticeStack;
  metadataMap: Map<string, ProductArchitectureMetadata>;
  productDisplayMap: Map<string, ProductDisplay>;
  coverageResult: StackCoverageResult;
  /** Pre-computed placed products from parent (via usePlacedProducts hook) */
  placedProducts: PlacedProduct[];
  showAllItems?: boolean;
  onSelectItem: (areaId: PracticeAreaId, itemId: string) => void;
  /** Callback when a product is selected/deselected (for coordination with ToolsRail) */
  onSelectProduct?: (slug: string | null) => void;
  onRemoveProduct?: (slug: string) => void;
  recommendedItem?: { areaId: PracticeAreaId; itemId: string } | null;
  /** Controlled selection from parent (for coordination with ToolsRail) */
  selectedProductSlug?: string | null;
}

export function PracticeCanvas({
  stack,
  metadataMap,
  productDisplayMap,
  coverageResult,
  placedProducts,
  showAllItems = false,
  onSelectItem,
  onSelectProduct,
  onRemoveProduct,
  recommendedItem,
  selectedProductSlug: controlledSelectedSlug,
}: PracticeCanvasProps) {
  // Support both controlled and uncontrolled selection
  const [internalSelectedSlug, setInternalSelectedSlug] = useState<string | null>(null);
  const selectedProductSlug = controlledSelectedSlug ?? internalSelectedSlug;
  const setSelectedProductSlug = useCallback((slug: string | null) => {
    setInternalSelectedSlug(slug);
    onSelectProduct?.(slug);
  }, [onSelectProduct]);

  const [isMobile, setIsMobile] = useState(false);
  const [mobileActiveArea, setMobileActiveArea] = useState<PracticeAreaId>("care");
  const canvasRef = useRef<HTMLDivElement>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate capability relevance from fingerprint
  const capabilityRelevanceMap = useMemo(
    () => getAllCapabilityRelevance(stack.fingerprint),
    [stack.fingerprint]
  );

  // Build area data with slots and placed products
  // Note: placedProducts is now passed as a prop from parent (computed via usePlacedProducts hook)
  const areasData = useMemo((): AreaData[] => {
    const areas = getOrderedPracticeAreas();

    return areas.map(area => {
      const config = AREA_CONFIG[area.id];

      // Find products that live in this area
      const areaProducts = placedProducts.filter(p => p.homeArea === area.id);

      // Build slots with coverage info
      const slots: RequirementSlot[] = area.items.map(item => {
        const { relevance, isRelevant } = getItemRelevance(item, capabilityRelevanceMap);
        const decision = getItemDecision(stack, area.id, item.id);

        // Check if a product lives here
        const homeProduct = areaProducts.find(p => p.homeItemId === item.id);

        // Check if covered by any product
        let coveringProductSlug: string | undefined;
        for (const product of placedProducts) {
          const coveredInArea = product.coverageByArea.get(area.id);
          if (coveredInArea?.includes(item.id)) {
            coveringProductSlug = product.slug;
            break;
          }
        }

        // Determine status
        let status: RequirementSlot["status"] = "empty";

        if (!isRelevant && !decision && !showAllItems) {
          status = "not-needed";
        } else if (decision === "not-needed") {
          status = "not-needed";
        } else if (decision === "add-later") {
          status = "deferred";
        } else if (decision === "complete") {
          status = "complete";
        } else if (homeProduct) {
          status = "covered"; // Product lives here
        } else if (coveringProductSlug) {
          status = "included"; // Covered by a product elsewhere
        }

        return {
          item,
          status,
          relevance,
          isRelevant,
          coveringProductSlug,
          isHomeForProduct: homeProduct?.slug,
        };
      });

      const relevantSlots = showAllItems ? slots : slots.filter(s => s.isRelevant);
      const coveredCount = relevantSlots.filter(
        s => s.status === "covered" || s.status === "included" || s.status === "complete"
      ).length;

      return {
        areaId: area.id,
        config,
        slots: relevantSlots,
        placedProducts: areaProducts,
        coveredCount,
        totalCount: relevantSlots.length,
        isComplete: coveredCount === relevantSlots.length && relevantSlots.length > 0,
      };
    });
  }, [stack, placedProducts, capabilityRelevanceMap, showAllItems]);

  // Handle product selection (toggle)
  const handleProductSelect = useCallback((slug: string) => {
    const newSlug = selectedProductSlug === slug ? null : slug;
    setSelectedProductSlug(newSlug);
  }, [selectedProductSlug, setSelectedProductSlug]);

  // Get selected product data
  const selectedProduct = selectedProductSlug
    ? placedProducts.find(p => p.slug === selectedProductSlug) ?? null
    : null;

  if (isMobile) {
    return (
      <MobilePracticeCanvas
        areasData={areasData}
        placedProducts={placedProducts}
        selectedProduct={selectedProduct}
        activeArea={mobileActiveArea}
        onChangeArea={setMobileActiveArea}
        onSelectItem={onSelectItem}
        recommendedItem={recommendedItem}
      />
    );
  }

  return (
    <div ref={canvasRef} className="relative">
      {/* The Practice Space */}
      <div className="relative rounded-3xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 overflow-hidden">
        {/* Subtle blueprint grid */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative p-6">
          {/* Main Practice Layout */}
          <div className="grid grid-cols-12 gap-4 min-h-[560px]">

            {/* Left: Front Door */}
            <div className="col-span-3 flex flex-col">
              {areasData.find(a => a.areaId === "front-door") && (
                <AreaZone
                  data={areasData.find(a => a.areaId === "front-door")!}
                  selectedProduct={selectedProduct}
                  placedProducts={placedProducts}
                  onSelectItem={(itemId) => onSelectItem("front-door", itemId)}
                  recommendedItem={recommendedItem?.areaId === "front-door" ? recommendedItem : null}
                />
              )}
            </div>

            {/* Center: Care (the heart) */}
            <div className="col-span-5 flex flex-col">
              {areasData.find(a => a.areaId === "care") && (
                <AreaZone
                  data={areasData.find(a => a.areaId === "care")!}
                  selectedProduct={selectedProduct}
                  placedProducts={placedProducts}
                  onSelectItem={(itemId) => onSelectItem("care", itemId)}
                  recommendedItem={recommendedItem?.areaId === "care" ? recommendedItem : null}
                  isPrimary
                />
              )}
            </div>

            {/* Right: Money + Back Office */}
            <div className="col-span-4 flex flex-col gap-4">
              <div className="flex-1">
                {areasData.find(a => a.areaId === "money") && (
                  <AreaZone
                    data={areasData.find(a => a.areaId === "money")!}
                    selectedProduct={selectedProduct}
                    placedProducts={placedProducts}
                    onSelectItem={(itemId) => onSelectItem("money", itemId)}
                    recommendedItem={recommendedItem?.areaId === "money" ? recommendedItem : null}
                  />
                )}
              </div>
              <div className="flex-1">
                {areasData.find(a => a.areaId === "back-office") && (
                  <AreaZone
                    data={areasData.find(a => a.areaId === "back-office")!}
                    selectedProduct={selectedProduct}
                    placedProducts={placedProducts}
                    onSelectItem={(itemId) => onSelectItem("back-office", itemId)}
                    recommendedItem={recommendedItem?.areaId === "back-office" ? recommendedItem : null}
                    compact
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Foundation + Growth */}
          <div className="grid grid-cols-12 gap-4 mt-4">
            <div className="col-span-7">
              {areasData.find(a => a.areaId === "foundation") && (
                <AreaZone
                  data={areasData.find(a => a.areaId === "foundation")!}
                  selectedProduct={selectedProduct}
                  placedProducts={placedProducts}
                  onSelectItem={(itemId) => onSelectItem("foundation", itemId)}
                  recommendedItem={recommendedItem?.areaId === "foundation" ? recommendedItem : null}
                  horizontal
                />
              )}
            </div>
            <div className="col-span-5">
              {areasData.find(a => a.areaId === "growth") && (
                <AreaZone
                  data={areasData.find(a => a.areaId === "growth")!}
                  selectedProduct={selectedProduct}
                  placedProducts={placedProducts}
                  onSelectItem={(itemId) => onSelectItem("growth", itemId)}
                  recommendedItem={recommendedItem?.areaId === "growth" ? recommendedItem : null}
                  horizontal
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Coverage Summary - When a product is selected */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 rounded-2xl bg-white border border-slate-200 shadow-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-label-primary">{selectedProduct.name}</h3>
                <p className="text-sm text-label-secondary mt-1">
                  Supports {selectedProduct.totalCoverage} practice needs across{" "}
                  {selectedProduct.coverageByArea.size} areas
                </p>
              </div>
              <button
                onClick={() => setSelectedProductSlug(null)}
                className="p-1.5 rounded-lg text-label-tertiary hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Coverage breakdown by area */}
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from(selectedProduct.coverageByArea.entries()).map(([areaId, items]) => {
                const config = AREA_CONFIG[areaId];
                return (
                  <div
                    key={areaId}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgLight} ${config.text}`}
                  >
                    <config.icon className="h-3 w-3" />
                    <span>{config.label}</span>
                    <span className="opacity-60">({items.length})</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Area Zone Component
// ============================================================================

function AreaZone({
  data,
  selectedProduct,
  placedProducts,
  onSelectItem,
  recommendedItem,
  isPrimary = false,
  compact = false,
  horizontal = false,
}: {
  data: AreaData;
  selectedProduct: PlacedProduct | null;
  /** All placed products - for coverage attribution */
  placedProducts: PlacedProduct[];
  onSelectItem: (itemId: string) => void;
  recommendedItem: { areaId: PracticeAreaId; itemId: string } | null;
  isPrimary?: boolean;
  compact?: boolean;
  horizontal?: boolean;
}) {
  const { config, slots, coveredCount, totalCount, isComplete, areaId } = data;
  const Icon = config.icon;

  // Is this area highlighted because selected product covers it?
  const isHighlighted = selectedProduct?.coverageByArea.has(areaId) ?? false;
  const coverageInThisArea = selectedProduct?.coverageByArea.get(areaId) || [];

  return (
    <div
      className={`
        relative h-full rounded-2xl border-2 transition-all duration-300
        ${isHighlighted ? `${config.border} ${config.bgLight} ring-2 ring-offset-2` : "border-slate-200 bg-white/80"}
        ${isPrimary ? "min-h-[320px]" : compact ? "min-h-[140px]" : "min-h-[200px]"}
      `}
      style={{
        // @ts-expect-error CSS variable
        "--tw-ring-color": isHighlighted ? `var(--${config.color}-200)` : "transparent",
      }}
    >
      {/* Area Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.bgMedium}`}>
            <Icon className={`h-3.5 w-3.5 ${config.text}`} />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${config.text}`}>{config.label}</h3>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {isComplete ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3 w-3" />
            </div>
          ) : (
            <span className="text-xs text-label-tertiary font-medium">
              {coveredCount}/{totalCount}
            </span>
          )}
        </div>
      </div>

      {/* Content - Now shows ONLY requirement slots (needs), no product cards */}
      <div className={`p-3 ${horizontal ? "" : "space-y-2"}`}>
        {/* Requirement Slots */}
        <div className={`${horizontal ? "flex flex-wrap gap-2" : "space-y-1.5"}`}>
          {slots.map(slot => {
            const isRecommended = recommendedItem?.itemId === slot.item.id;
            const isCoveredBySelected = coverageInThisArea.includes(slot.item.id);

            // Find which product covers this slot (for attribution)
            const coveringProduct = slot.coveringProductSlug
              ? placedProducts.find(p => p.slug === slot.coveringProductSlug)
              : undefined;

            return (
              <RequirementSlotView
                key={slot.item.id}
                slot={slot}
                areaConfig={config}
                isRecommended={isRecommended}
                isCoveredBySelected={isCoveredBySelected}
                coveringProductName={coveringProduct?.name}
                onSelect={() => onSelectItem(slot.item.id)}
                compact={compact || horizontal}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Requirement Slot View - Shows a need that may or may not be covered
// ============================================================================

function RequirementSlotView({
  slot,
  areaConfig,
  isRecommended,
  isCoveredBySelected,
  coveringProductName,
  onSelect,
  compact = false,
}: {
  slot: RequirementSlot;
  areaConfig: AreaConfig;
  isRecommended: boolean;
  isCoveredBySelected: boolean;
  /** Name of the tool that covers this need (for attribution) */
  coveringProductName?: string;
  onSelect: () => void;
  compact?: boolean;
}) {
  const { item, status, relevance } = slot;

  const isCovered = status === "covered" || status === "included";
  const isComplete = status === "complete";
  const isDeferred = status === "deferred" || status === "not-needed";

  return (
    <motion.button
      layout
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        text-left rounded-lg transition-all duration-200 group
        ${compact ? "px-2.5 py-1.5" : "w-full px-3 py-2"}
        ${isRecommended ? "ring-2 ring-accent ring-offset-1 bg-accent/5" : ""}
        ${isCoveredBySelected ? `${areaConfig.bgLight} border ${areaConfig.border}` : ""}
        ${isCovered && !isCoveredBySelected ? "bg-emerald-50/80 border border-emerald-200" : ""}
        ${isComplete ? "bg-emerald-50/80 border border-emerald-200" : ""}
        ${isDeferred ? "bg-slate-50 border border-slate-200 opacity-50" : ""}
        ${!isCovered && !isComplete && !isDeferred && !isRecommended && !isCoveredBySelected
          ? "bg-slate-50/50 border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          : ""}
      `}
    >
      <div className="flex items-center gap-2">
        {/* Status indicator */}
        <div className={`
          flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors
          ${isCovered || isComplete ? "bg-emerald-500 text-white" : ""}
          ${isCoveredBySelected ? `${areaConfig.bgMedium} ${areaConfig.text}` : ""}
          ${isDeferred ? "bg-slate-300 text-white" : ""}
          ${isRecommended && !isCovered ? "bg-accent text-white" : ""}
          ${!isCovered && !isComplete && !isDeferred && !isRecommended && !isCoveredBySelected
            ? "bg-slate-200/50 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500"
            : ""}
        `}>
          {(isCovered || isComplete) && <Check className="h-3 w-3" />}
          {isCoveredBySelected && !isCovered && <LinkIcon className="h-3 w-3" />}
          {!isCovered && !isComplete && !isCoveredBySelected && <Plus className="h-3 w-3" />}
        </div>

        {/* Label + Attribution */}
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className={`
              text-sm font-medium whitespace-nowrap
              ${isDeferred ? "text-label-tertiary line-through" : "text-label-primary"}
            `}>
              {item.name}
            </span>
            {/* Essential indicator */}
            {relevance === "core" && !isCovered && !isComplete && !isDeferred && (
              <Sparkles className="shrink-0 h-3 w-3 text-amber-500" />
            )}
          </div>
          {/* Coverage attribution - shows which tool provides this */}
          {isCovered && coveringProductName && !compact && (
            <span className="text-xs text-emerald-600 block">
              via {coveringProductName}
            </span>
          )}
        </div>

        {/* Covered indicator (compact mode or no attribution) */}
        {isCovered && !compact && !coveringProductName && (
          <span className="shrink-0 text-xs text-emerald-600 font-medium">
            {status === "included" ? "Included" : "Covered"}
          </span>
        )}

        {/* Action arrow for empty slots */}
        {!isCovered && !isComplete && !isDeferred && (
          <ChevronRight className="h-4 w-4 text-label-quaternary group-hover:text-label-tertiary shrink-0" />
        )}
      </div>
    </motion.button>
  );
}

// ============================================================================
// Mobile Practice Canvas - Room by room navigation
// ============================================================================

function MobilePracticeCanvas({
  areasData,
  placedProducts,
  selectedProduct,
  activeArea,
  onChangeArea,
  onSelectItem,
  recommendedItem,
}: {
  areasData: AreaData[];
  placedProducts: PlacedProduct[];
  selectedProduct: PlacedProduct | null;
  activeArea: PracticeAreaId;
  onChangeArea: (areaId: PracticeAreaId) => void;
  onSelectItem: (areaId: PracticeAreaId, itemId: string) => void;
  recommendedItem?: { areaId: PracticeAreaId; itemId: string } | null;
}) {
  const currentArea = areasData.find(a => a.areaId === activeArea)!;
  const config = currentArea.config;

  // Find products that cover multiple areas for this view
  const multiAreaProducts = placedProducts.filter(p => p.coverageByArea.size > 1);
  const productsAffectingThisArea = multiAreaProducts.filter(
    p => p.homeArea !== activeArea && p.coverageByArea.has(activeArea)
  );

  return (
    <div className="space-y-4">
      {/* Area Selector - Horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {areasData.map(area => {
          const areaConfig = area.config;
          const Icon = areaConfig.icon;
          const isActive = area.areaId === activeArea;
          const hasRecommended = recommendedItem?.areaId === area.areaId;

          return (
            <button
              key={area.areaId}
              onClick={() => onChangeArea(area.areaId)}
              className={`
                relative flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all min-w-[72px]
                ${isActive ? `${areaConfig.bgMedium} border-2 ${areaConfig.border}` : "bg-white border-2 border-transparent"}
              `}
            >
              <div className="relative">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? "bg-white" : areaConfig.bgLight}`}>
                  <Icon className={`h-4 w-4 ${areaConfig.text}`} />
                </div>
                {area.isComplete && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-white">
                    <Check className="h-2 w-2 text-white" />
                  </div>
                )}
                {hasRecommended && !area.isComplete && (
                  <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent animate-pulse ring-2 ring-white" />
                )}
              </div>
              <span className={`text-[11px] font-medium ${isActive ? areaConfig.text : "text-label-secondary"}`}>
                {areaConfig.label.split(" ")[0]}
              </span>
              <span className="text-[10px] text-label-tertiary">
                {area.coveredCount}/{area.totalCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Area Detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeArea}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl ${config.bgLight} border ${config.border} overflow-hidden`}
        >
          {/* Area Header */}
          <div className={`flex items-center justify-between p-4 border-b ${config.border} bg-white/50`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bgMedium}`}>
                <config.icon className={`h-5 w-5 ${config.text}`} />
              </div>
              <div>
                <h2 className={`font-semibold ${config.text}`}>{config.label}</h2>
                <p className="text-xs text-label-secondary">
                  {currentArea.coveredCount} of {currentArea.totalCount} ready
                </p>
              </div>
            </div>

            {currentArea.isComplete && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Cross-area coverage notice */}
          {productsAffectingThisArea.length > 0 && (
            <div className="px-4 py-2 bg-white/30 border-b border-white/50">
              <p className="text-xs text-label-secondary">
                <span className="font-medium">{productsAffectingThisArea.map(p => p.name).join(", ")}</span>
                {" "}also covers needs here
              </p>
            </div>
          )}

          {/* Requirement slots - now with coverage attribution */}
          <div className="p-4 space-y-2">
            {currentArea.slots.map(slot => {
              const isRecommended = recommendedItem?.areaId === activeArea && recommendedItem?.itemId === slot.item.id;
              const isCoveredBySelected = selectedProduct?.coverageByArea.get(activeArea)?.includes(slot.item.id) ?? false;

              // Find which product covers this slot
              const coveringProduct = slot.coveringProductSlug
                ? placedProducts.find(p => p.slug === slot.coveringProductSlug)
                : undefined;

              return (
                <RequirementSlotView
                  key={slot.item.id}
                  slot={slot}
                  areaConfig={config}
                  isRecommended={isRecommended}
                  isCoveredBySelected={isCoveredBySelected}
                  coveringProductName={coveringProduct?.name}
                  onSelect={() => onSelectItem(activeArea, slot.item.id)}
                />
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Exports - For integration with ToolsRail
// ============================================================================

/**
 * Re-export PlacedProduct type for external use
 * Parent components can use this with ToolsRail
 */
export type { PlacedProduct };

/**
 * Re-export AREA_CONFIG for consistent styling
 */
export { AREA_CONFIG };

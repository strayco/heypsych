/**
 * StudioCanvas Component
 *
 * Simple visual workspace showing the 6 core slots a practice needs.
 * Like filling slots in a car configurator - EMR, AI Scribe, Scheduling, etc.
 */

"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sparkles,
  Calendar,
  Users,
  CreditCard,
  Pill,
  Plus,
  X,
  Info,
} from "lucide-react";
import type { PlacedProduct } from "@/domains/architect/hooks";
import type { PracticeAreaId } from "../practice-areas";

// Color classes for each slot (explicit to avoid Tailwind purging)
const SLOT_COLORS = {
  rose: {
    border: "border-rose-300",
    bg: "bg-rose-50",
    iconBg: "bg-rose-200",
    iconText: "text-rose-700",
  },
  purple: {
    border: "border-purple-300",
    bg: "bg-purple-50",
    iconBg: "bg-purple-200",
    iconText: "text-purple-700",
  },
  blue: {
    border: "border-blue-300",
    bg: "bg-blue-50",
    iconBg: "bg-blue-200",
    iconText: "text-blue-700",
  },
  cyan: {
    border: "border-cyan-300",
    bg: "bg-cyan-50",
    iconBg: "bg-cyan-200",
    iconText: "text-cyan-700",
  },
  emerald: {
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-200",
    iconText: "text-emerald-700",
  },
  amber: {
    border: "border-amber-300",
    bg: "bg-amber-50",
    iconBg: "bg-amber-200",
    iconText: "text-amber-700",
  },
};

type SlotColor = keyof typeof SLOT_COLORS;

// The 6 core slots every practice needs
// Categories must match primary_category values in product JSON files
const PRACTICE_SLOTS = [
  {
    id: "emr",
    label: "EMR",
    description: "Patient records & notes",
    icon: FileText,
    color: "rose" as SlotColor,
    categories: ["ehr-practice-management"],
    areaId: "care" as PracticeAreaId,
    itemId: "ehr",
  },
  {
    id: "ai-scribe",
    label: "AI Scribe",
    description: "Documentation assistant",
    icon: Sparkles,
    color: "purple" as SlotColor,
    categories: ["ai-scribe-documentation", "ai-copilot-clinical", "clinical-decision-support", "measurement-outcomes-dtx"],
    areaId: "care" as PracticeAreaId,
    itemId: "documentation",
  },
  {
    id: "telehealth",
    label: "Telehealth",
    description: "Video visits & messaging",
    icon: Users,
    color: "cyan" as SlotColor,
    categories: ["telehealth-communication", "provider-network-virtual-care"],
    areaId: "front-door" as PracticeAreaId,
    itemId: "portal",
  },
  {
    id: "billing",
    label: "Billing",
    description: "Claims & payments",
    icon: CreditCard,
    color: "emerald" as SlotColor,
    categories: ["billing-rcm-insurance"],
    areaId: "money" as PracticeAreaId,
    itemId: "billing",
  },
  {
    id: "credentialing",
    label: "Credentialing",
    description: "Insurance panels",
    icon: Calendar,
    color: "blue" as SlotColor,
    categories: ["credentialing-workforce"],
    areaId: "money" as PracticeAreaId,
    itemId: "credentialing",
    optional: true,
  },
  {
    id: "prescribing",
    label: "Prescribing",
    description: "e-Rx & medications",
    icon: Pill,
    color: "amber" as SlotColor,
    categories: ["prescribing-erx"],
    areaId: "care" as PracticeAreaId,
    itemId: "prescribing",
    optional: true,
  },
];

interface StudioCanvasProps {
  placedProducts: PlacedProduct[];
  selectedProductSlug: string | null;
  onSelectProduct: (slug: string | null) => void;
  onRemoveProduct: (slug: string) => void;
  onSlotClick: (areaId: PracticeAreaId, itemId: string) => void;
  onViewDetails?: (slug: string) => void;
  coverageMap: Map<string, { covered: boolean; productSlug?: string }>;
  relevanceMap: Map<string, boolean>;
  isComplete?: boolean;
  hoveringProduct?: { slug: string; name: string; category: string } | null;
  priceMap?: Map<string, string>;
}

export function StudioCanvas({
  placedProducts,
  onRemoveProduct,
  onSlotClick,
  onViewDetails,
  priceMap,
}: StudioCanvasProps) {
  // Find which product fills each slot (by primary category)
  const getProductForSlot = useCallback(
    (slot: typeof PRACTICE_SLOTS[0]) => {
      return placedProducts.find((p) => slot.categories.includes(p.category));
    },
    [placedProducts]
  );

  // Check if a slot is covered by another product (not its primary category)
  const getSecondaryCoversFor = useCallback(
    (slot: typeof PRACTICE_SLOTS[0]) => {
      // Find products that cover this slot's area/item but aren't the primary filler
      return placedProducts.filter((p) => {
        // Skip if this is the primary product for this slot
        if (slot.categories.includes(p.category)) return false;
        // Check if product covers this slot's area
        const coveredItems = p.coverageByArea.get(slot.areaId);
        return coveredItems?.includes(slot.itemId);
      });
    },
    [placedProducts]
  );

  // Get other slots that a product covers (for showing badges)
  const getOtherSlotsCovered = useCallback(
    (product: PlacedProduct) => {
      const coveredSlots: string[] = [];
      for (const slot of PRACTICE_SLOTS) {
        // Skip if this is the product's primary slot
        if (slot.categories.includes(product.category)) continue;
        // Check if product covers this slot
        const coveredItems = product.coverageByArea.get(slot.areaId);
        if (coveredItems?.includes(slot.itemId)) {
          coveredSlots.push(slot.label);
        }
      }
      return coveredSlots;
    },
    []
  );

  // Check for overlap (multiple products covering same slot)
  const getOverlapsForSlot = useCallback(
    (slot: typeof PRACTICE_SLOTS[0]) => {
      const covering = placedProducts.filter((p) => {
        const coveredItems = p.coverageByArea.get(slot.areaId);
        return coveredItems?.includes(slot.itemId);
      });
      return covering.length > 1 ? covering : [];
    },
    [placedProducts]
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      {PRACTICE_SLOTS.map((slot) => {
        const product = getProductForSlot(slot);
        const secondaryCovers = getSecondaryCoversFor(slot);
        const overlaps = getOverlapsForSlot(slot);
        const Icon = slot.icon;
        const isFilled = !!product;
        const isCoveredByOther = !isFilled && secondaryCovers.length > 0;
        const hasOverlap = overlaps.length > 1;
        const colors = SLOT_COLORS[slot.color];

        // Get badges for what else this product covers
        const otherSlotsCovered = product ? getOtherSlotsCovered(product) : [];

        return (
          <motion.div
            key={slot.id}
            layout
            className={`
              relative rounded-2xl border-2 p-5 min-h-[140px]
              transition-all cursor-pointer
              ${isFilled
                ? `${colors.border} ${colors.bg}`
                : isCoveredByOther
                  ? "border-slate-200 bg-slate-50"
                  : "border-dashed border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              }
              ${hasOverlap ? "ring-2 ring-amber-300 ring-offset-1" : ""}
            `}
            onClick={() => !isFilled && !isCoveredByOther && onSlotClick(slot.areaId, slot.itemId)}
          >
            {/* Overlap warning */}
            {hasOverlap && (
              <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                Overlap
              </div>
            )}

            {/* Slot header */}
            <div className="flex items-start justify-between mb-3">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-xl
                ${isFilled ? `${colors.iconBg} ${colors.iconText}` : isCoveredByOther ? "bg-slate-200 text-slate-500" : "bg-slate-100 text-slate-400"}
              `}>
                <Icon className="h-5 w-5" />
              </div>

              {slot.optional && !isFilled && !isCoveredByOther && (
                <span className="text-xs text-slate-400 font-medium">Optional</span>
              )}
            </div>

            {/* Content */}
            {isFilled && product ? (
              // Filled state - show product
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-0.5">
                  {product.name}
                </h3>
                {priceMap?.get(product.slug) && (
                  <p className="text-xs text-slate-500">
                    {priceMap.get(product.slug)}
                  </p>
                )}

                {/* Show other slots this product covers */}
                {otherSlotsCovered.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {otherSlotsCovered.slice(0, 2).map((label) => (
                      <span
                        key={label}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 text-slate-600 font-medium"
                      >
                        + {label}
                      </span>
                    ))}
                    {otherSlotsCovered.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 text-slate-600 font-medium">
                        +{otherSlotsCovered.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  {/* Info button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails?.(product.slug);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
                    title="View details"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveProduct(product.slug);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : isCoveredByOther ? (
              // Covered by another product
              <div>
                <h3 className="font-medium text-slate-500 text-sm mb-0.5">
                  {slot.label}
                </h3>
                <p className="text-xs text-slate-400">
                  Included with {secondaryCovers[0].name}
                </p>
              </div>
            ) : (
              // Empty state - show slot info
              <div>
                <h3 className="font-medium text-slate-700 text-sm mb-0.5">
                  {slot.label}
                </h3>
                <p className="text-xs text-slate-400">
                  {slot.description}
                </p>

                {/* Add indicator */}
                <div className="absolute bottom-4 right-4">
                  <Plus className="h-5 w-5 text-slate-300" />
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Mobile version - same but stacked
 */
export function StudioCanvasMobile({
  placedProducts,
  onRemoveProduct,
  onSlotClick,
  onViewDetails,
  priceMap,
}: StudioCanvasProps) {
  const getProductForSlot = useCallback(
    (slot: typeof PRACTICE_SLOTS[0]) => {
      return placedProducts.find((p) => slot.categories.includes(p.category));
    },
    [placedProducts]
  );

  return (
    <div className="space-y-3">
      {PRACTICE_SLOTS.map((slot) => {
        const product = getProductForSlot(slot);
        const Icon = slot.icon;
        const isFilled = !!product;
        const colors = SLOT_COLORS[slot.color];

        return (
          <motion.div
            key={slot.id}
            layout
            className={`
              relative flex items-center gap-4 rounded-xl border-2 p-4
              transition-all
              ${isFilled
                ? `${colors.border} ${colors.bg}`
                : `border-dashed border-slate-300 bg-white`
              }
            `}
            onClick={() => !isFilled && onSlotClick(slot.areaId, slot.itemId)}
          >
            {/* Icon */}
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-xl shrink-0
              ${isFilled ? `${colors.iconBg} ${colors.iconText}` : "bg-slate-100 text-slate-400"}
            `}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {isFilled && product ? (
                <>
                  <h3 className="font-semibold text-slate-900 text-sm truncate">
                    {product.name}
                  </h3>
                  {priceMap?.get(product.slug) && (
                    <p className="text-xs text-slate-500">
                      {priceMap.get(product.slug)}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="font-medium text-slate-600 text-sm">
                    {slot.label}
                    {slot.optional && <span className="text-slate-400 font-normal"> (optional)</span>}
                  </h3>
                  <p className="text-xs text-slate-400">{slot.description}</p>
                </>
              )}
            </div>

            {/* Action */}
            {isFilled && product ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(product.slug);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  title="View details"
                >
                  <Info className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveProduct(product.slug);
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Plus className="h-5 w-5 text-slate-300 shrink-0" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

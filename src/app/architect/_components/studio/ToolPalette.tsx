/**
 * ToolPalette Component
 *
 * Vertical scrollable catalog of tools organized by category.
 * Designed to sit on the right side of the screen.
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  DoorOpen,
  DollarSign,
  Sparkles,
  Plus,
  Check,
  Info,
  type LucideIcon,
} from "lucide-react";
import type { ProductArchitectureMetadata, FitResult } from "@/domains/architect/schemas";

// Category tabs
interface CategoryConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  categories: string[];
}

const PALETTE_CATEGORIES: CategoryConfig[] = [
  {
    id: "emr",
    label: "EMR",
    icon: Heart,
    categories: ["ehr-practice-management"],
  },
  {
    id: "ai-scribe",
    label: "AI Scribe",
    icon: Sparkles,
    categories: ["ai-scribe-documentation", "ai-copilot-clinical"],
  },
  {
    id: "telehealth",
    label: "Telehealth",
    icon: DoorOpen,
    categories: ["telehealth-communication"],
  },
  {
    id: "billing",
    label: "Billing",
    icon: DollarSign,
    categories: ["billing-rcm-insurance"],
  },
  {
    id: "credentialing",
    label: "Credentialing",
    icon: DollarSign,
    categories: ["credentialing-workforce"],
  },
];

export interface ToolPaletteProduct {
  slug: string;
  name: string;
  tagline?: string;
  category: string;
  metadata: ProductArchitectureMetadata;
  fitResult: FitResult;
}

interface ToolPaletteProps {
  products: ToolPaletteProduct[];
  placedSlugs: Set<string>;
  onAddProduct: (slug: string, category: string) => void;
  onHoverProduct?: (product: { slug: string; name: string; category: string } | null) => void;
  onViewDetails?: (slug: string) => void;
}

export function ToolPalette({
  products,
  placedSlugs,
  onAddProduct,
  onHoverProduct,
  onViewDetails,
}: ToolPaletteProps) {
  const [activeCategory, setActiveCategory] = useState(PALETTE_CATEGORIES[0].id);

  // Filter products by active category
  const filteredProducts = useMemo(() => {
    const category = PALETTE_CATEGORIES.find((c) => c.id === activeCategory);
    if (!category) return [];

    return products
      .filter((p) => category.categories.includes(p.category))
      .filter((p) => (p.fitResult.score ?? 0) >= 50)
      .sort((a, b) => {
        // Placed items go to end
        if (placedSlugs.has(a.slug) && !placedSlugs.has(b.slug)) return 1;
        if (!placedSlugs.has(a.slug) && placedSlugs.has(b.slug)) return -1;
        return (b.fitResult.score ?? 0) - (a.fitResult.score ?? 0);
      });
  }, [products, activeCategory, placedSlugs]);

  const formatPrice = useCallback((metadata: ProductArchitectureMetadata) => {
    if (!metadata.pricing?.minPriceCents) return null;
    const min = Math.round(metadata.pricing.minPriceCents / 100);
    return `$${min}/mo`;
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 h-full flex flex-col">
      {/* Category tabs - horizontal scroll */}
      <div className="flex gap-1 p-2 border-b border-slate-100 overflow-x-auto scrollbar-hide">
        {PALETTE_CATEGORIES.map((category) => {
          const isActive = category.id === activeCategory;
          const count = products.filter((p) =>
            category.categories.includes(p.category) && !placedSlugs.has(p.slug)
          ).length;

          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
                }
              `}
            >
              {category.label}
              {count > 0 && !isActive && (
                <span className="ml-1 text-slate-400">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Products - vertical scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            No tools in this category
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isPlaced = placedSlugs.has(product.slug);
            const price = formatPrice(product.metadata);

            return (
              <motion.button
                key={product.slug}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => onHoverProduct?.({
                  slug: product.slug,
                  name: product.name,
                  category: product.category,
                })}
                onHoverEnd={() => onHoverProduct?.(null)}
                onClick={() => !isPlaced && onAddProduct(product.slug, product.category)}
                disabled={isPlaced}
                className={`
                  w-full text-left p-3 rounded-xl border-2 transition-all
                  ${isPlaced
                    ? "border-emerald-200 bg-emerald-50 opacity-60 cursor-default"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-slate-900 truncate">
                      {product.name}
                    </h4>
                    {product.tagline && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {product.tagline}
                      </p>
                    )}
                    {price && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        {price}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Info button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails?.(product.slug);
                      }}
                      className="shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                      title="View details"
                    >
                      <Info className="h-3 w-3 text-slate-500" />
                    </button>

                    {/* Add/Placed indicator */}
                    {isPlaced ? (
                      <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200">
                        <Plus className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

// Mobile version - bottom sheet style
export function ToolPaletteMobile({
  isOpen,
  onClose,
  products,
  placedSlugs,
  onAddProduct,
  onViewDetails,
}: ToolPaletteProps & { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100">
          <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-center">Add Tool</h3>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4">
          <ToolPalette
            products={products}
            placedSlugs={placedSlugs}
            onViewDetails={onViewDetails}
            onAddProduct={(slug, cat) => {
              onAddProduct(slug, cat);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

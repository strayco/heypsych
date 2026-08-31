// src/app/architect/_components/AuditIntake.tsx
// Intake flow for Audit My Stack - add existing products before analysis

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  X,
  ArrowRight,
  CheckCircle,
  Package,
  Loader2,
} from "lucide-react";
import type { ProductArchitectureMetadata } from "@/domains/architect/schemas";
import type { ArchitectProductDisplay } from "@/domains/architect/services";
import type { DemoProductDisplay } from "@/domains/architect/fixtures";

type ProductDisplay = DemoProductDisplay | ArchitectProductDisplay;

interface AuditIntakeProps {
  metadataMap: Map<string, ProductArchitectureMetadata>;
  productDisplayMap: Map<string, ProductDisplay>;
  isLoading: boolean;
  onComplete: (selectedProductSlugs: string[]) => void;
  onSkip: () => void;
}

export function AuditIntake({
  metadataMap,
  productDisplayMap,
  isLoading,
  onComplete,
  onSkip,
}: AuditIntakeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Filter products by search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: Array<{
      slug: string;
      name: string;
      category: string;
      isSelected: boolean;
    }> = [];

    for (const [slug, display] of productDisplayMap) {
      const name = display.name.toLowerCase();
      const category = display.category?.toLowerCase() || "";

      if (name.includes(query) || slug.includes(query) || category.includes(query)) {
        results.push({
          slug,
          name: display.name,
          category: display.category || "Unknown",
          isSelected: selectedProducts.includes(slug),
        });
      }
    }

    // Sort: selected first, then by name
    return results
      .sort((a, b) => {
        if (a.isSelected !== b.isSelected) return a.isSelected ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 20);
  }, [searchQuery, productDisplayMap, selectedProducts]);

  // Toggle product selection
  const toggleProduct = useCallback((slug: string) => {
    setSelectedProducts((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  // Remove product from selection
  const removeProduct = useCallback((slug: string) => {
    setSelectedProducts((prev) => prev.filter((s) => s !== slug));
  }, []);

  // Handle complete
  const handleComplete = useCallback(() => {
    onComplete(selectedProducts);
  }, [selectedProducts, onComplete]);

  // Get display info for selected products
  const selectedProductsDisplay = useMemo(() => {
    return selectedProducts.map((slug) => {
      const display = productDisplayMap.get(slug);
      return {
        slug,
        name: display?.name || slug,
        category: display?.category || "Unknown",
      };
    });
  }, [selectedProducts, productDisplayMap]);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <Package className="h-8 w-8 text-accent" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-label-primary">
            Audit Your Current Stack
          </h1>
          <p className="mt-2 text-label-secondary">
            Tell us what tools you're currently using. We'll analyze your stack for
            gaps, redundancies, and optimization opportunities.
          </p>
        </div>

        {/* Search */}
        <div className="mt-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products (e.g., SimplePractice, Doxy.me)"
              className="w-full rounded-xl border border-separator bg-surface py-3 pl-12 pr-4 text-label-primary placeholder-label-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-label-tertiary" />
            )}
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="mt-2 rounded-xl border border-separator bg-surface">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-label-tertiary" />
                  <span className="ml-2 text-sm text-label-tertiary">Loading products...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <ul className="divide-y divide-separator">
                  {searchResults.map((product) => (
                    <li key={product.slug}>
                      <button
                        onClick={() => toggleProduct(product.slug)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-fill-secondary"
                      >
                        <div>
                          <span className="font-medium text-label-primary">{product.name}</span>
                          <span className="ml-2 text-xs text-label-tertiary">{product.category}</span>
                        </div>
                        {product.isSelected ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <Plus className="h-5 w-5 text-label-tertiary" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-sm text-label-tertiary">
                  No products found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-label-primary">
              Your Current Stack ({selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""})
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedProductsDisplay.map((product) => (
                <span
                  key={product.slug}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent"
                >
                  {product.name}
                  <button
                    onClick={() => removeProduct(product.slug)}
                    className="rounded-full p-0.5 hover:bg-accent/20"
                    aria-label={`Remove ${product.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Help text */}
        <div className="mt-8 rounded-xl border border-separator bg-surface/50 p-4">
          <p className="text-sm text-label-secondary">
            <strong>Tip:</strong> Add all the software tools your practice currently uses for
            scheduling, documentation, billing, telehealth, and other workflows. The more
            complete your list, the more accurate our analysis.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            onClick={onSkip}
            className="rounded-lg border border-separator px-4 py-2.5 text-sm font-medium text-label-secondary hover:bg-fill-secondary"
          >
            Skip & Browse Manually
          </button>

          <button
            onClick={handleComplete}
            disabled={selectedProducts.length === 0}
            className={`flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
              selectedProducts.length > 0
                ? "bg-accent text-white hover:bg-accent-hover"
                : "cursor-not-allowed bg-fill-secondary text-label-tertiary"
            }`}
          >
            Analyze Stack
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

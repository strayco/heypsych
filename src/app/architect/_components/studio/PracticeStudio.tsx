/**
 * PracticeStudio Component
 *
 * The main orchestrator for the Practice Studio configurator experience.
 * Replaces the dashboard-style MyPractice with a true configurator:
 *
 * Layout:
 * - Top: StudioCanvas (the visual build)
 * - Middle: FeedbackBar (live metrics)
 * - Bottom: ToolPalette (browsable catalog)
 *
 * Key differences from old approach:
 * - No separate onboarding wizard - practice type emerges from selections
 * - Canvas shows visual slots, not checklists
 * - Palette is a browsable catalog, not an inventory list
 * - Feedback updates in real-time as you build
 *
 * Part of the Practice Studio configurator experience.
 */

"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  Settings,
  Undo2,
  Share2,
  Plus,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// Domain imports
import type {
  PracticeStack,
  PracticeFingerprint,
  FitResult,
} from "@/domains/architect/schemas";
import { createEmptyStack } from "@/domains/architect/schemas";
import {
  calculateStackCoverage,
  calculateStackCost,
  calculateStackHealth,
  calculateFitScore,
  getAllCapabilityRelevance,
  analyzeCompatibility,
} from "@/domains/architect/engines";
import { useArchitectProducts, usePlacedProducts, type PlacedProduct } from "@/domains/architect/hooks";
import {
  loadActiveStack,
  scheduleAutosave,
} from "@/domains/architect/persistence";
import {
  trackProductAdd,
  trackProductRemove,
  trackStackUndo,
  trackArchitectPageView,
  trackModeSelect,
} from "@/domains/architect/analytics";

// Local imports
import type { PracticeAreaId } from "../practice-areas";
import { PRACTICE_AREAS, getItemRelevance } from "../practice-areas";
import { StudioCanvas, StudioCanvasMobile } from "./StudioCanvas";
import { FeedbackBar, FeedbackBarCompact } from "./FeedbackBar";
import { ToolPalette, ToolPaletteMobile } from "./ToolPalette";
import type { ToolPaletteProduct } from "./ToolPalette";
import { ProductDrawer } from "../ProductDrawer";
import { SmartOnboarding } from "../SmartOnboarding";
import { ProductInfoPanel } from "./ProductInfoPanel";

interface PracticeStudioProps {
  /** Whether to show onboarding first */
  showOnboarding?: boolean;
  /** Demo mode (disables persistence) */
  isDemo?: boolean;
}

// Default fingerprint for new users
const DEFAULT_FINGERPRINT: PracticeFingerprint = {
  practiceType: "solo-clinician",
  sizeBucket: "solo",
  clinicalRoles: [],
  primaryPayerType: "cash",
  deliveryModel: "hybrid",
  statesServed: [],
  populations: [],
  priorities: [],
};

// Slot category groups - products in same group compete for same slot
const SLOT_CATEGORY_GROUPS: string[][] = [
  ["ehr-practice-management"],
  ["ai-scribe-documentation", "ai-copilot-clinical", "clinical-decision-support", "measurement-outcomes-dtx"],
  ["telehealth-communication", "provider-network-virtual-care"],
  ["billing-rcm-insurance"],
  ["credentialing-workforce"],
  ["prescribing-erx"],
];

export function PracticeStudio({
  showOnboarding = false,
  isDemo = false,
}: PracticeStudioProps) {
  // =========================================================================
  // Load products via API
  // =========================================================================

  const {
    metadataMap,
    displayMap: productDisplayMap,
    isLoading: productsLoading,
    error: productsError,
  } = useArchitectProducts();

  // =========================================================================
  // State
  // =========================================================================

  // Practice stack state
  const [stack, setStack] = useState<PracticeStack>(() => ({
    ...createEmptyStack(),
    fingerprint: DEFAULT_FINGERPRINT,
  }));

  // Undo stack for reverting changes
  const [undoStack, setUndoStack] = useState<PracticeStack[]>([]);

  // Onboarding state
  const [needsOnboarding, setNeedsOnboarding] = useState(showOnboarding);

  // UI state
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [hoveringProduct, setHoveringProduct] = useState<{
    slug: string;
    name: string;
    category: string;
  } | null>(null);
  const [drawerState, setDrawerState] = useState<{
    isOpen: boolean;
    areaId: PracticeAreaId;
    itemId: string;
  }>({ isOpen: false, areaId: "care", itemId: "" });
  const [isMobile, setIsMobile] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [infoProductSlug, setInfoProductSlug] = useState<string | null>(null);

  // =========================================================================
  // Effects
  // =========================================================================

  // Track page view
  useEffect(() => {
    trackArchitectPageView("studio");
    trackModeSelect("build-myself", false);
  }, []);

  // Responsive handling
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load saved stack
  useEffect(() => {
    if (!isDemo && !showOnboarding) {
      const result = loadActiveStack();
      if (result.success && result.data && result.data.selectedProducts.length > 0) {
        setStack(result.data);
      }
    }
  }, [isDemo, showOnboarding]);

  // Autosave
  useEffect(() => {
    if (!isDemo && stack.selectedProducts.length > 0) {
      scheduleAutosave(stack);
    }
  }, [stack, isDemo]);

  // =========================================================================
  // Computed values
  // =========================================================================

  // Get placed products from hook
  const { placedProducts } = usePlacedProducts(stack, metadataMap, productDisplayMap);

  // Calculate fit results for all products
  const fitResultsMap = useMemo((): Map<string, FitResult> => {
    const results = new Map<string, FitResult>();
    const currentStackSlugs = stack.selectedProducts.map((p) => p.slug);

    for (const [slug, metadata] of metadataMap) {
      const display = productDisplayMap.get(slug);
      const fitResult = calculateFitScore(
        {
          metadata,
          productName: display?.name || slug,
          productSlug: slug,
        },
        stack.fingerprint,
        currentStackSlugs
      );
      results.set(slug, fitResult);
    }

    return results;
  }, [metadataMap, productDisplayMap, stack.fingerprint, stack.selectedProducts]);

  // Calculate coverage
  const coverageResult = useMemo(
    () => calculateStackCoverage(stack, metadataMap),
    [stack, metadataMap]
  );

  // Calculate cost
  const costResult = useMemo(
    () => calculateStackCost(stack, metadataMap),
    [stack, metadataMap]
  );

  // Calculate compatibility
  const compatibilityResult = useMemo(
    () => analyzeCompatibility(stack, metadataMap),
    [stack, metadataMap]
  );

  // Get fit results for selected products
  const selectedFitResults = useMemo((): FitResult[] => {
    return stack.selectedProducts
      .map((p) => fitResultsMap.get(p.slug))
      .filter((r): r is FitResult => r !== undefined);
  }, [stack.selectedProducts, fitResultsMap]);

  // Calculate health
  const healthResult = useMemo(
    () =>
      calculateStackHealth({
        stack,
        metadataMap,
        coverageResult,
        fitResults: selectedFitResults,
        compatibilityAssessments: compatibilityResult,
        costEstimate: costResult,
      }),
    [stack, metadataMap, coverageResult, selectedFitResults, compatibilityResult, costResult]
  );

  // Get capability relevance
  const capabilityRelevanceMap = useMemo(
    () => getAllCapabilityRelevance(stack.fingerprint),
    [stack.fingerprint]
  );

  // Build coverage map for canvas
  const coverageMap = useMemo(() => {
    const map = new Map<string, { covered: boolean; productSlug?: string }>();

    for (const [areaId, area] of Object.entries(PRACTICE_AREAS)) {
      for (const item of area.items) {
        const itemKey = `${areaId}:${item.id}`;

        // Check if covered by any placed product
        let coveringProduct: PlacedProduct | undefined;
        for (const product of placedProducts) {
          const coveredItems = product.coverageByArea.get(areaId as PracticeAreaId);
          if (coveredItems?.includes(item.id)) {
            coveringProduct = product;
            break;
          }
        }

        map.set(itemKey, {
          covered: !!coveringProduct,
          productSlug: coveringProduct?.slug,
        });
      }
    }

    return map;
  }, [placedProducts]);

  // Build relevance map for canvas
  const relevanceMap = useMemo(() => {
    const map = new Map<string, boolean>();

    for (const [areaId, area] of Object.entries(PRACTICE_AREAS)) {
      for (const item of area.items) {
        const itemKey = `${areaId}:${item.id}`;
        const { isRelevant } = getItemRelevance(item, capabilityRelevanceMap);
        map.set(itemKey, isRelevant);
      }
    }

    return map;
  }, [capabilityRelevanceMap]);

  // Calculate completeness
  const { filledSlots, totalSlots, isComplete } = useMemo(() => {
    let filled = 0;
    let total = 0;

    relevanceMap.forEach((isRelevant, itemKey) => {
      if (!isRelevant) return;

      // Skip foundational items
      const [areaId, itemId] = itemKey.split(":");
      const area = PRACTICE_AREAS[areaId as PracticeAreaId];
      const item = area?.items.find((i) => i.id === itemId);
      if (item?.isFoundational) return;

      total++;
      if (coverageMap.get(itemKey)?.covered) {
        filled++;
      }
    });

    return {
      filledSlots: filled,
      totalSlots: total,
      isComplete: total > 0 && filled === total,
    };
  }, [coverageMap, relevanceMap]);

  // Build palette products
  const paletteProducts = useMemo((): ToolPaletteProduct[] => {
    const products: ToolPaletteProduct[] = [];

    for (const [slug, display] of productDisplayMap) {
      const metadata = metadataMap.get(slug);
      const fitResult = fitResultsMap.get(slug);

      if (!metadata || !fitResult) continue;

      products.push({
        slug,
        name: display.name,
        tagline: display.tagline,
        category: display.category,
        metadata,
        fitResult,
      });
    }

    return products;
  }, [productDisplayMap, metadataMap, fitResultsMap]);

  // Price map for display
  const priceMap = useMemo(() => {
    const map = new Map<string, string>();

    for (const product of placedProducts) {
      const metadata = metadataMap.get(product.slug);
      if (metadata?.pricing?.minPriceCents) {
        const min = Math.round(metadata.pricing.minPriceCents / 100);
        const max = metadata.pricing.maxPriceCents
          ? Math.round(metadata.pricing.maxPriceCents / 100)
          : null;
        map.set(
          product.slug,
          max && max !== min ? `$${min}–$${max}/mo` : `$${min}/mo`
        );
      }
    }

    return map;
  }, [placedProducts, metadataMap]);

  // Placed slugs set for palette
  const placedSlugs = useMemo(
    () => new Set(stack.selectedProducts.map((p) => p.slug)),
    [stack.selectedProducts]
  );

  // =========================================================================
  // Actions
  // =========================================================================

  // Update stack with undo support
  const updateStack = useCallback(
    (newStack: PracticeStack) => {
      setUndoStack((prev) => [...prev.slice(-10), stack]); // Keep last 10 states
      setStack(newStack);
    },
    [stack]
  );

  // Find which slot group a category belongs to
  const getSlotGroup = useCallback((category: string): string[] | undefined => {
    return SLOT_CATEGORY_GROUPS.find(group => group.includes(category));
  }, []);

  // Add product (replaces existing product in same slot)
  const handleAddProduct = useCallback(
    (slug: string, category: string) => {
      if (stack.selectedProducts.some((p) => p.slug === slug)) return;

      // Find if there's an existing product in the same slot
      const slotGroup = getSlotGroup(category);
      let productsToKeep = stack.selectedProducts;

      if (slotGroup) {
        // Remove any existing products from the same slot
        productsToKeep = stack.selectedProducts.filter((p) => {
          const existingCategory = productDisplayMap.get(p.slug)?.category;
          return !existingCategory || !slotGroup.includes(existingCategory);
        });
      }

      const newStack: PracticeStack = {
        ...stack,
        selectedProducts: [
          ...productsToKeep,
          { slug, addedAt: new Date().toISOString(), isDemo: false },
        ],
      };

      updateStack(newStack);
      trackProductAdd(slug, category, newStack.selectedProducts.length);

      // Close drawer if open
      setDrawerState((prev) => ({ ...prev, isOpen: false }));
      setShowMobilePalette(false);
    },
    [stack, updateStack, getSlotGroup, productDisplayMap]
  );

  // Remove product
  const handleRemoveProduct = useCallback(
    (slug: string) => {
      const product = stack.selectedProducts.find((p) => p.slug === slug);
      if (!product) return;

      const display = productDisplayMap.get(slug);

      const newStack: PracticeStack = {
        ...stack,
        selectedProducts: stack.selectedProducts.filter((p) => p.slug !== slug),
      };

      updateStack(newStack);
      trackProductRemove(slug, display?.category || "unknown", newStack.selectedProducts.length);

      // Deselect if this was selected
      if (selectedProductSlug === slug) {
        setSelectedProductSlug(null);
      }
    },
    [stack, updateStack, selectedProductSlug, productDisplayMap]
  );

  // Undo last change
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousStack = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setStack(previousStack);
    trackStackUndo();
  }, [undoStack]);

  // Open drawer for a slot
  const handleSlotClick = useCallback((areaId: PracticeAreaId, itemId: string) => {
    setDrawerState({ isOpen: true, areaId, itemId });
  }, []);

  // View product details
  const handleViewDetails = useCallback((slug: string) => {
    setInfoProductSlug(slug);
  }, []);

  // Handle fingerprint change from onboarding
  const handleFingerprintComplete = useCallback(
    (fingerprint: PracticeFingerprint) => {
      const newStack: PracticeStack = {
        ...stack,
        fingerprint,
      };
      updateStack(newStack);
      setNeedsOnboarding(false);
    },
    [stack, updateStack]
  );

  // =========================================================================
  // Render
  // =========================================================================

  // Loading state
  if (productsLoading && metadataMap.size === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-4 text-label-secondary">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (productsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <p className="text-negative">Failed to load products</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show onboarding if needed
  if (needsOnboarding) {
    return (
      <SmartOnboarding
        initialFingerprint={stack.fingerprint}
        onComplete={handleFingerprintComplete}
        onSkip={() => setNeedsOnboarding(false)}
      />
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-canvas pb-24">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-separator px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/architect"
                className="p-1.5 -ml-1.5 rounded-lg text-label-tertiary hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="font-semibold text-label-primary">Practice Studio</h1>
            </div>
            <div className="flex items-center gap-2">
              {undoStack.length > 0 && (
                <button
                  onClick={handleUndo}
                  className="p-2 rounded-lg text-label-tertiary hover:bg-slate-100"
                >
                  <Undo2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setNeedsOnboarding(true)}
                className="p-2 rounded-lg text-label-tertiary hover:bg-slate-100"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Compact feedback */}
          <div className="mt-3">
            <FeedbackBarCompact
              toolCount={stack.selectedProducts.length}
              costResult={costResult}
            />
          </div>
        </div>

        {/* Canvas */}
        <div className="p-4">
          <StudioCanvasMobile
            placedProducts={placedProducts}
            selectedProductSlug={selectedProductSlug}
            onSelectProduct={setSelectedProductSlug}
            onRemoveProduct={handleRemoveProduct}
            onSlotClick={handleSlotClick}
            onViewDetails={handleViewDetails}
            coverageMap={coverageMap}
            relevanceMap={relevanceMap}
            priceMap={priceMap}
          />
        </div>

        {/* Floating add button */}
        <button
          onClick={() => setShowMobilePalette(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-white font-medium shadow-lg hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Tool
        </button>

        {/* Mobile palette */}
        <ToolPaletteMobile
          isOpen={showMobilePalette}
          onClose={() => setShowMobilePalette(false)}
          products={paletteProducts}
          placedSlugs={placedSlugs}
          onAddProduct={handleAddProduct}
          onViewDetails={handleViewDetails}
        />

        {/* Product drawer */}
        <ProductDrawer
          isOpen={drawerState.isOpen}
          onClose={() => setDrawerState((prev) => ({ ...prev, isOpen: false }))}
          areaId={drawerState.areaId}
          itemId={drawerState.itemId}
          stack={stack}
          metadataMap={metadataMap}
          productDisplayMap={productDisplayMap}
          fitResultsMap={fitResultsMap}
          coverageResult={coverageResult}
          onAddProduct={handleAddProduct}
          isDemo={isDemo}
        />

        {/* Product info panel */}
        <ProductInfoPanel
          isOpen={!!infoProductSlug}
          onClose={() => setInfoProductSlug(null)}
          product={infoProductSlug ? {
            slug: infoProductSlug,
            name: productDisplayMap.get(infoProductSlug)?.name || infoProductSlug,
            tagline: productDisplayMap.get(infoProductSlug)?.tagline,
            category: productDisplayMap.get(infoProductSlug)?.category || "",
          } : null}
          metadata={infoProductSlug ? metadataMap.get(infoProductSlug) || null : null}
          fitResult={infoProductSlug ? fitResultsMap.get(infoProductSlug) || null : null}
          isPlaced={infoProductSlug ? placedSlugs.has(infoProductSlug) : false}
          onAddProduct={handleAddProduct}
          onRemoveProduct={handleRemoveProduct}
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Minimal header bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Exit */}
            <Link
              href="/architect"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Exit</span>
            </Link>

            {/* Center: Title */}
            <h1 className="text-sm font-medium text-slate-600">
              Practice Studio
            </h1>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {undoStack.length > 0 && (
                <button
                  onClick={handleUndo}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={() => setNeedsOnboarding(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Practice Profile"
              >
                <Settings className="h-4 w-4" />
              </button>

              {isComplete && (
                <button className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors">
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content - side by side layout */}
      <div className="flex-1 flex gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Left: 2x3 Slots Grid */}
        <div className="flex-1">
          <StudioCanvas
            placedProducts={placedProducts}
            selectedProductSlug={selectedProductSlug}
            onSelectProduct={setSelectedProductSlug}
            onRemoveProduct={handleRemoveProduct}
            onSlotClick={handleSlotClick}
            onViewDetails={handleViewDetails}
            coverageMap={coverageMap}
            relevanceMap={relevanceMap}
            isComplete={isComplete}
            hoveringProduct={hoveringProduct}
            priceMap={priceMap}
          />

          {/* Feedback bar below slots */}
          <FeedbackBar
            toolCount={stack.selectedProducts.length}
            totalSlots={totalSlots}
            filledSlots={filledSlots}
            costResult={costResult}
            healthResult={healthResult}
            integrationCount={0}
            isComplete={isComplete}
          />
        </div>

        {/* Right: Scrollable Tool Palette */}
        <div className="w-80 shrink-0">
          <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
            <ToolPalette
              products={paletteProducts}
              placedSlugs={placedSlugs}
              onAddProduct={handleAddProduct}
              onHoverProduct={setHoveringProduct}
              onViewDetails={handleViewDetails}
            />
          </div>
        </div>
      </div>

      {/* Product drawer */}
      <ProductDrawer
        isOpen={drawerState.isOpen}
        onClose={() => setDrawerState((prev) => ({ ...prev, isOpen: false }))}
        areaId={drawerState.areaId}
        itemId={drawerState.itemId}
        stack={stack}
        metadataMap={metadataMap}
        productDisplayMap={productDisplayMap}
        fitResultsMap={fitResultsMap}
        coverageResult={coverageResult}
        onAddProduct={handleAddProduct}
        isDemo={isDemo}
      />

      {/* Product info panel */}
      <ProductInfoPanel
        isOpen={!!infoProductSlug}
        onClose={() => setInfoProductSlug(null)}
        product={infoProductSlug ? {
          slug: infoProductSlug,
          name: productDisplayMap.get(infoProductSlug)?.name || infoProductSlug,
          tagline: productDisplayMap.get(infoProductSlug)?.tagline,
          category: productDisplayMap.get(infoProductSlug)?.category || "",
        } : null}
        metadata={infoProductSlug ? metadataMap.get(infoProductSlug) || null : null}
        fitResult={infoProductSlug ? fitResultsMap.get(infoProductSlug) || null : null}
        isPlaced={infoProductSlug ? placedSlugs.has(infoProductSlug) : false}
        onAddProduct={handleAddProduct}
        onRemoveProduct={handleRemoveProduct}
      />
    </div>
  );
}

export default PracticeStudio;

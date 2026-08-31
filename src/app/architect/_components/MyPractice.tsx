/**
 * MyPractice Component
 *
 * The primary "My Practice" experience - a spatial, Apple-caliber workspace
 * for building a mental health practice technology stack.
 *
 * Preserves all underlying engines and analytics while presenting
 * a premium, intuitive experience for clinicians.
 */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Settings,
  Undo2,
  RotateCcw,
  ChevronRight,
  Check,
  Sparkles,
  DollarSign,
  ExternalLink,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  type PracticeStack,
  type PracticeFingerprint,
  type ProductArchitectureMetadata,
  type CapabilityId,
  type FitResult,
  type ItemDecision,
  createEmptyStack,
  createEmptyFingerprint,
  hasProduct,
  addHistoryEntry,
  canUndo,
  getPracticeSummary,
  setItemDecision,
  getItemDecision,
} from "@/domains/architect/schemas";
import {
  getDemoProductMetadataMap,
  DEMO_PRODUCT_DISPLAY,
  SMALL_GROUP_PRACTICE,
  type DemoProductDisplay,
} from "@/domains/architect/fixtures";
import { useArchitectProducts, usePlacedProducts } from "@/domains/architect/hooks";
import type { ArchitectProductDisplay } from "@/domains/architect/services";
import {
  calculateStackCoverage,
  analyzeOverlaps,
  analyzeCompatibility,
  calculateStackCost,
  calculateStackHealth,
  calculateFitScore,
  generateRecommendation,
  type StackRecommendation,
} from "@/domains/architect/engines";
import {
  loadActiveStack,
  scheduleAutosave,
  setActiveStackId,
} from "@/domains/architect/persistence";
import {
  trackArchitectPageView,
  trackModeSelect,
  trackDemoStart,
  trackProductAdd,
  trackProductRemove,
  trackStackUndo,
  trackAreaView,
  trackItemView,
  trackItemAction,
  trackProductDrawerOpen,
  trackProductDrawerClose,
  trackRecommendationShown,
  trackRecommendationAccepted,
  trackAdvancedToggle,
  trackBlueprintGenerated,
} from "@/domains/architect/analytics";

import {
  type PracticeAreaId,
  type PracticeAreaItem,
  type ItemRelevance,
  PRACTICE_AREAS,
  getCapabilitiesForItem,
  getOrderedPracticeAreas,
  getItemRelevance,
} from "./practice-areas";
import { PracticeCanvas } from "./PracticeCanvas";
import { ProductDrawer } from "./ProductDrawer";
import { SmartOnboarding } from "./SmartOnboarding";
import { AdvancedAnalytics } from "./AdvancedAnalytics";
import {
  ToolsRail,
  MobileToolsButton,
  MobileToolsSheet,
  createRailTool,
  type RailTool,
} from "./ToolsRail";
import { getAllCapabilityRelevance } from "@/domains/architect/engines/relevance-engine";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";

type ProductDisplay = DemoProductDisplay | ArchitectProductDisplay;

interface MyPracticeProps {
  isDemo?: boolean;
  showOnboarding?: boolean;
}

// Demo stack with products pre-added
function createDemoStack(): PracticeStack {
  const stack = createEmptyStack();
  stack.fingerprint = SMALL_GROUP_PRACTICE;
  stack.name = "Demo Practice";
  stack.isDemoMode = true;

  // Add some demo products - shows multi-area coverage
  stack.selectedProducts = [
    {
      slug: "demo-mindcare-ehr",
      addedAt: new Date().toISOString(),
      addedFromSource: "recommendation",
      isDemo: true,
    },
    {
      slug: "demo-therapay-billing",
      addedAt: new Date().toISOString(),
      addedFromSource: "recommendation",
      isDemo: true,
    },
  ];

  return stack;
}

export function MyPractice({ isDemo = false, showOnboarding = false }: MyPracticeProps) {
  // Core state
  const [stack, setStack] = useState<PracticeStack>(() => {
    if (isDemo) return createDemoStack();
    return createEmptyStack();
  });
  const [showingOnboarding, setShowingOnboarding] = useState(showOnboarding && !isDemo);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ areaId: PracticeAreaId; itemId: string } | null>(null);
  const [recommendation, setRecommendation] = useState<StackRecommendation | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedToolSlug, setSelectedToolSlug] = useState<string | null>(null);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Load real products via API
  const {
    metadataMap: realMetadataMap,
    displayMap: realDisplayMap,
    isLoading: productsLoading,
    error: productsError,
  } = useArchitectProducts();

  // Metadata map (demo or real)
  const metadataMap = useMemo(() => {
    if (isDemo) return getDemoProductMetadataMap();
    return realMetadataMap;
  }, [isDemo, realMetadataMap]);

  // Product display map
  const productDisplayMap = useMemo((): Map<string, ProductDisplay> => {
    if (isDemo) {
      return new Map(DEMO_PRODUCT_DISPLAY.map((p) => [p.slug, p]));
    }
    return realDisplayMap;
  }, [isDemo, realDisplayMap]);

  // Compute placed products for canvas + rail
  const { placedProducts } = usePlacedProducts(stack, metadataMap, productDisplayMap);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculated results
  const coverageResult = useMemo(
    () => calculateStackCoverage(stack, metadataMap),
    [stack, metadataMap]
  );

  const overlapResult = useMemo(
    () => analyzeOverlaps(stack, metadataMap),
    [stack, metadataMap]
  );

  const compatibilityResult = useMemo(
    () => analyzeCompatibility(stack, metadataMap),
    [stack, metadataMap]
  );

  const costResult = useMemo(
    () => calculateStackCost(stack, metadataMap),
    [stack, metadataMap]
  );

  // Build rail tools from placed products with pricing
  const railTools = useMemo((): RailTool[] => {
    return placedProducts.map(product => {
      const productCost = costResult.productCosts.find(pc => pc.slug === product.slug);
      const display = productDisplayMap.get(product.slug);

      // Build price display
      let priceDisplay: string | undefined;
      let priceNotes: string | undefined;

      if (productCost?.requiresQuote) {
        priceDisplay = "Contact vendor";
      } else if (productCost?.minMonthlyCents != null) {
        const min = Math.round(productCost.minMonthlyCents / 100);
        const max = productCost.maxMonthlyCents ? Math.round(productCost.maxMonthlyCents / 100) : min;
        priceDisplay = min === max ? `$${min}/mo` : `$${min}–$${max}/mo`;
        priceNotes = productCost.notes;
      } else if (productCost?.priceDisplayText) {
        priceDisplay = productCost.priceDisplayText;
        priceNotes = productCost.notes;
      }

      // Build details URL using canonical taxonomy slug
      // Demo products (slug starts with "demo-") have no real product pages
      const isDemoProduct = product.slug.startsWith("demo-");
      let detailsUrl: string | undefined;

      if (!isDemoProduct) {
        const schemaCategory = display?.category;
        const taxonomySlug = schemaCategory
          ? (SCHEMA_TO_TAXONOMY_CATEGORY[schemaCategory as keyof typeof SCHEMA_TO_TAXONOMY_CATEGORY] ?? schemaCategory)
          : "ehr-practice-management";
        detailsUrl = `/tools/for-clinicians/${taxonomySlug}/${product.slug}`;
      }

      return createRailTool(product, {
        priceDisplay,
        priceNotes,
        detailsUrl,
      });
    });
  }, [placedProducts, costResult, productDisplayMap]);

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

  // Selected fit results for health
  const selectedFitResults = useMemo((): FitResult[] => {
    return stack.selectedProducts
      .map((p) => fitResultsMap.get(p.slug))
      .filter((r): r is FitResult => r !== undefined);
  }, [stack.selectedProducts, fitResultsMap]);

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

  // Calculate capability relevance from fingerprint
  const capabilityRelevanceMap = useMemo(
    () => getAllCapabilityRelevance(stack.fingerprint),
    [stack.fingerprint]
  );

  // Find the next recommended action
  const recommendedNextItem = useMemo(() => {
    const areas = getOrderedPracticeAreas();

    // Priority: core items first, then conditional, then later
    const priorities: ItemRelevance[] = ["core", "conditional", "later"];

    for (const priority of priorities) {
      for (const area of areas) {
        for (const item of area.items) {
          const { relevance, isRelevant } = getItemRelevance(item, capabilityRelevanceMap);
          if (!isRelevant || relevance !== priority) continue;

          const decision = getItemDecision(stack, area.id, item.id);

          // Skip if user has made a decision (for non-core)
          if (priority !== "core" && decision) continue;

          // For core items, only skip if actually complete
          if (priority === "core") {
            if (decision === "complete") continue;

            // For foundational items, need explicit complete
            if (item.isFoundational) {
              return { areaId: area.id, itemId: item.id };
            }

            // For software items, check coverage
            const isCovered = stack.selectedProducts.some((selected) => {
              const metadata = metadataMap.get(selected.slug);
              if (!metadata) return false;
              return item.capabilities.some((cap) =>
                metadata.capabilities.some(
                  (c) => c.capabilityId === cap && (c.strength === "core" || c.strength === "strong")
                )
              );
            });

            if (!isCovered) {
              return { areaId: area.id, itemId: item.id };
            }
            continue;
          }

          // For software items without decision, check coverage
          if (!item.isFoundational) {
            const isCovered = stack.selectedProducts.some((selected) => {
              const metadata = metadataMap.get(selected.slug);
              if (!metadata) return false;
              return item.capabilities.some((cap) =>
                metadata.capabilities.some(
                  (c) => c.capabilityId === cap && (c.strength === "core" || c.strength === "strong")
                )
              );
            });

            if (!isCovered) {
              return { areaId: area.id, itemId: item.id };
            }
          } else {
            return { areaId: area.id, itemId: item.id };
          }
        }
      }
    }

    return null;
  }, [stack, metadataMap, capabilityRelevanceMap]);

  // Find the next uncovered SOFTWARE item (for "Add Tool" action)
  // This excludes foundational items since those don't require product selection
  const recommendedNextSoftwareItem = useMemo(() => {
    const areas = getOrderedPracticeAreas();
    const priorities: ItemRelevance[] = ["core", "conditional", "later"];

    for (const priority of priorities) {
      for (const area of areas) {
        for (const item of area.items) {
          // Skip foundational items - we want software needs only
          if (item.isFoundational) continue;

          const { relevance, isRelevant } = getItemRelevance(item, capabilityRelevanceMap);
          if (!isRelevant || relevance !== priority) continue;

          const decision = getItemDecision(stack, area.id, item.id);

          // Skip if user has made a decision (for non-core)
          if (priority !== "core" && decision) continue;
          // For core items, skip if marked complete
          if (priority === "core" && decision === "complete") continue;

          // Check if already covered by a product
          const isCovered = stack.selectedProducts.some((selected) => {
            const metadata = metadataMap.get(selected.slug);
            if (!metadata) return false;
            return item.capabilities.some((cap) =>
              metadata.capabilities.some(
                (c) => c.capabilityId === cap && (c.strength === "core" || c.strength === "strong")
              )
            );
          });

          if (!isCovered) {
            return { areaId: area.id, itemId: item.id };
          }
        }
      }
    }

    return null;
  }, [stack, metadataMap, capabilityRelevanceMap]);

  // Check if essentials are complete
  const essentialsComplete = useMemo(() => {
    const areas = getOrderedPracticeAreas();

    for (const area of areas) {
      for (const item of area.items) {
        const { relevance, isRelevant } = getItemRelevance(item, capabilityRelevanceMap);
        if (!isRelevant || relevance !== "core") continue;

        const decision = getItemDecision(stack, area.id, item.id);

        if (item.isFoundational) {
          if (decision !== "complete") return false;
        } else {
          if (decision === "complete") continue;

          const isCovered = stack.selectedProducts.some((selected) => {
            const metadata = metadataMap.get(selected.slug);
            if (!metadata) return false;
            return item.capabilities.some((cap) =>
              metadata.capabilities.some(
                (c) => c.capabilityId === cap && (c.strength === "core" || c.strength === "strong")
              )
            );
          });

          if (!isCovered) return false;
        }
      }
    }

    return true;
  }, [stack, metadataMap, capabilityRelevanceMap]);

  // Track page view
  useEffect(() => {
    trackArchitectPageView(isDemo ? "demo" : "direct");
    if (isDemo) {
      trackDemoStart();
    } else {
      trackModeSelect("build-for-me", false);
    }
  }, [isDemo]);

  // Load saved stack (not demo, not showing onboarding)
  useEffect(() => {
    if (!isDemo && !showingOnboarding) {
      const result = loadActiveStack();
      if (result.success && result.data &&
          (result.data.selectedProducts.length > 0 || (result.data.itemDecisions?.length ?? 0) > 0)) {
        setStack(result.data);
      }
    }
  }, [isDemo, showingOnboarding]);

  // Autosave
  const hasPersistedState = stack.selectedProducts.length > 0 || (stack.itemDecisions?.length ?? 0) > 0;
  useEffect(() => {
    if (!isDemo && hasPersistedState) {
      scheduleAutosave(stack);
    }
  }, [stack, isDemo, hasPersistedState]);

  // Generate recommendations after onboarding
  const generateRecommendations = useCallback(
    (fingerprint: PracticeFingerprint) => {
      const availableProducts = Array.from(metadataMap.values());

      if (availableProducts.length > 0) {
        const rec = generateRecommendation({
          fingerprint,
          availableProducts,
          existingSelectionSlugs: [],
        });
        setRecommendation(rec);
        setShowRecommendations(true);
      }
    },
    [metadataMap]
  );

  // Handle onboarding complete
  const handleOnboardingComplete = useCallback(
    (fingerprint: PracticeFingerprint) => {
      setStack((prev) => ({
        ...prev,
        fingerprint,
        mode: "build-for-me",
        selectedProducts: [],
        history: [],
      }));
      setShowingOnboarding(false);
      generateRecommendations(fingerprint);
    },
    [generateRecommendations]
  );

  // Accept all recommendations
  const handleAcceptRecommendations = useCallback(() => {
    if (!recommendation) return;

    recommendation.products.forEach((product, idx) => {
      trackRecommendationAccepted(product.slug, idx + 1, recommendation.products.length);
    });

    setStack((prev) => {
      const existingSlugs = new Set(prev.selectedProducts.map((p) => p.slug));
      const newProducts = recommendation.products
        .filter((p) => !existingSlugs.has(p.slug))
        .map((p) => ({
          slug: p.slug,
          addedAt: new Date().toISOString(),
          addedFromSource: "recommendation" as const,
          isDemo: false,
        }));

      return {
        ...prev,
        selectedProducts: [...prev.selectedProducts, ...newProducts],
      };
    });

    setShowRecommendations(false);
    setRecommendation(null);
  }, [recommendation]);

  // Add product
  const handleAddProduct = useCallback(
    (productSlug: string, category: string) => {
      if (hasProduct(stack, productSlug)) return;

      const newStack = addHistoryEntry(
        {
          ...stack,
          selectedProducts: [
            ...stack.selectedProducts,
            {
              slug: productSlug,
              addedAt: new Date().toISOString(),
              isDemo: productSlug.startsWith("demo-"),
            },
          ],
        },
        {
          type: "add-product",
          productSlug,
          timestamp: new Date().toISOString(),
        }
      );

      setStack(newStack);
      trackProductAdd(productSlug, category, newStack.selectedProducts.length);
    },
    [stack]
  );

  // Remove product
  const handleRemoveProduct = useCallback(
    (productSlug: string, category: string) => {
      const newStack = addHistoryEntry(
        {
          ...stack,
          selectedProducts: stack.selectedProducts.filter((p) => p.slug !== productSlug),
        },
        {
          type: "remove-product",
          productSlug,
          timestamp: new Date().toISOString(),
        }
      );

      setStack(newStack);
      trackProductRemove(productSlug, category, newStack.selectedProducts.length);
    },
    [stack]
  );

  // Undo - history is prepended (newest at index 0), so we undo from the front
  const handleUndo = useCallback(() => {
    if (!canUndo(stack)) return;

    const history = stack.history;
    if (history.length === 0) return;

    // Get the most recent entry (at index 0, since addHistoryEntry prepends)
    const mostRecentEntry = history[0];

    if (mostRecentEntry.type === "add-product" && mostRecentEntry.productSlug) {
      setStack({
        ...stack,
        selectedProducts: stack.selectedProducts.filter((p) => p.slug !== mostRecentEntry.productSlug),
        history: history.slice(1), // Remove first entry (most recent)
      });
    } else if (mostRecentEntry.type === "remove-product" && mostRecentEntry.productSlug) {
      setStack({
        ...stack,
        selectedProducts: [
          ...stack.selectedProducts,
          {
            slug: mostRecentEntry.productSlug,
            addedAt: new Date().toISOString(),
            isDemo: mostRecentEntry.productSlug.startsWith("demo-"),
          },
        ],
        history: history.slice(1), // Remove first entry (most recent)
      });
    }

    trackStackUndo();
  }, [stack]);

  // Start over - reset stack and clear persistence
  const handleStartOver = useCallback(() => {
    if (isDemo) {
      setStack(createDemoStack());
    } else {
      setStack(createEmptyStack());
      setShowingOnboarding(true);
      // Clear active stack so old stack isn't re-loaded on refresh
      setActiveStackId(null);
    }
    setSelectedItem(null);
    setRecommendation(null);
    setShowRecommendations(false);
  }, [isDemo]);

  // Item decision handlers
  const handleMarkComplete = useCallback((areaId: PracticeAreaId, itemId: string) => {
    trackItemAction(areaId, itemId, "mark-complete");
    setStack((prev) => setItemDecision(prev, areaId, itemId, "complete"));
  }, []);

  const handleMarkNotNeeded = useCallback((areaId: PracticeAreaId, itemId: string) => {
    trackItemAction(areaId, itemId, "not-needed");
    setStack((prev) => setItemDecision(prev, areaId, itemId, "not-needed"));
  }, []);

  const handleDeferItem = useCallback((areaId: PracticeAreaId, itemId: string) => {
    trackItemAction(areaId, itemId, "add-later");
    setStack((prev) => setItemDecision(prev, areaId, itemId, "add-later"));
  }, []);

  // Track item selection
  const handleSelectItem = useCallback((areaId: PracticeAreaId, itemId: string) => {
    trackItemView(areaId, itemId);
    trackItemAction(areaId, itemId, "open-drawer");
    setSelectedItem({ areaId, itemId });
  }, []);

  // Handle tool selection in rail
  const handleSelectTool = useCallback((slug: string | null) => {
    setSelectedToolSlug(slug);
  }, []);

  // Handle remove tool from rail
  const handleRemoveTool = useCallback((slug: string) => {
    const display = productDisplayMap.get(slug);
    handleRemoveProduct(slug, display?.category || "unknown");
  }, [productDisplayMap, handleRemoveProduct]);

  // Handle add tool (open drawer for next uncovered SOFTWARE need)
  // Uses recommendedNextSoftwareItem to skip foundational items
  const handleAddTool = useCallback(() => {
    if (recommendedNextSoftwareItem) {
      handleSelectItem(recommendedNextSoftwareItem.areaId, recommendedNextSoftwareItem.itemId);
    }
  }, [recommendedNextSoftwareItem, handleSelectItem]);

  // Track advanced toggle
  const handleAdvancedToggle = useCallback(() => {
    const newValue = !showAdvanced;
    trackAdvancedToggle(newValue);
    setShowAdvanced(newValue);
  }, [showAdvanced]);

  // Format monthly cost
  const formatMonthlyCost = () => {
    if (!costResult.knownMinMonthlyCents) return null;
    const min = Math.round(costResult.knownMinMonthlyCents / 100);
    const max = costResult.knownMaxMonthlyCents
      ? Math.round(costResult.knownMaxMonthlyCents / 100)
      : null;

    if (max && max !== min) {
      return `$${min}–$${max}/mo`;
    }
    return `$${min}/mo`;
  };

  // Show onboarding
  if (showingOnboarding) {
    return (
      <SmartOnboarding
        initialFingerprint={stack.fingerprint}
        onComplete={handleOnboardingComplete}
        onSkip={() => setShowingOnboarding(false)}
      />
    );
  }

  // Loading state
  if (!isDemo && productsLoading && metadataMap.size === 0) {
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
  if (!isDemo && productsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <p className="text-error">Failed to load products</p>
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

  // Show recommendations
  if (showRecommendations && recommendation) {
    return (
      <RecommendationView
        recommendation={recommendation}
        productDisplayMap={productDisplayMap}
        onAcceptAll={handleAcceptRecommendations}
        onCustomize={() => {
          setShowRecommendations(false);
          setRecommendation(null);
        }}
        onEditProfile={() => {
          setShowRecommendations(false);
          setShowingOnboarding(true);
        }}
      />
    );
  }

  // Advanced Analytics View - Distinct from the simple configurator
  if (showAdvanced) {
    return (
      <AdvancedAnalytics
        stack={stack}
        metadataMap={metadataMap}
        productDisplayMap={productDisplayMap}
        coverageResult={coverageResult}
        healthResult={healthResult}
        overlapResult={overlapResult}
        compatibilityResult={compatibilityResult}
        costResult={costResult}
        fitResultsMap={fitResultsMap}
        onBack={() => setShowAdvanced(false)}
        onRemoveProduct={(slug) => {
          const display = productDisplayMap.get(slug);
          handleRemoveProduct(slug, display?.category || "unknown");
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Minimal Header - Application Shell Style */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-separator/50 bg-surface/80 backdrop-blur-xl px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Back */}
          <Link
            href="/architect"
            className="flex items-center gap-1.5 text-sm text-label-secondary hover:text-label-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </Link>

          <div className="h-4 w-px bg-separator" />

          {/* Title */}
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-label-primary">
              {stack.name || "My Practice"}
            </h1>
            {isDemo && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Demo
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Cost summary */}
          {formatMonthlyCost() && (
            <div className="hidden items-center gap-1 rounded-full bg-fill-secondary px-3 py-1 text-sm sm:flex">
              <DollarSign className="h-3.5 w-3.5 text-label-tertiary" />
              <span className="font-medium text-label-primary">{formatMonthlyCost()}</span>
            </div>
          )}

          {/* Undo */}
          {canUndo(stack) && (
            <button
              onClick={handleUndo}
              className="rounded-lg p-2 text-label-secondary hover:bg-fill-secondary transition-colors"
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </button>
          )}

          {/* Start over */}
          {stack.selectedProducts.length > 0 && (
            <button
              onClick={handleStartOver}
              className="hidden rounded-lg p-2 text-label-secondary hover:bg-fill-secondary sm:flex transition-colors"
              title="Start over"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          {/* Edit Profile */}
          <button
            onClick={() => setShowingOnboarding(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-label-secondary hover:bg-fill-secondary transition-all"
            title="Edit practice profile"
          >
            <UserCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </button>

          {/* Advanced toggle */}
          <button
            onClick={handleAdvancedToggle}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              showAdvanced
                ? "bg-accent text-white"
                : "text-label-secondary hover:bg-fill-secondary"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </button>
        </div>
      </header>

      {/* Main content - Canvas + Rail layout */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Canvas Area */}
          <div className="flex-1 overflow-auto">
            <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
              {/* Next Action Banner - Integrated with practice view */}
              <NextActionBanner
                essentialsComplete={essentialsComplete}
                recommendedItem={recommendedNextItem}
                onSelectItem={handleSelectItem}
              />

              {/* Practice Canvas - The Visual Hero */}
              <div className="mt-6">
                <PracticeCanvas
                  stack={stack}
                  metadataMap={metadataMap}
                  productDisplayMap={productDisplayMap}
                  coverageResult={coverageResult}
                  placedProducts={placedProducts}
                  onSelectItem={handleSelectItem}
                  onSelectProduct={handleSelectTool}
                  recommendedItem={recommendedNextItem}
                  selectedProductSlug={selectedToolSlug}
                />
              </div>
            </div>
          </div>

          {/* Tools Rail - Desktop only */}
          {!isMobile && (
            <div className="hidden lg:block w-72 shrink-0">
              <ToolsRail
                tools={railTools}
                selectedToolSlug={selectedToolSlug}
                onSelectTool={handleSelectTool}
                onRemoveTool={handleRemoveTool}
                onAddTool={handleAddTool}
                className="h-full"
              />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Tools Button + Sheet */}
      {isMobile && (
        <>
          <MobileToolsButton
            toolCount={railTools.length}
            onClick={() => setMobileToolsOpen(true)}
          />
          <MobileToolsSheet
            isOpen={mobileToolsOpen}
            onClose={() => setMobileToolsOpen(false)}
            tools={railTools}
            selectedToolSlug={selectedToolSlug}
            onSelectTool={handleSelectTool}
            onRemoveTool={handleRemoveTool}
            onAddTool={handleAddTool}
          />
        </>
      )}

      {/* Compact Footer - Only essential links */}
      <footer className="border-t border-separator/50 bg-surface/50 px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-4 text-xs text-label-tertiary">
          <Link href="/architect" className="hover:text-label-secondary transition-colors">
            Practice Architect
          </Link>
          <span>by</span>
          <Link href="/" className="hover:text-label-secondary transition-colors">
            HeyPsych
          </Link>
        </div>
      </footer>

      {/* Product drawer */}
      <AnimatePresence>
        {selectedItem && (
          <ProductDrawer
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            areaId={selectedItem.areaId}
            itemId={selectedItem.itemId}
            stack={stack}
            metadataMap={metadataMap}
            productDisplayMap={productDisplayMap}
            fitResultsMap={fitResultsMap}
            coverageResult={coverageResult}
            onAddProduct={handleAddProduct}
            onMarkComplete={() => handleMarkComplete(selectedItem.areaId, selectedItem.itemId)}
            onMarkNotNeeded={() => handleMarkNotNeeded(selectedItem.areaId, selectedItem.itemId)}
            onDeferItem={() => handleDeferItem(selectedItem.areaId, selectedItem.itemId)}
            isDemo={isDemo}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Next Action Banner - Prominent but integrated
 */
function NextActionBanner({
  essentialsComplete,
  recommendedItem,
  onSelectItem,
}: {
  essentialsComplete: boolean;
  recommendedItem: { areaId: PracticeAreaId; itemId: string } | null;
  onSelectItem: (areaId: PracticeAreaId, itemId: string) => void;
}) {
  // All complete
  if (essentialsComplete && !recommendedItem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800">Practice Ready</h3>
            <p className="text-sm text-emerald-700">
              All essential items configured. Add optional features from any area.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Essentials complete, optional remaining
  if (essentialsComplete && recommendedItem) {
    const area = PRACTICE_AREAS[recommendedItem.areaId];
    const item = area.items.find((i) => i.id === recommendedItem.itemId);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-3 w-3" />
          </div>
          <span className="font-medium text-emerald-700">Essentials complete</span>
        </div>

        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelectItem(recommendedItem.areaId, recommendedItem.itemId)}
          className="group w-full rounded-2xl border border-separator bg-surface p-4 text-left transition-all hover:border-accent/30 hover:shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fill-secondary text-label-tertiary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
              <ChevronRight className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-label-primary">{item?.name || "Next step"}</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  Optional
                </span>
              </div>
              <p className="mt-0.5 text-sm text-label-secondary">
                {item?.description || "Continue building your practice"}
              </p>
            </div>
            <span className="text-xs text-label-tertiary hidden sm:block">{area.name}</span>
          </div>
        </motion.button>
      </div>
    );
  }

  // Essentials not complete
  if (recommendedItem) {
    const area = PRACTICE_AREAS[recommendedItem.areaId];
    const item = area.items.find((i) => i.id === recommendedItem.itemId);

    return (
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => onSelectItem(recommendedItem.areaId, recommendedItem.itemId)}
        className="group w-full rounded-2xl border-2 border-accent bg-accent/5 p-4 text-left transition-all hover:bg-accent/10"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
            <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-accent">
                {item?.isFoundational ? `Complete ${item.name}` : `Choose ${item?.name}`}
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                Essential
              </span>
            </div>
            <p className="mt-0.5 text-sm text-label-secondary truncate">
              {item?.description}
            </p>
          </div>
          <span className="text-xs text-label-tertiary hidden sm:block">{area.name}</span>
        </div>
      </motion.button>
    );
  }

  return null;
}

/**
 * Recommendation view shown after onboarding
 */
function RecommendationView({
  recommendation,
  productDisplayMap,
  onAcceptAll,
  onCustomize,
  onEditProfile,
}: {
  recommendation: StackRecommendation;
  productDisplayMap: Map<string, ProductDisplay>;
  onAcceptAll: () => void;
  onCustomize: () => void;
  onEditProfile: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-separator bg-surface px-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span className="font-semibold text-label-primary">Recommendations</span>
        </div>
        <button
          onClick={onEditProfile}
          className="flex items-center gap-1 text-sm text-label-secondary hover:text-label-primary transition-colors"
        >
          Edit profile
          <ChevronRight className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 overflow-auto px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-label-primary">
              {recommendation.products.length} products for your practice
            </h1>
            <p className="mt-2 text-lg text-label-secondary">
              These cover {Math.round(recommendation.totalCoveragePercent)}% of your needs and work well together.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {recommendation.products.map((product, idx) => {
              const display = productDisplayMap.get(product.slug);

              return (
                <motion.div
                  key={product.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-4 rounded-2xl border border-separator bg-surface p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-label-primary">
                      {display?.name || product.slug}
                    </h3>
                    {product.reasoning[0] && (
                      <p className="mt-0.5 text-sm text-label-secondary line-clamp-1">{product.reasoning[0]}</p>
                    )}
                  </div>
                  {product.fitScore !== null && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">
                        {Math.round(product.fitScore)}
                      </div>
                      <div className="text-xs text-label-tertiary">fit</div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onAcceptAll}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              <Check className="h-4 w-4" />
              Accept & Build
            </button>
            <button
              onClick={onCustomize}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-separator py-3 text-sm font-medium text-label-secondary hover:bg-fill-secondary transition-colors"
            >
              Build My Own
            </button>
          </div>

          {recommendation.remainingGaps.length > 0 && (
            <p className="mt-6 text-center text-sm text-label-tertiary">
              {recommendation.remainingGaps.length} items still need products. You can add these after accepting.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

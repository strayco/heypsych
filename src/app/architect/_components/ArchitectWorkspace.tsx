// src/app/architect/_components/ArchitectWorkspace.tsx
// Main workspace component for Practice Stack Architect

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Menu,
  X,
  Save,
  Download,
  Upload,
  Undo2,
  HelpCircle,
  AlertTriangle,
  Plus,
  Layers,
} from "lucide-react";
import {
  type ArchitectMode,
  type PracticeStack,
  type PracticeFingerprint,
  type CapabilityId,
  type ProductArchitectureMetadata,
  createEmptyStack,
  createEmptyFingerprint,
  hasProduct,
  addHistoryEntry,
  canUndo,
  LIFECYCLE_STAGES,
} from "@/domains/architect/schemas";
import {
  getDemoProductMetadataMap,
  DEMO_PRODUCT_DISPLAY,
  SMALL_GROUP_PRACTICE,
  type DemoProductDisplay,
} from "@/domains/architect/fixtures";
import { useArchitectProducts } from "@/domains/architect/hooks";
import type { ArchitectProductDisplay } from "@/domains/architect/services";
import {
  calculateStackCoverage,
  analyzeOverlaps,
  analyzeCompatibility,
  calculateStackCost,
  calculateStackHealth,
  calculateFitScore,
} from "@/domains/architect/engines";
import type { FitResult } from "@/domains/architect/schemas";
import {
  saveNow,
  loadActiveStack,
  scheduleAutosave,
  exportStackJson,
} from "@/domains/architect/persistence";
import {
  trackArchitectPageView,
  trackModeSelect,
  trackDemoStart,
  trackProductAdd,
  trackProductRemove,
  trackStackUndo,
  trackStackSave,
  trackStackExport,
} from "@/domains/architect/analytics";

import { FingerprintWizard } from "./FingerprintWizard";
import { LifecycleNavigator } from "./LifecycleNavigator";
import { StackCanvas } from "./StackCanvas";
import { ShortlistPane } from "./ShortlistPane";
import { StackHealthPanel } from "./StackHealthPanel";

// Context preloading from URL parameters (via ContextualArchitectCTA)
export interface ArchitectInitialContext {
  preloadProducts?: string[];      // Product slugs to add to stack on mount
  preloadCapabilities?: string[];  // Capability IDs to mark as needs
  switchingFrom?: string;          // Product being replaced
  requiredIntegration?: string;    // Must integrate with this product
  categoryContext?: string;        // Category user is browsing
  practiceTypeHint?: string;       // Practice type to suggest
  utmSource?: string;              // Tracking
}

interface ArchitectWorkspaceProps {
  initialMode: ArchitectMode;
  isDemo: boolean;
  initialContext?: ArchitectInitialContext;
}

export function ArchitectWorkspace({ initialMode, isDemo, initialContext }: ArchitectWorkspaceProps) {
  // Core state
  const [mode, setMode] = useState<ArchitectMode>(initialMode);
  const [stack, setStack] = useState<PracticeStack>(() => {
    if (isDemo) {
      // Pre-populate demo stack with demo fingerprint
      const demoStack = createEmptyStack();
      demoStack.fingerprint = SMALL_GROUP_PRACTICE;
      demoStack.name = "Demo Practice Stack";
      return demoStack;
    }
    return createEmptyStack();
  });
  const [showFingerprint, setShowFingerprint] = useState(!isDemo && initialMode !== "audit");
  const [activeStage, setActiveStage] = useState<string>("care");
  const [selectedCapability, setSelectedCapability] = useState<CapabilityId | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileHealthOpen, setMobileHealthOpen] = useState(false);
  const [mobileShortlistOpen, setMobileShortlistOpen] = useState(false);

  // Load real products via API (only when not in demo mode)
  const {
    metadataMap: realMetadataMap,
    displayMap: realDisplayMap,
    isLoading: productsLoading,
  } = useArchitectProducts();

  // Metadata map (demo or real)
  const metadataMap = useMemo(() => {
    if (isDemo) {
      return getDemoProductMetadataMap();
    }
    return realMetadataMap;
  }, [isDemo, realMetadataMap]);

  // Product display info (demo or real)
  // Union type to support both demo and real display formats
  const productDisplayMap = useMemo((): Map<string, DemoProductDisplay | ArchitectProductDisplay> => {
    if (isDemo) {
      return new Map(DEMO_PRODUCT_DISPLAY.map((p) => [p.slug, p]));
    }
    return realDisplayMap;
  }, [isDemo, realDisplayMap]);

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

  // Calculate fit results for all products (for shortlist ranking and health)
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

  // Get fit results array for selected products (for health engine)
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

  // Track page view on mount
  useEffect(() => {
    trackArchitectPageView(isDemo ? "demo" : "direct");
    if (isDemo) {
      trackDemoStart();
    } else {
      trackModeSelect(mode, false);
    }
  }, [isDemo, mode]);

  // Load saved stack on mount (if not demo)
  useEffect(() => {
    if (!isDemo) {
      const result = loadActiveStack();
      if (result.success && result.data && result.data.selectedProducts.length > 0) {
        setStack(result.data);
        setShowFingerprint(false);
      }
    }
  }, [isDemo]);

  // Handle initial context preloading from URL (from ContextualArchitectCTA)
  useEffect(() => {
    if (!initialContext) return;

    const {
      preloadProducts,
      preloadCapabilities,
      switchingFrom,
      practiceTypeHint,
    } = initialContext;

    // Preload products into stack
    if (preloadProducts && preloadProducts.length > 0) {
      setStack((prev) => {
        const existingSlugs = new Set(prev.selectedProducts.map((p) => p.slug));
        const newProducts = preloadProducts
          .filter((slug) => !existingSlugs.has(slug))
          .map((slug) => ({
            slug,
            addedAt: new Date().toISOString(),
            isDemo: false,
          }));

        if (newProducts.length === 0) return prev;

        return {
          ...prev,
          selectedProducts: [...prev.selectedProducts, ...newProducts],
        };
      });
      // Skip fingerprint wizard if products are preloaded
      setShowFingerprint(false);
    }

    // Set switching context in fingerprint
    if (switchingFrom) {
      setStack((prev) => ({
        ...prev,
        fingerprint: {
          ...prev.fingerprint,
          currentStack: [switchingFrom],
        },
      }));
    }

    // Set practice type hint
    if (practiceTypeHint) {
      setStack((prev) => ({
        ...prev,
        fingerprint: {
          ...prev.fingerprint,
          practiceType: practiceTypeHint as PracticeFingerprint["practiceType"],
        },
      }));
    }
  }, [initialContext]);

  // Autosave on stack changes (if not demo)
  useEffect(() => {
    if (!isDemo && stack.selectedProducts.length > 0) {
      scheduleAutosave(stack);
    }
  }, [stack, isDemo]);

  // Stack mutation handlers
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

  const handleUndo = useCallback(() => {
    if (!canUndo(stack)) return;

    // Get previous state from history
    const history = stack.history;
    if (history.length === 0) return;

    // Undo the most recent action by reversing it
    const lastEntry = history[history.length - 1];

    if (lastEntry.type === "add-product" && lastEntry.productSlug) {
      // Undo add = remove the product
      setStack({
        ...stack,
        selectedProducts: stack.selectedProducts.filter(
          (p) => p.slug !== lastEntry.productSlug
        ),
        history: history.slice(0, -1),
      });
    } else if (lastEntry.type === "remove-product" && lastEntry.productSlug) {
      // Undo remove = re-add the product
      setStack({
        ...stack,
        selectedProducts: [
          ...stack.selectedProducts,
          {
            slug: lastEntry.productSlug,
            addedAt: new Date().toISOString(),
            isDemo: lastEntry.productSlug.startsWith("demo-"),
          },
        ],
        history: history.slice(0, -1),
      });
    } else {
      // Unknown action type, just remove from history
      setStack({
        ...stack,
        history: history.slice(0, -1),
      });
    }

    trackStackUndo();
  }, [stack]);

  const handleFingerprintComplete = useCallback((fingerprint: PracticeFingerprint) => {
    setStack((prev) => ({
      ...prev,
      fingerprint,
    }));
    setShowFingerprint(false);
  }, []);

  const handleSave = useCallback(() => {
    const result = saveNow(stack);
    if (result.success && result.data) {
      trackStackSave(result.data.id);
      // TODO: Show success toast
    }
  }, [stack]);

  const handleExport = useCallback(() => {
    const json = exportStackJson(stack);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${stack.name || "practice-stack"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackStackExport();
  }, [stack]);

  // Show fingerprint wizard if needed
  if (showFingerprint) {
    return (
      <FingerprintWizard
        initialFingerprint={stack.fingerprint}
        mode={mode}
        onComplete={handleFingerprintComplete}
        onSkip={() => setShowFingerprint(false)}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-separator bg-surface px-4">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden rounded-lg p-2 text-label-secondary hover:bg-fill-secondary"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Back link */}
          <Link
            href="/architect"
            className="flex items-center gap-2 text-sm text-label-secondary hover:text-label-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          {/* Title */}
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-label-primary">
              {stack.name || "Practice Stack"}
            </h1>
            {isDemo && (
              <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                Demo
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Undo */}
          {canUndo(stack) && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-label-secondary hover:bg-fill-secondary"
              title="Undo last action"
            >
              <Undo2 className="h-4 w-4" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          )}

          {/* Save (if not demo) */}
          {!isDemo && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-label-secondary hover:bg-fill-secondary"
              title="Save stack"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-label-secondary hover:bg-fill-secondary"
            title="Export as JSON"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Edit Fingerprint */}
          <button
            onClick={() => setShowFingerprint(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Edit Profile
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Lifecycle Navigator (hidden on mobile unless open) */}
        <aside
          className={`${
            mobileNavOpen ? "fixed inset-0 z-50 bg-surface" : "hidden"
          } lg:relative lg:block lg:w-64 lg:shrink-0 lg:border-r lg:border-separator`}
        >
          {/* Mobile close button */}
          {mobileNavOpen && (
            <div className="flex h-14 items-center justify-between border-b border-separator px-4 lg:hidden">
              <span className="font-medium text-label-primary">Lifecycle Stages</span>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg p-2 text-label-secondary hover:bg-fill-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <LifecycleNavigator
            stack={stack}
            metadataMap={metadataMap}
            coverageResult={coverageResult}
            activeStage={activeStage}
            selectedCapability={selectedCapability}
            onStageSelect={(stageId) => {
              setActiveStage(stageId);
              setSelectedCapability(null);
              setMobileNavOpen(false);
            }}
            onCapabilitySelect={(capId) => {
              setSelectedCapability(capId);
              setMobileNavOpen(false);
            }}
          />
        </aside>

        {/* Center: Stack Canvas */}
        <main className="flex-1 overflow-auto">
          <StackCanvas
            stack={stack}
            metadataMap={metadataMap}
            productDisplayMap={productDisplayMap}
            coverageResult={coverageResult}
            overlapResult={overlapResult}
            compatibilityResult={compatibilityResult}
            activeStage={activeStage}
            selectedCapability={selectedCapability}
            onAddProduct={handleAddProduct}
            onRemoveProduct={handleRemoveProduct}
            onCapabilitySelect={setSelectedCapability}
            isDemo={isDemo}
          />
        </main>

        {/* Right Pane: Shortlist & Health */}
        <aside className="hidden w-80 shrink-0 border-l border-separator bg-surface lg:block">
          <div className="flex h-full flex-col">
            {/* Stack Health Summary */}
            <StackHealthPanel
              healthResult={healthResult}
              costResult={costResult}
              coverageResult={coverageResult}
              stack={stack}
            />

            {/* Shortlist / Inspector */}
            <div className="flex-1 overflow-auto border-t border-separator">
              <ShortlistPane
                stack={stack}
                metadataMap={metadataMap}
                productDisplayMap={productDisplayMap}
                fitResultsMap={fitResultsMap}
                selectedCapability={selectedCapability}
                onAddProduct={handleAddProduct}
                isDemo={isDemo}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Overlap warnings banner */}
      {overlapResult.some((o) => o.classification === "probable-redundancy") && (
        <div className="flex items-center gap-2 border-t border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-600">
          <Layers className="h-4 w-4 shrink-0" />
          <span>
            <strong>Feature overlap detected:</strong>{" "}
            {overlapResult
              .filter((o) => o.classification === "probable-redundancy")
              .slice(0, 2)
              .map((o) => `${o.productA} and ${o.productB} both cover ${o.capabilityId.replace(/-/g, " ")}`)
              .join("; ")}
            {overlapResult.filter((o) => o.classification === "probable-redundancy").length > 2 && " and more"}
            . Consider removing redundant tools to reduce cost.
          </span>
        </div>
      )}

      {/* Compatibility warnings banner */}
      {compatibilityResult.some((c) => c.status === "incompatible") && (
        <div className="flex items-center gap-2 border-t border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Some products in your stack may have compatibility issues.{" "}
            <button className="underline hover:no-underline">Review</button>
          </span>
        </div>
      )}

      {/* Mobile Floating Action Buttons - visible only on mobile */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 lg:hidden">
        {/* Health Score Button */}
        <button
          onClick={() => setMobileHealthOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-lg text-white"
          aria-label="View stack health"
        >
          <span className="text-sm font-bold">{healthResult.overallScore}</span>
        </button>

        {/* Shortlist Button (when capability selected) */}
        {selectedCapability && (
          <button
            onClick={() => setMobileShortlistOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-lg border border-separator text-label-primary"
            aria-label="View product recommendations"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Mobile Stack Health Panel */}
      {mobileHealthOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileHealthOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-auto rounded-t-2xl bg-surface shadow-xl animate-in slide-in-from-bottom">
            <div className="sticky top-0 flex items-center justify-between border-b border-separator bg-surface p-4">
              <h3 className="font-semibold text-label-primary">Stack Health</h3>
              <button
                onClick={() => setMobileHealthOpen(false)}
                className="rounded-lg p-1.5 text-label-tertiary hover:bg-fill-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <StackHealthPanel
              healthResult={healthResult}
              costResult={costResult}
              coverageResult={coverageResult}
              stack={stack}
            />
          </div>
        </div>
      )}

      {/* Mobile Shortlist Panel */}
      {mobileShortlistOpen && selectedCapability && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileShortlistOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-auto rounded-t-2xl bg-surface shadow-xl animate-in slide-in-from-bottom">
            <div className="sticky top-0 flex items-center justify-between border-b border-separator bg-surface p-4">
              <h3 className="font-semibold text-label-primary">Product Recommendations</h3>
              <button
                onClick={() => setMobileShortlistOpen(false)}
                className="rounded-lg p-1.5 text-label-tertiary hover:bg-fill-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ShortlistPane
              stack={stack}
              metadataMap={metadataMap}
              productDisplayMap={productDisplayMap}
              fitResultsMap={fitResultsMap}
              selectedCapability={selectedCapability}
              onAddProduct={(slug, category) => {
                handleAddProduct(slug, category);
                setMobileShortlistOpen(false);
              }}
              isDemo={isDemo}
            />
          </div>
        </div>
      )}
    </div>
  );
}

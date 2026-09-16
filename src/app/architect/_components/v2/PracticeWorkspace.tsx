/**
 * Practice Workspace
 *
 * The main v2 Practice Architect experience.
 * Opens directly into the workspace with all 7 components visible.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Settings } from "lucide-react";
import type { ComponentId } from "@/domains/architect/schemas/practice-v2";
import type { ProductArchitectureMetadata } from "@/domains/architect/schemas/product-metadata";
import { TOTAL_COMPONENT_COUNT } from "@/domains/architect/component-mapping";
import { usePracticeState } from "./usePracticeState";
import { PracticeHeader } from "./PracticeHeader";
import { ZoneGrid, ZoneGridMobile } from "./ZoneGrid";
import { ComponentSheet } from "./ComponentSheet";
import { RecommendationPanel } from "./RecommendationPanel";
import { ProfilePrompt } from "./ProfilePrompt";

export function PracticeWorkspace() {
  const {
    state,
    decisionsLeft,
    isComplete,
    estimatedCost,
    solutionCount,
    shouldShowProfilePrompt,
    addSolution,
    removeSolution,
    markAlreadyHandled,
    markNotNeeded,
    restoreComponent,
    updateProfile,
    dismissProfilePrompt,
    reset,
  } = usePracticeState();

  // UI state
  const [isMobile, setIsMobile] = useState(false);
  const [activeComponent, setActiveComponent] = useState<ComponentId | null>(null);
  const [cascadeComponents, setCascadeComponents] = useState<ComponentId[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle component click
  const handleComponentClick = useCallback((componentId: ComponentId) => {
    setActiveComponent(componentId);
  }, []);

  // Handle closing the sheet
  const handleCloseSheet = useCallback(() => {
    setActiveComponent(null);
    setCascadeComponents([]);
  }, []);

  // Handle adding a solution with cascade animation
  const handleAddSolution = useCallback(
    (
      product: ProductArchitectureMetadata,
      productName: string,
      coverage: ComponentId[]
    ) => {
      if (!activeComponent) return;

      // Trigger cascade animation
      setCascadeComponents(coverage);

      // Add the solution (which updates state)
      addSolution(
        product,
        productName,
        activeComponent,
        product.pricing?.minPriceCents
      );

      // Clear cascade animation after it completes (but keep sheet open)
      setTimeout(() => {
        setCascadeComponents([]);
      }, coverage.length * 100 + 500);
    },
    [activeComponent, addSolution]
  );

  // Handle reset
  const handleReset = useCallback(() => {
    reset();
    setShowResetConfirm(false);
  }, [reset]);

  // Build profile summary string
  const getProfileSummary = (): string | undefined => {
    if (!state.profile) return undefined;

    const parts: string[] = [];

    if (state.profile.size) {
      const sizeMap = { solo: "Solo", "2-5": "Small", "6-20": "Group" };
      parts.push(sizeMap[state.profile.size] || "");
    }

    if (state.profile.practiceType) {
      const typeMap = {
        therapist: "Therapy",
        psychiatrist: "Psychiatry",
        both: "Therapy + Psychiatry",
      };
      parts.push(typeMap[state.profile.practiceType] || "");
    }

    if (state.profile.paymentModel) {
      const payMap = { cash: "Cash Pay", insurance: "Insurance", both: "Mixed" };
      parts.push(payMap[state.profile.paymentModel] || "");
    }

    return parts.length > 0 ? parts.join(" · ") : undefined;
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Top bar with reset/settings */}
      <div className="sticky top-0 z-30 border-b border-separator bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2">
          <span className="text-sm font-medium text-label-secondary">
            Practice Architect
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="rounded-lg p-2 text-label-tertiary transition-colors hover:bg-fill-secondary hover:text-label-secondary"
              title="Start over"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <PracticeHeader
          componentCount={TOTAL_COMPONENT_COUNT}
          decisionsLeft={decisionsLeft}
          estimatedCostCents={estimatedCost}
          solutionCount={solutionCount}
          isComplete={isComplete}
          profileSummary={getProfileSummary()}
        />

        {/* Cascade feedback toast */}
        <AnimatePresence>
          {cascadeComponents.length > 1 && (
            <motion.div
              className="mb-6 flex justify-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-positive/10 px-4 py-2 text-sm font-medium text-positive">
                <span>
                  {cascadeComponents.length} needs covered with 1 tool
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone grid */}
        {isMobile ? (
          <ZoneGridMobile
            components={state.components}
            solutions={state.solutions}
            cascadeComponents={cascadeComponents}
            onComponentClick={handleComponentClick}
          />
        ) : (
          <ZoneGrid
            components={state.components}
            solutions={state.solutions}
            cascadeComponents={cascadeComponents}
            onComponentClick={handleComponentClick}
          />
        )}

        {/* Complete state */}
        {isComplete && (
          <motion.div
            className="mt-8 rounded-2xl border border-positive/30 bg-positive/5 p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg font-semibold text-positive">
              Everything essential is covered
            </h2>
            <p className="mt-1 text-sm text-label-secondary">
              Your practice is ready with {solutionCount}{" "}
              {solutionCount === 1 ? "tool" : "tools"} at ~$
              {Math.round((estimatedCost ?? 0) / 100)}/month
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
                Save this practice
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="rounded-xl border border-separator px-4 py-2 text-sm font-medium text-label-secondary transition-colors hover:bg-fill-secondary"
              >
                Start another build
              </button>
            </div>
          </motion.div>
        )}

        {/* Profile prompt (progressive profiling) */}
        <AnimatePresence>
          {shouldShowProfilePrompt && (
            <ProfilePrompt
              onUpdateProfile={updateProfile}
              onDismiss={dismissProfilePrompt}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Component sheet */}
      <ComponentSheet
        componentId={activeComponent}
        onClose={handleCloseSheet}
        onAlreadyHandled={markAlreadyHandled}
        onNotNeeded={markNotNeeded}
        isMobile={isMobile}
      >
        {activeComponent && (
          <RecommendationPanel
            componentId={activeComponent}
            profile={state.profile}
            selectedSlugs={state.solutions.map((s) => s.slug)}
            onSelectSolution={handleAddSolution}
            onRemoveSolution={removeSolution}
          />
        )}
      </ComponentSheet>

      {/* Reset confirmation modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-floating"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-label-primary">
                Start over?
              </h3>
              <p className="mt-2 text-sm text-label-secondary">
                This will reset all your selections and start fresh.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-xl bg-negative px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-negative/90"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 rounded-xl border border-separator px-4 py-2.5 text-sm font-medium text-label-secondary transition-colors hover:bg-fill-secondary"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

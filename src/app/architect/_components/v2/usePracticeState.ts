/**
 * Practice State Hook
 *
 * Manages the v2 practice state with localStorage persistence.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  type PracticeStateV2,
  type ComponentId,
  type ComponentState,
  type SelectedSolution,
  type PracticeProfile,
  COMPONENT_IDS,
  createInitialPracticeState,
  getDecisionsLeft,
  isEssentialCovered,
  getEstimatedMonthlyCost,
  getSolutionCount,
  shouldShowProfilePrompt,
} from "@/domains/architect/schemas/practice-v2";
import { getProductComponentCoverage } from "@/domains/architect/component-mapping";
import type { ProductArchitectureMetadata } from "@/domains/architect/schemas/product-metadata";

const STORAGE_KEY = "practiceState_v2";

/**
 * Migrate state to include any new components added after initial release.
 */
function migrateState(state: PracticeStateV2): PracticeStateV2 {
  let needsMigration = false;
  const newComponents = { ...state.components };

  // Ensure all component IDs exist (handles adding new components like website, prescribing)
  for (const componentId of COMPONENT_IDS) {
    if (!(componentId in newComponents)) {
      newComponents[componentId] = { status: "unresolved" };
      needsMigration = true;
    }
  }

  if (!needsMigration) return state;

  return {
    ...state,
    components: newComponents as Record<ComponentId, ComponentState>,
  };
}

/**
 * Load state from localStorage.
 */
function loadState(): PracticeStateV2 | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    // Basic version check
    if (parsed.version !== 2) return null;

    // Migrate to add any new components
    return migrateState(parsed as PracticeStateV2);
  } catch {
    return null;
  }
}

/**
 * Save state to localStorage.
 */
function saveState(state: PracticeStateV2): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export interface UsePracticeStateReturn {
  /** Current practice state */
  state: PracticeStateV2;

  /** Number of decisions remaining */
  decisionsLeft: number;

  /** Whether all essential components are covered */
  isComplete: boolean;

  /** Estimated monthly cost in cents */
  estimatedCost: number | null;

  /** Number of solutions selected */
  solutionCount: number;

  /** Whether to show the profile prompt */
  shouldShowProfilePrompt: boolean;

  /** Add a solution that covers components */
  addSolution: (
    product: ProductArchitectureMetadata,
    productName: string,
    primaryComponent: ComponentId,
    monthlyCostCents?: number
  ) => void;

  /** Remove a solution and uncover its components */
  removeSolution: (solutionSlug: string) => void;

  /** Mark a component as already handled */
  markAlreadyHandled: (componentId: ComponentId, provider?: string) => void;

  /** Mark a component as not needed */
  markNotNeeded: (componentId: ComponentId, reason?: string) => void;

  /** Restore a component to unresolved state */
  restoreComponent: (componentId: ComponentId) => void;

  /** Update practice profile */
  updateProfile: (profile: Partial<PracticeProfile>) => void;

  /** Mark profile prompt as shown */
  dismissProfilePrompt: () => void;

  /** Reset to initial state */
  reset: () => void;
}

export function usePracticeState(): UsePracticeStateReturn {
  // Always start with initial state to avoid hydration mismatch
  const [state, setState] = useState<PracticeStateV2>(createInitialPracticeState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    const storedState = loadState();
    if (storedState) {
      setState(storedState);
    }
    setIsHydrated(true);
  }, []);

  // Debounced save to localStorage
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't save until we've hydrated (to avoid overwriting with initial state)
    if (!isHydrated) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      saveState(state);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, isHydrated]);

  const updateState = useCallback(
    (updater: (prev: PracticeStateV2) => PracticeStateV2) => {
      setState((prev) => {
        const next = updater(prev);
        return {
          ...next,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const addSolution = useCallback(
    (
      product: ProductArchitectureMetadata,
      productName: string,
      primaryComponent: ComponentId,
      monthlyCostCents?: number
    ) => {
      const coverage = getProductComponentCoverage(product);

      updateState((prev) => {
        // Create the solution
        const solution: SelectedSolution = {
          slug: product.productSlug,
          name: productName,
          addedAt: new Date().toISOString(),
          covers: coverage,
          primaryComponent,
          monthlyCostCents,
        };

        // Update components covered by this solution
        const newComponents = { ...prev.components };
        for (const componentId of coverage) {
          newComponents[componentId] = {
            status: "covered",
            solutionSlug: product.productSlug,
            isPrimary: componentId === primaryComponent,
          };
        }

        return {
          ...prev,
          components: newComponents,
          solutions: [...prev.solutions, solution],
          decisionsMade: prev.decisionsMade + 1,
        };
      });
    },
    [updateState]
  );

  const removeSolution = useCallback(
    (solutionSlug: string) => {
      updateState((prev) => {
        // Find the solution being removed
        const solution = prev.solutions.find((s) => s.slug === solutionSlug);
        if (!solution) return prev;

        // Get remaining solutions after removal
        const remainingSolutions = prev.solutions.filter((s) => s.slug !== solutionSlug);

        // Reset components that were covered by this solution
        // BUT check if any remaining solution also covers them
        const newComponents = { ...prev.components };
        for (const componentId of solution.covers) {
          const componentState = newComponents[componentId];
          if (
            componentState.status === "covered" &&
            componentState.solutionSlug === solutionSlug
          ) {
            // Check if another solution covers this component
            const otherSolution = remainingSolutions.find((s) =>
              s.covers.includes(componentId)
            );

            if (otherSolution) {
              // Another solution covers this component - update to that solution
              newComponents[componentId] = {
                status: "covered",
                solutionSlug: otherSolution.slug,
                isPrimary: otherSolution.primaryComponent === componentId,
              };
            } else {
              // No other solution covers this - reset to unresolved
              newComponents[componentId] = { status: "unresolved" };
            }
          }
        }

        return {
          ...prev,
          components: newComponents,
          solutions: remainingSolutions,
        };
      });
    },
    [updateState]
  );

  const markAlreadyHandled = useCallback(
    (componentId: ComponentId, provider?: string) => {
      updateState((prev) => ({
        ...prev,
        components: {
          ...prev.components,
          [componentId]: {
            status: "already-handled" as const,
            provider,
          },
        },
        decisionsMade: prev.decisionsMade + 1,
      }));
    },
    [updateState]
  );

  const markNotNeeded = useCallback(
    (componentId: ComponentId, reason?: string) => {
      updateState((prev) => ({
        ...prev,
        components: {
          ...prev.components,
          [componentId]: {
            status: "not-needed" as const,
            reason,
          },
        },
        decisionsMade: prev.decisionsMade + 1,
      }));
    },
    [updateState]
  );

  const restoreComponent = useCallback(
    (componentId: ComponentId) => {
      updateState((prev) => ({
        ...prev,
        components: {
          ...prev.components,
          [componentId]: { status: "unresolved" },
        },
      }));
    },
    [updateState]
  );

  const updateProfile = useCallback(
    (profile: Partial<PracticeProfile>) => {
      updateState((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...profile,
        },
      }));
    },
    [updateState]
  );

  const dismissProfilePrompt = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      profilePromptShown: true,
    }));
  }, [updateState]);

  const reset = useCallback(() => {
    setState(createInitialPracticeState());
  }, []);

  return {
    state,
    decisionsLeft: getDecisionsLeft(state),
    isComplete: isEssentialCovered(state),
    estimatedCost: getEstimatedMonthlyCost(state),
    solutionCount: getSolutionCount(state),
    shouldShowProfilePrompt: shouldShowProfilePrompt(state),
    addSolution,
    removeSolution,
    markAlreadyHandled,
    markNotNeeded,
    restoreComponent,
    updateProfile,
    dismissProfilePrompt,
    reset,
  };
}

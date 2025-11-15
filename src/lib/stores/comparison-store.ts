import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Entity } from "@/lib/types/database";

interface ComparisonState {
  // Selected treatments for comparison
  selectedTreatments: Entity[];

  // Comparison settings
  showCharts: boolean;
  selectedMetrics: string[];

  // Actions
  addTreatment: (treatment: Entity) => void;
  removeTreatment: (treatmentId: string) => void;
  clearComparison: () => void;
  toggleCharts: () => void;
  setSelectedMetrics: (metrics: string[]) => void;

  // Computed values
  canAddMore: () => boolean;
  getTreatmentById: (id: string) => Entity | undefined;
  isSelected: (id: string) => boolean;
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      selectedTreatments: [],
      showCharts: true,
      selectedMetrics: ["efficacy_depression", "cost_monthly", "side_effects_sexual"],

      addTreatment: (treatment) => {
        const { selectedTreatments, canAddMore, isSelected } = get();

        if (!canAddMore() || isSelected(treatment.id)) {
          return;
        }

        set({
          selectedTreatments: [...selectedTreatments, treatment],
        });
      },

      removeTreatment: (treatmentId) => {
        set((state) => ({
          selectedTreatments: state.selectedTreatments.filter(
            (treatment) => treatment.id !== treatmentId
          ),
        }));
      },

      clearComparison: () => {
        set({
          selectedTreatments: [],
        });
      },

      toggleCharts: () => {
        set((state) => ({
          showCharts: !state.showCharts,
        }));
      },

      setSelectedMetrics: (metrics) => {
        set({
          selectedMetrics: metrics,
        });
      },

      canAddMore: () => {
        return get().selectedTreatments.length < 4;
      },

      getTreatmentById: (id) => {
        return get().selectedTreatments.find((treatment) => treatment.id === id);
      },

      isSelected: (id) => {
        return get().selectedTreatments.some((treatment) => treatment.id === id);
      },
    }),
    {
      name: "comparison-storage",
      // Only persist the selected treatments, not UI state
      partialize: (state) => ({
        selectedTreatments: state.selectedTreatments,
        selectedMetrics: state.selectedMetrics,
      }),
    }
  )
);

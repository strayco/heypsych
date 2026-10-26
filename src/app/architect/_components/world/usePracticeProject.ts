/**
 * Practice Project State
 *
 * Owns the single canonical project: load, mutate, autosave, report status.
 *
 * Hydration safety: the project starts as null and is only created or loaded
 * inside an effect. Nothing random or time-dependent is evaluated during
 * render, which is the defect class that produced the hydration mismatch in
 * the previous workspace.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CapabilityId } from "@/domains/architect/schemas/lifecycle";
import type { CoverageExtension } from "@/domains/architect/world/coverage";
import {
  createProject,
  type CapabilityDecision,
  type PracticeProfile,
  type PracticeProject,
  type ToolAssignment,
} from "@/domains/architect/schemas/practice-project";
import {
  clearProject,
  loadProjectWithRecovery,
  migrateLegacyProjectIfNeeded,
  readQuarantinedProject,
  saveProject,
  type RecoveryNotice,
  type SaveStatus,
} from "@/domains/architect/persistence/project-persistence";

const AUTOSAVE_DELAY_MS = 600;

export interface UsePracticeProjectResult {
  /** Null until the client has hydrated and loaded storage. */
  project: PracticeProject | null;
  isHydrated: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  /** Set when a stored project had to be repaired or quarantined. */
  recovery: RecoveryNotice | null;
  dismissRecovery: () => void;
  downloadRecoveredOriginal: () => void;

  updateProfile: (changes: Partial<PracticeProfile>) => void;
  completeOnboarding: (profile: PracticeProfile) => void;
  rename: (name: string) => void;

  assignProduct: (assignment: Omit<ToolAssignment, "assignedAt">) => void;
  removeProduct: (productSlug: string) => void;
  /** Remove a product from some functions only, and remember the choice. */
  removeProductFromCapabilities: (
    productSlug: string,
    capabilityIds: CapabilityId[]
  ) => void;
  /** Add functions to products already chosen (automatic coverage). */
  extendCoverage: (extensions: CoverageExtension[]) => void;
  recordDecision: (
    decision: Omit<CapabilityDecision, "decidedAt">
  ) => void;
  clearDecision: (capabilityId: CapabilityId) => void;
  setTaskStatus: (taskId: string, status: "todo" | "in-progress" | "done") => void;

  /** Force an immediate save, for an explicit Save action. */
  saveNow: () => void;
  reset: () => void;
}

export function usePracticeProject(): UsePracticeProjectResult {
  const [project, setProject] = useState<PracticeProject | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<RecoveryNotice | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Suppresses the autosave that would otherwise fire for the initial load.
  const isDirty = useRef(false);

  // --- Load ---------------------------------------------------------------
  useEffect(() => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const loaded = loadProjectWithRecovery();
    const existing =
      loaded.project ?? migrateLegacyProjectIfNeeded({ id, now });

    setProject(existing ?? createProject({ id, now }));
    setRecovery(loaded.recovery);
    setIsHydrated(true);
  }, []);

  // --- Persist ------------------------------------------------------------
  const persist = useCallback((next: PracticeProject) => {
    setSaveStatus("saving");
    try {
      saveProject(next);
      setSaveStatus("saved");
      setSaveError(null);
    } catch (error) {
      setSaveStatus("error");
      setSaveError(
        error instanceof Error ? error.message : "Could not save your project"
      );
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || !project || !isDirty.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(project), AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [project, isHydrated, persist]);

  // --- Mutation helper ----------------------------------------------------
  const mutate = useCallback(
    (updater: (prev: PracticeProject) => PracticeProject) => {
      isDirty.current = true;
      setProject((prev) => {
        if (!prev) return prev;
        return { ...updater(prev), updatedAt: new Date().toISOString() };
      });
    },
    []
  );

  // --- Profile ------------------------------------------------------------
  const updateProfile = useCallback(
    (changes: Partial<PracticeProfile>) => {
      mutate((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...changes },
      }));
    },
    [mutate]
  );

  const completeOnboarding = useCallback(
    (profile: PracticeProfile) => {
      mutate((prev) => ({ ...prev, profile, onboardingComplete: true }));
    },
    [mutate]
  );

  const rename = useCallback(
    (name: string) => mutate((prev) => ({ ...prev, name })),
    [mutate]
  );

  // --- Assignments --------------------------------------------------------
  const assignProduct = useCallback(
    (assignment: Omit<ToolAssignment, "assignedAt">) => {
      mutate((prev) => {
        const assignedAt = new Date().toISOString();
        const existing = prev.assignments.find(
          (a) => a.productSlug === assignment.productSlug
        );

        // Re-assigning a product the practice already has merges the
        // capability coverage rather than creating a second subscription.
        const assignments = existing
          ? prev.assignments.map((a) =>
              a.productSlug === assignment.productSlug
                ? {
                    ...a,
                    ...assignment,
                    capabilityIds: [
                      ...new Set([
                        ...a.capabilityIds,
                        ...assignment.capabilityIds,
                      ]),
                    ],
                    // Choosing the product again for a function the user
                    // had removed it from reverses that removal.
                    declinedCapabilityIds: (a.declinedCapabilityIds ?? []).filter(
                      (id) => !assignment.capabilityIds.includes(id)
                    ),
                    needsReview: false,
                    reviewReason: undefined,
                    assignedAt: a.assignedAt,
                  }
                : a
            )
          : [...prev.assignments, { ...assignment, assignedAt }];

        // Assigning a product supersedes any "not needed" decision on the
        // capabilities it now covers.
        const decisions = prev.decisions.filter(
          (d) => !assignment.capabilityIds.includes(d.capabilityId)
        );

        return { ...prev, assignments, decisions };
      });
    },
    [mutate]
  );

  const removeProductFromCapabilities = useCallback(
    (productSlug: string, capabilityIds: CapabilityId[]) => {
      mutate((prev) => {
        const assignments = prev.assignments.flatMap((a) => {
          if (a.productSlug !== productSlug) return [a];
          const remaining = a.capabilityIds.filter(
            (id) => !capabilityIds.includes(id)
          );
          // Nothing left for this product to do: it leaves the practice.
          if (remaining.length === 0) return [];
          const removed = a.capabilityIds.filter((id) =>
            capabilityIds.includes(id)
          );
          return [
            {
              ...a,
              capabilityIds: remaining,
              declinedCapabilityIds: [
                ...new Set([...(a.declinedCapabilityIds ?? []), ...removed]),
              ],
            },
          ];
        });
        return { ...prev, assignments };
      });
    },
    [mutate]
  );

  const extendCoverage = useCallback(
    (extensions: CoverageExtension[]) => {
      if (extensions.length === 0) return;
      mutate((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) => {
          const ext = extensions.find((e) => e.productSlug === a.productSlug);
          if (!ext) return a;
          return {
            ...a,
            capabilityIds: [...new Set([...a.capabilityIds, ...ext.capabilityIds])],
          };
        }),
      }));
    },
    [mutate]
  );

  const removeProduct = useCallback(
    (productSlug: string) => {
      mutate((prev) => ({
        ...prev,
        assignments: prev.assignments.filter(
          (a) => a.productSlug !== productSlug
        ),
      }));
    },
    [mutate]
  );

  // --- Decisions ----------------------------------------------------------
  const recordDecision = useCallback(
    (decision: Omit<CapabilityDecision, "decidedAt">) => {
      mutate((prev) => ({
        ...prev,
        decisions: [
          ...prev.decisions.filter(
            (d) => d.capabilityId !== decision.capabilityId
          ),
          { ...decision, decidedAt: new Date().toISOString() },
        ],
      }));
    },
    [mutate]
  );

  const clearDecision = useCallback(
    (capabilityId: CapabilityId) => {
      mutate((prev) => ({
        ...prev,
        decisions: prev.decisions.filter(
          (d) => d.capabilityId !== capabilityId
        ),
      }));
    },
    [mutate]
  );

  // --- Setup tasks --------------------------------------------------------
  const setTaskStatus = useCallback(
    (taskId: string, status: "todo" | "in-progress" | "done") => {
      mutate((prev) => {
        const updatedAt = new Date().toISOString();
        const existing = prev.setupTasks.find((t) => t.taskId === taskId);
        return {
          ...prev,
          setupTasks: existing
            ? prev.setupTasks.map((t) =>
                t.taskId === taskId ? { ...t, status, updatedAt } : t
              )
            : [...prev.setupTasks, { taskId, status, updatedAt }],
        };
      });
    },
    [mutate]
  );

  // --- Explicit save ------------------------------------------------------
  const saveNow = useCallback(() => {
    if (!project) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    persist(project);
  }, [project, persist]);

  const reset = useCallback(() => {
    clearProject();
    isDirty.current = false;
    setProject(
      createProject({ id: crypto.randomUUID(), now: new Date().toISOString() })
    );
    setSaveStatus("idle");
    setSaveError(null);
    setRecovery(null);
  }, []);

  const dismissRecovery = useCallback(() => setRecovery(null), []);

  const downloadRecoveredOriginal = useCallback(() => {
    const raw = readQuarantinedProject();
    if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "practice-architect-recovered.json";
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    project,
    isHydrated,
    saveStatus,
    saveError,
    recovery,
    dismissRecovery,
    downloadRecoveredOriginal,
    updateProfile,
    completeOnboarding,
    rename,
    assignProduct,
    removeProduct,
    removeProductFromCapabilities,
    extendCoverage,
    recordDecision,
    clearDecision,
    setTaskStatus,
    saveNow,
    reset,
  };
}

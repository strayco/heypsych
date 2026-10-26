/**
 * Practice Project Persistence
 *
 * Local, anonymous storage for Practice Architect projects.
 *
 * Per decision D-012 persistence stays anonymous and local until accounts,
 * retention, and deletion policy are approved. Nothing here transmits practice
 * data anywhere.
 *
 * Save status is reported honestly: `saved` is only returned after a
 * successful write that was read back. A storage failure surfaces as `error`,
 * never as a silent success.
 */

import {
  CapabilityDecisionZ,
  PracticeProfileZ,
  PracticeProjectZ,
  PRACTICE_PROJECT_VERSION,
  SetupTaskStateZ,
  ToolAssignmentZ,
  type PracticeProject,
  type ToolAssignment,
} from "../schemas/practice-project";

const STORAGE_KEY = "heypsych.architect.project.v3";
const LEGACY_V2_KEY = "practiceState_v2";

/** Where an unreadable project is kept so it is never silently destroyed. */
const QUARANTINE_KEY = "heypsych.architect.project.v3.unreadable";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type RecoveryKind = "repaired" | "quarantined";

export interface RecoveryNotice {
  kind: RecoveryKind;
  /**
   * Assignments that failed validation and were dropped from the repaired
   * project. Zero when the whole project was unreadable.
   */
  droppedAssignments: number;
  message: string;
}

export interface LoadResult {
  project: PracticeProject | null;
  recovery: RecoveryNotice | null;
}

// ============================================================================
// READ / WRITE
// ============================================================================

function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = "__heypsych_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load the saved project.
 *
 * A project that fails validation is repaired rather than discarded. Returning
 * null here means the caller starts a blank project, and the first edit
 * autosaves over whatever was stored — so treating a single malformed
 * assignment as a total loss would quietly destroy a practice the clinician
 * spent real time building. One bad entry costs that entry, nothing more.
 *
 * When nothing can be salvaged the raw value is copied to a quarantine key
 * before the caller is allowed to overwrite it.
 */
/**
 * Load the saved project, with recovery metadata.
 *
 * The original payload is copied to the quarantine key whenever validation
 * fails, *before* any repaired version is returned. Autosave writes to the
 * live key only; it never touches the quarantine, so a later edit cannot
 * destroy the source of a recovery.
 */
export function loadProjectWithRecovery(): LoadResult {
  if (!isStorageAvailable()) return { project: null, recovery: null };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { project: null, recovery: null };

    const value = JSON.parse(raw);
    const parsed = PracticeProjectZ.safeParse(value);
    if (parsed.success) return { project: parsed.data, recovery: null };

    // Keep the original even when we can repair it. The first autosave of a
    // repaired project would otherwise be the only remaining copy of what
    // the clinician actually stored.
    window.localStorage.setItem(QUARANTINE_KEY, raw);

    const salvaged = salvageProject(value);
    if (salvaged) {
      const originalCount = Array.isArray(
        (value as { assignments?: unknown }).assignments
      )
        ? ((value as { assignments: unknown[] }).assignments.length)
        : 0;
      const dropped = Math.max(0, originalCount - salvaged.assignments.length);

      console.warn(
        "[architect] Stored project was repaired on load.",
        parsed.error.issues.slice(0, 3)
      );

      return {
        project: salvaged,
        recovery: {
          kind: "repaired",
          droppedAssignments: dropped,
          message:
            dropped > 0
              ? `We recovered your practice but could not read ${dropped} tool ${
                  dropped === 1 ? "choice" : "choices"
                }. The original file is still available to download.`
              : "We recovered your practice from a file that no longer matched the current format. The original is still available to download.",
        },
      };
    }

    console.warn(
      "[architect] Stored project could not be read; it has been kept at",
      QUARANTINE_KEY,
      parsed.error.issues.slice(0, 3)
    );

    return {
      project: null,
      recovery: {
        kind: "quarantined",
        droppedAssignments: 0,
        message:
          "We could not read the saved practice, so we have not replaced it. You can download the original file and start a new practice without losing that copy.",
      },
    };
  } catch (error) {
    console.warn("[architect] Could not read stored project.", error);
    return { project: null, recovery: null };
  }
}

/** Convenience wrapper for callers that only need the project. */
export function loadProject(): PracticeProject | null {
  return loadProjectWithRecovery().project;
}

export function hasQuarantinedProject(): boolean {
  if (!isStorageAvailable()) return false;
  return Boolean(window.localStorage.getItem(QUARANTINE_KEY));
}

/** The raw quarantined payload, for a download the clinician can keep. */
export function readQuarantinedProject(): string | null {
  if (!isStorageAvailable()) return null;
  return window.localStorage.getItem(QUARANTINE_KEY);
}

export function clearQuarantinedProject(): void {
  if (!isStorageAvailable()) return;
  window.localStorage.removeItem(QUARANTINE_KEY);
}

/**
 * Rebuild a project from a partially valid stored value.
 *
 * Each list is filtered element by element, so a capability ID that has since
 * been renamed or removed from the registry costs the clinician that one
 * assignment instead of their whole practice.
 */
function salvageProject(value: unknown): PracticeProject | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;

  const filterValid = <T>(
    list: unknown,
    schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }
  ): T[] => {
    if (!Array.isArray(list)) return [];
    return list.flatMap((item) => {
      const result = schema.safeParse(item);
      return result.success && result.data !== undefined ? [result.data] : [];
    });
  };

  const candidate = {
    ...record,
    version: PRACTICE_PROJECT_VERSION,
    profile: PracticeProfileZ.safeParse(record.profile).data ?? {
      roles: [],
      states: [],
      services: [],
    },
    assignments: filterValid(record.assignments, ToolAssignmentZ),
    decisions: filterValid(record.decisions, CapabilityDecisionZ),
    setupTasks: filterValid(record.setupTasks, SetupTaskStateZ),
  };

  const parsed = PracticeProjectZ.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * Persist the project and verify the write.
 *
 * Throws on failure so the caller can show a real error instead of a
 * misleading "Saved" confirmation.
 */
export function saveProject(project: PracticeProject): void {
  if (!isStorageAvailable()) {
    throw new Error("Browser storage is unavailable");
  }

  const payload = JSON.stringify(project);
  window.localStorage.setItem(STORAGE_KEY, payload);

  // Read back: quota errors on some browsers fail silently on write.
  const confirmed = window.localStorage.getItem(STORAGE_KEY);
  if (confirmed !== payload) {
    throw new Error("Project could not be confirmed as saved");
  }
}

export function clearProject(): void {
  if (!isStorageAvailable()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ============================================================================
// LEGACY MIGRATION
// ============================================================================

/**
 * The shape the v2 workspace wrote. Only the parts worth preserving are typed.
 */
interface LegacyV2State {
  version?: number;
  id?: string;
  createdAt?: string;
  solutions?: Array<{
    slug?: string;
    name?: string;
    addedAt?: string;
  }>;
  profile?: {
    practiceType?: string;
    size?: string;
    paymentModel?: string;
  };
}

/**
 * Convert a v2 state into a v3 project.
 *
 * The v2 model recorded which of nine components a product covered, not which
 * capabilities. Rather than invent capability coverage, assignments are
 * migrated with an empty capability list and flagged `needsReview`, so the
 * clinician is asked to confirm instead of being shown a fabricated
 * architecture.
 */
export function migrateLegacyV2State(
  legacy: LegacyV2State,
  params: { id: string; now: string }
): PracticeProject | null {
  if (legacy.version !== 2) return null;

  const solutions = legacy.solutions ?? [];
  if (solutions.length === 0) return null;

  const assignments: ToolAssignment[] = solutions
    .filter((s): s is { slug: string; name?: string; addedAt?: string } =>
      Boolean(s.slug)
    )
    .map((s) => ({
      productSlug: s.slug,
      productName: s.name ?? s.slug,
      capabilityIds: [],
      source: "selected" as const,
      assignedAt: s.addedAt ?? params.now,
      needsReview: true,
      reviewReason:
        "Carried over from your previous stack. Open it to confirm what it covers.",
    }));

  const sizeMap: Record<string, "solo" | "2-5" | "6-10"> = {
    solo: "solo",
    "2-5": "2-5",
    "6-20": "6-10",
  };
  const paymentMap: Record<string, "cash" | "insurance" | "both"> = {
    cash: "cash",
    insurance: "insurance",
    both: "both",
  };

  return {
    id: legacy.id ?? params.id,
    version: PRACTICE_PROJECT_VERSION,
    name: "My Practice",
    createdAt: legacy.createdAt ?? params.now,
    updatedAt: params.now,
    profile: {
      roles: [],
      states: [],
      services: [],
      size: legacy.profile?.size ? sizeMap[legacy.profile.size] : undefined,
      payment: legacy.profile?.paymentModel
        ? paymentMap[legacy.profile.paymentModel]
        : undefined,
    },
    assignments,
    decisions: [],
    setupTasks: [],
    // Force onboarding: the v2 profile is too thin to run the engines.
    onboardingComplete: false,
  };
}

/**
 * Migrate a v2 stack if one exists and no v3 project has been saved.
 *
 * The legacy key is left in place. Removing it would make the migration
 * irreversible if the user rolls back to the previous experience.
 */
export function migrateLegacyProjectIfNeeded(params: {
  id: string;
  now: string;
}): PracticeProject | null {
  if (!isStorageAvailable()) return null;
  if (window.localStorage.getItem(STORAGE_KEY)) return null;

  try {
    const raw = window.localStorage.getItem(LEGACY_V2_KEY);
    if (!raw) return null;

    const migrated = migrateLegacyV2State(JSON.parse(raw), params);
    if (!migrated) return null;

    saveProject(migrated);
    return migrated;
  } catch (error) {
    console.warn("[architect] Could not migrate previous stack.", error);
    return null;
  }
}

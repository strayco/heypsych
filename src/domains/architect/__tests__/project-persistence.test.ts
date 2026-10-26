// @vitest-environment jsdom

/**
 * Persistence tests.
 *
 * The behaviour under test is mostly about what must NOT happen: a save must
 * never report success it cannot prove, and a damaged project must never be
 * silently replaced with an empty one.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearProject,
  loadProject,
  loadProjectWithRecovery,
  migrateLegacyV2State,
  readQuarantinedProject,
  saveProject,
} from "../persistence/project-persistence";
import {
  createProject,
  PRACTICE_PROJECT_VERSION,
  type PracticeProject,
} from "../schemas/practice-project";

const STORAGE_KEY = "heypsych.architect.project.v3";
const QUARANTINE_KEY = "heypsych.architect.project.v3.unreadable";

function baseProject(): PracticeProject {
  return createProject({
    id: "11111111-1111-4111-8111-111111111111",
    now: "2026-01-01T00:00:00.000Z",
  });
}

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("save and load", () => {
  it("round-trips a project", () => {
    const project = baseProject();
    saveProject(project);
    expect(loadProject()).toEqual(project);
  });

  it("returns null when nothing is stored", () => {
    expect(loadProject()).toBeNull();
  });

  it("throws rather than reporting a save that did not happen", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string
    ) {
      // The probe must succeed or the code reports storage as unavailable;
      // only the real write is dropped, as a silent quota failure would be.
      if (key !== STORAGE_KEY) return;
    });

    expect(() => saveProject(baseProject())).toThrow();
  });

  it("clears the project", () => {
    saveProject(baseProject());
    clearProject();
    expect(loadProject()).toBeNull();
  });
});

describe("recovery from damaged storage", () => {
  it("keeps the rest of the practice when one assignment is invalid", () => {
    const project = baseProject();
    project.onboardingComplete = true;
    project.profile.roles = ["therapist"];

    const damaged = {
      ...project,
      assignments: [
        {
          productSlug: "good-tool",
          productName: "Good Tool",
          capabilityIds: ["scheduling"],
          source: "selected",
          assignedAt: "2026-01-01T00:00:00.000Z",
          needsReview: false,
        },
        // A capability that no longer exists in the registry.
        {
          productSlug: "stale-tool",
          productName: "Stale Tool",
          capabilityIds: ["capability-that-was-removed"],
          source: "selected",
          assignedAt: "2026-01-01T00:00:00.000Z",
          needsReview: false,
        },
      ],
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(damaged));

    const loaded = loadProjectWithRecovery();
    expect(loaded.project).not.toBeNull();
    expect(loaded.project?.onboardingComplete).toBe(true);
    expect(loaded.project?.profile.roles).toEqual(["therapist"]);
    expect(loaded.project?.assignments.map((a) => a.productSlug)).toEqual([
      "good-tool",
    ]);
    expect(loaded.recovery?.kind).toBe("repaired");
    expect(loaded.recovery?.droppedAssignments).toBe(1);

    // The original payload must survive the repair so a later autosave of
    // the repaired project cannot be the only remaining copy.
    expect(readQuarantinedProject()).toBe(JSON.stringify(damaged));
  });

  it("does not let a later save erase the quarantined original", () => {
    const raw = JSON.stringify({ totally: "wrong" });
    window.localStorage.setItem(STORAGE_KEY, raw);
    loadProjectWithRecovery();

    saveProject(baseProject());

    expect(readQuarantinedProject()).toBe(raw);
    expect(loadProject()).toEqual(baseProject());
  });

  it("quarantines a project it cannot read instead of dropping it", () => {
    const raw = JSON.stringify({ totally: "wrong" });
    window.localStorage.setItem(STORAGE_KEY, raw);

    expect(loadProject()).toBeNull();
    expect(window.localStorage.getItem(QUARANTINE_KEY)).toBe(raw);
  });

  it("does not throw on malformed JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(() => loadProject()).not.toThrow();
    expect(loadProject()).toBeNull();
  });
});

describe("v2 migration", () => {
  const params = {
    id: "22222222-2222-4222-8222-222222222222",
    now: "2026-01-01T00:00:00.000Z",
  };

  it("carries previous tools over for review rather than inventing coverage", () => {
    const migrated = migrateLegacyV2State(
      {
        version: 2,
        solutions: [{ slug: "simple-practice", name: "SimplePractice" }],
      },
      params
    );

    expect(migrated?.version).toBe(PRACTICE_PROJECT_VERSION);
    expect(migrated?.assignments).toHaveLength(1);
    // The v2 model never recorded capabilities, so none may be asserted here.
    expect(migrated?.assignments[0].capabilityIds).toEqual([]);
    expect(migrated?.assignments[0].needsReview).toBe(true);
    // The v2 profile is too thin to run the engines against.
    expect(migrated?.onboardingComplete).toBe(false);
  });

  it("ignores a state that is not v2", () => {
    expect(migrateLegacyV2State({ version: 1, solutions: [] }, params)).toBeNull();
  });

  it("ignores an empty v2 stack", () => {
    expect(migrateLegacyV2State({ version: 2, solutions: [] }, params)).toBeNull();
  });
});

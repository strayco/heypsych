/**
 * World State Derivation
 *
 * Computes the display state of every illustrated object from the project.
 *
 * The scene is always reconstructed from project data; no visual state is
 * persisted. That guarantees the illustration cannot drift from the clinical
 * decisions it depicts, and that reopening a saved project rebuilds the exact
 * same room.
 *
 * Honesty rule: an object reaching `configured` means the clinician chose this
 * tool for their architecture. It does not mean an account exists, an
 * integration runs, or any compliance obligation is satisfied.
 */

import type { CapabilityId } from "../schemas/lifecycle";
import type {
  PracticeProject,
  ToolAssignment,
} from "../schemas/practice-project";
import {
  getAssignmentsForCapability,
  getDecisionForCapability,
} from "../schemas/practice-project";
import {
  getApplicableObjects,
  type WorldObjectDefinition,
  type WorldObjectId,
} from "./object-registry";

// ============================================================================
// STATES
// ============================================================================

/**
 * The interaction states an object can be in.
 *
 * `needsVerification` is distinct from `configured` because an unresolved
 * evidence question must stay visible after a product is chosen.
 */
export type WorldObjectDisplayState =
  | "not-applicable"
  | "unconfigured"
  | "configured"
  | "handled-elsewhere"
  | "not-needed";

export interface WorldObjectState {
  definition: WorldObjectDefinition;
  state: WorldObjectDisplayState;

  /** Assignments covering any of this object's capabilities. */
  assignments: ToolAssignment[];

  /** Primary product name to render on the object, when configured. */
  productName?: string;

  /**
   * True when more than one distinct product covers this object's
   * capabilities, which usually means duplicated spend.
   */
  hasOverlap: boolean;
  overlappingProductNames: string[];

  /** Capabilities of this object still without a product or a decision. */
  unresolvedCapabilityIds: CapabilityId[];

  /** Capabilities of this object covered by an assignment. */
  coveredCapabilityIds: CapabilityId[];
}

// ============================================================================
// DERIVATION
// ============================================================================

function deriveObjectState(
  definition: WorldObjectDefinition,
  project: PracticeProject
): WorldObjectState {
  const covered: CapabilityId[] = [];
  const unresolved: CapabilityId[] = [];
  const assignmentsBySlug = new Map<string, ToolAssignment>();

  let handledElsewhere = 0;
  let notNeeded = 0;

  for (const capabilityId of definition.capabilityIds) {
    const assignments = getAssignmentsForCapability(project, capabilityId);

    if (assignments.length > 0) {
      covered.push(capabilityId);
      for (const assignment of assignments) {
        assignmentsBySlug.set(assignment.productSlug, assignment);
      }
      continue;
    }

    const decision = getDecisionForCapability(project, capabilityId);
    if (decision?.decision === "handled-elsewhere") {
      handledElsewhere++;
      continue;
    }
    if (decision?.decision === "not-needed") {
      notNeeded++;
      continue;
    }

    unresolved.push(capabilityId);
  }

  const assignments = [...assignmentsBySlug.values()];

  // External objects such as malpractice carry no capabilities, so they are
  // driven purely by the decision the user recorded against the object itself.
  if (definition.isExternal) {
    const decision = getDecisionForCapability(
      project,
      definition.objectId as unknown as CapabilityId
    );
    const externalState: WorldObjectDisplayState =
      decision?.decision === "handled-elsewhere"
        ? "handled-elsewhere"
        : decision?.decision === "not-needed"
          ? "not-needed"
          : "unconfigured";

    return {
      definition,
      state: externalState,
      assignments: [],
      productName: decision?.note,
      hasOverlap: false,
      overlappingProductNames: [],
      unresolvedCapabilityIds: [],
      coveredCapabilityIds: [],
    };
  }

  let state: WorldObjectDisplayState;
  if (assignments.length > 0) {
    state = "configured";
  } else if (handledElsewhere > 0) {
    state = "handled-elsewhere";
  } else if (notNeeded > 0 && unresolved.length === 0) {
    state = "not-needed";
  } else {
    state = "unconfigured";
  }

  // The product shown on the object is the one covering the most of this
  // object's capabilities, so a dedicated tool wins over an incidental overlap.
  const primary = [...assignments].sort((a, b) => {
    const aCount = a.capabilityIds.filter((c) =>
      definition.capabilityIds.includes(c)
    ).length;
    const bCount = b.capabilityIds.filter((c) =>
      definition.capabilityIds.includes(c)
    ).length;
    if (aCount !== bCount) return bCount - aCount;
    return a.productSlug.localeCompare(b.productSlug);
  })[0];

  return {
    definition,
    state,
    assignments,
    productName: primary?.productName,
    hasOverlap: assignments.length > 1,
    overlappingProductNames: assignments.map((a) => a.productName),
    unresolvedCapabilityIds: unresolved,
    coveredCapabilityIds: covered,
  };
}

export interface WorldState {
  objects: WorldObjectState[];
  byId: Map<WorldObjectId, WorldObjectState>;

  /** Objects in the scene that still need a decision. */
  decisionsRemaining: number;

  /** Objects in the scene that are resolved by any means. */
  resolvedCount: number;

  /** Total applicable objects in the scene. */
  applicableCount: number;

  /** True when every applicable object has been resolved. */
  isComplete: boolean;

  /** Objects covered by more than one product. */
  overlaps: WorldObjectState[];
}

/**
 * Derive the complete world state for a project.
 */
export function deriveWorldState(project: PracticeProject): WorldState {
  const definitions = getApplicableObjects(project.profile);
  const objects = definitions.map((d) => deriveObjectState(d, project));

  const byId = new Map<WorldObjectId, WorldObjectState>();
  for (const object of objects) {
    byId.set(object.definition.objectId, object);
  }

  const resolvedCount = objects.filter(
    (o) => o.state !== "unconfigured"
  ).length;

  return {
    objects,
    byId,
    decisionsRemaining: objects.length - resolvedCount,
    resolvedCount,
    applicableCount: objects.length,
    isComplete: objects.length > 0 && resolvedCount === objects.length,
    overlaps: objects.filter((o) => o.hasOverlap),
  };
}

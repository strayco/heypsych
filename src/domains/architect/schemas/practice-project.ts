/**
 * Practice Project Schema
 *
 * The canonical persisted model for Practice Architect. One project holds the
 * practice profile, every capability assignment, and setup progress.
 *
 * This replaces the v2 `PracticeStateV2` component-grid model. A v2 migration
 * lives in `migrateLegacyV2State` so saved stacks are never silently dropped.
 *
 * Design rules:
 * - The project stores decisions, never derived results. Coverage, cost, fit,
 *   and eligibility are recomputed from the engines on load so a catalog change
 *   can never leave a stale recommendation frozen in storage.
 * - The project stores capability assignments, not scene pixels. The illustrated
 *   world is reconstructed deterministically from this model.
 */

import { z } from "zod";
import {
  ClinicalRoleZ,
  DeliveryModelZ,
  PracticeSizeBucketZ,
  USStateZ,
} from "./fingerprint";
import { CapabilityIdZ, type CapabilityId } from "./lifecycle";

// ============================================================================
// PRACTICE PROFILE
// ============================================================================

/**
 * Where the practice is in its lifecycle. Drives setup-plan language: a new
 * practice gets launch tasks, an established one gets migration tasks.
 */
export const PracticeStageZ = z.enum([
  "new",
  "established",
  "expanding",
  "updating",
]);
export type PracticeStage = z.infer<typeof PracticeStageZ>;

export const PRACTICE_STAGE_LABELS: Record<PracticeStage, string> = {
  new: "Starting a new practice",
  established: "Running an established practice",
  expanding: "Growing the practice",
  updating: "Replacing tools we already use",
};

/**
 * Payment model as clinicians describe it. Normalized to the canonical
 * `PayerType` in the fingerprint adapter.
 */
export const PaymentModelZ = z.enum(["cash", "insurance", "both"]);
export type PaymentModel = z.infer<typeof PaymentModelZ>;

export const PAYMENT_MODEL_LABELS: Record<PaymentModel, string> = {
  cash: "Private pay only",
  insurance: "Insurance only",
  both: "Both private pay and insurance",
};

/**
 * Services the practice actually delivers.
 *
 * Services, not job titles, determine which capabilities apply. A psychologist
 * who does not offer testing should never be shown a testing workstation, and a
 * title alone never establishes prescribing authority.
 */
export const PracticeServiceZ = z.enum([
  "psychotherapy",
  "psychological-testing",
  "medication-management",
  "group-therapy",
  "couples-family-therapy",
  "substance-use-treatment",
  "outcome-measurement",
]);
export type PracticeService = z.infer<typeof PracticeServiceZ>;

export const PRACTICE_SERVICE_LABELS: Record<PracticeService, string> = {
  psychotherapy: "Individual psychotherapy",
  "psychological-testing": "Psychological or neuropsychological testing",
  "medication-management": "Medication management",
  "group-therapy": "Group therapy",
  "couples-family-therapy": "Couples or family therapy",
  "substance-use-treatment": "Substance use treatment",
  "outcome-measurement": "Routine outcome measurement",
};

/**
 * Whether the practice prescribes, and at what level.
 *
 * Collected explicitly rather than inferred from role, because prescribing
 * authority varies by credential, state, and DEA registration.
 */
export const PrescribingScopeZ = z.enum([
  "none",
  "non-controlled",
  "controlled",
]);
export type PrescribingScope = z.infer<typeof PrescribingScopeZ>;

export const PRESCRIBING_SCOPE_LABELS: Record<PrescribingScope, string> = {
  none: "We do not prescribe",
  "non-controlled": "We prescribe, but not controlled substances",
  controlled: "We prescribe controlled substances",
};

export const PracticeProfileZ = z.object({
  /** Clinical roles present in the practice. At least one for a usable profile. */
  roles: z.array(ClinicalRoleZ).default([]),

  /** Lifecycle stage, drives setup-plan framing. */
  stage: PracticeStageZ.optional(),

  /** Provider count bucket. */
  size: PracticeSizeBucketZ.optional(),

  /** Exact provider count when the user supplies it. Improves per-seat pricing. */
  providerCount: z.number().int().positive().optional(),

  /** States the practice serves. First entry is treated as primary. */
  states: z.array(USStateZ).default([]),

  /** In-person, hybrid, or telehealth-only. */
  delivery: DeliveryModelZ.optional(),

  /** How the practice gets paid. */
  payment: PaymentModelZ.optional(),

  /** Services delivered. Drives capability applicability. */
  services: z.array(PracticeServiceZ).default([]),

  /** Prescribing scope, asked only when a prescribing role is present. */
  prescribing: PrescribingScopeZ.optional(),

  /** Optional monthly software budget in whole dollars. */
  monthlyBudget: z.number().positive().optional(),
});

export type PracticeProfile = z.infer<typeof PracticeProfileZ>;

export function createEmptyProfile(): PracticeProfile {
  return { roles: [], states: [], services: [] };
}

/**
 * Whether the profile has enough signal to run the engines.
 *
 * Deliberately permissive: the world should open as soon as we know enough to
 * be useful, and refine as the user adds detail.
 */
export function isProfileUsable(profile: PracticeProfile): boolean {
  return (
    profile.roles.length > 0 &&
    profile.size !== undefined &&
    profile.delivery !== undefined &&
    profile.payment !== undefined
  );
}

// ============================================================================
// CAPABILITY ASSIGNMENT
// ============================================================================

/**
 * How a capability came to be resolved.
 *
 * `existing` records a tool the practice already uses. It is a real assignment
 * for coverage and cost purposes but is framed differently in the setup plan.
 */
export const AssignmentSourceZ = z.enum([
  "selected",
  "existing",
  "external",
]);
export type AssignmentSource = z.infer<typeof AssignmentSourceZ>;

/**
 * A product assigned to satisfy one or more capabilities.
 *
 * `capabilityIds` lists every capability this one product covers for this
 * practice, which is how a single EHR can light up scheduling, intake,
 * documentation, and telehealth without creating four subscriptions.
 */
export const ToolAssignmentZ = z.object({
  /** Canonical product slug. Stable across catalog edits. */
  productSlug: z.string(),

  /** Product name captured at assignment time, for display without a refetch. */
  productName: z.string(),

  /** Capabilities this product covers for this practice. */
  capabilityIds: z.array(CapabilityIdZ).default([]),

  /** The capability the user was looking at when they assigned it. */
  primaryCapabilityId: CapabilityIdZ.optional(),

  /**
   * Capabilities the user explicitly removed this product from. Automatic
   * coverage (a product filling functions it also handles) never re-adds them.
   */
  declinedCapabilityIds: z.array(CapabilityIdZ).optional(),

  source: AssignmentSourceZ.default("selected"),

  /** ISO timestamp. */
  assignedAt: z.string(),

  /**
   * Set when the catalog changed in a way that may invalidate this choice.
   * Never auto-reassign; flag and let the user decide.
   */
  needsReview: z.boolean().default(false),
  reviewReason: z.string().optional(),
});

export type ToolAssignment = z.infer<typeof ToolAssignmentZ>;

/**
 * A capability the user has explicitly resolved without assigning a product.
 */
export const CapabilityDecisionZ = z.object({
  capabilityId: CapabilityIdZ,
  decision: z.enum(["not-needed", "handled-elsewhere", "deferred"]),
  /** Free-text provider name when handled elsewhere. */
  note: z.string().optional(),
  decidedAt: z.string(),
});

export type CapabilityDecision = z.infer<typeof CapabilityDecisionZ>;

// ============================================================================
// SETUP TASKS
// ============================================================================

export const SetupTaskStatusZ = z.enum(["todo", "in-progress", "done"]);
export type SetupTaskStatus = z.infer<typeof SetupTaskStatusZ>;

/**
 * Per-task user state. The task definitions themselves are generated from the
 * project, so only mutable state is persisted.
 */
export const SetupTaskStateZ = z.object({
  taskId: z.string(),
  status: SetupTaskStatusZ.default("todo"),
  note: z.string().optional(),
  updatedAt: z.string(),
});

export type SetupTaskState = z.infer<typeof SetupTaskStateZ>;

// ============================================================================
// PROJECT
// ============================================================================

export const PRACTICE_PROJECT_VERSION = 3 as const;

export const PracticeProjectZ = z.object({
  id: z.string(),
  version: z.literal(PRACTICE_PROJECT_VERSION),

  /** User-editable project name. */
  name: z.string().default("My Practice"),

  createdAt: z.string(),
  updatedAt: z.string(),

  profile: PracticeProfileZ,

  /** Product assignments, keyed by slug in application code. */
  assignments: z.array(ToolAssignmentZ).default([]),

  /** Capabilities resolved without a product. */
  decisions: z.array(CapabilityDecisionZ).default([]),

  /** Setup task progress. */
  setupTasks: z.array(SetupTaskStateZ).default([]),

  /** Whether onboarding has been completed at least once. */
  onboardingComplete: z.boolean().default(false),
});

export type PracticeProject = z.infer<typeof PracticeProjectZ>;

// ============================================================================
// CONSTRUCTION
// ============================================================================

/**
 * Create an empty project.
 *
 * `id` and timestamps are injected rather than generated internally so callers
 * on the server and the client produce identical output. Generating them here
 * would make this unsafe to call during render.
 */
export function createProject(params: {
  id: string;
  now: string;
  name?: string;
  profile?: PracticeProfile;
}): PracticeProject {
  return {
    id: params.id,
    version: PRACTICE_PROJECT_VERSION,
    name: params.name ?? "My Practice",
    createdAt: params.now,
    updatedAt: params.now,
    profile: params.profile ?? createEmptyProfile(),
    assignments: [],
    decisions: [],
    setupTasks: [],
    onboardingComplete: false,
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/** Every capability covered by an assigned product. */
export function getAssignedCapabilityIds(
  project: PracticeProject
): Set<CapabilityId> {
  const ids = new Set<CapabilityId>();
  for (const assignment of project.assignments) {
    for (const capabilityId of assignment.capabilityIds) {
      ids.add(capabilityId);
    }
  }
  return ids;
}

/** The assignment covering a capability, if any. */
export function getAssignmentForCapability(
  project: PracticeProject,
  capabilityId: CapabilityId
): ToolAssignment | undefined {
  return project.assignments.find((a) => a.capabilityIds.includes(capabilityId));
}

/** Every assignment covering a capability. More than one means overlap. */
export function getAssignmentsForCapability(
  project: PracticeProject,
  capabilityId: CapabilityId
): ToolAssignment[] {
  return project.assignments.filter((a) => a.capabilityIds.includes(capabilityId));
}

export function getDecisionForCapability(
  project: PracticeProject,
  capabilityId: CapabilityId
): CapabilityDecision | undefined {
  return project.decisions.find((d) => d.capabilityId === capabilityId);
}

export function getSetupTaskState(
  project: PracticeProject,
  taskId: string
): SetupTaskState | undefined {
  return project.setupTasks.find((t) => t.taskId === taskId);
}

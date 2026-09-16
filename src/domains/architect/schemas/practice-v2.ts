/**
 * Practice Architect v2 - State Schema
 *
 * Simplified state model for the visual configurator:
 * - 7 components (not 48 capabilities)
 * - 4 zones (not 6 lifecycle stages)
 * - "decisions left" progress model
 */

import { z } from "zod";

// ============================================================================
// COMPONENT IDS
// ============================================================================

/**
 * The 7 essential practice components.
 * These are user-facing concepts, not technical capabilities.
 */
export const ComponentIdZ = z.enum([
  "website",
  "scheduling",
  "intake",
  "clinical-records",
  "visits",
  "prescribing",
  "payments",
  "malpractice",
  "accounting",
]);

export type ComponentId = z.infer<typeof ComponentIdZ>;

export const COMPONENT_IDS = ComponentIdZ.options;

// ============================================================================
// ZONE IDS
// ============================================================================

/**
 * The 4 practice zones that organize components.
 */
export const ZoneIdZ = z.enum([
  "get-patients-in",
  "provide-care",
  "get-paid",
  "run-practice",
]);

export type ZoneId = z.infer<typeof ZoneIdZ>;

// ============================================================================
// COMPONENT STATES
// ============================================================================

/**
 * Unresolved: User hasn't made a decision yet.
 */
export const UnresolvedStateZ = z.object({
  status: z.literal("unresolved"),
});

/**
 * Covered: A solution (product) covers this component.
 */
export const CoveredStateZ = z.object({
  status: z.literal("covered"),
  /** The product slug that covers this component */
  solutionSlug: z.string(),
  /** Whether this was the primary component the user clicked to add the solution */
  isPrimary: z.boolean().default(false),
});

/**
 * Already Handled: User has this covered outside Practice Architect.
 */
export const AlreadyHandledStateZ = z.object({
  status: z.literal("already-handled"),
  /** Optional: name of the provider/service */
  provider: z.string().optional(),
  /** Optional: user note */
  note: z.string().optional(),
});

/**
 * Not Needed: User has decided they don't need this component.
 */
export const NotNeededStateZ = z.object({
  status: z.literal("not-needed"),
  /** Optional: reason for exclusion */
  reason: z.string().optional(),
});

export const ComponentStateZ = z.discriminatedUnion("status", [
  UnresolvedStateZ,
  CoveredStateZ,
  AlreadyHandledStateZ,
  NotNeededStateZ,
]);

export type ComponentState = z.infer<typeof ComponentStateZ>;

// ============================================================================
// SELECTED SOLUTION
// ============================================================================

/**
 * A solution that has been added to the practice.
 */
export const SelectedSolutionZ = z.object({
  /** Product slug */
  slug: z.string(),
  /** Product name (for display without refetching) */
  name: z.string(),
  /** When the solution was added */
  addedAt: z.string().datetime(),
  /** Which components this solution covers */
  covers: z.array(ComponentIdZ),
  /** The component the user clicked to add this solution */
  primaryComponent: ComponentIdZ,
  /** Estimated monthly cost in cents (if known) */
  monthlyCostCents: z.number().optional(),
});

export type SelectedSolution = z.infer<typeof SelectedSolutionZ>;

// ============================================================================
// PRACTICE PROFILE (Progressive Profiling)
// ============================================================================

export const PracticeTypeZ = z.enum(["therapist", "psychiatrist", "both"]);
export type PracticeType = z.infer<typeof PracticeTypeZ>;

export const PracticeSizeZ = z.enum(["solo", "2-5", "6-20"]);
export type PracticeSize = z.infer<typeof PracticeSizeZ>;

export const PaymentModelZ = z.enum(["cash", "insurance", "both"]);
export type PaymentModel = z.infer<typeof PaymentModelZ>;

/**
 * Progressive profile collected after 1-2 decisions.
 * Used to improve recommendations.
 */
export const PracticeProfileZ = z.object({
  practiceType: PracticeTypeZ.optional(),
  size: PracticeSizeZ.optional(),
  paymentModel: PaymentModelZ.optional(),
});

export type PracticeProfile = z.infer<typeof PracticeProfileZ>;

// ============================================================================
// MAIN PRACTICE STATE
// ============================================================================

/**
 * The complete practice state for v2.
 */
export const PracticeStateV2Z = z.object({
  /** Unique ID for this practice configuration */
  id: z.string().uuid(),
  /** Schema version for future migrations */
  version: z.literal(2),
  /** When the practice was created */
  createdAt: z.string().datetime(),
  /** When the practice was last modified */
  updatedAt: z.string().datetime(),

  /** Component states keyed by component ID */
  components: z.record(ComponentIdZ, ComponentStateZ),

  /** Solutions that have been added */
  solutions: z.array(SelectedSolutionZ),

  /** Progressive profile (collected after initial decisions) */
  profile: PracticeProfileZ.optional(),

  /** Whether the profile prompt has been shown */
  profilePromptShown: z.boolean().default(false),

  /** Number of decisions made (for tracking profile prompt timing) */
  decisionsMade: z.number().default(0),
});

export type PracticeStateV2 = z.infer<typeof PracticeStateV2Z>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create initial practice state with all components unresolved.
 */
export function createInitialPracticeState(): PracticeStateV2 {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const components: Record<ComponentId, ComponentState> = {
    website: { status: "unresolved" },
    scheduling: { status: "unresolved" },
    intake: { status: "unresolved" },
    "clinical-records": { status: "unresolved" },
    visits: { status: "unresolved" },
    prescribing: { status: "unresolved" },
    payments: { status: "unresolved" },
    malpractice: { status: "unresolved" },
    accounting: { status: "unresolved" },
  };

  return {
    id,
    version: 2,
    createdAt: now,
    updatedAt: now,
    components,
    solutions: [],
    profilePromptShown: false,
    decisionsMade: 0,
  };
}

/**
 * Count unresolved components (decisions left).
 */
export function getDecisionsLeft(state: PracticeStateV2): number {
  return Object.values(state.components).filter(
    (c) => c.status === "unresolved"
  ).length;
}

/**
 * Check if all essential components are resolved.
 */
export function isEssentialCovered(state: PracticeStateV2): boolean {
  return getDecisionsLeft(state) === 0;
}

/**
 * Get total estimated monthly cost.
 * Returns null if any solution has unknown pricing.
 */
export function getEstimatedMonthlyCost(state: PracticeStateV2): number | null {
  let total = 0;
  let hasUnknown = false;

  for (const solution of state.solutions) {
    if (solution.monthlyCostCents !== undefined) {
      total += solution.monthlyCostCents;
    } else {
      hasUnknown = true;
    }
  }

  // Return total even with unknowns, but flag it
  return total;
}

/**
 * Get solution count.
 */
export function getSolutionCount(state: PracticeStateV2): number {
  return state.solutions.length;
}

/**
 * Get components covered by a specific solution.
 */
export function getComponentsCoveredBySolution(
  state: PracticeStateV2,
  solutionSlug: string
): ComponentId[] {
  return Object.entries(state.components)
    .filter(
      ([_, componentState]) =>
        componentState.status === "covered" &&
        componentState.solutionSlug === solutionSlug
    )
    .map(([id]) => id as ComponentId);
}

/**
 * Check if the practice should show the profile prompt.
 * Shows after 2 decisions if not already shown.
 */
export function shouldShowProfilePrompt(state: PracticeStateV2): boolean {
  return state.decisionsMade >= 2 && !state.profilePromptShown;
}

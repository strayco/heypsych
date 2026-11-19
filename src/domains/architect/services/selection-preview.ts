/**
 * What choosing a product does to the practice, computed without touching it.
 *
 * The inspector previews a choice with the same project operations the
 * selection performs (usePracticeProject uses these functions) and the same
 * cost function the ledger, header total and printed plan use. So the preview
 * is always the net change in the whole stack: a replaced tool that still
 * covers other functions keeps costing money, and a tool already in the stack
 * adds nothing.
 */
import type { CapabilityId } from "../schemas/lifecycle";
import type { PracticeFingerprint } from "../schemas/fingerprint";
import type { ProductArchitectureMetadata } from "../schemas/product-metadata";
import type { PracticeProject, ToolAssignment } from "../schemas/practice-project";
import { calculateProjectCost } from "./project-summary-service";

/** Remove a product from some functions; it leaves the practice when nothing is left. */
export function withoutProductOnCapabilities(
  prev: PracticeProject,
  productSlug: string,
  capabilityIds: CapabilityId[]
): PracticeProject {
  const assignments = prev.assignments.flatMap((a) => {
    if (a.productSlug !== productSlug) return [a];
    const remaining = a.capabilityIds.filter((id) => !capabilityIds.includes(id));
    // Nothing left for this product to do: it leaves the practice.
    if (remaining.length === 0) return [];
    const removed = a.capabilityIds.filter((id) => capabilityIds.includes(id));
    return [
      {
        ...a,
        capabilityIds: remaining,
        declinedCapabilityIds: [...new Set([...(a.declinedCapabilityIds ?? []), ...removed])],
      },
    ];
  });
  return { ...prev, assignments };
}

/** Assign a product; re-assigning one the practice already has merges coverage. */
export function withProductAssigned(
  prev: PracticeProject,
  assignment: Omit<ToolAssignment, "assignedAt">,
  assignedAt: string
): PracticeProject {
  const existing = prev.assignments.find((a) => a.productSlug === assignment.productSlug);

  // Re-assigning a product the practice already has merges the
  // capability coverage rather than creating a second subscription.
  const assignments = existing
    ? prev.assignments.map((a) =>
        a.productSlug === assignment.productSlug
          ? {
              ...a,
              ...assignment,
              capabilityIds: [...new Set([...a.capabilityIds, ...assignment.capabilityIds])],
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
  const decisions = prev.decisions.filter((d) => !assignment.capabilityIds.includes(d.capabilityId));

  return { ...prev, assignments, decisions };
}

/** A selection as the inspector performs it. */
export interface SelectionPlan {
  assignment: Omit<ToolAssignment, "assignedAt">;
  /** The draft suggestion this choice replaces on the selected function, if any. */
  replaced: { productSlug: string; capabilityIds: CapabilityId[] } | null;
}

/** The project after a selection, built with the same steps the selection runs. */
export function projectAfterSelection(project: PracticeProject, plan: SelectionPlan): PracticeProject {
  const afterRemoval = plan.replaced
    ? withoutProductOnCapabilities(project, plan.replaced.productSlug, plan.replaced.capabilityIds)
    : project;
  return withProductAssigned(afterRemoval, plan.assignment, new Date(0).toISOString());
}

export interface SelectionCostPreview {
  /** Net change to the monthly total, or null when an unpriced or quote-only tool enters or leaves. */
  deltaCents: number | null;
  beforeCents: number;
  afterCents: number;
  /** True when the replaced tool leaves the practice entirely. */
  replacedLeaves: boolean;
}

export function previewSelectionCost(
  project: PracticeProject,
  plan: SelectionPlan,
  fingerprint: PracticeFingerprint,
  metadataBySlug: Map<string, ProductArchitectureMetadata>
): SelectionCostPreview {
  const after = projectAfterSelection(project, plan);
  const before = calculateProjectCost(project, fingerprint, metadataBySlug);
  const next = calculateProjectCost(after, fingerprint, metadataBySlug);
  const uncertain = next.unknownCount !== before.unknownCount || next.quoteCount !== before.quoteCount;
  return {
    deltaCents: uncertain ? null : next.knownMonthlyCents - before.knownMonthlyCents,
    beforeCents: before.knownMonthlyCents,
    afterCents: next.knownMonthlyCents,
    replacedLeaves: plan.replaced
      ? !after.assignments.some((a) => a.productSlug === plan.replaced!.productSlug)
      : false,
  };
}

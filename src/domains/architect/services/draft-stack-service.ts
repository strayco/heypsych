/**
 * Draft my practice
 *
 * A complete first draft of a practice's stack in one step, so a clinician
 * starts from a furnished office and edits, rather than from thirteen empty
 * decisions.
 *
 * Built entirely from the existing engines: for each function the practice
 * needs, it takes the recommendation the inspector would show
 * (`recommendProductsForCapabilities`: eligibility, fit, relevance, cost; no
 * commercial input), and lets each pick cover the other open functions it
 * handles as an established built-in feature (`gapFillCapabilities`), exactly
 * as a manual choice does. The clinical record is drafted first because an
 * all-in-one EHR resolves the most functions and keeps tool sprawl down.
 *
 * Pure and deterministic: same project, fingerprint and catalog in, same
 * draft out. Never overwrites a function the clinician has already resolved,
 * and only drafts functions the relevance engine rates required or strongly
 * recommended for this practice; optional ones stay for the clinician.
 */

import type { PracticeFingerprint } from "../schemas/fingerprint";
import type { CapabilityId } from "../schemas/lifecycle";
import type { PracticeProject, ToolAssignment } from "../schemas/practice-project";
import type { ProductArchitectureMetadata } from "../schemas/product-metadata";
import { getCapabilityRelevance } from "../engines/relevance-engine";
import { recommendProductsForCapabilities, type ProductOption } from "./capability-recommendation-service";
import { gapFillCapabilities } from "../world/coverage";
import { deriveWorldState, type WorldObjectState } from "../world/world-state";

export const DRAFT_VERSION = "1.0.0";

/** Objects drafted before the rest, in this order. */
const ANCHORS = ["clinical_computer"];

const DRAFTABLE = new Set(["required", "strongly-recommended"]);

export interface DraftPick {
  objectName: string;
  option: ProductOption;
  assignment: Omit<ToolAssignment, "assignedAt">;
}

export interface StackDraft {
  picks: DraftPick[];
  /** Functions left for the clinician: optional for this practice, or nothing eligible. */
  leftOpen: { objectName: string; reason: "optional" | "no-eligible-product" }[];
  version: string;
}

export interface DraftInput {
  project: PracticeProject;
  fingerprint: PracticeFingerprint;
  products: Array<{ metadata: ProductArchitectureMetadata; name: string; tagline?: string }>;
}

function isDraftable(object: WorldObjectState, fingerprint: PracticeFingerprint): boolean {
  return object.definition.capabilityIds.some((id) => DRAFTABLE.has(getCapabilityRelevance(id, fingerprint).level));
}

export function draftPracticeStack({ project, fingerprint, products }: DraftInput): StackDraft {
  const metadataBySlug = new Map(products.map((p) => [p.metadata.productSlug, p.metadata]));
  let working: PracticeProject = { ...project, assignments: [...project.assignments] };
  const picks: DraftPick[] = [];
  const leftOpen: StackDraft["leftOpen"] = [];

  const ordered = (() => {
    const objects = deriveWorldState(working).objects.filter((o) => !o.definition.isExternal);
    const anchors = ANCHORS.map((id) => objects.find((o) => o.definition.objectId === id)).filter((o): o is WorldObjectState => !!o);
    return [...anchors, ...objects.filter((o) => !ANCHORS.includes(o.definition.objectId))];
  })();

  const applicable = new Set<CapabilityId>(ordered.flatMap((o) => o.definition.capabilityIds));

  for (const initial of ordered) {
    // Re-derive: an earlier pick may already have resolved this function.
    const object = deriveWorldState(working).byId.get(initial.definition.objectId);
    if (!object || object.state !== "unconfigured" || object.unresolvedCapabilityIds.length === 0) continue;

    if (!isDraftable(object, fingerprint)) {
      leftOpen.push({ objectName: object.definition.name, reason: "optional" });
      continue;
    }

    const recommendation = recommendProductsForCapabilities({
      capabilityIds: object.definition.capabilityIds,
      fingerprint,
      products,
      assignedSlugs: working.assignments.map((a) => a.productSlug),
      alternativeCount: 2,
    });
    const option = recommendation.recommended;
    const requested = option?.coversRequested.map((c) => c.capabilityId) ?? [];
    if (!option || requested.length === 0) {
      leftOpen.push({ objectName: object.definition.name, reason: "no-eligible-product" });
      continue;
    }

    const additional = gapFillCapabilities({
      project: working,
      productSlug: option.productSlug,
      metadata: metadataBySlug.get(option.productSlug),
      applicable,
      claimed: new Set(requested),
    });

    const uncertainties = [...option.uncertainties, ...recommendation.sharedUncertainties];
    const assignment: Omit<ToolAssignment, "assignedAt"> = {
      productSlug: option.productSlug,
      productName: option.productName,
      capabilityIds: [...new Set([...requested, ...additional])],
      primaryCapabilityId: requested[0],
      source: "selected",
      suggested: true,
      quotedMonthlyCents: option.cost.minMonthlyCents,
      needsReview: uncertainties.length > 0,
      reviewReason: uncertainties[0]?.reason,
    };
    picks.push({ objectName: object.definition.name, option, assignment });

    const existing = working.assignments.find((a) => a.productSlug === option.productSlug);
    working = {
      ...working,
      assignments: existing
        ? working.assignments.map((a) =>
            a.productSlug === option.productSlug ? { ...a, capabilityIds: [...new Set([...a.capabilityIds, ...assignment.capabilityIds])] } : a
          )
        : [...working.assignments, { ...assignment, assignedAt: project.updatedAt }],
    };
  }

  return { picks, leftOpen, version: DRAFT_VERSION };
}

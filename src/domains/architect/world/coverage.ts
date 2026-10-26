/**
 * Automatic coverage
 *
 * One product usually handles several functions of a practice: an EHR that
 * also does intake, scheduling, and payments. When a clinician chooses it for
 * one function, the room should show every other function it takes care of,
 * or they are left with "unresolved" objects their product already covers.
 *
 * The rule is deliberately conservative. A product fills a function only when:
 *
 * - it covers that function as an established built-in feature (see
 *   `getEstablishedCapabilityIds`: core or strong, not an add-on, not an
 *   unverified regulated claim);
 * - the function applies to this practice (it belongs to an object in the
 *   room);
 * - the function is still open: no product covers it and the user has not
 *   recorded a decision about it;
 * - the user has not removed this product from that function before.
 *
 * So it fills gaps and never overrides a choice, never silently creates
 * overlap, and never claims coverage the product card would not state.
 */

import type { CapabilityId } from "../schemas/lifecycle";
import type { PracticeProject } from "../schemas/practice-project";
import type { ProductArchitectureMetadata } from "../schemas/product-metadata";
import { getEstablishedCapabilityIds } from "../services/capability-recommendation-service";

export interface GapFillInput {
  project: PracticeProject;
  productSlug: string;
  metadata: ProductArchitectureMetadata | undefined;
  /** Capabilities that apply to this practice (the room's objects). */
  applicable: ReadonlySet<CapabilityId>;
  /**
   * Capabilities already being claimed in the same pass, so two products
   * reconciled together never both fill the same gap.
   */
  claimed?: ReadonlySet<CapabilityId>;
}

/** The open functions this product should also cover. */
export function gapFillCapabilities({
  project,
  productSlug,
  metadata,
  applicable,
  claimed,
}: GapFillInput): CapabilityId[] {
  if (!metadata) return [];

  const own = project.assignments.find((a) => a.productSlug === productSlug);
  const ownIds = new Set(own?.capabilityIds ?? []);
  const declined = new Set(own?.declinedCapabilityIds ?? []);

  const coveredByOthers = new Set<CapabilityId>();
  for (const assignment of project.assignments) {
    if (assignment.productSlug === productSlug) continue;
    for (const id of assignment.capabilityIds) coveredByOthers.add(id);
  }
  const decided = new Set(project.decisions.map((d) => d.capabilityId));

  return getEstablishedCapabilityIds(metadata).filter(
    (id) =>
      applicable.has(id) &&
      !ownIds.has(id) &&
      !declined.has(id) &&
      !coveredByOthers.has(id) &&
      !decided.has(id) &&
      !claimed?.has(id)
  );
}

export interface CoverageExtension {
  productSlug: string;
  capabilityIds: CapabilityId[];
}

/**
 * Reconcile a whole project: every chosen product fills the open functions it
 * covers. Products are processed in the order they were chosen, so the first
 * choice wins any function two products could both fill.
 *
 * Used once when a saved project loads, to bring projects created before
 * automatic coverage existed up to date. Idempotent.
 */
export function reconcileCoverage(
  project: PracticeProject,
  metadataBySlug: ReadonlyMap<string, ProductArchitectureMetadata>,
  applicable: ReadonlySet<CapabilityId>
): CoverageExtension[] {
  const claimed = new Set<CapabilityId>();
  const extensions: CoverageExtension[] = [];

  const ordered = [...project.assignments].sort((a, b) =>
    a.assignedAt.localeCompare(b.assignedAt)
  );

  for (const assignment of ordered) {
    const capabilityIds = gapFillCapabilities({
      project,
      productSlug: assignment.productSlug,
      metadata: metadataBySlug.get(assignment.productSlug),
      applicable,
      claimed,
    });
    if (capabilityIds.length === 0) continue;
    capabilityIds.forEach((id) => claimed.add(id));
    extensions.push({ productSlug: assignment.productSlug, capabilityIds });
  }

  return extensions;
}

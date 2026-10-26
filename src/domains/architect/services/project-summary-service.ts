/**
 * Project Summary Service
 *
 * Derives the two persistent numbers shown outside the illustrated world:
 * how many decisions remain, and what the software is estimated to cost.
 *
 * Cost is summed over *unique assigned products*, not over illustrated
 * objects. An EHR that covers records, scheduling, intake, and telehealth
 * lights up four objects and is charged once.
 *
 * Unknown prices stay unknown. The estimate is explicitly labelled incomplete
 * rather than quietly treating an unpriced product as free.
 */

import { calculateProductCost } from "../engines/cost-engine";
import type { PracticeFingerprint } from "../schemas/fingerprint";
import type { ProductArchitectureMetadata } from "../schemas/product-metadata";
import type { PracticeProject } from "../schemas/practice-project";

export interface ProjectCostLine {
  productSlug: string;
  productName: string;
  /** Null when the price is unknown or quote-based. */
  monthlyCents: number | null;
  /** Vendor-published display text, used when a total cannot be computed. */
  priceDisplayText?: string;
  requiresQuote: boolean;
  isEstimate: boolean;
  note?: string;
}

export interface ProjectCostSummary {
  lines: ProjectCostLine[];

  /** Sum of every line with a known price. */
  knownMonthlyCents: number;

  /** Products whose price could not be determined. */
  unknownCount: number;

  /** Products that require a sales quote. */
  quoteCount: number;

  /**
   * True when at least one assigned product has no usable price, meaning the
   * total understates the real cost and must be labelled incomplete.
   */
  isIncomplete: boolean;

  /** True when any line was scaled from an assumed provider count. */
  hasEstimatedLines: boolean;

  /** Assumptions behind the number, surfaced in the breakdown. */
  assumptions: string[];
}

/**
 * Compute the cost summary for a project.
 *
 * `metadataBySlug` is the catalog the caller already loaded. Products missing
 * from it are reported as unknown rather than dropped, so a catalog gap can
 * never silently reduce the estimate.
 */
export function calculateProjectCost(
  project: PracticeProject,
  fingerprint: PracticeFingerprint,
  metadataBySlug: Map<string, ProductArchitectureMetadata>
): ProjectCostSummary {
  const lines: ProjectCostLine[] = [];
  const assumptions = new Set<string>();

  let knownMonthlyCents = 0;
  let unknownCount = 0;
  let quoteCount = 0;
  let hasEstimatedLines = false;

  // Unique products, so shared coverage is never double-charged.
  const seen = new Set<string>();

  for (const assignment of project.assignments) {
    if (seen.has(assignment.productSlug)) continue;
    seen.add(assignment.productSlug);

    const metadata = metadataBySlug.get(assignment.productSlug);
    const cost = calculateProductCost(
      assignment.productSlug,
      metadata,
      fingerprint
    );

    // Use the low end of the range: an estimate that overstates cost is as
    // misleading as one that understates it, and min is the figure vendors
    // publish.
    const monthlyCents = cost.minMonthlyCents;

    if (cost.requiresQuote) {
      quoteCount++;
    } else if (monthlyCents === null) {
      unknownCount++;
    } else {
      knownMonthlyCents += monthlyCents;
    }

    if (cost.isEstimate) {
      hasEstimatedLines = true;
    }
    if (cost.notes) {
      assumptions.add(cost.notes);
    }

    lines.push({
      productSlug: assignment.productSlug,
      productName: assignment.productName,
      monthlyCents: cost.requiresQuote ? null : monthlyCents,
      priceDisplayText: cost.priceDisplayText,
      requiresQuote: cost.requiresQuote,
      isEstimate: cost.isEstimate,
      note: cost.notes,
    });
  }

  lines.sort((a, b) => a.productName.localeCompare(b.productName));

  if (fingerprint.exactProviderCount === undefined && fingerprint.sizeBucket) {
    assumptions.add(
      "Per-provider prices are scaled from your practice size, not an exact headcount"
    );
  }

  return {
    lines,
    knownMonthlyCents,
    unknownCount,
    quoteCount,
    isIncomplete: unknownCount > 0 || quoteCount > 0,
    hasEstimatedLines,
    assumptions: [...assumptions],
  };
}

/**
 * Format the headline cost string.
 *
 * Never renders a bare number when the estimate is incomplete.
 */
export function formatProjectCost(summary: ProjectCostSummary): string {
  const dollars = Math.round(summary.knownMonthlyCents / 100);

  if (summary.lines.length === 0) {
    return "No tools selected yet";
  }

  const missing = summary.unknownCount + summary.quoteCount;

  // Leading with "$0/month" when nothing could be priced reads as a free
  // stack. The absence of a price is not a price of zero.
  if (summary.knownMonthlyCents === 0 && missing > 0) {
    return missing === 1
      ? "1 tool, price not published"
      : `${missing} tools, prices not published`;
  }

  const base = `$${dollars.toLocaleString()}/month`;
  if (!summary.isIncomplete) return base;

  return `${base} + ${missing} unpriced`;
}

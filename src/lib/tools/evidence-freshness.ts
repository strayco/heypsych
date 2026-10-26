/**
 * Evidence freshness.
 *
 * These intervals are internal operational targets, not a guarantee that a
 * claim is still true. An elapsed interval marks a record as needing review.
 * It never marks the claim false, never changes eligibility, and never
 * rewrites stored provenance.
 */

export const REVIEW_INTERVAL_DAYS = {
  pricing: 90,
  epcs: 90,
  baa: 180,
  integrations: 180,
  features: 180,
  identity: 365,
} as const;

export type FreshnessClaimKind = keyof typeof REVIEW_INTERVAL_DAYS;

export type FreshnessState = "current" | "needs_freshness_review" | "never_reviewed";

const MS_PER_DAY = 86_400_000;

/**
 * Whether a dated review is still inside its operational window.
 */
export function freshnessState(
  reviewedAt: string | null | undefined,
  intervalDays: number,
  now: number = Date.now()
): FreshnessState {
  if (!reviewedAt) return "never_reviewed";

  const reviewed = Date.parse(reviewedAt);
  if (Number.isNaN(reviewed)) return "never_reviewed";

  const ageDays = (now - reviewed) / MS_PER_DAY;
  return ageDays > intervalDays ? "needs_freshness_review" : "current";
}

export function freshnessStateForClaim(
  reviewedAt: string | null | undefined,
  kind: FreshnessClaimKind,
  now: number = Date.now()
): FreshnessState {
  return freshnessState(reviewedAt, REVIEW_INTERVAL_DAYS[kind], now);
}

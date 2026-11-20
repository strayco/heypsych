/**
 * HeyPsych Consensus Score — the scoring engine. PRIVATE.
 *
 * Server-only: never import this from a client component or send its output
 * to a public page. Public pages read the frozen approval snapshot through
 * public.ts. The weights and thresholds below are proprietary; changing them
 * is a reviewed code release (bump ALGORITHM so old approvals are visibly
 * from the previous version).
 *
 * Deterministic: the same observations and `asOf` date always give the same
 * result. Inputs are source observations only. The function has no access to
 * commercial, affiliate or sponsorship data, so vendor payments cannot reach
 * a score.
 *
 * Method (documented for reviewers; not for publication):
 *  1. Eligibility. Excluded rows, mismatched products, reviews of a different
 *     product, prohibited sources, empty listings, future dates and
 *     observations older than STALE_MONTHS are dropped, each with a reason.
 *  2. Independence. Sources under common ownership or sharing a review pool
 *     (G2, Capterra, GetApp, Software Advice) form one group, as do repeats of
 *     a source. Each group contributes once: its largest listing.
 *  3. Normalisation. Ratings map linearly to 0-100 (1 star = 0, top = 100).
 *  4. Weight. Effective reviews = min(count, VOLUME_CAP) x source quality x
 *     listing relevance x match certainty x recency.
 *  5. Smoothing. The weighted mean is shrunk toward a conservative prior with
 *     PRIOR_STRENGTH pseudo-reviews, so thin evidence cannot look certain.
 *  6. Confidence. From independent groups (each with enough reviews to
 *     corroborate), effective reviews, freshness and agreement between
 *     sources. Below the minimum the score is withheld.
 */

import { createHash } from "crypto";
import { SOURCE_LABELS, type ConsensusRecord, type Observation, type SourceType } from "./schema";

export const ALGORITHM = "consensus-v1";

// --- Weights and thresholds (private) --------------------------------------

/** Dedicated B2B software review platforms verify reviewers; app stores rate a mobile app. */
const SOURCE_QUALITY: Record<SourceType, number> = {
  capterra: 1,
  g2: 1,
  trustradius: 1,
  "software-advice": 1,
  getapp: 1,
  "apple-app-store": 0.6,
  "google-play": 0.6,
  other: 0.5,
};
/**
 * One owner, one vote. G2 acquired Capterra, Software Advice and GetApp from
 * Gartner (announced Jan 2026, closed Feb 2026) and is integrating their
 * review data, so the four count as a single source no matter how many of
 * their listings are recorded.
 */
const SYNDICATION: Partial<Record<SourceType, string>> = {
  g2: "g2-network",
  capterra: "g2-network",
  getapp: "g2-network",
  "software-advice": "g2-network",
};
const SCOPE_RELEVANCE = { "full-product": 1, "companion-app": 0.5, "different-product": 0 } as const;
const MATCH_CERTAINTY = { exact: 1, probable: 0.5, mismatch: 0 } as const;

const VOLUME_CAP = 2000;
const FRESH_MONTHS = 6;
const HALF_WEIGHT_MONTHS = 24;
const STALE_MONTHS = 24;
const PRIOR_MEAN = 60;
const PRIOR_STRENGTH = 50;
const CONFLICT_SPREAD = 25;
const CONFLICT_MIN_REVIEWS = 20;
/**
 * To count as independent corroboration a source must review the full product
 * and have this many reviews. Others still add to the average.
 */
const MIN_CORROBORATING_REVIEWS = 20;

const WITHHOLD = { minGroups: 2, minEffective: 30 };
const MODERATE = { minGroups: 2, minEffective: 150 };
const HIGH = { minGroups: 3, minEffective: 500, minFullProductGroups: 2, maxAgeMonths: 12 };

// --- Types -----------------------------------------------------------------

export type Confidence = "High" | "Moderate" | "Limited";

export interface Contribution {
  observationId: string;
  source: SourceType;
  group: string;
  normalized: number | null;
  effectiveReviews: number;
  /** Share of the weighted mean, 0-1. */
  share: number;
  status: "used" | "excluded" | "syndicated-duplicate";
  reason?: string;
}

export interface ScoreResult {
  algorithm: string;
  asOf: string;
  status: "scored" | "withheld";
  score: number | null;
  confidence: Confidence | null;
  /** Unsmoothed weighted mean, for the admin view only. */
  rawMean: number | null;
  effectiveReviews: number;
  independentGroups: number;
  fullProductGroups: number;
  spread: number | null;
  sourceNames: string[];
  contributions: Contribution[];
  /** Plain-language reasons for the confidence or for withholding. */
  rationale: string[];
}

// --- Helpers ---------------------------------------------------------------

function monthsBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return (b - a) / (1000 * 60 * 60 * 24 * 30.4375);
}

export function normalizeRating(rating: number, scale: 5 | 10): number {
  const clamped = Math.min(Math.max(rating, 1), scale);
  return ((clamped - 1) / (scale - 1)) * 100;
}

export function recencyWeight(ageMonths: number): number {
  if (ageMonths <= FRESH_MONTHS) return 1;
  if (ageMonths >= HALF_WEIGHT_MONTHS) return 0.5;
  return 1 - (0.5 * (ageMonths - FRESH_MONTHS)) / (HALF_WEIGHT_MONTHS - FRESH_MONTHS);
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Observations that report the same review pool share a group. */
export function groupOf(o: Observation): string {
  if (o.source === "other") return `other:${hostOf(o.url)}`;
  return SYNDICATION[o.source] ?? o.source;
}

function sourceName(o: Observation): string {
  return o.source === "other" ? (o.sourceName ?? SOURCE_LABELS.other) : SOURCE_LABELS[o.source];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// --- Engine ----------------------------------------------------------------

export function computeConsensus(observations: readonly Observation[], asOf: string): ScoreResult {
  const contributions: Contribution[] = [];
  const candidates: { o: Observation; normalized: number; effective: number; group: string; age: number }[] = [];
  const seenUrls = new Set<string>();

  for (const o of observations) {
    const base = { observationId: o.id, source: o.source, group: groupOf(o), normalized: null, effectiveReviews: 0, share: 0 } as const;
    const age = monthsBetween(o.observedAt, asOf);
    const urlKey = o.url.replace(/[#?].*$/, "").replace(/\/$/, "").toLowerCase();
    let reason: string | null = null;
    if (o.excluded) reason = "Excluded by an editor";
    else if (o.match === "mismatch") reason = "Listing is not this product";
    else if (o.scope === "different-product") reason = "Reviews are about a different product";
    else if (o.permission === "prohibited") reason = "Source does not permit this use";
    else if (o.reviewCount === 0) reason = "No reviews";
    else if (Number.isNaN(age) || age < 0) reason = "Observation date is in the future";
    else if (age > STALE_MONTHS) reason = `Older than ${STALE_MONTHS} months`;
    else if (seenUrls.has(urlKey)) reason = "Same listing recorded twice";
    if (reason) {
      contributions.push({ ...base, status: "excluded", reason });
      continue;
    }
    seenUrls.add(urlKey);
    const effective =
      Math.min(o.reviewCount, VOLUME_CAP) * SOURCE_QUALITY[o.source] * SCOPE_RELEVANCE[o.scope] * MATCH_CERTAINTY[o.match] * recencyWeight(age);
    candidates.push({ o, normalized: normalizeRating(o.rating, o.ratingScale), effective, group: groupOf(o), age });
  }

  // One listing per review pool: the largest (then the newest, then the id, for determinism).
  const byGroup = new Map<string, (typeof candidates)[number]>();
  for (const c of candidates) {
    const cur = byGroup.get(c.group);
    const better =
      !cur ||
      c.o.reviewCount > cur.o.reviewCount ||
      (c.o.reviewCount === cur.o.reviewCount && (c.o.observedAt > cur.o.observedAt || (c.o.observedAt === cur.o.observedAt && c.o.id < cur.o.id)));
    if (better) byGroup.set(c.group, c);
  }
  const used = [...byGroup.values()].sort((a, b) => a.group.localeCompare(b.group) || a.o.id.localeCompare(b.o.id));
  for (const c of candidates) {
    if (byGroup.get(c.group) !== c) {
      contributions.push({
        observationId: c.o.id,
        source: c.o.source,
        group: c.group,
        normalized: round1(c.normalized),
        effectiveReviews: 0,
        share: 0,
        status: "syndicated-duplicate",
        reason: "Shares its reviews with a larger listing already counted",
      });
    }
  }

  const effectiveReviews = used.reduce((s, c) => s + c.effective, 0);
  const rawMean = effectiveReviews > 0 ? used.reduce((s, c) => s + c.normalized * c.effective, 0) / effectiveReviews : null;
  for (const c of used) {
    contributions.push({
      observationId: c.o.id,
      source: c.o.source,
      group: c.group,
      normalized: round1(c.normalized),
      effectiveReviews: round1(c.effective),
      share: effectiveReviews > 0 ? Math.round((c.effective / effectiveReviews) * 1000) / 1000 : 0,
      status: "used",
    });
  }
  contributions.sort((a, b) => a.observationId.localeCompare(b.observationId));

  const groups = used.filter((c) => c.effective > 0);
  const corroborating = groups.filter((c) => c.o.reviewCount >= MIN_CORROBORATING_REVIEWS && c.o.scope === "full-product");
  const fullProductGroups = new Set(groups.filter((c) => c.o.scope === "full-product").map((c) => c.group)).size;
  const comparable = groups.filter((c) => c.o.reviewCount >= CONFLICT_MIN_REVIEWS).map((c) => c.normalized);
  const spread = comparable.length >= 2 ? Math.max(...comparable) - Math.min(...comparable) : null;
  const conflict = spread !== null && spread > CONFLICT_SPREAD;
  const oldest = groups.length ? Math.max(...groups.map((c) => c.age)) : null;
  const sourceNames = [...new Set(groups.map((c) => sourceName(c.o)))].sort();

  const rationale: string[] = [];
  const thin = groups.length - corroborating.length;
  if (thin > 0)
    rationale.push(
      `${thin} source${thin === 1 ? "" : "s"} with fewer than ${MIN_CORROBORATING_REVIEWS} reviews, or rating only a companion app, add${thin === 1 ? "s" : ""} to the average but not to independence.`
    );
  let status: ScoreResult["status"] = "scored";
  if (corroborating.length < WITHHOLD.minGroups) {
    status = "withheld";
    rationale.push(`Needs at least ${WITHHOLD.minGroups} independent full-product review sources with ${MIN_CORROBORATING_REVIEWS}+ reviews each; has ${corroborating.length}.`);
  }
  if (effectiveReviews < WITHHOLD.minEffective) {
    status = "withheld";
    rationale.push(`Too few weighted reviews (${round1(effectiveReviews)}; minimum ${WITHHOLD.minEffective}).`);
  }
  if (fullProductGroups === 0 && groups.length > 0) {
    status = "withheld";
    rationale.push("No source reviews the full product; app-store ratings alone are not enough.");
  }

  let confidence: Confidence | null = null;
  let score: number | null = null;
  if (status === "scored" && rawMean !== null) {
    score = Math.round((PRIOR_STRENGTH * PRIOR_MEAN + effectiveReviews * rawMean) / (PRIOR_STRENGTH + effectiveReviews));
    if (
      corroborating.length >= HIGH.minGroups &&
      effectiveReviews >= HIGH.minEffective &&
      fullProductGroups >= HIGH.minFullProductGroups &&
      !conflict &&
      oldest !== null &&
      oldest <= HIGH.maxAgeMonths
    ) {
      confidence = "High";
      rationale.push(`${corroborating.length} independent sources, ${Math.round(effectiveReviews)} weighted reviews, recent and in agreement.`);
    } else if (corroborating.length >= MODERATE.minGroups && effectiveReviews >= MODERATE.minEffective && !conflict) {
      confidence = "Moderate";
      rationale.push(`${corroborating.length} independent sources and ${Math.round(effectiveReviews)} weighted reviews.`);
      if (corroborating.length < HIGH.minGroups) rationale.push(`High confidence needs ${HIGH.minGroups}+ independent sources.`);
      else if (effectiveReviews < HIGH.minEffective) rationale.push(`High confidence needs ${HIGH.minEffective}+ weighted reviews.`);
      else if (fullProductGroups < HIGH.minFullProductGroups) rationale.push("High confidence needs two full-product review sources.");
      else rationale.push(`High confidence needs every source observed within ${HIGH.maxAgeMonths} months.`);
    } else {
      confidence = "Limited";
      if (conflict) rationale.push(`Sources disagree by ${Math.round(spread!)} points; capped at Limited.`);
      else rationale.push(`Moderate confidence needs ${MODERATE.minEffective}+ weighted reviews; has ${Math.round(effectiveReviews)}.`);
    }
  }

  return {
    algorithm: ALGORITHM,
    asOf,
    status,
    score,
    confidence,
    rawMean: rawMean === null ? null : round1(rawMean),
    effectiveReviews: round1(effectiveReviews),
    independentGroups: corroborating.length,
    fullProductGroups,
    spread: spread === null ? null : round1(spread),
    sourceNames,
    contributions,
    rationale,
  };
}

/** Fingerprint of what an editor approves: the evidence and the summaries. */
export function contentHash(record: Pick<ConsensusRecord, "observations" | "editorial">): string {
  const canonical = JSON.stringify({ observations: record.observations, editorial: record.editorial });
  return createHash("sha256").update(canonical).digest("hex");
}

/** Today's date (UTC) as YYYY-MM-DD. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

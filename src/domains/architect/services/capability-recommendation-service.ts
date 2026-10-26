/**
 * Capability Recommendation Service
 *
 * Produces the ranked, explained product options shown in the world inspector
 * when a clinician opens an object.
 *
 * This is an orchestration layer, not a new recommendation engine. Every
 * clinical judgement is delegated:
 * - eligibility  -> eligibility-engine (the seven hard exclusion policies)
 * - fit          -> fit-engine
 * - relevance    -> relevance-engine
 * - cost         -> cost estimation shared with the stack recommender
 *
 * It contains no vendor list, no popularity table, and no hand-tuned slug
 * ordering. Ranking is derived entirely from engine output, and ties break on
 * slug so the same inputs always produce the same order.
 */

import type { CapabilityId } from "../schemas/lifecycle";
import type { PracticeFingerprint } from "../schemas/fingerprint";
import type {
  CapabilityStrength,
  ProductArchitectureMetadata,
} from "../schemas/product-metadata";
import { CAPABILITY_REGISTRY } from "../schemas/lifecycle";
import {
  evaluateEligibility,
  type EligibilityFinding,
} from "../engines/eligibility-engine";
import {
  calculateProductCost,
  type ProductCostResult,
} from "../engines/cost-engine";
import { calculateFitScore } from "../engines/fit-engine";
import { VERIFICATION_REQUIRED_CAPABILITIES } from "../engines/coverage-engine";
import { getCapabilityRelevance } from "../engines/relevance-engine";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Fit presented as a tier rather than a raw percentage.
 *
 * Per decision D-011, a numeric match score implies a precision the underlying
 * evidence does not support. The tier and the evidence confidence are shown as
 * two separate signals.
 */
export type FitTier = "strong" | "good" | "possible" | "weak";

export function toFitTier(fitScore: number | null): FitTier {
  if (fitScore === null) return "possible";
  if (fitScore >= 75) return "strong";
  if (fitScore >= 55) return "good";
  if (fitScore >= 35) return "possible";
  return "weak";
}

export const FIT_TIER_LABELS: Record<FitTier, string> = {
  strong: "Strong fit",
  good: "Good fit",
  possible: "Possible fit",
  weak: "Weak fit",
};

/** How confident we are in the evidence behind the recommendation. */
export type EvidenceConfidence = "high" | "moderate" | "low";

export function toEvidenceConfidence(
  dataConfidence: number
): EvidenceConfidence {
  if (dataConfidence >= 70) return "high";
  if (dataConfidence >= 40) return "moderate";
  return "low";
}

/**
 * Labels for the evidence signal.
 *
 * Deliberately not "high confidence". This measures how much catalog data
 * backs the fit assessment, which is a different question from whether a
 * specific claim has been checked. Sitting a "high confidence" badge next to
 * a notice saying we have not verified EPCS reads as a contradiction, and the
 * user has no way to know the two refer to different things.
 */
export const EVIDENCE_CONFIDENCE_LABELS: Record<EvidenceConfidence, string> = {
  high: "Well documented",
  moderate: "Partly documented",
  low: "Thinly documented",
};

export interface CapabilityCoverageDetail {
  capabilityId: CapabilityId;
  capabilityName: string;
  strength: CapabilityStrength;
  /** True when the capability is only available as a paid add-on. */
  requiresAddon: boolean;
  addonPriceCents?: number;
  limitation?: string;
  /**
   * True when this claim may not be stated as established capability until
   * someone has checked it. Currently EPCS, which is DEA-regulated.
   */
  awaitingVerification: boolean;
}

export interface ProductOption {
  productSlug: string;
  productName: string;
  tagline?: string;

  /** Fit expressed as a tier. No numeric score is surfaced to users. */
  fitTier: FitTier;
  /** Raw engine score, retained for tests and debugging, not for display. */
  fitScore: number | null;

  evidenceConfidence: EvidenceConfidence;
  dataConfidence: number;

  /** Plain-language reasons this product suits this practice. */
  reasons: string[];
  /** The single most material downside, when one is known. */
  tradeoff?: string;

  /** Capabilities from the requested set that this product covers. */
  coversRequested: CapabilityCoverageDetail[];
  /** Other capabilities this product covers for this practice. */
  coversAdditional: CapabilityCoverageDetail[];

  cost: ProductCostResult;

  /**
   * Policies that could not be decided from available evidence. Rendered as
   * "needs verification", never silently ignored.
   */
  uncertainties: EligibilityFinding[];

  /** Internal ranking value. Exposed for deterministic-ordering tests. */
  rankScore: number;
}

export interface ExcludedProduct {
  productSlug: string;
  productName: string;
  exclusions: EligibilityFinding[];
}

export interface CapabilityRecommendation {
  /** The capability set this recommendation was computed for. */
  capabilityIds: CapabilityId[];

  /** Best option, when any product is eligible and covers the capability. */
  recommended?: ProductOption;
  /** Next best options, capped for a calm inspector. */
  alternatives: ProductOption[];
  /** Everything else eligible, ranked. Shown behind "see all". */
  others: ProductOption[];

  /**
   * Products removed by a hard exclusion policy. Never shown as selectable.
   * Retained so the UI can explain why a well-known tool is missing.
   */
  excluded: ExcludedProduct[];

  /**
   * Uncertainties that apply to every eligible option.
   *
   * These say something about the state of our evidence, not about any
   * particular vendor, so repeating them on each card is noise that trains
   * users to ignore the warning. They are surfaced once for the whole panel
   * and removed from the individual options.
   */
  sharedUncertainties: EligibilityFinding[];

  /** True when nothing in the catalog covers this capability. */
  isEmpty: boolean;
}

export interface RecommendProductsInput {
  /** Capabilities the world object represents. */
  capabilityIds: CapabilityId[];
  fingerprint: PracticeFingerprint;
  /** Catalog, already filtered by the publication gate. */
  products: Array<{
    metadata: ProductArchitectureMetadata;
    name: string;
    tagline?: string;
  }>;
  /** Slugs already assigned elsewhere in the project. */
  assignedSlugs?: string[];
  /** How many alternatives to surface before "see all". Default 3. */
  alternativeCount?: number;
}

// ============================================================================
// SCORING
// ============================================================================

const STRENGTH_WEIGHTS: Record<CapabilityStrength, number> = {
  core: 1.0,
  strong: 0.8,
  partial: 0.5,
  addon: 0.35,
  "integration-only": 0.1,
};

/** Lower is better. Used to order the list the way its badges read. */
const FIT_TIER_RANK: Record<FitTier, number> = {
  strong: 0,
  good: 1,
  possible: 2,
  weak: 3,
};

/**
 * How directly a product does the requested job.
 *
 * 0 = native feature, 1 = partial or paid add-on, 2 = integration only.
 * A product that merely integrates with something else that does the job
 * should never outrank one that does the job, however well it otherwise fits.
 */
function coverageRank(option: ProductOption): number {
  const strengths = option.coversRequested.map((c) => c.strength);
  if (strengths.some((s) => s === "core" || s === "strong")) return 0;
  if (strengths.some((s) => s === "partial" || s === "addon")) return 1;
  return 2;
}

const RELEVANCE_WEIGHTS: Record<string, number> = {
  required: 3.0,
  "strongly-recommended": 2.0,
  useful: 1.0,
  optional: 0.3,
  irrelevant: 0,
};

function describeCapability(
  product: ProductArchitectureMetadata,
  capabilityId: CapabilityId
): CapabilityCoverageDetail | null {
  const cap = product.capabilities.find((c) => c.capabilityId === capabilityId);
  if (!cap) return null;

  return {
    capabilityId,
    capabilityName: CAPABILITY_REGISTRY[capabilityId]?.name ?? capabilityId,
    strength: cap.strength,
    requiresAddon: cap.requiresAddon === true,
    addonPriceCents: cap.addonPriceCents,
    limitation: cap.limitation,
    awaitingVerification:
      VERIFICATION_REQUIRED_CAPABILITIES.has(capabilityId) &&
      cap.provenance !== "verified" &&
      product.capabilityMapStatus !== "reviewed-complete",
  };
}

/**
 * Capabilities a product can be said to cover outright for this practice:
 * a core or strong built-in feature, not a paid add-on, and not a regulated
 * claim still awaiting verification (EPCS). This is the same standard the
 * "Covers X as a built-in feature" reason uses, so the room never shows more
 * coverage than the product card states.
 */
export function getEstablishedCapabilityIds(
  product: ProductArchitectureMetadata
): CapabilityId[] {
  return product.capabilities
    .filter((c) => c.strength === "core" || c.strength === "strong")
    .map((c) => describeCapability(product, c.capabilityId))
    .filter(
      (d): d is CapabilityCoverageDetail =>
        d !== null && !d.awaitingVerification && !d.requiresAddon
    )
    .map((d) => d.capabilityId);
}

/**
 * Build the user-facing reasons for an option.
 *
 * Every reason must be traceable to catalog data or engine output. Nothing here
 * invents a claim about a vendor.
 */
/** "A, B and 3 more" — readable at a glance rather than exhaustive. */
function listNames(details: CapabilityCoverageDetail[]): string {
  const names = details.slice(0, 3).map((c) => c.capabilityName);
  const extra = details.length - names.length;
  const joined =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
      : names[0];
  return extra > 0 ? `${joined} and ${extra} more` : joined;
}

function buildReasons(
  coversRequested: CapabilityCoverageDetail[],
  coversAdditional: CapabilityCoverageDetail[],
  fitTier: FitTier,
  cost: ProductCostResult
): string[] {
  const reasons: string[] = [];

  // Capability names are rendered as written in the registry. Lowercasing
  // them turns "EHR" into "ehr" and "AI documentation" into "ai documentation".
  // "Covers X as a built-in feature" is a statement of fact, so it may only
  // name capabilities we can stand behind. An unverified EPCS claim is
  // excluded here and reported through the verification notice instead, which
  // keeps the card from contradicting the caveat printed directly above it.
  const core = coversRequested.filter(
    (c) =>
      (c.strength === "core" || c.strength === "strong") &&
      !c.awaitingVerification
  );
  if (core.length > 0) {
    reasons.push(
      `Covers ${listNames(core)} as a built-in feature`
    );
  }

  if (coversAdditional.length > 0) {
    reasons.push(
      `Also covers ${listNames(coversAdditional)}, so you may not need a separate tool`
    );
  }

  if (fitTier === "strong") {
    reasons.push("Matches your practice type, size, and payer mix");
  }

  if (cost.basis === "free" || cost.basis === "freemium") {
    reasons.push("Free tier available");
  }

  return reasons;
}

/**
 * Identify the single most material downside.
 *
 * Prefers a concrete documented limitation over a generic statement.
 */
function buildTradeoff(
  product: ProductArchitectureMetadata,
  coversRequested: CapabilityCoverageDetail[],
  cost: ProductCostResult
): string | undefined {
  const addon = coversRequested.find((c) => c.requiresAddon);
  if (addon) {
    return addon.addonPriceCents
      ? `${addon.capabilityName} is a paid add-on, not included in the base price`
      : `${addon.capabilityName} requires a paid add-on`;
  }

  const limited = coversRequested.find((c) => c.limitation);
  if (limited?.limitation) return limited.limitation;

  const partial = coversRequested.find(
    (c) => c.strength === "partial" || c.strength === "integration-only"
  );
  if (partial) {
    return partial.strength === "integration-only"
      ? `${partial.capabilityName} is only available through a third-party integration`
      : `${partial.capabilityName} coverage is partial`;
  }

  const notIdeal = product.fitEvidence?.notIdealFor?.[0];
  if (notIdeal) return notIdeal;

  if (cost.requiresQuote) {
    return "Pricing requires a sales quote";
  }

  return undefined;
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

/**
 * Rank eligible products for a capability set.
 *
 * Ranking combines, in order of influence:
 * 1. relevance-weighted coverage of the requested capabilities
 * 2. fit score from the fit engine
 * 3. evidence confidence
 * 4. breadth of additional coverage, which reduces tool sprawl
 *
 * Ties break on product slug so ordering is stable.
 */
export function recommendProductsForCapabilities(
  input: RecommendProductsInput
): CapabilityRecommendation {
  const {
    capabilityIds,
    fingerprint,
    products,
    assignedSlugs = [],
    alternativeCount = 2,
  } = input;

  const requested = new Set(capabilityIds);
  const assigned = new Set(assignedSlugs);

  // Relevance of each requested capability to this specific practice.
  const relevanceByCapability = new Map<CapabilityId, number>();
  for (const capabilityId of capabilityIds) {
    const result = getCapabilityRelevance(capabilityId, fingerprint);
    relevanceByCapability.set(
      capabilityId,
      RELEVANCE_WEIGHTS[result.level] ?? 1.0
    );
  }

  const options: ProductOption[] = [];
  const excluded: ExcludedProduct[] = [];

  for (const { metadata, name, tagline } of products) {
    // Only consider products that actually touch a requested capability.
    const coversRequested = capabilityIds
      .map((id) => describeCapability(metadata, id))
      .filter((c): c is CapabilityCoverageDetail => c !== null);

    if (coversRequested.length === 0) continue;

    // Hard exclusions are authoritative. An excluded product is never
    // presented as selectable, regardless of how well it would otherwise rank.
    const eligibility = evaluateEligibility(metadata, fingerprint);
    if (!eligibility.eligible) {
      excluded.push({
        productSlug: metadata.productSlug,
        productName: name,
        exclusions: eligibility.exclusions,
      });
      continue;
    }

    const fit = calculateFitScore(
      {
        productSlug: metadata.productSlug,
        productName: name,
        metadata,
      },
      fingerprint,
      []
    );

    const coversAdditional = metadata.capabilities
      .filter(
        (c) =>
          !requested.has(c.capabilityId) &&
          (c.strength === "core" || c.strength === "strong")
      )
      .map((c) => describeCapability(metadata, c.capabilityId))
      .filter((c): c is CapabilityCoverageDetail => c !== null);

    const cost = calculateProductCost(
      metadata.productSlug,
      metadata,
      fingerprint
    );

    // 1. Relevance-weighted coverage of what the user asked about.
    let coverageValue = 0;
    for (const detail of coversRequested) {
      const relevance = relevanceByCapability.get(detail.capabilityId) ?? 1.0;
      coverageValue += relevance * STRENGTH_WEIGHTS[detail.strength];
    }

    // 2-3. Fit and evidence confidence, as proportional modifiers rather than
    // additive points, so a strong fit cannot manufacture coverage that is not
    // there.
    const fitMultiplier = 1 + ((fit.fitScore ?? 0) / 100) * 0.4;
    const confidenceMultiplier = 1 + (fit.dataConfidence / 100) * 0.2;

    // 4. Breadth bonus, capped so a sprawling suite cannot dominate a focused
    // product that covers the requested capability better.
    const breadthBonus = Math.min(0.25, coversAdditional.length * 0.03);

    const rankScore =
      coverageValue * fitMultiplier * confidenceMultiplier * (1 + breadthBonus);

    const fitTier = toFitTier(fit.fitScore);

    options.push({
      productSlug: metadata.productSlug,
      productName: name,
      tagline,
      fitTier,
      fitScore: fit.fitScore,
      evidenceConfidence: toEvidenceConfidence(fit.dataConfidence),
      dataConfidence: fit.dataConfidence,
      reasons: buildReasons(coversRequested, coversAdditional, fitTier, cost),
      tradeoff: buildTradeoff(metadata, coversRequested, cost),
      coversRequested,
      coversAdditional,
      cost,
      uncertainties: eligibility.uncertainties,
      rankScore,
    });
  }

  /*
    Ordering is lexicographic before it is numeric, so the list reads the way
    its own badges do. A clinician who sees "Good fit" sitting above "Strong
    fit" has no way to tell whether the ranking is reasoned or arbitrary, and
    a ranking nobody can follow is indistinguishable from a paid placement.

    1. Does the product actually do this job natively?
    2. Does it suit this practice?
    3. Everything else, via the numeric score.
  */
  options.sort((a, b) => {
    const coverage = coverageRank(a) - coverageRank(b);
    if (coverage !== 0) return coverage;

    const fit = FIT_TIER_RANK[a.fitTier] - FIT_TIER_RANK[b.fitTier];
    if (fit !== 0) return fit;

    const diff = b.rankScore - a.rankScore;
    if (Math.abs(diff) > 1e-9) return diff;
    return a.productSlug.localeCompare(b.productSlug);
  });

  excluded.sort((a, b) => a.productSlug.localeCompare(b.productSlug));

  // A product already assigned elsewhere is a strong candidate here too,
  // because reusing it avoids a second subscription. Surface it first.
  const alreadyOwned = options.filter((o) => assigned.has(o.productSlug));
  const fresh = options.filter((o) => !assigned.has(o.productSlug));
  const ordered = [...alreadyOwned, ...fresh];

  // An uncertainty every option shares describes a gap in our catalog rather
  // than a difference between vendors. It is still shown, but once.
  const sharedUncertainties =
    ordered.length > 0
      ? ordered[0].uncertainties.filter((finding) =>
          ordered.every((option) =>
            option.uncertainties.some((u) => u.policy === finding.policy)
          )
        )
      : [];

  const sharedPolicies = new Set(sharedUncertainties.map((u) => u.policy));
  const deduped = ordered.map((option) => ({
    ...option,
    uncertainties: option.uncertainties.filter(
      (u) => !sharedPolicies.has(u.policy)
    ),
  }));

  const [recommended, ...rest] = deduped;

  return {
    capabilityIds,
    recommended,
    alternatives: rest.slice(0, alternativeCount),
    others: rest.slice(alternativeCount),
    excluded,
    sharedUncertainties,
    isEmpty: deduped.length === 0,
  };
}

/**
 * Fit Score Engine
 *
 * Calculates how well a product fits a practice based on the fingerprint.
 * Pure function over validated inputs - no side effects.
 */

import {
  type PracticeFingerprint,
  type ProductArchitectureMetadata,
  type FitResult,
  type FitContribution,
  type FitDimension,
  FIT_DIMENSION_WEIGHTS,
  type CapabilityId,
  type RelevanceLevel,
  RELEVANCE_WEIGHTS,
  hasPrescribers,
  needsEPCS,
  isInsuranceHeavy,
  isCashPayPrimary,
  getEffectiveProviderCount,
  CAPABILITY_STRENGTH_VALUES,
} from "../schemas";
import { getAllCapabilityRelevance, type RelevanceResult } from "./relevance-engine";

// ============================================================================
// TYPES
// ============================================================================

export type ProductFitInput = {
  metadata: ProductArchitectureMetadata;
  productName: string;
  productSlug: string;
};

// ============================================================================
// DIMENSION EVALUATORS
// ============================================================================

/**
 * Evaluate hard requirements dimension
 * Checks for verified incompatibilities
 */
function evaluateHardRequirements(
  input: ProductFitInput,
  fingerprint: PracticeFingerprint
): FitContribution {
  const dimension: FitDimension = "hard-requirements";
  const weight = FIT_DIMENSION_WEIGHTS[dimension];
  const reasons: string[] = [];
  const fit = input.metadata.fitEvidence;

  // Check practice type exclusions
  if (fit?.practiceTypesExcluded?.length && fingerprint.practiceType) {
    if (fit.practiceTypesExcluded.includes(fingerprint.practiceType)) {
      return {
        dimension,
        weight,
        score: 0,
        evidence: "mismatch",
        reasons: [`Not suitable for ${fingerprint.practiceType} practices`],
        provenance: fit.provenance,
      };
    }
  }

  // Check state exclusions
  if (fit?.statesExcluded?.length && fingerprint.statesServed.length) {
    const excludedStates = fingerprint.statesServed.filter((s) =>
      fit.statesExcluded.includes(s)
    );
    if (excludedStates.length > 0) {
      return {
        dimension,
        weight,
        score: 0,
        evidence: "mismatch",
        reasons: [`Not available in: ${excludedStates.join(", ")}`],
        provenance: fit.provenance,
      };
    }
  }

  // Check EPCS requirement
  if (needsEPCS(fingerprint)) {
    const hasEPCS = input.metadata.capabilities.some(
      (c) => c.capabilityId === "epcs" && (c.strength === "core" || c.strength === "strong")
    );
    if (!hasEPCS && input.metadata.capabilityMapStatus === "reviewed-complete") {
      return {
        dimension,
        weight,
        score: 0,
        evidence: "mismatch",
        reasons: ["Does not support EPCS for controlled substances"],
        provenance: "verified",
      };
    }
  }

  // Check prescribing requirement
  if (hasPrescribers(fingerprint)) {
    const hasPrescribing = input.metadata.capabilities.some(
      (c) =>
        c.capabilityId === "prescribing-erx" &&
        (c.strength === "core" || c.strength === "strong")
    );
    // Only mark as mismatch if we have complete capability data
    if (!hasPrescribing && input.metadata.capabilityMapStatus === "reviewed-complete") {
      // Check if this is an EHR/practice management product that should have prescribing
      const isEHRProduct = input.metadata.capabilities.some(
        (c) => c.capabilityId === "ehr-clinical-record"
      );
      if (isEHRProduct) {
        return {
          dimension,
          weight,
          score: 0.5,
          evidence: "partial",
          reasons: ["May require separate prescribing solution"],
          provenance: "verified",
        };
      }
    }
  }

  // No hard incompatibilities found
  if (fit?.practiceTypes?.length && fingerprint.practiceType) {
    if (fit.practiceTypes.includes(fingerprint.practiceType)) {
      reasons.push(`Designed for ${fingerprint.practiceType} practices`);
    }
  }

  if (fit?.statesSupported?.length && fingerprint.statesServed.length) {
    const supportedCount = fingerprint.statesServed.filter((s) =>
      fit.statesSupported.includes(s)
    ).length;
    if (supportedCount === fingerprint.statesServed.length) {
      reasons.push("Available in all your states");
    }
  }

  // If no specific evidence, return unknown
  if (reasons.length === 0 && !fit) {
    return {
      dimension,
      weight,
      score: 1,
      evidence: "unknown",
      reasons: ["No hard incompatibilities detected"],
    };
  }

  return {
    dimension,
    weight,
    score: 1,
    evidence: reasons.length > 0 ? "match" : "unknown",
    reasons: reasons.length > 0 ? reasons : ["No hard incompatibilities detected"],
    provenance: fit?.provenance,
  };
}

/**
 * Evaluate capability alignment dimension
 */
function evaluateCapabilityAlignment(
  input: ProductFitInput,
  fingerprint: PracticeFingerprint,
  relevanceMap: Map<CapabilityId, RelevanceResult>
): FitContribution {
  const dimension: FitDimension = "capability-alignment";
  const weight = FIT_DIMENSION_WEIGHTS[dimension];
  const reasons: string[] = [];

  // If no capabilities mapped, return unknown
  if (input.metadata.capabilities.length === 0) {
    return {
      dimension,
      weight,
      score: 0,
      evidence: "unknown",
      reasons: ["Capability coverage not yet mapped"],
    };
  }

  // Calculate weighted coverage score
  let totalWeight = 0;
  let weightedScore = 0;
  let coveredRequired = 0;
  let totalRequired = 0;

  for (const [capId, relevance] of relevanceMap) {
    const relevanceWeight = RELEVANCE_WEIGHTS[relevance.level];
    if (relevanceWeight === 0) continue; // Skip irrelevant

    totalWeight += relevanceWeight;

    if (relevance.level === "required") totalRequired++;

    const productCap = input.metadata.capabilities.find((c) => c.capabilityId === capId);
    if (productCap) {
      const strengthValue = CAPABILITY_STRENGTH_VALUES[productCap.strength];
      weightedScore += relevanceWeight * strengthValue;

      if (relevance.level === "required") coveredRequired++;
    }
  }

  if (totalWeight === 0) {
    return {
      dimension,
      weight,
      score: 0,
      evidence: "unknown",
      reasons: ["Unable to calculate capability alignment"],
    };
  }

  const score = weightedScore / totalWeight;

  // Generate reasons
  if (totalRequired > 0) {
    if (coveredRequired === totalRequired) {
      reasons.push(`Covers all ${totalRequired} required capabilities`);
    } else {
      reasons.push(`Covers ${coveredRequired} of ${totalRequired} required capabilities`);
    }
  }

  const coreCapabilities = input.metadata.capabilities.filter((c) => c.strength === "core");
  if (coreCapabilities.length > 0) {
    const coreNames = coreCapabilities.slice(0, 3).map((c) => c.capabilityId);
    reasons.push(`Core strength in: ${coreNames.join(", ")}`);
  }

  return {
    dimension,
    weight,
    score,
    evidence: score >= 0.7 ? "match" : score >= 0.4 ? "partial" : "mismatch",
    reasons,
    provenance: input.metadata.capabilityMapStatus === "reviewed-complete" ? "verified" : "unverified",
  };
}

/**
 * Evaluate practice type and size fit
 */
function evaluatePracticeTypeSizeFit(
  input: ProductFitInput,
  fingerprint: PracticeFingerprint
): FitContribution {
  const dimension: FitDimension = "practice-type-size";
  const weight = FIT_DIMENSION_WEIGHTS[dimension];
  const reasons: string[] = [];
  const fit = input.metadata.fitEvidence;

  if (!fit) {
    return {
      dimension,
      weight,
      score: 0,
      evidence: "unknown",
      reasons: ["Practice fit data not available"],
    };
  }

  let typeScore = 0.5; // Default neutral
  let sizeScore = 0.5;

  // Practice type fit
  if (fingerprint.practiceType) {
    if (fit.practiceTypes?.includes(fingerprint.practiceType)) {
      typeScore = 1;
      reasons.push(`Designed for ${fingerprint.practiceType} practices`);
    } else if (fit.practiceTypes?.length === 0) {
      typeScore = 0.7; // Works for any type
    }
  }

  // Size fit
  if (fingerprint.sizeBucket) {
    if (fit.idealSizes?.includes(fingerprint.sizeBucket)) {
      sizeScore = 1;
      reasons.push(`Ideal for ${fingerprint.sizeBucket} provider practices`);
    } else if (fit.idealSizes?.length === 0) {
      sizeScore = 0.7; // Works for any size
    } else if (fit.minSize || fit.maxSize) {
      // Check if within range
      const sizeOrder = ["solo", "2-5", "6-10", "11-25", "26-50", "51-100", "101-250", "250+"];
      const bucketIndex = sizeOrder.indexOf(fingerprint.sizeBucket);
      const minIndex = fit.minSize ? sizeOrder.indexOf(fit.minSize) : 0;
      const maxIndex = fit.maxSize ? sizeOrder.indexOf(fit.maxSize) : sizeOrder.length - 1;

      if (bucketIndex >= minIndex && bucketIndex <= maxIndex) {
        sizeScore = 0.8;
        reasons.push(`Supports ${fingerprint.sizeBucket} provider practices`);
      } else {
        sizeScore = 0.3;
        reasons.push(`May not be ideal for ${fingerprint.sizeBucket} provider practices`);
      }
    }
  }

  const score = (typeScore + sizeScore) / 2;

  return {
    dimension,
    weight,
    score,
    evidence: score >= 0.7 ? "match" : score >= 0.4 ? "partial" : "mismatch",
    reasons: reasons.length > 0 ? reasons : ["Practice type and size fit unknown"],
    provenance: fit.provenance,
  };
}

/**
 * Evaluate clinical, payer, delivery, prescribing, and geography fit
 */
function evaluateClinicalPayerFit(
  input: ProductFitInput,
  fingerprint: PracticeFingerprint
): FitContribution {
  const dimension: FitDimension = "clinical-payer-fit";
  const weight = FIT_DIMENSION_WEIGHTS[dimension];
  const reasons: string[] = [];
  const fit = input.metadata.fitEvidence;

  if (!fit) {
    return {
      dimension,
      weight,
      score: 0,
      evidence: "unknown",
      reasons: ["Clinical and payer fit data not available"],
    };
  }

  const scores: number[] = [];

  // Payer fit
  if (fingerprint.primaryPayerType && fit.payerTypes?.length) {
    if (fit.payerTypes.includes(fingerprint.primaryPayerType)) {
      scores.push(1);
      reasons.push(`Supports ${fingerprint.primaryPayerType} billing`);
    } else if (fit.payerTypesExcluded?.includes(fingerprint.primaryPayerType)) {
      scores.push(0);
      reasons.push(`May not support ${fingerprint.primaryPayerType} billing`);
    } else {
      scores.push(0.5);
    }
  }

  // Delivery model fit
  if (fingerprint.deliveryModel && fit.deliveryModels?.length) {
    if (fit.deliveryModels.includes(fingerprint.deliveryModel)) {
      scores.push(1);
      reasons.push(`Supports ${fingerprint.deliveryModel} delivery`);
    } else {
      scores.push(0.5);
    }
  }

  // Prescribing fit
  if (fingerprint.prescribingLevel && fit.prescribingLevels?.length) {
    if (fit.prescribingLevels.includes(fingerprint.prescribingLevel)) {
      scores.push(1);
    } else {
      scores.push(0.5);
    }
  }

  // Multi-state support
  if (fingerprint.isMultiState && fit.supportsMultiState !== undefined) {
    if (fit.supportsMultiState) {
      scores.push(1);
      reasons.push("Supports multi-state practices");
    } else {
      scores.push(0.3);
      reasons.push("May not support multi-state practices");
    }
  }

  if (scores.length === 0) {
    return {
      dimension,
      weight,
      score: 0,
      evidence: "unknown",
      reasons: ["Clinical and payer fit data not available"],
    };
  }

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  return {
    dimension,
    weight,
    score: avgScore,
    evidence: avgScore >= 0.7 ? "match" : avgScore >= 0.4 ? "partial" : "mismatch",
    reasons: reasons.length > 0 ? reasons : ["Clinical and payer fit partially assessed"],
    provenance: fit.provenance,
  };
}

/**
 * Evaluate integration with current stack
 */
function evaluateStackIntegration(
  input: ProductFitInput,
  currentStackSlugs: string[]
): FitContribution {
  const dimension: FitDimension = "stack-integration";
  const weight = FIT_DIMENSION_WEIGHTS[dimension];
  const reasons: string[] = [];

  // If stack is empty, integration is neutral
  if (currentStackSlugs.length === 0) {
    return {
      dimension,
      weight,
      score: 1,
      evidence: "match",
      reasons: ["No current stack to integrate with"],
    };
  }

  // Check integrations with current stack products
  const integrations = input.metadata.integrations;
  let nativeCount = 0;
  let apiCount = 0;
  let thirdPartyCount = 0;
  let unknownCount = 0;

  for (const stackSlug of currentStackSlugs) {
    const integration = integrations.find(
      (i) => i.targetSlug === stackSlug || i.sourceSlug === stackSlug
    );

    if (integration) {
      switch (integration.type) {
        case "native":
          nativeCount++;
          break;
        case "api":
          apiCount++;
          break;
        case "third-party":
        case "browser-extension":
          thirdPartyCount++;
          break;
        case "incompatible":
          return {
            dimension,
            weight,
            score: 0,
            evidence: "mismatch",
            reasons: [`Known incompatibility with ${stackSlug}`],
            provenance: integration.provenance,
          };
        default:
          unknownCount++;
      }
    } else {
      unknownCount++;
    }
  }

  // Calculate score
  const total = currentStackSlugs.length;
  const knownIntegrations = nativeCount + apiCount + thirdPartyCount;

  if (knownIntegrations === 0) {
    return {
      dimension,
      weight,
      score: 0,
      evidence: "unknown",
      reasons: ["Integration status with current stack unknown"],
    };
  }

  // Weight: native > api > third-party
  const weightedScore = (nativeCount * 1 + apiCount * 0.8 + thirdPartyCount * 0.5) / total;

  if (nativeCount > 0) {
    reasons.push(`Native integration with ${nativeCount} product(s)`);
  }
  if (apiCount > 0) {
    reasons.push(`API integration with ${apiCount} product(s)`);
  }
  if (thirdPartyCount > 0) {
    reasons.push(`Third-party integration with ${thirdPartyCount} product(s)`);
  }
  if (unknownCount > 0) {
    reasons.push(`Integration unknown for ${unknownCount} product(s)`);
  }

  return {
    dimension,
    weight,
    score: weightedScore,
    evidence: weightedScore >= 0.7 ? "match" : weightedScore >= 0.4 ? "partial" : "mismatch",
    reasons,
  };
}

/**
 * Evaluate alignment with stated priorities
 */
function evaluatePriorities(
  input: ProductFitInput,
  fingerprint: PracticeFingerprint
): FitContribution {
  const dimension: FitDimension = "priorities";
  const weight = FIT_DIMENSION_WEIGHTS[dimension];
  const reasons: string[] = [];

  if (fingerprint.priorities.length === 0) {
    return {
      dimension,
      weight,
      score: 0,
      evidence: "unknown",
      reasons: ["No priorities specified"],
    };
  }

  // Map priorities to capability/feature indicators
  const prioritySignals: Record<string, (meta: ProductArchitectureMetadata) => boolean> = {
    "low-cost": (meta) => meta.pricing?.freeTierAvailable === true,
    "ease-of-use": () => true, // Would need UX data
    "clinical-workflow": (meta) =>
      meta.capabilities.some((c) =>
        ["ehr-clinical-record", "clinical-documentation", "treatment-planning"].includes(c.capabilityId)
      ),
    "billing-collections": (meta) =>
      meta.capabilities.some((c) =>
        ["billing-rcm", "claims-submission", "patient-payments"].includes(c.capabilityId)
      ),
    "integrations": (meta) => meta.integrations.length >= 3,
    "automation": (meta) =>
      meta.capabilities.some((c) =>
        ["ai-documentation-scribe", "appointment-reminders"].includes(c.capabilityId)
      ),
    "ai": (meta) =>
      meta.capabilities.some((c) => c.capabilityId === "ai-documentation-scribe"),
    "patient-experience": (meta) =>
      meta.capabilities.some((c) =>
        ["patient-portal", "secure-messaging", "telehealth"].includes(c.capabilityId)
      ),
    "reporting": (meta) =>
      meta.capabilities.some((c) => c.capabilityId === "analytics-bi"),
    "scalability": (meta) =>
      meta.fitEvidence?.idealSizes?.some((s) =>
        ["51-100", "101-250", "250+"].includes(s)
      ) ?? false,
    "implementation-simplicity": (meta) =>
      meta.fitEvidence?.implementationComplexity === "low",
  };

  let matchCount = 0;
  const topPriorities = fingerprint.priorities.slice(0, 3);

  for (const priority of topPriorities) {
    const signal = prioritySignals[priority];
    if (signal && signal(input.metadata)) {
      matchCount++;
      reasons.push(`Aligns with ${priority} priority`);
    }
  }

  const score = topPriorities.length > 0 ? matchCount / topPriorities.length : 0;

  return {
    dimension,
    weight,
    score,
    evidence: score >= 0.7 ? "match" : score >= 0.3 ? "partial" : "mismatch",
    reasons: reasons.length > 0 ? reasons : ["Limited alignment with priorities"],
  };
}

/**
 * Evaluate cost fit against budget
 */
function evaluateCostFit(
  input: ProductFitInput,
  fingerprint: PracticeFingerprint
): FitContribution {
  const dimension: FitDimension = "cost-fit";
  const weight = FIT_DIMENSION_WEIGHTS[dimension];
  const reasons: string[] = [];
  const pricing = input.metadata.pricing;

  // If no budget specified, cost is neutral
  if (!fingerprint.monthlyBudget) {
    return {
      dimension,
      weight,
      score: 0,
      evidence: "unknown",
      reasons: ["No budget specified"],
    };
  }

  if (!pricing) {
    return {
      dimension,
      weight,
      score: 0,
      evidence: "unknown",
      reasons: ["Pricing not available"],
    };
  }

  // Calculate estimated monthly cost
  let estimatedMonthlyCents: number | null = null;
  const providerCount = getEffectiveProviderCount(fingerprint) ?? 1;

  switch (pricing.basis) {
    case "per-provider-month":
      estimatedMonthlyCents = (pricing.typicalPriceCents ?? pricing.minPriceCents ?? 0) * providerCount;
      break;
    case "flat-monthly":
      estimatedMonthlyCents = pricing.typicalPriceCents ?? pricing.minPriceCents ?? null;
      break;
    case "per-provider-year":
      estimatedMonthlyCents = Math.round(
        ((pricing.typicalPriceCents ?? pricing.minPriceCents ?? 0) * providerCount) / 12
      );
      break;
    case "flat-annual":
      estimatedMonthlyCents = Math.round((pricing.typicalPriceCents ?? pricing.minPriceCents ?? 0) / 12);
      break;
    case "freemium":
    case "free":
      estimatedMonthlyCents = 0;
      break;
    case "custom-quote":
      return {
        dimension,
        weight,
        score: 0,
        evidence: "unknown",
        reasons: ["Requires custom quote"],
      };
    default:
      estimatedMonthlyCents = null;
  }

  if (estimatedMonthlyCents === null) {
    return {
      dimension,
      weight,
      score: 0,
      evidence: "unknown",
      reasons: ["Unable to estimate cost"],
    };
  }

  const budgetCents = fingerprint.monthlyBudget * 100;
  const costRatio = estimatedMonthlyCents / budgetCents;

  let score: number;
  if (costRatio <= 0.7) {
    score = 1;
    reasons.push("Well within budget");
  } else if (costRatio <= 1) {
    score = 0.8;
    reasons.push("Within budget");
  } else if (costRatio <= 1.2) {
    score = 0.5;
    reasons.push("Slightly above budget");
  } else {
    score = 0.2;
    reasons.push("Significantly above budget");
  }

  return {
    dimension,
    weight,
    score,
    evidence: score >= 0.7 ? "match" : score >= 0.4 ? "partial" : "mismatch",
    reasons,
    provenance: pricing.provenance,
  };
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

/**
 * Calculate fit score for a product given a fingerprint
 */
export function calculateFitScore(
  input: ProductFitInput,
  fingerprint: PracticeFingerprint,
  currentStackSlugs: string[] = []
): FitResult {
  // Get relevance map
  const relevanceMap = getAllCapabilityRelevance(fingerprint);

  // Evaluate all dimensions
  const contributions: FitContribution[] = [
    evaluateHardRequirements(input, fingerprint),
    evaluateCapabilityAlignment(input, fingerprint, relevanceMap),
    evaluatePracticeTypeSizeFit(input, fingerprint),
    evaluateClinicalPayerFit(input, fingerprint),
    evaluateStackIntegration(input, currentStackSlugs),
    evaluatePriorities(input, fingerprint),
    evaluateCostFit(input, fingerprint),
  ];

  // Check for hard incompatibility
  const hardReq = contributions.find((c) => c.dimension === "hard-requirements");
  if (hardReq && hardReq.evidence === "mismatch") {
    return {
      productSlug: input.productSlug,
      score: null,
      fitScore: null,
      dataConfidence: 0,
      organicRankingValue: null,
      contributions,
      hasHardIncompatibility: true,
      incompatibilityReason: hardReq.reasons[0],
      isLimitedData: true,
      isInsufficientData: true,
    };
  }

  // Calculate weighted score from known dimensions only
  let knownWeight = 0;
  let totalWeight = 0;
  let weightedScore = 0;

  for (const contribution of contributions) {
    totalWeight += contribution.weight;
    if (contribution.evidence !== "unknown") {
      knownWeight += contribution.weight;
      weightedScore += contribution.weight * contribution.score;
    }
  }

  // Calculate data confidence
  const dataConfidence = totalWeight > 0 ? Math.round((knownWeight / totalWeight) * 100) : 0;

  // Check for insufficient data
  if (dataConfidence < 25) {
    return {
      productSlug: input.productSlug,
      score: null,
      fitScore: null,
      dataConfidence,
      organicRankingValue: null,
      contributions,
      hasHardIncompatibility: false,
      isLimitedData: true,
      isInsufficientData: true,
    };
  }

  // Calculate fit score (normalized to known dimensions)
  const fitScore = knownWeight > 0 ? Math.round((weightedScore / knownWeight) * 100) : null;

  // Calculate organic ranking value
  const organicRankingValue =
    fitScore !== null
      ? Math.round(0.7 * fitScore + 0.3 * dataConfidence)
      : null;

  return {
    productSlug: input.productSlug,
    score: fitScore,
    fitScore,
    dataConfidence,
    organicRankingValue,
    contributions,
    hasHardIncompatibility: false,
    isLimitedData: dataConfidence < 50,
    isInsufficientData: false,
  };
}

/**
 * Sort products by organic ranking value
 */
export function sortByFit(results: FitResult[]): FitResult[] {
  return [...results].sort((a, b) => {
    // Products with incompatibilities go last
    if (a.hasHardIncompatibility && !b.hasHardIncompatibility) return 1;
    if (!a.hasHardIncompatibility && b.hasHardIncompatibility) return -1;

    // Products with insufficient data go after products with scores
    if (a.organicRankingValue === null && b.organicRankingValue !== null) return 1;
    if (a.organicRankingValue !== null && b.organicRankingValue === null) return -1;

    // Sort by organic ranking value (higher is better)
    if (a.organicRankingValue !== null && b.organicRankingValue !== null) {
      if (a.organicRankingValue !== b.organicRankingValue) {
        return b.organicRankingValue - a.organicRankingValue;
      }
    }

    // Tiebreaker: higher confidence
    if (a.dataConfidence !== b.dataConfidence) {
      return b.dataConfidence - a.dataConfidence;
    }

    // Tiebreaker: higher fit score
    if (a.fitScore !== null && b.fitScore !== null && a.fitScore !== b.fitScore) {
      return b.fitScore - a.fitScore;
    }

    // Tiebreaker: slug for stable sort
    return a.productSlug.localeCompare(b.productSlug);
  });
}

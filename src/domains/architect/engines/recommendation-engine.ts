/**
 * Recommendation Engine
 *
 * Generates a deterministic recommended technology stack based on the practice fingerprint.
 * This is the core "Build for Me" logic.
 *
 * The algorithm:
 * 1. Determine required and important capabilities from fingerprint
 * 2. Exclude products with verified hard incompatibilities
 * 3. Rank eligible products by incremental value to current stack
 * 4. Select products that add the most relevance-weighted coverage
 * 5. Prefer higher fit and higher-confidence evidence
 * 6. Penalize probable redundancy
 * 7. Consider budget only when budget and sufficient pricing data exist
 * 8. Stop when important incremental coverage gain becomes negligible
 *
 * The recommendation must be stable: same inputs and catalog data produce same output.
 */

import {
  type PracticeFingerprint,
  type ProductArchitectureMetadata,
  type CapabilityId,
  type RelevanceLevel,
  CAPABILITY_REGISTRY,
  hasBuildForMeRequirements,
} from "../schemas";
import { getCapabilityRelevance } from "./relevance-engine";
import { calculateFitScore, type ProductFitInput } from "./fit-engine";
import { calculateStackCoverage } from "./coverage-engine";
import { analyzeOverlaps } from "./overlap-engine";
import { analyzeProductPair } from "./compatibility-engine";

export type ProductMetadataMap = Map<string, ProductArchitectureMetadata>;

// ============================================================================
// TYPES
// ============================================================================

export type RecommendedProduct = {
  slug: string;
  // Human-readable name (from product display data)
  name?: string;

  // Why this product was recommended
  reasoning: string[];

  // What capabilities this product adds to the stack
  addedCapabilities: Array<{
    capabilityId: CapabilityId;
    capabilityName: string;
    strength: string;
    relevance: RelevanceLevel;
  }>;

  // Fit and confidence
  fitScore: number | null;
  dataConfidence: number;
  isLimitedData: boolean;

  // Cost
  estimatedMonthlyCostCents: number | null;
  costBasis?: string;
  requiresQuote: boolean;

  // Limitations
  knownLimitations: string[];

  // Selection metadata
  selectionOrder: number; // 1-based order in which product was selected
  incrementalCoverageGain: number; // Coverage % added by this product
};

export type StackRecommendation = {
  // The recommended products (in selection order)
  products: RecommendedProduct[];

  // Overall stack metrics
  totalCoveragePercent: number;
  totalEstimatedMonthlyCostCents: number | null;
  productsWithUnknownPricing: number;
  productsRequiringQuote: number;

  // Gaps remaining after recommendation
  remainingGaps: Array<{
    capabilityId: CapabilityId;
    capabilityName: string;
    relevance: RelevanceLevel;
    reason: string;
  }>;

  // Summary reasons for the overall recommendation
  summaryReasons: string[];

  // Data quality
  overallDataConfidence: number;
  hasLimitedData: boolean;

  // Budget status
  isWithinBudget: boolean | null;
  budgetUtilizationPercent: number | null;

  // Metadata
  generatedAt: string;
  fingerprintHash: string; // For detecting when fingerprint changes
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all capabilities and their relevance from fingerprint
 */
function getCapabilityRelevanceMap(
  fingerprint: PracticeFingerprint
): Map<CapabilityId, RelevanceLevel> {
  const relevanceMap = new Map<CapabilityId, RelevanceLevel>();

  for (const capId of Object.keys(CAPABILITY_REGISTRY) as CapabilityId[]) {
    const result = getCapabilityRelevance(capId, fingerprint);
    relevanceMap.set(capId, result.level);
  }

  return relevanceMap;
}

/**
 * Get important capabilities (required, strongly-recommended, useful)
 */
function getImportantCapabilities(
  relevanceMap: Map<CapabilityId, RelevanceLevel>
): Set<CapabilityId> {
  const important = new Set<CapabilityId>();

  for (const [capId, relevance] of relevanceMap) {
    if (
      relevance === "required" ||
      relevance === "strongly-recommended" ||
      relevance === "useful"
    ) {
      important.add(capId);
    }
  }

  return important;
}

/**
 * Relevance weight for scoring
 */
function getRelevanceWeight(relevance: RelevanceLevel): number {
  switch (relevance) {
    case "required":
      return 3.0;
    case "strongly-recommended":
      return 2.0;
    case "useful":
      return 1.0;
    case "optional":
      return 0.3;
    case "irrelevant":
      return 0;
  }
}

/**
 * Strength weight for scoring
 */
function getStrengthWeight(strength: string): number {
  switch (strength) {
    case "core":
      return 1.0;
    case "strong":
      return 0.8;
    case "partial":
      return 0.5;
    case "addon":
      return 0.35;
    case "integration-only":
      return 0.1; // Very low - not real coverage
    default:
      return 0;
  }
}

/**
 * Calculate incremental coverage value of a product
 */
function calculateIncrementalValue(
  product: ProductArchitectureMetadata,
  coveredCapabilities: Set<CapabilityId>,
  relevanceMap: Map<CapabilityId, RelevanceLevel>
): {
  totalValue: number;
  newCapabilities: Array<{
    capabilityId: CapabilityId;
    strength: string;
    relevance: RelevanceLevel;
    value: number;
  }>;
} {
  let totalValue = 0;
  const newCapabilities: Array<{
    capabilityId: CapabilityId;
    strength: string;
    relevance: RelevanceLevel;
    value: number;
  }> = [];

  for (const cap of product.capabilities) {
    // Skip if already covered
    if (coveredCapabilities.has(cap.capabilityId)) {
      continue;
    }

    // Skip integration-only (not real coverage)
    if (cap.strength === "integration-only") {
      continue;
    }

    const relevance = relevanceMap.get(cap.capabilityId) || "optional";
    const relevanceWeight = getRelevanceWeight(relevance);
    const strengthWeight = getStrengthWeight(cap.strength);

    const value = relevanceWeight * strengthWeight;

    if (value > 0) {
      totalValue += value;
      newCapabilities.push({
        capabilityId: cap.capabilityId,
        strength: cap.strength,
        relevance,
        value,
      });
    }
  }

  return { totalValue, newCapabilities };
}

/**
 * Check if product has hard incompatibility
 */
function hasHardIncompatibility(
  product: ProductArchitectureMetadata,
  fingerprint: PracticeFingerprint
): { incompatible: boolean; reason?: string } {
  const evidence = product.fitEvidence;

  if (!evidence) {
    return { incompatible: false };
  }

  // Check practice type exclusions
  if (
    evidence.practiceTypesExcluded &&
    fingerprint.practiceType &&
    evidence.practiceTypesExcluded.includes(fingerprint.practiceType)
  ) {
    return {
      incompatible: true,
      reason: `Not compatible with ${fingerprint.practiceType} practices`,
    };
  }

  // Check state exclusions
  if (
    evidence.statesExcluded &&
    fingerprint.statesServed &&
    fingerprint.statesServed.some((s) => evidence.statesExcluded?.includes(s))
  ) {
    return {
      incompatible: true,
      reason: "Not available in one or more of your states",
    };
  }

  // Check prescribing requirements
  if (
    fingerprint.prescribingLevel === "controlled-substances-epcs" &&
    !product.capabilities.some((c) => c.capabilityId === "epcs")
  ) {
    // Check if this is an EHR/PM that should have EPCS
    const isEhrOrPm = product.capabilities.some(
      (c) =>
        c.capabilityId === "ehr-clinical-record" ||
        c.capabilityId === "clinical-documentation"
    );

    if (isEhrOrPm) {
      // It's an EHR without EPCS - not necessarily incompatible, but note it
      // Don't mark as hard incompatible, just a limitation
    }
  }

  return { incompatible: false };
}

/**
 * Calculate product cost estimate
 */
function estimateProductCost(
  product: ProductArchitectureMetadata,
  fingerprint: PracticeFingerprint
): {
  monthlyCostCents: number | null;
  basis: string;
  requiresQuote: boolean;
} {
  const pricing = product.pricing;

  if (!pricing) {
    return { monthlyCostCents: null, basis: "unknown", requiresQuote: false };
  }

  if (pricing.requiresQuote || pricing.basis === "custom-quote") {
    return { monthlyCostCents: null, basis: "custom-quote", requiresQuote: true };
  }

  if (pricing.basis === "free") {
    return { monthlyCostCents: 0, basis: "free", requiresQuote: false };
  }

  // Get provider count for calculations
  let providerCount = 1;
  if (fingerprint.exactProviderCount) {
    providerCount = fingerprint.exactProviderCount;
  } else if (fingerprint.sizeBucket) {
    // Estimate from bucket
    const bucketMidpoints: Record<string, number> = {
      solo: 1,
      "2-5": 3,
      "6-10": 8,
      "11-25": 18,
      "26-50": 38,
      "51-100": 75,
      "101-250": 175,
      "250+": 300,
    };
    providerCount = bucketMidpoints[fingerprint.sizeBucket] || 1;
  }

  let costCents: number | null = null;

  switch (pricing.basis) {
    case "per-provider-month":
      costCents = (pricing.typicalPriceCents || pricing.minPriceCents || 0) * providerCount;
      break;
    case "per-provider-year":
      costCents = Math.round(
        ((pricing.typicalPriceCents || pricing.minPriceCents || 0) * providerCount) / 12
      );
      break;
    case "flat-monthly":
    case "per-practice-month":
      costCents = pricing.typicalPriceCents || pricing.minPriceCents || null;
      break;
    case "flat-annual":
    case "per-practice-year":
      costCents = pricing.typicalPriceCents || pricing.minPriceCents
        ? Math.round((pricing.typicalPriceCents || pricing.minPriceCents || 0) / 12)
        : null;
      break;
    case "freemium":
      costCents = 0; // Assume free tier for estimation
      break;
    default:
      costCents = null;
  }

  return {
    monthlyCostCents: costCents,
    basis: pricing.basis,
    requiresQuote: false,
  };
}

/**
 * Generate a simple hash of fingerprint for change detection
 */
function hashFingerprint(fingerprint: PracticeFingerprint): string {
  const key = [
    fingerprint.practiceType,
    fingerprint.sizeBucket,
    fingerprint.primaryPayerType,
    fingerprint.prescribingLevel,
    fingerprint.deliveryModel,
    (fingerprint.priorities || []).join(","),
    fingerprint.monthlyBudget,
  ].join("|");

  // Simple hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

export interface RecommendationInput {
  fingerprint: PracticeFingerprint;
  availableProducts: ProductArchitectureMetadata[];
  existingSelectionSlugs?: string[]; // Don't override manually selected products
  maxProducts?: number; // Default 10
  minCoverageThreshold?: number; // Stop when coverage reaches this (0-100), default 85
  incrementalValueThreshold?: number; // Stop adding when incremental value falls below this
}

/**
 * Generate a deterministic recommended stack
 */
export function generateRecommendation(
  input: RecommendationInput
): StackRecommendation {
  const {
    fingerprint,
    availableProducts,
    existingSelectionSlugs = [],
    maxProducts = 10,
    minCoverageThreshold = 85,
    incrementalValueThreshold = 0.5,
  } = input;

  // Validate fingerprint
  if (!hasBuildForMeRequirements(fingerprint)) {
    return {
      products: [],
      totalCoveragePercent: 0,
      totalEstimatedMonthlyCostCents: null,
      productsWithUnknownPricing: 0,
      productsRequiringQuote: 0,
      remainingGaps: [],
      summaryReasons: [
        "Incomplete practice profile. Please complete the fingerprint questionnaire.",
      ],
      overallDataConfidence: 0,
      hasLimitedData: true,
      isWithinBudget: null,
      budgetUtilizationPercent: null,
      generatedAt: new Date().toISOString(),
      fingerprintHash: hashFingerprint(fingerprint),
    };
  }

  // Build relevance map
  const relevanceMap = getCapabilityRelevanceMap(fingerprint);
  const importantCapabilities = getImportantCapabilities(relevanceMap);

  // Track what's already covered (from existing selections)
  const coveredCapabilities = new Set<CapabilityId>();
  const selectedSlugs = new Set(existingSelectionSlugs);

  // Build metadata map for existing selections
  const metadataMap = new Map<string, ProductArchitectureMetadata>();
  for (const product of availableProducts) {
    metadataMap.set(product.productSlug, product);

    // Mark capabilities from existing selections as covered
    // Only core/strong count as "fully covered" - partial/addon don't block stronger coverage
    if (selectedSlugs.has(product.productSlug)) {
      for (const cap of product.capabilities) {
        if (cap.strength === "core" || cap.strength === "strong") {
          coveredCapabilities.add(cap.capabilityId);
        }
      }
    }
  }

  // Filter eligible products (exclude incompatible, already selected)
  const eligibleProducts = availableProducts.filter((product) => {
    // Skip if already selected
    if (selectedSlugs.has(product.productSlug)) {
      return false;
    }

    // Skip if hard incompatible
    const { incompatible } = hasHardIncompatibility(product, fingerprint);
    if (incompatible) {
      return false;
    }

    // Skip if no capability metadata
    if (!product.capabilities || product.capabilities.length === 0) {
      return false;
    }

    return true;
  });

  // Calculate fit scores for all eligible products
  const fitScores = new Map<
    string,
    { fitScore: number | null; dataConfidence: number; isLimitedData: boolean }
  >();

  for (const product of eligibleProducts) {
    const fitInput: ProductFitInput = {
      productSlug: product.productSlug,
      productName: product.productSlug, // Use slug as fallback for name
      metadata: product,
    };

    const fitResult = calculateFitScore(fitInput, fingerprint, []);
    fitScores.set(product.productSlug, {
      fitScore: fitResult.fitScore,
      dataConfidence: fitResult.dataConfidence,
      isLimitedData: fitResult.isLimitedData,
    });
  }

  // Greedy selection algorithm
  const selectedProducts: RecommendedProduct[] = [];
  let totalCostCents: number | null = 0;
  let productsWithUnknownPricing = 0;
  let productsRequiringQuote = 0;
  let selectionOrder = 0;

  while (selectedProducts.length < maxProducts) {
    // Find product with highest incremental value
    let bestProduct: ProductArchitectureMetadata | null = null;
    let bestValue = -1;
    let bestNewCaps: Array<{
      capabilityId: CapabilityId;
      strength: string;
      relevance: RelevanceLevel;
      value: number;
    }> = [];

    for (const product of eligibleProducts) {
      // Skip if already selected this round
      if (selectedSlugs.has(product.productSlug)) {
        continue;
      }

      // Check compatibility with ALL already-selected products:
      // 1. Products from existingSelectionSlugs (already in user's stack)
      // 2. Products selected during this recommendation run
      let hasIncompatibility = false;
      let compatibilityConcerns = 0;

      // Check against existing selections first
      for (const existingSlug of existingSelectionSlugs) {
        const compatibility = analyzeProductPair(
          product.productSlug,
          existingSlug,
          metadataMap
        );
        if (compatibility.status === "incompatible") {
          hasIncompatibility = true;
          break;
        }
        if (compatibility.status === "concern") {
          compatibilityConcerns++;
        }
      }

      // Check against products selected in this run (if no incompatibility found yet)
      if (!hasIncompatibility) {
        for (const selected of selectedProducts) {
          const compatibility = analyzeProductPair(
            product.productSlug,
            selected.slug,
            metadataMap
          );
          if (compatibility.status === "incompatible") {
            hasIncompatibility = true;
            break;
          }
          if (compatibility.status === "concern") {
            compatibilityConcerns++;
          }
        }
      }

      // Skip products with documented incompatibilities
      if (hasIncompatibility) {
        continue;
      }

      const { totalValue, newCapabilities } = calculateIncrementalValue(
        product,
        coveredCapabilities,
        relevanceMap
      );

      // Apply fit score bonus (products with higher fit get small boost)
      const fit = fitScores.get(product.productSlug);
      const fitBonus = fit?.fitScore ? (fit.fitScore / 100) * 0.3 : 0;

      // Apply confidence bonus (prefer reviewed products)
      const confidenceBonus = fit?.dataConfidence ? (fit.dataConfidence / 100) * 0.2 : 0;

      // Calculate overlap penalty - penalize products that share many capabilities with already selected
      let overlapPenalty = 0;
      if (selectedProducts.length > 0) {
        const productCaps = new Set(
          product.capabilities
            .filter((c) => c.strength === "core" || c.strength === "strong")
            .map((c) => c.capabilityId)
        );

        let totalOverlap = 0;
        for (const selected of selectedProducts) {
          const selectedMeta = metadataMap.get(selected.slug);
          if (selectedMeta) {
            const selectedCaps = new Set(
              selectedMeta.capabilities
                .filter((c) => c.strength === "core" || c.strength === "strong")
                .map((c) => c.capabilityId)
            );
            // Count overlapping capabilities
            for (const cap of productCaps) {
              if (selectedCaps.has(cap)) {
                totalOverlap++;
              }
            }
          }
        }
        // Apply penalty: 15% reduction per overlapping core capability
        overlapPenalty = Math.min(0.6, totalOverlap * 0.15);
      }

      // Budget awareness: penalize if would exceed budget
      let budgetPenalty = 0;
      if (fingerprint.monthlyBudget && totalCostCents !== null) {
        const productCost = estimateProductCost(product, fingerprint);
        if (productCost.monthlyCostCents !== null) {
          const budgetCents = fingerprint.monthlyBudget * 100;
          const projectedTotal = totalCostCents + productCost.monthlyCostCents;
          if (projectedTotal > budgetCents) {
            // Penalize proportionally to how much over budget
            const overageRatio = (projectedTotal - budgetCents) / budgetCents;
            budgetPenalty = Math.min(0.5, overageRatio * 0.3);
          }
        }
      }

      // Compatibility concerns penalty (incompatibilities already filtered above)
      const compatibilityPenalty = Math.min(0.3, compatibilityConcerns * 0.1);

      const adjustedValue = totalValue * (1 + fitBonus + confidenceBonus - overlapPenalty - budgetPenalty - compatibilityPenalty);

      if (adjustedValue > bestValue) {
        bestValue = adjustedValue;
        bestProduct = product;
        bestNewCaps = newCapabilities;
      }
    }

    // Stop if no good candidate found
    if (!bestProduct || bestValue < incrementalValueThreshold) {
      break;
    }

    // Add to selection
    selectionOrder++;
    selectedSlugs.add(bestProduct.productSlug);

    // Mark capabilities as covered - only core/strong count as "fully covered"
    // Partial/addon capabilities are tracked but don't block stronger coverage later
    for (const cap of bestNewCaps) {
      if (cap.strength === "core" || cap.strength === "strong") {
        coveredCapabilities.add(cap.capabilityId);
      }
      // Track partial coverage separately for display purposes, but don't mark as covered
      // This allows a stronger product to still be selected for that capability
    }

    // Get fit and cost info
    const fit = fitScores.get(bestProduct.productSlug);
    const costInfo = estimateProductCost(bestProduct, fingerprint);

    // Build reasoning
    const reasoning: string[] = [];

    // Primary capability reasoning
    const primaryCaps = bestNewCaps
      .filter((c) => c.relevance === "required" || c.relevance === "strongly-recommended")
      .slice(0, 3);

    if (primaryCaps.length > 0) {
      const capNames = primaryCaps
        .map((c) => CAPABILITY_REGISTRY[c.capabilityId]?.name || c.capabilityId)
        .join(", ");
      reasoning.push(`Adds ${capNames}`);
    }

    // Fit reasoning
    if (fit?.fitScore && fit.fitScore >= 70) {
      reasoning.push(`High fit score (${fit.fitScore})`);
    }

    // Get limitations from metadata
    const knownLimitations: string[] = [];
    for (const cap of bestProduct.capabilities) {
      if (cap.limitation) {
        knownLimitations.push(cap.limitation);
      }
    }
    if (bestProduct.fitEvidence?.notIdealFor) {
      knownLimitations.push(...bestProduct.fitEvidence.notIdealFor);
    }

    // Calculate incremental coverage
    const coveredCount = [...coveredCapabilities].filter((c) =>
      importantCapabilities.has(c)
    ).length;
    const incrementalCoverageGain =
      (bestNewCaps.filter((c) => importantCapabilities.has(c.capabilityId)).length /
        importantCapabilities.size) *
      100;

    selectedProducts.push({
      slug: bestProduct.productSlug,
      reasoning,
      addedCapabilities: bestNewCaps.map((c) => ({
        capabilityId: c.capabilityId,
        capabilityName: CAPABILITY_REGISTRY[c.capabilityId]?.name || c.capabilityId,
        strength: c.strength,
        relevance: c.relevance,
      })),
      fitScore: fit?.fitScore ?? null,
      dataConfidence: fit?.dataConfidence ?? 0,
      isLimitedData: fit?.isLimitedData ?? true,
      estimatedMonthlyCostCents: costInfo.monthlyCostCents,
      costBasis: costInfo.basis,
      requiresQuote: costInfo.requiresQuote,
      knownLimitations: [...new Set(knownLimitations)].slice(0, 3),
      selectionOrder,
      incrementalCoverageGain,
    });

    // Update cost tracking
    if (costInfo.monthlyCostCents !== null && totalCostCents !== null) {
      totalCostCents += costInfo.monthlyCostCents;
    } else if (costInfo.monthlyCostCents === null) {
      if (costInfo.requiresQuote) {
        productsRequiringQuote++;
      } else {
        productsWithUnknownPricing++;
      }
    }

    // Check if we've hit coverage threshold
    const coveragePercent = (coveredCount / importantCapabilities.size) * 100;
    if (coveragePercent >= minCoverageThreshold) {
      break;
    }
  }

  // Calculate final coverage
  const finalCoveredCount = [...coveredCapabilities].filter((c) =>
    importantCapabilities.has(c)
  ).length;
  const totalCoveragePercent = Math.round(
    (finalCoveredCount / importantCapabilities.size) * 100
  );

  // Find remaining gaps
  const remainingGaps: StackRecommendation["remainingGaps"] = [];
  for (const capId of importantCapabilities) {
    if (!coveredCapabilities.has(capId)) {
      const capDef = CAPABILITY_REGISTRY[capId];
      const relevance = relevanceMap.get(capId) || "useful";

      remainingGaps.push({
        capabilityId: capId,
        capabilityName: capDef?.name || capId,
        relevance,
        reason:
          relevance === "required"
            ? "No suitable product found"
            : "Not covered by recommended stack",
      });
    }
  }

  // Sort gaps by relevance
  remainingGaps.sort((a, b) => {
    const order: RelevanceLevel[] = ["required", "strongly-recommended", "useful"];
    return order.indexOf(a.relevance) - order.indexOf(b.relevance);
  });

  // Generate summary reasons
  const summaryReasons: string[] = [];

  if (selectedProducts.length > 0) {
    summaryReasons.push(
      `Recommended ${selectedProducts.length} product${selectedProducts.length > 1 ? "s" : ""} to cover ${totalCoveragePercent}% of your practice needs`
    );
  }

  // Coverage reason
  if (totalCoveragePercent >= 90) {
    summaryReasons.push("Comprehensive coverage of required capabilities");
  } else if (totalCoveragePercent >= 70) {
    summaryReasons.push("Good coverage with some gaps to review");
  } else if (remainingGaps.filter((g) => g.relevance === "required").length > 0) {
    summaryReasons.push("Some required capabilities not covered - manual selection needed");
  }

  // Budget reason
  let isWithinBudget: boolean | null = null;
  let budgetUtilizationPercent: number | null = null;

  if (fingerprint.monthlyBudget && totalCostCents !== null) {
    const budgetCents = fingerprint.monthlyBudget * 100;
    budgetUtilizationPercent = Math.round((totalCostCents / budgetCents) * 100);
    isWithinBudget = totalCostCents <= budgetCents;

    if (isWithinBudget) {
      summaryReasons.push(
        `Within budget (${budgetUtilizationPercent}% of $${fingerprint.monthlyBudget}/mo)`
      );
    } else {
      summaryReasons.push(
        `Exceeds budget by $${Math.round((totalCostCents - budgetCents) / 100)}/mo`
      );
    }
  }

  // Practice type alignment
  if (fingerprint.practiceType) {
    const practiceTypeLabel =
      fingerprint.practiceType.charAt(0).toUpperCase() +
      fingerprint.practiceType.slice(1).replace(/-/g, " ");
    summaryReasons.push(`Tailored for ${practiceTypeLabel} practice`);
  }

  // Calculate overall data confidence
  const avgConfidence =
    selectedProducts.length > 0
      ? selectedProducts.reduce((sum, p) => sum + p.dataConfidence, 0) /
        selectedProducts.length
      : 0;

  return {
    products: selectedProducts,
    totalCoveragePercent,
    totalEstimatedMonthlyCostCents:
      productsWithUnknownPricing === 0 && productsRequiringQuote === 0
        ? totalCostCents
        : totalCostCents,
    productsWithUnknownPricing,
    productsRequiringQuote,
    remainingGaps,
    summaryReasons,
    overallDataConfidence: Math.round(avgConfidence),
    hasLimitedData: avgConfidence < 50,
    isWithinBudget,
    budgetUtilizationPercent,
    generatedAt: new Date().toISOString(),
    fingerprintHash: hashFingerprint(fingerprint),
  };
}

/**
 * Check if recommendation needs regeneration (fingerprint changed)
 */
export function shouldRegenerateRecommendation(
  fingerprint: PracticeFingerprint,
  existingHash: string
): boolean {
  return hashFingerprint(fingerprint) !== existingHash;
}

/**
 * Get recommendation summary text
 */
export function getRecommendationSummary(recommendation: StackRecommendation): string {
  if (recommendation.products.length === 0) {
    return "No products recommended. Complete your practice profile to get personalized recommendations.";
  }

  const coverage = `${recommendation.totalCoveragePercent}% coverage`;
  const products = `${recommendation.products.length} product${recommendation.products.length > 1 ? "s" : ""}`;

  let cost = "";
  if (recommendation.totalEstimatedMonthlyCostCents !== null) {
    const dollars = Math.round(recommendation.totalEstimatedMonthlyCostCents / 100);
    cost = `~$${dollars}/mo`;
    if (recommendation.productsRequiringQuote > 0) {
      cost += ` + ${recommendation.productsRequiringQuote} quote${recommendation.productsRequiringQuote > 1 ? "s" : ""}`;
    }
  } else {
    cost = "pricing varies";
  }

  return `${products} recommended for ${coverage} (${cost})`;
}

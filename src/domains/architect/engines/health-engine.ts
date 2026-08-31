/**
 * Health Engine
 *
 * Calculates Stack Health score with explainable subscores.
 * The health score represents overall stack quality and fitness.
 */

import {
  type PracticeStack,
  type ProductArchitectureMetadata,
  type StackHealthResult,
  type HealthSubscore,
  type FitResult,
  type StackCoverageResult,
  type CompatibilityAssessment,
  type CostEstimate,
} from "../schemas";

export type ProductMetadataMap = Map<string, ProductArchitectureMetadata>;

// ============================================================================
// SUBSCORE WEIGHTS
// ============================================================================

const SUBSCORE_WEIGHTS = {
  coverage: 0.35,
  practiceFit: 0.25,
  compatibility: 0.2,
  costEfficiency: 0.1,
  dataConfidence: 0.1,
} as const;

// ============================================================================
// INDIVIDUAL SUBSCORES
// ============================================================================

/**
 * Calculate coverage subscore from coverage result
 * Higher is better - we want high coverage of relevant capabilities
 */
function calculateCoverageSubscore(coverageResult: StackCoverageResult): HealthSubscore {
  // Use the relevance-weighted coverage percentage
  const score = coverageResult.knownCoveragePercent;

  let explanation: string;
  if (score >= 80) {
    explanation = "Excellent coverage of relevant capabilities";
  } else if (score >= 60) {
    explanation = "Good coverage with some gaps to address";
  } else if (score >= 40) {
    explanation = "Moderate coverage; consider filling key gaps";
  } else if (score >= 20) {
    explanation = "Limited coverage; many important capabilities missing";
  } else {
    explanation = "Minimal coverage of practice needs";
  }

  // Add gap context if applicable
  const gapCount = coverageResult.gapCapabilities.length;
  if (gapCount > 0) {
    explanation += ` (${gapCount} gap${gapCount > 1 ? "s" : ""} identified)`;
  }

  return {
    name: "Coverage",
    score,
    weight: SUBSCORE_WEIGHTS.coverage,
    contribution: Math.round(score * SUBSCORE_WEIGHTS.coverage),
    explanation,
  };
}

/**
 * Calculate practice fit subscore from fit results
 * Weighted mean of all product fit scores
 */
function calculatePracticeFitSubscore(fitResults: FitResult[]): HealthSubscore {
  if (fitResults.length === 0) {
    return {
      name: "Practice Fit",
      score: 0,
      weight: SUBSCORE_WEIGHTS.practiceFit,
      contribution: 0,
      explanation: "No products to evaluate",
    };
  }

  // Calculate weighted mean by fit score (higher fit products weighted more)
  let totalWeight = 0;
  let weightedSum = 0;

  for (const fit of fitResults) {
    // Skip products with no fit score
    if (fit.score === null) continue;
    // Use the fit score itself as the weight for weighted average
    const weight = fit.score / 100;
    weightedSum += fit.score * weight;
    totalWeight += weight;
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  let explanation: string;
  if (score >= 80) {
    explanation = "Products are an excellent match for your practice";
  } else if (score >= 60) {
    explanation = "Products are well-suited to your practice";
  } else if (score >= 40) {
    explanation = "Products are a reasonable fit with some limitations";
  } else {
    explanation = "Products may not be ideal for your practice profile";
  }

  return {
    name: "Practice Fit",
    score,
    weight: SUBSCORE_WEIGHTS.practiceFit,
    contribution: Math.round(score * SUBSCORE_WEIGHTS.practiceFit),
    explanation,
  };
}

/**
 * Calculate compatibility subscore from compatibility assessments
 * Penalizes incompatibilities and concerns
 * Returns null score when not applicable (0-1 products) or all unknown
 */
function calculateCompatibilitySubscore(
  compatibilityAssessments: CompatibilityAssessment[],
  productCount: number
): HealthSubscore {
  // With 0-1 products, compatibility is not applicable
  if (productCount <= 1) {
    return {
      name: "Compatibility",
      score: null,
      weight: SUBSCORE_WEIGHTS.compatibility,
      contribution: 0,
      explanation: productCount === 0 ? "No products to evaluate" : "Not applicable with single product",
      isNotApplicable: true,
    };
  }

  // Count by status
  let incompatibleCount = 0;
  let concernCount = 0;
  let compatibleCount = 0;
  let unknownCount = 0;

  for (const assessment of compatibilityAssessments) {
    switch (assessment.status) {
      case "incompatible":
        incompatibleCount++;
        break;
      case "concern":
        concernCount++;
        break;
      case "compatible":
        compatibleCount++;
        break;
      case "unknown":
        unknownCount++;
        break;
    }
  }

  const total = compatibilityAssessments.length;

  // If all integrations are unknown, we cannot score compatibility
  if (total > 0 && unknownCount === total) {
    return {
      name: "Compatibility",
      score: null,
      weight: SUBSCORE_WEIGHTS.compatibility,
      contribution: 0,
      explanation: `All ${total} product integration${total > 1 ? "s" : ""} have unknown compatibility`,
      isInsufficientData: true,
    };
  }

  // Calculate score only from known integrations
  // Unknown integrations do not contribute positively or negatively to score,
  // but we note them in explanation
  const knownTotal = incompatibleCount + concernCount + compatibleCount;

  if (knownTotal === 0) {
    // No integration data at all
    return {
      name: "Compatibility",
      score: null,
      weight: SUBSCORE_WEIGHTS.compatibility,
      contribution: 0,
      explanation: "No integration data available",
      isInsufficientData: true,
    };
  }

  // Calculate score from known integrations only
  // Incompatible = heavy penalty, concern = moderate penalty
  const incompatiblePenalty = incompatibleCount * 40;
  const concernPenalty = concernCount * 15;
  const maxPenalty = knownTotal * 40; // If all known were incompatible
  const actualPenalty = incompatiblePenalty + concernPenalty;
  const score = Math.max(0, Math.round(100 - (actualPenalty / maxPenalty) * 100));

  let explanation: string;
  if (incompatibleCount > 0) {
    explanation = `${incompatibleCount} incompatible product pair${incompatibleCount > 1 ? "s" : ""} detected`;
  } else if (concernCount > 0) {
    explanation = `${concernCount} potential compatibility concern${concernCount > 1 ? "s" : ""}`;
  } else {
    explanation = "All verified integrations appear compatible";
  }

  // Note unknown integrations separately - they don't affect score but user should know
  if (unknownCount > 0) {
    explanation += ` (${unknownCount} unverified)`;
  }

  return {
    name: "Compatibility",
    score,
    weight: SUBSCORE_WEIGHTS.compatibility,
    contribution: Math.round(score * SUBSCORE_WEIGHTS.compatibility),
    explanation,
    hasData: knownTotal > 0,
  };
}

/**
 * Calculate cost subscore
 * When budget exists: "Cost Efficiency" - compares estimated cost to budget
 * When no budget: "Cost Visibility" - measures how much pricing data is known
 */
function calculateCostSubscore(
  costEstimate: CostEstimate,
  monthlyBudget: number | undefined
): HealthSubscore {
  const total = costEstimate.productCount;

  // No products - not applicable
  if (total === 0) {
    return {
      name: "Cost",
      score: null,
      weight: SUBSCORE_WEIGHTS.costEfficiency,
      contribution: 0,
      explanation: "No products to evaluate",
      isNotApplicable: true,
    };
  }

  const knownPricing = costEstimate.knownPricingCount;
  const knownPercent = Math.round((knownPricing / total) * 100);

  // If no budget specified, show Cost Visibility (not efficiency)
  if (!monthlyBudget) {
    // Score based on how much pricing data is available
    // This is about data completeness, not product quality
    const score = knownPercent;

    let explanation: string;
    if (knownPercent === 100) {
      explanation = "All product pricing is known";
    } else if (knownPercent >= 75) {
      explanation = `${knownPricing}/${total} products have known pricing`;
    } else if (knownPercent >= 50) {
      explanation = `${knownPricing}/${total} products have known pricing; others require quotes`;
    } else if (knownPercent > 0) {
      explanation = `Only ${knownPricing}/${total} products have known pricing`;
    } else {
      explanation = "No pricing data available; all products require quotes";
    }

    if (costEstimate.customQuoteCount > 0) {
      explanation += ` (${costEstimate.customQuoteCount} custom quote${costEstimate.customQuoteCount > 1 ? "s" : ""})`;
    }

    return {
      name: "Cost Visibility",
      score,
      weight: SUBSCORE_WEIGHTS.costEfficiency,
      contribution: Math.round(score * SUBSCORE_WEIGHTS.costEfficiency),
      explanation,
      hasData: knownPricing > 0,
    };
  }

  // We have a budget - calculate Cost Efficiency
  const budgetCents = monthlyBudget * 100;

  // If we can't estimate total cost, efficiency is unknown
  if (costEstimate.knownMaxMonthlyCents === null) {
    return {
      name: "Cost Efficiency",
      score: null,
      weight: SUBSCORE_WEIGHTS.costEfficiency,
      contribution: 0,
      explanation: "Unable to estimate total cost against budget",
      isInsufficientData: true,
    };
  }

  const percentOfBudget = (costEstimate.knownMaxMonthlyCents / budgetCents) * 100;

  let score: number;
  let explanation: string;

  if (percentOfBudget <= 60) {
    score = 100;
    explanation = `Well under budget (${Math.round(percentOfBudget)}% of budget)`;
  } else if (percentOfBudget <= 80) {
    score = 90;
    explanation = `Comfortably within budget (${Math.round(percentOfBudget)}% of budget)`;
  } else if (percentOfBudget <= 100) {
    score = 70;
    explanation = `Near budget limit (${Math.round(percentOfBudget)}% of budget)`;
  } else if (percentOfBudget <= 120) {
    score = 40;
    explanation = `Exceeds budget by ${Math.round(percentOfBudget - 100)}%`;
  } else {
    score = 20;
    explanation = `Significantly over budget (${Math.round(percentOfBudget)}% of budget)`;
  }

  // Note unknown pricing - it affects reliability of estimate
  if (costEstimate.unknownPricingCount > 0) {
    explanation += ` (${costEstimate.unknownPricingCount} with unknown pricing)`;
  }

  return {
    name: "Cost Efficiency",
    score,
    weight: SUBSCORE_WEIGHTS.costEfficiency,
    contribution: Math.round(score * SUBSCORE_WEIGHTS.costEfficiency),
    explanation,
    hasData: true,
  };
}

/**
 * Calculate data confidence subscore
 * How much do we actually know about the products?
 */
function calculateDataConfidenceSubscore(
  stack: PracticeStack,
  metadataMap: ProductMetadataMap
): HealthSubscore {
  // Include demo products when in demo mode
  const products = stack.isDemoMode
    ? stack.selectedProducts
    : stack.selectedProducts.filter((p) => !p.isDemo);

  if (products.length === 0) {
    return {
      name: "Data Confidence",
      score: 0,
      weight: SUBSCORE_WEIGHTS.dataConfidence,
      contribution: 0,
      explanation: "No products to evaluate",
    };
  }

  let totalConfidence = 0;
  let reviewedCount = 0;
  let unreviewedCount = 0;

  for (const selected of products) {
    const metadata = metadataMap.get(selected.slug);
    if (!metadata) {
      totalConfidence += 0;
      unreviewedCount++;
      continue;
    }

    // Confidence based on capability map status and provenance
    let productConfidence = 0;

    switch (metadata.capabilityMapStatus) {
      case "reviewed-complete":
        productConfidence = 100;
        reviewedCount++;
        break;
      case "reviewed-partial":
        productConfidence = 70;
        reviewedCount++;
        break;
      case "unreviewed":
        productConfidence = 30;
        unreviewedCount++;
        break;
      default:
        productConfidence = 20;
        unreviewedCount++;
    }

    totalConfidence += productConfidence;
  }

  const score = Math.round(totalConfidence / products.length);

  let explanation: string;
  if (reviewedCount === products.length) {
    explanation = "All product data has been reviewed";
  } else if (unreviewedCount === products.length) {
    explanation = "Product data has not been verified";
  } else {
    explanation = `${reviewedCount}/${products.length} products have reviewed data`;
  }

  return {
    name: "Data Confidence",
    score,
    weight: SUBSCORE_WEIGHTS.dataConfidence,
    contribution: Math.round(score * SUBSCORE_WEIGHTS.dataConfidence),
    explanation,
  };
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

export interface HealthEngineInput {
  stack: PracticeStack;
  metadataMap: ProductMetadataMap;
  coverageResult: StackCoverageResult;
  fitResults: FitResult[];
  compatibilityAssessments: CompatibilityAssessment[];
  costEstimate: CostEstimate;
}

/**
 * Calculate overall Stack Health score
 */
export function calculateStackHealth(input: HealthEngineInput): StackHealthResult {
  const {
    stack,
    metadataMap,
    coverageResult,
    fitResults,
    compatibilityAssessments,
    costEstimate,
  } = input;

  // Include demo products when in demo mode
  const productCount = stack.isDemoMode
    ? stack.selectedProducts.length
    : stack.selectedProducts.filter((p) => !p.isDemo).length;

  // Calculate all subscores
  const subscores: HealthSubscore[] = [
    calculateCoverageSubscore(coverageResult),
    calculatePracticeFitSubscore(fitResults),
    calculateCompatibilitySubscore(compatibilityAssessments, productCount),
    calculateCostSubscore(costEstimate, stack.fingerprint.monthlyBudget),
    calculateDataConfidenceSubscore(stack, metadataMap),
  ];

  // Calculate overall score
  // Only include subscores that have a valid score (not null)
  // Renormalize weights among scoreable dimensions
  const scoreableSubscores = subscores.filter((s) => s.score !== null);
  const totalWeight = scoreableSubscores.reduce((sum, sub) => sum + sub.weight, 0);

  let overallScore: number;
  if (totalWeight > 0 && scoreableSubscores.length > 0) {
    // Renormalize: calculate weighted average of available scores
    const weightedSum = scoreableSubscores.reduce(
      (sum, sub) => sum + (sub.score as number) * sub.weight,
      0
    );
    overallScore = Math.round(weightedSum / totalWeight);
  } else {
    // No scoreable dimensions - can't calculate health
    overallScore = 0;
  }

  // Determine health level
  let healthLevel: "excellent" | "good" | "fair" | "poor";
  if (overallScore >= 80) {
    healthLevel = "excellent";
  } else if (overallScore >= 60) {
    healthLevel = "good";
  } else if (overallScore >= 40) {
    healthLevel = "fair";
  } else {
    healthLevel = "poor";
  }

  // Generate summary
  let summary: string;
  if (productCount === 0) {
    summary = "Add products to see stack health analysis";
  } else if (healthLevel === "excellent") {
    summary = "Your stack is well-optimized for your practice";
  } else if (healthLevel === "good") {
    summary = "Your stack is solid with room for improvement";
  } else if (healthLevel === "fair") {
    summary = "Your stack has significant gaps or concerns to address";
  } else {
    summary = "Your stack needs substantial work to meet practice needs";
  }

  // Note if some dimensions couldn't be scored
  const unscoredCount = subscores.filter((s) => s.score === null).length;
  if (unscoredCount > 0 && productCount > 0) {
    summary += ` (${unscoredCount} dimension${unscoredCount > 1 ? "s" : ""} not scored due to insufficient data)`;
  }

  // Find top concerns (lowest scoreable subscores)
  const topConcerns = subscores
    .filter((s) => s.score !== null && s.score < 60)
    .sort((a, b) => (a.score as number) - (b.score as number))
    .slice(0, 3)
    .map((s) => s.name);

  return {
    overallScore,
    healthLevel,
    subscores,
    topConcerns,
    summary,
  };
}

/**
 * Get improvement suggestions based on health result
 */
export function getImprovementSuggestions(
  healthResult: StackHealthResult,
  coverageResult: StackCoverageResult
): string[] {
  const suggestions: string[] = [];

  for (const subscore of healthResult.subscores) {
    // Skip N/A subscores
    if (subscore.score === null) continue;

    if (subscore.score < 60) {
      switch (subscore.name) {
        case "Coverage":
          if (coverageResult.gapCapabilities.length > 0) {
            suggestions.push(
              `Fill ${coverageResult.gapCapabilities.length} coverage gap${coverageResult.gapCapabilities.length > 1 ? "s" : ""} in your stack`
            );
          }
          break;
        case "Practice Fit":
          suggestions.push("Consider replacing products with better practice-fit alternatives");
          break;
        case "Compatibility":
          suggestions.push("Review product integrations to resolve compatibility concerns");
          break;
        case "Cost Efficiency":
          suggestions.push("Evaluate cost optimization opportunities or adjust budget");
          break;
        case "Cost Visibility":
          suggestions.push("Request quotes for products with unknown pricing to complete cost estimate");
          break;
        case "Data Confidence":
          suggestions.push("Some product data is unverified; recommendations may be incomplete");
          break;
      }
    }
  }

  return suggestions;
}

/**
 * Compare health before and after a potential change
 */
export function compareHealthImpact(
  beforeHealth: StackHealthResult,
  afterHealth: StackHealthResult
): {
  scoreDelta: number;
  levelChanged: boolean;
  improved: boolean;
  subscoreDeltas: Array<{ name: string; delta: number | null; beforeScore: number | null; afterScore: number | null }>;
} {
  const scoreDelta = afterHealth.overallScore - beforeHealth.overallScore;
  const levelChanged = afterHealth.healthLevel !== beforeHealth.healthLevel;
  const improved = scoreDelta > 0;

  const subscoreDeltas = afterHealth.subscores.map((after) => {
    const before = beforeHealth.subscores.find((b) => b.name === after.name);
    const beforeScore = before?.score ?? null;
    const afterScore = after.score;

    // Calculate delta only if both scores exist
    let delta: number | null = null;
    if (beforeScore !== null && afterScore !== null) {
      delta = afterScore - beforeScore;
    }

    return {
      name: after.name,
      delta,
      beforeScore,
      afterScore,
    };
  });

  return {
    scoreDelta,
    levelChanged,
    improved,
    subscoreDeltas,
  };
}

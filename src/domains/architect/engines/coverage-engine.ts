/**
 * Coverage Engine
 *
 * Calculates how well the practice stack covers lifecycle capabilities.
 * Pure function over validated inputs - no side effects.
 */

import {
  type PracticeFingerprint,
  type PracticeStack,
  type ProductArchitectureMetadata,
  type CapabilityId,
  type CoverageStatus,
  type CapabilityCoverage,
  type StageCoverage,
  type StackCoverageResult,
  type RelevanceLevel,
  type LifecycleStageId,
  CAPABILITY_STRENGTH_VALUES,
  RELEVANCE_WEIGHTS,
  getCapabilitiesForStage,
  getOrderedStages,
  getRelevanceOverride,
} from "../schemas";
import { getAllCapabilityRelevance } from "./relevance-engine";

// ============================================================================
// TYPES
// ============================================================================

export type ProductMetadataMap = Map<string, ProductArchitectureMetadata>;

// ============================================================================
// CAPABILITY COVERAGE
// ============================================================================

/**
 * Calculate coverage status from numeric value
 */
function getCoverageStatus(value: number, hasUnknown: boolean): CoverageStatus {
  if (value === 0) {
    return hasUnknown ? "unknown" : "missing";
  }
  if (value < 0.75) return "partial";
  if (value < 0.9) return "covered";
  return "strong";
}

/**
 * Calculate coverage for a single capability
 */
function calculateCapabilityCoverage(
  capabilityId: CapabilityId,
  stack: PracticeStack,
  metadataMap: ProductMetadataMap,
  relevance: RelevanceLevel
): CapabilityCoverage {
  const coveringProducts: CapabilityCoverage["coveringProducts"] = [];
  let bestValue = 0;
  let hasUnknownProduct = false;

  // Check each selected product
  for (const selected of stack.selectedProducts) {
    if (selected.isDemo) continue; // Skip demo products

    const metadata = metadataMap.get(selected.slug);
    if (!metadata) {
      // Product has no Architect metadata
      hasUnknownProduct = true;
      continue;
    }

    // Check if product's capability map status affects this
    if (metadata.capabilityMapStatus === "unreviewed") {
      hasUnknownProduct = true;
    }

    // Find capability mapping
    const capMapping = metadata.capabilities.find(
      (c) => c.capabilityId === capabilityId
    );

    if (capMapping) {
      const strengthValue = CAPABILITY_STRENGTH_VALUES[capMapping.strength];
      coveringProducts.push({
        slug: selected.slug,
        strength: capMapping.strength,
        isCore: capMapping.strength === "core",
        limitation: capMapping.limitation,
      });

      if (strengthValue > bestValue) {
        bestValue = strengthValue;
      }
    }
  }

  // Determine coverage status
  let status: CoverageStatus;
  if (bestValue === 0 && stack.selectedProducts.filter((p) => !p.isDemo).length === 0) {
    status = "missing"; // Empty stack
  } else if (bestValue === 0 && hasUnknownProduct) {
    status = "unknown"; // Has products but no confirmed coverage
  } else if (bestValue === 0) {
    status = "missing"; // Has reviewed products, none cover this
  } else if (bestValue < 0.75) {
    status = "partial";
  } else if (bestValue < 0.9) {
    status = "covered";
  } else {
    status = "strong";
  }

  // Determine if this is a gap
  const isGap =
    (status === "missing" || status === "partial") &&
    (relevance === "required" || relevance === "strongly-recommended");

  const isDataGap = status === "unknown" && relevance !== "irrelevant";

  return {
    capabilityId,
    status,
    numericValue: bestValue,
    coveringProducts,
    relevance,
    isGap,
    isDataGap,
  };
}

// ============================================================================
// STAGE COVERAGE
// ============================================================================

/**
 * Calculate coverage for a lifecycle stage
 */
function calculateStageCoverage(
  stageId: LifecycleStageId,
  stack: PracticeStack,
  metadataMap: ProductMetadataMap,
  relevanceMap: Map<CapabilityId, RelevanceLevel>
): StageCoverage {
  const stageCapabilities = getCapabilitiesForStage(stageId);
  const capabilities: CapabilityCoverage[] = [];

  let relevantWeightSum = 0;
  let coveredWeightSum = 0;
  let coveredCount = 0;
  let partialCount = 0;
  let missingCount = 0;
  let unknownCount = 0;

  for (const cap of stageCapabilities) {
    // Get effective relevance (override or derived)
    const override = getRelevanceOverride(stack, cap.id);
    const relevance = override?.overrideLevel ?? relevanceMap.get(cap.id) ?? "useful";
    const relevanceWeight = RELEVANCE_WEIGHTS[relevance];

    const coverage = calculateCapabilityCoverage(
      cap.id,
      stack,
      metadataMap,
      relevance
    );
    capabilities.push(coverage);

    // Only count non-irrelevant capabilities
    if (relevance !== "irrelevant") {
      relevantWeightSum += relevanceWeight;

      if (coverage.status !== "unknown") {
        coveredWeightSum += relevanceWeight * coverage.numericValue;
      }

      switch (coverage.status) {
        case "strong":
        case "covered":
          coveredCount++;
          break;
        case "partial":
          partialCount++;
          break;
        case "missing":
          missingCount++;
          break;
        case "unknown":
          unknownCount++;
          break;
      }
    }
  }

  const coverageScore =
    relevantWeightSum > 0
      ? Math.round((coveredWeightSum / relevantWeightSum) * 100)
      : 0;

  return {
    stageId,
    capabilities,
    coverageScore,
    relevantCapabilityCount: stageCapabilities.filter(
      (c) => RELEVANCE_WEIGHTS[relevanceMap.get(c.id) ?? "useful"] > 0
    ).length,
    coveredCount,
    partialCount,
    missingCount,
    unknownCount,
  };
}

// ============================================================================
// STACK COVERAGE
// ============================================================================

/**
 * Calculate overall stack coverage
 */
export function calculateStackCoverage(
  stack: PracticeStack,
  metadataMap: ProductMetadataMap
): StackCoverageResult {
  // Get relevance for all capabilities
  const relevanceResults = getAllCapabilityRelevance(stack.fingerprint);
  const relevanceMap = new Map<CapabilityId, RelevanceLevel>();

  for (const [capId, result] of relevanceResults) {
    // Check for user override
    const override = getRelevanceOverride(stack, capId);
    relevanceMap.set(capId, override?.overrideLevel ?? result.level);
  }

  // Calculate per-stage coverage
  const stages: StageCoverage[] = [];
  const orderedStages = getOrderedStages();

  for (const stage of orderedStages) {
    stages.push(
      calculateStageCoverage(stage.id, stack, metadataMap, relevanceMap)
    );
  }

  // Collect gaps and data gaps
  const gaps: CapabilityCoverage[] = [];
  const dataGaps: CapabilityCoverage[] = [];

  for (const stage of stages) {
    for (const cap of stage.capabilities) {
      if (cap.isGap) gaps.push(cap);
      if (cap.isDataGap) dataGaps.push(cap);
    }
  }

  // Sort gaps by relevance
  const relevanceOrder: RelevanceLevel[] = [
    "required",
    "strongly-recommended",
    "useful",
    "optional",
    "irrelevant",
  ];

  gaps.sort((a, b) => {
    const aOrder = relevanceOrder.indexOf(a.relevance);
    const bOrder = relevanceOrder.indexOf(b.relevance);
    if (aOrder !== bOrder) return aOrder - bOrder;
    // Secondary sort: missing before partial
    if (a.status === "missing" && b.status !== "missing") return -1;
    if (a.status !== "missing" && b.status === "missing") return 1;
    return 0;
  });

  // Calculate overall score and confidence
  let totalWeight = 0;
  let knownWeight = 0;
  let weightedScore = 0;

  for (const stage of stages) {
    for (const cap of stage.capabilities) {
      const relevanceWeight = RELEVANCE_WEIGHTS[cap.relevance];
      if (relevanceWeight === 0) continue;

      totalWeight += relevanceWeight;
      if (cap.status !== "unknown") {
        knownWeight += relevanceWeight;
        weightedScore += relevanceWeight * cap.numericValue;
      }
    }
  }

  const overallScore =
    knownWeight > 0 ? Math.round((weightedScore / knownWeight) * 100) : 0;
  const overallConfidence =
    totalWeight > 0 ? Math.round((knownWeight / totalWeight) * 100) : 0;

  // Collect all capability coverage items
  const capabilityCoverage: CapabilityCoverage[] = stages.flatMap((s) => s.capabilities);

  return {
    stages,
    overallScore,
    overallConfidence,
    gaps,
    dataGaps,
    // Convenience accessors
    capabilityCoverage,
    knownCoveragePercent: overallScore,
    gapCapabilities: gaps.map((g) => g.capabilityId),
  };
}

/**
 * Get a summary of coverage for display
 */
export function getCoverageSummary(result: StackCoverageResult): {
  score: number;
  confidence: number;
  gapCount: number;
  dataGapCount: number;
  label: string;
} {
  let label: string;
  if (result.overallConfidence < 50) {
    label = "Limited data";
  } else if (result.overallScore >= 80) {
    label = "Strong coverage";
  } else if (result.overallScore >= 60) {
    label = "Good coverage";
  } else if (result.overallScore >= 40) {
    label = "Partial coverage";
  } else {
    label = "Significant gaps";
  }

  return {
    score: result.overallScore,
    confidence: result.overallConfidence,
    gapCount: result.gaps.length,
    dataGapCount: result.dataGaps.length,
    label,
  };
}

/**
 * Get capabilities covered by a specific product
 */
export function getProductCoverage(
  productSlug: string,
  metadataMap: ProductMetadataMap
): CapabilityId[] {
  const metadata = metadataMap.get(productSlug);
  if (!metadata) return [];

  return metadata.capabilities.map((c) => c.capabilityId);
}

/**
 * Get products that cover a specific capability
 */
export function getProductsForCapability(
  capabilityId: CapabilityId,
  metadataMap: ProductMetadataMap
): Array<{ slug: string; strength: string }> {
  const result: Array<{ slug: string; strength: string }> = [];

  for (const [slug, metadata] of metadataMap) {
    const cap = metadata.capabilities.find((c) => c.capabilityId === capabilityId);
    if (cap) {
      result.push({ slug, strength: cap.strength });
    }
  }

  // Sort by strength (core first)
  const strengthOrder = ["core", "strong", "partial", "addon", "integration-only"];
  result.sort(
    (a, b) => strengthOrder.indexOf(a.strength) - strengthOrder.indexOf(b.strength)
  );

  return result;
}

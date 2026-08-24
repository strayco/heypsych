/**
 * Compatibility Engine
 *
 * Analyzes compatibility between products in the stack.
 * Only sourced incompatibility produces "incompatible" - unknown is not incompatible.
 */

import {
  type PracticeStack,
  type ProductArchitectureMetadata,
  type CompatibilityAssessment,
  type CompatibilityStatus,
  type ProvenanceStatus,
} from "../schemas";

export type ProductMetadataMap = Map<string, ProductArchitectureMetadata>;

// ============================================================================
// COMPATIBILITY ANALYSIS
// ============================================================================

/**
 * Analyze compatibility between two products
 */
function analyzeProductPair(
  sourceSlug: string,
  targetSlug: string,
  metadataMap: ProductMetadataMap
): CompatibilityAssessment {
  const sourceMetadata = metadataMap.get(sourceSlug);
  const targetMetadata = metadataMap.get(targetSlug);

  // Check source's integrations for target
  const sourceIntegration = sourceMetadata?.integrations.find(
    (i) => i.targetSlug === targetSlug || i.sourceSlug === targetSlug
  );

  // Check target's integrations for source
  const targetIntegration = targetMetadata?.integrations.find(
    (i) => i.sourceSlug === sourceSlug || i.targetSlug === sourceSlug
  );

  // Use the most specific integration found
  const integration = sourceIntegration ?? targetIntegration;

  if (!integration) {
    // No integration data - status is unknown
    return {
      sourceSlug,
      targetSlug,
      productA: sourceSlug,
      productB: targetSlug,
      status: "unknown",
      provenance: "unknown",
    };
  }

  // Determine compatibility status from integration type
  let status: CompatibilityStatus;
  switch (integration.type) {
    case "incompatible":
      status = "incompatible";
      break;
    case "native":
    case "api":
      status = "compatible";
      break;
    case "third-party":
    case "browser-extension":
    case "import-export":
      status = "compatible"; // Works, but via indirect means
      break;
    case "manual":
      status = "concern"; // Requires manual work
      break;
    case "unknown":
    default:
      status = "unknown";
  }

  return {
    sourceSlug,
    targetSlug,
    productA: sourceSlug,
    productB: targetSlug,
    status,
    integrationType: integration.type,
    direction: integration.direction,
    notes: integration.notes,
    provenance: integration.provenance,
    lastVerified: integration.lastVerified,
  };
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

/**
 * Analyze compatibility for all product pairs in the stack
 */
export function analyzeCompatibility(
  stack: PracticeStack,
  metadataMap: ProductMetadataMap
): CompatibilityAssessment[] {
  const assessments: CompatibilityAssessment[] = [];
  const realProducts = stack.selectedProducts.filter((p) => !p.isDemo);

  // Analyze each unique pair
  for (let i = 0; i < realProducts.length; i++) {
    for (let j = i + 1; j < realProducts.length; j++) {
      const sourceSlug = realProducts[i].slug;
      const targetSlug = realProducts[j].slug;

      const assessment = analyzeProductPair(sourceSlug, targetSlug, metadataMap);
      assessments.push(assessment);
    }
  }

  // Sort by status severity
  const statusOrder: CompatibilityStatus[] = [
    "incompatible",
    "concern",
    "unknown",
    "compatible",
  ];

  assessments.sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  return assessments;
}

/**
 * Get compatibility concerns (incompatible or concern status)
 */
export function getCompatibilityConcerns(
  assessments: CompatibilityAssessment[]
): CompatibilityAssessment[] {
  return assessments.filter(
    (a) => a.status === "incompatible" || a.status === "concern"
  );
}

/**
 * Get compatibility for a specific product with rest of stack
 */
export function getProductCompatibility(
  productSlug: string,
  assessments: CompatibilityAssessment[]
): CompatibilityAssessment[] {
  return assessments.filter(
    (a) => a.sourceSlug === productSlug || a.targetSlug === productSlug
  );
}

/**
 * Check if adding a product would create incompatibilities
 */
export function checkAddProductCompatibility(
  newProductSlug: string,
  stack: PracticeStack,
  metadataMap: ProductMetadataMap
): {
  canAdd: boolean;
  incompatibilities: CompatibilityAssessment[];
  concerns: CompatibilityAssessment[];
} {
  const incompatibilities: CompatibilityAssessment[] = [];
  const concerns: CompatibilityAssessment[] = [];

  for (const existing of stack.selectedProducts) {
    if (existing.isDemo) continue;

    const assessment = analyzeProductPair(
      newProductSlug,
      existing.slug,
      metadataMap
    );

    if (assessment.status === "incompatible") {
      incompatibilities.push(assessment);
    } else if (assessment.status === "concern") {
      concerns.push(assessment);
    }
  }

  return {
    canAdd: incompatibilities.length === 0,
    incompatibilities,
    concerns,
  };
}

/**
 * Calculate overall compatibility score for the stack
 */
export function calculateCompatibilityScore(
  assessments: CompatibilityAssessment[]
): { score: number | null; hasData: boolean } {
  if (assessments.length === 0) {
    // No pairs to assess (0 or 1 products)
    return { score: null, hasData: false };
  }

  // Calculate score based on known statuses
  const knownAssessments = assessments.filter((a) => a.status !== "unknown");

  if (knownAssessments.length === 0) {
    return { score: null, hasData: false };
  }

  // Score: compatible=100, concern=50, incompatible=0
  const statusScores: Record<CompatibilityStatus, number> = {
    compatible: 100,
    concern: 50,
    incompatible: 0,
    unknown: 0, // Not included in calculation
  };

  const totalScore = knownAssessments.reduce(
    (sum, a) => sum + statusScores[a.status],
    0
  );

  return {
    score: Math.round(totalScore / knownAssessments.length),
    hasData: true,
  };
}

/**
 * Get integration summary for display
 */
export function getIntegrationSummary(
  assessments: CompatibilityAssessment[]
): {
  nativeCount: number;
  apiCount: number;
  thirdPartyCount: number;
  unknownCount: number;
  concernCount: number;
  incompatibleCount: number;
} {
  let nativeCount = 0;
  let apiCount = 0;
  let thirdPartyCount = 0;
  let unknownCount = 0;
  let concernCount = 0;
  let incompatibleCount = 0;

  for (const assessment of assessments) {
    switch (assessment.status) {
      case "incompatible":
        incompatibleCount++;
        break;
      case "concern":
        concernCount++;
        break;
      case "unknown":
        unknownCount++;
        break;
      case "compatible":
        switch (assessment.integrationType) {
          case "native":
            nativeCount++;
            break;
          case "api":
            apiCount++;
            break;
          default:
            thirdPartyCount++;
        }
        break;
    }
  }

  return {
    nativeCount,
    apiCount,
    thirdPartyCount,
    unknownCount,
    concernCount,
    incompatibleCount,
  };
}

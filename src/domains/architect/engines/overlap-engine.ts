/**
 * Overlap Engine
 *
 * Analyzes feature overlap between products in the stack.
 * Classifies overlaps into 4 categories:
 * - complementary: Products share minor capabilities but provide different core value
 * - intentional-overlap: Shared capability provides workflow choice or specialization
 * - possible-redundancy: Products cover similar capabilities but each has meaningful unique value
 * - probable-redundancy: Core capabilities overlap substantially with limited unique coverage
 */

import {
  type PracticeStack,
  type ProductArchitectureMetadata,
  type CapabilityId,
  type CapabilityStrength,
  type OverlapAssessment,
  type OverlapClassification,
  type ProductPairOverlap,
  type ProvenanceStatus,
  type RelevanceLevel,
  CAPABILITY_REGISTRY,
  isStrongCoverage,
} from "../schemas";
import { getCapabilityRelevance, type RelevanceResult } from "./relevance-engine";

export type ProductMetadataMap = Map<string, ProductArchitectureMetadata>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all capabilities covered by a product at core/strong level
 */
function getProductCapabilities(
  metadata: ProductArchitectureMetadata | undefined
): Map<CapabilityId, { strength: CapabilityStrength; isCore: boolean }> {
  const caps = new Map<CapabilityId, { strength: CapabilityStrength; isCore: boolean }>();

  if (!metadata) return caps;

  for (const cap of metadata.capabilities) {
    // Only consider meaningful coverage (not integration-only)
    if (cap.strength !== "integration-only") {
      caps.set(cap.capabilityId, {
        strength: cap.strength,
        isCore: cap.strength === "core",
      });
    }
  }

  return caps;
}

/**
 * Filter capabilities to only those relevant to the practice
 */
function filterRelevantCapabilities(
  capabilities: Map<CapabilityId, { strength: CapabilityStrength; isCore: boolean }>,
  relevanceMap: Map<CapabilityId, RelevanceLevel>
): Map<CapabilityId, { strength: CapabilityStrength; isCore: boolean; relevance: RelevanceLevel }> {
  const relevant = new Map<CapabilityId, { strength: CapabilityStrength; isCore: boolean; relevance: RelevanceLevel }>();

  for (const [capId, data] of capabilities) {
    const relevance = relevanceMap.get(capId);
    // Include required, strongly-recommended, and useful capabilities
    if (relevance && relevance !== "optional" && relevance !== "irrelevant") {
      relevant.set(capId, { ...data, relevance });
    }
  }

  return relevant;
}

/**
 * Calculate capability relevance map from fingerprint
 */
function getRelevanceMap(stack: PracticeStack): Map<CapabilityId, RelevanceLevel> {
  const relevanceMap = new Map<CapabilityId, RelevanceLevel>();

  for (const capId of Object.keys(CAPABILITY_REGISTRY) as CapabilityId[]) {
    // Check for user overrides first
    const override = stack.relevanceOverrides.find((o) => o.capabilityId === capId);
    if (override) {
      relevanceMap.set(capId, override.overrideLevel);
    } else {
      const result = getCapabilityRelevance(capId, stack.fingerprint);
      relevanceMap.set(capId, result.level);
    }
  }

  return relevanceMap;
}

// ============================================================================
// CAPABILITY PATTERNS
// ============================================================================

/**
 * Capabilities where overlap is typically intentional/useful
 */
const INTENTIONAL_OVERLAP_CAPABILITIES: Set<CapabilityId> = new Set([
  "ai-documentation-scribe", // AI scribes complement EHR documentation
  "assessments-mbc", // Specialized MBC tools add value to basic assessments
  "telehealth", // Dedicated telehealth can complement basic video
  "secure-messaging", // Multiple messaging paths are common
  "patient-portal", // Portal features often overlap legitimately
  "appointment-reminders", // Multiple reminder systems are common
  "forms-e-signature", // Forms often overlap between systems
]);

/**
 * Known complementary product category pairs
 * These product types are designed to work together
 */
const COMPLEMENTARY_PAIRS: Array<{ categoryA: string; categoryB: string }> = [
  { categoryA: "ehr", categoryB: "ai-scribe" },
  { categoryA: "ehr", categoryB: "telehealth" },
  { categoryA: "ehr", categoryB: "billing-rcm" },
  { categoryA: "practice-management", categoryB: "ai-scribe" },
  { categoryA: "practice-management", categoryB: "telehealth" },
  { categoryA: "billing", categoryB: "clearinghouse" },
  { categoryA: "billing", categoryB: "credentialing" },
];

// ============================================================================
// OVERLAP CLASSIFICATION
// ============================================================================

/**
 * Classify overlap between two products
 */
function classifyProductPairOverlap(
  sharedCapabilities: Array<{
    capabilityId: CapabilityId;
    productAStrength: CapabilityStrength;
    productBStrength: CapabilityStrength;
    isCoreForA: boolean;
    isCoreForB: boolean;
  }>,
  uniqueToA: Array<{ capabilityId: CapabilityId; strength: CapabilityStrength; isCore: boolean }>,
  uniqueToB: Array<{ capabilityId: CapabilityId; strength: CapabilityStrength; isCore: boolean }>,
  metadataA: ProductArchitectureMetadata | undefined,
  metadataB: ProductArchitectureMetadata | undefined
): { classification: OverlapClassification; explanation: string } {
  const sharedCount = sharedCapabilities.length;
  const uniqueACount = uniqueToA.length;
  const uniqueBCount = uniqueToB.length;

  // Count core overlaps (both products have this as core)
  const coreOverlapCount = sharedCapabilities.filter(
    (c) => c.isCoreForA && c.isCoreForB
  ).length;

  // Count how many shared caps are intentional overlap types
  const intentionalOverlapCount = sharedCapabilities.filter((c) =>
    INTENTIONAL_OVERLAP_CAPABILITIES.has(c.capabilityId)
  ).length;

  // Get capability names for explanation
  const sharedCapNames = sharedCapabilities
    .slice(0, 3)
    .map((c) => CAPABILITY_REGISTRY[c.capabilityId]?.name || c.capabilityId)
    .join(", ");

  // Classification logic

  // 1. COMPLEMENTARY: Minimal shared capabilities relative to unique
  // Products serve different primary purposes
  if (sharedCount <= 2 && (uniqueACount >= 3 || uniqueBCount >= 3)) {
    return {
      classification: "complementary",
      explanation: `Products share ${sharedCount} minor ${sharedCount === 1 ? "capability" : "capabilities"} (${sharedCapNames}) but serve different primary purposes`,
    };
  }

  // 2. INTENTIONAL OVERLAP: Most shared capabilities are known intentional patterns
  if (intentionalOverlapCount >= sharedCount * 0.6 && sharedCount <= 5) {
    return {
      classification: "intentional-overlap",
      explanation: `Overlap in ${sharedCapNames} is common and often provides workflow flexibility or specialized features`,
    };
  }

  // 3. PROBABLE REDUNDANCY: Many core overlaps AND one product has little unique value
  if (coreOverlapCount >= 2) {
    // Check if either product has minimal unique coverage
    const aHasMinimalUnique = uniqueACount <= 1;
    const bHasMinimalUnique = uniqueBCount <= 1;

    if (aHasMinimalUnique || bHasMinimalUnique) {
      const redundantProduct = aHasMinimalUnique ? "first" : "second";
      return {
        classification: "probable-redundancy",
        explanation: `${coreOverlapCount} core capabilities overlap (${sharedCapNames}), and the ${redundantProduct} product provides limited additional coverage`,
      };
    }
  }

  // 4. POSSIBLE REDUNDANCY: Significant overlap but both products have unique value
  if (sharedCount >= 3 || coreOverlapCount >= 1) {
    return {
      classification: "possible-redundancy",
      explanation: `${sharedCount} shared capabilities (${sharedCapNames}), but each product provides unique value (${uniqueACount} vs ${uniqueBCount} unique capabilities)`,
    };
  }

  // 5. Default to COMPLEMENTARY for minor overlaps
  return {
    classification: "complementary",
    explanation: `Limited overlap in ${sharedCapNames}; products serve complementary purposes`,
  };
}

// ============================================================================
// LEGACY CAPABILITY-LEVEL ANALYSIS (for backwards compatibility)
// ============================================================================

/**
 * Find capabilities where two or more products have meaningful coverage
 */
function findOverlapCandidates(
  stack: PracticeStack,
  metadataMap: ProductMetadataMap
): Map<CapabilityId, Array<{ slug: string; strength: CapabilityStrength }>> {
  const capabilityProducts = new Map<CapabilityId, Array<{ slug: string; strength: CapabilityStrength }>>();

  for (const selected of stack.selectedProducts) {
    // Skip demo products only when NOT in demo mode
    if (!stack.isDemoMode && selected.isDemo) continue;

    const metadata = metadataMap.get(selected.slug);
    if (!metadata) continue;

    for (const cap of metadata.capabilities) {
      if (isStrongCoverage(cap)) {
        const existing = capabilityProducts.get(cap.capabilityId) ?? [];
        existing.push({ slug: selected.slug, strength: cap.strength });
        capabilityProducts.set(cap.capabilityId, existing);
      }
    }
  }

  // Filter to only capabilities with 2+ products
  const overlaps = new Map<CapabilityId, Array<{ slug: string; strength: CapabilityStrength }>>();
  for (const [capId, products] of capabilityProducts) {
    if (products.length >= 2) {
      overlaps.set(capId, products);
    }
  }

  return overlaps;
}

/**
 * Check if products have documented differentiators for a capability
 */
function getCapabilityDifferentiators(
  capabilityId: CapabilityId,
  products: Array<{ slug: string; strength: CapabilityStrength }>,
  metadataMap: ProductMetadataMap
): Map<string, string[]> {
  const differentiators = new Map<string, string[]>();

  for (const product of products) {
    const metadata = metadataMap.get(product.slug);
    if (!metadata) continue;

    const cap = metadata.capabilities.find((c) => c.capabilityId === capabilityId);
    if (!cap) continue;

    const notes = cap.notes;
    const limitations = cap.limitation;

    if (notes || limitations) {
      differentiators.set(product.slug, [notes, limitations].filter(Boolean) as string[]);
    }
  }

  return differentiators;
}

/**
 * Classify overlap for a single capability (legacy format)
 */
function classifyCapabilityOverlap(
  capabilityId: CapabilityId,
  products: Array<{ slug: string; strength: CapabilityStrength }>,
  metadataMap: ProductMetadataMap
): { classification: OverlapClassification; explanation: string } {
  const capDef = CAPABILITY_REGISTRY[capabilityId];

  // Check for known intentional overlap patterns
  if (INTENTIONAL_OVERLAP_CAPABILITIES.has(capabilityId)) {
    return {
      classification: "intentional-overlap",
      explanation: `${capDef.name} tools often provide complementary specialized features`,
    };
  }

  // Check for documented differentiators
  const differentiators = getCapabilityDifferentiators(capabilityId, products, metadataMap);
  if (differentiators.size > 0) {
    return {
      classification: "intentional-overlap",
      explanation: `Products have documented specialized features for ${capDef.name.toLowerCase()}`,
    };
  }

  // Check strength levels - if both are core, more likely redundant
  const coreCount = products.filter((p) => p.strength === "core").length;

  if (coreCount >= 2) {
    return {
      classification: "probable-redundancy",
      explanation: `Multiple products have ${capDef.name.toLowerCase()} as a core feature`,
    };
  }

  if (coreCount === 1) {
    return {
      classification: "possible-redundancy",
      explanation: `One product specializes in ${capDef.name.toLowerCase()} while others include it as secondary`,
    };
  }

  // Default to complementary for partial/addon overlap
  return {
    classification: "complementary",
    explanation: `Overlap in ${capDef.name.toLowerCase()} appears incidental to different product purposes`,
  };
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

/**
 * Analyze all capability-level overlaps in the stack (legacy format)
 */
export function analyzeOverlaps(
  stack: PracticeStack,
  metadataMap: ProductMetadataMap
): OverlapAssessment[] {
  const candidates = findOverlapCandidates(stack, metadataMap);
  const assessments: OverlapAssessment[] = [];

  for (const [capabilityId, products] of candidates) {
    const { classification, explanation } = classifyCapabilityOverlap(
      capabilityId,
      products,
      metadataMap
    );

    const differentiators = getCapabilityDifferentiators(capabilityId, products, metadataMap);

    const productDetails = products.map((p) => ({
      slug: p.slug,
      strength: p.strength,
      differentiators: differentiators.get(p.slug),
    }));

    // Determine provenance
    let provenance: ProvenanceStatus = "unknown";
    for (const product of products) {
      const metadata = metadataMap.get(product.slug);
      if (metadata?.capabilityMapStatus === "reviewed-complete") {
        provenance = "verified";
        break;
      }
    }

    assessments.push({
      capabilityId,
      products: productDetails,
      productA: productDetails[0]?.slug ?? "",
      productB: productDetails[1]?.slug ?? "",
      classification,
      explanation,
      provenance,
    });
  }

  // Sort by classification severity
  const classificationOrder: OverlapClassification[] = [
    "probable-redundancy",
    "possible-redundancy",
    "intentional-overlap",
    "complementary",
  ];

  assessments.sort(
    (a, b) =>
      classificationOrder.indexOf(a.classification) -
      classificationOrder.indexOf(b.classification)
  );

  return assessments;
}

/**
 * Analyze overlap between all product pairs (enhanced format)
 */
export function analyzeProductPairOverlaps(
  stack: PracticeStack,
  metadataMap: ProductMetadataMap,
  productCosts?: Map<string, { minMonthlyCents: number | null; maxMonthlyCents: number | null }>
): ProductPairOverlap[] {
  // Include demo products when in demo mode
  const products = stack.isDemoMode
    ? stack.selectedProducts
    : stack.selectedProducts.filter((p) => !p.isDemo);

  if (products.length < 2) {
    return [];
  }

  const relevanceMap = getRelevanceMap(stack);
  const overlaps: ProductPairOverlap[] = [];

  // Compare each pair of products
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const slugA = products[i].slug;
      const slugB = products[j].slug;

      const metadataA = metadataMap.get(slugA);
      const metadataB = metadataMap.get(slugB);

      // Get capabilities for each product
      const capsA = filterRelevantCapabilities(
        getProductCapabilities(metadataA),
        relevanceMap
      );
      const capsB = filterRelevantCapabilities(
        getProductCapabilities(metadataB),
        relevanceMap
      );

      // Find shared and unique capabilities
      const sharedCapabilities: ProductPairOverlap["sharedCapabilities"] = [];
      const uniqueToA: ProductPairOverlap["uniqueToA"] = [];
      const uniqueToB: ProductPairOverlap["uniqueToB"] = [];

      // Check A's capabilities
      for (const [capId, dataA] of capsA) {
        const capDef = CAPABILITY_REGISTRY[capId];
        if (capsB.has(capId)) {
          const dataB = capsB.get(capId)!;
          sharedCapabilities.push({
            capabilityId: capId,
            capabilityName: capDef?.name || capId,
            productAStrength: dataA.strength,
            productBStrength: dataB.strength,
            isCoreForA: dataA.isCore,
            isCoreForB: dataB.isCore,
          });
        } else {
          uniqueToA.push({
            capabilityId: capId,
            capabilityName: capDef?.name || capId,
            strength: dataA.strength,
            isCore: dataA.isCore,
          });
        }
      }

      // Check B's unique capabilities
      for (const [capId, dataB] of capsB) {
        if (!capsA.has(capId)) {
          const capDef = CAPABILITY_REGISTRY[capId];
          uniqueToB.push({
            capabilityId: capId,
            capabilityName: capDef?.name || capId,
            strength: dataB.strength,
            isCore: dataB.isCore,
          });
        }
      }

      // Skip pairs with no overlap
      if (sharedCapabilities.length === 0) {
        continue;
      }

      // Classify the overlap
      const { classification, explanation } = classifyProductPairOverlap(
        sharedCapabilities,
        uniqueToA,
        uniqueToB,
        metadataA,
        metadataB
      );

      // Calculate potential savings
      let potentialMonthlySavingsACents: number | null = null;
      let potentialMonthlySavingsBCents: number | null = null;

      if (productCosts) {
        const costA = productCosts.get(slugA);
        const costB = productCosts.get(slugB);

        if (costA && costA.minMonthlyCents !== null) {
          potentialMonthlySavingsACents = costA.minMonthlyCents;
        }
        if (costB && costB.minMonthlyCents !== null) {
          potentialMonthlySavingsBCents = costB.minMonthlyCents;
        }
      }

      // Determine data confidence
      let confidenceLevel: "high" | "medium" | "low" = "low";
      const statusA = metadataA?.capabilityMapStatus;
      const statusB = metadataB?.capabilityMapStatus;

      if (statusA === "reviewed-complete" && statusB === "reviewed-complete") {
        confidenceLevel = "high";
      } else if (
        (statusA === "reviewed-complete" || statusA === "reviewed-partial") &&
        (statusB === "reviewed-complete" || statusB === "reviewed-partial")
      ) {
        confidenceLevel = "medium";
      }

      overlaps.push({
        productASlug: slugA,
        productBSlug: slugB,
        classification,
        explanation,
        sharedCapabilities,
        uniqueToA,
        uniqueToB,
        potentialMonthlySavingsACents,
        potentialMonthlySavingsBCents,
        provenance: confidenceLevel === "high" ? "verified" : "unverified",
        confidenceLevel,
      });
    }
  }

  // Sort by classification severity
  const classificationOrder: OverlapClassification[] = [
    "probable-redundancy",
    "possible-redundancy",
    "intentional-overlap",
    "complementary",
  ];

  overlaps.sort(
    (a, b) =>
      classificationOrder.indexOf(a.classification) -
      classificationOrder.indexOf(b.classification)
  );

  return overlaps;
}

/**
 * Count overlaps by classification
 */
export function countOverlapsByClass(
  assessments: OverlapAssessment[]
): Record<OverlapClassification, number> {
  const counts: Record<OverlapClassification, number> = {
    "complementary": 0,
    "intentional-overlap": 0,
    "possible-redundancy": 0,
    "probable-redundancy": 0,
  };

  for (const assessment of assessments) {
    counts[assessment.classification]++;
  }

  return counts;
}

/**
 * Get overlaps for a specific product
 */
export function getOverlapsForProduct(
  productSlug: string,
  assessments: OverlapAssessment[]
): OverlapAssessment[] {
  return assessments.filter((a) =>
    a.products.some((p) => p.slug === productSlug)
  );
}

/**
 * Get product pair overlaps involving a specific product
 */
export function getProductPairOverlapsForProduct(
  productSlug: string,
  overlaps: ProductPairOverlap[]
): ProductPairOverlap[] {
  return overlaps.filter(
    (o) => o.productASlug === productSlug || o.productBSlug === productSlug
  );
}

/**
 * Get overlaps for a specific capability
 */
export function getOverlapForCapability(
  capabilityId: CapabilityId,
  assessments: OverlapAssessment[]
): OverlapAssessment | undefined {
  return assessments.find((a) => a.capabilityId === capabilityId);
}

/**
 * Check if stack has any concerning redundancies
 */
export function hasRedundancyConcerns(
  assessments: OverlapAssessment[] | ProductPairOverlap[]
): boolean {
  return assessments.some(
    (a) =>
      a.classification === "probable-redundancy" ||
      a.classification === "possible-redundancy"
  );
}

/**
 * Get summary of overlap situation
 */
export function getOverlapSummary(
  assessments: OverlapAssessment[]
): {
  hasRedundancy: boolean;
  probableRedundancyCount: number;
  possibleRedundancyCount: number;
  totalOverlapCount: number;
  summary: string;
} {
  const counts = countOverlapsByClass(assessments);

  const probableRedundancyCount = counts["probable-redundancy"];
  const possibleRedundancyCount = counts["possible-redundancy"];
  const totalOverlapCount = assessments.length;

  let summary: string;

  if (probableRedundancyCount > 0) {
    summary = `${probableRedundancyCount} probable redundanc${probableRedundancyCount === 1 ? "y" : "ies"} detected`;
  } else if (possibleRedundancyCount > 0) {
    summary = `${possibleRedundancyCount} possible redundanc${possibleRedundancyCount === 1 ? "y" : "ies"} to review`;
  } else if (totalOverlapCount > 0) {
    summary = `${totalOverlapCount} intentional or complementary overlap${totalOverlapCount === 1 ? "" : "s"}`;
  } else {
    summary = "No significant overlap detected";
  }

  return {
    hasRedundancy: probableRedundancyCount > 0 || possibleRedundancyCount > 0,
    probableRedundancyCount,
    possibleRedundancyCount,
    totalOverlapCount,
    summary,
  };
}

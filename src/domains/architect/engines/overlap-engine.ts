/**
 * Overlap Engine
 *
 * Analyzes overlap between products in the stack.
 * Classifies overlap as useful specialization, benign, or probable redundancy.
 */

import {
  type PracticeStack,
  type ProductArchitectureMetadata,
  type CapabilityId,
  type OverlapAssessment,
  type OverlapClassification,
  type ProvenanceStatus,
  CAPABILITY_REGISTRY,
  isStrongCoverage,
} from "../schemas";

export type ProductMetadataMap = Map<string, ProductArchitectureMetadata>;

// ============================================================================
// OVERLAP DETECTION
// ============================================================================

/**
 * Find capabilities where two or more products have core/strong coverage
 */
function findOverlapCandidates(
  stack: PracticeStack,
  metadataMap: ProductMetadataMap
): Map<CapabilityId, Array<{ slug: string; strength: string }>> {
  const capabilityProducts = new Map<CapabilityId, Array<{ slug: string; strength: string }>>();

  for (const selected of stack.selectedProducts) {
    if (selected.isDemo) continue;

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
  const overlaps = new Map<CapabilityId, Array<{ slug: string; strength: string }>>();
  for (const [capId, products] of capabilityProducts) {
    if (products.length >= 2) {
      overlaps.set(capId, products);
    }
  }

  return overlaps;
}

// ============================================================================
// OVERLAP CLASSIFICATION
// ============================================================================

/**
 * Capabilities where overlap is typically useful specialization
 */
const SPECIALIZATION_CAPABILITIES: Set<CapabilityId> = new Set([
  "ai-documentation-scribe", // AI scribes often complement EHR documentation
  "assessments-mbc", // Specialized MBC tools add value
  "telehealth", // Dedicated telehealth can complement basic video
]);

/**
 * Capabilities where overlap is typically benign
 */
const BENIGN_OVERLAP_CAPABILITIES: Set<CapabilityId> = new Set([
  "secure-messaging", // Common to have multiple messaging paths
  "patient-portal", // Portal features often overlap
  "appointment-reminders", // Multiple reminder systems are common
  "forms-e-signature", // Forms often overlap
]);

/**
 * Check if products have sourced differentiators for a capability
 */
function hasSourcedException(
  capabilityId: CapabilityId,
  products: Array<{ slug: string; strength: string }>,
  metadataMap: ProductMetadataMap
): { hasDifferentiator: boolean; differentiators: Map<string, string[]> } {
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

  return {
    hasDifferentiator: differentiators.size > 0,
    differentiators,
  };
}

/**
 * Classify overlap for a capability
 */
function classifyOverlap(
  capabilityId: CapabilityId,
  products: Array<{ slug: string; strength: string }>,
  metadataMap: ProductMetadataMap
): { classification: OverlapClassification; explanation: string } {
  const capDef = CAPABILITY_REGISTRY[capabilityId];

  // Check for known specialization patterns
  if (SPECIALIZATION_CAPABILITIES.has(capabilityId)) {
    return {
      classification: "useful-specialization",
      explanation: `${capDef.name} tools often provide complementary specialized features`,
    };
  }

  // Check for known benign patterns
  if (BENIGN_OVERLAP_CAPABILITIES.has(capabilityId)) {
    return {
      classification: "benign-overlap",
      explanation: `Overlapping ${capDef.name.toLowerCase()} is common and usually harmless`,
    };
  }

  // Check for sourced differentiators
  const { hasDifferentiator, differentiators } = hasSourcedException(
    capabilityId,
    products,
    metadataMap
  );

  if (hasDifferentiator) {
    const productNames = Array.from(differentiators.keys()).join(" and ");
    return {
      classification: "useful-specialization",
      explanation: `${productNames} have documented specialized features for ${capDef.name.toLowerCase()}`,
    };
  }

  // Check if products are in different "product categories"
  // (e.g., EHR vs standalone billing vs AI scribe)
  const productCategories = new Set<string>();
  for (const product of products) {
    const metadata = metadataMap.get(product.slug);
    if (metadata?.fitEvidence?.practiceTypes) {
      // Use practice types as a rough proxy for product category
      productCategories.add(product.slug.split("-")[0]); // Rough heuristic
    }
  }

  if (productCategories.size === products.length) {
    // Each product seems to be a different type
    return {
      classification: "benign-overlap",
      explanation: `Different product types both cover ${capDef.name.toLowerCase()}`,
    };
  }

  // Default to probable redundancy
  return {
    classification: "probable-redundancy",
    explanation: `Multiple products provide similar ${capDef.name.toLowerCase()} features`,
  };
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

/**
 * Analyze all overlaps in the stack
 */
export function analyzeOverlaps(
  stack: PracticeStack,
  metadataMap: ProductMetadataMap
): OverlapAssessment[] {
  const candidates = findOverlapCandidates(stack, metadataMap);
  const assessments: OverlapAssessment[] = [];

  for (const [capabilityId, products] of candidates) {
    const { classification, explanation } = classifyOverlap(
      capabilityId,
      products,
      metadataMap
    );

    // Get differentiators for each product
    const { differentiators } = hasSourcedException(capabilityId, products, metadataMap);

    const productDetails = products.map((p) => ({
      slug: p.slug,
      strength: p.strength as "core" | "strong" | "partial" | "addon" | "integration-only",
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
      // Convenience aliases (use first two products, or empty strings if fewer)
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
    "benign-overlap",
    "useful-specialization",
  ];

  assessments.sort(
    (a, b) =>
      classificationOrder.indexOf(a.classification) -
      classificationOrder.indexOf(b.classification)
  );

  return assessments;
}

/**
 * Count overlaps by classification
 */
export function countOverlapsByClass(
  assessments: OverlapAssessment[]
): Record<OverlapClassification, number> {
  const counts: Record<OverlapClassification, number> = {
    "useful-specialization": 0,
    "benign-overlap": 0,
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
 * Get overlaps for a specific capability
 */
export function getOverlapForCapability(
  capabilityId: CapabilityId,
  assessments: OverlapAssessment[]
): OverlapAssessment | undefined {
  return assessments.find((a) => a.capabilityId === capabilityId);
}

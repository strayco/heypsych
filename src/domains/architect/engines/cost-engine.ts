/**
 * Cost Engine
 *
 * Calculates estimated costs for the practice stack.
 * Never fabricates prices - unknown stays unknown.
 */

import {
  type PracticeFingerprint,
  type PracticeStack,
  type ProductArchitectureMetadata,
  type CostEstimate,
  getEffectiveProviderCount,
} from "../schemas";

export type ProductMetadataMap = Map<string, ProductArchitectureMetadata>;

// ============================================================================
// INDIVIDUAL PRODUCT COST
// ============================================================================

type ProductCostResult = {
  slug: string;
  minMonthlyCents: number | null;
  maxMonthlyCents: number | null;
  basis: string;
  isEstimate: boolean;
  requiresQuote: boolean;
  notes?: string;
};

/**
 * Calculate cost for a single product
 */
function calculateProductCost(
  productSlug: string,
  metadata: ProductArchitectureMetadata | undefined,
  fingerprint: PracticeFingerprint
): ProductCostResult {
  if (!metadata?.pricing) {
    return {
      slug: productSlug,
      minMonthlyCents: null,
      maxMonthlyCents: null,
      basis: "unknown",
      isEstimate: false,
      requiresQuote: false,
    };
  }

  const pricing = metadata.pricing;

  // Handle custom quote
  if (pricing.requiresQuote || pricing.basis === "custom-quote") {
    return {
      slug: productSlug,
      minMonthlyCents: null,
      maxMonthlyCents: null,
      basis: "custom-quote",
      isEstimate: false,
      requiresQuote: true,
      notes: pricing.notes,
    };
  }

  // Handle free products
  if (pricing.basis === "free") {
    return {
      slug: productSlug,
      minMonthlyCents: 0,
      maxMonthlyCents: 0,
      basis: "free",
      isEstimate: false,
      requiresQuote: false,
    };
  }

  // Handle freemium
  if (pricing.basis === "freemium" && pricing.freeTierAvailable) {
    return {
      slug: productSlug,
      minMonthlyCents: 0,
      maxMonthlyCents: pricing.maxPriceCents ?? null,
      basis: "freemium",
      isEstimate: true,
      requiresQuote: false,
      notes: "Free tier available; paid features additional",
    };
  }

  // Get provider count for per-provider pricing
  const providerCount = getEffectiveProviderCount(fingerprint);

  let minMonthlyCents: number | null = null;
  let maxMonthlyCents: number | null = null;
  let basis: string = pricing.basis;
  let isEstimate = false;
  const notes: string[] = [];

  switch (pricing.basis) {
    case "per-provider-month":
      if (providerCount !== undefined) {
        minMonthlyCents = (pricing.minPriceCents ?? 0) * providerCount;
        maxMonthlyCents = pricing.maxPriceCents
          ? pricing.maxPriceCents * providerCount
          : minMonthlyCents;
        isEstimate = fingerprint.exactProviderCount === undefined;
        if (isEstimate) {
          notes.push("Based on estimated provider count");
        }
      } else {
        notes.push("Requires provider count");
      }
      break;

    case "per-provider-year":
      if (providerCount !== undefined) {
        minMonthlyCents = Math.round(((pricing.minPriceCents ?? 0) * providerCount) / 12);
        maxMonthlyCents = pricing.maxPriceCents
          ? Math.round((pricing.maxPriceCents * providerCount) / 12)
          : minMonthlyCents;
        isEstimate = fingerprint.exactProviderCount === undefined;
        if (isEstimate) {
          notes.push("Based on estimated provider count");
        }
      } else {
        notes.push("Requires provider count");
      }
      break;

    case "flat-monthly":
      minMonthlyCents = pricing.minPriceCents ?? 0;
      maxMonthlyCents = pricing.maxPriceCents ?? minMonthlyCents;
      break;

    case "flat-annual":
      minMonthlyCents = Math.round((pricing.minPriceCents ?? 0) / 12);
      maxMonthlyCents = pricing.maxPriceCents
        ? Math.round(pricing.maxPriceCents / 12)
        : minMonthlyCents;
      break;

    case "per-practice-month":
      minMonthlyCents = pricing.minPriceCents ?? 0;
      maxMonthlyCents = pricing.maxPriceCents ?? minMonthlyCents;
      break;

    case "per-practice-year":
      minMonthlyCents = Math.round((pricing.minPriceCents ?? 0) / 12);
      maxMonthlyCents = pricing.maxPriceCents
        ? Math.round(pricing.maxPriceCents / 12)
        : minMonthlyCents;
      break;

    case "per-location-month":
      if (fingerprint.exactLocationCount !== undefined) {
        minMonthlyCents = (pricing.minPriceCents ?? 0) * fingerprint.exactLocationCount;
        maxMonthlyCents = pricing.maxPriceCents
          ? pricing.maxPriceCents * fingerprint.exactLocationCount
          : minMonthlyCents;
      } else {
        // Assume 1 location if not specified
        minMonthlyCents = pricing.minPriceCents ?? 0;
        maxMonthlyCents = pricing.maxPriceCents ?? minMonthlyCents;
        notes.push("Assuming 1 location");
        isEstimate = true;
      }
      break;

    case "per-encounter":
      if (fingerprint.monthlyEncounterVolume !== undefined) {
        minMonthlyCents = (pricing.minPriceCents ?? 0) * fingerprint.monthlyEncounterVolume;
        maxMonthlyCents = pricing.maxPriceCents
          ? pricing.maxPriceCents * fingerprint.monthlyEncounterVolume
          : minMonthlyCents;
      } else {
        notes.push("Requires encounter volume");
      }
      break;

    case "per-transaction":
      if (fingerprint.monthlyTransactionVolume !== undefined) {
        minMonthlyCents = (pricing.minPriceCents ?? 0) * fingerprint.monthlyTransactionVolume;
        maxMonthlyCents = pricing.maxPriceCents
          ? pricing.maxPriceCents * fingerprint.monthlyTransactionVolume
          : minMonthlyCents;
      } else {
        notes.push("Requires transaction volume");
      }
      break;

    case "percentage-collections":
      if (fingerprint.monthlyCollections !== undefined) {
        const minRate = (pricing.minPriceCents ?? 0) / 100; // Convert from basis points
        const maxRate = (pricing.maxPriceCents ?? minRate * 100) / 100;
        minMonthlyCents = Math.round(fingerprint.monthlyCollections * 100 * minRate);
        maxMonthlyCents = Math.round(fingerprint.monthlyCollections * 100 * maxRate);
        isEstimate = true;
        notes.push("Based on percentage of collections");
      } else {
        notes.push("Requires monthly collections");
      }
      break;

    default:
      basis = "unknown";
  }

  return {
    slug: productSlug,
    minMonthlyCents,
    maxMonthlyCents,
    basis,
    isEstimate,
    requiresQuote: false,
    notes: notes.length > 0 ? notes.join("; ") : pricing.notes,
  };
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

/**
 * Calculate total stack cost estimate
 */
export function calculateStackCost(
  stack: PracticeStack,
  metadataMap: ProductMetadataMap
): CostEstimate {
  const productCosts: ProductCostResult[] = [];
  const assumptions: string[] = [];

  let knownMinTotal = 0;
  let knownMaxTotal = 0;
  let hasKnownCosts = false;
  let unknownCount = 0;
  let customQuoteCount = 0;

  // Calculate cost for each product
  for (const selected of stack.selectedProducts) {
    if (selected.isDemo) continue;

    const metadata = metadataMap.get(selected.slug);
    const cost = calculateProductCost(selected.slug, metadata, stack.fingerprint);
    productCosts.push(cost);

    if (cost.requiresQuote) {
      customQuoteCount++;
    } else if (cost.minMonthlyCents === null) {
      unknownCount++;
    } else {
      hasKnownCosts = true;
      knownMinTotal += cost.minMonthlyCents;
      knownMaxTotal += cost.maxMonthlyCents ?? cost.minMonthlyCents;
    }

    if (cost.isEstimate && cost.notes) {
      assumptions.push(cost.notes);
    }
  }

  // Calculate per-clinician costs
  const providerCount = getEffectiveProviderCount(stack.fingerprint);
  let perClinicianMinMonthlyCents: number | null = null;
  let perClinicianMaxMonthlyCents: number | null = null;

  if (hasKnownCosts && providerCount !== undefined && providerCount > 0) {
    perClinicianMinMonthlyCents = Math.round(knownMinTotal / providerCount);
    perClinicianMaxMonthlyCents = Math.round(knownMaxTotal / providerCount);
  }

  return {
    knownMinMonthlyCents: hasKnownCosts ? knownMinTotal : null,
    knownMaxMonthlyCents: hasKnownCosts ? knownMaxTotal : null,
    knownMinAnnualCents: hasKnownCosts ? knownMinTotal * 12 : null,
    knownMaxAnnualCents: hasKnownCosts ? knownMaxTotal * 12 : null,
    perClinicianMinMonthlyCents,
    perClinicianMaxMonthlyCents,
    productCount: productCosts.length,
    knownPricingCount: productCosts.filter((p) => p.minMonthlyCents !== null).length,
    unknownPricingCount: unknownCount,
    customQuoteCount,
    assumptions: [...new Set(assumptions)], // Deduplicate
    productCosts,
  };
}

/**
 * Format cost for display
 */
export function formatCost(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(0)}`;
}

/**
 * Format cost range for display
 */
export function formatCostRange(
  minCents: number | null,
  maxCents: number | null,
  unknownCount: number,
  customQuoteCount: number
): string {
  const parts: string[] = [];

  if (minCents !== null && maxCents !== null) {
    if (minCents === maxCents) {
      parts.push(formatCost(minCents));
    } else {
      parts.push(`${formatCost(minCents)}-${formatCost(maxCents)}`);
    }
  }

  if (customQuoteCount > 0) {
    parts.push(`+${customQuoteCount} custom quote${customQuoteCount > 1 ? "s" : ""}`);
  }

  // Unknown count shown separately below with better context (e.g., "1 product with usage-based pricing")
  // If no known costs, show clearer message
  if (parts.length === 0) {
    return unknownCount > 0 ? "Varies by usage" : "Unknown";
  }

  return parts.join(" ");
}

/**
 * Check if cost is within budget
 */
export function checkBudget(
  estimate: CostEstimate,
  monthlyBudget: number | undefined
): {
  isWithinBudget: boolean | null;
  percentOfBudget: number | null;
  message: string;
} {
  if (!monthlyBudget) {
    return {
      isWithinBudget: null,
      percentOfBudget: null,
      message: "No budget specified",
    };
  }

  if (estimate.knownMaxMonthlyCents === null) {
    return {
      isWithinBudget: null,
      percentOfBudget: null,
      message: "Unable to estimate total cost",
    };
  }

  const budgetCents = monthlyBudget * 100;
  const percentOfBudget = Math.round((estimate.knownMaxMonthlyCents / budgetCents) * 100);

  if (estimate.knownMaxMonthlyCents <= budgetCents) {
    return {
      isWithinBudget: true,
      percentOfBudget,
      message: `Within budget (${percentOfBudget}% of budget)`,
    };
  } else if (estimate.knownMinMonthlyCents !== null && estimate.knownMinMonthlyCents <= budgetCents) {
    return {
      isWithinBudget: null, // Partially within
      percentOfBudget,
      message: `May exceed budget depending on options`,
    };
  } else {
    return {
      isWithinBudget: false,
      percentOfBudget,
      message: `Exceeds budget by ${formatCost(estimate.knownMinMonthlyCents! - budgetCents)}`,
    };
  }
}

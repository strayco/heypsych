/**
 * CLAIM TYPE-SPECIFIC VALIDATORS
 *
 * Validates that claims have appropriate context based on their type.
 * Quantitative claims (effect sizes, NNT, response rates) require
 * provenance fields to avoid misleading out-of-context statistics.
 *
 * @see medical-claim-ledger.ts for claim types
 * @see Phase D hardening (2026-08-21)
 */

import type { ClinicalClaim, ClaimType, ClaimLocation } from './medical-claim-ledger';

// ============ TYPES ============

export type RiskTier = 'high' | 'medium' | 'low';

export interface ClaimValidationResult {
  /** Whether the claim passes validation */
  valid: boolean;

  /** Blocking errors that must be fixed */
  errors: string[];

  /** Non-blocking warnings for review */
  warnings: string[];

  /** Risk tier based on claim type and missing context */
  riskTier: RiskTier;

  /** Specific missing fields */
  missingFields: string[];
}

// ============ CLAIM TYPE CATEGORIES ============

/**
 * Quantitative claim types that REQUIRE provenance context
 */
const QUANTITATIVE_TYPES: ClaimType[] = [
  'effect_size',
  'nnt',
  'nnh',
  'response_rate',
  'remission_rate',
];

/**
 * Claim types that SHOULD have provenance context
 */
const PROVENANCE_RECOMMENDED: ClaimType[] = [
  'efficacy',
  'comparison',
  'withdrawal',
];

/**
 * Claim types that are sensitive regardless of context
 */
const ALWAYS_SENSITIVE: ClaimType[] = [
  'dosage',
  'interaction',
  'contraindication',
];

// ============ VALIDATORS ============

/**
 * Validate a quantitative claim has required context
 */
export function validateQuantitativeClaim(
  claim: Partial<ClinicalClaim>
): ClaimValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  const claimType = claim.claimType;
  if (!claimType) {
    return {
      valid: false,
      errors: ['Missing claim type'],
      warnings: [],
      riskTier: 'high',
      missingFields: ['claimType'],
    };
  }

  const isQuantitative = QUANTITATIVE_TYPES.includes(claimType);
  const needsProvenance = isQuantitative || PROVENANCE_RECOMMENDED.includes(claimType);
  const location = claim.locations?.[0];

  if (needsProvenance) {
    // Required for quantitative types
    if (isQuantitative) {
      if (!location?.population) {
        errors.push(`${claimType} claim missing population context (e.g., "adults with MDD")`);
        missingFields.push('population');
      }

      if (!location?.comparator) {
        errors.push(`${claimType} claim missing comparator (e.g., "placebo", "active control")`);
        missingFields.push('comparator');
      }
    }

    // Recommended for all provenance-needed types
    if (!location?.outcome) {
      warnings.push(`Missing outcome definition (e.g., "HAM-D reduction")`);
      missingFields.push('outcome');
    }

    if (!location?.timeframe) {
      warnings.push(`Missing timeframe (e.g., "8 weeks")`);
      missingFields.push('timeframe');
    }
  }

  // Check for source support
  if (!claim.sourceIds || claim.sourceIds.length === 0) {
    if (isQuantitative || ALWAYS_SENSITIVE.includes(claimType)) {
      errors.push(`${claimType} claim requires source citation`);
    } else {
      warnings.push('Claim has no supporting sources');
    }
  }

  // Determine risk tier
  let riskTier: RiskTier;
  if (errors.length > 0) {
    riskTier = 'high';
  } else if (warnings.length > 0) {
    riskTier = 'medium';
  } else {
    riskTier = 'low';
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskTier,
    missingFields,
  };
}

/**
 * Validate a claim location has sufficient provenance
 */
export function validateClaimProvenance(
  location: ClaimLocation,
  claimType: ClaimType
): ClaimValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  const isQuantitative = QUANTITATIVE_TYPES.includes(claimType);

  if (isQuantitative) {
    if (!location.population) {
      errors.push('Population context required for quantitative claims');
      missingFields.push('population');
    }
    if (!location.comparator) {
      errors.push('Comparator required for quantitative claims');
      missingFields.push('comparator');
    }
    if (!location.outcome) {
      warnings.push('Outcome definition recommended');
      missingFields.push('outcome');
    }
    if (!location.timeframe) {
      warnings.push('Timeframe recommended');
      missingFields.push('timeframe');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskTier: errors.length > 0 ? 'high' : warnings.length > 0 ? 'medium' : 'low',
    missingFields,
  };
}

/**
 * Batch validate multiple claims
 */
export function validateClaims(
  claims: Partial<ClinicalClaim>[]
): Map<string, ClaimValidationResult> {
  const results = new Map<string, ClaimValidationResult>();

  for (const claim of claims) {
    const id = claim.id || `unknown-${Math.random().toString(36).slice(2, 9)}`;
    results.set(id, validateQuantitativeClaim(claim));
  }

  return results;
}

/**
 * Get validation summary for a set of claims
 */
export function getValidationSummary(
  results: Map<string, ClaimValidationResult>
): {
  total: number;
  valid: number;
  invalid: number;
  byRiskTier: Record<RiskTier, number>;
  commonErrors: string[];
  commonWarnings: string[];
} {
  const byRiskTier: Record<RiskTier, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  const errorCounts = new Map<string, number>();
  const warningCounts = new Map<string, number>();

  let valid = 0;
  let invalid = 0;

  for (const result of results.values()) {
    if (result.valid) {
      valid++;
    } else {
      invalid++;
    }

    byRiskTier[result.riskTier]++;

    for (const error of result.errors) {
      errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
    }

    for (const warning of result.warnings) {
      warningCounts.set(warning, (warningCounts.get(warning) || 0) + 1);
    }
  }

  // Sort by frequency
  const commonErrors = Array.from(errorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([error]) => error);

  const commonWarnings = Array.from(warningCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([warning]) => warning);

  return {
    total: results.size,
    valid,
    invalid,
    byRiskTier,
    commonErrors,
    commonWarnings,
  };
}

/**
 * Check if a claim type requires quantitative provenance
 */
export function isQuantitativeClaimType(claimType: ClaimType): boolean {
  return QUANTITATIVE_TYPES.includes(claimType);
}

/**
 * Check if a claim type is always considered sensitive
 */
export function isSensitiveClaimType(claimType: ClaimType): boolean {
  return ALWAYS_SENSITIVE.includes(claimType) || QUANTITATIVE_TYPES.includes(claimType);
}

/**
 * Get required provenance fields for a claim type
 */
export function getRequiredProvenanceFields(claimType: ClaimType): string[] {
  if (QUANTITATIVE_TYPES.includes(claimType)) {
    return ['population', 'comparator'];
  }
  return [];
}

/**
 * Get recommended provenance fields for a claim type
 */
export function getRecommendedProvenanceFields(claimType: ClaimType): string[] {
  if (QUANTITATIVE_TYPES.includes(claimType) || PROVENANCE_RECOMMENDED.includes(claimType)) {
    return ['outcome', 'timeframe', 'geography'];
  }
  return [];
}

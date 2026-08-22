/**
 * MEDICAL CLAIM LEDGER
 *
 * Tracks every medical claim made in the codebase and links it to supporting sources.
 * This enables:
 * - Verification that all claims have source support
 * - Claim confidence scoring based on evidence quality
 * - Detection of unsupported or poorly-supported claims
 * - Audit trail for medical content review
 *
 * CLAIM TYPES:
 * - prevalence: Statistics about condition frequency (e.g., "affects 6% of adults")
 * - dosage: Medication dosing information (e.g., "typical dose 10-20mg daily")
 * - efficacy: Treatment effectiveness (e.g., "NNT of 8 for anxiety")
 * - side_effect: Adverse reactions (e.g., "nausea in 15% of patients")
 * - interaction: Drug/drug or drug/condition interactions
 * - mechanism: How a treatment works (e.g., "inhibits serotonin reuptake")
 * - contraindication: When not to use (e.g., "avoid in pregnancy")
 * - diagnostic: Diagnostic criteria or tests
 * - prognosis: Expected outcomes
 * - comparison: Comparative claims between treatments
 *
 * QUANTITATIVE EVIDENCE TYPES (added 2026-08-21):
 * - effect_size: Cohen's d, standardized mean differences, etc.
 * - nnt: Number needed to treat
 * - nnh: Number needed to harm
 * - response_rate: Percentage responding to treatment
 * - remission_rate: Percentage achieving remission
 * - withdrawal: Discontinuation rates and reasons
 * - guideline: Practice guideline recommendations
 * - cost: Treatment cost information
 * - availability: Access and availability information
 *
 * CONFIDENCE LEVELS:
 * - high: Multiple high-quality sources (RCTs, meta-analyses)
 * - moderate: At least one good quality source
 * - low: Only weak evidence or single source
 * - unsupported: No source linked
 *
 * @see Phase D of Wave 3 directive
 */

import type { ClinicalSource, EvidenceLevel } from './clinical-source-registry';
import { getSource } from './clinical-source-registry';
import { validateQuantitativeClaim, isQuantitativeClaimType } from './claim-validators';

// ============ TYPES ============

/**
 * Claim type classification
 */
export type ClaimType =
  // Core clinical claim types
  | 'prevalence'
  | 'dosage'
  | 'efficacy'
  | 'side_effect'
  | 'interaction'
  | 'mechanism'
  | 'contraindication'
  | 'diagnostic'
  | 'prognosis'
  | 'comparison'
  | 'general'
  // Quantitative evidence types (2026-08-21)
  | 'effect_size'     // Cohen's d, SMD, etc.
  | 'nnt'             // Number needed to treat
  | 'nnh'             // Number needed to harm
  | 'response_rate'   // % responding
  | 'remission_rate'  // % achieving remission
  | 'withdrawal'      // Discontinuation rates
  | 'guideline'       // Practice guideline recommendations
  | 'cost'            // Treatment cost data
  | 'availability';   // Access/availability info

/**
 * Claim confidence level
 */
export type ClaimConfidence = 'high' | 'moderate' | 'low' | 'unsupported';

/**
 * Medical claim interface
 */
export interface ClinicalClaim {
  /** Unique claim identifier */
  id: string;

  /** Claim type classification */
  claimType: ClaimType;

  /** The claim text as rendered */
  renderedForm: string;

  /** Normalized/canonical form of the claim */
  canonicalForm?: string;

  /** Entity IDs this claim is about */
  entityIds: string[];

  /** Source IDs supporting this claim */
  sourceIds: string[];

  /** Computed confidence level */
  confidence: ClaimConfidence;

  /** Numerical confidence score (0-1) */
  confidenceScore: number;

  /** Where this claim appears */
  locations: ClaimLocation[];

  /** When this claim was last verified */
  lastVerified?: string;

  /** Review notes */
  reviewNotes?: string;

  /** Flags for attention */
  flags?: ClaimFlag[];
}

/**
 * Where a claim appears in content
 */
export interface ClaimLocation {
  /** Entity slug containing the claim */
  entitySlug: string;

  /** Section type (overview, side_effects, dosage, etc.) */
  sectionType?: string;

  /** Section heading */
  sectionHeading?: string;

  /** Approximate position (for duplicate detection) */
  textSnippet?: string;

  // ========== PROVENANCE FIELDS (2026-08-21) ==========
  // Required context for quantitative claims

  /** Study population (e.g., "adults with MDD", "elderly with GAD") */
  population?: string;

  /** Comparator arm (e.g., "placebo", "active control", "usual care") */
  comparator?: string;

  /** Measured outcome (e.g., "HAM-D reduction", "CGI-S response") */
  outcome?: string;

  /** Study timeframe (e.g., "8 weeks", "6 months", "1 year") */
  timeframe?: string;

  /** Geographic context (e.g., "US", "EU", "global") */
  geography?: string;
}

/**
 * Flags for claims requiring attention
 */
export type ClaimFlag =
  | 'needs_source'       // No source linked
  | 'weak_evidence'      // Only low-quality sources
  | 'outdated'           // Sources over 5 years old
  | 'needs_review'       // Flagged for clinical review
  | 'conflicting'        // Sources disagree
  | 'sensitive'          // High-risk claim (dosage, interaction)
  | 'missing_provenance' // Quantitative claim without required context (population, comparator)
  | 'validation_failed'; // Failed type-specific validation

/**
 * Ledger statistics
 */
export interface ClaimLedgerStats {
  totalClaims: number;
  byType: Record<ClaimType, number>;
  byConfidence: Record<ClaimConfidence, number>;
  claimsNeedingSource: number;
  claimsNeedingReview: number;
  averageConfidenceScore: number;
  coverageByEntity: Map<string, { total: number; supported: number }>;
}

// ============ LEDGER STORAGE ============

/**
 * In-memory claim ledger
 */
const claimLedger: Map<string, ClinicalClaim> = new Map();

/**
 * Index: entity → claim IDs
 */
const entityClaimIndex: Map<string, Set<string>> = new Map();

/**
 * Index: source → claim IDs
 */
const sourceClaimIndex: Map<string, Set<string>> = new Map();

/**
 * Index: claim type → claim IDs
 */
const typeClaimIndex: Map<ClaimType, Set<string>> = new Map();

// ============ CLAIM REGISTRATION ============

/**
 * Generate a unique claim ID
 */
function generateClaimId(claim: Partial<ClinicalClaim>): string {
  const typePrefix = claim.claimType || 'general';
  const entityPart = claim.entityIds?.join('-') || 'unknown';
  const textHash = (claim.renderedForm || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);

  return `${typePrefix}:${entityPart}:${textHash}`;
}

/**
 * Calculate confidence score based on sources
 */
function calculateConfidence(sourceIds: string[]): {
  confidence: ClaimConfidence;
  confidenceScore: number;
} {
  if (sourceIds.length === 0) {
    return { confidence: 'unsupported', confidenceScore: 0 };
  }

  // Get source evidence levels
  const sources = sourceIds
    .map(id => getSource(id))
    .filter((s): s is ClinicalSource => !!s);

  if (sources.length === 0) {
    return { confidence: 'unsupported', confidenceScore: 0 };
  }

  // Score by evidence level
  const evidenceLevelScores: Record<EvidenceLevel, number> = {
    A: 1.0,
    B: 0.7,
    C: 0.4,
    D: 0.2,
  };

  const totalScore = sources.reduce(
    (sum, source) => sum + evidenceLevelScores[source.evidenceLevel],
    0
  );

  // Average score, boosted slightly by having multiple sources
  const avgScore = totalScore / sources.length;
  const multiSourceBonus = Math.min((sources.length - 1) * 0.05, 0.15);
  const confidenceScore = Math.min(avgScore + multiSourceBonus, 1.0);

  // Map to confidence level
  let confidence: ClaimConfidence;
  if (confidenceScore >= 0.8) {
    confidence = 'high';
  } else if (confidenceScore >= 0.5) {
    confidence = 'moderate';
  } else {
    confidence = 'low';
  }

  return { confidence, confidenceScore };
}

/**
 * Detect flags for a claim
 *
 * ENFORCEMENT: This function gates claim quality by detecting issues that
 * must be addressed before claims can be publicly rendered.
 */
function detectFlags(
  claim: Partial<ClinicalClaim>,
  sources: ClinicalSource[]
): ClaimFlag[] {
  const flags: ClaimFlag[] = [];

  // No sources
  if (sources.length === 0) {
    flags.push('needs_source');
  }

  // Only weak evidence
  const hasStrongEvidence = sources.some(s =>
    s.evidenceLevel === 'A' || s.evidenceLevel === 'B'
  );
  if (sources.length > 0 && !hasStrongEvidence) {
    flags.push('weak_evidence');
  }

  // Outdated sources
  const currentYear = new Date().getFullYear();
  const hasRecentSource = sources.some(s =>
    s.year && s.year >= currentYear - 5
  );
  if (sources.length > 0 && !hasRecentSource) {
    flags.push('outdated');
  }

  // Sensitive claim types - require extra scrutiny
  const sensitiveTypes: ClaimType[] = [
    // Core sensitive types
    'dosage',
    'interaction',
    'contraindication',
    // Quantitative types (2026-08-21) - high risk if misrepresented
    'effect_size',
    'nnt',
    'nnh',
    'response_rate',
    'remission_rate',
    'withdrawal',
  ];
  if (claim.claimType && sensitiveTypes.includes(claim.claimType)) {
    flags.push('sensitive');
  }

  // ========== VALIDATOR INTEGRATION (P0 #3) ==========
  // Quantitative claims MUST have provenance context to be rendered publicly.
  // This is enforced here, not just in tests.

  if (claim.claimType && isQuantitativeClaimType(claim.claimType)) {
    const validation = validateQuantitativeClaim(claim);

    // High-risk validation failure: missing required provenance
    if (!validation.valid) {
      flags.push('missing_provenance');

      // Log for operational visibility
      console.warn(
        `⚠️ Claim validation failed: ${claim.claimType} claim missing provenance`,
        validation.errors
      );
    }

    // Any validation issues on quantitative claims = validation_failed
    if (validation.riskTier === 'high') {
      flags.push('validation_failed');
    }
  }

  return flags;
}

/**
 * Register a clinical claim
 */
export function registerClaim(
  claim: Omit<ClinicalClaim, 'id' | 'confidence' | 'confidenceScore' | 'flags'>
): ClinicalClaim {
  // Generate ID
  const id = generateClaimId(claim);

  // Check for existing
  const existing = claimLedger.get(id);
  if (existing) {
    // Merge locations if claim already exists
    const newLocations = claim.locations.filter(
      loc => !existing.locations.some(
        el => el.entitySlug === loc.entitySlug && el.sectionType === loc.sectionType
      )
    );
    existing.locations.push(...newLocations);

    // Add any new source IDs
    const newSourceIds = claim.sourceIds.filter(
      sid => !existing.sourceIds.includes(sid)
    );
    existing.sourceIds.push(...newSourceIds);

    // Recalculate confidence
    const { confidence, confidenceScore } = calculateConfidence(existing.sourceIds);
    existing.confidence = confidence;
    existing.confidenceScore = confidenceScore;

    return existing;
  }

  // Get sources
  const sources = claim.sourceIds
    .map(id => getSource(id))
    .filter((s): s is ClinicalSource => !!s);

  // Calculate confidence
  const { confidence, confidenceScore } = calculateConfidence(claim.sourceIds);

  // Detect flags
  const flags = detectFlags(claim, sources);

  // Create full claim
  const fullClaim: ClinicalClaim = {
    ...claim,
    id,
    confidence,
    confidenceScore,
    flags: flags.length > 0 ? flags : undefined,
  };

  // Store in ledger
  claimLedger.set(id, fullClaim);

  // Update indexes
  for (const entityId of claim.entityIds) {
    if (!entityClaimIndex.has(entityId)) {
      entityClaimIndex.set(entityId, new Set());
    }
    entityClaimIndex.get(entityId)!.add(id);
  }

  for (const sourceId of claim.sourceIds) {
    if (!sourceClaimIndex.has(sourceId)) {
      sourceClaimIndex.set(sourceId, new Set());
    }
    sourceClaimIndex.get(sourceId)!.add(id);
  }

  if (!typeClaimIndex.has(claim.claimType)) {
    typeClaimIndex.set(claim.claimType, new Set());
  }
  typeClaimIndex.get(claim.claimType)!.add(id);

  return fullClaim;
}

/**
 * Batch register claims
 */
export function registerClaims(
  claims: Array<Omit<ClinicalClaim, 'id' | 'confidence' | 'confidenceScore' | 'flags'>>
): ClinicalClaim[] {
  return claims.map(registerClaim);
}

// ============ CLAIM RETRIEVAL ============

/**
 * Get claim by ID
 */
export function getClaim(id: string): ClinicalClaim | undefined {
  return claimLedger.get(id);
}

/**
 * Get claims for an entity
 */
export function getClaimsForEntity(entityId: string): ClinicalClaim[] {
  const ids = entityClaimIndex.get(entityId);
  if (!ids) return [];
  return Array.from(ids)
    .map(id => claimLedger.get(id))
    .filter((c): c is ClinicalClaim => !!c);
}

/**
 * Get claims supported by a source
 */
export function getClaimsForSource(sourceId: string): ClinicalClaim[] {
  const ids = sourceClaimIndex.get(sourceId);
  if (!ids) return [];
  return Array.from(ids)
    .map(id => claimLedger.get(id))
    .filter((c): c is ClinicalClaim => !!c);
}

/**
 * Get claims by type
 */
export function getClaimsByType(claimType: ClaimType): ClinicalClaim[] {
  const ids = typeClaimIndex.get(claimType);
  if (!ids) return [];
  return Array.from(ids)
    .map(id => claimLedger.get(id))
    .filter((c): c is ClinicalClaim => !!c);
}

/**
 * Get all claims
 */
export function getAllClaims(): ClinicalClaim[] {
  return Array.from(claimLedger.values());
}

/**
 * Get claims needing attention
 */
export function getClaimsNeedingAttention(): ClinicalClaim[] {
  return Array.from(claimLedger.values()).filter(
    claim => claim.flags && claim.flags.length > 0
  );
}

/**
 * Get unsupported claims
 */
export function getUnsupportedClaims(): ClinicalClaim[] {
  return Array.from(claimLedger.values()).filter(
    claim => claim.confidence === 'unsupported'
  );
}

/**
 * Check if a claim is safe to render publicly
 *
 * ENFORCEMENT: This is the gate for public rendering of claims.
 * Claims with validation failures or missing provenance MUST NOT be rendered.
 */
export function isClaimSafeToRender(claim: ClinicalClaim): boolean {
  // No flags = safe
  if (!claim.flags || claim.flags.length === 0) {
    return true;
  }

  // These flags block public rendering
  const blockingFlags: ClaimFlag[] = [
    'validation_failed',
    'missing_provenance',
  ];

  return !claim.flags.some(flag => blockingFlags.includes(flag));
}

/**
 * Get claims that are blocked from public rendering
 */
export function getBlockedClaims(): ClinicalClaim[] {
  return Array.from(claimLedger.values()).filter(
    claim => !isClaimSafeToRender(claim)
  );
}

/**
 * Check if an entity has any blocked claims
 *
 * Used by the firewall to gate indexation of pages with unverified quantitative claims.
 */
export function entityHasBlockedClaims(entityId: string): boolean {
  const claims = getClaimsForEntity(entityId);
  return claims.some(claim => !isClaimSafeToRender(claim));
}

// ============ CLAIM MODIFICATION ============

/**
 * Add source to a claim
 */
export function addSourceToClaim(claimId: string, sourceId: string): boolean {
  const claim = claimLedger.get(claimId);
  if (!claim) return false;

  if (!claim.sourceIds.includes(sourceId)) {
    claim.sourceIds.push(sourceId);

    // Update source index
    if (!sourceClaimIndex.has(sourceId)) {
      sourceClaimIndex.set(sourceId, new Set());
    }
    sourceClaimIndex.get(sourceId)!.add(claimId);

    // Recalculate confidence
    const { confidence, confidenceScore } = calculateConfidence(claim.sourceIds);
    claim.confidence = confidence;
    claim.confidenceScore = confidenceScore;

    // Re-detect flags
    const sources = claim.sourceIds
      .map(id => getSource(id))
      .filter((s): s is ClinicalSource => !!s);
    claim.flags = detectFlags(claim, sources);
  }

  return true;
}

/**
 * Mark claim as reviewed
 */
export function markClaimReviewed(
  claimId: string,
  notes?: string
): boolean {
  const claim = claimLedger.get(claimId);
  if (!claim) return false;

  claim.lastVerified = new Date().toISOString();
  if (notes) {
    claim.reviewNotes = notes;
  }

  // Remove needs_review flag if present
  if (claim.flags) {
    claim.flags = claim.flags.filter(f => f !== 'needs_review');
    if (claim.flags.length === 0) {
      claim.flags = undefined;
    }
  }

  return true;
}

// ============ STATISTICS ============

/**
 * Get ledger statistics
 */
export function getLedgerStats(): ClaimLedgerStats {
  const byType: Record<ClaimType, number> = {
    // Core types
    prevalence: 0,
    dosage: 0,
    efficacy: 0,
    side_effect: 0,
    interaction: 0,
    mechanism: 0,
    contraindication: 0,
    diagnostic: 0,
    prognosis: 0,
    comparison: 0,
    general: 0,
    // Quantitative types (2026-08-21)
    effect_size: 0,
    nnt: 0,
    nnh: 0,
    response_rate: 0,
    remission_rate: 0,
    withdrawal: 0,
    guideline: 0,
    cost: 0,
    availability: 0,
  };

  const byConfidence: Record<ClaimConfidence, number> = {
    high: 0,
    moderate: 0,
    low: 0,
    unsupported: 0,
  };

  let claimsNeedingSource = 0;
  let claimsNeedingReview = 0;
  let totalConfidenceScore = 0;

  const coverageByEntity = new Map<string, { total: number; supported: number }>();

  for (const claim of claimLedger.values()) {
    byType[claim.claimType]++;
    byConfidence[claim.confidence]++;
    totalConfidenceScore += claim.confidenceScore;

    if (claim.confidence === 'unsupported') {
      claimsNeedingSource++;
    }

    if (claim.flags?.includes('needs_review')) {
      claimsNeedingReview++;
    }

    // Entity coverage
    for (const entityId of claim.entityIds) {
      if (!coverageByEntity.has(entityId)) {
        coverageByEntity.set(entityId, { total: 0, supported: 0 });
      }
      const coverage = coverageByEntity.get(entityId)!;
      coverage.total++;
      if (claim.confidence !== 'unsupported') {
        coverage.supported++;
      }
    }
  }

  const totalClaims = claimLedger.size;

  return {
    totalClaims,
    byType,
    byConfidence,
    claimsNeedingSource,
    claimsNeedingReview,
    averageConfidenceScore: totalClaims > 0 ? totalConfidenceScore / totalClaims : 0,
    coverageByEntity,
  };
}

/**
 * Get entity claim coverage
 */
export function getEntityClaimCoverage(entityId: string): {
  total: number;
  supported: number;
  byConfidence: Record<ClaimConfidence, number>;
  flags: ClaimFlag[];
} {
  const claims = getClaimsForEntity(entityId);

  const byConfidence: Record<ClaimConfidence, number> = {
    high: 0,
    moderate: 0,
    low: 0,
    unsupported: 0,
  };

  const allFlags = new Set<ClaimFlag>();

  for (const claim of claims) {
    byConfidence[claim.confidence]++;
    if (claim.flags) {
      claim.flags.forEach(f => allFlags.add(f));
    }
  }

  return {
    total: claims.length,
    supported: claims.filter(c => c.confidence !== 'unsupported').length,
    byConfidence,
    flags: Array.from(allFlags),
  };
}

// ============ PERSISTENCE ============

/**
 * Export ledger to JSON
 */
export function exportLedger(): string {
  const claims = Array.from(claimLedger.values());
  return JSON.stringify(claims, null, 2);
}

/**
 * Import ledger from JSON
 */
export function importLedger(json: string): void {
  try {
    const claims: ClinicalClaim[] = JSON.parse(json);

    // Clear existing
    clearLedger();

    // Re-register all claims
    for (const claim of claims) {
      claimLedger.set(claim.id, claim);

      // Rebuild indexes
      for (const entityId of claim.entityIds) {
        if (!entityClaimIndex.has(entityId)) {
          entityClaimIndex.set(entityId, new Set());
        }
        entityClaimIndex.get(entityId)!.add(claim.id);
      }

      for (const sourceId of claim.sourceIds) {
        if (!sourceClaimIndex.has(sourceId)) {
          sourceClaimIndex.set(sourceId, new Set());
        }
        sourceClaimIndex.get(sourceId)!.add(claim.id);
      }

      if (!typeClaimIndex.has(claim.claimType)) {
        typeClaimIndex.set(claim.claimType, new Set());
      }
      typeClaimIndex.get(claim.claimType)!.add(claim.id);
    }
  } catch (e) {
    console.error('Failed to import claim ledger:', e);
    throw new Error('Invalid ledger JSON');
  }
}

/**
 * Clear ledger (for testing)
 */
export function clearLedger(): void {
  claimLedger.clear();
  entityClaimIndex.clear();
  sourceClaimIndex.clear();
  typeClaimIndex.clear();
}

// Types are exported at declaration

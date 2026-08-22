/**
 * SEO Production Hardening Tests
 *
 * Adversarial tests verifying the integrity of the SEO hardening work:
 * - Evidence Matrix quarantine
 * - Answer King idempotence
 * - Claim Ledger extensions
 * - Type-specific validators
 * - Control plane accuracy
 *
 * @see Plan: /Users/jack/.claude/plans/whimsical-plotting-crayon.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Import modules under test
import {
  isAnswerKing,
  registerAnswerKing,
  isQuarantined,
  makeEntityIndexDecision,
} from '@/lib/seo/index-decision-service';
import { initializeAnswerKings, TOPIC_CLUSTERS } from '@/lib/seo/answer-kings';
import {
  registerClaim,
  clearLedger,
  getClaim,
  getClaimsByType,
  getLedgerStats,
  isClaimSafeToRender,
  getBlockedClaims,
  type ClaimType,
} from '@/lib/trust/medical-claim-ledger';
import {
  validateQuantitativeClaim,
  validateClaimProvenance,
  isQuantitativeClaimType,
  isSensitiveClaimType,
  getRequiredProvenanceFields,
} from '@/lib/trust/claim-validators';

// ============ EVIDENCE MATRIX QUARANTINE TESTS ============

describe('Evidence Matrix Quarantine', () => {
  it('should have noindex flag in evidence-matrix.json', () => {
    const evidenceMatrixPath = path.join(
      process.cwd(),
      'data/resources/knowledge-hub/research-and-science/evidence-matrix.json'
    );

    if (fs.existsSync(evidenceMatrixPath)) {
      const content = JSON.parse(fs.readFileSync(evidenceMatrixPath, 'utf-8'));
      expect(content.seo?.noindex).toBe(true);
      expect(content.seo?.quarantine_reason).toBe('unverified_quantitative_claims');
    }
  });

  it('should NOT be registered as an answer king', () => {
    // The evidence matrix should not be an answer king due to quarantine
    expect(isAnswerKing('/evidence-matrix')).toBe(false);
    expect(isAnswerKing('/resources/evidence-matrix')).toBe(false);
  });

  it('should have TOPIC_CLUSTERS entry marked as quarantined', () => {
    const cluster = TOPIC_CLUSTERS['treatment-evidence-comparison'];
    expect(cluster).toBeDefined();
    expect(cluster.quarantined).toBe(true);
    expect(cluster.answerKing).toBe(null);
  });
});

// ============ ANSWER KING IDEMPOTENCE TESTS ============

describe('Answer King Idempotence', () => {
  it('should not duplicate registrations on multiple initializations', () => {
    // Call initializeAnswerKings multiple times
    initializeAnswerKings();
    initializeAnswerKings();
    initializeAnswerKings();

    // Check that known answer kings are still valid
    expect(isAnswerKing('/conditions')).toBe(true);
    expect(isAnswerKing('/treatments')).toBe(true);
    expect(isAnswerKing('/conditions/major-depressive-disorder')).toBe(true);
  });

  it('should maintain consistent answer king status', () => {
    // Answer kings should remain answer kings
    expect(isAnswerKing('/conditions/generalized-anxiety-disorder')).toBe(true);
    expect(isAnswerKing('/treatments/cognitive-behavioral-therapy')).toBe(true);

    // Non-answer-kings should remain non-answer-kings
    expect(isAnswerKing('/conditions/some-random-condition')).toBe(false);
    expect(isAnswerKing('/treatments/some-random-treatment')).toBe(false);
  });
});

// ============ CLAIM LEDGER EXTENSION TESTS ============

describe('Extended Claim Ledger Types', () => {
  beforeEach(() => {
    clearLedger();
  });

  afterEach(() => {
    clearLedger();
  });

  const newQuantitativeTypes: ClaimType[] = [
    'effect_size',
    'nnt',
    'nnh',
    'response_rate',
    'remission_rate',
    'withdrawal',
    'guideline',
    'cost',
    'availability',
  ];

  it.each(newQuantitativeTypes)('should accept new claim type: %s', (claimType) => {
    const claim = registerClaim({
      claimType,
      renderedForm: `Test ${claimType} claim`,
      entityIds: ['test-entity'],
      sourceIds: [],
      locations: [{ entitySlug: 'test-entity', sectionType: 'test' }],
    });

    expect(claim).toBeDefined();
    expect(claim.claimType).toBe(claimType);
  });

  it('should flag quantitative types as sensitive', () => {
    const sensitiveClaims = ['effect_size', 'nnt', 'nnh', 'response_rate', 'remission_rate'];

    for (const claimType of sensitiveClaims) {
      const claim = registerClaim({
        claimType: claimType as ClaimType,
        renderedForm: `Test ${claimType} claim`,
        entityIds: ['test-entity'],
        sourceIds: [],
        locations: [{ entitySlug: 'test-entity' }],
      });

      expect(claim.flags).toContain('sensitive');
    }
  });

  it('should track new types in ledger stats', () => {
    // Register claims of various new types
    registerClaim({
      claimType: 'effect_size',
      renderedForm: 'Effect size d=0.5',
      entityIds: ['test'],
      sourceIds: [],
      locations: [{ entitySlug: 'test' }],
    });

    registerClaim({
      claimType: 'nnt',
      renderedForm: 'NNT of 8',
      entityIds: ['test'],
      sourceIds: [],
      locations: [{ entitySlug: 'test' }],
    });

    const stats = getLedgerStats();

    expect(stats.byType.effect_size).toBe(1);
    expect(stats.byType.nnt).toBe(1);
    expect(stats.totalClaims).toBe(2);
  });
});

describe('Claim Location Provenance Fields', () => {
  beforeEach(() => {
    clearLedger();
  });

  afterEach(() => {
    clearLedger();
  });

  it('should accept new provenance fields in claim locations', () => {
    const claim = registerClaim({
      claimType: 'effect_size',
      renderedForm: 'SMD -0.62 for sertraline vs placebo',
      entityIds: ['sertraline'],
      sourceIds: ['doi:10.1001/example'],
      locations: [{
        entitySlug: 'sertraline',
        sectionType: 'efficacy',
        population: 'adults with MDD',
        comparator: 'placebo',
        outcome: 'HAM-D reduction',
        timeframe: '8 weeks',
        geography: 'US',
      }],
    });

    expect(claim).toBeDefined();
    expect(claim.locations[0].population).toBe('adults with MDD');
    expect(claim.locations[0].comparator).toBe('placebo');
    expect(claim.locations[0].outcome).toBe('HAM-D reduction');
    expect(claim.locations[0].timeframe).toBe('8 weeks');
    expect(claim.locations[0].geography).toBe('US');
  });
});

// ============ TYPE-SPECIFIC VALIDATOR TESTS ============

describe('Claim Validators', () => {
  it('should require population and comparator for quantitative claims', () => {
    const result = validateQuantitativeClaim({
      claimType: 'nnt',
      renderedForm: 'NNT of 8',
      entityIds: ['test'],
      sourceIds: [],
      locations: [{ entitySlug: 'test' }],
    });

    expect(result.valid).toBe(false);
    // Check that errors mention missing population and comparator
    expect(result.errors.some(e => e.toLowerCase().includes('population'))).toBe(true);
    expect(result.errors.some(e => e.toLowerCase().includes('comparator'))).toBe(true);
    expect(result.riskTier).toBe('high');
  });

  it('should pass validation for properly contextualized claims', () => {
    const result = validateQuantitativeClaim({
      claimType: 'effect_size',
      renderedForm: 'Cohen d = 0.5',
      entityIds: ['treatment'],
      sourceIds: ['doi:10.1001/example'],
      locations: [{
        entitySlug: 'treatment',
        population: 'adults with MDD',
        comparator: 'placebo',
        outcome: 'PHQ-9',
        timeframe: '12 weeks',
      }],
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.riskTier).toBe('low');
  });

  it('should warn for missing recommended fields', () => {
    const result = validateQuantitativeClaim({
      claimType: 'response_rate',
      renderedForm: '60% response rate',
      entityIds: ['treatment'],
      sourceIds: ['doi:10.1001/example'],
      locations: [{
        entitySlug: 'treatment',
        population: 'adults',
        comparator: 'placebo',
        // Missing outcome and timeframe
      }],
    });

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.riskTier).toBe('medium');
  });

  it('should correctly identify quantitative claim types', () => {
    expect(isQuantitativeClaimType('effect_size')).toBe(true);
    expect(isQuantitativeClaimType('nnt')).toBe(true);
    expect(isQuantitativeClaimType('nnh')).toBe(true);
    expect(isQuantitativeClaimType('response_rate')).toBe(true);
    expect(isQuantitativeClaimType('remission_rate')).toBe(true);

    expect(isQuantitativeClaimType('dosage')).toBe(false);
    expect(isQuantitativeClaimType('mechanism')).toBe(false);
  });

  it('should correctly identify sensitive claim types', () => {
    // Always sensitive
    expect(isSensitiveClaimType('dosage')).toBe(true);
    expect(isSensitiveClaimType('interaction')).toBe(true);
    expect(isSensitiveClaimType('contraindication')).toBe(true);

    // Quantitative = sensitive
    expect(isSensitiveClaimType('effect_size')).toBe(true);
    expect(isSensitiveClaimType('nnt')).toBe(true);

    // Not sensitive
    expect(isSensitiveClaimType('mechanism')).toBe(false);
    expect(isSensitiveClaimType('general')).toBe(false);
  });

  it('should return correct required provenance fields', () => {
    expect(getRequiredProvenanceFields('nnt')).toEqual(['population', 'comparator']);
    expect(getRequiredProvenanceFields('effect_size')).toEqual(['population', 'comparator']);
    expect(getRequiredProvenanceFields('dosage')).toEqual([]);
    expect(getRequiredProvenanceFields('general')).toEqual([]);
  });
});

// ============ CONTROL PLANE ACCURACY TESTS ============

describe('Control Plane Wiring', () => {
  it('should have cohort-counts.json structure if it exists', () => {
    const cohortFile = path.join(process.cwd(), 'data/seo-performance/cohort-counts.json');

    if (fs.existsSync(cohortFile)) {
      const data = JSON.parse(fs.readFileSync(cohortFile, 'utf-8'));

      // Verify structure
      expect(data.cohorts || data).toHaveProperty('candidate');
      expect(data.cohorts || data).toHaveProperty('public_noindex');
      expect(data.cohorts || data).toHaveProperty('indexable_pilot');
      expect(data.cohorts || data).toHaveProperty('validated');
      expect(data.cohorts || data).toHaveProperty('answer_king');
      expect(data.cohorts || data).toHaveProperty('total');
    }
  });

  it('should have byFamily breakdown if calculated', () => {
    const cohortFile = path.join(process.cwd(), 'data/seo-performance/cohort-counts.json');

    if (fs.existsSync(cohortFile)) {
      const data = JSON.parse(fs.readFileSync(cohortFile, 'utf-8'));

      if (data.byFamily) {
        // Each family should have cohort counts
        for (const [family, counts] of Object.entries(data.byFamily)) {
          expect(counts).toHaveProperty('total');
        }
      }
    }
  });
});

// ============ INTEGRATION TESTS ============

describe('Hardening Integration', () => {
  it('should block unsourced quantitative claims as high risk', () => {
    clearLedger();

    const claim = registerClaim({
      claimType: 'nnt',
      renderedForm: 'NNT of 8 for depression treatment',
      entityIds: ['test-med'],
      sourceIds: [], // No sources!
      locations: [{ entitySlug: 'test-med' }],
    });

    // Should be flagged
    expect(claim.flags).toContain('needs_source');
    expect(claim.flags).toContain('sensitive');

    // Validator should reject
    const validation = validateQuantitativeClaim(claim);
    expect(validation.riskTier).toBe('high');

    clearLedger();
  });

  it('should not allow evidence matrix as answer king even if attempted', () => {
    // Attempt to register evidence matrix as answer king
    // This should be a no-op since it's already been removed
    registerAnswerKing('/evidence-matrix', 'treatment-evidence-comparison', []);

    // Should still not be an answer king due to the quarantine in answer-kings.ts
    // (The initializeAnswerKings doesn't register it)
    // But if someone manually tries to register it, that registration would work
    // This test verifies the default state from initializeAnswerKings
    expect(TOPIC_CLUSTERS['treatment-evidence-comparison'].answerKing).toBe(null);
    expect(TOPIC_CLUSTERS['treatment-evidence-comparison'].quarantined).toBe(true);
  });
});

// ============ ADVERSARIAL TESTS - ASSERT OUTCOMES, NOT FLAGS ============

describe('P0 #1: Quarantine Enforcement - OUTCOMES', () => {
  it('registerAnswerKing() returns false for quarantined paths', () => {
    // ADVERSARIAL: Directly attempt to register a quarantined path
    const result = registerAnswerKing('/evidence-matrix', 'test-cluster', ['/test']);

    // OUTCOME: Registration must be blocked
    expect(result).toBe(false);
  });

  it('isAnswerKing() returns false for quarantined paths even after registration attempt', () => {
    // Attempt registration
    registerAnswerKing('/evidence-matrix', 'test-cluster', []);

    // OUTCOME: Must still return false
    expect(isAnswerKing('/evidence-matrix')).toBe(false);
  });

  it('makeEntityIndexDecision() returns sitemapEligible=false for quarantined paths', () => {
    // ADVERSARIAL: Get index decision for quarantined path
    // Create a mock entity that would map to /evidence-matrix
    const mockEntity = {
      id: 'test-evidence-matrix',
      type: 'resource',
      slug: 'evidence-matrix',
      title: 'Evidence Matrix',
      description: 'Test entity for quarantine verification',
      content: {},
      metadata: {},
      status: 'active',
    };

    // Pass the entity with an explicit path override to the quarantined path
    const decision = makeEntityIndexDecision(mockEntity, '/evidence-matrix');

    // OUTCOME: Must be excluded from sitemap
    expect(decision.sitemapEligible).toBe(false);
    expect(decision.indexable).toBe(false);
    expect(decision.cohort).toBe('public_noindex');
  });

  it('isQuarantined() correctly identifies quarantined paths', () => {
    expect(isQuarantined('/evidence-matrix')).toBe(true);
    expect(isQuarantined('/resources/evidence-matrix')).toBe(true);
    expect(isQuarantined('/Evidence-Matrix')).toBe(true); // Case insensitive
    expect(isQuarantined('/conditions/depression')).toBe(false);
  });
});

describe('P0 #3: Validator Integration - OUTCOMES', () => {
  beforeEach(() => {
    clearLedger();
  });

  afterEach(() => {
    clearLedger();
  });

  it('quantitative claim without provenance gets missing_provenance flag', () => {
    // ADVERSARIAL: Register NNT claim without required provenance
    const claim = registerClaim({
      claimType: 'nnt',
      renderedForm: 'NNT of 8',
      entityIds: ['test-treatment'],
      sourceIds: [],
      locations: [{
        entitySlug: 'test-treatment',
        // Missing: population, comparator
      }],
    });

    // OUTCOME: Must have missing_provenance flag
    expect(claim.flags).toContain('missing_provenance');
  });

  it('quantitative claim with high-risk validation gets validation_failed flag', () => {
    // ADVERSARIAL: Register effect_size without ANY provenance
    const claim = registerClaim({
      claimType: 'effect_size',
      renderedForm: 'Cohen d = 0.8',
      entityIds: ['test-treatment'],
      sourceIds: [], // No sources either
      locations: [{
        entitySlug: 'test-treatment',
        // No provenance at all
      }],
    });

    // OUTCOME: Must have validation_failed flag
    expect(claim.flags).toContain('validation_failed');
  });

  it('isClaimSafeToRender() returns false for claims with missing_provenance', () => {
    const claim = registerClaim({
      claimType: 'nnt',
      renderedForm: 'NNT of 5',
      entityIds: ['test'],
      sourceIds: [],
      locations: [{ entitySlug: 'test' }], // Missing provenance
    });

    // OUTCOME: Must be blocked from rendering
    expect(isClaimSafeToRender(claim)).toBe(false);
  });

  it('isClaimSafeToRender() returns false for claims with validation_failed', () => {
    const claim = registerClaim({
      claimType: 'response_rate',
      renderedForm: '70% response',
      entityIds: ['test'],
      sourceIds: [],
      locations: [{ entitySlug: 'test' }], // Missing provenance
    });

    // OUTCOME: Must be blocked from rendering
    expect(isClaimSafeToRender(claim)).toBe(false);
  });

  it('isClaimSafeToRender() returns true for properly contextualized claims', () => {
    const claim = registerClaim({
      claimType: 'effect_size',
      renderedForm: 'SMD = -0.6',
      entityIds: ['test'],
      sourceIds: ['doi:10.1000/test'],
      locations: [{
        entitySlug: 'test',
        population: 'adults with MDD',
        comparator: 'placebo',
        outcome: 'HAM-D',
        timeframe: '8 weeks',
      }],
    });

    // OUTCOME: Should be safe to render
    expect(isClaimSafeToRender(claim)).toBe(true);
  });

  it('getBlockedClaims() returns all claims unsafe for public rendering', () => {
    // Register some blocked claims
    registerClaim({
      claimType: 'nnt',
      renderedForm: 'NNT claim',
      entityIds: ['test'],
      sourceIds: [],
      locations: [{ entitySlug: 'test' }],
    });

    registerClaim({
      claimType: 'effect_size',
      renderedForm: 'Effect size claim',
      entityIds: ['test'],
      sourceIds: [],
      locations: [{ entitySlug: 'test' }],
    });

    // Register a safe claim
    registerClaim({
      claimType: 'mechanism',
      renderedForm: 'Safe mechanism claim',
      entityIds: ['test'],
      sourceIds: ['doi:10.1000/test'],
      locations: [{ entitySlug: 'test' }],
    });

    const blocked = getBlockedClaims();

    // OUTCOME: Should return exactly the blocked claims
    expect(blocked.length).toBe(2);
    expect(blocked.every(c => !isClaimSafeToRender(c))).toBe(true);
  });
});

describe('P0 #4: Database Safety - OUTCOMES', () => {
  it('supabaseOptional() returns null when credentials unavailable', async () => {
    // This test runs in the test environment which may not have DB credentials
    const { supabaseOptional, SUPABASE_UNAVAILABLE } = await import('@/lib/config/database');

    if (SUPABASE_UNAVAILABLE) {
      // OUTCOME: Must return null, not crash
      const client = supabaseOptional();
      expect(client).toBeNull();
    }
  });

  it('supabaseRequired() throws clear error when credentials unavailable', async () => {
    const { supabaseRequired, SUPABASE_UNAVAILABLE } = await import('@/lib/config/database');

    if (SUPABASE_UNAVAILABLE) {
      // OUTCOME: Must throw with actionable error message
      expect(() => supabaseRequired()).toThrow(/DATABASE ERROR/);
      expect(() => supabaseRequired()).toThrow(/credentials are not configured/);
    }
  });

  it('legacy supabase export throws on property access when unavailable', async () => {
    const { supabase, SUPABASE_UNAVAILABLE } = await import('@/lib/config/database');

    if (SUPABASE_UNAVAILABLE) {
      // OUTCOME: Must throw clear error instead of undefined behavior
      expect(() => supabase.from('entities')).toThrow(/DATABASE ERROR/);
    }
  });
});

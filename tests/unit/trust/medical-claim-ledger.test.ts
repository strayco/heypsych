/**
 * Medical Claim Ledger Tests
 *
 * @see Phase D of Wave 3 directive
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerClaim,
  getClaim,
  getClaimsForEntity,
  getClaimsForSource,
  getClaimsByType,
  getUnsupportedClaims,
  getClaimsNeedingAttention,
  addSourceToClaim,
  markClaimReviewed,
  getLedgerStats,
  getEntityClaimCoverage,
  clearLedger,
  type ClinicalClaim,
} from '@/lib/trust/medical-claim-ledger';
import {
  registerSource,
  clearRegistry,
} from '@/lib/trust/clinical-source-registry';

describe('Medical Claim Ledger - Registration', () => {
  beforeEach(() => {
    clearLedger();
    clearRegistry();

    // Register test sources
    registerSource({
      doi: '10.1016/high.quality',
      title: 'High Quality Source',
      sourceType: 'meta_analysis',
      evidenceLevel: 'A',
    });

    registerSource({
      doi: '10.1016/moderate.quality',
      title: 'Moderate Quality Source',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'B',
    });

    registerSource({
      doi: '10.1016/low.quality',
      title: 'Low Quality Source',
      sourceType: 'preprint',
      evidenceLevel: 'D',
    });
  });

  it('should register a claim with high confidence', () => {
    const claim = registerClaim({
      claimType: 'efficacy',
      renderedForm: 'Escitalopram has NNT of 8 for anxiety',
      entityIds: ['escitalopram'],
      sourceIds: ['doi:10.1016/high.quality'],
      locations: [{ entitySlug: 'escitalopram', sectionType: 'efficacy' }],
    });

    expect(claim.id).toContain('efficacy:escitalopram');
    expect(claim.confidence).toBe('high');
    expect(claim.confidenceScore).toBeGreaterThan(0.8);
  });

  it('should register a claim with moderate confidence', () => {
    const claim = registerClaim({
      claimType: 'dosage',
      renderedForm: 'Typical dose 10-20mg daily',
      entityIds: ['escitalopram'],
      sourceIds: ['doi:10.1016/moderate.quality'],
      locations: [{ entitySlug: 'escitalopram', sectionType: 'dosage' }],
    });

    expect(claim.confidence).toBe('moderate');
    expect(claim.flags).toContain('sensitive'); // Dosage claims are sensitive
  });

  it('should register an unsupported claim', () => {
    const claim = registerClaim({
      claimType: 'prevalence',
      renderedForm: 'Affects 6% of adults',
      entityIds: ['anxiety'],
      sourceIds: [],
      locations: [{ entitySlug: 'anxiety', sectionType: 'overview' }],
    });

    expect(claim.confidence).toBe('unsupported');
    expect(claim.confidenceScore).toBe(0);
    expect(claim.flags).toContain('needs_source');
  });

  it('should merge locations for duplicate claims', () => {
    const claim1 = registerClaim({
      claimType: 'mechanism',
      renderedForm: 'Inhibits serotonin reuptake',
      entityIds: ['ssri'],
      sourceIds: ['doi:10.1016/high.quality'],
      locations: [{ entitySlug: 'escitalopram', sectionType: 'mechanism' }],
    });

    const claim2 = registerClaim({
      claimType: 'mechanism',
      renderedForm: 'Inhibits serotonin reuptake',
      entityIds: ['ssri'],
      sourceIds: ['doi:10.1016/high.quality'],
      locations: [{ entitySlug: 'sertraline', sectionType: 'mechanism' }],
    });

    expect(claim1.id).toBe(claim2.id);
    expect(claim1.locations.length).toBe(2);
  });
});

describe('Medical Claim Ledger - Retrieval', () => {
  beforeEach(() => {
    clearLedger();
    clearRegistry();

    registerSource({
      doi: '10.1016/test.source',
      title: 'Test Source',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'A',
    });

    registerClaim({
      claimType: 'efficacy',
      renderedForm: 'Test efficacy claim',
      entityIds: ['entity-1', 'entity-2'],
      sourceIds: ['doi:10.1016/test.source'],
      locations: [{ entitySlug: 'entity-1' }],
    });

    registerClaim({
      claimType: 'side_effect',
      renderedForm: 'Test side effect claim',
      entityIds: ['entity-1'],
      sourceIds: [],
      locations: [{ entitySlug: 'entity-1' }],
    });
  });

  it('should get claims for entity', () => {
    const claims = getClaimsForEntity('entity-1');
    expect(claims.length).toBe(2);
  });

  it('should get claims for source', () => {
    const claims = getClaimsForSource('doi:10.1016/test.source');
    expect(claims.length).toBe(1);
    expect(claims[0].claimType).toBe('efficacy');
  });

  it('should get claims by type', () => {
    const efficacyClaims = getClaimsByType('efficacy');
    expect(efficacyClaims.length).toBe(1);

    const sideEffectClaims = getClaimsByType('side_effect');
    expect(sideEffectClaims.length).toBe(1);
  });

  it('should get unsupported claims', () => {
    const unsupported = getUnsupportedClaims();
    expect(unsupported.length).toBe(1);
    expect(unsupported[0].claimType).toBe('side_effect');
  });
});

describe('Medical Claim Ledger - Confidence Calculation', () => {
  beforeEach(() => {
    clearLedger();
    clearRegistry();

    // Register sources with different evidence levels
    registerSource({
      doi: '10.1016/level.a',
      title: 'Level A Source',
      sourceType: 'meta_analysis',
      evidenceLevel: 'A',
    });

    registerSource({
      doi: '10.1016/level.b',
      title: 'Level B Source',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'B',
    });

    registerSource({
      doi: '10.1016/level.c',
      title: 'Level C Source',
      sourceType: 'textbook',
      evidenceLevel: 'C',
    });
  });

  it('should have high confidence with level A source', () => {
    const claim = registerClaim({
      claimType: 'efficacy',
      renderedForm: 'Test claim',
      entityIds: ['test'],
      sourceIds: ['doi:10.1016/level.a'],
      locations: [{ entitySlug: 'test' }],
    });

    expect(claim.confidence).toBe('high');
  });

  it('should boost confidence with multiple moderate-quality sources', () => {
    // Register another B-level source
    registerSource({
      doi: '10.1016/level.b2',
      title: 'Level B Source 2',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'B',
    });

    const singleSource = registerClaim({
      claimType: 'efficacy',
      renderedForm: 'Single source claim',
      entityIds: ['test1'],
      sourceIds: ['doi:10.1016/level.b'],
      locations: [{ entitySlug: 'test1' }],
    });

    const multiSource = registerClaim({
      claimType: 'efficacy',
      renderedForm: 'Multi source claim',
      entityIds: ['test2'],
      sourceIds: ['doi:10.1016/level.b', 'doi:10.1016/level.b2'],
      locations: [{ entitySlug: 'test2' }],
    });

    // Multiple same-quality sources should boost confidence via multi-source bonus
    // Single B = 0.7, Two B's = 0.7 + 0.05 = 0.75
    expect(multiSource.confidenceScore).toBeGreaterThan(singleSource.confidenceScore);
  });

  it('should have low confidence with only level C source', () => {
    const claim = registerClaim({
      claimType: 'efficacy',
      renderedForm: 'Weak claim',
      entityIds: ['test'],
      sourceIds: ['doi:10.1016/level.c'],
      locations: [{ entitySlug: 'test' }],
    });

    expect(claim.confidence).toBe('low');
    expect(claim.flags).toContain('weak_evidence');
  });
});

describe('Medical Claim Ledger - Claim Modification', () => {
  beforeEach(() => {
    clearLedger();
    clearRegistry();

    registerSource({
      doi: '10.1016/new.source',
      title: 'New Source',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'A',
    });
  });

  it('should add source to existing claim', () => {
    const claim = registerClaim({
      claimType: 'dosage',
      renderedForm: 'Test dosage',
      entityIds: ['test'],
      sourceIds: [],
      locations: [{ entitySlug: 'test' }],
    });

    expect(claim.confidence).toBe('unsupported');

    const success = addSourceToClaim(claim.id, 'doi:10.1016/new.source');
    expect(success).toBe(true);

    const updated = getClaim(claim.id);
    expect(updated?.confidence).toBe('high');
    expect(updated?.sourceIds).toContain('doi:10.1016/new.source');
  });

  it('should mark claim as reviewed', () => {
    const claim = registerClaim({
      claimType: 'general',
      renderedForm: 'Test claim',
      entityIds: ['test'],
      sourceIds: [],
      locations: [{ entitySlug: 'test' }],
    });

    const success = markClaimReviewed(claim.id, 'Verified by clinical team');
    expect(success).toBe(true);

    const updated = getClaim(claim.id);
    expect(updated?.lastVerified).toBeDefined();
    expect(updated?.reviewNotes).toBe('Verified by clinical team');
  });
});

describe('Medical Claim Ledger - Statistics', () => {
  beforeEach(() => {
    clearLedger();
    clearRegistry();

    registerSource({
      doi: '10.1016/test.source',
      title: 'Test Source',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'A',
    });

    registerClaim({
      claimType: 'efficacy',
      renderedForm: 'Supported claim',
      entityIds: ['entity-1'],
      sourceIds: ['doi:10.1016/test.source'],
      locations: [{ entitySlug: 'entity-1' }],
    });

    registerClaim({
      claimType: 'dosage',
      renderedForm: 'Unsupported claim',
      entityIds: ['entity-1'],
      sourceIds: [],
      locations: [{ entitySlug: 'entity-1' }],
    });
  });

  it('should calculate ledger statistics', () => {
    const stats = getLedgerStats();

    expect(stats.totalClaims).toBe(2);
    expect(stats.byType.efficacy).toBe(1);
    expect(stats.byType.dosage).toBe(1);
    expect(stats.byConfidence.high).toBe(1);
    expect(stats.byConfidence.unsupported).toBe(1);
    expect(stats.claimsNeedingSource).toBe(1);
  });

  it('should calculate entity claim coverage', () => {
    const coverage = getEntityClaimCoverage('entity-1');

    expect(coverage.total).toBe(2);
    expect(coverage.supported).toBe(1);
    expect(coverage.byConfidence.high).toBe(1);
    expect(coverage.byConfidence.unsupported).toBe(1);
    expect(coverage.flags).toContain('needs_source');
  });
});

describe('Medical Claim Ledger - Flags', () => {
  beforeEach(() => {
    clearLedger();
    clearRegistry();

    // Old source
    registerSource({
      doi: '10.1016/old.source',
      title: 'Old Source',
      year: 2015,
      sourceType: 'peer_reviewed',
      evidenceLevel: 'B',
    });
  });

  it('should flag outdated sources', () => {
    const claim = registerClaim({
      claimType: 'efficacy',
      renderedForm: 'Old claim',
      entityIds: ['test'],
      sourceIds: ['doi:10.1016/old.source'],
      locations: [{ entitySlug: 'test' }],
    });

    expect(claim.flags).toContain('outdated');
  });

  it('should flag sensitive claim types', () => {
    registerSource({
      doi: '10.1016/recent.source',
      title: 'Recent Source',
      year: 2024,
      sourceType: 'peer_reviewed',
      evidenceLevel: 'A',
    });

    const interactionClaim = registerClaim({
      claimType: 'interaction',
      renderedForm: 'Drug interaction',
      entityIds: ['test'],
      sourceIds: ['doi:10.1016/recent.source'],
      locations: [{ entitySlug: 'test' }],
    });

    expect(interactionClaim.flags).toContain('sensitive');

    const contraindicationClaim = registerClaim({
      claimType: 'contraindication',
      renderedForm: 'Contraindication',
      entityIds: ['test2'],
      sourceIds: ['doi:10.1016/recent.source'],
      locations: [{ entitySlug: 'test2' }],
    });

    expect(contraindicationClaim.flags).toContain('sensitive');
  });
});

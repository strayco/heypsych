/**
 * Clinical Source Registry Tests
 *
 * @see Phase C of Wave 3 directive
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerSource,
  getSource,
  getSourceByDOI,
  getSourceByPMID,
  getSourcesForTopic,
  validateSource,
  linkSourceToEntity,
  getSourcesForEntity,
  getRegistryStats,
  clearRegistry,
  registerCommonSources,
  type ClinicalSource,
} from '@/lib/trust/clinical-source-registry';

describe('Clinical Source Registry - Registration', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('should register a source with DOI', () => {
    const source = registerSource({
      doi: '10.1016/S0140-6736(17)32802-7',
      title: 'Comparative efficacy of antidepressants',
      year: 2018,
      authors: ['Cipriani, A', 'et al'],
      publication: 'The Lancet',
      sourceType: 'meta_analysis',
      evidenceLevel: 'A',
    });

    expect(source.id).toBe('doi:10.1016/S0140-6736(17)32802-7');
    expect(source.verificationStatus).toBe('pending');
  });

  it('should register a source with PMID', () => {
    const source = registerSource({
      pmid: '29477251',
      title: 'Antidepressant meta-analysis',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'A',
    });

    expect(source.id).toBe('pmid:29477251');
  });

  it('should not duplicate sources with same DOI', () => {
    const source1 = registerSource({
      doi: '10.1016/test.123',
      title: 'First registration',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'B',
    });

    const source2 = registerSource({
      doi: '10.1016/test.123',
      title: 'Duplicate registration',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'B',
    });

    expect(source1.id).toBe(source2.id);
    expect(source1.title).toBe('First registration');
  });
});

describe('Clinical Source Registry - Retrieval', () => {
  beforeEach(() => {
    clearRegistry();

    registerSource({
      doi: '10.1016/test.doi',
      pmid: '12345678',
      title: 'Test Source',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'A',
      topics: ['depression', 'anxiety'],
    });
  });

  it('should retrieve source by ID', () => {
    const source = getSource('doi:10.1016/test.doi');
    expect(source?.title).toBe('Test Source');
  });

  it('should retrieve source by DOI', () => {
    const source = getSourceByDOI('10.1016/test.doi');
    expect(source?.title).toBe('Test Source');
  });

  it('should retrieve source by PMID', () => {
    const source = getSourceByPMID('12345678');
    expect(source?.title).toBe('Test Source');
  });

  it('should retrieve sources by topic', () => {
    const sources = getSourcesForTopic('depression');
    expect(sources.length).toBe(1);
    expect(sources[0].title).toBe('Test Source');
  });
});

describe('Clinical Source Registry - Validation', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('should validate a complete source', async () => {
    const source = registerSource({
      doi: '10.1016/valid.doi',
      title: 'Valid Source',
      year: 2020,
      sourceType: 'peer_reviewed',
      evidenceLevel: 'A',
    });

    const result = await validateSource(source);

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.source.verificationStatus).toBe('verified');
  });

  it('should reject source without title', async () => {
    const source = registerSource({
      doi: '10.1016/no.title',
      title: '', // Empty title
      sourceType: 'peer_reviewed',
      evidenceLevel: 'A',
    });

    const result = await validateSource(source);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  it('should reject source without any identifier', async () => {
    const source = registerSource({
      title: 'No identifiers',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'A',
    });

    const result = await validateSource(source);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one identifier (DOI, PMID, or URL) is required');
  });

  it('should warn about evidence level inconsistency', async () => {
    const source = registerSource({
      doi: '10.1016/preprint.doi',
      title: 'High-rated preprint',
      sourceType: 'preprint',
      evidenceLevel: 'A', // Too high for preprint
    });

    const result = await validateSource(source);

    expect(result.warnings).toContain('Preprints should not be rated as evidence level A or B');
  });

  it('should warn about old sources', async () => {
    const source = registerSource({
      doi: '10.1016/old.doi',
      title: 'Old source',
      year: 2010,
      sourceType: 'peer_reviewed',
      evidenceLevel: 'B',
    });

    const result = await validateSource(source);

    expect(result.warnings.some(w => w.includes('over 10 years old'))).toBe(true);
  });

  it('should reject invalid DOI format', async () => {
    const source = registerSource({
      doi: 'invalid-doi-format',
      title: 'Invalid DOI',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'B',
    });

    const result = await validateSource(source);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid DOI format'))).toBe(true);
  });
});

describe('Clinical Source Registry - Entity Linking', () => {
  beforeEach(() => {
    clearRegistry();

    registerSource({
      doi: '10.1016/linked.source',
      title: 'Linked Source',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'A',
    });
  });

  it('should link source to entity', () => {
    const linked = linkSourceToEntity('doi:10.1016/linked.source', 'entity-123');
    expect(linked).toBe(true);

    const source = getSource('doi:10.1016/linked.source');
    expect(source?.referencedBy).toContain('entity-123');
  });

  it('should get sources for entity', () => {
    linkSourceToEntity('doi:10.1016/linked.source', 'entity-456');

    const sources = getSourcesForEntity('entity-456');
    expect(sources.length).toBe(1);
    expect(sources[0].title).toBe('Linked Source');
  });

  it('should not duplicate entity links', () => {
    linkSourceToEntity('doi:10.1016/linked.source', 'entity-789');
    linkSourceToEntity('doi:10.1016/linked.source', 'entity-789');

    const source = getSource('doi:10.1016/linked.source');
    const entityCount = source?.referencedBy?.filter(e => e === 'entity-789').length;
    expect(entityCount).toBe(1);
  });
});

describe('Clinical Source Registry - Statistics', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('should calculate registry statistics', () => {
    registerSource({
      doi: '10.1016/a.source',
      title: 'A-level source',
      sourceType: 'meta_analysis',
      evidenceLevel: 'A',
    });

    registerSource({
      doi: '10.1016/b.source',
      title: 'B-level source',
      sourceType: 'peer_reviewed',
      evidenceLevel: 'B',
    });

    const stats = getRegistryStats();

    expect(stats.totalSources).toBe(2);
    expect(stats.byType.meta_analysis).toBe(1);
    expect(stats.byType.peer_reviewed).toBe(1);
    expect(stats.byEvidenceLevel.A).toBe(1);
    expect(stats.byEvidenceLevel.B).toBe(1);
    expect(stats.sourcesNeedingVerification).toBe(2); // Both pending
  });
});

describe('Clinical Source Registry - Common Sources', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('should register common sources', () => {
    registerCommonSources();

    const stats = getRegistryStats();
    expect(stats.totalSources).toBeGreaterThan(0);

    // Check Cipriani meta-analysis is registered
    const cipriani = getSourceByDOI('10.1016/S0140-6736(17)32802-7');
    expect(cipriani).not.toBeUndefined();
    expect(cipriani?.evidenceLevel).toBe('A');
    expect(cipriani?.sourceType).toBe('meta_analysis');
  });
});

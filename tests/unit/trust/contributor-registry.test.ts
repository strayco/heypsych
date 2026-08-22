/**
 * Contributor Registry Tests
 *
 * @see Phase E of Wave 3 directive
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerContributor,
  getContributor,
  getContributorBySlug,
  getContributorByNPI,
  getContributorByORCID,
  getContributorsByRole,
  getContributorsNeedingAttention,
  assessContributorIntegrity,
  passesEEATRequirements,
  linkContributorToEntity,
  getContributorsForEntity,
  verifyCredential,
  addNPIToContributor,
  getRegistryStats,
  clearContributorRegistry,
  type Contributor,
} from '@/lib/trust/contributor-registry';

describe('Contributor Registry - Registration', () => {
  beforeEach(() => {
    clearContributorRegistry();
  });

  it('should register a contributor with credentials', () => {
    const contributor = registerContributor({
      name: 'Dr. Sarah Chen',
      roles: ['medical_reviewer'],
      credentialString: 'MD, Board-Certified Psychiatrist',
      specialty: 'Psychiatry',
    });

    expect(contributor.id).toContain('medical_reviewer:dr-sarah-chen');
    expect(contributor.name).toBe('Dr. Sarah Chen');
    expect(contributor.roles).toContain('medical_reviewer');
    expect(contributor.credentials.length).toBeGreaterThan(0);
    expect(contributor.credentials.some(c => c.type === 'md')).toBe(true);
  });

  it('should not duplicate contributors by slug', () => {
    const first = registerContributor({
      name: 'Dr. John Smith',
      slug: 'john-smith',
      roles: ['author'],
    });

    const second = registerContributor({
      name: 'Dr. John Smith',
      slug: 'john-smith',
      roles: ['medical_reviewer'],
    });

    expect(first.id).toBe(second.id);
  });

  it('should not duplicate contributors by NPI', () => {
    const first = registerContributor({
      name: 'Dr. Alice Brown',
      roles: ['medical_reviewer'],
      credentials: [{ type: 'npi', value: '1234567890' }],
    });

    const second = registerContributor({
      name: 'Alice Brown MD',
      roles: ['author'],
      credentials: [{ type: 'npi', value: '1234567890' }],
    });

    expect(first.id).toBe(second.id);
  });

  it('should parse credential string into typed credentials', () => {
    const contributor = registerContributor({
      name: 'Dr. Test',
      roles: ['medical_reviewer'],
      credentialString: 'MD, PhD, Board-Certified Psychiatrist, LCSW',
    });

    const types = contributor.credentials.map(c => c.type);
    expect(types).toContain('md');
    expect(types).toContain('phd');
    expect(types).toContain('board_cert');
    expect(types).toContain('lcsw');
  });
});

describe('Contributor Registry - Retrieval', () => {
  beforeEach(() => {
    clearContributorRegistry();

    registerContributor({
      name: 'Dr. Reviewer',
      slug: 'reviewer',
      roles: ['medical_reviewer'],
      credentials: [{ type: 'npi', value: '1111111111' }],
    });

    registerContributor({
      name: 'Jane Author',
      slug: 'author',
      roles: ['author'],
      credentials: [{ type: 'orcid', value: '0000-0001-2345-6789' }],
    });
  });

  it('should retrieve by slug', () => {
    const contributor = getContributorBySlug('reviewer');
    expect(contributor?.name).toBe('Dr. Reviewer');
  });

  it('should retrieve by NPI', () => {
    const contributor = getContributorByNPI('1111111111');
    expect(contributor?.name).toBe('Dr. Reviewer');
  });

  it('should retrieve by ORCID', () => {
    const contributor = getContributorByORCID('0000-0001-2345-6789');
    expect(contributor?.name).toBe('Jane Author');
  });

  it('should retrieve by role', () => {
    const reviewers = getContributorsByRole('medical_reviewer');
    expect(reviewers.length).toBe(1);
    expect(reviewers[0].name).toBe('Dr. Reviewer');
  });
});

describe('Contributor Registry - Integrity Assessment', () => {
  beforeEach(() => {
    clearContributorRegistry();
  });

  it('should flag missing verifiable credentials', () => {
    const contributor = registerContributor({
      name: 'Dr. No Credentials',
      roles: ['medical_reviewer'],
      // No NPI, ORCID, or board cert
    });

    const flags = assessContributorIntegrity(contributor);
    expect(flags.missingVerifiableCredentials).toBe(true);
  });

  it('should flag generic team names', () => {
    const contributor = registerContributor({
      name: 'Medical Team',
      roles: ['medical_reviewer'],
    });

    const flags = assessContributorIntegrity(contributor);
    expect(flags.genericName).toBe(true);
  });

  it('should flag missing external verification', () => {
    const contributor = registerContributor({
      name: 'Dr. No External',
      roles: ['medical_reviewer'],
      credentialString: 'MD',
      // No externalUrls
    });

    const flags = assessContributorIntegrity(contributor);
    expect(flags.noExternalVerification).toBe(true);
  });

  it('should identify contributors needing attention', () => {
    registerContributor({
      name: 'Medical Team', // Generic name
      roles: ['medical_reviewer'],
    });

    registerContributor({
      name: 'Dr. Good',
      roles: ['medical_reviewer'],
      credentials: [{ type: 'npi', value: '9999999999', status: 'verified' }],
      externalUrls: { npiUrl: 'https://npiregistry.cms.hhs.gov' },
    });

    const needingAttention = getContributorsNeedingAttention();
    expect(needingAttention.length).toBe(1);
    expect(needingAttention[0].name).toBe('Medical Team');
  });
});

describe('Contributor Registry - E-E-A-T Requirements', () => {
  beforeEach(() => {
    clearContributorRegistry();
  });

  it('should pass E-E-A-T with verified credentials', () => {
    const contributor = registerContributor({
      name: 'Dr. Verified',
      roles: ['medical_reviewer'],
      credentials: [
        { type: 'npi', value: '1234567890', status: 'verified' },
        { type: 'board_cert', status: 'verified' },
      ],
      specialty: 'Psychiatry',
    });

    expect(passesEEATRequirements(contributor)).toBe(true);
  });

  it('should fail E-E-A-T without verified credentials', () => {
    const contributor = registerContributor({
      name: 'Dr. Unverified',
      roles: ['medical_reviewer'],
      credentialString: 'MD',
      // Credentials not verified
    });

    expect(passesEEATRequirements(contributor)).toBe(false);
  });

  it('should fail E-E-A-T with generic name', () => {
    const contributor = registerContributor({
      name: 'Editorial Team',
      roles: ['medical_reviewer'],
      credentials: [{ type: 'board_cert', status: 'verified' }],
    });

    expect(passesEEATRequirements(contributor)).toBe(false);
  });
});

describe('Contributor Registry - Entity Linking', () => {
  beforeEach(() => {
    clearContributorRegistry();
  });

  it('should link contributor to entity', () => {
    const contributor = registerContributor({
      name: 'Dr. Linked',
      roles: ['medical_reviewer'],
    });

    const success = linkContributorToEntity(contributor.id, 'escitalopram');
    expect(success).toBe(true);

    const updated = getContributor(contributor.id);
    expect(updated?.linkedEntities).toContain('escitalopram');
  });

  it('should get contributors for entity', () => {
    const reviewer = registerContributor({
      name: 'Dr. Reviewer',
      roles: ['medical_reviewer'],
    });

    const author = registerContributor({
      name: 'Jane Author',
      roles: ['author'],
    });

    linkContributorToEntity(reviewer.id, 'depression');
    linkContributorToEntity(author.id, 'depression');

    const contributors = getContributorsForEntity('depression');
    expect(contributors.length).toBe(2);
  });
});

describe('Contributor Registry - Verification', () => {
  beforeEach(() => {
    clearContributorRegistry();
  });

  it('should verify a credential', () => {
    const contributor = registerContributor({
      name: 'Dr. Pending',
      roles: ['medical_reviewer'],
      credentials: [{ type: 'npi', value: '1234567890', status: 'pending' }],
    });

    const success = verifyCredential(contributor.id, 'npi', 'NPPES API');
    expect(success).toBe(true);

    const updated = getContributor(contributor.id);
    const npiCredential = updated?.credentials.find(c => c.type === 'npi');
    expect(npiCredential?.status).toBe('verified');
    expect(npiCredential?.verificationSource).toBe('NPPES API');
  });

  it('should add NPI to existing contributor', () => {
    const contributor = registerContributor({
      name: 'Dr. No NPI',
      roles: ['medical_reviewer'],
      credentialString: 'MD',
    });

    const success = addNPIToContributor(contributor.id, '9876543210');
    expect(success).toBe(true);

    const updated = getContributor(contributor.id);
    expect(updated?.credentials.some(c => c.type === 'npi' && c.value === '9876543210')).toBe(true);

    // Should be able to find by NPI now
    const found = getContributorByNPI('9876543210');
    expect(found?.id).toBe(contributor.id);
  });
});

describe('Contributor Registry - Statistics', () => {
  beforeEach(() => {
    clearContributorRegistry();

    registerContributor({
      name: 'Dr. Verified',
      roles: ['medical_reviewer'],
      credentials: [{ type: 'npi', value: '1111111111', status: 'verified' }],
    });

    registerContributor({
      name: 'Dr. Partial',
      roles: ['medical_reviewer', 'author'],
      credentials: [
        { type: 'md', status: 'verified' },
        { type: 'board_cert', status: 'pending' },
      ],
    });

    registerContributor({
      name: 'Jane Unverified',
      roles: ['author'],
      credentials: [{ type: 'orcid', value: '0000-0001-2345-6789', status: 'unverified' }],
    });
  });

  it('should calculate registry statistics', () => {
    const stats = getRegistryStats();

    expect(stats.totalContributors).toBe(3);
    expect(stats.byRole.medical_reviewer).toBe(2);
    expect(stats.byRole.author).toBe(2);
    expect(stats.byVerificationStatus.verified).toBe(1);
    expect(stats.byVerificationStatus.partial).toBe(1);
    expect(stats.byVerificationStatus.unverified).toBe(1);
    expect(stats.withNPI).toBe(1);
    expect(stats.withORCID).toBe(1);
  });
});

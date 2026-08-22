/**
 * Tests for Answer King Registry
 * @see src/lib/seo/answer-king-registry.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  identifyTopicCluster,
  getBaseTopicCluster,
  registerAnswerKing,
  addVariant,
  isAnswerKing,
  getAnswerKingFor,
  getAllAnswerKings,
  electAnswerKing,
  triggerReElection,
  manuallyDesignateAnswerKing,
  removeManualOverride,
  getRegistryStats,
  exportRegistry,
  importRegistry,
  clearRegistry,
} from '@/lib/seo/answer-king-registry';

// ============ SETUP ============

beforeEach(() => {
  clearRegistry();
});

// ============ TOPIC CLUSTER IDENTIFICATION TESTS ============

describe('Topic Cluster Identification', () => {
  it('should identify treatment-for-condition clusters', () => {
    const result = identifyTopicCluster('/guide/lexapro-for-anxiety');

    expect(result).not.toBeNull();
    expect(result?.clusterId).toContain('treatment-condition');
    expect(result?.clusterLabel).toContain('lexapro');
    expect(result?.clusterLabel).toContain('anxiety');
  });

  it('should identify treatment-condition-demographic clusters', () => {
    const result = identifyTopicCluster('/guide/lexapro-for-anxiety-in-elderly');

    expect(result).not.toBeNull();
    expect(result?.clusterId).toContain('treatment-condition-demographic');
    expect(result?.captures).toContain('elderly');
  });

  it('should identify treatment-side-effects clusters', () => {
    const result = identifyTopicCluster('/guide/lexapro-side-effects');

    expect(result).not.toBeNull();
    expect(result?.clusterId).toContain('treatment-side-effects');
  });

  it('should identify treatment-vs-treatment clusters', () => {
    const result = identifyTopicCluster('/guide/lexapro-vs-zoloft-for-anxiety');

    expect(result).not.toBeNull();
    expect(result?.clusterId).toContain('treatment-vs-treatment');
    expect(result?.captures).toContain('lexapro');
    expect(result?.captures).toContain('zoloft');
  });

  it('should identify condition-symptoms clusters', () => {
    const result = identifyTopicCluster('/guide/anxiety-symptoms');

    expect(result).not.toBeNull();
    expect(result?.clusterId).toContain('condition-symptoms');
  });

  it('should identify treatment entity clusters', () => {
    const result = identifyTopicCluster('/treatments/lexapro');

    expect(result).not.toBeNull();
    expect(result?.clusterId).toContain('treatment-entity');
    expect(result?.routeFamily).toBe('treatments');
  });

  it('should identify condition entity clusters', () => {
    const result = identifyTopicCluster('/conditions/anxiety');

    expect(result).not.toBeNull();
    expect(result?.clusterId).toContain('condition-entity');
    expect(result?.routeFamily).toBe('conditions');
  });

  it('should return null for unmatched paths', () => {
    const result = identifyTopicCluster('/random/path/here');

    expect(result).toBeNull();
  });
});

// ============ BASE TOPIC CLUSTER TESTS ============

describe('Base Topic Cluster', () => {
  it('should strip demographic suffix from cluster ID', () => {
    const clusterId = 'treatment-condition-demographic:lexapro:anxiety:elderly';
    const base = getBaseTopicCluster(clusterId);

    expect(base).not.toContain('elderly');
    expect(base).toContain('lexapro');
    expect(base).toContain('anxiety');
  });

  it('should return unchanged for base clusters', () => {
    const clusterId = 'treatment-condition:lexapro:anxiety';
    const base = getBaseTopicCluster(clusterId);

    expect(base).toBe(clusterId);
  });
});

// ============ ANSWER KING REGISTRATION TESTS ============

describe('Answer King Registration', () => {
  it('should register a path as answer king', () => {
    const entry = registerAnswerKing('/guide/lexapro-for-anxiety');

    expect(entry).not.toBeNull();
    expect(entry?.canonicalPath).toBe('/guide/lexapro-for-anxiety');
    expect(entry?.electionMethod).toBe('auto');
    expect(entry?.confidence).toBe(1.0);
  });

  it('should register with variants', () => {
    const entry = registerAnswerKing('/guide/lexapro-for-anxiety', {
      variants: [
        '/guide/lexapro-for-anxiety-in-elderly',
        '/guide/lexapro-for-anxiety-in-teenagers',
      ],
    });

    expect(entry?.variants).toHaveLength(2);
    expect(entry?.variants).toContain('/guide/lexapro-for-anxiety-in-elderly');
  });

  it('should register with GSC performance data', () => {
    const entry = registerAnswerKing('/guide/lexapro-for-anxiety', {
      electionMethod: 'gsc_performance',
      gscPerformance: {
        impressions: 1000,
        clicks: 100,
        ctr: 0.1,
        position: 3.5,
        lastFetched: new Date().toISOString(),
      },
    });

    expect(entry?.electionMethod).toBe('gsc_performance');
    expect(entry?.gscPerformance?.impressions).toBe(1000);
  });

  it('should return null for unidentifiable paths', () => {
    const entry = registerAnswerKing('/random/unmatched/path');

    expect(entry).toBeNull();
  });
});

// ============ ANSWER KING LOOKUP TESTS ============

describe('Answer King Lookups', () => {
  beforeEach(() => {
    registerAnswerKing('/guide/lexapro-for-anxiety', {
      variants: ['/guide/lexapro-for-anxiety-in-elderly'],
    });
  });

  it('should identify answer king correctly', () => {
    expect(isAnswerKing('/guide/lexapro-for-anxiety')).toBe(true);
    expect(isAnswerKing('/guide/lexapro-for-anxiety-in-elderly')).toBe(false);
  });

  it('should return answer king for variant', () => {
    const king = getAnswerKingFor('/guide/lexapro-for-anxiety-in-elderly');

    expect(king).toBe('/guide/lexapro-for-anxiety');
  });

  it('should return undefined for answer king looking up itself', () => {
    const king = getAnswerKingFor('/guide/lexapro-for-anxiety');

    expect(king).toBeUndefined();
  });

  it('should return undefined for unknown paths', () => {
    const king = getAnswerKingFor('/guide/unknown-page');

    expect(king).toBeUndefined();
  });
});

// ============ VARIANT MANAGEMENT TESTS ============

describe('Variant Management', () => {
  beforeEach(() => {
    registerAnswerKing('/guide/lexapro-for-anxiety');
  });

  it('should add variant to existing answer king', () => {
    const result = addVariant(
      '/guide/lexapro-for-anxiety-in-women',
      '/guide/lexapro-for-anxiety'
    );

    expect(result).toBe(true);

    const king = getAnswerKingFor('/guide/lexapro-for-anxiety-in-women');
    expect(king).toBe('/guide/lexapro-for-anxiety');
  });

  it('should not add variant for non-existent answer king', () => {
    const result = addVariant(
      '/guide/some-variant',
      '/guide/non-existent-king'
    );

    expect(result).toBe(false);
  });
});

// ============ ELECTION TESTS ============

describe('Answer King Election', () => {
  it('should elect highest scoring candidate', () => {
    const candidates = [
      {
        path: '/guide/lexapro-for-anxiety',
        wordCount: 1500,
        uniquenessScore: 0.9,
        safetyScore: 0.95,
        hasDemographic: false,
      },
      {
        path: '/guide/lexapro-for-anxiety-in-elderly',
        wordCount: 800,
        uniquenessScore: 0.8,
        safetyScore: 0.9,
        hasDemographic: true,
      },
    ];

    const elected = electAnswerKing(candidates);

    expect(elected).toBe('/guide/lexapro-for-anxiety');
  });

  it('should prefer non-demographic pages', () => {
    const candidates = [
      {
        path: '/guide/lexapro-for-anxiety',
        wordCount: 800,
        uniquenessScore: 0.8,
        safetyScore: 0.8,
        hasDemographic: false,
      },
      {
        path: '/guide/lexapro-for-anxiety-in-elderly',
        wordCount: 900,
        uniquenessScore: 0.85,
        safetyScore: 0.85,
        hasDemographic: true,
      },
    ];

    const elected = electAnswerKing(candidates);

    // Should still prefer the non-demographic page
    expect(elected).toBe('/guide/lexapro-for-anxiety');
  });

  it('should boost based on GSC performance', () => {
    const candidates = [
      {
        path: '/guide/lexapro-for-anxiety',
        wordCount: 800,
        uniquenessScore: 0.8,
        safetyScore: 0.8,
        hasDemographic: false,
        gscImpressions: 50,
        gscClicks: 5,
      },
      {
        path: '/guide/escitalopram-for-anxiety',
        wordCount: 800,
        uniquenessScore: 0.8,
        safetyScore: 0.8,
        hasDemographic: false,
        gscImpressions: 5000,
        gscClicks: 500,
      },
    ];

    const elected = electAnswerKing(candidates);

    expect(elected).toBe('/guide/escitalopram-for-anxiety');
  });

  it('should return undefined for empty candidates', () => {
    const elected = electAnswerKing([]);

    expect(elected).toBeUndefined();
  });

  it('should return single candidate for single-item array', () => {
    const candidates = [
      {
        path: '/guide/lexapro-for-anxiety',
        wordCount: 800,
        uniquenessScore: 0.8,
        safetyScore: 0.8,
        hasDemographic: false,
      },
    ];

    const elected = electAnswerKing(candidates);

    expect(elected).toBe('/guide/lexapro-for-anxiety');
  });
});

// ============ RE-ELECTION TESTS ============

describe('Answer King Re-Election', () => {
  it('should not re-elect manually overridden kings', () => {
    manuallyDesignateAnswerKing('/guide/lexapro-for-anxiety', [
      '/guide/lexapro-for-anxiety-in-elderly',
    ]);

    const cluster = identifyTopicCluster('/guide/lexapro-for-anxiety');
    if (!cluster) throw new Error('Should identify cluster');

    const entry = triggerReElection(cluster.clusterId, [
      { path: '/guide/lexapro-for-anxiety', impressions: 100, clicks: 10, ctr: 0.1, position: 5 },
      { path: '/guide/lexapro-for-anxiety-in-elderly', impressions: 1000, clicks: 200, ctr: 0.2, position: 2 },
    ]);

    // Should keep original king because of manual override
    expect(entry?.canonicalPath).toBe('/guide/lexapro-for-anxiety');
  });

  it('should re-elect when variant significantly outperforms', () => {
    registerAnswerKing('/guide/lexapro-for-anxiety', {
      variants: ['/guide/escitalopram-for-anxiety'],
      electionMethod: 'auto',
    });

    const cluster = identifyTopicCluster('/guide/lexapro-for-anxiety');
    if (!cluster) throw new Error('Should identify cluster');

    const entry = triggerReElection(cluster.clusterId, [
      { path: '/guide/lexapro-for-anxiety', impressions: 100, clicks: 5, ctr: 0.05, position: 8 },
      { path: '/guide/escitalopram-for-anxiety', impressions: 1000, clicks: 200, ctr: 0.2, position: 2 },
    ]);

    // Should re-elect to better performing variant
    expect(entry?.canonicalPath).toBe('/guide/escitalopram-for-anxiety');
    expect(entry?.electionMethod).toBe('gsc_performance');
  });
});

// ============ MANUAL OVERRIDE TESTS ============

describe('Manual Overrides', () => {
  it('should create manual designation', () => {
    const entry = manuallyDesignateAnswerKing('/guide/lexapro-for-anxiety');

    expect(entry?.manualOverride).toBe(true);
    expect(entry?.electionMethod).toBe('manual');
    expect(entry?.confidence).toBe(1.0);
  });

  it('should remove manual override', () => {
    manuallyDesignateAnswerKing('/guide/lexapro-for-anxiety');

    const cluster = identifyTopicCluster('/guide/lexapro-for-anxiety');
    if (!cluster) throw new Error('Should identify cluster');

    const result = removeManualOverride(cluster.clusterId);

    expect(result).toBe(true);
  });
});

// ============ STATISTICS TESTS ============

describe('Registry Statistics', () => {
  beforeEach(() => {
    registerAnswerKing('/guide/lexapro-for-anxiety', {
      variants: ['/guide/lexapro-for-anxiety-in-elderly'],
    });
    registerAnswerKing('/guide/zoloft-side-effects');
    manuallyDesignateAnswerKing('/treatments/prozac');
  });

  it('should calculate correct statistics', () => {
    const stats = getRegistryStats();

    expect(stats.totalClusters).toBe(3);
    expect(stats.totalAnswerKings).toBe(3);
    expect(stats.totalVariants).toBe(1);
    expect(stats.byElectionMethod.auto).toBe(2);
    expect(stats.byElectionMethod.manual).toBe(1);
  });
});

// ============ PERSISTENCE TESTS ============

describe('Registry Persistence', () => {
  it('should export and import registry', () => {
    registerAnswerKing('/guide/lexapro-for-anxiety', {
      variants: ['/guide/lexapro-for-anxiety-in-elderly'],
    });
    registerAnswerKing('/guide/zoloft-side-effects');

    const exported = exportRegistry();
    clearRegistry();

    expect(getAllAnswerKings()).toHaveLength(0);

    importRegistry(exported);

    expect(getAllAnswerKings()).toHaveLength(2);
    expect(isAnswerKing('/guide/lexapro-for-anxiety')).toBe(true);
    expect(getAnswerKingFor('/guide/lexapro-for-anxiety-in-elderly')).toBe('/guide/lexapro-for-anxiety');
  });

  it('should throw on invalid JSON import', () => {
    expect(() => importRegistry('invalid json')).toThrow('Invalid registry JSON');
  });
});

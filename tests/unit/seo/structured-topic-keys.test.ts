/**
 * Structured Topic Keys Tests
 *
 * Verifies that structured topic keys are used as the primary method
 * for topic cluster identification, with regex as fallback only.
 *
 * @see Phase B of Wave 3 directive
 */

import { describe, it, expect } from 'vitest';
import {
  buildTopicKeyFromEntity,
  topicKeyToClusterId,
  clusterIdToTopicKey,
  identifyTopicCluster,
  identifyTopicClusterFromEntity,
  type StructuredTopicKey,
} from '@/lib/seo/answer-king-registry';
import type { Entity } from '@/lib/types/database';

describe('Structured Topic Keys - Build from Entity', () => {
  it('should build topic key from condition entity', () => {
    const entity: Entity = {
      id: 'gad-1',
      schema_id: 'condition',
      name: 'Generalized Anxiety Disorder',
      slug: 'generalized-anxiety-disorder',
      type: 'condition',
      status: 'active',
      visibility: 'public',
      metadata: {
        category: 'anxiety-fear',
      },
      data: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    };

    const key = buildTopicKeyFromEntity(entity);

    expect(key).not.toBeNull();
    expect(key?.type).toBe('condition');
    expect(key?.category).toBe('anxiety-fear');
    expect(key?.identifier).toBe('generalized-anxiety-disorder');
  });

  it('should build topic key from medication entity', () => {
    const entity: Entity = {
      id: 'escitalopram-1',
      schema_id: 'treatment',
      name: 'Escitalopram (Lexapro)',
      slug: 'escitalopram',
      type: 'medication',
      status: 'active',
      visibility: 'public',
      metadata: {},
      data: {
        drug_classes: ['SSRI'],
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    };

    const key = buildTopicKeyFromEntity(entity);

    expect(key).not.toBeNull();
    expect(key?.type).toBe('treatment');
    expect(key?.category).toBe('SSRI');
    expect(key?.identifier).toBe('escitalopram');
  });

  it('should use explicit topic key from entity data when provided', () => {
    const explicitKey: StructuredTopicKey = {
      type: 'comparison',
      identifier: 'lexapro',
      secondaryIdentifier: 'zoloft',
    };

    const entity: Entity = {
      id: 'comparison-1',
      schema_id: 'guide',
      name: 'Lexapro vs Zoloft',
      slug: 'lexapro-vs-zoloft',
      type: 'treatment',
      status: 'active',
      visibility: 'public',
      metadata: {},
      data: {
        topicKey: explicitKey,
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    };

    const key = buildTopicKeyFromEntity(entity);

    expect(key).toEqual(explicitKey);
  });
});

describe('Structured Topic Keys - Serialization', () => {
  it('should convert topic key to cluster ID', () => {
    const key: StructuredTopicKey = {
      type: 'condition',
      category: 'anxiety-fear',
      identifier: 'generalized-anxiety-disorder',
    };

    const clusterId = topicKeyToClusterId(key);

    expect(clusterId).toBe('condition:anxiety-fear:generalized-anxiety-disorder');
  });

  it('should convert treatment-for-condition key to cluster ID', () => {
    const key: StructuredTopicKey = {
      type: 'treatment-for-condition',
      identifier: 'escitalopram',
      secondaryIdentifier: 'anxiety',
    };

    const clusterId = topicKeyToClusterId(key);

    expect(clusterId).toBe('treatment-for-condition:escitalopram:anxiety');
  });

  it('should handle demographic modifier', () => {
    const key: StructuredTopicKey = {
      type: 'treatment-for-condition',
      identifier: 'lexapro',
      secondaryIdentifier: 'anxiety',
      demographic: 'elderly',
    };

    const clusterId = topicKeyToClusterId(key);

    expect(clusterId).toBe('treatment-for-condition:lexapro:anxiety:demographic-elderly');
  });

  it('should parse cluster ID back to topic key', () => {
    const clusterId = 'condition:anxiety-fear:generalized-anxiety-disorder';
    const key = clusterIdToTopicKey(clusterId);

    expect(key).not.toBeNull();
    expect(key?.type).toBe('condition');
    expect(key?.category).toBe('anxiety-fear');
    expect(key?.identifier).toBe('generalized-anxiety-disorder');
  });
});

describe('Structured Topic Keys - Identification Priority', () => {
  it('should use structured key when available, not regex fallback', () => {
    const entity: Entity = {
      id: 'gad-1',
      schema_id: 'condition',
      name: 'Generalized Anxiety Disorder',
      slug: 'generalized-anxiety-disorder',
      type: 'condition',
      status: 'active',
      visibility: 'public',
      metadata: {
        category: 'anxiety-fear',
      },
      data: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    };

    const result = identifyTopicClusterFromEntity(entity);

    expect(result).not.toBeNull();
    expect(result?.identificationMethod).toBe('structured_key');
    expect(result?.structuredKey?.type).toBe('condition');
  });

  it('should fall back to regex for path-only identification', () => {
    const result = identifyTopicCluster('/guide/lexapro-for-anxiety');

    expect(result).not.toBeNull();
    expect(result?.identificationMethod).toBe('regex_fallback');
    expect(result?.clusterId).toContain('treatment-condition');
  });

  it('should return correct route family from structured key', () => {
    const conditionEntity: Entity = {
      id: 'gad-1',
      schema_id: 'condition',
      name: 'GAD',
      slug: 'gad',
      type: 'condition',
      status: 'active',
      visibility: 'public',
      metadata: {},
      data: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    };

    const result = identifyTopicClusterFromEntity(conditionEntity);

    expect(result?.routeFamily).toBe('conditions');
  });
});

describe('Regex Fallback - Pattern Matching', () => {
  it('should identify treatment-condition pattern', () => {
    const result = identifyTopicCluster('/guide/zoloft-for-depression');

    expect(result?.clusterId).toBe('treatment-condition:zoloft:depression');
    expect(result?.identificationMethod).toBe('regex_fallback');
  });

  it('should identify comparison pattern', () => {
    const result = identifyTopicCluster('/guide/prozac-vs-zoloft');

    expect(result?.clusterId).toBe('treatment-vs-treatment:prozac:zoloft');
  });

  it('should identify demographic pattern', () => {
    const result = identifyTopicCluster('/guide/lexapro-for-anxiety-in-elderly');

    expect(result?.clusterId).toBe('treatment-condition-demographic:lexapro:anxiety:elderly');
  });

  it('should identify entity page patterns', () => {
    const treatmentResult = identifyTopicCluster('/treatments/sertraline');
    expect(treatmentResult?.clusterId).toBe('treatment-entity:sertraline');

    const conditionResult = identifyTopicCluster('/conditions/depression');
    expect(conditionResult?.clusterId).toBe('condition-entity:depression');
  });
});

/**
 * Schema-Content Reconciler Tests
 *
 * @see Phase F of Wave 3 directive
 */

import { describe, it, expect } from 'vitest';
import {
  reconcileSchema,
  reconcileAllSchemas,
  schemasAreValid,
  getCriticalMismatches,
} from '@/lib/trust/schema-content-reconciler';
import type { Entity } from '@/lib/types/database';

describe('Schema-Content Reconciler - MedicalCondition', () => {
  const baseEntity: Entity = {
    id: 'depression',
    schema_id: 'condition',
    name: 'Major Depressive Disorder',
    slug: 'major-depressive-disorder',
    description: 'A mood disorder characterized by persistent feelings of sadness.',
    data: {
      icd10_code: 'F32',
      symptoms: {
        core: ['persistent sadness', 'loss of interest', 'fatigue'],
      },
      risk_factors: ['family history', 'trauma', 'chronic illness'],
    },
    status: 'active',
    visibility: 'public',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    type: 'condition',
  };

  it('should pass when schema matches content', () => {
    const schema = {
      '@type': 'MedicalCondition',
      name: 'Major Depressive Disorder',
      code: {
        '@type': 'MedicalCode',
        codeValue: 'F32',
        codingSystem: 'ICD-10',
      },
      signOrSymptom: [
        { '@type': 'MedicalSymptom', name: 'persistent sadness' },
        { '@type': 'MedicalSymptom', name: 'loss of interest' },
      ],
    };

    const result = reconcileSchema(schema, baseEntity);
    expect(result.isValid).toBe(true);
    expect(result.criticalCount).toBe(0);
  });

  it('should detect name mismatch as critical', () => {
    const schema = {
      '@type': 'MedicalCondition',
      name: 'Bipolar Disorder', // Wrong name!
    };

    const result = reconcileSchema(schema, baseEntity);
    expect(result.isValid).toBe(false);
    expect(result.criticalCount).toBeGreaterThan(0);
    expect(result.mismatches.some(m => m.type === 'value_mismatch')).toBe(true);
  });

  it('should detect missing content as warning', () => {
    const schema = {
      '@type': 'MedicalCondition',
      name: 'Major Depressive Disorder',
      code: {
        '@type': 'MedicalCode',
        codeValue: 'F33', // Wrong code
      },
    };

    const result = reconcileSchema(schema, baseEntity);
    expect(result.warningCount).toBeGreaterThan(0);
  });
});

describe('Schema-Content Reconciler - Drug', () => {
  const medicationEntity: Entity = {
    id: 'escitalopram',
    schema_id: 'treatment',
    name: 'Escitalopram',
    slug: 'escitalopram',
    description: 'An SSRI antidepressant.',
    data: {
      clinical_metadata: {
        generic_name: 'escitalopram',
        drug_classes: ['SSRI', 'Antidepressant'],
      },
      sections: [
        { type: 'dosage', heading: 'Dosage', content: '10-20mg daily' },
      ],
    },
    status: 'active',
    visibility: 'public',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    type: 'medication',
  };

  it('should pass when drug schema matches content', () => {
    const schema = {
      '@type': 'Drug',
      name: 'Escitalopram',
      nonProprietaryName: 'escitalopram',
      drugClass: ['SSRI'],
    };

    const result = reconcileSchema(schema, medicationEntity);
    expect(result.isValid).toBe(true);
  });

  it('should detect generic name mismatch as critical', () => {
    const schema = {
      '@type': 'Drug',
      name: 'Escitalopram',
      nonProprietaryName: 'sertraline', // Wrong!
    };

    const result = reconcileSchema(schema, medicationEntity);
    expect(result.isValid).toBe(false);
    expect(result.criticalCount).toBeGreaterThan(0);
  });
});

describe('Schema-Content Reconciler - FAQPage', () => {
  const entityWithFAQs: Entity = {
    id: 'faq-test',
    schema_id: 'treatment',
    name: 'Test Treatment',
    slug: 'test-treatment',
    description: 'A test treatment.',
    data: {
      faq: [
        { question: 'What is this?', answer: 'A treatment.' },
        { question: 'How does it work?', answer: 'By working.' },
      ],
    },
    status: 'active',
    visibility: 'public',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    type: 'medication',
  };

  it('should detect FAQ count mismatch', () => {
    const schema = {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What is this?' },
        { '@type': 'Question', name: 'How does it work?' },
        { '@type': 'Question', name: 'Extra question?' }, // Not in content!
      ],
    };

    const result = reconcileSchema(schema, entityWithFAQs);
    expect(result.mismatches.some(m => m.type === 'count_mismatch')).toBe(true);
  });
});

describe('Schema-Content Reconciler - Multiple Schemas', () => {
  const entity: Entity = {
    id: 'multi-schema',
    schema_id: 'condition',
    name: 'Test Condition',
    slug: 'test-condition',
    description: 'A test condition.',
    data: {},
    status: 'active',
    visibility: 'public',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    type: 'condition',
  };

  it('should reconcile all schemas and aggregate results', () => {
    const schemas = [
      { '@type': 'MedicalCondition', name: 'Test Condition' },
      { '@type': 'MedicalWebPage', name: 'Test Page' },
      { '@type': 'BreadcrumbList', itemListElement: [] },
    ];

    const results = reconcileAllSchemas(schemas, entity);
    expect(results.length).toBe(3);
  });

  it('should check if all schemas are valid', () => {
    const validSchemas = [
      { '@type': 'MedicalCondition', name: 'Test Condition' },
    ];

    const invalidSchemas = [
      { '@type': 'MedicalCondition', name: 'Wrong Name' },
    ];

    expect(schemasAreValid(validSchemas, entity)).toBe(true);
    expect(schemasAreValid(invalidSchemas, entity)).toBe(false);
  });

  it('should get all critical mismatches', () => {
    const schemas = [
      { '@type': 'MedicalCondition', name: 'Wrong Name 1' },
      { '@type': 'Drug', name: 'Wrong Name 2', nonProprietaryName: 'wrong' },
    ];

    const criticalMismatches = getCriticalMismatches(schemas, entity);
    expect(criticalMismatches.length).toBeGreaterThan(0);
    expect(criticalMismatches.every(m => m.severity === 'critical')).toBe(true);
  });
});

describe('Schema-Content Reconciler - Edge Cases', () => {
  it('should handle unknown schema types gracefully', () => {
    const entity: Entity = {
      id: 'test',
      schema_id: 'test',
      name: 'Test',
      slug: 'test',
      description: 'Test',
      data: {},
      status: 'active',
      visibility: 'public',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
      type: 'condition',
    };

    const schema = {
      '@type': 'UnknownSchemaType',
      name: 'Whatever',
    };

    const result = reconcileSchema(schema, entity);
    // Unknown types have no rules, so they pass by default
    expect(result.isValid).toBe(true);
    expect(result.mismatches.length).toBe(0);
  });

  it('should handle null/undefined values', () => {
    const entity: Entity = {
      id: 'test',
      schema_id: 'test',
      name: 'Test',
      slug: 'test',
      description: 'Test',
      data: {
        // Missing icd10_code
      },
      status: 'active',
      visibility: 'public',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
      type: 'condition',
    };

    const schema = {
      '@type': 'MedicalCondition',
      name: 'Test',
      code: {
        codeValue: 'F32', // Claims code that doesn't exist in content
      },
    };

    const result = reconcileSchema(schema, entity);
    // Should flag as missing_in_content
    expect(result.mismatches.some(m => m.type === 'missing_in_content')).toBe(true);
  });
});

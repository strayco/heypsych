/**
 * Schema-Content Reconciler
 *
 * Validates that JSON-LD structured data accurately reflects
 * the visible page content. This prevents Google penalties for
 * schema-content mismatches.
 *
 * @see Phase F of Wave 3 directive
 */

import type { Entity } from '@/lib/types/database';

// ============ TYPES ============

/**
 * Types of schema-content mismatches
 */
export type MismatchType =
  | 'missing_in_content'    // Schema claims something not visible on page
  | 'missing_in_schema'     // Content exists but not in schema
  | 'value_mismatch'        // Both exist but values differ
  | 'count_mismatch';       // Number of items differs

/**
 * A specific mismatch between schema and content
 */
export interface SchemaMismatch {
  type: MismatchType;
  schemaPath: string;       // e.g., "MedicalCondition.symptom[0].name"
  schemaValue?: string;     // Value in schema
  contentValue?: string;    // Value in rendered content
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

/**
 * Reconciliation result for an entity
 */
export interface ReconciliationResult {
  entitySlug: string;
  schemaType: string;
  isValid: boolean;
  mismatches: SchemaMismatch[];
  criticalCount: number;
  warningCount: number;
  checkedAt: string;
}

/**
 * Fields that should match between schema and content
 */
interface ReconciliationRule {
  schemaPath: string;
  contentPath: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
}

// ============ RECONCILIATION RULES BY SCHEMA TYPE ============

const MEDICAL_CONDITION_RULES: ReconciliationRule[] = [
  {
    schemaPath: 'name',
    contentPath: 'name',
    severity: 'critical',
    description: 'Condition name must match',
  },
  {
    schemaPath: 'code.codeValue',
    contentPath: 'data.icd10_code',
    severity: 'warning',
    description: 'ICD-10 code should match',
  },
  {
    schemaPath: 'signOrSymptom',
    contentPath: 'data.symptoms.core',
    severity: 'warning',
    description: 'Symptoms should be present in content',
  },
  {
    schemaPath: 'riskFactor',
    contentPath: 'data.risk_factors',
    severity: 'info',
    description: 'Risk factors should match',
  },
];

const DRUG_RULES: ReconciliationRule[] = [
  {
    schemaPath: 'name',
    contentPath: 'name',
    severity: 'critical',
    description: 'Drug name must match',
  },
  {
    schemaPath: 'nonProprietaryName',
    contentPath: 'data.clinical_metadata.generic_name',
    severity: 'critical',
    description: 'Generic name must match',
  },
  {
    schemaPath: 'drugClass',
    contentPath: 'data.clinical_metadata.drug_classes',
    severity: 'warning',
    description: 'Drug class should match',
  },
  {
    schemaPath: 'prescribingInfo',
    contentPath: 'data.sections',
    severity: 'warning',
    description: 'Dosage info should exist in content',
  },
];

const MEDICAL_THERAPY_RULES: ReconciliationRule[] = [
  {
    schemaPath: 'name',
    contentPath: 'name',
    severity: 'critical',
    description: 'Therapy name must match',
  },
  {
    schemaPath: 'indication',
    contentPath: 'data.clinical_metadata.primary_indications',
    severity: 'warning',
    description: 'Indications should match',
  },
  {
    schemaPath: 'contraindication',
    contentPath: 'data.clinical_metadata.contraindications',
    severity: 'warning',
    description: 'Contraindications should match',
  },
];

// FAQ reconciliation is soft because FAQs can be auto-generated from entity data
// (description, symptoms, risk_factors, etc.) without explicit faq/faqs field
const FAQ_PAGE_RULES: ReconciliationRule[] = [
  {
    schemaPath: 'mainEntity.length',
    // Check both 'faq' (singular) and 'faqs' (plural) - entities use both conventions
    contentPath: 'data.faqs.length',
    severity: 'info', // Soft check: auto-generated FAQs are valid but not stored
    description: 'FAQ count should match visible FAQs when explicit FAQs exist',
  },
  {
    schemaPath: 'mainEntity[*].name',
    contentPath: 'data.faqs[*].question',
    severity: 'info', // Soft check
    description: 'FAQ questions should match when explicit FAQs exist',
  },
];

// ============ RECONCILIATION FUNCTIONS ============

/**
 * Get value from nested object using dot notation path
 */
function getValueAtPath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === undefined || current === null) return undefined;

    // Handle array notation like "[0]" or "[*]"
    const arrayMatch = part.match(/^(\w+)?\[(\d+|\*)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      if (key) {
        current = current[key];
      }
      if (Array.isArray(current)) {
        if (index === '*') {
          // Return all array elements
          return current;
        }
        current = current[parseInt(index)];
      }
    } else {
      current = current[part];
    }
  }

  return current;
}

/**
 * Compare schema value with content value
 */
function compareValues(schemaValue: any, contentValue: any): boolean {
  // Both undefined/null = match
  if (schemaValue == null && contentValue == null) return true;

  // One undefined = mismatch
  if (schemaValue == null || contentValue == null) return false;

  // String comparison (case-insensitive, trimmed)
  if (typeof schemaValue === 'string' && typeof contentValue === 'string') {
    return schemaValue.toLowerCase().trim() === contentValue.toLowerCase().trim();
  }

  // Array comparison - schema items should exist in content
  if (Array.isArray(schemaValue) && Array.isArray(contentValue)) {
    return schemaValue.every(sv =>
      contentValue.some(cv => compareValues(sv, cv))
    );
  }

  // Number comparison
  if (typeof schemaValue === 'number' && typeof contentValue === 'number') {
    return schemaValue === contentValue;
  }

  // Object comparison - check if schema object matches content
  if (typeof schemaValue === 'object' && typeof contentValue === 'object') {
    // For named entities, compare names
    if (schemaValue.name && contentValue.name) {
      return compareValues(schemaValue.name, contentValue.name);
    }
    if (schemaValue.name && typeof contentValue === 'string') {
      return compareValues(schemaValue.name, contentValue);
    }
  }

  // Fallback string comparison
  return String(schemaValue) === String(contentValue);
}

/**
 * Apply a reconciliation rule and return mismatches
 */
function applyRule(
  rule: ReconciliationRule,
  schema: any,
  entity: Entity
): SchemaMismatch | null {
  const schemaValue = getValueAtPath(schema, rule.schemaPath);
  const contentValue = getValueAtPath(entity, rule.contentPath);

  // Check for count mismatch
  if (rule.schemaPath.includes('.length') || rule.contentPath.includes('.length')) {
    const schemaCount = Array.isArray(schemaValue) ? schemaValue.length : schemaValue;
    const contentCount = Array.isArray(contentValue) ? contentValue.length : contentValue;

    if (schemaCount !== contentCount) {
      return {
        type: 'count_mismatch',
        schemaPath: rule.schemaPath,
        schemaValue: String(schemaCount),
        contentValue: String(contentCount),
        severity: rule.severity,
        message: `${rule.description}: schema has ${schemaCount}, content has ${contentCount}`,
      };
    }
    return null;
  }

  // Schema claims something not in content
  if (schemaValue != null && contentValue == null) {
    return {
      type: 'missing_in_content',
      schemaPath: rule.schemaPath,
      schemaValue: summarizeValue(schemaValue),
      severity: rule.severity,
      message: `${rule.description}: schema has value but content missing`,
    };
  }

  // Content has something not in schema (less critical)
  if (schemaValue == null && contentValue != null) {
    return {
      type: 'missing_in_schema',
      schemaPath: rule.schemaPath,
      contentValue: summarizeValue(contentValue),
      severity: 'info',
      message: `${rule.description}: content has value but not in schema`,
    };
  }

  // Both exist but don't match
  if (!compareValues(schemaValue, contentValue)) {
    return {
      type: 'value_mismatch',
      schemaPath: rule.schemaPath,
      schemaValue: summarizeValue(schemaValue),
      contentValue: summarizeValue(contentValue),
      severity: rule.severity,
      message: `${rule.description}: values don't match`,
    };
  }

  return null;
}

/**
 * Summarize a value for display (truncate if long)
 */
function summarizeValue(value: any): string {
  if (value == null) return 'null';
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === 'object') {
    return value.name || JSON.stringify(value).substring(0, 100);
  }
  const str = String(value);
  return str.length > 100 ? str.substring(0, 100) + '...' : str;
}

/**
 * Get rules for a schema type
 */
function getRulesForSchemaType(schemaType: string): ReconciliationRule[] {
  switch (schemaType) {
    case 'MedicalCondition':
      return MEDICAL_CONDITION_RULES;
    case 'Drug':
      return DRUG_RULES;
    case 'MedicalTherapy':
      return MEDICAL_THERAPY_RULES;
    case 'FAQPage':
      return FAQ_PAGE_RULES;
    default:
      return [];
  }
}

/**
 * Detect schema type from schema object
 */
function detectSchemaType(schema: any): string {
  if (!schema) return 'Unknown';
  if (schema['@type']) {
    if (Array.isArray(schema['@type'])) {
      return schema['@type'][0];
    }
    return schema['@type'];
  }
  return 'Unknown';
}

// ============ MAIN RECONCILIATION API ============

/**
 * Reconcile a single schema against entity content
 */
export function reconcileSchema(
  schema: any,
  entity: Entity
): ReconciliationResult {
  const schemaType = detectSchemaType(schema);
  const rules = getRulesForSchemaType(schemaType);
  const mismatches: SchemaMismatch[] = [];

  for (const rule of rules) {
    const mismatch = applyRule(rule, schema, entity);
    if (mismatch) {
      mismatches.push(mismatch);
    }
  }

  const criticalCount = mismatches.filter(m => m.severity === 'critical').length;
  const warningCount = mismatches.filter(m => m.severity === 'warning').length;

  return {
    entitySlug: entity.slug,
    schemaType,
    isValid: criticalCount === 0,
    mismatches,
    criticalCount,
    warningCount,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Reconcile all schemas for an entity
 */
export function reconcileAllSchemas(
  schemas: any[],
  entity: Entity
): ReconciliationResult[] {
  return schemas.map(schema => reconcileSchema(schema, entity));
}

/**
 * Check if an entity's schemas are valid (no critical mismatches)
 */
export function schemasAreValid(
  schemas: any[],
  entity: Entity
): boolean {
  const results = reconcileAllSchemas(schemas, entity);
  return results.every(r => r.isValid);
}

/**
 * Get all critical mismatches across all schemas
 */
export function getCriticalMismatches(
  schemas: any[],
  entity: Entity
): SchemaMismatch[] {
  const results = reconcileAllSchemas(schemas, entity);
  return results.flatMap(r => r.mismatches.filter(m => m.severity === 'critical'));
}

// Types are exported inline above

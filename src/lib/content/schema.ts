/**
 * Content-Only JSON Schema
 *
 * This is the contract for all entity JSON files (treatments, conditions, resources, tools).
 * JSON files MUST contain ONLY domain content and structure, never UI/design bloat.
 *
 * SUPPORTED SCHEMA VERSIONS:
 * - v4.0: Clinician tools (id, slug, name, feature_flags, pricing, etc.)
 * - v3/3.0: Treatments/conditions (identity.slug, taxonomy, clinical_profile, etc.)
 * - v1/1.0: Resources (top-level slug, type, name, metadata)
 * - Legacy: Old format files (.legacy.json) with top-level slug, type, name, sections
 * - Editorial: Authors/reviewers (name, slug, credentials - no kind/schema_version)
 *
 * FORBIDDEN:
 * - UI/design tokens (colors, fonts, spacing, icons, animations)
 * - Layout hints (visual_design, ui_hints, collapsible, ux_display)
 * - Excessive SEO blobs (search_intent_clusters, schema_org generation hints)
 * - Presentation logic (card styles, layouts, progressive disclosure)
 */

/**
 * Validation: Forbidden fields
 *
 * These fields are NEVER allowed in content-only JSON.
 * CI validation will reject any JSON containing these fields.
 */
export const FORBIDDEN_FIELDS = [
  // Design tokens (strict)
  'visual_design',
  'design_tokens',
  'typography',
  'spacing',
  'colors',
  'animations',

  // UI hints
  'ux_display',
  'visual_priority',
  'card_style',
  'progressive_disclosure',

  // SEO bloat
  'seo_extensions',
  'search_intent_phrases',
  'search_intent_clusters',

  // Presentation hints
  'display_options',
  'render_options',
];

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Detect schema version from content
 */
function detectSchemaVersion(obj: any): string {
  if (obj.schema_version) {
    return String(obj.schema_version);
  }
  // Legacy format with sections array
  if (obj.kind && obj.slug && obj.type && Array.isArray(obj.sections)) {
    return 'legacy';
  }
  // Editorial files (authors/reviewers) - no kind, has name/slug
  if (obj.name && obj.slug && !obj.kind && !obj.schema_version) {
    return 'editorial';
  }
  return 'unknown';
}

/**
 * Check for forbidden fields recursively
 */
function checkForbiddenFields(
  obj: any,
  prefix: string,
  errors: string[],
  path: string = ''
): void {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (FORBIDDEN_FIELDS.includes(key)) {
      errors.push(
        `${prefix}Forbidden field: ${currentPath} (UI/design logic must be in central engines)`
      );
    }

    // Recurse into nested objects and arrays
    if (Array.isArray(obj[key])) {
      obj[key].forEach((item: any, index: number) => {
        if (typeof item === 'object' && item !== null) {
          checkForbiddenFields(item, prefix, errors, `${currentPath}[${index}]`);
        }
      });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      checkForbiddenFields(obj[key], prefix, errors, currentPath);
    }
  }
}

/**
 * Validate v4.0 schema (clinician tools)
 */
function validateV4(obj: any, prefix: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields for clinician tools
  if (!obj.kind) errors.push(`${prefix}Missing required field: kind`);
  if (!obj.slug) errors.push(`${prefix}Missing required field: slug`);
  if (!obj.name) errors.push(`${prefix}Missing required field: name`);

  // Check forbidden fields
  checkForbiddenFields(obj, prefix, errors);

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate v3/3.0 schema (treatments, conditions, tools)
 * Handles two variants:
 * - Treatments/conditions: identity.slug, identity.name, summary, description
 * - Tools: top-level slug, name, short_description/long_description
 */
function validateV3(obj: any, prefix: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!obj.kind) errors.push(`${prefix}Missing required field: kind`);

  // Determine variant based on kind or structure
  const isToolVariant = obj.kind === 'tool' || (obj.slug && !obj.identity);

  if (isToolVariant) {
    // Tool variant: top-level slug, name
    if (!obj.slug) errors.push(`${prefix}Missing required field: slug`);
    if (!obj.name) errors.push(`${prefix}Missing required field: name`);
    // Tools use short_description/long_description or one_liner
    if (!obj.short_description && !obj.one_liner && !obj.description) {
      warnings.push(`${prefix}Recommended: short_description, one_liner, or description`);
    }
  } else {
    // Treatment/condition variant: identity block
    if (!obj.identity) {
      errors.push(`${prefix}Missing required field: identity`);
    } else {
      if (!obj.identity.slug) errors.push(`${prefix}Missing required field: identity.slug`);
      if (!obj.identity.name) errors.push(`${prefix}Missing required field: identity.name`);
    }
    // Content fields
    if (!obj.summary) errors.push(`${prefix}Missing required field: summary`);
    if (!obj.description) errors.push(`${prefix}Missing required field: description`);
    // Taxonomy is recommended
    if (!obj.taxonomy) {
      warnings.push(`${prefix}Recommended field missing: taxonomy`);
    }
  }

  // Check forbidden fields
  checkForbiddenFields(obj, prefix, errors);

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate v1/1.0 schema (resources)
 */
function validateV1(obj: any, prefix: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!obj.kind) errors.push(`${prefix}Missing required field: kind`);
  if (!obj.slug) errors.push(`${prefix}Missing required field: slug`);
  if (!obj.name) errors.push(`${prefix}Missing required field: name`);
  if (!obj.description) errors.push(`${prefix}Missing required field: description`);

  // Check forbidden fields
  checkForbiddenFields(obj, prefix, errors);

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate legacy schema (old format with sections)
 */
function validateLegacy(obj: any, prefix: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!obj.kind) errors.push(`${prefix}Missing required field: kind`);
  if (!obj.slug) errors.push(`${prefix}Missing required field: slug`);
  if (!obj.type) errors.push(`${prefix}Missing required field: type`);
  if (!obj.name) errors.push(`${prefix}Missing required field: name`);
  if (!obj.summary) errors.push(`${prefix}Missing required field: summary`);
  if (!obj.description) errors.push(`${prefix}Missing required field: description`);

  // Sections validation
  if (!obj.sections) {
    errors.push(`${prefix}Missing required field: sections`);
  } else if (!Array.isArray(obj.sections)) {
    errors.push(`${prefix}Field 'sections' must be an array`);
  } else {
    obj.sections.forEach((section: any, index: number) => {
      if (!section.type) {
        errors.push(`${prefix}Section ${index}: Missing required field: type`);
      }
    });
  }

  // Check forbidden fields
  checkForbiddenFields(obj, prefix, errors);

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate editorial schema (authors, reviewers)
 */
function validateEditorial(obj: any, prefix: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields for editorial content
  if (!obj.name) errors.push(`${prefix}Missing required field: name`);
  if (!obj.slug) errors.push(`${prefix}Missing required field: slug`);

  // Check forbidden fields
  checkForbiddenFields(obj, prefix, errors);

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate content entity against schema
 * Minimal validation: just check for forbidden UI/design fields
 */
export function validateContentEntity(obj: any, filePath?: string): ValidationResult {
  const prefix = filePath ? `[${filePath}] ` : '';
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return {
      valid: false,
      errors: [`${prefix}Invalid JSON: not an object`],
      warnings: [],
    };
  }

  // Check forbidden fields only
  checkForbiddenFields(obj, prefix, errors);

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Type guard: Check if object is a valid content entity
 */
export function isValidContentEntity(obj: any): boolean {
  const result = validateContentEntity(obj);
  return result.valid;
}

// ============================================================================
// Type definitions (for backwards compatibility and IDE support)
// ============================================================================

export interface BaseEntity {
  kind: string;
  slug: string;
  type?: string;
  name: string;
  summary?: string;
  description?: string;
}

export interface ContentSection {
  type: string;
  heading?: string;
  text?: string;
  items?: any[];
  [key: string]: any;
}

export interface EditorialMetadata {
  reviewBoard?: string;
  medicalReviewerIds?: string[];
  lastReviewed?: string;
  lastUpdated?: string;
  reviewStatement?: string;
  author?: {
    name: string;
    credentials?: string;
    bio?: string;
    url?: string;
  };
  medicalReviewer?: {
    name: string;
    credentials?: string;
    bio?: string;
    url?: string;
  };
}

export interface FAQ {
  q: string;
  a: string;
}

export interface MinimalSEOOverride {
  title?: string;
  description?: string;
  no_index?: boolean;
  canonical?: string;
}

export type ContentEntity = BaseEntity;

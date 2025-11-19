/**
 * SchemaBuilder Utility Class
 *
 * Fluent API for building schema.org JSON-LD objects with graceful degradation.
 * Automatically handles missing data and prevents invalid schema generation.
 *
 * Usage:
 * ```typescript
 * const schema = new SchemaBuilder()
 *   .setContext("https://schema.org")
 *   .setType("MedicalCondition")
 *   .addProperty("name", entity.name)
 *   .addPropertyIfExists("code", extractCodes(entity))
 *   .build();
 * ```
 */

import { SITE_CONFIG, SCHEMA_CONFIG } from './config';

export class SchemaBuilder {
  private schema: Record<string, any> = {};

  /**
   * Set the @context (typically "https://schema.org")
   */
  setContext(context: string): this {
    this.schema['@context'] = context;
    return this;
  }

  /**
   * Set the @type (e.g., "MedicalCondition", "Drug", "Person")
   */
  setType(type: string): this {
    this.schema['@type'] = type;
    return this;
  }

  /**
   * Set the @id (unique identifier URL)
   */
  setId(id: string): this {
    this.schema['@id'] = id;
    return this;
  }

  /**
   * Add a property unconditionally
   */
  addProperty(key: string, value: any): this {
    this.schema[key] = value;
    return this;
  }

  /**
   * Add a property only if value exists and is not empty
   * This is the core graceful degradation mechanism.
   */
  addPropertyIfExists(key: string, value: any): this {
    // Skip if value is null, undefined, or empty string
    if (value == null || value === '') {
      return this;
    }

    // Skip if array is empty
    if (Array.isArray(value) && value.length === 0) {
      return this;
    }

    // Skip if object is empty
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      return this;
    }

    // Add the property
    this.schema[key] = value;
    return this;
  }

  /**
   * Add multiple properties from an object
   */
  addProperties(properties: Record<string, any>): this {
    Object.entries(properties).forEach(([key, value]) => {
      this.addProperty(key, value);
    });
    return this;
  }

  /**
   * Add multiple properties conditionally
   */
  addPropertiesIfExist(properties: Record<string, any>): this {
    Object.entries(properties).forEach(([key, value]) => {
      this.addPropertyIfExists(key, value);
    });
    return this;
  }

  /**
   * Build and return the final schema object
   */
  build(): Record<string, any> {
    // Ensure @context and @type are present
    if (!this.schema['@context']) {
      this.schema['@context'] = 'https://schema.org';
    }

    if (!this.schema['@type']) {
      throw new Error('Schema must have a @type property');
    }

    return this.schema;
  }

  /**
   * Build and return as JSON string
   */
  buildJSON(pretty: boolean = false): string {
    const schema = this.build();
    return pretty ? JSON.stringify(schema, null, 2) : JSON.stringify(schema);
  }

  /**
   * Static helper: Build a simple schema in one call
   */
  static simple(type: string, properties: Record<string, any>): Record<string, any> {
    return new SchemaBuilder()
      .setContext('https://schema.org')
      .setType(type)
      .addProperties(properties)
      .build();
  }
}

/**
 * Common schema building utilities
 */
export class SchemaUtils {
  /**
   * Build a MedicalCode schema object
   */
  static buildMedicalCode(code: string, codingSystem: string): Record<string, any> {
    return {
      '@type': 'MedicalCode',
      code,
      codingSystem
    };
  }

  /**
   * Build a MedicalSymptom schema object
   */
  static buildMedicalSymptom(name: string, description?: string): Record<string, any> {
    const symptom: Record<string, any> = {
      '@type': 'MedicalSymptom',
      name
    };

    if (description) {
      symptom.description = description;
    }

    return symptom;
  }

  /**
   * Build a MedicalRiskFactor schema object
   */
  static buildMedicalRiskFactor(name: string, increasesRiskOf?: string): Record<string, any> {
    const riskFactor: Record<string, any> = {
      '@type': 'MedicalRiskFactor',
      name
    };

    if (increasesRiskOf) {
      riskFactor.increasesRiskOf = increasesRiskOf;
    }

    return riskFactor;
  }

  /**
   * Build a MedicalTherapy schema object (simplified)
   */
  static buildMedicalTherapy(name: string): Record<string, any> {
    return {
      '@type': 'MedicalTherapy',
      name
    };
  }

  /**
   * Build a Drug schema object (simplified, for possibleTreatment)
   */
  static buildDrugReference(name: string): Record<string, any> {
    return {
      '@type': 'Drug',
      name
    };
  }

  /**
   * Build a MedicalIndication schema object
   */
  static buildMedicalIndication(name: string): Record<string, any> {
    return {
      '@type': 'MedicalIndication',
      name
    };
  }

  /**
   * Build a DrugStrength schema object
   */
  static buildDrugStrength(value: string | number, unit: string): Record<string, any> {
    return {
      '@type': 'DrugStrength',
      strengthValue: value.toString(),
      strengthUnit: unit
    };
  }

  /**
   * Build an ImageObject schema
   */
  static buildImageObject(url: string, width?: number, height?: number, alt?: string): Record<string, any> {
    const image: Record<string, any> = {
      '@type': 'ImageObject',
      url
    };

    if (width) image.width = width;
    if (height) image.height = height;
    if (alt) image.caption = alt;

    return image;
  }

  /**
   * Clean link syntax from text before adding to schema
   */
  static cleanText(text: string): string {
    return text
      .replace(/\{link:[^:]+:([^}]+)\}/g, '$1')
      .replace(/\{link:([^}]+)\}/g, '$1')
      .trim();
  }

  /**
   * Extract clean text array from array with link syntax
   */
  static cleanTextArray(texts: string[]): string[] {
    return texts.map(text => this.cleanText(text)).filter(Boolean);
  }

  /**
   * Build Organization schema for HeyPsych
   */
  static buildOrganizationSchema(): Record<string, any> {
    return new SchemaBuilder()
      .setContext('https://schema.org')
      .setType('MedicalOrganization')
      .addProperty('name', SITE_CONFIG.name)
      .addProperty('url', SITE_CONFIG.url)
      .addProperty('logo', `${SITE_CONFIG.url}${SITE_CONFIG.logo}`)
      .addProperty('description', SITE_CONFIG.description)
      .addProperty('medicalSpecialty', 'Psychiatry')
      .build();
  }
}

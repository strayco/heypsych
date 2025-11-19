/**
 * SchemaFactory - Main Entry Point for Schema.org JSON-LD Generation
 *
 * Generates complete stack of schema.org structured data for all entity types.
 * Each page receives 3-5 schemas: Primary + MedicalWebPage + Breadcrumb + Person(s) + FAQ
 *
 * Usage in page components:
 *
 * ```typescript
 * const schemas = SchemaFactory.generateAll(entity);
 *
 * return (
 *   <>
 *     {schemas.map((schema, i) => (
 *       <script
 *         key={i}
 *         type="application/ld+json"
 *         dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 *       />
 *     ))}
 *   </>
 * );
 * ```
 */

import type { Entity, EntityType } from '@/lib/types/database';
import { SITE_CONFIG, SCHEMA_CONFIG } from './config';
import { buildMedicalConditionSchema } from './schema-builders/medical-condition';
import { buildDrugSchema } from './schema-builders/drug';
import { buildMedicalTherapySchema } from './schema-builders/medical-therapy';
import { buildAuthorSchema, buildMedicalReviewerSchema } from './schema-builders/person';
import { buildBreadcrumbSchema } from './schema-builders/breadcrumb';
import { buildFAQPageSchema } from './schema-builders/faq';
import { buildMedicalWebPageSchema } from './schema-builders/medical-webpage';
import { hasAuthor, hasMedicalReviewer } from '@/lib/types/editorial';

/**
 * SchemaFactory
 *
 * Central factory for generating schema.org JSON-LD for all entity types.
 * Automatically generates appropriate schema stack based on entity type and data.
 */
export class SchemaFactory {
  /**
   * Generate all schemas for an entity
   *
   * Returns array of 3-5 schemas:
   * 1. Primary schema (MedicalCondition, Drug, MedicalTherapy, or Article)
   * 2. MedicalWebPage (universal)
   * 3. BreadcrumbList (universal)
   * 4. Person schemas (author + medical reviewer, if present)
   * 5. FAQPage (if FAQs exist or can be auto-generated)
   *
   * @param entity - Entity to generate schemas for
   * @param options - Optional configuration
   * @returns Array of schema.org objects
   */
  static generateAll(
    entity: Entity | null,
    options: {
      skipFAQ?: boolean;
      skipBreadcrumb?: boolean;
      pageUrl?: string;
    } = {}
  ): Record<string, any>[] {
    if (!entity) {
      return [];
    }

    const schemas: Record<string, any>[] = [];
    const pageUrl = options.pageUrl || this.getPageUrl(entity);

    // 1. Primary entity schema
    const primarySchema = this.generatePrimarySchema(entity);
    if (primarySchema && SCHEMA_CONFIG.enabled.medicalCondition) {
      schemas.push(primarySchema);
    }

    // 2. MedicalWebPage (universal for all medical content)
    if (SCHEMA_CONFIG.enabled.medicalWebPage) {
      schemas.push(buildMedicalWebPageSchema(entity, pageUrl));
    }

    // 3. BreadcrumbList (navigation context)
    if (!options.skipBreadcrumb && SCHEMA_CONFIG.enabled.breadcrumbList) {
      schemas.push(buildBreadcrumbSchema(entity));
    }

    // 4. Person schemas (author + medical reviewer)
    if (SCHEMA_CONFIG.enabled.person) {
      const personSchemas = this.generatePersonSchemas(entity);
      schemas.push(...personSchemas);
    }

    // 5. FAQPage (if FAQs available)
    if (!options.skipFAQ && SCHEMA_CONFIG.enabled.faqPage) {
      const faqSchema = buildFAQPageSchema(entity);
      if (faqSchema) {
        schemas.push(faqSchema);
      }
    }

    return schemas;
  }

  /**
   * Generate primary schema based on entity type
   */
  private static generatePrimarySchema(entity: Entity): Record<string, any> | null {
    const entityType = this.determineEntityType(entity);

    try {
      switch (entityType) {
        case 'condition':
          return buildMedicalConditionSchema(entity);

        case 'medication':
          return buildDrugSchema(entity);

        case 'therapy':
        case 'treatment':
        case 'interventional':
        case 'investigational':
        case 'alternative':
        case 'supplement':
          return buildMedicalTherapySchema(entity);

        case 'resource':
          // Resources can have different schema types based on category
          return this.generateResourceSchema(entity);

        default:
          // Fallback to Article schema
          return this.generateArticleSchema(entity);
      }
    } catch (error) {
      console.error('Error generating primary schema:', error);
      return null;
    }
  }

  /**
   * Generate Person schemas for author and medical reviewer
   */
  private static generatePersonSchemas(entity: Entity): Record<string, any>[] {
    const schemas: Record<string, any>[] = [];

    // Author schema
    if (hasAuthor(entity)) {
      try {
        schemas.push(buildAuthorSchema(entity.editorial!.author!));
      } catch (error) {
        console.error('Error generating author schema:', error);
      }
    }

    // Medical reviewer schema
    if (hasMedicalReviewer(entity)) {
      try {
        schemas.push(buildMedicalReviewerSchema(entity.editorial!.medicalReviewer!));
      } catch (error) {
        console.error('Error generating reviewer schema:', error);
      }
    }

    return schemas;
  }

  /**
   * Generate resource-specific schema based on resource category
   */
  private static generateResourceSchema(entity: Entity): Record<string, any> | null {
    const category = entity.data?.category || entity.metadata?.category;

    switch (category) {
      case 'assessments-screeners':
        return {
          '@context': 'https://schema.org',
          '@type': 'MedicalRiskEstimator',
          name: entity.name,
          description: entity.description || entity.data?.description,
          url: `${SITE_CONFIG.url}/resources/assessments-screeners/${entity.slug}`,
          estimatesRiskOf: entity.data?.conditions?.[0] || 'Mental health condition'
        };

      case 'digital-tools':
        return {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: entity.name,
          description: entity.description || entity.data?.description,
          applicationCategory: 'HealthApplication',
          operatingSystem: entity.data?.platforms?.join(', ')
        };

      default:
        return this.generateArticleSchema(entity);
    }
  }

  /**
   * Generate generic Article schema (fallback)
   */
  private static generateArticleSchema(entity: Entity): Record<string, any> {
    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: entity.name,
      description: entity.description || entity.data?.description
    };

    // Add author if available
    if (hasAuthor(entity)) {
      schema.author = {
        '@type': 'Person',
        name: entity.editorial!.author!.name
      };
    }

    // Add dates if available
    if (entity.editorial?.dates) {
      schema.datePublished = entity.editorial.dates.published;
      schema.dateModified = entity.editorial.dates.lastUpdated;
    }

    return schema;
  }

  /**
   * Determine entity type from entity object
   */
  private static determineEntityType(entity: Entity): EntityType {
    if (entity.type) return entity.type;
    if (entity.schema?.entity_type) return entity.schema.entity_type as EntityType;
    if (entity.schema?.schema_name) return entity.schema.schema_name as EntityType;
    if (entity.data?.kind) return entity.data.kind as EntityType;
    if (entity.data?.type) return entity.data.type as EntityType;

    return 'treatment'; // Default fallback
  }

  /**
   * Get page URL for entity
   */
  private static getPageUrl(entity: Entity): string {
    const entityType = this.determineEntityType(entity);

    switch (entityType) {
      case 'condition':
        return `${SITE_CONFIG.url}/conditions/${entity.slug}`;

      case 'medication':
      case 'therapy':
      case 'treatment':
      case 'interventional':
      case 'investigational':
      case 'alternative':
      case 'supplement':
        return `${SITE_CONFIG.url}/treatments/${entity.slug}`;

      case 'resource':
        const category = entity.data?.category || entity.metadata?.category;
        if (category === 'assessments-screeners') {
          return `${SITE_CONFIG.url}/resources/assessments-screeners/${entity.slug}`;
        }
        return `${SITE_CONFIG.url}/resources/${entity.slug}`;

      case 'provider':
        return `${SITE_CONFIG.url}/psychiatrists/${entity.slug}`;

      default:
        return `${SITE_CONFIG.url}/${entity.slug}`;
    }
  }

  /**
   * Validate schema output (useful for debugging)
   */
  static validate(schema: Record<string, any>): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!schema['@context']) {
      issues.push('Missing @context');
    }

    if (!schema['@type']) {
      issues.push('Missing @type');
    }

    if (!schema.name && !schema.headline) {
      issues.push('Missing name/headline');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Batch generate schemas for multiple entities
   */
  static generateBatch(entities: Entity[]): Record<string, any>[][] {
    return entities.map(entity => this.generateAll(entity));
  }
}

/**
 * Convenience function for use in page components
 */
export function generateEntitySchemas(entity: Entity | null): Record<string, any>[] {
  return SchemaFactory.generateAll(entity);
}

/**
 * Export for direct use
 */
export { SchemaFactory as default };

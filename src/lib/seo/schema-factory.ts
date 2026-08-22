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
import { getEntityType, getEntityPath } from '@/lib/utils/entity-type';
import { buildMedicalConditionSchema } from './schema-builders/medical-condition';
import { buildDrugSchema } from './schema-builders/drug';
import { buildMedicalTherapySchema } from './schema-builders/medical-therapy';
import { buildDigitalToolSchema } from './schema-builders/digital-tool'; // PHASE 1.2: Digital tool schema
import { buildAuthorSchema, buildMedicalReviewerSchema } from './schema-builders/person';
import { buildBreadcrumbSchema } from './schema-builders/breadcrumb';
import { buildFAQPageSchema } from './schema-builders/faq';
import { buildMedicalWebPageSchema } from './schema-builders/medical-webpage';
import {
  buildMedicalReviewBoardSchema,
  buildDefaultReviewBoardPersonSchema
} from './schema-builders/organization';
import { hasAuthor, hasMedicalReviewer, AuthorInfo, MedicalReviewerInfo } from '@/lib/types/editorial';
import {
  getContributorBySlug,
  passesEEATRequirements,
  type Contributor,
} from '@/lib/trust/contributor-registry';
import {
  reconcileAllSchemas,
  schemasAreValid,
  getCriticalMismatches,
  type ReconciliationResult,
} from '@/lib/trust/schema-content-reconciler';

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

    // 1. Primary entity schema (auto-generated from content)
    const primarySchema = this.generatePrimarySchema(entity);

    if (primarySchema) {
      // Check type-specific enable flag
      const schemaType = primarySchema['@type'] as string;
      const isEnabled = this.isSchemaTypeEnabled(schemaType);

      if (isEnabled) {
        schemas.push(primarySchema);
      }
    }

    // 2. MedicalWebPage (universal for all medical content)
    if (SCHEMA_CONFIG.enabled.medicalWebPage) {
      schemas.push(buildMedicalWebPageSchema(entity, pageUrl));
    }

    // 3. BreadcrumbList (navigation context)
    if (!options.skipBreadcrumb && SCHEMA_CONFIG.enabled.breadcrumbList) {
      schemas.push(buildBreadcrumbSchema(entity));
    }

    // 4. Organization schemas (Medical Review Board)
    schemas.push(buildMedicalReviewBoardSchema());

    // 5. Person schemas (author + medical reviewer OR default board)
    if (SCHEMA_CONFIG.enabled.person) {
      const personSchemas = this.generatePersonSchemas(entity);
      schemas.push(...personSchemas);
    }

    // 6. FAQPage (if FAQs available)
    if (!options.skipFAQ && SCHEMA_CONFIG.enabled.faqPage) {
      const faqSchema = buildFAQPageSchema(entity);
      if (faqSchema) {
        schemas.push(faqSchema);
      }
    }

    // 7. Schema-Content Reconciliation (build-time validation)
    // Validates that generated schemas match visible entity content
    // @see schema-content-reconciler.ts Phase F
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PHASE === 'phase-production-build') {
      this.reconcileSchemas(schemas, entity);
    }

    return schemas;
  }

  /**
   * Validate schemas against entity content
   * Logs warnings for critical mismatches during build
   *
   * INTEGRATION: Schema-Content Reconciler → Schema Generation
   * @see schema-content-reconciler.ts Phase F
   */
  private static reconcileSchemas(schemas: Record<string, any>[], entity: Entity): void {
    try {
      const results = reconcileAllSchemas(schemas, entity);
      const criticalMismatches = results.flatMap(r => r.mismatches.filter(m => m.severity === 'critical'));

      if (criticalMismatches.length > 0) {
        console.warn(
          `⚠️ Schema-content mismatches for ${entity.slug}:`,
          criticalMismatches.map(m => `${m.schemaPath}: ${m.message}`).join('; ')
        );
      }

      // In development, also log warnings
      if (process.env.NODE_ENV === 'development') {
        const warnings = results.flatMap(r => r.mismatches.filter(m => m.severity === 'warning'));
        if (warnings.length > 0) {
          console.info(
            `ℹ️ Schema warnings for ${entity.slug}:`,
            warnings.slice(0, 3).map(m => `${m.schemaPath}: ${m.message}`).join('; ')
          );
        }
      }
    } catch (error) {
      // Don't crash the build on reconciliation errors
      console.warn(`Schema reconciliation failed for ${entity.slug}:`, error);
    }
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
   * CRITICAL: Always generates at least default Medical Review Board Person schema
   *
   * INTEGRATION: Contributor Registry → Person Schemas
   * Looks up contributors in the registry to add verification data (NPI, ORCID)
   * @see contributor-registry.ts Phase E
   */
  private static generatePersonSchemas(entity: Entity): Record<string, any>[] {
    const schemas: Record<string, any>[] = [];

    // Author schema
    if (hasAuthor(entity)) {
      try {
        const authorInfo = entity.editorial!.author!;
        // Enrich with contributor registry data
        const enrichedAuthor = this.enrichAuthorWithRegistry(authorInfo);
        schemas.push(buildAuthorSchema(enrichedAuthor));
      } catch (error) {
        console.error('Error generating author schema:', error);
      }
    }

    // Medical reviewer schema (individual OR default board)
    if (hasMedicalReviewer(entity)) {
      try {
        const reviewerInfo = entity.editorial!.medicalReviewer!;
        // Enrich with contributor registry data
        const enrichedReviewer = this.enrichReviewerWithRegistry(reviewerInfo);
        schemas.push(buildMedicalReviewerSchema(enrichedReviewer));
      } catch (error) {
        console.error('Error generating reviewer schema:', error);
      }
    } else {
      // CRITICAL: Always generate default Medical Review Board Person schema
      // when no individual reviewer is specified (E-A-T compliance)
      schemas.push(buildDefaultReviewBoardPersonSchema());
    }

    return schemas;
  }

  /**
   * Enrich author info with data from Contributor Registry
   * Adds NPI, ORCID, and verification data if available
   */
  private static enrichAuthorWithRegistry(authorInfo: AuthorInfo): AuthorInfo {
    // Create slug from author name for registry lookup
    const slug = authorInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const contributor = getContributorBySlug(slug);

    if (!contributor) {
      return authorInfo;
    }

    // Merge registry data into author info
    const enriched: AuthorInfo = { ...authorInfo };

    // Add ORCID if not already present
    if (!enriched.orcid) {
      const orcidCred = contributor.credentials.find(c => c.type === 'orcid');
      if (orcidCred?.value) {
        enriched.orcid = orcidCred.value;
      }
    }

    // Add affiliations if not already present
    if (!enriched.affiliations && contributor.affiliations) {
      enriched.affiliations = contributor.affiliations;
    }

    // Add specialty as jobTitle if not already present
    if (!enriched.jobTitle && contributor.specialty) {
      enriched.jobTitle = contributor.specialty;
    }

    return enriched;
  }

  /**
   * Enrich medical reviewer info with data from Contributor Registry
   * Adds NPI, ORCID, and verification data if available
   *
   * IMPORTANT: Only uses verified contributors for medical reviewer schema
   * Unverified contributors are NOT used to avoid E-E-A-T issues
   */
  private static enrichReviewerWithRegistry(reviewerInfo: MedicalReviewerInfo): MedicalReviewerInfo {
    // Create slug from reviewer name for registry lookup
    const slug = reviewerInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const contributor = getContributorBySlug(slug);

    if (!contributor) {
      return reviewerInfo;
    }

    // CRITICAL: Only use verified contributors for medical reviewers
    // This prevents unverified credentials from appearing in schema
    if (!passesEEATRequirements(contributor)) {
      console.warn(`Contributor ${contributor.name} does not pass E-E-A-T requirements, using entity data only`);
      return reviewerInfo;
    }

    // Merge registry data into reviewer info
    const enriched: MedicalReviewerInfo = { ...reviewerInfo };

    // Add NPI if not already present
    if (!enriched.npi) {
      const npiCred = contributor.credentials.find(c => c.type === 'npi');
      if (npiCred?.value) {
        enriched.npi = npiCred.value;
      }
    }

    // Add ORCID if not already present
    if (!enriched.orcid) {
      const orcidCred = contributor.credentials.find(c => c.type === 'orcid');
      if (orcidCred?.value) {
        enriched.orcid = orcidCred.value;
      }
    }

    // Add board certifications if not already present
    if (!enriched.boardCertifications) {
      const boardCerts = contributor.credentials
        .filter(c => c.type === 'board_cert')
        .map(c => c.issuer || 'Board Certified')
        .filter(Boolean);
      if (boardCerts.length > 0) {
        enriched.boardCertifications = boardCerts;
      }
    }

    // Add affiliation if not already present
    if (!enriched.affiliation && contributor.affiliations?.[0]) {
      enriched.affiliation = contributor.affiliations[0];
    }

    // Add specialty if not already present
    if (!enriched.specialty && contributor.specialty) {
      enriched.specialty = contributor.specialty;
    }

    return enriched;
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
          url: `${SITE_CONFIG.url}/resources/${entity.slug}`,
          estimatesRiskOf: entity.data?.conditions?.[0] || 'Mental health condition'
        };

      case 'digital-tools':
        // PHASE 1.2: Use comprehensive SoftwareApplication schema builder
        return buildDigitalToolSchema(entity);

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
   * Check if a schema type is enabled in config
   *
   * @param schemaType - Schema.org @type value
   * @returns True if schema type is enabled
   */
  private static isSchemaTypeEnabled(schemaType: string): boolean {
    switch (schemaType) {
      case 'MedicalCondition':
        return SCHEMA_CONFIG.enabled.medicalCondition;
      case 'Drug':
        return SCHEMA_CONFIG.enabled.drug;
      case 'MedicalTherapy':
        return SCHEMA_CONFIG.enabled.medicalTherapy;
      case 'MedicalWebPage':
        return SCHEMA_CONFIG.enabled.medicalWebPage;
      case 'BreadcrumbList':
        return SCHEMA_CONFIG.enabled.breadcrumbList;
      case 'Person':
        return SCHEMA_CONFIG.enabled.person;
      case 'FAQPage':
        return SCHEMA_CONFIG.enabled.faqPage;
      case 'MedicalOrganization':
      case 'Organization':
        return SCHEMA_CONFIG.enabled.organization;
      case 'Article':
      case 'MedicalRiskEstimator':
      case 'SoftwareApplication':
        return true; // Always enabled for fallback schemas
      default:
        console.warn(`Unknown schema type "${schemaType}", enabling by default`);
        return true;
    }
  }

  /**
   * Determine entity type from entity object
   * Uses consolidated utility for consistent type determination
   */
  private static determineEntityType(entity: Entity): EntityType {
    return getEntityType(entity);
  }

  /**
   * Get page URL for entity
   * Uses consolidated utility for consistent URL generation
   */
  private static getPageUrl(entity: Entity): string {
    return `${SITE_CONFIG.url}${getEntityPath(entity)}`;
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

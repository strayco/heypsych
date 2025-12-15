/**
 * MetadataFactory - Main Entry Point for SEO Metadata Generation
 *
 * Single source of truth for generating Next.js metadata across all entity types.
 * Routes to appropriate generator based on entity type, supports overrides.
 *
 * Usage in page components:
 *
 * ```typescript
 * export async function generateMetadata({ params }): Promise<Metadata> {
 *   const entity = await EntityService.getBySlug(params.slug);
 *   return MetadataFactory.generate(entity);
 * }
 * ```
 */

import type { Metadata } from 'next';
import type { Entity, EntityType } from '@/lib/types/database';
import { DefaultMetadataGenerator } from './metadata-generator';
import { ConditionMetadataGenerator } from './metadata-generators/condition';
import { MedicationMetadataGenerator } from './metadata-generators/medication';
import { TherapyMetadataGenerator } from './metadata-generators/therapy';
import { ResourceMetadataGenerator } from './metadata-generators/resource';
import { getEntityType } from '@/lib/utils/entity-type';

/**
 * MetadataFactory
 *
 * Central factory for generating SEO metadata for all entity types.
 * Automatically selects the appropriate generator based on entity type.
 */
export class MetadataFactory {
  /**
   * Generate complete SEO metadata for an entity
   *
   * @param entity - The entity to generate metadata for
   * @returns Complete Next.js Metadata object
   */
  static async generate(entity: Entity | null): Promise<Metadata> {
    // Handle null entity (404 case)
    if (!entity) {
      return {
        title: 'Page Not Found | HeyPsych',
        description: 'The page you are looking for could not be found.'
      };
    }

    // Get appropriate generator for entity type
    const generator = this.getGenerator(entity);

    // Generate and return metadata
    return generator.generate(entity);
  }

  /**
   * Get the appropriate metadata generator for an entity type
   *
   * @param entity - Entity to get generator for
   * @returns Metadata generator instance
   */
  private static getGenerator(entity: Entity) {
    // Determine entity type (from type field or schema)
    const entityType = this.determineEntityType(entity);

    switch (entityType) {
      case 'condition':
        return new ConditionMetadataGenerator();

      case 'medication':
        return new MedicationMetadataGenerator();

      case 'therapy':
      case 'treatment':
        return new TherapyMetadataGenerator();

      case 'interventional':
      case 'investigational':
      case 'alternative':
      case 'supplement':
        // Use therapy generator for all treatment subtypes
        return new TherapyMetadataGenerator();

      case 'resource':
        return new ResourceMetadataGenerator();

      case 'provider':
        // Use default generator for providers (can specialize later)
        return new DefaultMetadataGenerator();

      default:
        return new DefaultMetadataGenerator();
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
   * Batch generate metadata for multiple entities
   *
   * Useful for precomputing metadata during build time.
   *
   * @param entities - Array of entities
   * @returns Array of metadata objects
   */
  static async generateBatch(entities: Entity[]): Promise<Metadata[]> {
    return Promise.all(
      entities.map(entity => this.generate(entity))
    );
  }

  /**
   * Validate that metadata meets SEO requirements
   *
   * @param metadata - Metadata to validate
   * @returns Validation result with any issues found
   */
  static validate(metadata: Metadata): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check title
    if (!metadata.title) {
      issues.push('Missing title');
    } else if (typeof metadata.title === 'string') {
      const titleLength = metadata.title.length;

      if (titleLength < 30) {
        issues.push('Title too short (min 30 chars)');
      }
      if (titleLength > 60) {
        issues.push('Title too long (max 60 chars)');
      }
    }

    // Check description
    if (!metadata.description) {
      issues.push('Missing description');
    } else {
      const descLength = metadata.description.length;

      if (descLength < 70) {
        issues.push('Description too short (min 70 chars)');
      }
      if (descLength > 160) {
        issues.push('Description too long (max 160 chars)');
      }
    }

    // Check canonical
    if (!metadata.alternates?.canonical) {
      issues.push('Missing canonical URL');
    }

    // Check OpenGraph
    if (!metadata.openGraph?.title) {
      issues.push('Missing OpenGraph title');
    }
    if (!metadata.openGraph?.description) {
      issues.push('Missing OpenGraph description');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

/**
 * Convenience function for use in page components
 *
 * @param entity - Entity to generate metadata for
 * @returns Metadata object
 */
export async function generateEntityMetadata(entity: Entity | null): Promise<Metadata> {
  return MetadataFactory.generate(entity);
}

/**
 * Export for direct use
 */
export { MetadataFactory as default };

/**
 * Link Extractor Registry
 *
 * Central registry for all link extractors.
 * Manages extractor registration, lookup, and orchestration.
 */

import type { Entity, EntityType } from '@/lib/types/database';
import type { LinkExtractor, CandidateLink } from './types';
import { ConditionLinkExtractor } from './extractors/condition-extractor';
import { TreatmentLinkExtractor } from './extractors/treatment-extractor';
import { AssessmentLinkExtractor } from './extractors/assessment-extractor';

/**
 * LinkExtractorRegistry
 *
 * Singleton registry that manages all link extractors.
 * Provides unified interface for link extraction across all entity types.
 */
export class LinkExtractorRegistry {
  private static instance: LinkExtractorRegistry;
  private extractors: Map<EntityType, LinkExtractor[]>;

  private constructor() {
    this.extractors = new Map();
    this.registerDefaultExtractors();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LinkExtractorRegistry {
    if (!LinkExtractorRegistry.instance) {
      LinkExtractorRegistry.instance = new LinkExtractorRegistry();
    }
    return LinkExtractorRegistry.instance;
  }

  /**
   * Register default extractors
   */
  private registerDefaultExtractors(): void {
    // Condition extractor
    this.register(new ConditionLinkExtractor());

    // Treatment extractor (handles medication, therapy, treatment, etc.)
    const treatmentExtractor = new TreatmentLinkExtractor();
    this.register(treatmentExtractor, 'medication');
    this.register(treatmentExtractor, 'therapy');
    this.register(treatmentExtractor, 'treatment');
    this.register(treatmentExtractor, 'interventional');
    this.register(treatmentExtractor, 'investigational');
    this.register(treatmentExtractor, 'alternative');
    this.register(treatmentExtractor, 'supplement');

    // Assessment extractor
    this.register(new AssessmentLinkExtractor(), 'resource');
  }

  /**
   * Register an extractor for an entity type
   */
  register(extractor: LinkExtractor, entityType?: EntityType): void {
    const type = entityType || extractor.entityType;

    if (!this.extractors.has(type)) {
      this.extractors.set(type, []);
    }

    const extractors = this.extractors.get(type)!;

    // Check if already registered
    const existing = extractors.find((e) => e.id === extractor.id);
    if (existing) {
      console.warn(
        `Extractor ${extractor.id} already registered for type ${type}, skipping`
      );
      return;
    }

    extractors.push(extractor);
  }

  /**
   * Get all extractors for an entity type
   */
  getExtractors(entityType: EntityType): LinkExtractor[] {
    return this.extractors.get(entityType) || [];
  }

  /**
   * Extract links from a single entity
   * Runs all registered extractors for the entity type
   */
  async extractLinks(entity: Entity, allEntities?: Entity[]): Promise<CandidateLink[]> {
    const entityType = entity.type;
    if (!entityType) {
      console.warn(`Entity ${entity.slug} has no type, skipping link extraction`);
      return [];
    }

    const extractors = this.getExtractors(entityType);
    if (extractors.length === 0) {
      return [];
    }

    const allLinks: CandidateLink[] = [];
    const errors: string[] = [];

    // Run all extractors for this entity type
    for (const extractor of extractors) {
      try {
        const links = await extractor.extract(entity, allEntities);

        // Validate links if extractor provides validation
        const validLinks = extractor.validate
          ? links.filter((link) => extractor.validate!(link))
          : links;

        allLinks.push(...validLinks);
      } catch (error) {
        const errorMsg = `Extractor ${extractor.id} failed for ${entity.slug}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return allLinks;
  }

  /**
   * Extract links from multiple entities (batch)
   */
  async extractLinksFromEntities(entities: Entity[]): Promise<Map<string, CandidateLink[]>> {
    const results = new Map<string, CandidateLink[]>();

    // Extract links for each entity
    for (const entity of entities) {
      try {
        const links = await this.extractLinks(entity, entities);
        results.set(entity.id, links);
      } catch (error) {
        console.error(`Failed to extract links for ${entity.slug}:`, error);
        results.set(entity.id, []);
      }
    }

    return results;
  }

  /**
   * Get all registered entity types
   */
  getRegisteredTypes(): EntityType[] {
    return Array.from(this.extractors.keys());
  }

  /**
   * Check if extractor is registered for entity type
   */
  hasExtractor(entityType: EntityType): boolean {
    const extractors = this.extractors.get(entityType);
    return !!extractors && extractors.length > 0;
  }

  /**
   * Clear all extractors (for testing)
   */
  clear(): void {
    this.extractors.clear();
  }

  /**
   * Reset to default extractors (for testing)
   */
  reset(): void {
    this.clear();
    this.registerDefaultExtractors();
  }

  /**
   * Get extractor by ID
   */
  getExtractorById(id: string): LinkExtractor | null {
    for (const extractors of this.extractors.values()) {
      const extractor = extractors.find((e) => e.id === id);
      if (extractor) return extractor;
    }
    return null;
  }

  /**
   * Get statistics about registered extractors
   */
  getStats(): {
    totalExtractors: number;
    extractorsByType: Record<EntityType, number>;
    registeredTypes: EntityType[];
  } {
    const stats = {
      totalExtractors: 0,
      extractorsByType: {} as Record<EntityType, number>,
      registeredTypes: [] as EntityType[],
    };

    for (const [type, extractors] of this.extractors) {
      stats.totalExtractors += extractors.length;
      stats.extractorsByType[type] = extractors.length;
      stats.registeredTypes.push(type);
    }

    return stats;
  }
}

/**
 * Get global registry instance
 */
export function getLinkExtractorRegistry(): LinkExtractorRegistry {
  return LinkExtractorRegistry.getInstance();
}

/**
 * Extract links for a single entity (convenience function)
 */
export async function extractLinksForEntity(
  entity: Entity,
  allEntities?: Entity[]
): Promise<CandidateLink[]> {
  const registry = getLinkExtractorRegistry();
  return registry.extractLinks(entity, allEntities);
}

/**
 * Extract links for multiple entities (convenience function)
 */
export async function extractLinksForEntities(
  entities: Entity[]
): Promise<Map<string, CandidateLink[]>> {
  const registry = getLinkExtractorRegistry();
  return registry.extractLinksFromEntities(entities);
}

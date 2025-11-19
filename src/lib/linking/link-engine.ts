/**
 * Link Engine
 *
 * Main orchestration engine for internal linking system.
 * Handles:
 * - Link extraction via registry
 * - De-duplication
 * - Bidirectional enforcement
 * - Quality checks
 * - Prioritization and limiting
 */

import type { Entity } from '@/lib/types/database';
import type {
  CandidateLink,
  LinkExtractionResult,
  BidirectionalLinkPair,
  LinkQualityMetrics,
} from './types';
import {
  getLinkLimits,
  shouldBeReciprocal,
  getReciprocalLinkType,
  QUALITY_THRESHOLDS,
} from './config';
import { getLinkExtractorRegistry } from './registry';
import {
  deduplicateLinks,
  sortLinksByPriority,
  filterLinksToLimit,
  validateCandidateLink,
  countLinksByType,
  countLinksByPriority,
  isDuplicateLink,
} from './utils';

/**
 * LinkEngine
 *
 * Main class for link extraction and management
 */
export class LinkEngine {
  private registry = getLinkExtractorRegistry();

  /**
   * Extract links for a single entity
   * Returns complete extraction result with raw and processed links
   */
  async extractLinksForEntity(
    entity: Entity,
    allEntities: Entity[] = []
  ): Promise<LinkExtractionResult> {
    const errors: string[] = [];

    try {
      // Extract raw links via registry
      const rawLinks = await this.registry.extractLinks(entity, allEntities);

      // Validate links
      const validLinks = rawLinks.filter((link) => {
        const isValid = validateCandidateLink(link);
        if (!isValid) {
          errors.push(`Invalid link: ${link.sourceSlug} -> ${link.targetSlug}`);
        }
        return isValid;
      });

      // De-duplicate
      const dedupedLinks = deduplicateLinks(validLinks);

      // Sort by priority
      const sortedLinks = sortLinksByPriority(dedupedLinks);

      // Apply limits
      const limits = getLinkLimits(entity.type || 'resource');
      const finalLinks = filterLinksToLimit(sortedLinks, limits.max);

      return {
        sourceEntity: entity,
        rawLinks,
        links: finalLinks,
        countByType: countLinksByType(finalLinks),
        countByPriority: countLinksByPriority(finalLinks),
        errors,
      };
    } catch (error) {
      errors.push(`Extraction failed: ${error}`);
      return {
        sourceEntity: entity,
        rawLinks: [],
        links: [],
        countByType: {},
        countByPriority: {},
        errors,
      };
    }
  }

  /**
   * Extract links for multiple entities (batch)
   * Returns map of entity ID to extraction results
   */
  async extractLinksForEntities(
    entities: Entity[]
  ): Promise<Map<string, LinkExtractionResult>> {
    const results = new Map<string, LinkExtractionResult>();

    for (const entity of entities) {
      const result = await this.extractLinksForEntity(entity, entities);
      results.set(entity.id, result);
    }

    return results;
  }

  /**
   * Enforce bidirectional links
   * For each A->B link that should be reciprocal, ensures B->A exists
   */
  async enforceBidirectionalLinks(
    entities: Entity[],
    extractionResults: Map<string, LinkExtractionResult>
  ): Promise<Map<string, LinkExtractionResult>> {
    const updatedResults = new Map(extractionResults);

    // Build pairs of entities that should have reciprocal links
    const pairs = this.findBidirectionalPairs(extractionResults);

    // For each pair missing reciprocal link, try to add it
    for (const pair of pairs) {
      if (!pair.isMissingReciprocal) continue;

      // Determine which link is missing
      const needsReciprocal = pair.linkAtoB && !pair.linkBtoA ? pair.entityB : pair.entityA;
      const targetEntity = pair.linkAtoB && !pair.linkBtoA ? pair.entityA : pair.entityB;
      const existingLink = pair.linkAtoB || pair.linkBtoA;

      if (!existingLink) continue;

      // Get current results for entity that needs reciprocal link
      const currentResult = updatedResults.get(needsReciprocal.id);
      if (!currentResult) continue;

      // Check if adding reciprocal would exceed limit
      const limits = getLinkLimits(needsReciprocal.type || 'resource');
      if (currentResult.links.length >= limits.max) {
        // At max capacity - try to drop lowest priority link to make room
        const lowestPriorityLink = this.findLowestPriorityLink(currentResult.links);
        if (
          lowestPriorityLink &&
          this.comparePriority(existingLink.priority, lowestPriorityLink.priority) > 0
        ) {
          // Remove lowest priority link
          currentResult.links = currentResult.links.filter(
            (l) => l !== lowestPriorityLink
          );
        } else {
          // Can't make room, skip this reciprocal
          continue;
        }
      }

      // Create reciprocal link
      const reciprocalLinkType = getReciprocalLinkType(existingLink.linkType);
      if (!reciprocalLinkType) continue;

      const reciprocalLink: CandidateLink = {
        sourceId: needsReciprocal.id,
        sourceSlug: needsReciprocal.slug,
        sourceType: needsReciprocal.type || 'resource',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: targetEntity.type || 'resource',
        linkType: reciprocalLinkType,
        context: 'reciprocal',
        priority: existingLink.priority,
        anchorOptions: [targetEntity.name],
        metadata: {
          isReciprocal: true,
          extractorId: 'bidirectional-enforcer',
        },
      };

      // Add reciprocal link
      currentResult.links.push(reciprocalLink);

      // Re-sort and update counts
      currentResult.links = sortLinksByPriority(currentResult.links);
      currentResult.countByType = countLinksByType(currentResult.links);
      currentResult.countByPriority = countLinksByPriority(currentResult.links);

      updatedResults.set(needsReciprocal.id, currentResult);
    }

    return updatedResults;
  }

  /**
   * Find bidirectional pairs
   */
  private findBidirectionalPairs(
    extractionResults: Map<string, LinkExtractionResult>
  ): BidirectionalLinkPair[] {
    const pairs: BidirectionalLinkPair[] = [];
    const processed = new Set<string>();

    for (const [entityAId, resultA] of extractionResults) {
      for (const linkAtoB of resultA.links) {
        // Only check links that should be reciprocal
        if (!shouldBeReciprocal(linkAtoB.linkType)) continue;

        const entityBId = linkAtoB.targetId;
        if (!entityBId) continue;

        // Skip if already processed this pair
        const pairKey = [entityAId, entityBId].sort().join(':');
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        // Find entity B
        const resultB = extractionResults.get(entityBId);
        if (!resultB) continue;

        // Check if B has reciprocal link to A
        const reciprocalType = getReciprocalLinkType(linkAtoB.linkType);
        const linkBtoA = resultB.links.find(
          (link) =>
            link.targetId === entityAId &&
            (link.linkType === reciprocalType || link.linkType === linkAtoB.linkType)
        );

        pairs.push({
          entityA: resultA.sourceEntity,
          entityB: resultB.sourceEntity,
          linkAtoB,
          linkBtoA: linkBtoA || null,
          shouldBeReciprocal: true,
          isMissingReciprocal: !linkBtoA,
        });
      }
    }

    return pairs;
  }

  /**
   * Find lowest priority link in array
   */
  private findLowestPriorityLink(links: CandidateLink[]): CandidateLink | null {
    if (links.length === 0) return null;

    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    let lowest = links[0];
    let lowestPriority = priorityOrder[lowest.priority] || 0;

    for (const link of links) {
      const priority = priorityOrder[link.priority] || 0;
      if (priority < lowestPriority) {
        lowest = link;
        lowestPriority = priority;
      }
    }

    return lowest;
  }

  /**
   * Compare two priorities
   * Returns positive if p1 > p2, negative if p1 < p2, 0 if equal
   */
  private comparePriority(p1: string, p2: string): number {
    const order = { critical: 4, high: 3, medium: 2, low: 1 };
    const v1 = order[p1 as keyof typeof order] || 0;
    const v2 = order[p2 as keyof typeof order] || 0;
    return v1 - v2;
  }

  /**
   * Calculate quality metrics for all extraction results
   */
  calculateQualityMetrics(
    results: Map<string, LinkExtractionResult>
  ): LinkQualityMetrics {
    let totalLinks = 0;
    let duplicatesRemoved = 0;
    let entitiesAboveMax = 0;
    let entitiesBelowMin = 0;
    let errorCount = 0;

    const linksByType: Record<string, number> = {};
    const linksByPriority: Record<string, number> = {};

    for (const result of results.values()) {
      const limits = getLinkLimits(result.sourceEntity.type || 'resource');

      totalLinks += result.links.length;
      duplicatesRemoved += result.rawLinks.length - result.links.length;
      errorCount += result.errors.length;

      if (result.links.length > limits.max) {
        entitiesAboveMax++;
      }
      if (result.links.length < limits.min) {
        entitiesBelowMin++;
      }

      // Aggregate counts
      for (const [type, count] of Object.entries(result.countByType)) {
        linksByType[type] = (linksByType[type] || 0) + count;
      }
      for (const [priority, count] of Object.entries(result.countByPriority)) {
        linksByPriority[priority] = (linksByPriority[priority] || 0) + count;
      }
    }

    const averageLinksPerEntity =
      results.size > 0 ? totalLinks / results.size : 0;

    return {
      totalLinks,
      duplicatesRemoved,
      averageLinksPerEntity,
      entitiesAboveMax,
      entitiesBelowMin,
      linksByType: linksByType as any,
      linksByPriority: linksByPriority as any,
      errorCount,
    };
  }

  /**
   * Validate quality metrics against thresholds
   * Returns array of validation errors
   */
  validateQualityMetrics(metrics: LinkQualityMetrics, entityCount: number): string[] {
    const errors: string[] = [];

    if (metrics.duplicatesRemoved > QUALITY_THRESHOLDS.maxDuplicates) {
      errors.push(
        `Too many duplicates: ${metrics.duplicatesRemoved} > ${QUALITY_THRESHOLDS.maxDuplicates}`
      );
    }

    if (metrics.averageLinksPerEntity < QUALITY_THRESHOLDS.minAverageLinks) {
      errors.push(
        `Average links too low: ${metrics.averageLinksPerEntity.toFixed(1)} < ${QUALITY_THRESHOLDS.minAverageLinks}`
      );
    }

    if (metrics.averageLinksPerEntity > QUALITY_THRESHOLDS.maxAverageLinks) {
      errors.push(
        `Average links too high: ${metrics.averageLinksPerEntity.toFixed(1)} > ${QUALITY_THRESHOLDS.maxAverageLinks}`
      );
    }

    const percentAbove = entityCount > 0 ? metrics.entitiesAboveMax / entityCount : 0;
    if (percentAbove > QUALITY_THRESHOLDS.maxEntitiesAboveLimit) {
      errors.push(
        `Too many entities above max: ${(percentAbove * 100).toFixed(1)}% > ${QUALITY_THRESHOLDS.maxEntitiesAboveLimit * 100}%`
      );
    }

    const percentBelow = entityCount > 0 ? metrics.entitiesBelowMin / entityCount : 0;
    if (percentBelow > QUALITY_THRESHOLDS.maxEntitiesBelowLimit) {
      errors.push(
        `Too many entities below min: ${(percentBelow * 100).toFixed(1)}% > ${QUALITY_THRESHOLDS.maxEntitiesBelowLimit * 100}%`
      );
    }

    return errors;
  }

  /**
   * Get links for entity (main entry point)
   * Returns final, de-duplicated, prioritized, limited link set
   */
  async getLinksForEntity(entity: Entity, allEntities: Entity[] = []): Promise<CandidateLink[]> {
    const result = await this.extractLinksForEntity(entity, allEntities);
    return result.links;
  }
}

/**
 * Global link engine instance
 */
let linkEngineInstance: LinkEngine | null = null;

/**
 * Get global link engine instance
 */
export function getLinkEngine(): LinkEngine {
  if (!linkEngineInstance) {
    linkEngineInstance = new LinkEngine();
  }
  return linkEngineInstance;
}

/**
 * Extract links for entity (convenience function)
 */
export async function getLinksForEntity(
  entity: Entity,
  allEntities: Entity[] = []
): Promise<CandidateLink[]> {
  const engine = getLinkEngine();
  return engine.getLinksForEntity(entity, allEntities);
}

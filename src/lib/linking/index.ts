/**
 * Internal Linking System
 *
 * Complete link extraction, bidirectional enforcement, and quality control system.
 * All linking flows through this module.
 *
 * ## Usage
 *
 * ```typescript
 * import { getLinksForEntity, getLinkEngine } from '@/lib/linking';
 *
 * // Get links for a single entity
 * const links = await getLinksForEntity(entity, allEntities);
 *
 * // Get full extraction results with metrics
 * const engine = getLinkEngine();
 * const result = await engine.extractLinksForEntity(entity, allEntities);
 *
 * // Batch extraction for multiple entities
 * const results = await engine.extractLinksForEntities(entities);
 *
 * // Enforce bidirectional links
 * const withReciprocal = await engine.enforceBidirectionalLinks(entities, results);
 *
 * // Calculate quality metrics
 * const metrics = engine.calculateQualityMetrics(results);
 * ```
 *
 * ## Architecture
 *
 * - **Extractors**: Entity-type-specific link extraction logic
 * - **Registry**: Manages and routes to appropriate extractors
 * - **Link Engine**: Orchestrates extraction, deduplication, bidirectional enforcement
 * - **Config**: Centralized configuration for limits, priorities, rules
 * - **Utils**: Matching, validation, filtering helpers
 *
 * ## Adding New Extractors
 *
 * ```typescript
 * import { LinkExtractor, CandidateLink } from '@/lib/linking/types';
 * import { getLinkExtractorRegistry } from '@/lib/linking/registry';
 *
 * class MyExtractor implements LinkExtractor {
 *   entityType = 'my-type' as const;
 *   id = 'my-extractor';
 *
 *   async extract(entity, allEntities) {
 *     // Extract links...
 *     return links;
 *   }
 * }
 *
 * // Register
 * const registry = getLinkExtractorRegistry();
 * registry.register(new MyExtractor());
 * ```
 */

// Main exports
export { LinkEngine, getLinkEngine, getLinksForEntity } from './link-engine';
export {
  LinkExtractorRegistry,
  getLinkExtractorRegistry,
  extractLinksForEntity,
  extractLinksForEntities,
} from './registry';

// Types
export type {
  LinkType,
  LinkContext,
  LinkPriority,
  CandidateLink,
  LinkSlot,
  SlotAllocation,
  LinkExtractionResult,
  LinkExtractor,
  BidirectionalLinkPair,
  LinkQualityMetrics,
} from './types';

// Config
export {
  LINK_LIMITS,
  LINK_TYPE_PRIORITY,
  SLOT_CONFIG,
  BIDIRECTIONAL_RULES,
  RECIPROCAL_LINK_TYPES,
  ANCHOR_TEXT_CONFIG,
  QUALITY_THRESHOLDS,
  PERFORMANCE_LIMITS,
  getLinkLimits,
  getLinkTypePriority,
  shouldBeReciprocal,
  getReciprocalLinkType,
  getSlotConfig,
} from './config';

// Utils
export {
  parseLinkSyntax,
  cleanLinkSyntax,
  slugify,
  matchEntityByName,
  matchEntityBySlug,
  isDuplicateLink,
  deduplicateLinks,
  sortLinksByPriority,
  filterLinksToLimit,
  extractDrugClass,
  extractTherapyModality,
  hasMinimumLinkableData,
  generateLinkId,
  validateCandidateLink,
  extractAllLinkReferences,
  countLinksByType,
  countLinksByPriority,
} from './utils';

// Extractors (for extension/customization)
export { ConditionLinkExtractor } from './extractors/condition-extractor';
export { TreatmentLinkExtractor } from './extractors/treatment-extractor';
export { AssessmentLinkExtractor } from './extractors/assessment-extractor';

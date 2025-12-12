/**
 * Link Placement Engine
 *
 * Allocates extracted links into UI slots based on:
 * - Link type preferences per slot
 * - Slot capacity limits
 * - Link priorities
 *
 * This layer is UI-agnostic: it outputs structured slot allocations
 * that components render without embedding placement logic in JSX.
 */

import type { Entity } from '@/lib/types/database';
import type {
  CandidateLink,
  LinkSlot,
  SlotAllocation,
  LinkType,
  LinkPriority,
} from './types';
import { getSlotConfig, SLOT_CONFIG } from './config';
import { sortLinksByPriority } from './utils';

/**
 * Slot Preference Scoring
 * How well a link type fits a slot
 */
type SlotScore = {
  slot: LinkSlot;
  link: CandidateLink;
  score: number; // Higher = better fit
};

/**
 * PlacementEngine
 *
 * Allocates links to slots based on preferences and constraints
 */
export class PlacementEngine {
  /**
   * Allocate links to slots for an entity
   *
   * @param entity - Source entity
   * @param links - Candidate links to place
   * @returns Array of slot allocations
   */
  allocateLinks(entity: Entity, links: CandidateLink[]): SlotAllocation[] {
    // Sort links by priority first
    const sortedLinks = sortLinksByPriority([...links]);

    // Track which links have been allocated
    const allocated = new Set<CandidateLink>();

    // Build allocations for each slot
    const allocations: SlotAllocation[] = [];

    // Define slot processing order (most important first)
    const slotOrder: LinkSlot[] = [
      'treatment_options',    // Critical for conditions
      'related_conditions',   // High value
      'screening_tools',      // Critical for conditions
      'body_inline',          // Always needed
      'related_articles',     // Medium value
      'sidebar',              // Lower priority
      'footer_nav',           // Lowest priority
    ];

    for (const slot of slotOrder) {
      const allocation = this.allocateLinksToSlot(
        slot,
        sortedLinks,
        allocated,
        entity
      );

      if (allocation.links.length > 0) {
        allocations.push(allocation);
      }
    }

    return allocations;
  }

  /**
   * Allocate links to a specific slot
   */
  private allocateLinksToSlot(
    slot: LinkSlot,
    allLinks: CandidateLink[],
    allocated: Set<CandidateLink>,
    entity: Entity
  ): SlotAllocation {
    const config = getSlotConfig(slot);
    const slotLinks: CandidateLink[] = [];

    // Score each unallocated link for this slot
    const scores: SlotScore[] = [];
    for (const link of allLinks) {
      if (allocated.has(link)) continue;

      const score = this.scoreLinkForSlot(link, slot, config.preferredLinkTypes);
      if (score > 0) {
        scores.push({ slot, link, score });
      }
    }

    // Sort by score (highest first), then by link priority
    scores.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return this.comparePriority(a.link.priority, b.link.priority);
    });

    // Take top N links up to max limit
    for (const { link } of scores.slice(0, config.maxLinks)) {
      slotLinks.push(link);
      allocated.add(link);
    }

    return {
      slot,
      links: slotLinks,
      maxLinks: config.maxLinks,
      minLinks: config.minLinks,
    };
  }

  /**
   * Score a link for a slot
   * Higher score = better fit
   */
  private scoreLinkForSlot(
    link: CandidateLink,
    slot: LinkSlot,
    preferredTypes: LinkType[]
  ): number {
    let score = 0;

    // Base score from link priority
    const priorityScores = {
      critical: 1000,
      high: 100,
      medium: 10,
      low: 1,
    };
    score += priorityScores[link.priority] || 0;

    // Bonus for preferred link type
    const typeIndex = preferredTypes.indexOf(link.linkType);
    if (typeIndex >= 0) {
      // Earlier in preferred list = higher bonus
      score += (preferredTypes.length - typeIndex) * 50;
    }

    // Slot-specific bonuses
    score += this.getSlotSpecificBonus(link, slot);

    return score;
  }

  /**
   * Get slot-specific scoring bonuses
   */
  private getSlotSpecificBonus(link: CandidateLink, slot: LinkSlot): number {
    let bonus = 0;

    switch (slot) {
      case 'treatment_options':
        // Prefer treatment links
        if (link.linkType === 'condition_to_treatment') bonus += 200;
        if (link.metadata?.category === 'medication') bonus += 50;
        if (link.metadata?.category === 'therapy') bonus += 30;
        break;

      case 'related_conditions':
        // Prefer condition links
        if (link.linkType === 'condition_to_related_condition') bonus += 200;
        if (link.linkType === 'condition_to_comorbidity') bonus += 150;
        break;

      case 'screening_tools':
        // Prefer assessment links
        if (link.linkType === 'condition_to_assessment') bonus += 200;
        if (link.metadata?.category === 'assessments-screeners') bonus += 100;
        break;

      case 'body_inline':
        // Prefer contextual, high-value links
        if (link.priority === 'critical') bonus += 100;
        if (link.context && !link.context.includes('reciprocal')) bonus += 50;
        break;

      case 'related_articles':
        // Prefer resource links
        if (link.linkType === 'resource_to_condition') bonus += 100;
        if (link.linkType === 'resource_to_treatment') bonus += 80;
        break;

      case 'sidebar':
        // Prefer hub and related links
        if (link.linkType === 'entity_to_hub') bonus += 100;
        if (link.linkType.includes('related')) bonus += 50;
        break;

      case 'footer_nav':
        // Prefer hub links
        if (link.linkType === 'entity_to_hub') bonus += 100;
        if (link.linkType === 'hub_to_entity') bonus += 80;
        break;
    }

    return bonus;
  }

  /**
   * Compare priorities (higher = better)
   */
  private comparePriority(p1: LinkPriority, p2: LinkPriority): number {
    const order = { critical: 4, high: 3, medium: 2, low: 1 };
    return (order[p1] || 0) - (order[p2] || 0);
  }

  /**
   * Get allocation for specific slot
   */
  getAllocationForSlot(
    allocations: SlotAllocation[],
    slot: LinkSlot
  ): SlotAllocation | null {
    return allocations.find((a) => a.slot === slot) || null;
  }

  /**
   * Validate allocations meet min/max constraints
   */
  validateAllocations(allocations: SlotAllocation[]): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    for (const allocation of allocations) {
      const config = getSlotConfig(allocation.slot);

      if (allocation.links.length > config.maxLinks) {
        warnings.push(
          `${allocation.slot}: ${allocation.links.length} links exceeds max ${config.maxLinks}`
        );
      }

      if (allocation.links.length < config.minLinks) {
        warnings.push(
          `${allocation.slot}: ${allocation.links.length} links below min ${config.minLinks}`
        );
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Get total links across all allocations
   */
  getTotalAllocatedLinks(allocations: SlotAllocation[]): number {
    return allocations.reduce((sum, alloc) => sum + alloc.links.length, 0);
  }

  /**
   * Get links by slot type
   */
  getLinksBySlot(allocations: SlotAllocation[]): Record<LinkSlot, CandidateLink[]> {
    const result = {} as Record<LinkSlot, CandidateLink[]>;

    for (const allocation of allocations) {
      result[allocation.slot] = allocation.links;
    }

    return result;
  }
}

/**
 * Global placement engine instance
 */
let placementEngineInstance: PlacementEngine | null = null;

/**
 * Get global placement engine
 */
export function getPlacementEngine(): PlacementEngine {
  if (!placementEngineInstance) {
    placementEngineInstance = new PlacementEngine();
  }
  return placementEngineInstance;
}

/**
 * Allocate links for entity (convenience function)
 */
export function allocateLinksForEntity(
  entity: Entity,
  links: CandidateLink[]
): SlotAllocation[] {
  const engine = getPlacementEngine();
  return engine.allocateLinks(entity, links);
}

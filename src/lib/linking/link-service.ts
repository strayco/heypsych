/**
 * Link Service
 *
 * High-level convenience API for internal linking.
 * Combines extraction, placement, and quality checks.
 * Use this in page components for simple integration.
 */

import type { Entity } from '@/lib/types/database';
import type { CandidateLink, SlotAllocation } from './types';
import { getLinkEngine } from './link-engine';
import { getPlacementEngine } from './placement-engine';

/**
 * Complete link result for a page
 * Everything needed to render all link sections
 */
export interface PageLinkResult {
  /** All extracted and processed links */
  allLinks: CandidateLink[];

  /** Links allocated to specific slots */
  allocations: SlotAllocation[];

  /** Links by slot (for easy component access) */
  linksBySlot: {
    treatment_options: CandidateLink[];
    related_conditions: CandidateLink[];
    screening_tools: CandidateLink[];
    related_articles: CandidateLink[];
    sidebar: CandidateLink[];
    body_inline: CandidateLink[];
    footer_nav: CandidateLink[];
  };

  /** Metrics */
  metrics: {
    totalLinks: number;
    linksBySlot: Record<string, number>;
  };
}

/**
 * Get complete link result for a page
 * Single function call for everything
 */
export async function getPageLinks(
  entity: Entity,
  allEntities?: Entity[]
): Promise<PageLinkResult> {
  // Extract links
  const linkEngine = getLinkEngine();
  const links = await linkEngine.getLinksForEntity(entity, allEntities);

  // Allocate to slots
  const placementEngine = getPlacementEngine();
  const allocations = placementEngine.allocateLinks(entity, links);

  // Build linksBySlot map
  const linksBySlot = {
    treatment_options: [] as CandidateLink[],
    related_conditions: [] as CandidateLink[],
    screening_tools: [] as CandidateLink[],
    related_articles: [] as CandidateLink[],
    sidebar: [] as CandidateLink[],
    body_inline: [] as CandidateLink[],
    footer_nav: [] as CandidateLink[],
  };

  const linksBySlotCounts: Record<string, number> = {};

  for (const allocation of allocations) {
    linksBySlot[allocation.slot] = allocation.links;
    linksBySlotCounts[allocation.slot] = allocation.links.length;
  }

  return {
    allLinks: links,
    allocations,
    linksBySlot,
    metrics: {
      totalLinks: links.length,
      linksBySlot: linksBySlotCounts,
    },
  };
}

/**
 * Get links for slot (convenience)
 */
export function getLinksForSlot(
  result: PageLinkResult,
  slot: keyof PageLinkResult['linksBySlot']
): CandidateLink[] {
  return result.linksBySlot[slot] || [];
}

/**
 * Check if page has links for slot
 */
export function hasLinksForSlot(
  result: PageLinkResult,
  slot: keyof PageLinkResult['linksBySlot']
): boolean {
  return (result.linksBySlot[slot]?.length || 0) > 0;
}

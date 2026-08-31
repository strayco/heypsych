/**
 * usePlacedProducts Hook
 *
 * Computes placed product analysis from a practice stack.
 * This data is used by both PracticeCanvas (for visualization) and ToolsRail (for the tools list).
 *
 * Extracted to enable state sharing between the canvas and rail components.
 */

import { useMemo } from "react";
import type {
  PracticeStack,
  ProductArchitectureMetadata,
} from "@/domains/architect/schemas";
import {
  type PracticeAreaId,
  PRACTICE_AREAS,
  getOrderedPracticeAreas,
} from "@/app/architect/_components/practice-areas";

/**
 * A placed product with its home location and coverage analysis
 */
export interface PlacedProduct {
  slug: string;
  name: string;
  category: string;
  homeArea: PracticeAreaId;
  homeItemId: string;
  coveredItems: Array<{
    areaId: PracticeAreaId;
    itemId: string;
    itemName: string;
  }>;
  coverageByArea: Map<PracticeAreaId, string[]>;
  totalCoverage: number;
}

interface ProductDisplay {
  slug: string;
  name: string;
  category?: string;
}

/**
 * Map product categories to their natural "home" area
 * Uses V4 category slugs (e.g., "ehr-practice-management") not display labels
 */
const CATEGORY_TO_HOME_AREA: Record<string, PracticeAreaId> = {
  // Clinical care delivery
  "ehr-practice-management": "care",
  "telehealth": "care",
  "telehealth-communication": "care",
  "ai-scribe": "care",
  "ai-scribe-documentation": "care",
  "ai-copilot-clinical": "care",
  "clinical-decision-support": "care",
  "measurement-based-care": "care",
  "measurement-outcomes-dtx": "care",
  "therapy-quality-measurement": "care",
  "digital-therapeutics": "care",
  "prescribing-erx": "care",
  "care-coordination-referrals": "care",
  "care-enablement": "care",

  // Revenue & billing
  "billing-rcm": "money",
  "billing-rcm-insurance": "money",
  "credentialing-workforce": "money",

  // Growth & patient acquisition (provider networks)
  "patient-engagement": "growth",
  "provider-network-virtual-care": "growth",
  "provider-network-w2-employer": "growth",
  "virtual-mental-health-provider": "growth",
  "telepsychiatry-provider": "growth",
  "behavioral-health-provider": "growth",

  // Front door operations
  "intake-scheduling-forms": "front-door",

  // Foundation & compliance
  "compliance-consent-security": "foundation",

  // Back office (supervision, analytics)
  "clinical-supervision": "back-office",
  "analytics-reporting": "back-office",
};

/**
 * Determine which item a product should "live" in within its home area
 */
function getHomeItemForProduct(
  metadata: ProductArchitectureMetadata,
  homeArea: PracticeAreaId
): string {
  const area = PRACTICE_AREAS[homeArea];

  // Find the item with the strongest capability match
  let bestItem = area.items[0]?.id || "";
  let bestScore = 0;

  for (const item of area.items) {
    let score = 0;
    for (const cap of item.capabilities) {
      const productCap = metadata.capabilities.find(c => c.capabilityId === cap);
      if (productCap) {
        score += productCap.strength === "core" ? 3 : productCap.strength === "strong" ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestItem = item.id;
    }
  }

  return bestItem;
}

export interface UsePlacedProductsResult {
  /** Analyzed placed products with coverage information */
  placedProducts: PlacedProduct[];
  /** Get a placed product by slug */
  getPlacedProduct: (slug: string) => PlacedProduct | undefined;
  /** Get products covering a specific area */
  getProductsForArea: (areaId: PracticeAreaId) => PlacedProduct[];
}

/**
 * Hook to compute placed product analysis from a practice stack
 *
 * @example
 * ```tsx
 * const { placedProducts, getPlacedProduct } = usePlacedProducts(
 *   stack,
 *   metadataMap,
 *   productDisplayMap
 * );
 *
 * // Use with ToolsRail
 * const railTools = placedProducts.map(p => createRailTool(p, { ... }));
 * ```
 */
export function usePlacedProducts(
  stack: PracticeStack,
  metadataMap: Map<string, ProductArchitectureMetadata>,
  productDisplayMap: Map<string, ProductDisplay>
): UsePlacedProductsResult {
  const placedProducts = useMemo((): PlacedProduct[] => {
    return stack.selectedProducts.map(selected => {
      const metadata = metadataMap.get(selected.slug);
      const display = productDisplayMap.get(selected.slug);

      if (!metadata || !display) {
        return null;
      }

      // Determine home area from category
      const category = display.category || "EHR";
      const homeArea = CATEGORY_TO_HOME_AREA[category] || "care";
      const homeItemId = getHomeItemForProduct(metadata, homeArea);

      // Find all items this product covers
      const coveredItems: PlacedProduct["coveredItems"] = [];
      const coverageByArea = new Map<PracticeAreaId, string[]>();

      for (const area of getOrderedPracticeAreas()) {
        const coveredInArea: string[] = [];

        for (const item of area.items) {
          if (item.isFoundational) continue;

          const hasCoverage = item.capabilities.some(cap =>
            metadata.capabilities.some(
              c => c.capabilityId === cap && (c.strength === "core" || c.strength === "strong")
            )
          );

          if (hasCoverage) {
            coveredItems.push({
              areaId: area.id,
              itemId: item.id,
              itemName: item.name,
            });
            coveredInArea.push(item.id);
          }
        }

        if (coveredInArea.length > 0) {
          coverageByArea.set(area.id, coveredInArea);
        }
      }

      return {
        slug: selected.slug,
        name: display.name,
        category,
        homeArea,
        homeItemId,
        coveredItems,
        coverageByArea,
        totalCoverage: coveredItems.length,
      };
    }).filter((p): p is PlacedProduct => p !== null);
  }, [stack.selectedProducts, metadataMap, productDisplayMap]);

  const getPlacedProduct = useMemo(() => {
    const productMap = new Map(placedProducts.map(p => [p.slug, p]));
    return (slug: string) => productMap.get(slug);
  }, [placedProducts]);

  const getProductsForArea = useMemo(() => {
    return (areaId: PracticeAreaId) =>
      placedProducts.filter(p => p.coverageByArea.has(areaId));
  }, [placedProducts]);

  return {
    placedProducts,
    getPlacedProduct,
    getProductsForArea,
  };
}

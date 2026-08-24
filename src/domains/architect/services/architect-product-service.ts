/**
 * Architect Product Service
 *
 * Bridges V4 clinician tools to the Architect stack builder.
 * Provides product metadata and display info for the UI.
 */

import type { ClinicianToolV4 } from "@/lib/schemas/clinician-tool-v4";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { deriveArchitectMetadata } from "../adapters/v4-product-adapter";
import type { ProductArchitectureMetadata, CapabilityId } from "../schemas";

// ============================================================================
// PRODUCT DISPLAY INFO
// ============================================================================

/**
 * Display info for a product in the Architect UI
 */
export interface ArchitectProductDisplay {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  categoryLabel: string;
  logoUrl?: string;
  websiteUrl?: string;
  isDemo: false; // Real products are never demo
}

/**
 * Map V4 category to display label
 */
const CATEGORY_LABELS: Record<string, string> = {
  "ehr-practice-management": "EHR & Practice Management",
  "ai-scribe-documentation": "AI Scribe & Documentation",
  "billing-rcm-insurance": "Billing & RCM",
  "telehealth-communication": "Telehealth",
  "credentialing-workforce": "Credentialing",
  "provider-network-virtual-care": "Virtual Care Networks",
  "measurement-outcomes-dtx": "Measurement & Outcomes",
  "ai-copilot-clinical": "AI Copilot",
  "clinical-decision-support": "Clinical Decision Support",
  "patient-engagement": "Patient Engagement",
  "intake-scheduling-forms": "Intake & Scheduling",
  "prescribing-erx": "E-Prescribing",
  "compliance-consent-security": "Compliance & Security",
  "analytics-reporting": "Analytics & Reporting",
  "care-coordination-referrals": "Care Coordination",
};

/**
 * Create display info from V4 tool
 */
function createProductDisplay(tool: ClinicianToolV4): ArchitectProductDisplay {
  return {
    slug: tool.slug,
    name: tool.name,
    tagline: tool.one_liner || tool.short_description || "",
    category: tool.primary_category,
    categoryLabel: CATEGORY_LABELS[tool.primary_category] || tool.primary_category,
    logoUrl: tool.logo_url,
    websiteUrl: tool.website_url,
    isDemo: false,
  };
}

// ============================================================================
// CACHE
// ============================================================================

let metadataMapCache: Map<string, ProductArchitectureMetadata> | null = null;
let displayMapCache: Map<string, ArchitectProductDisplay> | null = null;
let toolsArrayCache: ClinicianToolV4[] | null = null;

// ============================================================================
// SERVICE
// ============================================================================

export class ArchitectProductService {
  /**
   * Load all products with Architect metadata
   *
   * PUBLICATION SAFETY: Only loads publishable products that pass the publication gate.
   * This ensures Architect never exposes draft, pending, archived, or non-allowlisted products.
   * Uses the same publication rules as the public clinician product pages.
   */
  static async loadProducts(): Promise<{
    metadataMap: Map<string, ProductArchitectureMetadata>;
    displayMap: Map<string, ArchitectProductDisplay>;
    tools: ClinicianToolV4[];
  }> {
    // Return cached if available
    if (metadataMapCache && displayMapCache && toolsArrayCache) {
      return {
        metadataMap: metadataMapCache,
        displayMap: displayMapCache,
        tools: toolsArrayCache,
      };
    }

    // PUBLICATION SAFETY: Only load publishable tools (not drafts)
    // This applies the same publication gate as public clinician pages
    const tools = await ClinicianToolService.loadClinicianTools();

    const metadataMap = new Map<string, ProductArchitectureMetadata>();
    const displayMap = new Map<string, ArchitectProductDisplay>();

    for (const tool of tools) {
      try {
        // Derive Architect metadata from V4 data
        const metadata = deriveArchitectMetadata(tool);
        metadataMap.set(tool.slug, metadata);

        // Create display info
        const display = createProductDisplay(tool);
        displayMap.set(tool.slug, display);
      } catch (error) {
        // Log but don't fail - skip tools that can't be adapted
        console.warn(`[ArchitectProductService] Failed to adapt tool ${tool.slug}:`, error);
      }
    }

    // Cache results
    metadataMapCache = metadataMap;
    displayMapCache = displayMap;
    toolsArrayCache = tools;

    console.log(
      `[ArchitectProductService] Loaded ${metadataMap.size} products for Architect`
    );

    return { metadataMap, displayMap, tools };
  }

  /**
   * Get metadata for a single product
   */
  static async getMetadata(slug: string): Promise<ProductArchitectureMetadata | null> {
    const { metadataMap } = await this.loadProducts();
    return metadataMap.get(slug) ?? null;
  }

  /**
   * Get display info for a single product
   */
  static async getDisplay(slug: string): Promise<ArchitectProductDisplay | null> {
    const { displayMap } = await this.loadProducts();
    return displayMap.get(slug) ?? null;
  }

  /**
   * Get products that cover a specific capability
   */
  static async getProductsForCapability(
    capabilityId: CapabilityId
  ): Promise<Array<{ slug: string; metadata: ProductArchitectureMetadata; display: ArchitectProductDisplay }>> {
    const { metadataMap, displayMap } = await this.loadProducts();
    const results: Array<{ slug: string; metadata: ProductArchitectureMetadata; display: ArchitectProductDisplay }> = [];

    for (const [slug, metadata] of metadataMap) {
      const hasCapability = metadata.capabilities.some(
        (cap) => cap.capabilityId === capabilityId
      );

      if (hasCapability) {
        const display = displayMap.get(slug);
        if (display) {
          results.push({ slug, metadata, display });
        }
      }
    }

    // Sort by capability strength (core first)
    const strengthOrder = { core: 0, strong: 1, partial: 2, addon: 3, "integration-only": 4 };
    results.sort((a, b) => {
      const aStrength = a.metadata.capabilities.find((c) => c.capabilityId === capabilityId)?.strength || "partial";
      const bStrength = b.metadata.capabilities.find((c) => c.capabilityId === capabilityId)?.strength || "partial";
      return (strengthOrder[aStrength] ?? 5) - (strengthOrder[bStrength] ?? 5);
    });

    return results;
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(
    category: string
  ): Promise<Array<{ slug: string; metadata: ProductArchitectureMetadata; display: ArchitectProductDisplay }>> {
    const { metadataMap, displayMap, tools } = await this.loadProducts();
    const results: Array<{ slug: string; metadata: ProductArchitectureMetadata; display: ArchitectProductDisplay }> = [];

    for (const tool of tools) {
      if (tool.primary_category === category || tool.secondary_categories.includes(category as never)) {
        const metadata = metadataMap.get(tool.slug);
        const display = displayMap.get(tool.slug);
        if (metadata && display) {
          results.push({ slug: tool.slug, metadata, display });
        }
      }
    }

    return results;
  }

  /**
   * Search products by name or tagline
   */
  static async searchProducts(
    query: string
  ): Promise<Array<{ slug: string; metadata: ProductArchitectureMetadata; display: ArchitectProductDisplay }>> {
    const { metadataMap, displayMap } = await this.loadProducts();
    const results: Array<{ slug: string; metadata: ProductArchitectureMetadata; display: ArchitectProductDisplay }> = [];
    const lowerQuery = query.toLowerCase();

    for (const [slug, display] of displayMap) {
      if (
        display.name.toLowerCase().includes(lowerQuery) ||
        display.tagline.toLowerCase().includes(lowerQuery) ||
        display.categoryLabel.toLowerCase().includes(lowerQuery)
      ) {
        const metadata = metadataMap.get(slug);
        if (metadata) {
          results.push({ slug, metadata, display });
        }
      }
    }

    return results;
  }

  /**
   * Clear cache (for development/testing)
   */
  static clearCache(): void {
    metadataMapCache = null;
    displayMapCache = null;
    toolsArrayCache = null;
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const loadArchitectProducts = ArchitectProductService.loadProducts.bind(ArchitectProductService);
export const getArchitectMetadata = ArchitectProductService.getMetadata.bind(ArchitectProductService);
export const getArchitectDisplay = ArchitectProductService.getDisplay.bind(ArchitectProductService);
export const fetchProductsForCapability = ArchitectProductService.getProductsForCapability.bind(ArchitectProductService);

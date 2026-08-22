// src/lib/tools/campaign-service.ts
// Service for loading and querying tool sponsorship campaigns
// Campaigns are SEPARATE from editorial tool content

import type {
  ToolCampaign,
  CampaignPlacement,
  CampaignAudience,
} from "@/lib/schemas/tool-campaign";
import {
  validateCampaign,
  isCampaignActive,
  campaignMatchesTarget,
} from "@/lib/schemas/tool-campaign";
import { ToolService } from "./tool-service";

// ============================================================================
// SAFE URL UTILITIES
// URL parsing and validation to prevent injection and ensure safe redirects
// ============================================================================

/**
 * Parse a URL safely, returning null if invalid
 */
export function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * Normalize a hostname for comparison
 * Removes www prefix and converts to lowercase
 */
export function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

/**
 * Check if a URL is safe for sponsored redirects
 * - Must be valid HTTPS URL
 * - Must not be a javascript: or data: URL
 * - Must be an external URL (not heypsych.com)
 */
export function isSafeSponsoredUrl(url: string): boolean {
  const parsed = safeParseUrl(url);
  if (!parsed) return false;

  // Must be HTTPS
  if (parsed.protocol !== "https:") return false;

  // Check for dangerous protocols that browsers might execute
  const dangerousProtocols = ["javascript:", "data:", "vbscript:"];
  if (dangerousProtocols.some((p) => url.toLowerCase().startsWith(p))) {
    return false;
  }

  // Don't allow sponsored redirects to our own domain
  const host = normalizeHost(parsed.hostname);
  if (host === "heypsych.com") return false;

  return true;
}

/**
 * Build a safe destination URL for a sponsored tool
 * Falls back to internal tool page if external URL is invalid
 */
export function buildSafeDestinationUrl(
  campaignUrl: string | undefined,
  toolSlug: string
): string {
  // If no campaign URL, use internal tool page
  if (!campaignUrl) {
    return `/tools/${toolSlug}/`;
  }

  // Validate the URL
  if (isSafeSponsoredUrl(campaignUrl)) {
    return campaignUrl;
  }

  // Log warning and fall back to internal page
  console.warn(
    `[CAMPAIGN_SERVICE] Invalid sponsored URL rejected: ${campaignUrl}, falling back to /tools/${toolSlug}/`
  );
  return `/tools/${toolSlug}/`;
}

/**
 * Compare two URLs by normalized host
 */
export function hostsMatch(url1: string, url2: string): boolean {
  const parsed1 = safeParseUrl(url1);
  const parsed2 = safeParseUrl(url2);

  if (!parsed1 || !parsed2) return false;

  return normalizeHost(parsed1.hostname) === normalizeHost(parsed2.hostname);
}

// ============================================================================
// CAMPAIGN LOADER
// ============================================================================

let campaignsCache: ToolCampaign[] | null = null;

function loadServerModule(moduleName: string): any {
  if (typeof window !== "undefined") return null;
  try {
    // eslint-disable-next-line no-eval
    return eval("require")(moduleName);
  } catch {
    return null;
  }
}

async function loadCampaignsFromFiles(): Promise<ToolCampaign[]> {
  if (campaignsCache) return campaignsCache;

  const fs = loadServerModule("fs");
  const path = loadServerModule("path");

  if (!fs || !path) {
    console.warn("File system not available - returning empty campaigns list");
    return [];
  }

  try {
    const campaignsDir = path.join(process.cwd(), "data/resources/tools/campaigns");

    // Create directory if it doesn't exist
    if (!fs.existsSync(campaignsDir)) {
      fs.mkdirSync(campaignsDir, { recursive: true });
      campaignsCache = [];
      return [];
    }

    const files = fs.readdirSync(campaignsDir).filter((f: string) =>
      f.endsWith(".json") && !f.startsWith(".")
    );

    const campaigns: ToolCampaign[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(campaignsDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);

        const result = validateCampaign(data);
        if (result.success && result.data) {
          campaigns.push(result.data);
        } else {
          console.warn(`Invalid campaign in ${file}:`, result.errors?.format());
        }
      } catch (err) {
        console.error(`Error loading campaign file ${file}:`, err);
      }
    }

    // Sort by priority (higher first)
    campaigns.sort((a, b) => (b.priority ?? 50) - (a.priority ?? 50));

    campaignsCache = campaigns;
    return campaigns;
  } catch (error) {
    console.error("Error loading campaigns:", error);
    return [];
  }
}

// ============================================================================
// CAMPAIGN SERVICE
// ============================================================================

export interface SponsoredTool {
  toolSlug: string;
  campaign: ToolCampaign;
  disclosureLabel: string;
  destinationUrl: string;
  trackingId?: string;
}

export class CampaignService {
  /**
   * Get all active campaigns
   */
  static async getActiveCampaigns(): Promise<ToolCampaign[]> {
    const all = await loadCampaignsFromFiles();
    return all.filter(isCampaignActive);
  }

  /**
   * Get sponsored tools for a specific placement and audience
   * Returns tools with their campaign data for rendering
   */
  static async getSponsoredTools(
    placement: CampaignPlacement,
    audience: CampaignAudience = "all",
    hubSlug?: string,
    limit?: number
  ): Promise<SponsoredTool[]> {
    const campaigns = await loadCampaignsFromFiles();

    // Filter matching campaigns
    const matching = campaigns.filter((c) =>
      campaignMatchesTarget(c, placement, audience, hubSlug)
    );

    // Verify tools exist and are active
    const results: SponsoredTool[] = [];

    for (const campaign of matching) {
      const tool = await ToolService.getBySlug(campaign.tool_slug);

      // Tool must exist and be active
      if (!tool || tool.status !== "active") {
        continue;
      }

      results.push({
        toolSlug: campaign.tool_slug,
        campaign,
        disclosureLabel: campaign.disclosure_label,
        // Use safe URL builder to validate and normalize destination
        destinationUrl: buildSafeDestinationUrl(campaign.destination_url, campaign.tool_slug),
        trackingId: campaign.tracking_id,
      });

      if (limit && results.length >= limit) break;
    }

    return results;
  }

  /**
   * Get a single sponsored tool for a placement (highest priority)
   */
  static async getTopSponsoredTool(
    placement: CampaignPlacement,
    audience: CampaignAudience = "all",
    hubSlug?: string
  ): Promise<SponsoredTool | null> {
    const results = await this.getSponsoredTools(placement, audience, hubSlug, 1);
    return results[0] || null;
  }

  /**
   * Check if a tool has an active sponsorship for a placement
   */
  static async isToolSponsored(
    toolSlug: string,
    placement: CampaignPlacement
  ): Promise<boolean> {
    const campaigns = await loadCampaignsFromFiles();
    return campaigns.some(
      (c) =>
        c.tool_slug === toolSlug &&
        c.placements.includes(placement) &&
        isCampaignActive(c)
    );
  }

  /**
   * Get campaign for a specific tool (if any active)
   */
  static async getCampaignForTool(toolSlug: string): Promise<ToolCampaign | null> {
    const campaigns = await loadCampaignsFromFiles();
    return campaigns.find((c) => c.tool_slug === toolSlug && isCampaignActive(c)) || null;
  }

  /**
   * Clear cache (for development)
   */
  static clearCache(): void {
    campaignsCache = null;
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const getSponsoredTools = CampaignService.getSponsoredTools.bind(CampaignService);
export const getTopSponsoredTool = CampaignService.getTopSponsoredTool.bind(CampaignService);
export const isToolSponsored = CampaignService.isToolSponsored.bind(CampaignService);

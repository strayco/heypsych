// src/lib/schemas/tool-campaign.ts
// Sponsorship Campaign Schema - Separate from editorial tool content
import { z } from "zod";

// ============================================================================
// CAMPAIGN ENUMS
// ============================================================================

/**
 * Placement types for sponsored content
 */
export const CampaignPlacementZ = z.enum([
  "tools-landing-hero",
  "tools-landing-featured",
  "hub-top-picks",
  "hub-inline",
  "tool-profile-alternatives",
  "clinician-landing-featured",
  "patient-landing-featured",
  "search-results",
  "comparison-page",
]);

/**
 * Audience targeting for campaigns
 */
export const CampaignAudienceZ = z.enum([
  "all",
  "clinician",
  "patient",
]);

/**
 * Campaign status
 */
export const CampaignStatusZ = z.enum([
  "draft",
  "scheduled",
  "active",
  "paused",
  "completed",
  "cancelled",
]);

// ============================================================================
// CAMPAIGN SCHEMA
// ============================================================================

/**
 * Tool Campaign Schema
 *
 * Campaigns are SEPARATE from editorial tool content.
 * Campaigns CANNOT influence editorial review, clinical review,
 * privacy grades, evidence ratings, organic rankings, or index eligibility.
 */
export const ToolCampaignZ = z.object({
  campaign_id: z.string().regex(/^camp_[a-z0-9]+$/, "Campaign ID must match camp_[a-z0-9]+"),
  tool_slug: z.string().min(1),
  placements: z.array(CampaignPlacementZ).min(1),
  audience: CampaignAudienceZ.default("all"),
  target_hubs: z.array(z.string()).optional(),
  target_clinician_hubs: z.array(z.string()).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  priority: z.number().int().min(1).max(100).default(50),
  disclosure_label: z.literal("Sponsored").default("Sponsored"),
  destination_url: z.string().url().optional(),
  tracking_id: z.string().optional(),
  status: CampaignStatusZ.default("draft"),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CampaignPlacement = z.infer<typeof CampaignPlacementZ>;
export type CampaignAudience = z.infer<typeof CampaignAudienceZ>;
export type CampaignStatus = z.infer<typeof CampaignStatusZ>;
export type ToolCampaign = z.infer<typeof ToolCampaignZ>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateCampaign(data: unknown): {
  success: boolean;
  data?: ToolCampaign;
  errors?: z.ZodError;
} {
  const result = ToolCampaignZ.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function isValidCampaign(data: unknown): data is ToolCampaign {
  return ToolCampaignZ.safeParse(data).success;
}

export function isCampaignActive(campaign: ToolCampaign): boolean {
  if (campaign.status !== "active") return false;
  const today = new Date().toISOString().split("T")[0];
  if (campaign.start_date > today) return false;
  if (campaign.end_date && campaign.end_date <= today) return false;
  return true;
}

export function campaignMatchesTarget(
  campaign: ToolCampaign,
  placement: CampaignPlacement,
  audience: CampaignAudience,
  hubSlug?: string
): boolean {
  if (!isCampaignActive(campaign)) return false;
  if (!campaign.placements.includes(placement)) return false;
  if (campaign.audience !== "all" && campaign.audience !== audience) return false;
  if (hubSlug && campaign.target_hubs?.length) {
    if (!campaign.target_hubs.includes(hubSlug)) return false;
  }
  return true;
}

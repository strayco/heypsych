/**
 * Sponsored placements on the Apps & Tools hubs.
 *
 * A placement is a paid, clearly labelled card that sits beside our picks,
 * never inside them: it does not change which products are picked, their
 * order, or their notes. It renders only for an active campaign
 * (data/resources/tools/campaigns/*.json, status "active", within its dates)
 * whose product is published and not switched off by the commercial kill
 * switch. With no campaigns, nothing renders.
 */

import { CampaignService, isSafeSponsoredUrl } from "@/lib/tools/campaign-service";
import { campaignMatchesTarget, type CampaignPlacement } from "@/lib/schemas/tool-campaign";
import { ToolService } from "@/lib/tools/tool-service";
import { ClinicianToolService, isToolPublishable } from "@/lib/tools/clinician-tool-service";
import { clinicianToolPath } from "@/lib/tools/category-hub-slug";
import { shouldShowCommercialLink } from "./kill-switch";

export interface SponsoredPlacement {
  campaignId: string;
  slug: string;
  name: string;
  /** Our profile of the product. */
  profileHref: string;
  summary: string | null;
  offer: string | null;
  /** The sponsor's destination (validated https), else the vendor site. */
  href: string;
  trackingId: string | null;
}

function firstSentence(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.trim().match(/^.+?[.!?](?=\s|$)/);
  return (m ? m[0] : text.trim()) || null;
}

export async function getSponsoredPlacement({
  audience,
  hub,
  placement = "hub-top-picks",
}: {
  audience: "patient" | "clinician";
  hub?: string;
  placement?: CampaignPlacement;
}): Promise<SponsoredPlacement | null> {
  const campaigns = await CampaignService.getActiveCampaigns();
  for (const c of campaigns) {
    if (!campaignMatchesTarget(c, placement, audience, hub)) continue;
    // A campaign aimed at specific hubs never shows on a page without one.
    if (!hub && c.target_hubs?.length) continue;
    if (!shouldShowCommercialLink(c.tool_slug)) continue;
    const destination = c.destination_url && isSafeSponsoredUrl(c.destination_url) ? c.destination_url : null;

    if (audience === "clinician") {
      const tool = await ClinicianToolService.getBySlug(c.tool_slug);
      if (!tool || !isToolPublishable(tool)) continue;
      const profileHref = clinicianToolPath(tool);
      const href = destination ?? tool.website_url ?? null;
      if (!profileHref || !href) continue;
      return {
        campaignId: c.campaign_id,
        slug: tool.slug,
        name: tool.name,
        profileHref,
        summary: firstSentence(tool.one_liner ?? tool.short_description),
        offer: c.offer ?? null,
        href,
        trackingId: c.tracking_id ?? null,
      };
    }

    const tool = await ToolService.getBySlug(c.tool_slug);
    if (!tool || tool.status !== "active") continue;
    const href = destination ?? tool.app_metadata?.website ?? null;
    if (!href) continue;
    return {
      campaignId: c.campaign_id,
      slug: tool.slug,
      name: tool.name,
      profileHref: `/tools/${tool.slug}`,
      summary: firstSentence(tool.patient_summary ?? tool.one_liner),
      offer: c.offer ?? null,
      href,
      trackingId: c.tracking_id ?? null,
    };
  }
  return null;
}

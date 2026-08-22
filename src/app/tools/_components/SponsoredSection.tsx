// Sponsored Section Component
// Displays sponsored tools with clear disclosure

import Link from "next/link";
import { ExternalLink, Info, Star } from "lucide-react";
import type { SponsoredTool } from "@/lib/tools/campaign-service";
import { ToolService } from "@/lib/tools/tool-service";
import { SponsoredToolCardClient } from "./SponsoredToolCardClient";

interface SponsoredSectionProps {
  sponsoredTools: SponsoredTool[];
}

export async function SponsoredSection({ sponsoredTools }: SponsoredSectionProps) {
  // Load full tool data for each sponsored tool
  const toolsWithData = await Promise.all(
    sponsoredTools.map(async (st) => {
      const tool = await ToolService.getBySlug(st.toolSlug);
      return { sponsored: st, tool };
    })
  );

  // Filter out any that didn't load
  const validTools = toolsWithData.filter((t) => t.tool !== null);

  if (validTools.length === 0) return null;

  return (
    <section className="border-b border-separator bg-canvas/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header with disclosure */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-fill-tertiary px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-label-secondary">
              Sponsored
            </span>
          </div>
          <Link
            href="/about/sponsorship-policy"
            className="flex items-center gap-1 text-xs text-label-tertiary hover:text-label-secondary transition-colors"
            aria-label="Learn about our sponsorship policy"
          >
            <Info className="h-3.5 w-3.5" />
            About sponsored listings
          </Link>
        </div>

        {/* Sponsored tools grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {validTools.map(({ sponsored, tool }) => (
            <SponsoredToolCardClient
              key={sponsored.campaign.campaign_id}
              toolSlug={sponsored.toolSlug}
              toolName={tool!.name}
              toolRating={tool!.app_rating}
              shortDescription={tool!.short_description}
              disclosureLabel={sponsored.disclosureLabel}
              destinationUrl={sponsored.destinationUrl}
              campaignId={sponsored.campaign.campaign_id}
              placement={sponsored.campaign.placements[0]}
              trackingId={sponsored.trackingId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


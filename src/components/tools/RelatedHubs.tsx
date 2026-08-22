"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import type { HubSlug } from "@/lib/schemas/digital-tool-v3";

interface RelatedHubsProps {
  hubSlugs: HubSlug[];
  currentToolSlug?: string;
}

/**
 * RelatedHubs Component
 * 
 * Links to hub pages that contain this tool.
 */
export function RelatedHubs({ hubSlugs, currentToolSlug }: RelatedHubsProps) {
  if (!hubSlugs || hubSlugs.length === 0) {
    return null;
  }

  const hubs = hubSlugs
    .map((slug) => TaxonomyService.getHub(slug))
    .filter((h): h is NonNullable<typeof h> => h !== null);

  if (hubs.length === 0) {
    return null;
  }

  return (
    <section className="py-6 border-t border-separator">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-label-primary mb-4">
          Browse More Tools
        </h2>

        <div className="flex flex-wrap gap-3">
          {hubs.map((hub) => (
            <Link
              key={hub.slug}
              href={hub.url}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-separator rounded-full text-sm font-medium text-label-secondary hover:border-accent-500 hover:text-accent hover:bg-accent-tint transition-colors"
            >
              {hub.display_name}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RelatedHubs;

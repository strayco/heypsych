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
    <section className="border-t border-separator py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
          Categories
        </p>
        <h2 className="mt-1 text-lg font-semibold text-label-primary">
          Browse More Tools
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {hubs.map((hub) => (
            <Link
              key={hub.slug}
              href={hub.url}
              className="group inline-flex items-center gap-2 px-3 py-1.5 border border-separator rounded-lg text-sm text-label-secondary hover:border-neutral-300 hover:text-accent transition-colors"
            >
              {hub.display_name}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RelatedHubs;

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import type { HubSlug } from "@/lib/schemas/digital-tool-v3";

interface RelatedHubsProps {
  hubSlugs: HubSlug[];
  currentToolSlug?: string;
  currentToolName?: string;
}

/**
 * RelatedHubs Component
 *
 * Links to hub pages that contain this tool.
 * Enhanced with SEO-optimized internal linking.
 */
export function RelatedHubs({ hubSlugs, currentToolSlug, currentToolName }: RelatedHubsProps) {
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
    <section className="border-t border-separator py-8" aria-labelledby="related-categories-heading">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
          Categories
        </p>
        <h2 id="related-categories-heading" className="mt-1 text-lg font-semibold text-label-primary">
          Browse More {currentToolName ? `Apps Like ${currentToolName}` : "Mental Health Apps"}
        </h2>

        {/* Contextual intro for SEO */}
        <p className="mt-2 text-sm text-label-secondary">
          {currentToolName
            ? `${currentToolName} is part of these categories. Find more apps for your specific needs:`
            : "Find the best mental health apps by category:"}
        </p>

        {/* Hub buttons with keyword-rich anchor text */}
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Related app categories">
          {hubs.map((hub) => (
            <Link
              key={hub.slug}
              href={hub.url}
              className="group inline-flex items-center gap-2 px-3 py-1.5 border border-separator rounded-lg text-sm text-label-secondary hover:border-neutral-300 hover:text-accent transition-colors"
              title={`Best ${hub.display_name} apps - compare free and paid options`}
            >
              {hub.display_name}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </nav>

        {/* Text link variations for additional keyword coverage */}
        <div className="mt-4 text-sm text-label-tertiary">
          <span>Also explore: </span>
          {hubs.map((hub, index) => (
            <span key={hub.slug}>
              <Link href={hub.url} className="text-accent hover:underline">
                Best {hub.display_name.replace(" Apps", "")} apps 2026
              </Link>
              {index < hubs.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RelatedHubs;

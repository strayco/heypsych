"use client";

import type { HubConfig, SubHubConfig } from "@/lib/tools/taxonomy-service";

interface HubHeroProps {
  hub: HubConfig | SubHubConfig;
  toolCount?: number;
}

/**
 * HubHero Component
 * 
 * Hero section for hub pages with direct answer and intro.
 */
export function HubHero({ hub, toolCount }: HubHeroProps) {
  return (
    <section className="bg-gradient-to-br from-accent-900/20 via-surface to-surface border-b border-separator">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-label-primary sm:text-4xl mb-4">
          {hub.display_name}
        </h1>

        {/* Direct Answer - key for AEO */}
        <div className="bg-surface rounded-lg p-5 border border-indigo-200 shadow-sm mb-6">
          <p className="text-lg text-label-secondary leading-relaxed">
            {hub.direct_answer}
          </p>
        </div>

        {/* Intro */}
        <p className="text-label-tertiary leading-relaxed">
          {hub.intro}
        </p>

        {/* Tool count */}
        {toolCount !== undefined && (
          <p className="mt-4 text-sm text-label-primary0">
            Showing {toolCount} tool{toolCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </section>
  );
}

export default HubHero;

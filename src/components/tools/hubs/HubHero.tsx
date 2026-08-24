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
    <section className="border-b border-separator bg-surface">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
          Tools
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-label-primary sm:text-4xl">
          {hub.display_name}
        </h1>

        {/* Direct Answer */}
        <p className="mt-4 text-lg text-label-secondary leading-relaxed">
          {hub.direct_answer}
        </p>

        {/* Intro */}
        <p className="mt-3 text-label-tertiary leading-relaxed">
          {hub.intro}
        </p>

        {/* Tool count */}
        {toolCount !== undefined && (
          <p className="mt-4 text-sm text-label-tertiary">
            {toolCount} tool{toolCount !== 1 ? "s" : ""} available
          </p>
        )}
      </div>
    </section>
  );
}

export default HubHero;

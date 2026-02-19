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
    <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-b border-neutral-200">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl mb-4">
          {hub.display_name}
        </h1>

        {/* Direct Answer - key for AEO */}
        <div className="bg-white rounded-lg p-5 border border-indigo-200 shadow-sm mb-6">
          <p className="text-lg text-neutral-700 leading-relaxed">
            {hub.direct_answer}
          </p>
        </div>

        {/* Intro */}
        <p className="text-neutral-600 leading-relaxed">
          {hub.intro}
        </p>

        {/* Tool count */}
        {toolCount !== undefined && (
          <p className="mt-4 text-sm text-neutral-500">
            Showing {toolCount} tool{toolCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </section>
  );
}

export default HubHero;

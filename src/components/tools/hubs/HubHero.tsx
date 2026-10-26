"use client";

import type { HubConfig, SubHubConfig } from "@/lib/tools/taxonomy-service";
import { PageIntro } from "@/components/brand/PageIntro";

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
    <PageIntro
      title={hub.display_name}
      object="tools"
      description={hub.direct_answer}
      footnote={
        toolCount !== undefined
          ? `${toolCount} tool${toolCount !== 1 ? "s" : ""} compared.`
          : undefined
      }
    >
      {hub.intro && (
        <p className="max-w-2xl text-[15px] leading-relaxed text-label-tertiary">{hub.intro}</p>
      )}
    </PageIntro>
  );
}

export default HubHero;

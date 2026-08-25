// src/app/tools/substance-use/page.tsx
// Substance Use & Recovery Hub Page

import { Metadata } from "next";
import { HubPageContent } from "../_components/HubPageContent";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";

const HUB_SLUG = "substance-use";

export async function generateMetadata(): Promise<Metadata> {
  const hub = TaxonomyService.getHub(HUB_SLUG);
  if (!hub) {
    return { title: "Substance Use & Recovery Tools" };
  }

  return {
    title: hub.seo_title,
    description: hub.meta_description,
    alternates: {
      canonical: `https://heypsych.com${hub.url}`,
    },
  };
}

export default async function SubstanceUseHubPage() {
  const hub = TaxonomyService.getHub(HUB_SLUG);
  if (!hub) {
    return <div>Hub not found</div>;
  }

  const tools = await ToolService.getByHub(HUB_SLUG);
  const topPicks = await ToolService.getTopPicks(HUB_SLUG);

  return (
    <HubPageContent
      hub={hub}
      tools={tools}
      topPicks={topPicks}
    />
  );
}

export const revalidate = 86400;

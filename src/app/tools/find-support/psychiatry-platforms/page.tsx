// src/app/tools/find-support/psychiatry-platforms/page.tsx
// Psychiatry Platforms Sub-Hub Page

import { Metadata } from "next";
import { HubPageContent } from "../../_components/HubPageContent";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";

const SUB_HUB_SLUG = "psychiatry-platforms";

export async function generateMetadata(): Promise<Metadata> {
  const subHub = TaxonomyService.getSubHub(SUB_HUB_SLUG);
  if (!subHub) {
    return { title: "Online Psychiatry Platforms | HeyPsych" };
  }

  return {
    title: subHub.seo_title,
    description: subHub.meta_description,
    alternates: {
      canonical: `https://heypsych.com${subHub.url}`,
    },
  };
}

export default async function PsychiatryPlatformsPage() {
  const subHub = TaxonomyService.getSubHub(SUB_HUB_SLUG);
  if (!subHub) {
    return <div>Sub-hub not found</div>;
  }

  const tools = await ToolService.getBySubHub(SUB_HUB_SLUG);
  const topPicks = tools.filter((t) => subHub.top_picks.includes(t.slug));

  return (
    <HubPageContent
      hub={subHub}
      tools={tools}
      topPicks={topPicks}
      parentHubUrl="/tools/find-support/"
    />
  );
}

export const revalidate = 86400;

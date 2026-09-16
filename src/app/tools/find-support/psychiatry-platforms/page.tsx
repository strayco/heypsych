// src/app/tools/find-support/psychiatry-platforms/page.tsx
// Psychiatry Platforms Sub-Hub Page

import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { HubPageContent } from "../../_components/HubPageContent";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";

const SUB_HUB_SLUG = "psychiatry-platforms";

export async function generateMetadata(): Promise<Metadata> {
  const subHub = TaxonomyService.getSubHub(SUB_HUB_SLUG);
  if (!subHub) {
    return { title: "Online Psychiatry Platforms" };
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
    <>
      <HubPageContent
        hub={subHub}
        tools={tools}
        topPicks={topPicks}
        parentHubUrl="/tools/find-support/"
      />

      {/* Search CTA - Find more psychiatrists */}
      <section className="border-t border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Search className="mx-auto h-10 w-10 text-violet-500" />
          <h2 className="mt-4 text-xl font-semibold text-label-primary">
            Looking for more options?
          </h2>
          <p className="mt-2 text-label-secondary">
            Search our full directory to find psychiatrists and prescribers in your area.
          </p>
          <Link
            href="/tools/search/?q=psychiatry"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-700"
          >
            Search all psychiatry options
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

export const revalidate = 86400;

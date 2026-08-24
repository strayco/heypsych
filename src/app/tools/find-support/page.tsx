// src/app/tools/find-support/page.tsx
// Find Support Hub Page (with sub-hubs)

import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle, Stethoscope, Bot } from "lucide-react";
import { HubPageContent } from "../_components/HubPageContent";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";

const HUB_SLUG = "find-support";

export async function generateMetadata(): Promise<Metadata> {
  const hub = TaxonomyService.getHub(HUB_SLUG);
  if (!hub) {
    return { title: "Find Professional Support | HeyPsych" };
  }

  return {
    title: hub.seo_title,
    description: hub.meta_description,
    alternates: {
      canonical: `https://heypsych.com${hub.url}`,
    },
  };
}

const subHubIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "therapy-platforms": MessageCircle,
  "psychiatry-platforms": Stethoscope,
  "ai-therapists": Bot,
};

export default async function FindSupportHubPage() {
  const hub = TaxonomyService.getHub(HUB_SLUG);
  if (!hub) {
    return <div>Hub not found</div>;
  }

  const subHubs = TaxonomyService.getSubHubsForHub(HUB_SLUG);
  const tools = await ToolService.getByHub(HUB_SLUG);
  const topPicks = await ToolService.getTopPicks(HUB_SLUG);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hub Content */}
      <HubPageContent
        hub={hub}
        tools={tools}
        topPicks={topPicks}
        hideFilters
      />

      {/* Sub-Hub Navigation */}
      {subHubs.length > 0 && (
        <section className="px-4 py-10 sm:px-6 lg:px-8 bg-canvas border-t border-separator">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              Categories
            </p>
            <h2 className="mt-1 text-xl font-semibold text-label-primary sm:text-2xl mb-6">
              Browse by Type
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              {subHubs.map((subHub) => {
                const Icon = subHubIcons[subHub.slug] || MessageCircle;

                return (
                  <Link
                    key={subHub.slug}
                    href={subHub.url}
                    className="group p-6 rounded-xl border border-separator bg-surface hover:border-neutral-300 hover:shadow-soft transition-all"
                  >
                    <Icon className="h-6 w-6 text-label-tertiary mb-4" />

                    <h3 className="font-semibold text-lg text-label-primary group-hover:text-accent transition-colors">
                      {subHub.display_name}
                    </h3>

                    <p className="mt-2 text-sm text-label-secondary">
                      {subHub.direct_answer.slice(0, 100)}...
                    </p>

                    <div className="mt-4 flex items-center gap-1 text-label-primary text-sm font-medium">
                      View platforms
                      <ArrowRight className="h-4 w-4 text-label-tertiary group-hover:translate-x-0.5 group-hover:text-accent transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export const revalidate = 86400;

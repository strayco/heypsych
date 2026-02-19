"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { HubHero, TopPicks, ToolGrid, HubFilters, HubFAQ } from "@/components/tools/hubs";
import type { ClinicianHubConfig } from "@/lib/tools/taxonomy-service";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface ClinicianHubPageContentProps {
  hub: ClinicianHubConfig;
  tools: DigitalToolV3[];
  topPicks: DigitalToolV3[];
}

/**
 * ClinicianHubPageContent Component
 * 
 * Shared content component for clinician hub pages.
 * Handles client-side filtering while keeping page server-rendered.
 */
export function ClinicianHubPageContent({
  hub,
  tools,
  topPicks,
}: ClinicianHubPageContentProps) {
  const [filteredTools, setFilteredTools] = useState(tools);

  // Generate structured data
  const structuredData = generateClinicianHubStructuredData(hub, tools);

  // Adapt hub to HubConfig-like shape for existing components
  const hubConfig = {
    slug: hub.slug,
    url: hub.url,
    display_name: hub.display_name,
    seo_title: hub.seo_title,
    meta_description: hub.meta_description,
    direct_answer: hub.direct_answer,
    intro: hub.intro,
    top_picks: hub.top_picks,
    icon: hub.icon || "search",
    color: hub.color || "blue",
    faqs: hub.faqs,
  };

  return (
    <>
      {/* Structured Data */}
      {structuredData.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Back Navigation */}
        <nav className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href="/tools/for-clinicians/"
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to For Clinicians
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <HubHero hub={hubConfig} toolCount={filteredTools.length} />

        {/* Top Picks */}
        {topPicks.length > 0 && (
          <TopPicks tools={topPicks} title="Our Top Picks" />
        )}

        {/* Main Content */}
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="lg:grid lg:grid-cols-4 lg:gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1 mb-6 lg:mb-0">
                <div className="sticky top-4">
                  <HubFilters
                    tools={tools}
                    onFilterChange={setFilteredTools}
                    hubSlug={hub.slug}
                  />
                </div>
              </div>

              {/* Tool Grid */}
              <div className="lg:col-span-3">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-neutral-600">
                    Showing {filteredTools.length} of {tools.length} tools
                  </p>
                </div>

                <ToolGrid
                  tools={filteredTools}
                  onClearFilters={() => setFilteredTools(tools)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Related Clinician Hubs */}
        <RelatedClinicianHubs currentHubSlug={hub.slug} />

        {/* FAQ */}
        <HubFAQ faqs={hub.faqs} hubName={hub.display_name} />

        {/* Trust Signal */}
        <section className="px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
              <Shield className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                All tools reviewed by the{" "}
                <Link href="/about/medical-review-board" className="underline hover:no-underline">
                  HeyPsych Medical Board
                </Link>
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// Related Clinician Hubs component
function RelatedClinicianHubs({ currentHubSlug }: { currentHubSlug: string }) {
  // Import at runtime to avoid circular deps
  const { TaxonomyService } = require("@/lib/tools/taxonomy-service");
  const allHubs = TaxonomyService.getAllClinicianHubs();
  const relatedHubs = allHubs.filter((h: ClinicianHubConfig) => h.slug !== currentHubSlug).slice(0, 3);

  if (relatedHubs.length === 0) return null;

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8 bg-neutral-50 border-y border-neutral-200">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Other Clinician Tool Categories
        </h2>
        <div className="flex flex-wrap gap-3">
          {relatedHubs.map((hub: ClinicianHubConfig) => (
            <Link
              key={hub.slug}
              href={hub.url}
              className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {hub.display_name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Generate structured data for the clinician hub
function generateClinicianHubStructuredData(hub: ClinicianHubConfig, tools: DigitalToolV3[]): object[] {
  const schemas: object[] = [];

  // BreadcrumbList
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Tools",
        item: "https://heypsych.com/tools/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "For Clinicians",
        item: "https://heypsych.com/tools/for-clinicians/",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: hub.display_name,
        item: `https://heypsych.com${hub.url}`,
      },
    ],
  });

  // FAQPage
  if (hub.faqs && hub.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: hub.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    });
  }

  // ItemList for tools
  if (tools.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: hub.display_name,
      numberOfItems: tools.length,
      itemListElement: tools.slice(0, 10).map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        url: `https://heypsych.com/tools/${tool.slug}/`,
      })),
    });
  }

  return schemas;
}

export default ClinicianHubPageContent;

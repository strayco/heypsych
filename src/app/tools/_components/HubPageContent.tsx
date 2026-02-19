"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { HubHero, TopPicks, ToolGrid, HubFilters, HubFAQ } from "@/components/tools/hubs";
import type { HubConfig, SubHubConfig } from "@/lib/tools/taxonomy-service";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface HubPageContentProps {
  hub: HubConfig | SubHubConfig;
  tools: DigitalToolV3[];
  topPicks: DigitalToolV3[];
  parentHubUrl?: string;
  hideFilters?: boolean;
}

/**
 * HubPageContent Component
 * 
 * Shared content component for hub and sub-hub pages.
 * Handles client-side filtering while keeping page server-rendered.
 */
export function HubPageContent({
  hub,
  tools,
  topPicks,
  parentHubUrl,
  hideFilters = false,
}: HubPageContentProps) {
  const [filteredTools, setFilteredTools] = useState(tools);

  // Generate structured data
  const structuredData = generateHubStructuredData(hub, tools);

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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        {/* Back Navigation */}
        <nav className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href={parentHubUrl || "/tools/"}
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {parentHubUrl ? "Back to Find Support" : "Back to Tools"}
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <HubHero hub={hub} toolCount={filteredTools.length} />

        {/* Top Picks */}
        {topPicks.length > 0 && (
          <TopPicks tools={topPicks} title="Our Top Picks" />
        )}

        {/* Main Content */}
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className={hideFilters ? "" : "lg:grid lg:grid-cols-4 lg:gap-8"}>
              {/* Filters Sidebar */}
              {!hideFilters && (
                <div className="lg:col-span-1 mb-6 lg:mb-0">
                  <div className="sticky top-4">
                    <HubFilters
                      tools={tools}
                      onFilterChange={setFilteredTools}
                      hubSlug={hub.slug}
                    />
                  </div>
                </div>
              )}

              {/* Tool Grid */}
              <div className={hideFilters ? "" : "lg:col-span-3"}>
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

// Generate structured data for the hub
function generateHubStructuredData(hub: HubConfig | SubHubConfig, tools: DigitalToolV3[]): object[] {
  const schemas: object[] = [];

  // BreadcrumbList
  const isSubHub = "parent_hub" in hub;
  const breadcrumbs: any[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Tools",
      item: "https://heypsych.com/tools/",
    },
  ];

  if (isSubHub) {
    breadcrumbs.push({
      "@type": "ListItem",
      position: 2,
      name: "Find Support",
      item: "https://heypsych.com/tools/find-support/",
    });
    breadcrumbs.push({
      "@type": "ListItem",
      position: 3,
      name: hub.display_name,
      item: `https://heypsych.com${hub.url}`,
    });
  } else {
    breadcrumbs.push({
      "@type": "ListItem",
      position: 2,
      name: hub.display_name,
      item: `https://heypsych.com${hub.url}`,
    });
  }

  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs,
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

export default HubPageContent;

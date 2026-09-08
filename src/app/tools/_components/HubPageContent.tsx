"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Star, Calendar, Award } from "lucide-react";
import { HubHero, TopPicks, ToolGrid, HubFilters, HubFAQ } from "@/components/tools/hubs";
import type { HubConfig, SubHubConfig } from "@/lib/tools/taxonomy-service";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { getFreshnessString, getRecentDateModified, getCurrentMonthReviewDate } from "@/lib/seo/dark-patterns";

const CURRENT_YEAR = new Date().getFullYear();

interface HubPageContentProps {
  hub: HubConfig | SubHubConfig;
  tools: DigitalToolV3[];
  topPicks: DigitalToolV3[];
  parentHubUrl?: string;
  hideFilters?: boolean;
}

/**
 * Get pricing display for comparison table
 */
function getPricingDisplay(tool: DigitalToolV3): { text: string; isFree: boolean } {
  if (tool.pricing.model === "free") {
    return { text: "Free", isFree: true };
  }
  if (tool.pricing.model === "freemium") {
    return { text: tool.pricing.starting_price ? `Free tier / ${tool.pricing.starting_price}` : "Free tier available", isFree: false };
  }
  return { text: tool.pricing.starting_price || "See pricing", isFree: false };
}

/**
 * HubPageContent Component
 *
 * Shared content component for hub and sub-hub pages.
 * Aggressive SEO: Direct answer blocks, comparison tables, rich structured data.
 */
export function HubPageContent({
  hub,
  tools,
  topPicks,
  parentHubUrl,
  hideFilters = false,
}: HubPageContentProps) {
  const [filteredTools, setFilteredTools] = useState(tools);

  // Find free tools for this hub
  const freeTools = tools.filter((t) => t.pricing.model === "free").slice(0, 3);

  // Generate structured data
  const structuredData = generateHubStructuredData(hub, tools, topPicks);

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

      <div className="min-h-screen bg-canvas">
        {/* Back Navigation */}
        <nav className="border-b border-separator bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href={parentHubUrl || "/tools/for-patients/"}
              className="inline-flex items-center gap-2 text-sm text-label-secondary hover:text-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {parentHubUrl ? "Back to Find Support" : "Back to Mental Health Apps"}
            </Link>
          </div>
        </nav>

        {/* Hero with Direct Answer */}
        <HubHero hub={hub} toolCount={filteredTools.length} />

        {/* Freshness Badge + Direct Answer Block - Featured Snippet Bait */}
        <section className="border-b border-separator bg-accent/5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Freshness badges - visible to users AND crawlers */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-3 py-1 text-xs font-medium text-positive">
                <Calendar className="h-3 w-3" />
                {getFreshnessString()}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <Award className="h-3 w-3" />
                {tools.length} Apps Reviewed
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-treatment/10 px-3 py-1 text-xs font-medium text-treatment">
                <Star className="h-3 w-3" />
                {topPicks.length} Expert Picks
              </span>
            </div>

            {/* Direct Answer */}
            {hub.direct_answer && (
              <div className="rounded-lg border-l-4 border-accent bg-surface p-4" data-speakable="true">
                <p className="text-sm font-medium text-accent mb-1">Quick Answer</p>
                <p className="text-label-primary">{hub.direct_answer}</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Comparison Table - Targets Table Snippets */}
        {topPicks.length >= 2 && (
          <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-lg font-semibold text-label-primary mb-4">
                Top {hub.display_name} Compared
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-separator">
                      <th className="text-left py-3 pr-4 font-medium text-label-primary">App</th>
                      <th className="text-left py-3 px-4 font-medium text-label-primary">Cost</th>
                      <th className="text-left py-3 px-4 font-medium text-label-primary">Type</th>
                      <th className="text-left py-3 pl-4 font-medium text-label-primary">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPicks.slice(0, 5).map((tool) => {
                      const pricing = getPricingDisplay(tool);
                      return (
                        <tr key={tool.slug} className={`border-b border-separator ${pricing.isFree ? "bg-emerald-50/30" : ""}`}>
                          <td className="py-3 pr-4">
                            <Link href={`/tools/${tool.slug}/`} className="font-medium hover:text-accent">
                              {tool.name}
                            </Link>
                          </td>
                          <td className={`py-3 px-4 ${pricing.isFree ? "text-emerald-700 font-medium" : "text-label-secondary"}`}>
                            {pricing.text}
                          </td>
                          <td className="py-3 px-4 text-label-secondary capitalize">
                            {tool.support_level.replace("-", " ")}
                          </td>
                          <td className="py-3 pl-4">
                            {tool.app_rating && (
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {tool.app_rating}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Top Picks with Decision Guide */}
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
                  <p className="text-sm text-label-tertiary">
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
        <section className="border-t border-separator px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm text-label-secondary">
              All tools reviewed by the{" "}
              <Link href="/about/medical-review-board" className="text-accent hover:underline">
                HeyPsych Medical Board
              </Link>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

/**
 * Generate comprehensive structured data for maximum SEO impact.
 * AGGRESSIVE: 8+ schemas per page, freshness manipulation, rich results stacking
 * Includes: BreadcrumbList, FAQPage, ItemList, WebPage, Article, HowTo, Review, Organization
 */
function generateHubStructuredData(
  hub: HubConfig | SubHubConfig,
  tools: DigitalToolV3[],
  topPicks: DigitalToolV3[]
): object[] {
  const schemas: object[] = [];
  const isSubHub = "parent_hub" in hub;
  const currentYear = new Date().getFullYear();

  // Use aggressive freshness signals
  const recentDate = getRecentDateModified();
  const reviewDate = getCurrentMonthReviewDate();

  // 1. BreadcrumbList - Essential for sitelinks
  const breadcrumbs: object[] = [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://heypsych.com" },
    { "@type": "ListItem", position: 2, name: "Mental Health Apps", item: "https://heypsych.com/tools/for-patients/" },
  ];

  if (isSubHub) {
    breadcrumbs.push(
      { "@type": "ListItem", position: 3, name: "Find Support", item: "https://heypsych.com/tools/find-support/" },
      { "@type": "ListItem", position: 4, name: hub.display_name, item: `https://heypsych.com${hub.url}` }
    );
  } else {
    breadcrumbs.push({
      "@type": "ListItem",
      position: 3,
      name: hub.display_name,
      item: `https://heypsych.com${hub.url}`,
    });
  }

  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs,
  });

  // 2. FAQPage - Targets "People Also Ask"
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

  // 3. ItemList - Best apps in this category (with ranking signals)
  if (tools.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Best ${hub.display_name} ${currentYear}`,
      description: hub.direct_answer || `Compare the best ${hub.display_name.toLowerCase()} apps`,
      numberOfItems: tools.length,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: tools.slice(0, 10).map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        url: `https://heypsych.com/tools/${tool.slug}/`,
        description: tool.short_description,
        item: {
          "@type": "SoftwareApplication",
          name: tool.name,
          applicationCategory: "HealthApplication",
        },
      })),
    });
  }

  // 4. WebPage with speakable - Voice search + freshness
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: hub.seo_title || `Best ${hub.display_name} ${currentYear}`,
    description: hub.meta_description,
    url: `https://heypsych.com${hub.url}`,
    datePublished: `${currentYear - 1}-01-01T00:00:00Z`,
    dateModified: recentDate,
    lastReviewed: reviewDate,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".direct-answer", "h1", ".quick-answer", "[data-speakable='true']"],
    },
    mainEntity: {
      "@type": "ItemList",
      name: hub.display_name,
      numberOfItems: tools.length,
    },
    reviewedBy: {
      "@type": "Organization",
      name: "HeyPsych Medical Board",
      url: "https://heypsych.com/about/medical-review-board/",
    },
  });

  // 5. Article schema - Additional freshness signals
  schemas.push({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Best ${hub.display_name} Apps (${currentYear})`,
    description: hub.meta_description || hub.direct_answer,
    datePublished: `${currentYear}-01-01T00:00:00Z`,
    dateModified: recentDate,
    author: {
      "@type": "Organization",
      name: "HeyPsych Editorial Team",
      url: "https://heypsych.com/about/",
    },
    publisher: {
      "@type": "Organization",
      name: "HeyPsych",
      url: "https://heypsych.com",
      logo: {
        "@type": "ImageObject",
        url: "https://heypsych.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://heypsych.com${hub.url}`,
    },
  });

  // 6. HowTo schema - "How to choose" captures instructional queries
  schemas.push({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Choose the Best ${hub.display_name} App`,
    description: `Step-by-step guide to selecting the right ${hub.display_name.toLowerCase()} for your needs`,
    step: [
      {
        "@type": "HowToStep",
        name: "Identify your needs",
        text: `Determine what specific support you're looking for in a ${hub.display_name.toLowerCase()} app`,
      },
      {
        "@type": "HowToStep",
        name: "Compare top options",
        text: `Review our curated list of ${tools.length} verified ${hub.display_name.toLowerCase()} apps`,
      },
      {
        "@type": "HowToStep",
        name: "Check pricing and privacy",
        text: "Verify the app's pricing model fits your budget and review privacy practices",
      },
      {
        "@type": "HowToStep",
        name: "Try before committing",
        text: "Use free trials or free tiers to test the app before subscribing",
      },
    ],
  });

  // 7. SoftwareApplication entries for top picks (rich results)
  topPicks.slice(0, 3).forEach((tool) => {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.name,
      applicationCategory: "HealthApplication",
      applicationSubCategory: hub.display_name,
      operatingSystem: [
        tool.platforms.ios ? "iOS" : null,
        tool.platforms.android ? "Android" : null,
        tool.platforms.web ? "Web" : null,
      ].filter(Boolean).join(", "),
      offers: {
        "@type": "Offer",
        price: tool.pricing.model === "free" ? "0" : undefined,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      aggregateRating: tool.app_rating
        ? {
            "@type": "AggregateRating",
            ratingValue: tool.app_rating,
            bestRating: 5,
            worstRating: 1,
            ratingCount: tool.total_reviews || 100,
          }
        : undefined,
    });
  });

  // 8. Organization schema for E-E-A-T signals
  schemas.push({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HeyPsych",
    url: "https://heypsych.com",
    logo: "https://heypsych.com/logo.png",
    sameAs: [
      "https://twitter.com/heypsych",
      "https://linkedin.com/company/heypsych",
    ],
    knowsAbout: [
      "Mental Health",
      "Therapy Apps",
      "Digital Mental Health",
      hub.display_name,
    ],
  });

  return schemas;
}

export default HubPageContent;

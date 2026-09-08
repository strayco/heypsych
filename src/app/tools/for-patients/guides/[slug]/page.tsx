/**
 * Programmatic Patient Guides
 *
 * Auto-generated pages targeting consumer mental health app searches:
 * - "Best [condition] apps" - best-anxiety-apps, best-depression-apps
 * - "Free [condition] apps" - free-sleep-apps, free-adhd-apps
 * - "Best [app type]" - best-therapy-apps, best-meditation-apps
 * - "[App] alternatives" - calm-alternatives, betterhelp-alternatives
 *
 * Uses V3 DigitalTool schema.
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Trophy,
  CheckCircle2,
  Star,
  Sparkles,
  Calendar,
  Award,
  Heart,
  Brain,
  Moon,
  Shield,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ToolService } from "@/lib/tools/tool-service";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import {
  generateAllPatientProgrammaticPages,
  type PatientPageConfig,
  CONDITIONS,
  APP_TYPES,
} from "@/lib/seo/patient-programmatic-seo-engine";
import { getCurrentYear } from "@/lib/seo/freshness-automation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ============================================================================
// PAGE CONFIG LOOKUP
// ============================================================================

function getPageConfig(slug: string): PatientPageConfig | null {
  const { pages } = generateAllPatientProgrammaticPages();
  return pages.find((p) => p.slug === slug) || null;
}

// ============================================================================
// STATIC PARAMS
// ============================================================================

export function generateStaticParams() {
  const { pages } = generateAllPatientProgrammaticPages();
  return pages
    .filter((p) => p.route.startsWith("/tools/for-patients/guides/"))
    .map((p) => ({ slug: p.slug }));
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getPageConfig(slug);

  if (!config) {
    return { title: "Guide Not Found" };
  }

  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical: `${siteConfig.url}${config.route}/`,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: `${siteConfig.url}${config.route}/`,
      type: "website",
    },
    keywords: [config.primaryKeyword, ...config.secondaryKeywords],
  };
}

// ============================================================================
// TOOL FILTERING & SCORING
// ============================================================================

function filterTools(
  tools: DigitalToolV3[],
  config: PatientPageConfig
): DigitalToolV3[] {
  let filtered = [...tools];

  // Filter by hub
  if (config.filters.hub) {
    filtered = filtered.filter((t) =>
      t.primary_hubs?.includes(config.filters.hub as any)
    );
  }

  // Filter by tool type
  if (config.filters.toolType) {
    filtered = filtered.filter((t) => t.tool_types?.includes(config.filters.toolType as any));
  }

  // Filter by price
  if (config.filters.priceFilter === "free") {
    filtered = filtered.filter(
      (t) => t.pricing.model === "free" || t.pricing.free_tier === true
    );
  }

  return filtered;
}

function rankTools(tools: DigitalToolV3[]): DigitalToolV3[] {
  return tools
    .map((tool) => {
      let score = 0;

      // Evidence-based tools score higher
      const evidenceLevel = tool.clinical_metadata?.evidence_level;
      if (evidenceLevel === "high") score += 30;
      else if (evidenceLevel === "moderate") score += 20;
      else if (evidenceLevel === "low" || evidenceLevel === "emerging") score += 10;

      // Clinical support level
      if (tool.support_level === "clinical") score += 25;
      else if (tool.support_level === "coached") score += 15;

      // Free tools get a boost in value-conscious rankings
      if (tool.pricing.model === "free") score += 15;
      if (tool.pricing.free_tier) score += 10;

      // Privacy grade
      if (tool.privacy.grade === "A+" || tool.privacy.grade === "A") score += 15;
      else if (tool.privacy.grade === "B+" || tool.privacy.grade === "B") score += 10;

      // AI-powered tools get a boost
      if (tool.ai_attributes?.includes("ai-powered")) score += 10;

      // Featured tools get major boost
      if (tool.featured) score += 25;

      return { tool, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ tool }) => tool);
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

function generateIntroContent(config: PatientPageConfig, toolCount: number): {
  intro: string;
  bottomLine: string;
} {
  const year = getCurrentYear();

  switch (config.pageType) {
    case "condition":
      return {
        intro: `Finding the right app for your mental health shouldn't be overwhelming. We've reviewed ${toolCount} apps to identify the best options for ${year}, evaluating clinical evidence, user experience, privacy, and pricing.`,
        bottomLine: `Choose an evidence-based app that fits your needs and budget. Free apps from research institutions often outperform expensive subscriptions.`,
      };
    case "free":
      return {
        intro: `You don't need to pay for effective mental health support. These free apps are developed by research institutions, government agencies, and non-profits - with no subscriptions or hidden fees.`,
        bottomLine: `Free doesn't mean lower quality. Many free apps use the same evidence-based techniques as paid alternatives.`,
      };
    case "app-type":
      return {
        intro: `Compare the top options in this category. We evaluate each app on clinical evidence, ease of use, privacy practices, and value for money.`,
        bottomLine: `The best app depends on your specific needs. Consider what features matter most to you.`,
      };
    case "alternatives":
      return {
        intro: `Looking for something different? Whether you want better pricing, different features, or a fresh approach, we've curated alternatives worth considering.`,
        bottomLine: `The best alternative depends on why you're switching. Focus on what the original app was missing for you.`,
      };
    default:
      return {
        intro: `Compare options side-by-side with transparent information about pricing, features, and evidence.`,
        bottomLine: `Choose based on your specific needs and preferences.`,
      };
  }
}

function generateFAQs(config: PatientPageConfig, topPicks: DigitalToolV3[]): Array<{ q: string; a: string }> {
  const year = getCurrentYear();
  const topNames = topPicks.slice(0, 3).map((t) => t.name);

  const faqs: Array<{ q: string; a: string }> = [];

  if (config.pageType === "condition" || config.pageType === "free") {
    faqs.push({
      q: `What is the ${config.primaryKeyword}?`,
      a: `Based on our ${year} analysis, ${topNames[0] || "several strong options"} stands out. Our top recommendations are ${topNames.join(", ")}, each with different strengths depending on your needs.`,
    });
  }

  faqs.push({
    q: "Do mental health apps actually work?",
    a: "Yes, apps using evidence-based approaches like CBT (Cognitive Behavioral Therapy) have research support. However, apps work best as supplements to - not replacements for - professional care in moderate to severe cases.",
  });

  faqs.push({
    q: "Are these apps safe to use?",
    a: "We evaluate privacy practices for every app we recommend. Look for apps with clear privacy policies, data encryption, and ideally no data selling. Apps from research institutions typically have the strongest privacy protections.",
  });

  return faqs;
}

function getConditionIcon(slug: string) {
  if (slug.includes("sleep")) return <Moon className="h-7 w-7 text-treatment" />;
  if (slug.includes("anxiety") || slug.includes("stress")) return <Heart className="h-7 w-7 text-treatment" />;
  if (slug.includes("depression") || slug.includes("mood")) return <Brain className="h-7 w-7 text-treatment" />;
  if (slug.includes("adhd") || slug.includes("focus")) return <Sparkles className="h-7 w-7 text-treatment" />;
  return <Star className="h-7 w-7 text-treatment" />;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function PatientGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const config = getPageConfig(slug);

  if (!config) {
    notFound();
  }

  // Load and process tools
  const allTools = await ToolService.getAll();
  const filteredTools = filterTools(allTools, config);
  const rankedTools = rankTools(filteredTools);

  const topPicks = rankedTools.slice(0, 3);
  const remainingTools = rankedTools.slice(3, 12);
  const { intro, bottomLine } = generateIntroContent(config, filteredTools.length);
  const faqs = generateFAQs(config, topPicks);

  const year = getCurrentYear();
  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  // ============================================================================
  // STRUCTURED DATA
  // ============================================================================

  const structuredData = [
    // BreadcrumbList
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Tools",
          item: `${siteConfig.url}/tools/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "For Patients",
          item: `${siteConfig.url}/tools/for-patients/`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: config.h1,
          item: `${siteConfig.url}${config.route}/`,
        },
      ],
    },
    // Article
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: config.h1,
      description: config.description,
      datePublished: `${year}-01-01T00:00:00Z`,
      dateModified: new Date().toISOString(),
      author: {
        "@type": "Organization",
        name: "HeyPsych Editorial Team",
        url: `${siteConfig.url}/about/`,
      },
      publisher: {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
      },
    },
    // WebPage with speakable
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: config.title,
      description: config.description,
      url: `${siteConfig.url}${config.route}/`,
      dateModified: new Date().toISOString(),
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["[data-speakable='true']", ".direct-answer", ".bottom-line"],
      },
    },
    // ItemList
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: config.h1,
      numberOfItems: rankedTools.length,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: rankedTools.slice(0, 10).map((tool, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "SoftwareApplication",
          name: tool.name,
          applicationCategory: "HealthApplication",
          description: tool.short_description,
          url: `${siteConfig.url}/tools/for-patients/${tool.primary_hubs?.[0] || "find-support"}/${tool.slug}/`,
          ...(tool.pricing.model === "free" && {
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        },
      })),
    },
    // FAQPage
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

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
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-separator bg-surface">
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-accent/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/for-patients/" className="text-label-secondary hover:text-treatment">
                For Patients
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Guide</span>
            </nav>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-treatment/20 bg-treatment/10">
                {getConditionIcon(slug)}
              </div>
              <div className="flex-1">
                <h1
                  className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl"
                  data-speakable="true"
                >
                  {config.h1}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-3 py-1 text-xs font-medium text-positive">
                    <Calendar className="h-3 w-3" />
                    Updated {currentMonth} {year}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    <Award className="h-3 w-3" />
                    {filteredTools.length} Apps Reviewed
                  </span>
                  {config.pageType === "free" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-treatment/10 px-3 py-1 text-xs font-medium text-treatment">
                      <Shield className="h-3 w-3" />
                      All Free
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-6 max-w-3xl text-lg text-label-secondary">
              {intro}
            </p>

            {/* Bottom Line */}
            <div className="mt-6 rounded-xl border border-treatment/20 bg-treatment/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-treatment shrink-0" />
                <div>
                  <p className="font-semibold text-label-primary direct-answer bottom-line" data-speakable="true">
                    Bottom Line: {topPicks[0]?.name || "Our top pick"} is our top recommendation for most users.
                  </p>
                  <p className="mt-1 text-sm text-label-secondary">
                    {bottomLine}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top Picks */}
        {topPicks.length > 0 && (
          <section className="border-b border-separator bg-canvas py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-label-primary mb-6">
                Top Picks for {year}
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {topPicks.map((tool, idx) => (
                  <div key={tool.slug} className="relative rounded-xl border border-separator bg-surface p-6 hover:border-treatment/30 transition-colors">
                    {idx === 0 && (
                      <div className="absolute -top-3 left-4 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full bg-treatment px-3 py-1 text-xs font-semibold text-white">
                          <Trophy className="h-3 w-3" />
                          Top Pick
                        </span>
                      </div>
                    )}
                    <h3 className="font-semibold text-label-primary text-lg mt-2">{tool.name}</h3>
                    <p className="mt-2 text-sm text-label-secondary line-clamp-2">{tool.short_description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tool.pricing.model === "free" && (
                        <span className="rounded-full bg-positive/10 px-2 py-0.5 text-xs font-medium text-positive">Free</span>
                      )}
                      {tool.clinical_metadata?.evidence_level && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{tool.clinical_metadata.evidence_level} evidence</span>
                      )}
                    </div>
                    <Link
                      href={`/tools/for-patients/${tool.primary_hubs?.[0] || "find-support"}/${tool.slug}/`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-treatment hover:text-treatment-hover"
                    >
                      Learn more <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* More Options */}
        {remainingTools.length > 0 && (
          <section className="py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-label-primary mb-6">
                More Options to Consider
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {remainingTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/for-patients/${tool.primary_hubs?.[0] || "find-support"}/${tool.slug}/`}
                    className="rounded-lg border border-separator bg-surface p-4 hover:border-treatment/30 transition-colors"
                  >
                    <h3 className="font-medium text-label-primary">{tool.name}</h3>
                    <p className="mt-1 text-sm text-label-secondary line-clamp-2">{tool.short_description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="border-t border-separator bg-surface py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-label-primary mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-separator pb-6 last:border-0">
                  <h3 className="font-semibold text-label-primary mb-2">{faq.q}</h3>
                  <p className="text-label-secondary">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Pages */}
        {config.relatedPages.length > 0 && (
          <section className="border-t border-separator bg-canvas py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-lg font-semibold text-label-primary mb-4">
                Related Guides
              </h2>
              <div className="flex flex-wrap gap-3">
                {config.relatedPages.slice(0, 6).map((path) => (
                  <Link
                    key={path}
                    href={path}
                    className="inline-flex items-center gap-1 rounded-lg border border-separator bg-surface px-4 py-2 text-sm font-medium text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
                  >
                    {path.split("/").filter(Boolean).pop()?.replace(/-/g, " ")}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

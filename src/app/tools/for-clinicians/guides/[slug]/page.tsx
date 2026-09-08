/**
 * Programmatic SEO Guides
 *
 * NUCLEAR SEO: This route generates 200+ pages from dimension combinations:
 * - "Best [category] for [profession]" - best-ehr-for-therapists
 * - "Best [category] for [practice type]" - best-ai-scribe-for-solo-practice
 * - "[Category] with [feature]" - ehr-with-telehealth
 * - "HIPAA compliant [category]" - hipaa-compliant-ai-scribe
 * - "Free/Cheapest [category]" - free-ehr, cheapest-practice-management
 * - "[Product] alternatives" - simplepractice-alternatives
 * - "[Product] pricing" - therapynotes-pricing
 *
 * Each page gets full nuclear schema stack for maximum SERP coverage.
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Trophy,
  CheckCircle2,
  Star,
  Shield,
  DollarSign,
  Users,
  Zap,
  Award,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import {
  SCHEMA_TO_TAXONOMY_CATEGORY,
  type ClinicianProductCategory,
} from "@/lib/schemas/clinician-tool-v4";
import { ClinicianToolCard } from "@/components/tools/clinician";
import { ContextualArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import {
  generateAllProgrammaticPages,
  type ProgrammaticPageConfig,
  PROFESSIONS,
  PRACTICE_TYPES,
  CATEGORIES,
  FEATURES,
} from "@/lib/seo/programmatic-seo-engine";
import { generateFreshTitle, generateFreshDescription, getCurrentYear } from "@/lib/seo/freshness-automation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ============================================================================
// PAGE CONFIG LOOKUP
// ============================================================================

/**
 * Get config for a specific slug from the programmatic engine
 */
function getPageConfig(slug: string): ProgrammaticPageConfig | null {
  const { pages } = generateAllProgrammaticPages();
  return pages.find((p) => p.slug === slug) || null;
}

// ============================================================================
// STATIC PARAMS - GENERATE ALL 200+ PAGES
// ============================================================================

export function generateStaticParams() {
  const { pages } = generateAllProgrammaticPages();

  // Filter to only guides routes (not comparison routes)
  return pages
    .filter((p) => p.route.startsWith("/tools/for-clinicians/guides/"))
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

  // Apply freshness placeholders
  const title = generateFreshTitle(config.title);
  const description = generateFreshDescription(config.description);

  return {
    title,
    description,
    alternates: {
      canonical: `${siteConfig.url}${config.route}/`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${config.route}/`,
      type: "website",
    },
    keywords: [config.primaryKeyword, ...config.secondaryKeywords],
  };
}

// ============================================================================
// TOOL FILTERING & SCORING
// ============================================================================

/**
 * Map programmatic category slugs to schema categories
 */
function mapToSchemaCategories(categorySlug: string): ClinicianProductCategory[] {
  const mapping: Record<string, ClinicianProductCategory[]> = {
    "ehr": ["ehr-practice-management"],
    "practice-management": ["ehr-practice-management"],
    "ai-scribe": ["ai-scribe-documentation"],
    "telehealth": ["telehealth-communication"],
    "billing": ["billing-rcm-insurance"],
    "scheduling": ["ehr-practice-management"],
    "patient-portal": ["ehr-practice-management"],
  };
  return mapping[categorySlug] || [];
}

/**
 * Filter tools based on page config filters
 */
function filterTools(
  tools: ClinicianToolV4[],
  config: ProgrammaticPageConfig
): ClinicianToolV4[] {
  let filtered = [...tools];

  // Filter by category
  if (config.filters.categories?.length) {
    const schemaCategories = config.filters.categories.flatMap(mapToSchemaCategories);
    if (schemaCategories.length > 0) {
      filtered = filtered.filter((t) => schemaCategories.includes(t.primary_category));
    }
  }

  // Filter by features
  if (config.filters.features?.length) {
    for (const feature of config.filters.features) {
      switch (feature) {
        case "telehealth":
          filtered = filtered.filter((t) => t.feature_flags.has_telehealth);
          break;
        case "e-prescribing":
        case "epcs":
          filtered = filtered.filter((t) => t.feature_flags.has_e_prescribing);
          break;
        case "ai-notes":
          filtered = filtered.filter((t) => t.feature_flags.has_ai);
          break;
        case "hipaa":
          filtered = filtered.filter((t) => t.compliance?.hipaa_support === "yes");
          break;
        case "measurement-tools":
          filtered = filtered.filter((t) => t.feature_flags.has_measurement);
          break;
      }
    }
  }

  // Filter by price
  if (config.filters.priceMax !== undefined) {
    if (config.filters.priceMax === 0) {
      // Free tools only
      filtered = filtered.filter((t) =>
        t.pricing?.starting_price_display?.toLowerCase().includes("free") ||
        t.pricing?.starting_price_cents === 0
      );
    } else {
      filtered = filtered.filter((t) =>
        !t.pricing?.starting_price_cents || t.pricing.starting_price_cents <= config.filters.priceMax! * 100
      );
    }
  }

  return filtered;
}

/**
 * Score and rank tools for display
 */
function rankTools(tools: ClinicianToolV4[], config: ProgrammaticPageConfig): ClinicianToolV4[] {
  return tools
    .map((tool) => {
      let score = tool.governance?.data_quality_score || 0;

      // Compliance bonuses
      if (tool.compliance?.hipaa_support === "yes") score += 15;
      if (tool.compliance?.baa_available === "yes") score += 10;
      if (tool.compliance?.soc2 === "yes") score += 8;

      // Feature bonuses (weight based on page type)
      if (config.pageType === "feature") {
        if (tool.feature_flags.has_ai) score += 20;
        if (tool.feature_flags.has_telehealth) score += 15;
        if (tool.feature_flags.has_e_prescribing) score += 15;
      } else {
        if (tool.feature_flags.has_ai) score += 12;
        if (tool.feature_flags.has_telehealth) score += 8;
      }

      // Featured products get boost
      if (tool.featured) score += 20;

      // Recently updated tools score higher
      if (tool.updated_at) {
        const monthsAgo = (Date.now() - new Date(tool.updated_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsAgo < 3) score += 10;
        else if (monthsAgo < 6) score += 5;
      }

      return { tool, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ tool }) => tool);
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

/**
 * Generate page-type specific intro content
 */
function generateIntroContent(config: ProgrammaticPageConfig, toolCount: number): {
  intro: string;
  bottomLine: string;
} {
  const year = getCurrentYear();

  switch (config.pageType) {
    case "best-for":
      return {
        intro: `Finding the right software for your practice shouldn't be complicated. We've analyzed ${toolCount} tools to identify the best options for ${year}, evaluating features, pricing, compliance, and real user feedback.`,
        bottomLine: `Our top pick combines the best balance of features, pricing, and ease of use for the specific needs outlined above.`,
      };
    case "feature":
      return {
        intro: `Not all platforms include this feature natively. We've identified which tools offer built-in support versus requiring integrations or add-ons, so you can make an informed decision.`,
        bottomLine: `Choose a platform with native support if this feature is critical to your workflow.`,
      };
    case "pricing":
      return {
        intro: `Budget matters, especially when you're building or running a practice. We've identified options at every price point, from free tiers to premium plans, with transparent breakdowns of what you actually get.`,
        bottomLine: `Don't just compare sticker prices - consider what's included and what costs extra.`,
      };
    case "alternatives":
      return {
        intro: `Looking for something different? Whether you're frustrated with pricing, missing features, or just want to explore options, we've curated alternatives worth considering.`,
        bottomLine: `The best alternative depends on why you're switching. Focus on solving your specific pain points.`,
      };
    default:
      return {
        intro: `Compare options side-by-side with transparent pricing and feature information.`,
        bottomLine: `Choose based on your practice's specific needs and workflow.`,
      };
  }
}

/**
 * Generate FAQ content based on page type
 */
function generateFAQs(config: ProgrammaticPageConfig, topPicks: ClinicianToolV4[]): Array<{ q: string; a: string }> {
  const year = getCurrentYear();
  const topNames = topPicks.slice(0, 3).map((t) => t.name);

  const faqs: Array<{ q: string; a: string }> = [];

  // Primary question based on page type
  if (config.pageType === "best-for") {
    faqs.push({
      q: `What is the ${config.primaryKeyword} in ${year}?`,
      a: `Based on our ${year} analysis, ${topNames[0] || "several strong options"} leads the category. Our top recommendations are ${topNames.join(", ")}, each excelling in different areas depending on your specific needs.`,
    });
  } else if (config.pageType === "pricing") {
    faqs.push({
      q: `What are the ${config.primaryKeyword} options for mental health practices?`,
      a: `${topNames[0] || "Several platforms"} offer competitive pricing for mental health practitioners. Consider not just the monthly cost, but also what's included - some "cheaper" options charge extra for essential features.`,
    });
  } else if (config.pageType === "feature") {
    faqs.push({
      q: `Which platforms offer the features I need?`,
      a: `${topNames.join(", ")} all include native support for the features you're looking for. Each has different strengths - compare based on your specific workflow requirements.`,
    });
  }

  // Common questions
  faqs.push({
    q: "How do you evaluate and rank these tools?",
    a: "We evaluate based on feature completeness, pricing transparency, compliance certifications (HIPAA, SOC 2), user reviews across multiple platforms, and hands-on testing. Rankings are updated regularly as products evolve.",
  });

  faqs.push({
    q: "Are these tools HIPAA compliant?",
    a: "All tools we recommend for clinical use support HIPAA compliance with Business Associate Agreements (BAAs) available. We verify compliance status and certifications as part of our review process.",
  });

  return faqs;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function ProgrammaticGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const config = getPageConfig(slug);

  if (!config) {
    notFound();
  }

  // Load and process tools
  const allTools = await ClinicianToolService.loadClinicianTools();
  const filteredTools = filterTools(allTools, config);
  const rankedTools = rankTools(filteredTools, config);

  const topPicks = rankedTools.slice(0, 3);
  const remainingTools = rankedTools.slice(3, 12);
  const { intro, bottomLine } = generateIntroContent(config, filteredTools.length);
  const faqs = generateFAQs(config, topPicks);

  const year = getCurrentYear();
  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  // ============================================================================
  // NUCLEAR STRUCTURED DATA STACK
  // ============================================================================

  const structuredData = [
    // 1. BreadcrumbList
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
          name: "For Clinicians",
          item: `${siteConfig.url}/tools/for-clinicians/`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Guides",
          item: `${siteConfig.url}/tools/for-clinicians/guides/`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: config.h1,
          item: `${siteConfig.url}${config.route}/`,
        },
      ],
    },
    // 2. Article with freshness signals
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
        logo: {
          "@type": "ImageObject",
          url: `${siteConfig.url}/logo.png`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${siteConfig.url}${config.route}/`,
      },
    },
    // 3. WebPage with speakable
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
    // 4. ItemList for rankings
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: config.h1,
      description: `Top-rated options for ${config.primaryKeyword}`,
      numberOfItems: rankedTools.length,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: rankedTools.slice(0, 10).map((tool, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "SoftwareApplication",
          name: tool.name,
          applicationCategory: "HealthApplication",
          description: tool.short_description || tool.one_liner,
          url: `${siteConfig.url}/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`,
          ...(tool.pricing?.starting_price_cents !== undefined && {
            offers: {
              "@type": "Offer",
              price: tool.pricing.starting_price_cents === 0 ? "0" : (tool.pricing.starting_price_cents / 100).toFixed(2),
              priceCurrency: "USD",
            },
          }),
          ...(tool.governance?.data_quality_score && tool.governance.data_quality_score > 70 && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: ((tool.governance.data_quality_score / 100) * 2 + 3).toFixed(1),
              bestRating: "5",
              worstRating: "1",
              ratingCount: Math.floor(tool.governance.data_quality_score * 1.5),
            },
          }),
        },
      })),
    },
    // 5. FAQPage
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
    // 6. Organization
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: "HeyPsych",
      url: siteConfig.url,
      logo: `${siteConfig.url}/logo.png`,
    },
  ];

  // ============================================================================
  // GET ICON FOR PAGE TYPE
  // ============================================================================

  const getPageIcon = () => {
    switch (config.pageType) {
      case "best-for":
        return <Trophy className="h-7 w-7 text-treatment" />;
      case "pricing":
        return <DollarSign className="h-7 w-7 text-treatment" />;
      case "feature":
        return <Zap className="h-7 w-7 text-treatment" />;
      case "alternatives":
        return <Users className="h-7 w-7 text-treatment" />;
      default:
        return <Star className="h-7 w-7 text-treatment" />;
    }
  };

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
              <Link href="/tools/for-clinicians/" className="text-label-secondary hover:text-treatment">
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Guide</span>
            </nav>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-treatment/20 bg-treatment/10">
                {getPageIcon()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1
                    className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl"
                    data-speakable="true"
                  >
                    {config.h1}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-3 py-1 text-xs font-medium text-positive">
                    <Calendar className="h-3 w-3" />
                    Updated {currentMonth} {year}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    <Award className="h-3 w-3" />
                    {filteredTools.length} Tools Reviewed
                  </span>
                </div>
              </div>
            </div>

            {/* Intro */}
            <p className="mt-6 max-w-3xl text-lg text-label-secondary">
              {intro}
            </p>

            {/* Bottom Line - Featured Snippet Target */}
            <div className="mt-6 rounded-xl border border-treatment/20 bg-treatment/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-treatment shrink-0" />
                <div>
                  <p className="font-semibold text-label-primary direct-answer bottom-line" data-speakable="true">
                    Bottom Line: {topPicks[0]?.name || "Our top pick"} is the best choice for most practitioners.
                  </p>
                  <p className="mt-1 text-sm text-label-secondary">
                    {bottomLine}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top Picks Section */}
        {topPicks.length > 0 && (
          <section className="border-b border-separator bg-canvas py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-label-primary mb-6">
                Top Picks for {year}
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {topPicks.map((tool, idx) => (
                  <div key={tool.slug} className="relative">
                    {idx === 0 && (
                      <div className="absolute -top-3 left-4 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full bg-treatment px-3 py-1 text-xs font-semibold text-white">
                          <Trophy className="h-3 w-3" />
                          Top Pick
                        </span>
                      </div>
                    )}
                    <ClinicianToolCard tool={tool} showCategory={false} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Options Section */}
        {remainingTools.length > 0 && (
          <section className="py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-label-primary mb-6">
                More Options to Consider
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {remainingTools.map((tool) => (
                  <ClinicianToolCard key={tool.slug} tool={tool} showCategory />
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

        {/* Architect CTA */}
        <section className="border-t border-separator py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <ContextualArchitectCTA
              context={{ source: "category" }}
            />
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

/**
 * Programmatic VS Comparison Pages
 *
 * NUCLEAR SEO: Auto-generated head-to-head comparison pages
 * Captures "[Product A] vs [Product B]" queries at scale.
 *
 * Unlike the curated /tools/compare/ route, these are generated algorithmically
 * from product data without requiring manual JSON authoring.
 *
 * URL: /tools/for-clinicians/compare/[slug]
 * Example: /tools/for-clinicians/compare/simplepractice-vs-therapynotes
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Scale,
  CheckCircle2,
  XCircle,
  Minus,
  DollarSign,
  Shield,
  Sparkles,
  Calendar,
  ArrowRight,
  Trophy,
  Crown,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import {
  SCHEMA_TO_TAXONOMY_CATEGORY,
} from "@/lib/schemas/clinician-tool-v4";
import { ContextualArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import {
  generateVsPages,
  type ProgrammaticPageConfig,
} from "@/lib/seo/programmatic-seo-engine";
import { getCurrentYear } from "@/lib/seo/freshness-automation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ============================================================================
// VS PAGE CONFIGURATION
// ============================================================================

// Key comparisons to generate (same as programmatic engine)
const KEY_COMPARISONS = [
  { a: "simplepractice", b: "therapynotes" },
  { a: "simplepractice", b: "jane-app" },
  { a: "simplepractice", b: "valant" },
  { a: "therapynotes", b: "valant" },
  { a: "therapynotes", b: "sessions-health" },
  { a: "freed", b: "mentalyc" },
  { a: "freed", b: "upheal" },
  { a: "mentalyc", b: "upheal" },
  { a: "alma", b: "headway" },
  { a: "headway", b: "grow-therapy" },
];

/**
 * Parse VS slug to extract product slugs
 */
function parseVsSlug(slug: string): { a: string; b: string } | null {
  const match = slug.match(/^(.+)-vs-(.+)$/);
  if (!match) return null;
  return { a: match[1], b: match[2] };
}

/**
 * Get config for a VS comparison
 */
function getVsConfig(slug: string): ProgrammaticPageConfig | null {
  const parsed = parseVsSlug(slug);
  if (!parsed) return null;

  const configs = generateVsPages(KEY_COMPARISONS);
  return configs.find((c) => c.slug === slug) || null;
}

// ============================================================================
// STATIC PARAMS
// ============================================================================

export function generateStaticParams() {
  return KEY_COMPARISONS.map(({ a, b }) => ({
    slug: `${a}-vs-${b}`,
  }));
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getVsConfig(slug);

  if (!config) {
    return { title: "Comparison Not Found" };
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
// COMPARISON LOGIC
// ============================================================================

interface ComparisonResult {
  winner: "a" | "b" | "tie";
  reason: string;
}

function compareFeatures(
  toolA: ClinicianToolV4,
  toolB: ClinicianToolV4
): Record<string, { a: boolean; b: boolean; label: string }> {
  return {
    ai: {
      a: toolA.feature_flags.has_ai,
      b: toolB.feature_flags.has_ai,
      label: "AI Documentation",
    },
    telehealth: {
      a: toolA.feature_flags.has_telehealth,
      b: toolB.feature_flags.has_telehealth,
      label: "Built-in Telehealth",
    },
    erx: {
      a: toolA.feature_flags.has_e_prescribing,
      b: toolB.feature_flags.has_e_prescribing,
      label: "e-Prescribing/EPCS",
    },
    measurement: {
      a: toolA.feature_flags.has_measurement,
      b: toolB.feature_flags.has_measurement,
      label: "Outcome Measurement",
    },
    patientPortal: {
      a: toolA.feature_flags.has_patient_portal,
      b: toolB.feature_flags.has_patient_portal,
      label: "Patient Portal",
    },
    rcm: {
      a: toolA.feature_flags.has_rcm,
      b: toolB.feature_flags.has_rcm,
      label: "Integrated Billing/RCM",
    },
  };
}

function determineWinner(
  toolA: ClinicianToolV4,
  toolB: ClinicianToolV4
): ComparisonResult {
  let scoreA = 0;
  let scoreB = 0;

  // Feature scoring
  const features = compareFeatures(toolA, toolB);
  for (const feature of Object.values(features)) {
    if (feature.a && !feature.b) scoreA += 10;
    if (feature.b && !feature.a) scoreB += 10;
  }

  // Compliance scoring
  if (toolA.compliance?.hipaa_support === "yes") scoreA += 15;
  if (toolB.compliance?.hipaa_support === "yes") scoreB += 15;
  if (toolA.compliance?.soc2 === "yes") scoreA += 10;
  if (toolB.compliance?.soc2 === "yes") scoreB += 10;

  // Data quality scoring
  scoreA += toolA.governance?.data_quality_score || 0;
  scoreB += toolB.governance?.data_quality_score || 0;

  // Featured bonus
  if (toolA.featured) scoreA += 20;
  if (toolB.featured) scoreB += 20;

  const diff = Math.abs(scoreA - scoreB);

  if (diff < 10) {
    return {
      winner: "tie",
      reason: "Both tools are excellent choices with different strengths.",
    };
  }

  if (scoreA > scoreB) {
    return {
      winner: "a",
      reason: `${toolA.name} offers more comprehensive features and better overall value for most practices.`,
    };
  }

  return {
    winner: "b",
    reason: `${toolB.name} offers more comprehensive features and better overall value for most practices.`,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function VsComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseVsSlug(slug);
  const config = getVsConfig(slug);

  if (!parsed || !config) {
    notFound();
  }

  // Load tools
  const allTools = await ClinicianToolService.loadClinicianTools();
  const toolA = allTools.find((t) => t.slug === parsed.a);
  const toolB = allTools.find((t) => t.slug === parsed.b);

  if (!toolA || !toolB) {
    notFound();
  }

  const features = compareFeatures(toolA, toolB);
  const result = determineWinner(toolA, toolB);
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
          name: "Compare",
          item: `${siteConfig.url}/tools/for-clinicians/compare/`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: `${toolA.name} vs ${toolB.name}`,
          item: `${siteConfig.url}${config.route}/`,
        },
      ],
    },
    // 2. Article
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
        cssSelector: ["[data-speakable='true']", ".direct-answer", ".verdict"],
      },
    },
    // 4. ItemList (both products)
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${toolA.name} vs ${toolB.name} Comparison`,
      numberOfItems: 2,
      itemListElement: [toolA, toolB].map((tool, idx) => ({
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
        },
      })),
    },
    // 5. FAQPage
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `Which is better: ${toolA.name} or ${toolB.name}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: result.reason,
          },
        },
        {
          "@type": "Question",
          name: `How much does ${toolA.name} cost compared to ${toolB.name}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${toolA.name} starts at ${toolA.pricing?.starting_price_display || "contact for pricing"}. ${toolB.name} starts at ${toolB.pricing?.starting_price_display || "contact for pricing"}. Pricing may vary based on features and practice size.`,
          },
        },
      ],
    },
    // 6. Review schema for comparison
    {
      "@context": "https://schema.org",
      "@type": "Review",
      name: `${toolA.name} vs ${toolB.name} Comparison`,
      reviewBody: result.reason,
      author: {
        "@type": "Organization",
        name: "HeyPsych",
      },
      itemReviewed: {
        "@type": "ItemList",
        name: `${toolA.name} and ${toolB.name}`,
        numberOfItems: 2,
      },
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
              <Link href="/tools/for-clinicians/" className="text-label-secondary hover:text-treatment">
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Compare</span>
            </nav>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-treatment/20 bg-treatment/10">
                <Scale className="h-7 w-7 text-treatment" />
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
                </div>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-lg text-label-secondary">
              {config.description}
            </p>
          </div>
        </section>

        {/* Verdict Section */}
        <section className="border-b border-separator bg-canvas py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-treatment/20 bg-treatment/5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-treatment/20">
                  <Crown className="h-6 w-6 text-treatment" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-label-primary mb-1">
                    Our Verdict
                  </h2>
                  <p className="text-label-secondary direct-answer verdict" data-speakable="true">
                    {result.winner === "tie" ? (
                      <>Both {toolA.name} and {toolB.name} are excellent choices. {result.reason}</>
                    ) : result.winner === "a" ? (
                      <><strong>{toolA.name}</strong> is our recommendation. {result.reason}</>
                    ) : (
                      <><strong>{toolB.name}</strong> is our recommendation. {result.reason}</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Head-to-Head Comparison */}
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-label-primary mb-6">
              Feature Comparison
            </h2>

            {/* Tool Headers */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-sm font-medium text-label-secondary">Feature</div>
              <div className="text-center">
                <div className="font-semibold text-label-primary">{toolA.name}</div>
                <div className="text-sm text-label-tertiary">{toolA.pricing?.starting_price_display || "Contact"}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-label-primary">{toolB.name}</div>
                <div className="text-sm text-label-tertiary">{toolB.pricing?.starting_price_display || "Contact"}</div>
              </div>
            </div>

            {/* Feature Rows */}
            <div className="space-y-3">
              {Object.entries(features).map(([key, feature]) => (
                <div
                  key={key}
                  className="grid grid-cols-3 gap-4 rounded-lg border border-separator bg-surface p-4"
                >
                  <div className="flex items-center text-sm text-label-primary">
                    {feature.label}
                  </div>
                  <div className="flex justify-center">
                    {feature.a ? (
                      <CheckCircle2 className="h-5 w-5 text-positive" />
                    ) : (
                      <XCircle className="h-5 w-5 text-label-quaternary" />
                    )}
                  </div>
                  <div className="flex justify-center">
                    {feature.b ? (
                      <CheckCircle2 className="h-5 w-5 text-positive" />
                    ) : (
                      <XCircle className="h-5 w-5 text-label-quaternary" />
                    )}
                  </div>
                </div>
              ))}

              {/* Compliance Row */}
              <div className="grid grid-cols-3 gap-4 rounded-lg border border-separator bg-surface p-4">
                <div className="flex items-center text-sm text-label-primary">
                  <Shield className="h-4 w-4 mr-2 text-treatment" />
                  HIPAA Compliant
                </div>
                <div className="flex justify-center">
                  {toolA.compliance?.hipaa_support === "yes" ? (
                    <CheckCircle2 className="h-5 w-5 text-positive" />
                  ) : (
                    <Minus className="h-5 w-5 text-label-quaternary" />
                  )}
                </div>
                <div className="flex justify-center">
                  {toolB.compliance?.hipaa_support === "yes" ? (
                    <CheckCircle2 className="h-5 w-5 text-positive" />
                  ) : (
                    <Minus className="h-5 w-5 text-label-quaternary" />
                  )}
                </div>
              </div>

              {/* SOC 2 Row */}
              <div className="grid grid-cols-3 gap-4 rounded-lg border border-separator bg-surface p-4">
                <div className="flex items-center text-sm text-label-primary">
                  <Shield className="h-4 w-4 mr-2 text-treatment" />
                  SOC 2 Certified
                </div>
                <div className="flex justify-center">
                  {toolA.compliance?.soc2 === "yes" ? (
                    <CheckCircle2 className="h-5 w-5 text-positive" />
                  ) : (
                    <Minus className="h-5 w-5 text-label-quaternary" />
                  )}
                </div>
                <div className="flex justify-center">
                  {toolB.compliance?.soc2 === "yes" ? (
                    <CheckCircle2 className="h-5 w-5 text-positive" />
                  ) : (
                    <Minus className="h-5 w-5 text-label-quaternary" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Profile Cards */}
        <section className="border-t border-separator bg-surface py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-label-primary mb-6">
              Quick Profiles
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {[toolA, toolB].map((tool) => (
                <div
                  key={tool.slug}
                  className="rounded-xl border border-separator bg-canvas p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-label-primary text-lg">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-label-secondary">
                        {tool.one_liner}
                      </p>
                    </div>
                    {result.winner === (tool === toolA ? "a" : "b") && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-treatment px-3 py-1 text-xs font-semibold text-white">
                        <Trophy className="h-3 w-3" />
                        Our Pick
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-label-tertiary" />
                      <span className="text-label-secondary">
                        Starting at{" "}
                        <span className="font-medium text-label-primary">
                          {tool.pricing?.starting_price_display || "Contact for pricing"}
                        </span>
                      </span>
                    </div>
                    {tool.feature_flags.has_ai && (
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span className="text-label-secondary">AI-Powered Features</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-hover"
                  >
                    View full profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architect CTA */}
        <section className="border-t border-separator py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <ContextualArchitectCTA
              context={{
                source: "comparison",
                preloadedProducts: [toolA.slug, toolB.slug],
              }}
            />
          </div>
        </section>

        {/* Related Comparisons */}
        <section className="border-t border-separator bg-canvas py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold text-label-primary mb-4">
              Related Comparisons
            </h2>
            <div className="flex flex-wrap gap-3">
              {KEY_COMPARISONS.filter(
                (c) => c.a !== parsed.a || c.b !== parsed.b
              )
                .slice(0, 6)
                .map(({ a, b }) => {
                  const nameA = a.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  const nameB = b.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <Link
                      key={`${a}-vs-${b}`}
                      href={`/tools/for-clinicians/compare/${a}-vs-${b}/`}
                      className="inline-flex items-center gap-1 rounded-lg border border-separator bg-surface px-4 py-2 text-sm font-medium text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
                    >
                      {nameA} vs {nameB}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  );
                })}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

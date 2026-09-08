/**
 * Patient App VS Comparison Pages
 *
 * Auto-generated head-to-head comparisons for consumer mental health apps.
 * Targets "[App] vs [App]" queries like "Calm vs Headspace".
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
  Calendar,
  ArrowRight,
  Trophy,
  Crown,
  Star,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ToolService } from "@/lib/tools/tool-service";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import {
  generateVsPages,
  KEY_COMPARISONS,
  TOP_APPS,
  type PatientPageConfig,
} from "@/lib/seo/patient-programmatic-seo-engine";
import { getCurrentYear } from "@/lib/seo/freshness-automation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ============================================================================
// CONFIG
// ============================================================================

function parseVsSlug(slug: string): { a: string; b: string } | null {
  const match = slug.match(/^(.+)-vs-(.+)$/);
  if (!match) return null;
  return { a: match[1], b: match[2] };
}

function getVsConfig(slug: string): PatientPageConfig | null {
  const configs = generateVsPages();
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

function compareApps(
  toolA: DigitalToolV3 | null,
  toolB: DigitalToolV3 | null
): ComparisonResult {
  if (!toolA || !toolB) {
    return { winner: "tie", reason: "Unable to determine winner with available data." };
  }

  let scoreA = 0;
  let scoreB = 0;

  // Evidence level
  const evidenceScores: Record<string, number> = { high: 30, moderate: 20, low: 10, emerging: 10 };
  scoreA += evidenceScores[toolA.clinical_metadata?.evidence_level || ""] || 0;
  scoreB += evidenceScores[toolB.clinical_metadata?.evidence_level || ""] || 0;

  // Support level
  const supportScores: Record<string, number> = { clinical: 25, coached: 15, "self-help": 5 };
  scoreA += supportScores[toolA.support_level || ""] || 0;
  scoreB += supportScores[toolB.support_level || ""] || 0;

  // Privacy
  const privacyScores: Record<string, number> = { "A+": 20, A: 18, "B+": 15, B: 12, C: 5, D: 0, F: -10 };
  scoreA += privacyScores[toolA.privacy.grade || ""] || 0;
  scoreB += privacyScores[toolB.privacy.grade || ""] || 0;

  // Free tier bonus
  if (toolA.pricing.model === "free" || toolA.pricing.free_tier) scoreA += 15;
  if (toolB.pricing.model === "free" || toolB.pricing.free_tier) scoreB += 15;

  // Featured bonus
  if (toolA.featured) scoreA += 20;
  if (toolB.featured) scoreB += 20;

  const diff = Math.abs(scoreA - scoreB);

  if (diff < 10) {
    return {
      winner: "tie",
      reason: "Both apps are excellent choices with different strengths. Your choice should depend on personal preferences.",
    };
  }

  if (scoreA > scoreB) {
    return {
      winner: "a",
      reason: `${toolA.name} offers stronger evidence-based features and better overall value for most users.`,
    };
  }

  return {
    winner: "b",
    reason: `${toolB.name} offers stronger evidence-based features and better overall value for most users.`,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function PatientVsPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseVsSlug(slug);
  const config = getVsConfig(slug);

  if (!parsed || !config) {
    notFound();
  }

  // Load tools
  const allTools = await ToolService.getAll();
  const toolA = allTools.find((t) => t.slug === parsed.a) || null;
  const toolB = allTools.find((t) => t.slug === parsed.b) || null;

  // Get names from config if tools not found
  const appA = TOP_APPS.find(app => app.slug === parsed.a);
  const appB = TOP_APPS.find(app => app.slug === parsed.b);
  const nameA = toolA?.name || appA?.name || parsed.a.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const nameB = toolB?.name || appB?.name || parsed.b.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const result = compareApps(toolA, toolB);
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
        { "@type": "ListItem", position: 1, name: "Tools", item: `${siteConfig.url}/tools/` },
        { "@type": "ListItem", position: 2, name: "For Patients", item: `${siteConfig.url}/tools/for-patients/` },
        { "@type": "ListItem", position: 3, name: `${nameA} vs ${nameB}`, item: `${siteConfig.url}${config.route}/` },
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
      author: { "@type": "Organization", name: "HeyPsych Editorial Team" },
      publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
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
        cssSelector: ["[data-speakable='true']", ".verdict"],
      },
    },
    // FAQPage
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `Which is better: ${nameA} or ${nameB}?`,
          acceptedAnswer: { "@type": "Answer", text: result.reason },
        },
        {
          "@type": "Question",
          name: `Is ${nameA} or ${nameB} free?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${nameA} is ${toolA?.pricing.model === "free" ? "free" : toolA?.pricing.free_tier ? "freemium with a free tier" : "a paid app"}. ${nameB} is ${toolB?.pricing.model === "free" ? "free" : toolB?.pricing.free_tier ? "freemium with a free tier" : "a paid app"}.`,
          },
        },
      ],
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {structuredData.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-canvas">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-separator bg-surface">
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-accent/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">Tools</Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/for-patients/" className="text-label-secondary hover:text-treatment">For Patients</Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Compare</span>
            </nav>

            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-treatment/20 bg-treatment/10">
                <Scale className="h-7 w-7 text-treatment" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl" data-speakable="true">
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

        {/* Verdict */}
        <section className="border-b border-separator bg-canvas py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-treatment/20 bg-treatment/5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-treatment/20">
                  <Crown className="h-6 w-6 text-treatment" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-label-primary mb-1">Our Verdict</h2>
                  <p className="text-label-secondary verdict" data-speakable="true">
                    {result.winner === "tie" ? (
                      <>Both {nameA} and {nameB} are excellent choices. {result.reason}</>
                    ) : result.winner === "a" ? (
                      <><strong>{nameA}</strong> is our recommendation. {result.reason}</>
                    ) : (
                      <><strong>{nameB}</strong> is our recommendation. {result.reason}</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Comparison */}
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-label-primary mb-6">Quick Comparison</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {[{ tool: toolA, name: nameA, isWinner: result.winner === "a" }, { tool: toolB, name: nameB, isWinner: result.winner === "b" }].map(({ tool, name, isWinner }) => (
                <div key={name} className="rounded-xl border border-separator bg-surface p-6 relative">
                  {isWinner && (
                    <div className="absolute -top-3 left-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-treatment px-3 py-1 text-xs font-semibold text-white">
                        <Trophy className="h-3 w-3" />
                        Our Pick
                      </span>
                    </div>
                  )}
                  <h3 className="font-bold text-label-primary text-lg mt-2">{name}</h3>
                  {tool && (
                    <>
                      <p className="mt-2 text-sm text-label-secondary">{tool.short_description}</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-label-tertiary" />
                          <span className="text-label-secondary">
                            {tool.pricing.model === "free" ? "Free" : tool.pricing.free_tier ? "Free tier available" : "Paid subscription"}
                          </span>
                        </div>
                        {tool.privacy.grade && (
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4 text-label-tertiary" />
                            <span className="text-label-secondary">Privacy: {tool.privacy.grade}</span>
                          </div>
                        )}
                        {tool.clinical_metadata?.evidence_level && (
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="h-4 w-4 text-label-tertiary" />
                            <span className="text-label-secondary">{tool.clinical_metadata.evidence_level} evidence</span>
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/tools/for-patients/${tool.primary_hubs?.[0] || "find-support"}/${tool.slug}/`}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-hover"
                      >
                        View full profile <ArrowRight className="h-4 w-4" />
                      </Link>
                    </>
                  )}
                  {!tool && (
                    <p className="mt-2 text-sm text-label-tertiary italic">Detailed profile coming soon</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Comparisons */}
        <section className="border-t border-separator bg-canvas py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold text-label-primary mb-4">Related Comparisons</h2>
            <div className="flex flex-wrap gap-3">
              {KEY_COMPARISONS.filter(c => c.a !== parsed.a || c.b !== parsed.b).slice(0, 6).map(({ a, b }) => {
                const nA = TOP_APPS.find(app => app.slug === a)?.name || a;
                const nB = TOP_APPS.find(app => app.slug === b)?.name || b;
                return (
                  <Link
                    key={`${a}-vs-${b}`}
                    href={`/tools/for-patients/compare/${a}-vs-${b}/`}
                    className="inline-flex items-center gap-1 rounded-lg border border-separator bg-surface px-4 py-2 text-sm font-medium text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
                  >
                    {nA} vs {nB}
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

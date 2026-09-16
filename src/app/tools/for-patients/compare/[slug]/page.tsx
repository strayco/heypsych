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
  AlertTriangle,
} from "lucide-react";
import { ComparisonTracker } from "./ComparisonTracker";
import { siteConfig } from "@/lib/config/site";
import { ToolService } from "@/lib/tools/tool-service";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import {
  generateVsPages,
  KEY_COMPARISONS,
  TOP_APPS,
  REGULATORY_WARNINGS,
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
  const parsed = parseVsSlug(slug);

  if (!parsed) {
    return { title: "Comparison Not Found", robots: "noindex" };
  }

  // Load tools to get real names
  const allTools = await ToolService.getAll();
  const toolA = allTools.find((t) => t.slug === parsed.a);
  const toolB = allTools.find((t) => t.slug === parsed.b);

  // At least one tool must exist
  if (!toolA && !toolB) {
    return { title: "Comparison Not Found", robots: "noindex" };
  }

  const appA = TOP_APPS.find(app => app.slug === parsed.a);
  const appB = TOP_APPS.find(app => app.slug === parsed.b);
  const nameA = toolA?.name || appA?.name || parsed.a.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const nameB = toolB?.name || appB?.name || parsed.b.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const year = getCurrentYear();
  const route = `/tools/for-patients/compare/${slug}`;
  const title = `${nameA} vs ${nameB} (${year}): Which Is Better? | HeyPsych`;
  const description = `Compare ${nameA} and ${nameB} side-by-side. See pricing, features, privacy, and evidence to find the best mental health app for you.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteConfig.url}${route}/`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${route}/`,
      type: "website",
    },
    keywords: [`${nameA.toLowerCase()} vs ${nameB.toLowerCase()}`, `${nameB.toLowerCase()} vs ${nameA.toLowerCase()}`],
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

// Allow dynamic comparison pages beyond KEY_COMPARISONS
export const dynamicParams = true;

export default async function PatientVsPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseVsSlug(slug);

  // Allow any valid comparison, not just KEY_COMPARISONS
  if (!parsed) {
    notFound();
  }

  // Load tools first to validate they exist
  const allTools = await ToolService.getAll();
  const toolA = allTools.find((t) => t.slug === parsed.a) || null;
  const toolB = allTools.find((t) => t.slug === parsed.b) || null;

  // At least one tool must exist for the comparison to be valid
  if (!toolA && !toolB) {
    notFound();
  }

  // Get names from tools or config
  const appA = TOP_APPS.find(app => app.slug === parsed.a);
  const appB = TOP_APPS.find(app => app.slug === parsed.b);
  const nameA = toolA?.name || appA?.name || parsed.a.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const nameB = toolB?.name || appB?.name || parsed.b.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  // Get pre-defined config or generate dynamically
  const predefinedConfig = getVsConfig(slug);
  const config: PatientPageConfig = predefinedConfig || {
    slug,
    route: `/tools/for-patients/compare/${slug}`,
    title: `${nameA} vs ${nameB} (${getCurrentYear()}): Which Is Better? | HeyPsych`,
    description: `Compare ${nameA} and ${nameB} side-by-side. See pricing, features, privacy, and evidence to find the best mental health app for you.`,
    h1: `${nameA} vs ${nameB}: Which Is Right for You?`,
    primaryKeyword: `${nameA.toLowerCase()} vs ${nameB.toLowerCase()}`,
    secondaryKeywords: [`${nameA.toLowerCase()} or ${nameB.toLowerCase()}`, `${nameB.toLowerCase()} vs ${nameA.toLowerCase()}`],
    pageType: "comparison",
    filters: {},
    relatedPages: [],
    priority: 0.7,
  };

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

  // Determine winner slug for tracking
  const winnerSlug = result.winner === "a" ? parsed.a : result.winner === "b" ? parsed.b : undefined;

  return (
    <>
      {/* Comparison view tracking */}
      <ComparisonTracker
        toolASlug={parsed.a}
        toolBSlug={parsed.b}
        winnerSlug={winnerSlug}
      />

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

        {/* Regulatory Warning Banner (if either service has issues) */}
        {(REGULATORY_WARNINGS[parsed.a] || REGULATORY_WARNINGS[parsed.b]) && (
          <section className="border-b border-amber-200 bg-amber-50 py-6">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold text-amber-800">Important: Regulatory Issues</h2>
                  <p className="mt-1 text-sm text-amber-700">
                    {REGULATORY_WARNINGS[parsed.a] && REGULATORY_WARNINGS[parsed.b] ? (
                      <>Both {nameA} and {nameB} have faced significant federal investigations and legal action. Review the details below before making a decision.</>
                    ) : REGULATORY_WARNINGS[parsed.a] ? (
                      <>{nameA} has faced significant federal investigations and legal action. Review the details below.</>
                    ) : (
                      <>{nameB} has faced significant federal investigations and legal action. Review the details below.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Verdict */}
        <section className="border-b border-separator bg-canvas py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className={`rounded-xl border p-6 ${
              REGULATORY_WARNINGS[parsed.a] && REGULATORY_WARNINGS[parsed.b]
                ? "border-amber-300 bg-amber-50"
                : "border-treatment/20 bg-treatment/5"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  REGULATORY_WARNINGS[parsed.a] && REGULATORY_WARNINGS[parsed.b]
                    ? "bg-amber-100"
                    : "bg-treatment/20"
                }`}>
                  {REGULATORY_WARNINGS[parsed.a] && REGULATORY_WARNINGS[parsed.b] ? (
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  ) : (
                    <Crown className="h-6 w-6 text-treatment" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-label-primary mb-1">Our Verdict</h2>
                  <p className="text-label-secondary verdict" data-speakable="true">
                    {REGULATORY_WARNINGS[parsed.a] && REGULATORY_WARNINGS[parsed.b] ? (
                      <>
                        <strong className="text-amber-700">Proceed with caution.</strong> Both {nameA} and {nameB} have faced
                        serious federal investigations for controlled substance practices. Consider alternatives like{" "}
                        <Link href="/tools/talkiatry/" className="text-treatment hover:underline">Talkiatry</Link> or{" "}
                        <Link href="/tools/brightside-health/" className="text-treatment hover:underline">Brightside</Link>{" "}
                        for psychiatric care.
                      </>
                    ) : result.winner === "tie" ? (
                      <>Both {nameA} and {nameB} are solid choices. {result.reason}</>
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
              {[{ tool: toolA, name: nameA, slug: parsed.a, isWinner: result.winner === "a" }, { tool: toolB, name: nameB, slug: parsed.b, isWinner: result.winner === "b" }].map(({ tool, name, slug: toolSlug, isWinner }) => {
                const warning = REGULATORY_WARNINGS[toolSlug];
                return (
                <div key={name} className={`rounded-xl border ${warning ? "border-amber-300 bg-amber-50/30" : "border-separator bg-surface"} p-6 relative`}>
                  {isWinner && !warning && (
                    <div className="absolute -top-3 left-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-treatment px-3 py-1 text-xs font-semibold text-white">
                        <Trophy className="h-3 w-3" />
                        Our Pick
                      </span>
                    </div>
                  )}
                  {warning && (
                    <div className="absolute -top-3 left-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                        <AlertTriangle className="h-3 w-3" />
                        {warning.title}
                      </span>
                    </div>
                  )}
                  <h3 className="font-bold text-label-primary text-lg mt-2">{name}</h3>

                  {/* Regulatory Warning Banner */}
                  {warning && (
                    <div className="mt-3 rounded-lg border border-amber-300 bg-amber-100 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">{warning.summary}</p>
                          <ul className="mt-2 text-xs text-amber-700 space-y-1">
                            {warning.details.slice(0, 2).map((detail, i) => (
                              <li key={i}>• {detail}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {tool && (
                    <>
                      <p className="mt-3 text-sm text-label-secondary">{tool.short_description}</p>
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
                        href={`/tools/${tool.slug}/?ref=compare&compare=${slug}`}
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
              )})}
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

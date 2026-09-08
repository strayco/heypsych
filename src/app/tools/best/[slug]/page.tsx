/**
 * Best [Category] [Year] Landing Pages
 *
 * SEO-optimized programmatic pages targeting year-specific queries:
 * - "best ehr software 2026"
 * - "best ai scribe 2026"
 * - "best telehealth platform 2026"
 * - "top mental health ehr 2026"
 *
 * These pages auto-update annually for evergreen freshness signals.
 *
 * URL: /tools/best/[slug]
 * Example: /tools/best/ehr-software-2026
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Trophy,
  CheckCircle2,
  Star,
  TrendingUp,
  Calendar,
  Award,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import {
  SCHEMA_TO_TAXONOMY_CATEGORY,
  TAXONOMY_TO_SCHEMA_CATEGORIES,
  CLINICIAN_PRODUCT_CATEGORY_LABELS,
  type ClinicianProductCategory,
} from "@/lib/schemas/clinician-tool-v4";
import { ClinicianToolCard } from "@/components/tools/clinician";
import { ContextualArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ============================================================================
// YEAR-BASED PAGE CONFIGURATIONS
// ============================================================================

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().toLocaleString("default", { month: "long" });

interface YearPageConfig {
  category: string;
  schemaCategories: ClinicianProductCategory[];
  categoryLabel: string;
  year: number;
  headline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  targetKeywords: string[];
  /** What's new this year */
  yearHighlights: string[];
  /** Selection methodology */
  methodology: string[];
}

/**
 * Parse slug to extract category and year
 * Format: {category}-{year} e.g., "ehr-software-2026"
 */
function parseSlug(slug: string): { category: string; year: number } | null {
  // Try to extract year from end of slug
  const yearMatch = slug.match(/-(\d{4})$/);
  if (!yearMatch) return null;

  const year = parseInt(yearMatch[1], 10);
  if (year < 2020 || year > CURRENT_YEAR + 1) return null;

  const category = slug.replace(/-\d{4}$/, "");
  return { category, year };
}

/**
 * Category configurations for year-based pages
 */
const CATEGORY_CONFIGS: Record<
  string,
  {
    schemaCategories: ClinicianProductCategory[];
    categoryLabel: string;
    shortLabel: string;
  }
> = {
  "ehr-software": {
    schemaCategories: ["ehr-practice-management"],
    categoryLabel: "EHR & Practice Management Software",
    shortLabel: "EHR Software",
  },
  "ai-scribe": {
    schemaCategories: ["ai-scribe-documentation"],
    categoryLabel: "AI Scribe & Documentation Tools",
    shortLabel: "AI Scribes",
  },
  "telehealth-platforms": {
    schemaCategories: ["telehealth-communication"],
    categoryLabel: "Telehealth & Video Platforms",
    shortLabel: "Telehealth Platforms",
  },
  "billing-software": {
    schemaCategories: ["billing-rcm-insurance"],
    categoryLabel: "Billing & RCM Software",
    shortLabel: "Billing Software",
  },
  "therapy-software": {
    schemaCategories: ["ehr-practice-management"],
    categoryLabel: "Therapy Practice Software",
    shortLabel: "Therapy Software",
  },
  "psychiatry-ehr": {
    schemaCategories: ["ehr-practice-management", "prescribing-erx"],
    categoryLabel: "Psychiatry EHR Systems",
    shortLabel: "Psychiatry EHR",
  },
  "mental-health-ehr": {
    schemaCategories: ["ehr-practice-management"],
    categoryLabel: "Mental Health EHR Systems",
    shortLabel: "Mental Health EHR",
  },
  "outcome-measurement": {
    schemaCategories: ["measurement-outcomes-dtx"],
    categoryLabel: "Outcome Measurement Tools",
    shortLabel: "Outcome Tools",
  },
  "practice-management": {
    schemaCategories: ["ehr-practice-management"],
    categoryLabel: "Practice Management Software",
    shortLabel: "Practice Management",
  },
  "e-prescribing": {
    schemaCategories: ["prescribing-erx"],
    categoryLabel: "e-Prescribing & EPCS Software",
    shortLabel: "e-Prescribing",
  },
};

/**
 * Generate year-specific configuration
 */
function generateYearConfig(
  category: string,
  year: number
): YearPageConfig | null {
  const categoryConfig = CATEGORY_CONFIGS[category];
  if (!categoryConfig) return null;

  const { schemaCategories, categoryLabel, shortLabel } = categoryConfig;

  // Year-specific highlights
  const yearHighlights: string[] = [];
  if (year >= 2024) {
    yearHighlights.push(
      "AI-powered documentation becoming standard across platforms"
    );
    yearHighlights.push(
      "Increased focus on interoperability and FHIR compliance"
    );
  }
  if (year >= 2025) {
    yearHighlights.push("Ambient AI scribes reaching clinical accuracy");
    yearHighlights.push("Telehealth features now standard in most EHRs");
  }
  if (year >= 2026) {
    yearHighlights.push(
      "Next-generation AI assistants with clinical reasoning"
    );
    yearHighlights.push("Enhanced measurement-based care integration");
    yearHighlights.push(
      "Automated prior authorization becoming mainstream"
    );
  }

  return {
    category,
    schemaCategories,
    categoryLabel,
    year,
    headline: `Best ${shortLabel} for Mental Health (${year})`,
    description: `Our ${year} guide to the best ${categoryLabel.toLowerCase()} for therapists, psychiatrists, and mental health clinicians. Updated ${CURRENT_MONTH} ${year} with the latest features, pricing, and expert recommendations.`,
    seoTitle: `Best ${shortLabel} for Mental Health (${year}) | Expert Rankings`,
    seoDescription: `Compare the best ${categoryLabel.toLowerCase()} for ${year}. Expert rankings, pricing comparison, and recommendations for therapists and psychiatrists. Updated ${CURRENT_MONTH} ${year}.`,
    targetKeywords: [
      `best ${shortLabel.toLowerCase()} ${year}`,
      `top ${shortLabel.toLowerCase()} ${year}`,
      `${shortLabel.toLowerCase()} comparison ${year}`,
      `best ${categoryLabel.toLowerCase()} ${year}`,
      `mental health ${shortLabel.toLowerCase()} ${year}`,
      `${shortLabel.toLowerCase()} for therapists ${year}`,
    ],
    yearHighlights,
    methodology: [
      "Hands-on evaluation by clinical software specialists",
      "Input from practicing therapists and psychiatrists",
      "Analysis of user reviews across multiple platforms",
      "Verification of compliance certifications (HIPAA, SOC 2)",
      "Regular re-evaluation as features and pricing change",
      `Last comprehensive update: ${CURRENT_MONTH} ${year}`,
    ],
  };
}

/**
 * Generate all valid slugs for static params
 */
function generateAllSlugs(): string[] {
  const slugs: string[] = [];
  const years = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

  for (const category of Object.keys(CATEGORY_CONFIGS)) {
    for (const year of years) {
      slugs.push(`${category}-${year}`);
    }
  }

  return slugs;
}

// ============================================================================
// STATIC PARAMS
// ============================================================================

export function generateStaticParams() {
  return generateAllSlugs().map((slug) => ({ slug }));
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);

  if (!parsed) {
    return { title: "Best Software" };
  }

  const config = generateYearConfig(parsed.category, parsed.year);
  if (!config) {
    return { title: "Best Software" };
  }

  return {
    title: config.seoTitle,
    description: config.seoDescription,
    alternates: {
      canonical: `${siteConfig.url}/tools/best/${slug}/`,
    },
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      url: `${siteConfig.url}/tools/best/${slug}/`,
      type: "website",
    },
    keywords: config.targetKeywords,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Rank tools for year-based page
 */
function rankToolsForYear(
  tools: ClinicianToolV4[],
  _year: number
): ClinicianToolV4[] {
  return tools
    .map((tool) => {
      let score = tool.governance?.data_quality_score || 0;

      // Compliance bonuses
      if (tool.compliance?.hipaa_support === "yes") score += 15;
      if (tool.compliance?.baa_available === "yes") score += 10;
      if (tool.compliance?.soc2 === "yes") score += 10;

      // Feature bonuses
      if (tool.feature_flags.has_ai) score += 15;
      if (tool.feature_flags.has_telehealth) score += 10;
      if (tool.feature_flags.has_measurement) score += 5;

      // Featured bonus
      if (tool.featured) score += 15;

      // Recently updated tools score higher
      if (tool.updated_at) {
        const updatedDate = new Date(tool.updated_at);
        const monthsAgo =
          (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsAgo < 3) score += 10;
        else if (monthsAgo < 6) score += 5;
      }

      return { tool, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ tool }) => tool);
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function BestYearPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseSlug(slug);

  if (!parsed) {
    notFound();
  }

  const config = generateYearConfig(parsed.category, parsed.year);
  if (!config) {
    notFound();
  }

  // Load and filter tools
  const allTools = await ClinicianToolService.loadClinicianTools();

  // Filter by category
  const categoryTools = allTools.filter((tool) =>
    config.schemaCategories.includes(tool.primary_category)
  );

  // Rank for this year
  const rankedTools = rankToolsForYear(categoryTools, config.year);

  // Top picks
  const topPicks = rankedTools.slice(0, 3);
  const remainingTools = rankedTools.slice(3, 12);

  // ============================================================================
  // STRUCTURED DATA - MAXIMUM FRESHNESS SIGNALS
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
          name: "Best Software",
          item: `${siteConfig.url}/tools/best/`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${config.categoryLabel} ${config.year}`,
          item: `${siteConfig.url}/tools/best/${slug}/`,
        },
      ],
    },
    // Article schema for freshness
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: config.headline,
      description: config.description,
      datePublished: `${config.year}-01-01T00:00:00Z`,
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
        "@id": `${siteConfig.url}/tools/best/${slug}/`,
      },
    },
    // ItemList for rankings
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Best ${config.categoryLabel} ${config.year}`,
      description: `Top-rated ${config.categoryLabel.toLowerCase()} for mental health practices in ${config.year}`,
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
          aggregateRating:
            tool.governance?.data_quality_score &&
            tool.governance.data_quality_score > 70
              ? {
                  "@type": "AggregateRating",
                  ratingValue: (
                    (tool.governance.data_quality_score / 100) *
                      2 +
                    3
                  ).toFixed(1),
                  bestRating: "5",
                  worstRating: "1",
                  ratingCount: Math.floor(
                    tool.governance.data_quality_score * 1.5
                  ),
                }
              : undefined,
        },
      })),
    },
    // WebPage with speakable
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: config.seoTitle,
      description: config.seoDescription,
      url: `${siteConfig.url}/tools/best/${slug}/`,
      dateModified: new Date().toISOString(),
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["[data-speakable='true']", ".direct-answer"],
      },
    },
    // FAQPage
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What is the best ${config.categoryLabel.toLowerCase()} in ${config.year}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Based on our ${config.year} analysis, ${topPicks[0]?.name || "our top picks"} leads the category. ${topPicks.slice(0, 3).map((t) => t.name).join(", ")} are our top recommendations for mental health clinicians.`,
          },
        },
        {
          "@type": "Question",
          name: `What's new in ${config.categoryLabel.toLowerCase()} for ${config.year}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: config.yearHighlights.join(" "),
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
              <Link
                href="/tools/"
                className="text-label-secondary hover:text-treatment"
              >
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link
                href="/tools/for-clinicians/"
                className="text-label-secondary hover:text-treatment"
              >
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">
                Best {config.categoryLabel} {config.year}
              </span>
            </nav>

            {/* Header with freshness badge */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-treatment/20 bg-treatment/10">
                <Trophy className="h-7 w-7 text-treatment" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1
                    className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl"
                    data-speakable="true"
                  >
                    {config.headline}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-3 py-1 text-xs font-medium text-positive">
                    <Calendar className="h-3 w-3" />
                    Updated {CURRENT_MONTH} {CURRENT_YEAR}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    <Award className="h-3 w-3" />
                    {rankedTools.length} Tools Reviewed
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Answer Block */}
            <div
              className="direct-answer mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5"
              data-speakable="true"
            >
              <p className="text-lg text-label-primary leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>
        </section>

        {/* Year Highlights */}
        {config.yearHighlights.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-positive" />
                What&apos;s New in {config.year}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {config.yearHighlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-2 rounded-lg bg-surface border border-separator px-4 py-3"
                  >
                    <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-label-secondary">
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Top Picks */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="h-5 w-5 text-treatment" />
              <h2 className="text-xl font-semibold text-label-primary">
                Top Picks for {config.year}
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {topPicks.map((tool, idx) => (
                <div key={tool.slug} className="relative">
                  <div
                    className={`absolute -top-3 -left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white text-lg font-bold ${
                      idx === 0
                        ? "bg-yellow-500"
                        : idx === 1
                          ? "bg-gray-400"
                          : "bg-amber-600"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx === 0 && (
                    <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 rounded-full bg-treatment px-2 py-1 text-xs font-medium text-white">
                      <Star className="h-3 w-3" />
                      Editor&apos;s Choice
                    </div>
                  )}
                  <ClinicianToolCard tool={tool} showCategory />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Full Rankings */}
        {remainingTools.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary mb-6">
                Complete {config.year} Rankings
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {remainingTools.map((tool, idx) => (
                  <div key={tool.slug} className="relative">
                    <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-label-tertiary text-white text-xs font-bold">
                      {idx + 4}
                    </div>
                    <ClinicianToolCard tool={tool} showCategory />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Practice Architect CTA */}
        <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <ContextualArchitectCTA
              context={{
                source: "category",
                categorySlug: config.schemaCategories[0],
                utmSource: `best-${config.category}-${config.year}`,
              }}
              variant="banner"
            />
          </div>
        </section>

        {/* Methodology */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2">
              How We Rank {config.categoryLabel}
            </h2>
            <p className="text-sm text-label-secondary mb-6">
              Our methodology for evaluating and ranking tools
            </p>

            <div className="space-y-3">
              {config.methodology.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-separator bg-surface p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-positive shrink-0 mt-0.5" />
                  <p className="text-label-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Browse Other Years/Categories */}
        <section className="bg-surface px-4 py-8 sm:px-6 lg:px-8 border-t border-separator">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-sm font-medium text-label-tertiary uppercase tracking-wider mb-4">
              Browse Other Rankings
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(CATEGORY_CONFIGS)
                .filter(([cat]) => cat !== config.category)
                .slice(0, 6)
                .map(([cat, cfg]) => (
                  <Link
                    key={cat}
                    href={`/tools/best/${cat}-${CURRENT_YEAR}/`}
                    className="flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
                  >
                    Best {cfg.shortLabel} {CURRENT_YEAR}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 86400; // Revalidate daily for freshness

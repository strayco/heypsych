/**
 * Solo Practice Landing Page
 *
 * Practice-size specific landing page targeting searches like "EHR for solo practice",
 * "best software for solo therapist", "solo practice tools".
 *
 * Filters tools by audiences.organization_sizes = "solo" or audiences.practice_settings = "solo-practice"
 *
 * URL: /tools/for-solo-practice
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  User,
  ArrowRight,
  DollarSign,
  Clock,
  Shield,
  CheckCircle2,
  Sparkles,
  FileText,
  Bot,
  Receipt,
  Video,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService, type ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import { ClinicianToolCard } from "@/components/tools/clinician";

export const metadata: Metadata = {
  title: "Best Software for Solo Practice (2026) | EHR, Billing & AI Scribes",
  description: "Find the best EHR, AI scribe, billing, and telehealth software for solo mental health practices. Compare pricing and features for independent therapists and psychiatrists.",
  keywords: [
    "EHR for solo practice",
    "solo practice software",
    "best EHR for solo therapist",
    "solo practitioner EHR",
    "software for independent therapist",
    "solo practice management",
    "one-person therapy practice software",
  ],
  alternates: {
    canonical: `${siteConfig.url}/tools/for-solo-practice/`,
  },
  openGraph: {
    title: "Best Software for Solo Practice | Mental Health EHR & Tools",
    description: "Find the best EHR, AI scribe, billing, and telehealth software for solo mental health practices.",
    url: `${siteConfig.url}/tools/for-solo-practice/`,
    type: "website",
  },
};

// Category configs for top picks sections
const CATEGORY_CONFIGS = [
  {
    key: "ehr-practice-management",
    displayName: "EHR & Practice Management",
    icon: FileText,
    description: "All-in-one platforms for scheduling, notes, and client management",
  },
  {
    key: "ai-scribe-documentation",
    displayName: "AI Scribes",
    icon: Bot,
    description: "Save hours weekly with AI-powered clinical documentation",
  },
  {
    key: "billing-rcm-insurance",
    displayName: "Billing & Insurance",
    icon: Receipt,
    description: "Simplify claims, payment processing, and superbills",
  },
  {
    key: "telehealth-communication",
    displayName: "Telehealth",
    icon: Video,
    description: "HIPAA-compliant video sessions and secure messaging",
  },
];

/**
 * Filter tools suitable for solo practices
 * Checks both organization_sizes and practice_settings
 */
function filterSoloTools(tools: ClinicianToolV4[]): ClinicianToolV4[] {
  return tools.filter((tool) => {
    const sizes = tool.audiences?.organization_sizes || [];
    const settings = tool.audiences?.practice_settings || [];

    // Include if explicitly targets solo OR if no audience specified (general tools)
    const targetsSolo =
      sizes.includes("solo") ||
      settings.includes("solo-practice") ||
      (sizes.length === 0 && settings.length === 0);

    // Exclude if explicitly excludes solo (only targets larger orgs)
    const excludesSolo =
      sizes.length > 0 &&
      !sizes.includes("solo") &&
      !sizes.includes("small-2-10");

    return targetsSolo && !excludesSolo;
  });
}

/**
 * Sort tools by relevance for solo practices
 * Prioritizes: featured, has pricing, HIPAA confirmed, alphabetical
 */
function sortSoloTools(tools: ClinicianToolV4[]): ClinicianToolV4[] {
  return tools.sort((a, b) => {
    // Featured first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    // Has pricing display
    const aHasPrice = !!a.pricing?.starting_price_display;
    const bHasPrice = !!b.pricing?.starting_price_display;
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    // HIPAA confirmed
    const aHipaa = a.compliance?.hipaa_support === "yes";
    const bHipaa = b.compliance?.hipaa_support === "yes";
    if (aHipaa && !bHipaa) return -1;
    if (!aHipaa && bHipaa) return 1;

    // Alphabetical
    return a.name.localeCompare(b.name);
  });
}

export default async function ForSoloPracticePage() {
  const allTools = await ClinicianToolService.loadClinicianTools();
  const soloTools = filterSoloTools(allTools);

  // Group tools by category for top picks
  const toolsByCategory = CATEGORY_CONFIGS.map((config) => {
    const categoryTools = soloTools.filter(
      (tool) =>
        tool.primary_category === config.key ||
        tool.secondary_categories.includes(config.key as any)
    );
    return {
      ...config,
      tools: sortSoloTools(categoryTools).slice(0, 4),
    };
  });

  // Get top recommended tools across all categories (for pricing comparison)
  const topRecommended = sortSoloTools(soloTools)
    .filter((t) => t.pricing?.starting_price_display)
    .slice(0, 8);

  // Structured data
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
          name: "For Solo Practice",
          item: `${siteConfig.url}/tools/for-solo-practice/`,
        },
      ],
    },
    // CollectionPage
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Best Software for Solo Practice",
      description: "Find the best EHR, AI scribe, billing, and telehealth software for solo mental health practices.",
      url: `${siteConfig.url}/tools/for-solo-practice/`,
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
      mainEntity: {
        "@type": "ItemList",
        name: "Top Software for Solo Practices",
        numberOfItems: topRecommended.length,
        itemListElement: topRecommended.map((tool, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "SoftwareApplication",
            name: tool.name,
            applicationCategory: "HealthApplication",
            description: tool.short_description,
            url: `${siteConfig.url}/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`,
            ...(tool.pricing?.starting_price_display && {
              offers: {
                "@type": "Offer",
                price: tool.pricing.starting_price_cents
                  ? (tool.pricing.starting_price_cents / 100).toFixed(2)
                  : undefined,
                priceCurrency: "USD",
                priceSpecification: tool.pricing.starting_price_display,
              },
            }),
          },
        })),
      },
    },
  ];

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
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-separator bg-surface">
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-accent/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">For Solo Practice</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-treatment/10 text-treatment border-treatment/20">
                <User className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  Software for Solo Practice
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {soloTools.length} tools optimized for independent practitioners
                </p>
              </div>
            </div>

            <p className="mt-4 text-lg text-label-secondary max-w-3xl">
              Running a solo practice means you need software that&apos;s simple, affordable, and
              does the job without unnecessary complexity. Find the best EHR, AI scribe, billing,
              and telehealth tools designed for independent therapists, counselors, and psychiatrists.
            </p>

            {/* Key value props */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-separator bg-canvas p-4">
                <DollarSign className="h-5 w-5 text-positive-600 shrink-0" />
                <div>
                  <p className="font-medium text-label-primary">Budget-Friendly</p>
                  <p className="text-xs text-label-secondary">Starting from $29/month</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-separator bg-canvas p-4">
                <Clock className="h-5 w-5 text-treatment shrink-0" />
                <div>
                  <p className="font-medium text-label-primary">Time-Saving</p>
                  <p className="text-xs text-label-secondary">All-in-one solutions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-separator bg-canvas p-4">
                <Shield className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <p className="font-medium text-label-primary">HIPAA Built-In</p>
                  <p className="text-xs text-label-secondary">Compliance included</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Best For Solo callout */}
        <section className="border-b border-separator bg-treatment/5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-treatment" />
                <div>
                  <p className="font-semibold text-label-primary">Best for Solo Practitioners</p>
                  <p className="text-sm text-label-secondary">
                    Tools selected for simplicity, affordable pricing, and solo-friendly support
                  </p>
                </div>
              </div>
              <Link
                href="/architect"
                className="inline-flex items-center gap-2 rounded-lg bg-treatment px-4 py-2 text-sm font-medium text-white hover:bg-treatment/90 transition-colors"
              >
                Try Practice Architect
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Category Sections */}
        {toolsByCategory.map((category) => {
          const Icon = category.icon;
          return (
            <section
              key={category.key}
              className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8"
            >
              <div className="mx-auto max-w-6xl">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-5 w-5 text-treatment" />
                  <h2 className="text-xl font-semibold text-label-primary">
                    {category.displayName}
                  </h2>
                </div>
                <p className="text-sm text-label-secondary mb-6">
                  {category.description}
                </p>

                {category.tools.length > 0 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {category.tools.map((tool) => (
                        <ClinicianToolCard key={tool.slug} tool={tool} variant="compact" />
                      ))}
                    </div>
                    <Link
                      href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[category.key as keyof typeof SCHEMA_TO_TAXONOMY_CATEGORY] || category.key}/`}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
                    >
                      View all {category.displayName.toLowerCase()}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-label-tertiary">
                    No tools currently available in this category for solo practices.
                  </p>
                )}
              </div>
            </section>
          );
        })}

        {/* Pricing Comparison Section */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-treatment" />
              <h2 className="text-xl font-semibold text-label-primary">
                Pricing Comparison for Solo Practices
              </h2>
            </div>
            <p className="text-sm text-label-secondary mb-6">
              Monthly costs at a glance - find the right fit for your budget
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-b border-separator">
                    <th className="px-4 py-3 text-left text-sm font-medium text-label-secondary">
                      Tool
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-label-secondary">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-label-secondary">
                      Starting Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-label-secondary">
                      Free Trial
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-label-secondary">
                      HIPAA
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topRecommended.map((tool) => (
                    <tr
                      key={tool.slug}
                      className="border-b border-separator hover:bg-canvas/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`}
                          className="font-medium text-label-primary hover:text-treatment"
                        >
                          {tool.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-label-secondary">
                        {tool.primary_category
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())
                          .replace("Ehr", "EHR")
                          .replace("Ai", "AI")
                          .replace("Rcm", "RCM")}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-label-primary">
                        {tool.pricing?.starting_price_display || "Contact"}
                      </td>
                      <td className="px-4 py-3 text-sm text-label-secondary">
                        {tool.pricing?.free_tier ? (
                          <span className="text-positive-600">Free tier</span>
                        ) : tool.pricing?.free_trial_days ? (
                          `${tool.pricing.free_trial_days} days`
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tool.compliance?.hipaa_support === "yes" ? (
                          <CheckCircle2 className="h-4 w-4 text-positive-600" />
                        ) : (
                          <span className="text-xs text-label-tertiary">Unknown</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/tools/pricing/"
                className="inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
              >
                Full Pricing Comparisons
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tools/pricing/mental-health-ehr/"
                className="inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
              >
                EHR Pricing Guide
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Considerations for Solo Practice */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              What Solo Practitioners Should Look For
            </h2>

            <div className="space-y-4">
              {[
                {
                  title: "All-in-One Solutions",
                  description:
                    "Solo practitioners benefit most from platforms that handle scheduling, notes, billing, and telehealth in one system. Reduces complexity and total cost.",
                },
                {
                  title: "Simple Pricing, No Per-Claim Fees",
                  description:
                    "Watch for hidden costs like per-claim fees, payment processing charges, and e-prescribing add-ons. These can significantly increase your monthly spend.",
                },
                {
                  title: "Built-In HIPAA Compliance",
                  description:
                    "Choose platforms where HIPAA compliance is standard, not an expensive add-on. Always get a signed BAA before storing patient data.",
                },
                {
                  title: "Good Support Without Enterprise Pricing",
                  description:
                    "As a solo practitioner, you need responsive support without paying enterprise rates. Check reviews for support quality before committing.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-separator bg-surface p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-treatment shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-label-primary">{item.title}</p>
                    <p className="mt-1 text-sm text-label-secondary">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-sm font-medium text-label-tertiary uppercase tracking-wider mb-4">
              Related Resources
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tools/for-group-practice/"
                className="inline-flex items-center gap-1 text-sm text-treatment hover:underline"
              >
                Software for Group Practice
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tools/for-practices/"
                className="inline-flex items-center gap-1 text-sm text-treatment hover:underline"
              >
                Browse by Practice Type
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tools/stacks/therapy-practice/"
                className="inline-flex items-center gap-1 text-sm text-treatment hover:underline"
              >
                Therapy Practice Stack Guide
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tools/for-clinicians/"
                className="inline-flex items-center gap-1 text-sm text-treatment hover:underline"
              >
                All Clinician Tools
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-semibold text-label-primary">
              Not sure which tools fit your practice?
            </h2>
            <p className="mt-2 text-label-secondary">
              Practice Architect helps you build the perfect tech stack based on your specific needs, budget, and workflow.
            </p>
            <Link
              href="/architect/"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-treatment px-6 py-3 text-sm font-medium text-white hover:bg-treatment/90 transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              Try Practice Architect
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600; // 1 hour

/**
 * Group Practice Landing Page
 *
 * Practice-size specific landing page targeting searches like "group practice software",
 * "EHR for group therapy practice", "multi-provider EHR".
 *
 * Filters tools by audiences.organization_sizes including "small-2-10", "medium-11-50", "large-51-200"
 * or audiences.practice_settings = "group-practice"
 *
 * URL: /tools/for-group-practice
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  ArrowRight,
  DollarSign,
  BarChart3,
  Shield,
  CheckCircle2,
  Sparkles,
  FileText,
  Bot,
  Receipt,
  Video,
  Settings,
  TrendingUp,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService, type ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import { ClinicianToolCard } from "@/components/tools/clinician";

export const metadata: Metadata = {
  title: "Best Software for Group Practice (2026) | Multi-Provider EHR & Tools",
  description: "Find the best EHR, billing, AI scribe, and practice management software for group therapy practices. Compare multi-provider pricing and features for 2-50+ clinician teams.",
  keywords: [
    "group practice software",
    "group practice EHR",
    "multi-provider EHR",
    "therapy group practice software",
    "EHR for group therapy practice",
    "group practice management",
    "multi-clinician practice software",
  ],
  alternates: {
    canonical: `${siteConfig.url}/tools/for-group-practice/`,
  },
  openGraph: {
    title: "Best Software for Group Practice | Multi-Provider EHR & Tools",
    description: "Find the best EHR, billing, AI scribe, and practice management software for group therapy practices.",
    url: `${siteConfig.url}/tools/for-group-practice/`,
    type: "website",
  },
};

// Category configs for top picks sections
const CATEGORY_CONFIGS = [
  {
    key: "ehr-practice-management",
    displayName: "EHR & Practice Management",
    icon: FileText,
    description: "Multi-provider scheduling, permissions, and centralized client management",
  },
  {
    key: "ai-scribe-documentation",
    displayName: "AI Scribes",
    icon: Bot,
    description: "Team-wide documentation with shared templates and compliance tracking",
  },
  {
    key: "billing-rcm-insurance",
    displayName: "Billing & RCM",
    icon: Receipt,
    description: "Centralized billing, multi-provider claims, and revenue analytics",
  },
  {
    key: "telehealth-communication",
    displayName: "Telehealth",
    icon: Video,
    description: "HIPAA-compliant video with provider assignment and virtual waiting rooms",
  },
];

/**
 * Filter tools suitable for group practices
 * Checks both organization_sizes and practice_settings for multi-provider support
 */
function filterGroupTools(tools: ClinicianToolV4[]): ClinicianToolV4[] {
  return tools.filter((tool) => {
    const sizes = tool.audiences?.organization_sizes || [];
    const settings = tool.audiences?.practice_settings || [];

    // Include if explicitly targets group sizes OR group practice setting
    const targetsGroup =
      sizes.includes("small-2-10") ||
      sizes.includes("medium-11-50") ||
      sizes.includes("large-51-200") ||
      sizes.includes("enterprise-200-plus") ||
      settings.includes("group-practice") ||
      settings.includes("multi-site-enterprise");

    // Also include general tools that don't explicitly exclude groups
    const isGeneralTool = sizes.length === 0 && settings.length === 0;

    return targetsGroup || isGeneralTool;
  });
}

/**
 * Sort tools by relevance for group practices
 * Prioritizes: featured, multi-provider pricing, HIPAA, alphabetical
 */
function sortGroupTools(tools: ClinicianToolV4[]): ClinicianToolV4[] {
  return tools.sort((a, b) => {
    // Featured first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    // Has per-provider pricing (more transparent for groups)
    const aPerProvider = a.pricing?.model === "per-provider-month" || a.pricing?.model === "per-provider-year";
    const bPerProvider = b.pricing?.model === "per-provider-month" || b.pricing?.model === "per-provider-year";
    if (aPerProvider && !bPerProvider) return -1;
    if (!aPerProvider && bPerProvider) return 1;

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

/**
 * Calculate estimated monthly cost for a group practice
 */
function calculateGroupCost(tool: ClinicianToolV4, providerCount: number): string | null {
  if (!tool.pricing?.starting_price_cents) return null;

  const baseCents = tool.pricing.starting_price_cents;
  const model = tool.pricing.model;

  if (model === "per-provider-month" || model === "per-provider-year") {
    const monthlyCents = model === "per-provider-year" ? baseCents / 12 : baseCents;
    const totalCents = monthlyCents * providerCount;
    return `~$${Math.round(totalCents / 100)}/mo for ${providerCount} providers`;
  }

  if (model === "flat-monthly" || model === "flat-annual") {
    return tool.pricing.starting_price_display || null;
  }

  return null;
}

export default async function ForGroupPracticePage() {
  const allTools = await ClinicianToolService.loadClinicianTools();
  const groupTools = filterGroupTools(allTools);

  // Group tools by category for top picks
  const toolsByCategory = CATEGORY_CONFIGS.map((config) => {
    const categoryTools = groupTools.filter(
      (tool) =>
        tool.primary_category === config.key ||
        tool.secondary_categories.includes(config.key as any)
    );
    return {
      ...config,
      tools: sortGroupTools(categoryTools).slice(0, 4),
    };
  });

  // Get top recommended tools across all categories (for pricing comparison)
  const topRecommended = sortGroupTools(groupTools)
    .filter((t) => t.pricing?.starting_price_display)
    .slice(0, 10);

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
          name: "For Group Practice",
          item: `${siteConfig.url}/tools/for-group-practice/`,
        },
      ],
    },
    // CollectionPage
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Best Software for Group Practice",
      description: "Find the best EHR, billing, AI scribe, and practice management software for group therapy practices.",
      url: `${siteConfig.url}/tools/for-group-practice/`,
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
      mainEntity: {
        "@type": "ItemList",
        name: "Top Software for Group Practices",
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
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-treatment/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">For Group Practice</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-accent/10 text-accent border-accent/20">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  Software for Group Practice
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {groupTools.length} tools designed for multi-provider teams
                </p>
              </div>
            </div>

            <p className="mt-4 text-lg text-label-secondary max-w-3xl">
              Group practices need more than solo tools scaled up. Find software with true
              multi-provider support: role-based permissions, centralized billing, team scheduling,
              and practice-wide analytics. Compare pricing that makes sense for 2-50+ providers.
            </p>

            {/* Key value props */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-separator bg-canvas p-4">
                <Settings className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <p className="font-medium text-label-primary">Multi-Provider</p>
                  <p className="text-xs text-label-secondary">Permissions & scheduling</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-separator bg-canvas p-4">
                <BarChart3 className="h-5 w-5 text-treatment shrink-0" />
                <div>
                  <p className="font-medium text-label-primary">Practice Analytics</p>
                  <p className="text-xs text-label-secondary">Team productivity tracking</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-separator bg-canvas p-4">
                <TrendingUp className="h-5 w-5 text-positive-600 shrink-0" />
                <div>
                  <p className="font-medium text-label-primary">Scalable Pricing</p>
                  <p className="text-xs text-label-secondary">Volume discounts available</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Best For Groups callout */}
        <section className="border-b border-separator bg-accent/5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-semibold text-label-primary">Best for Group Practices</p>
                  <p className="text-sm text-label-secondary">
                    Tools with multi-provider support, team features, and scalable pricing
                  </p>
                </div>
              </div>
              <Link
                href="/architect"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
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
                  <Icon className="h-5 w-5 text-accent" />
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
                      className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80"
                    >
                      View all {category.displayName.toLowerCase()}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-label-tertiary">
                    No tools currently available in this category for group practices.
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
              <DollarSign className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-semibold text-label-primary">
                Pricing for Group Practices
              </h2>
            </div>
            <p className="text-sm text-label-secondary mb-6">
              Per-provider vs flat-rate pricing - understand total costs before committing
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="border-b border-separator">
                    <th className="px-4 py-3 text-left text-sm font-medium text-label-secondary">
                      Tool
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-label-secondary">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-label-secondary">
                      Per-Provider Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-label-secondary">
                      Est. 5 Providers
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
                          className="font-medium text-label-primary hover:text-accent"
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
                        {calculateGroupCost(tool, 5) || "-"}
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

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                <strong>Volume Discounts:</strong> Most vendors offer discounts for 5+ providers.
                Contact sales directly to negotiate better per-seat pricing for your group size.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/tools/pricing/"
                className="inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-secondary hover:border-accent/30 hover:text-accent transition-colors"
              >
                Full Pricing Comparisons
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tools/pricing/mental-health-ehr/"
                className="inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-secondary hover:border-accent/30 hover:text-accent transition-colors"
              >
                EHR Pricing Guide
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Considerations for Group Practice */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              What Group Practices Should Look For
            </h2>

            <div className="space-y-4">
              {[
                {
                  title: "Role-Based Permissions",
                  description:
                    "Ensure clinicians only see their patients, while admins have practice-wide access. Look for customizable permission levels for different roles (admin, clinician, billing staff).",
                },
                {
                  title: "Scalable Per-Provider Pricing",
                  description:
                    "Watch for pricing that stays reasonable as you grow. A $50/provider EHR costs $500/month for 10 providers. Negotiate volume discounts in writing before signing.",
                },
                {
                  title: "Multi-Provider Scheduling",
                  description:
                    "Group scheduling needs are different: shared calendars, provider assignment, resource booking, and the ability to reassign patients between clinicians.",
                },
                {
                  title: "Practice-Wide Analytics",
                  description:
                    "Track productivity across providers, revenue by clinician, no-show rates, and utilization metrics. Essential for managing a growing practice.",
                },
                {
                  title: "Team Onboarding Support",
                  description:
                    "New clinicians need quick onboarding. Look for training resources, template sharing, and responsive support that scales with your team size.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-separator bg-surface p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
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
                href="/tools/for-solo-practice/"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                Software for Solo Practice
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tools/for-practices/"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                Browse by Practice Type
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tools/stacks/group-practice/"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                Group Practice Stack Guide
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tools/for-clinicians/"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
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
              Building or scaling your group practice?
            </h2>
            <p className="mt-2 text-label-secondary">
              Practice Architect helps you design the right tech stack for your team size, budget, and growth plans.
            </p>
            <Link
              href="/architect/"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
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

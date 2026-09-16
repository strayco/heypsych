/**
 * AI Documentation & Scribe Tools Comparison Page
 *
 * Category landing page for AI documentation tools targeting
 * "AI scribe software", "therapy documentation tools" queries.
 *
 * URL: /tools/ai-documentation
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Mic,
  Check,
  X,
  ExternalLink,
  Clock,
  Shield,
  Users,
  Building2,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import type { ClinicianToolV4 } from "@/lib/schemas/clinician-tool-v4";

const PAGE_CONFIG = {
  title: "AI Documentation & Scribe Software for Mental Health (2026)",
  headline: "Best AI Documentation & Scribe Tools for Therapists & Psychiatrists",
  description:
    "Compare AI documentation and scribe tools built for mental health clinicians. Find the best AI scribe for therapy notes, psychiatric documentation, and clinical workflows.",
  seoTitle: "AI Documentation Software for Mental Health Professionals (2026) | Compare Tools",
  seoDescription:
    "Compare AI scribe and documentation tools for therapists and psychiatrists. Freed, Mentalyc, Upheal, and more. See pricing, features, and find the best fit for your practice.",
  schemaCategory: "ai-scribe-documentation",
  keywords: [
    "AI scribe for therapists",
    "AI documentation software mental health",
    "therapy note AI",
    "psychiatric documentation tools",
    "Freed AI",
    "Mentalyc",
    "Upheal",
    "clinical documentation AI",
  ],
};

// Helper to format price display
function formatPrice(pricing: ClinicianToolV4["pricing"]): string {
  if (!pricing) return "Contact for pricing";
  if (pricing.starting_price_cents === 0 && pricing.free_tier) {
    return "Free tier available";
  }
  if (pricing.starting_price_display) {
    return pricing.starting_price_display;
  }
  if (pricing.starting_price_cents) {
    return `From $${(pricing.starting_price_cents / 100).toFixed(0)}/mo`;
  }
  if (pricing.quote_required) {
    return "Contact for quote";
  }
  return "Contact for pricing";
}

// Categorize tools by best fit
function categorizeTool(tool: ClinicianToolV4): string[] {
  const fits: string[] = [];
  const sizes = tool.audiences?.organization_sizes || [];
  const features = tool.feature_flags;
  const pricing = tool.pricing;

  if (sizes.includes("solo") || pricing?.price_range === "budget") {
    fits.push("solo");
  }
  if (sizes.includes("small-2-10") || sizes.includes("medium-11-50")) {
    fits.push("group");
  }
  if (sizes.includes("large-51-200") || sizes.includes("enterprise-200-plus")) {
    fits.push("enterprise");
  }
  if (features?.has_ehr) {
    fits.push("ehr-integrated");
  }

  return fits.length > 0 ? fits : ["general"];
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: PAGE_CONFIG.seoTitle,
    description: PAGE_CONFIG.seoDescription,
    keywords: PAGE_CONFIG.keywords,
    alternates: {
      canonical: `${siteConfig.url}/tools/ai-documentation/`,
    },
    openGraph: {
      title: PAGE_CONFIG.seoTitle,
      description: PAGE_CONFIG.seoDescription,
      url: `${siteConfig.url}/tools/ai-documentation/`,
      type: "website",
    },
  };
}

export default async function AIDocumentationPage() {
  // Load tools from the ai-scribe-documentation category
  const allTools = await ClinicianToolService.loadClinicianTools();
  const categoryTools = allTools
    .filter((t) => t.primary_category === PAGE_CONFIG.schemaCategory)
    .filter((t) => t.pricing || t.short_description) // Ensure quality
    .slice(0, 20);

  // Categorize tools by best fit
  const soloTools = categoryTools.filter((t) =>
    categorizeTool(t).includes("solo")
  );
  const groupTools = categoryTools.filter((t) =>
    categorizeTool(t).includes("group")
  );
  const enterpriseTools = categoryTools.filter((t) =>
    categorizeTool(t).includes("enterprise")
  );
  const ehrIntegratedTools = categoryTools.filter((t) =>
    categorizeTool(t).includes("ehr-integrated")
  );

  // Structured data - BreadcrumbList for SERP breadcrumbs
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Tools", item: `${siteConfig.url}/tools` },
      { "@type": "ListItem", position: 2, name: "For Clinicians", item: `${siteConfig.url}/tools/for-clinicians` },
      { "@type": "ListItem", position: 3, name: "AI Documentation" },
    ],
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: PAGE_CONFIG.title,
    description: PAGE_CONFIG.description,
    numberOfItems: categoryTools.length,
    itemListElement: categoryTools.map((tool, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.short_description,
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        offers: tool.pricing
          ? {
              "@type": "Offer",
              price: tool.pricing.starting_price_cents
                ? tool.pricing.starting_price_cents / 100
                : 0,
              priceCurrency: "USD",
            }
          : undefined,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-canvas">
        {/* Hero */}
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
                AI Documentation
              </span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-treatment/10 text-treatment border-treatment/20">
                <Mic className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                {PAGE_CONFIG.headline}
              </h1>
            </div>

            <p className="mt-4 text-lg text-label-secondary max-w-3xl">
              {PAGE_CONFIG.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                <Clock className="h-4 w-4" />
                Save 5+ hours/week on documentation
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-treatment/10 px-3 py-1 text-sm font-medium text-treatment">
                <Shield className="h-4 w-4" />
                HIPAA-compliant options available
              </span>
            </div>
          </div>
        </section>

        {/* Pricing Comparison Table */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Pricing Comparison
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-separator">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-label-primary">
                      Tool
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-label-primary">
                      Starting Price
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-label-primary hidden sm:table-cell">
                      Free Trial
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-label-primary hidden md:table-cell">
                      HIPAA
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-label-primary hidden lg:table-cell">
                      Best For
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-label-primary">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTools.map((tool, idx) => (
                    <tr
                      key={tool.slug}
                      className={`border-b border-separator ${idx % 2 === 0 ? "bg-canvas" : "bg-surface"}`}
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-label-primary">
                          {tool.name}
                        </div>
                        <div className="text-xs text-label-tertiary mt-0.5 max-w-xs truncate">
                          {tool.one_liner || tool.short_description}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-treatment">
                          {formatPrice(tool.pricing)}
                        </span>
                      </td>
                      <td className="py-4 px-4 hidden sm:table-cell">
                        {tool.pricing?.free_trial_days ? (
                          <span className="inline-flex items-center gap-1 text-success text-sm">
                            <Check className="h-4 w-4" />
                            {tool.pricing.free_trial_days} days
                          </span>
                        ) : tool.pricing?.free_tier ? (
                          <span className="text-success text-sm">Free tier</span>
                        ) : (
                          <span className="text-label-tertiary text-sm">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        {tool.compliance?.hipaa_support === "yes" ? (
                          <span className="inline-flex items-center gap-1 text-success text-sm">
                            <Check className="h-4 w-4" />
                            Yes
                          </span>
                        ) : tool.compliance?.hipaa_support === "no" ? (
                          <span className="inline-flex items-center gap-1 text-error text-sm">
                            <X className="h-4 w-4" />
                            No
                          </span>
                        ) : (
                          <span className="text-label-tertiary text-sm">
                            Verify
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {categorizeTool(tool)
                            .slice(0, 2)
                            .map((fit) => (
                              <span
                                key={fit}
                                className="text-xs px-2 py-0.5 bg-surface-secondary rounded capitalize"
                              >
                                {fit.replace("-", " ")}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`}
                          className="inline-flex items-center gap-1 text-sm text-treatment hover:underline"
                        >
                          View
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Best For Sections */}
        <section className="border-t border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-8">
              Best AI Scribe by Practice Type
            </h2>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Solo Practice */}
              <div className="rounded-xl border border-separator bg-canvas p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-treatment/10">
                    <Users className="h-5 w-5 text-treatment" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-label-primary">
                      Best for Solo Practitioners
                    </h3>
                    <p className="text-sm text-label-tertiary">
                      Affordable, easy to use
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {soloTools.slice(0, 3).map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`}
                      className="flex items-center justify-between p-3 rounded-lg border border-separator hover:border-treatment/30 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-label-primary text-sm">
                          {tool.name}
                        </div>
                        <div className="text-xs text-label-tertiary">
                          {formatPrice(tool.pricing)}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-label-tertiary" />
                    </Link>
                  ))}
                  {soloTools.length === 0 && (
                    <p className="text-sm text-label-tertiary">
                      Browse all tools below
                    </p>
                  )}
                </div>
              </div>

              {/* Group Practice */}
              <div className="rounded-xl border border-separator bg-canvas p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Building2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-label-primary">
                      Best for Group Practices
                    </h3>
                    <p className="text-sm text-label-tertiary">
                      Multi-provider features
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {groupTools.slice(0, 3).map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`}
                      className="flex items-center justify-between p-3 rounded-lg border border-separator hover:border-accent/30 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-label-primary text-sm">
                          {tool.name}
                        </div>
                        <div className="text-xs text-label-tertiary">
                          {formatPrice(tool.pricing)}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-label-tertiary" />
                    </Link>
                  ))}
                  {groupTools.length === 0 && (
                    <p className="text-sm text-label-tertiary">
                      Browse all tools below
                    </p>
                  )}
                </div>
              </div>

              {/* EHR Integrated */}
              <div className="rounded-xl border border-separator bg-canvas p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <Briefcase className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-label-primary">
                      Best with EHR Integration
                    </h3>
                    <p className="text-sm text-label-tertiary">
                      Works with your current system
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {ehrIntegratedTools.slice(0, 3).map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`}
                      className="flex items-center justify-between p-3 rounded-lg border border-separator hover:border-success/30 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-label-primary text-sm">
                          {tool.name}
                        </div>
                        <div className="text-xs text-label-tertiary">
                          {formatPrice(tool.pricing)}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-label-tertiary" />
                    </Link>
                  ))}
                  {ehrIntegratedTools.length === 0 && (
                    <p className="text-sm text-label-tertiary">
                      Browse all tools below
                    </p>
                  )}
                </div>
              </div>

              {/* Enterprise */}
              <div className="rounded-xl border border-separator bg-canvas p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                    <DollarSign className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-label-primary">
                      Best for Enterprise
                    </h3>
                    <p className="text-sm text-label-tertiary">
                      Advanced features, custom pricing
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {enterpriseTools.slice(0, 3).map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`}
                      className="flex items-center justify-between p-3 rounded-lg border border-separator hover:border-warning/30 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-label-primary text-sm">
                          {tool.name}
                        </div>
                        <div className="text-xs text-label-tertiary">
                          {formatPrice(tool.pricing)}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-label-tertiary" />
                    </Link>
                  ))}
                  {enterpriseTools.length === 0 && (
                    <p className="text-sm text-label-tertiary">
                      Browse all tools below
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="border-t border-separator bg-canvas px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-lg font-semibold text-label-primary mb-6">
              Related Comparisons & Resources
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/tools/for-clinicians/ai-scribe-documentation/"
                className="flex items-center gap-3 p-4 rounded-xl border border-separator bg-surface hover:border-treatment/30 transition-colors"
              >
                <Mic className="h-5 w-5 text-treatment" />
                <div>
                  <div className="font-medium text-label-primary text-sm">
                    All AI Scribe Tools
                  </div>
                  <div className="text-xs text-label-tertiary">
                    Full category listing
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-label-tertiary ml-auto" />
              </Link>

              <Link
                href="/tools/pricing/ai-scribe/"
                className="flex items-center gap-3 p-4 rounded-xl border border-separator bg-surface hover:border-treatment/30 transition-colors"
              >
                <DollarSign className="h-5 w-5 text-treatment" />
                <div>
                  <div className="font-medium text-label-primary text-sm">
                    AI Scribe Pricing Guide
                  </div>
                  <div className="text-xs text-label-tertiary">
                    Detailed cost breakdown
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-label-tertiary ml-auto" />
              </Link>

              <Link
                href="/tools/for-clinicians/ehr-practice-management/"
                className="flex items-center gap-3 p-4 rounded-xl border border-separator bg-surface hover:border-treatment/30 transition-colors"
              >
                <Briefcase className="h-5 w-5 text-treatment" />
                <div>
                  <div className="font-medium text-label-primary text-sm">
                    EHR & Practice Management
                  </div>
                  <div className="text-xs text-label-tertiary">
                    Complete EHR comparison
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-label-tertiary ml-auto" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-separator bg-surface px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-semibold text-label-primary">
              Need help choosing?
            </h2>
            <p className="mt-2 text-label-secondary">
              Compare features side-by-side or browse alternatives to popular
              tools.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/tools/compare/"
                className="inline-flex items-center gap-2 rounded-lg bg-treatment px-6 py-3 text-sm font-medium text-white hover:bg-treatment/90 transition-colors"
              >
                Compare Tools
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tools/alternatives/"
                className="inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-6 py-3 text-sm font-medium text-label-primary hover:bg-surface-secondary transition-colors"
              >
                Browse Alternatives
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600;

// src/app/tools/for-clinicians/[category]/[slug]/page.tsx
// Product detail page for V4 clinician tools
// P0: This route was missing - all tool cards linked to 404

import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Shield,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Building2,
  Globe,
  Calendar,
  Users,
  Laptop,
  Bot,
  Video,
  Receipt,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import {
  ClinicianToolService,
  isToolPublishable,
  type ClinicianToolV4,
} from "@/lib/tools/clinician-tool-service";
import {
  isComplianceConfirmedYes,
} from "@/lib/schemas/tool-editorial";
import {
  SCHEMA_TO_TAXONOMY_CATEGORY,
  getRoleLabel,
  getSettingLabel,
} from "@/lib/schemas/clinician-tool-v4";
import clinicianCategoriesData from "../../../../../../data/tools-v4/taxonomies/clinician-categories.json";
import { ProductDemoCTA } from "@/components/tools/clinician/ProductDemoCTA";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

// Get category metadata
function getCategoryBySlug(slug: string) {
  return clinicianCategoriesData.categories.find((cat) => cat.slug === slug);
}

// Generate static params for all publishable tools
// Uses taxonomy slugs (e.g., "billing-rcm") not schema slugs (e.g., "billing-rcm-insurance")
export async function generateStaticParams() {
  const tools = await ClinicianToolService.loadClinicianTools();
  return tools.map((tool) => ({
    category: SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category,
    slug: tool.slug,
  }));
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool || !isToolPublishable(tool)) {
    return {
      title: "Tool Not Found",
      robots: { index: false, follow: false },
    };
  }

  // Use taxonomy slug for canonical URL
  const canonicalCategorySlug = SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category;
  const category = getCategoryBySlug(canonicalCategorySlug);
  // Slashless canonical for consistency with sitemap
  const canonicalUrl = `${siteConfig.url}/tools/for-clinicians/${canonicalCategorySlug}/${slug}`;

  return {
    title: `${tool.name} - ${category?.display_name || "Clinician Tool"}`,
    description: tool.short_description || tool.one_liner || `${tool.name} for mental health clinicians.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: tool.name,
      description: tool.short_description || tool.one_liner,
      url: canonicalUrl,
      type: "website",
    },
    // Only index publishable tools with sufficient content
    robots: tool.short_description && tool.short_description.length > 50
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { category: categorySlug, slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  // 404 if tool doesn't exist or isn't publishable
  if (!tool || !isToolPublishable(tool)) {
    notFound();
  }

  // Get canonical taxonomy slug for this tool's category
  const canonicalCategorySlug = SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category;

  // CANONICAL URL ENFORCEMENT: Redirect to taxonomy category if accessed via schema slug or secondary category
  // This prevents duplicate content from /billing-rcm-insurance/tool (schema) and /billing-rcm/tool (taxonomy)
  if (categorySlug !== canonicalCategorySlug) {
    redirect(`/tools/for-clinicians/${canonicalCategorySlug}/${slug}/`);
  }

  const category = getCategoryBySlug(canonicalCategorySlug);
  const relatedTools = await ClinicianToolService.getRelated(slug, 4);

  // Generate structured data
  const structuredData = generateProductStructuredData(tool, category);

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-canvas">
        {/* Header */}
        <section className="bg-surface border-b border-separator">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link
                href="/tools/"
                className="text-label-secondary hover:text-treatment transition-colors"
              >
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link
                href="/tools/for-clinicians/"
                className="text-label-secondary hover:text-treatment transition-colors"
              >
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link
                href={`/tools/for-clinicians/${categorySlug}/`}
                className="text-label-secondary hover:text-treatment transition-colors"
              >
                {category?.short_name || category?.display_name || categorySlug}
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium truncate max-w-[200px]">
                {tool.name}
              </span>
            </nav>

            {/* Tool Header */}
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-treatment/10">
                <ToolIcon tool={tool} className="h-8 w-8 text-treatment" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
                  {tool.name}
                </h1>

                {tool.company_name && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-label-secondary">
                    <Building2 className="h-4 w-4" />
                    {tool.company_name}
                  </p>
                )}

                {/* One-liner */}
                {tool.one_liner && (
                  <p className="mt-3 text-lg text-label-secondary">
                    {tool.one_liner}
                  </p>
                )}

                {/* Action buttons */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {tool.website_url && (
                    <a
                      href={tool.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-treatment px-4 py-2 text-sm font-medium text-white hover:bg-treatment-600 transition-colors"
                    >
                      Visit Website
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {tool.pricing_url && (
                    <a
                      href={tool.pricing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-separator bg-surface px-4 py-2 text-sm font-medium text-label-primary hover:bg-canvas transition-colors"
                    >
                      View Pricing
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {tool.short_description && (
                <div>
                  <h2 className="text-lg font-semibold text-label-primary mb-3">
                    About {tool.name}
                  </h2>
                  <p className="text-label-secondary leading-relaxed">
                    {tool.long_description || tool.short_description}
                  </p>
                </div>
              )}

              {/* Best For / Not For */}
              {((tool.best_for?.length ?? 0) > 0 || (tool.not_for?.length ?? 0) > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(tool.best_for?.length ?? 0) > 0 && (
                    <div className="rounded-xl border border-positive/20 bg-positive/5 p-4">
                      <h3 className="flex items-center gap-2 font-medium text-positive-700 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        Best For
                      </h3>
                      <ul className="space-y-1 text-sm text-label-secondary">
                        {tool.best_for?.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(tool.not_for?.length ?? 0) > 0 && (
                    <div className="rounded-xl border border-caution/20 bg-caution/5 p-4">
                      <h3 className="flex items-center gap-2 font-medium text-caution-700 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        Not Ideal For
                      </h3>
                      <ul className="space-y-1 text-sm text-label-secondary">
                        {tool.not_for?.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Integrations */}
              {tool.integrations?.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-label-primary mb-3">
                    Integrations
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {tool.integrations.map((integration, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-canvas border border-separator px-3 py-1.5 text-sm text-label-secondary"
                      >
                        {integration.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <div className="rounded-xl border border-separator bg-surface p-4">
                <h3 className="font-semibold text-label-primary mb-3">Pricing</h3>
                {tool.pricing?.starting_price_display ? (
                  <p className="text-2xl font-bold text-treatment">
                    {tool.pricing.starting_price_display}
                  </p>
                ) : tool.pricing?.quote_required ? (
                  <p className="text-label-secondary">Contact for pricing</p>
                ) : (
                  <p className="text-label-tertiary">Pricing not available</p>
                )}
                {tool.pricing?.free_tier && (
                  <p className="mt-2 text-sm text-positive-700 font-medium">
                    Free tier available
                  </p>
                )}
                {(tool.pricing?.free_trial_days ?? 0) > 0 && (
                  <p className="mt-1 text-sm text-label-secondary">
                    {tool.pricing?.free_trial_days}-day free trial
                  </p>
                )}
              </div>

              {/* Compliance Card */}
              <div className="rounded-xl border border-separator bg-surface p-4">
                <h3 className="font-semibold text-label-primary mb-3">
                  Compliance & Security
                </h3>
                <div className="space-y-3">
                  <ComplianceRow
                    label="HIPAA"
                    value={tool.compliance?.hipaa_support}
                  />
                  <ComplianceRow
                    label="BAA Available"
                    value={tool.compliance?.baa_available}
                  />
                  <ComplianceRow
                    label="SOC 2"
                    value={tool.compliance?.soc2}
                  />
                  <ComplianceRow
                    label="HITRUST"
                    value={tool.compliance?.hitrust}
                  />
                </div>
                <p className="mt-4 text-xs text-label-tertiary">
                  Always verify compliance directly with the vendor.
                </p>
              </div>

              {/* Target Audience */}
              {(tool.audiences?.clinician_roles?.length > 0 ||
                tool.audiences?.practice_settings?.length > 0) && (
                <div className="rounded-xl border border-separator bg-surface p-4">
                  <h3 className="font-semibold text-label-primary mb-3">
                    Target Audience
                  </h3>
                  {tool.audiences.clinician_roles?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-label-tertiary uppercase tracking-wide mb-1">
                        Roles
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {tool.audiences.clinician_roles.map((role) => (
                          <span
                            key={role}
                            className="rounded bg-treatment/10 px-2 py-0.5 text-xs text-treatment-700"
                          >
                            {getRoleLabel(role)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {tool.audiences.practice_settings?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-label-tertiary uppercase tracking-wide mb-1">
                        Settings
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {tool.audiences.practice_settings.map((setting) => (
                          <span
                            key={setting}
                            className="rounded bg-canvas px-2 py-0.5 text-xs text-label-secondary"
                          >
                            {getSettingLabel(setting)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CTA: Affiliate Link > Website > Demo Request */}
              <ProductDemoCTA
                toolSlug={tool.slug}
                toolName={tool.name}
                affiliateUrl={tool.affiliate_url}
                websiteUrl={tool.website_url}
              />
            </div>
          </div>
        </section>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <section className="border-t border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-lg font-semibold text-label-primary mb-4">
                Related Tools
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {relatedTools.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[related.primary_category] || related.primary_category}/${related.slug}/`}
                    className="rounded-xl border border-separator bg-canvas p-4 hover:border-treatment/30 transition-colors"
                  >
                    <h3 className="font-medium text-label-primary truncate">
                      {related.name}
                    </h3>
                    <p className="mt-1 text-xs text-label-tertiary truncate">
                      {related.one_liner || related.short_description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Back Link */}
        <section className="bg-canvas px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Link
              href={`/tools/for-clinicians/${categorySlug}/`}
              className="group inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to {category?.display_name || "category"}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

// Helper Components

function ToolIcon({ tool, className }: { tool: ClinicianToolV4; className?: string }) {
  if (tool.feature_flags?.has_ai) {
    return <Bot className={className} />;
  }
  if (tool.feature_flags?.has_telehealth) {
    return <Video className={className} />;
  }
  if (tool.feature_flags?.has_rcm) {
    return <Receipt className={className} />;
  }
  return <Laptop className={className} />;
}

/**
 * Display a compliance/certification field with proper uncertainty handling
 * Handles various value types: boolean, "yes"/"no"/"unknown", "type1"/"type2", etc.
 */
function ComplianceRow({
  label,
  value,
}: {
  label: string;
  value: boolean | string | undefined;
}) {
  // Normalize to determine display state
  const normalizedValue = normalizeComplianceValue(value);
  const isYes = normalizedValue === "yes";
  const isUnknown = normalizedValue === "unknown" || value === undefined;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-label-secondary">{label}</span>
      <span
        className={cn(
          "flex items-center gap-1 text-sm font-medium",
          isYes && "text-positive-700",
          !isYes && !isUnknown && "text-label-tertiary",
          isUnknown && "text-label-quaternary"
        )}
      >
        {isYes ? (
          <>
            <Shield className="h-3.5 w-3.5" />
            Yes
          </>
        ) : isUnknown ? (
          <>
            <HelpCircle className="h-3.5 w-3.5" />
            Unknown
          </>
        ) : (
          // For special values like "type1", "type2", display them
          typeof value === "string" && value !== "no" ? value.toUpperCase() : "No"
        )}
      </span>
    </div>
  );
}

/**
 * Normalize various compliance value formats to a standard form
 */
function normalizeComplianceValue(value: boolean | string | undefined): "yes" | "no" | "unknown" {
  if (value === undefined) return "unknown";
  if (typeof value === "boolean") return value ? "yes" : "no";
  // String values
  if (typeof value === "string") {
    if (value === "yes") return "yes";
    if (value === "no") return "no";
    if (value === "unknown" || value === "not_applicable") return "unknown";
    // SOC2 "type1" or "type2" means yes
    if (value === "type1" || value === "type2") return "yes";
  }
  return "unknown";
}

// Structured Data
function generateProductStructuredData(
  tool: ClinicianToolV4,
  category: typeof clinicianCategoriesData.categories[0] | undefined
) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.short_description || tool.one_liner,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: category?.display_name || "Healthcare Software",
    operatingSystem: "Web",
    url: tool.website_url,
    // Only include offers if we have real pricing data
    ...(tool.pricing?.starting_price_display && {
      offers: {
        "@type": "Offer",
        price: tool.pricing.starting_price_cents
          ? (tool.pricing.starting_price_cents / 100).toFixed(2)
          : undefined,
        priceCurrency: "USD",
        description: tool.pricing.starting_price_display,
      },
    }),
    // Do NOT include aggregateRating - we have no ratings
  };
}

export const revalidate = 3600; // 1 hour

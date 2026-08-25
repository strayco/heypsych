/**
 * Product Integrations Detail Page
 *
 * Shows all integrations for a specific product.
 * High-value SEO target: "[Product] integrations"
 *
 * URL: /tools/integrations/[product-slug]
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Cable,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService, type ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { IntegrationArchitectCTA } from "@/components/architect/ContextualArchitectCTA";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for published products
export async function generateStaticParams() {
  const tools = await ClinicianToolService.loadClinicianTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool) {
    return { title: "Product Not Found" };
  }

  const integrationCount = tool.integrations?.length || 0;
  const title = `${tool.name} Integrations | ${integrationCount}+ Connections`;
  const description = `See all ${tool.name} integrations. Connect with EHRs, billing tools, AI scribes, and more. Check compatibility before you buy.`;

  // Quality gate: noindex pages with insufficient integration data
  const hasSubstantiveContent = integrationCount >= 2;

  return {
    title,
    description,
    keywords: [
      `${tool.name} integrations`,
      `${tool.name} API`,
      `${tool.name} connections`,
      `what integrates with ${tool.name}`,
      `${tool.name} compatibility`,
    ],
    alternates: {
      canonical: `${siteConfig.url}/tools/integrations/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/tools/integrations/${slug}`,
      type: "website",
    },
    // Noindex thin content pages
    robots: hasSubstantiveContent ? undefined : { index: false, follow: true },
  };
}

// Categorize integrations
function categorizeIntegrations(tool: ClinicianToolV4, allTools: ClinicianToolV4[]) {
  const integrations = tool.integrations || [];
  const toolLookup = new Map(allTools.map(t => [t.slug, t]));

  const categorized: Record<string, Array<{
    name: string;
    slug?: string;
    verified: boolean;
    type?: string;
    inDatabase: boolean;
  }>> = {
    ehr: [],
    billing: [],
    telehealth: [],
    ai: [],
    calendar: [],
    other: [],
  };

  for (const integration of integrations) {
    const matchedTool = integration.slug ? toolLookup.get(integration.slug) : null;
    const inDatabase = !!matchedTool;

    let category: string = (integration.category as string) || "other";
    if (matchedTool) {
      if (matchedTool.primary_category.includes("ehr")) category = "ehr";
      else if (matchedTool.primary_category.includes("billing")) category = "billing";
      else if (matchedTool.primary_category.includes("telehealth")) category = "telehealth";
      else if (matchedTool.primary_category.includes("ai")) category = "ai";
    }

    if (!categorized[category]) {
      categorized[category] = [];
    }

    categorized[category].push({
      name: integration.name,
      slug: integration.slug,
      verified: integration.verified || false,
      type: integration.integration_type,
      inDatabase,
    });
  }

  return categorized;
}

const CATEGORY_LABELS: Record<string, string> = {
  ehr: "EHR / Practice Management",
  billing: "Billing & RCM",
  telehealth: "Telehealth & Communication",
  ai: "AI & Documentation",
  calendar: "Calendar & Scheduling",
  lab: "Labs & Diagnostics",
  pharmacy: "Pharmacy & E-Prescribing",
  payer: "Insurance & Payers",
  other: "Other Integrations",
};

export default async function ProductIntegrationsPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool) {
    notFound();
  }

  const allTools = await ClinicianToolService.loadClinicianTools();
  const categorizedIntegrations = categorizeIntegrations(tool, allTools);
  const totalIntegrations = tool.integrations?.length || 0;
  const verifiedCount = tool.integrations?.filter(i => i.verified).length || 0;

  const relatedTools = allTools
    .filter(t => t.slug !== slug && t.primary_category !== tool.primary_category)
    .slice(0, 6);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: "HealthApplication",
    offers: tool.pricing?.starting_price_display ? {
      "@type": "Offer",
      price: tool.pricing.starting_price_display,
    } : undefined,
    softwareRequirements: tool.integrations?.map(i => i.name).join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-canvas">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-separator bg-surface">
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-accent/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <nav className="mb-6 flex items-center gap-2 text-sm flex-wrap">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/integrations/" className="text-label-secondary hover:text-treatment">
                Integrations
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">{tool.name}</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              {tool.logo_url ? (
                <img
                  src={tool.logo_url}
                  alt={`${tool.name} logo`}
                  className="h-14 w-14 rounded-2xl border border-separator object-contain bg-white"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-treatment/10 text-treatment border-treatment/20">
                  <Cable className="h-7 w-7" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  {tool.name} Integrations
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {totalIntegrations} integrations • {verifiedCount} verified
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                {tool.short_description || tool.one_liner || `${tool.name} connects with ${totalIntegrations}+ other tools.`}{" "}
                Check which products work with {tool.name} before building your practice stack.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-label-secondary">{verifiedCount} verified integrations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Cable className="h-4 w-4 text-treatment" />
                <span className="text-label-secondary">{totalIntegrations} total connections</span>
              </div>
              <Link
                href={`/tools/for-clinicians/${tool.primary_category}/${slug}/`}
                className="flex items-center gap-1 text-sm text-treatment hover:underline"
              >
                View full profile
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Integration Categories */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {Object.entries(categorizedIntegrations).map(([category, integrations]) => {
              if (integrations.length === 0) return null;

              return (
                <div key={category} className="mb-10 last:mb-0">
                  <h2 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-treatment" />
                    {CATEGORY_LABELS[category] || category}
                    <span className="text-sm font-normal text-label-tertiary">
                      ({integrations.length})
                    </span>
                  </h2>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {integrations.map((integration, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-separator bg-surface p-4 transition-all hover:border-treatment/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-canvas border border-separator">
                            <span className="text-sm font-semibold text-label-secondary">
                              {integration.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-label-primary text-sm">
                              {integration.name}
                            </p>
                            {integration.type && (
                              <p className="text-xs text-label-tertiary capitalize">
                                {integration.type.replace(/-/g, " ")}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {integration.verified ? (
                            <span className="flex items-center gap-1 text-xs text-success">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-label-quaternary">
                              <HelpCircle className="h-3.5 w-3.5" />
                            </span>
                          )}

                          {integration.inDatabase && integration.slug && (
                            <Link
                              href={`/tools/works-with/${slug}/${integration.slug}`}
                              className="text-xs text-treatment hover:underline flex items-center gap-0.5"
                            >
                              Details
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {totalIntegrations === 0 && (
              <div className="rounded-xl border border-separator bg-surface p-8 text-center">
                <XCircle className="h-12 w-12 text-label-quaternary mx-auto mb-4" />
                <p className="text-label-secondary">
                  We don't have integration data for {tool.name} yet.
                </p>
                <p className="text-sm text-label-tertiary mt-1">
                  Are you from {tool.company_name || tool.name}?{" "}
                  <Link href="/tools/claim" className="text-treatment hover:underline">
                    Claim this profile
                  </Link>{" "}
                  to add integration information.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Architect CTA */}
        <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <IntegrationArchitectCTA productSlugs={[slug]} />
          </div>
        </section>

        {/* Check Compatibility */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2">
              Check Compatibility
            </h2>
            <p className="text-sm text-label-secondary mb-6">
              See if {tool.name} works with these popular tools
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTools.map((relatedTool) => (
                <Link
                  key={relatedTool.slug}
                  href={`/tools/works-with/${slug}/${relatedTool.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-separator bg-surface p-4 transition-all hover:border-treatment/30 hover:shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-lg bg-treatment/10 border border-treatment/20 flex items-center justify-center text-xs font-medium text-treatment">
                        {tool.name.charAt(0)}
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                        {relatedTool.name.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-label-primary text-sm">
                        {tool.name} + {relatedTool.name}
                      </p>
                      <p className="text-xs text-label-tertiary">
                        Check compatibility
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-label-quaternary group-hover:text-treatment transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-6">
            <Link
              href={`/tools/for-clinicians/${tool.primary_category}/${slug}/`}
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              {tool.name} profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/tools/alternatives/${slug}`}
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              {tool.name} alternatives
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/tools/switch-from/${slug}`}
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              Switch from {tool.name}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/tools/integrations/"
              className="flex items-center gap-1 text-sm font-medium text-label-secondary hover:text-treatment"
            >
              All integrations
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600;

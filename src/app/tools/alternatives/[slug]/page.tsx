/**
 * Alternatives Page Template
 *
 * Comprehensive alternatives guide for switching from a specific product.
 * High buyer intent - user is actively looking for replacements.
 *
 * URL: /tools/alternatives/[product-slug]
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  RefreshCw,
  Star,
  DollarSign,
  Users,
  Zap,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService, type ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import { AlternativeArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import { ClinicianToolCard } from "@/components/tools/clinician";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params
export async function generateStaticParams() {
  const tools = await ClinicianToolService.loadClinicianTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool) {
    return { title: "Alternatives" };
  }

  // Check if there are enough alternatives to be useful
  const categoryTools = await ClinicianToolService.getByCategory(tool.primary_category);
  const alternativeCount = categoryTools.filter(t => t.slug !== slug).length;
  const hasSubstantiveContent = alternativeCount >= 3;

  const title = `${tool.name} Alternatives (2024) | Top ${tool.name} Competitors`;
  const description = `Looking for ${tool.name} alternatives? Compare the best ${tool.name} competitors for mental health practices. Find the right replacement based on your practice needs.`;

  return {
    title,
    description,
    keywords: [
      `${tool.name} alternatives`,
      `${tool.name} competitors`,
      `products like ${tool.name}`,
      `${tool.name} replacement`,
      `switch from ${tool.name}`,
      `better than ${tool.name}`,
    ],
    alternates: {
      canonical: `${siteConfig.url}/tools/alternatives/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/tools/alternatives/${slug}`,
      type: "website",
    },
    // Noindex pages with fewer than 3 alternatives (thin content)
    robots: hasSubstantiveContent ? undefined : { index: false, follow: true },
  };
}

// Get category display name
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    "ehr-practice-management": "EHR & Practice Management",
    "ai-scribe-documentation": "AI Scribe & Documentation",
    "billing-rcm": "Billing & RCM",
    "telehealth-communication": "Telehealth",
    "provider-networks": "Provider Networks",
    "measurement-dtx": "Measurement & DTx",
  };
  return labels[category] || category.replace(/-/g, " ");
}

// Score alternatives (simplified ranking)
function scoreAlternative(tool: ClinicianToolV4, originalTool: ClinicianToolV4): number {
  let score = 0;

  // Same category = highly relevant
  if (tool.primary_category === originalTool.primary_category) score += 50;

  // Featured products
  if (tool.featured) score += 20;

  // Has pricing info
  if (tool.pricing?.starting_price_cents) score += 10;

  // Data quality
  score += (tool.governance?.data_quality_score || 0) / 10;

  // Has capabilities overlap (rough estimate)
  const toolCaps = tool.capabilities || [];
  const origCaps = originalTool.capabilities || [];
  const overlap = toolCaps.filter(c => origCaps.includes(c)).length;
  score += overlap * 5;

  return score;
}

export default async function AlternativesPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool) {
    notFound();
  }

  // Get all tools in the same category
  const categoryTools = await ClinicianToolService.getByCategory(tool.primary_category);

  // Filter out the original tool and sort by relevance score
  const alternatives = categoryTools
    .filter((t) => t.slug !== slug)
    .map((t) => ({ tool: t, score: scoreAlternative(t, tool) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.tool);

  const topAlternatives = alternatives.slice(0, 3);
  const otherAlternatives = alternatives.slice(3, 9);

  const categoryLabel = getCategoryLabel(tool.primary_category);

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${tool.name} Alternatives`,
    description: `Top alternatives to ${tool.name} for mental health practices`,
    numberOfItems: alternatives.length,
    itemListElement: topAlternatives.map((alt, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "SoftwareApplication",
        name: alt.name,
        applicationCategory: "HealthApplication",
        url: `${siteConfig.url}/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[alt.primary_category] || alt.primary_category}/${alt.slug}/`,
      },
    })),
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
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm flex-wrap">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/for-clinicians/" className="text-label-secondary hover:text-treatment">
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Alternatives</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-treatment/10 text-treatment border-treatment/20">
                <RefreshCw className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  {tool.name} Alternatives
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {alternatives.length} alternatives in {categoryLabel}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                Looking for alternatives to {tool.name}? Here are the top {categoryLabel.toLowerCase()} options
                for mental health practices. Compare features, pricing, and find the best fit for your workflow.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/tools/switch-from/${slug}`}
                className="inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-primary hover:border-treatment/30 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Migration Guide
              </Link>
              <Link
                href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${slug}/`}
                className="inline-flex items-center gap-2 text-sm text-treatment hover:underline"
              >
                View {tool.name} profile
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Top Alternatives */}
        {topAlternatives.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-warning" />
                Top {tool.name} Alternatives
              </h2>
              <p className="text-sm text-label-secondary mb-6">
                Most popular alternatives based on features, reviews, and practice fit
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {topAlternatives.map((alt, idx) => (
                  <div
                    key={alt.slug}
                    className="relative rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-treatment/30 hover:shadow-soft"
                  >
                    <div className="absolute -top-3 left-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-treatment px-2.5 py-0.5 text-xs font-medium text-white">
                        #{idx + 1} Alternative
                      </span>
                    </div>

                    <div className="mt-2">
                      {alt.logo_url ? (
                        <img
                          src={alt.logo_url}
                          alt={alt.name}
                          className="h-12 w-12 rounded-xl border border-separator object-contain bg-white"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-treatment/10 border border-treatment/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-treatment">{alt.name.charAt(0)}</span>
                        </div>
                      )}

                      <h3 className="mt-4 text-lg font-semibold text-label-primary">
                        {alt.name}
                      </h3>

                      <p className="mt-2 text-sm text-label-secondary line-clamp-2">
                        {alt.short_description || alt.one_liner}
                      </p>

                      {alt.pricing?.starting_price_display && (
                        <p className="mt-3 text-sm">
                          <span className="text-label-tertiary">Starting at </span>
                          <span className="font-semibold text-label-primary">
                            {alt.pricing.starting_price_display}
                          </span>
                        </p>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[alt.primary_category] || alt.primary_category}/${alt.slug}/`}
                          className="flex-1 rounded-lg bg-treatment px-3 py-2 text-center text-sm font-medium text-white hover:bg-treatment-600 transition-colors"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/tools/compare?tools=${slug},${alt.slug}`}
                          className="rounded-lg border border-separator px-3 py-2 text-sm font-medium text-label-primary hover:border-treatment/30 transition-colors"
                        >
                          Compare
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Architect CTA */}
        <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <AlternativeArchitectCTA switchingFrom={slug} />
          </div>
        </section>

        {/* Other Alternatives */}
        {otherAlternatives.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary mb-6">
                More {tool.name} Alternatives
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherAlternatives.map((alt) => (
                  <ClinicianToolCard key={alt.slug} tool={alt} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why Switch Section */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Why Look for {tool.name} Alternatives?
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <DollarSign className="h-6 w-6 text-treatment mb-3" />
                <h3 className="font-semibold text-label-primary">Better Pricing</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Find a solution that better fits your budget, especially as your practice grows.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-5">
                <Zap className="h-6 w-6 text-treatment mb-3" />
                <h3 className="font-semibold text-label-primary">Different Features</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Discover alternatives with features {tool.name} doesn't offer.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-5">
                <Users className="h-6 w-6 text-treatment mb-3" />
                <h3 className="font-semibold text-label-primary">Better Fit</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Find software designed specifically for your practice type and workflow.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-5">
                <CheckCircle2 className="h-6 w-6 text-treatment mb-3" />
                <h3 className="font-semibold text-label-primary">Better Integration</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Find an alternative that integrates better with your existing tools.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-6">
            <Link
              href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${slug}/`}
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              {tool.name} profile
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
              href={`/tools/integrations/${slug}`}
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              {tool.name} integrations
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/`}
              className="flex items-center gap-1 text-sm font-medium text-label-secondary hover:text-treatment"
            >
              All {categoryLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600;

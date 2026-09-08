/**
 * Pricing Comparison Page
 *
 * Detailed pricing comparison for tools in a category.
 * Shows tiers, features, and cost breakdown.
 *
 * URL: /tools/pricing/[category]
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  DollarSign,
  Check,
  X,
  HelpCircle,
  ExternalLink,
  Info,
  AlertTriangle,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";

interface PageProps {
  params: Promise<{ category: string }>;
}

interface PricingConfig {
  name: string;
  headline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  schemaCategory: string;
  keyFeaturesToCompare: string[];
  pricingNotes: string[];
  keywords: string[];
}

// Pricing category configurations
const PRICING_CONFIGS: Record<string, PricingConfig> = {
  "mental-health-ehr": {
    name: "Mental Health EHR",
    headline: "Mental Health EHR Pricing Comparison (2026)",
    description: "Compare pricing across the top EHR and practice management platforms for mental health professionals. See monthly costs, included features, and hidden fees.",
    seoTitle: "Mental Health EHR Pricing Comparison (2026) | Complete Guide",
    seoDescription: "Compare mental health EHR pricing: SimplePractice, TherapyNotes, Jane, Valant, and more. See monthly costs, per-provider fees, and what's included.",
    schemaCategory: "ehr-practice-management",
    keyFeaturesToCompare: [
      "Telehealth included",
      "E-prescribing",
      "Insurance billing",
      "Client portal",
      "Mobile app",
      "Unlimited clients",
    ],
    pricingNotes: [
      "Most EHRs charge per-provider; verify pricing for your team size",
      "Payment processing fees (2.5-3.5%) are usually separate",
      "E-prescribing add-ons can add $20-50/month",
      "Annual billing typically saves 10-20%",
    ],
    keywords: [
      "mental health EHR pricing",
      "therapy EHR cost",
      "SimplePractice pricing",
      "TherapyNotes pricing",
    ],
  },
  "therapy-ehr": {
    name: "Therapy EHR",
    headline: "Therapy EHR Pricing Comparison (2026)",
    description: "Find the right EHR for your therapy practice budget. Compare pricing tiers, what's included, and the true monthly cost after fees.",
    seoTitle: "Therapy EHR Pricing Comparison (2026) | SimplePractice vs TherapyNotes vs Jane",
    seoDescription: "Compare therapy EHR pricing in 2026. SimplePractice, TherapyNotes, Jane App, and more. See real monthly costs and what's included at each tier.",
    schemaCategory: "ehr-practice-management",
    keyFeaturesToCompare: [
      "HIPAA-compliant video",
      "Online scheduling",
      "Insurance billing",
      "Client portal",
      "Document templates",
      "Mobile app",
    ],
    pricingNotes: [
      "Most popular for solo therapists: SimplePractice Essential ($49/mo) or TherapyNotes ($49/mo)",
      "Group practices should calculate per-provider costs carefully",
      "Free trials typically 30 days—test thoroughly before committing",
      "Switching EHRs is painful; choose carefully the first time",
    ],
    keywords: [
      "therapy EHR pricing",
      "best EHR for therapists cost",
      "SimplePractice vs TherapyNotes price",
    ],
  },
  "psychiatry-ehr": {
    name: "Psychiatry EHR",
    headline: "Psychiatry EHR Pricing Comparison (2026)",
    description: "Compare psychiatry-specific EHR pricing including e-prescribing and EPCS costs. Find platforms that fit psychiatric workflows and budgets.",
    seoTitle: "Psychiatry EHR Pricing Comparison (2026) | e-Prescribing & EPCS Costs",
    seoDescription: "Compare psychiatry EHR pricing with e-prescribing. Valant, SimplePractice, and medical EHR costs for psychiatrists. EPCS add-on pricing included.",
    schemaCategory: "ehr-practice-management",
    keyFeaturesToCompare: [
      "E-prescribing included",
      "EPCS (controlled substances)",
      "Medication tracking",
      "Lab integration",
      "Telehealth",
      "Insurance billing",
    ],
    pricingNotes: [
      "EPCS certification is often an add-on ($20-50/month)",
      "Psychiatry-specific EHRs (Valant) tend to cost more but have deeper features",
      "General EHRs with e-prescribing add-ons can work for simpler practices",
      "Verify EPCS is certified for your state before purchasing",
    ],
    keywords: [
      "psychiatry EHR pricing",
      "EHR with e-prescribing cost",
      "EPCS EHR pricing",
      "Valant pricing",
    ],
  },
  "ai-scribe": {
    name: "AI Scribe",
    headline: "AI Scribe Pricing for Mental Health Clinicians (2026)",
    description: "Compare AI scribe pricing models: per-session, monthly unlimited, and tiered plans. Find the most cost-effective option for your session volume.",
    seoTitle: "AI Scribe Pricing Comparison (2026) | Freed vs Mentalyc vs Upheal",
    seoDescription: "Compare AI scribe pricing for therapists and psychiatrists. Freed, Mentalyc, Upheal, and more. See per-session vs monthly costs and ROI analysis.",
    schemaCategory: "ai-scribe-documentation",
    keyFeaturesToCompare: [
      "Unlimited notes",
      "Therapy note formats",
      "Session analytics",
      "EHR integration",
      "Mobile app",
      "HIPAA/BAA",
    ],
    pricingNotes: [
      "Per-session pricing ($1/note) can be cheaper for <40 sessions/month",
      "Unlimited plans ($79-119/mo) are better for high-volume practitioners",
      "ROI is high: if you save 5+ hours/week, the math works at any price point",
      "Most offer 7-30 day free trials—test before committing",
    ],
    keywords: [
      "AI scribe pricing",
      "Freed AI cost",
      "Mentalyc pricing",
      "Upheal pricing",
      "therapy AI scribe cost",
    ],
  },
};

// Helper to format price display
function formatPrice(pricing: any): string {
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

// Generate static params
export function generateStaticParams() {
  return Object.keys(PRICING_CONFIGS).map((category) => ({ category }));
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const config = PRICING_CONFIGS[category];

  if (!config) {
    return { title: "Pricing Comparison" };
  }

  return {
    title: config.seoTitle,
    description: config.seoDescription,
    alternates: {
      canonical: `${siteConfig.url}/tools/pricing/${category}`,
    },
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      url: `${siteConfig.url}/tools/pricing/${category}`,
      type: "website",
    },
  };
}

export default async function PricingPage({ params }: PageProps) {
  const { category } = await params;
  const config = PRICING_CONFIGS[category];

  if (!config) {
    notFound();
  }

  // Get tools in this category
  const allTools = await ClinicianToolService.loadClinicianTools();
  const categoryTools = allTools
    .filter((t) => t.primary_category === config.schemaCategory)
    .filter((t) => t.pricing) // Only tools with pricing data
    .slice(0, 12);

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": config.seoTitle,
    "description": config.seoDescription,
    "url": `${siteConfig.url}/tools/pricing/${category}`,
    "mainEntity": {
      "@type": "ItemList",
      "name": `${config.name} Pricing Comparison`,
      "numberOfItems": categoryTools.length,
      "itemListElement": categoryTools.map((tool, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Product",
          "name": tool.name,
          "description": tool.short_description,
          "offers": tool.pricing ? {
            "@type": "Offer",
            "price": tool.pricing.starting_price_cents ? (tool.pricing.starting_price_cents / 100) : 0,
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
          } : undefined,
        },
      })),
    },
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
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/pricing/" className="text-label-secondary hover:text-treatment">
                Pricing
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">{config.name}</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-treatment/10 text-treatment border-treatment/20">
                <DollarSign className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                {config.headline}
              </h1>
            </div>

            <p className="mt-4 text-lg text-label-secondary max-w-3xl">
              {config.description}
            </p>

            <p className="mt-3 text-sm text-label-tertiary">
              Last updated: September 2026. Prices may change—verify with vendors before purchasing.
            </p>
          </div>
        </section>

        {/* Pricing Table */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Pricing Overview
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-separator">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-label-primary">
                      Product
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-label-primary">
                      Starting Price
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-label-primary hidden sm:table-cell">
                      Free Trial
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-label-primary hidden md:table-cell">
                      Pricing Model
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
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-label-primary">
                            {tool.name}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-treatment">
                          {formatPrice(tool.pricing)}
                        </span>
                      </td>
                      <td className="py-4 px-4 hidden sm:table-cell">
                        {tool.pricing?.free_trial_days ? (
                          <span className="text-success text-sm">
                            {tool.pricing.free_trial_days} days
                          </span>
                        ) : tool.pricing?.free_tier ? (
                          <span className="text-success text-sm">Free tier</span>
                        ) : (
                          <span className="text-label-tertiary text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <span className="text-sm text-label-secondary capitalize">
                          {tool.pricing?.model?.replace(/-/g, " ") || "Contact"}
                        </span>
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

        {/* Detailed Pricing Cards */}
        <section className="border-t border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Detailed Pricing Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categoryTools.slice(0, 6).map((tool) => (
                <div
                  key={tool.slug}
                  className="rounded-xl border border-separator bg-canvas p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-label-primary">{tool.name}</h3>
                    {tool.pricing_url && (
                      <a
                        href={tool.pricing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-treatment hover:underline flex items-center gap-1"
                      >
                        Official pricing
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg border border-separator bg-surface p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-label-primary text-sm">
                          Starting at
                        </span>
                        <span className="font-semibold text-treatment text-sm">
                          {formatPrice(tool.pricing)}
                        </span>
                      </div>
                      {tool.pricing?.model && (
                        <p className="text-xs text-label-tertiary mt-1 capitalize">
                          {tool.pricing.model.replace(/-/g, " ")}
                        </p>
                      )}
                    </div>
                    {tool.pricing?.free_trial_days && (
                      <div className="text-xs text-success">
                        ✓ {tool.pricing.free_trial_days}-day free trial
                      </div>
                    )}
                    {tool.pricing?.free_tier && (
                      <div className="text-xs text-success">
                        ✓ Free tier available
                      </div>
                    )}
                    {tool.pricing?.notes && (
                      <p className="text-xs text-label-tertiary">
                        {tool.pricing.notes}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`}
                    className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-treatment/30 bg-treatment/5 px-4 py-2 text-sm font-medium text-treatment hover:bg-treatment/10 transition-colors"
                  >
                    Full review
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Notes */}
        <section className="border-t border-separator bg-canvas px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6 flex items-center gap-2">
              <Info className="h-5 w-5 text-accent" />
              Pricing Notes & Tips
            </h2>

            <div className="space-y-3">
              {config.pricingNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-separator bg-surface p-4"
                >
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <p className="text-label-secondary">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison CTA */}
        <section className="border-t border-separator bg-surface px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-semibold text-label-primary">
              Need more than just pricing?
            </h2>
            <p className="mt-2 text-label-secondary">
              Compare features, integrations, and user reviews in our full category guide.
            </p>
            <Link
              href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[config.schemaCategory] || config.schemaCategory}/`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-treatment px-6 py-3 text-sm font-medium text-white hover:bg-treatment/90 transition-colors"
            >
              View full comparison
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Other Pricing Pages */}
        <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-sm font-medium text-label-tertiary uppercase tracking-wider mb-4">
              Other Pricing Comparisons
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(PRICING_CONFIGS)
                .filter(([slug]) => slug !== category)
                .map(([slug, pricingConfig]) => (
                  <Link
                    key={slug}
                    href={`/tools/pricing/${slug}/`}
                    className="flex items-center gap-1 text-sm text-treatment hover:underline"
                  >
                    {pricingConfig.name} Pricing
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

export const revalidate = 3600;

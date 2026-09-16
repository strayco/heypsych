/**
 * Cheapest EHR Landing Page
 *
 * SEO-optimized page targeting budget-conscious searches for mental health EHR:
 * - "cheapest ehr software"
 * - "free ehr for therapists"
 * - "low cost mental health ehr"
 * - "affordable practice management"
 *
 * URL: /tools/cheapest-ehr/
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  DollarSign,
  Gift,
  AlertTriangle,
  Check,
  X,
  TrendingDown,
  Wallet,
  Scale,
  Info,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import { ClinicianToolCard } from "@/components/tools/clinician";
import { ContextualArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";

// ============================================================================
// METADATA
// ============================================================================

const CURRENT_YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Cheapest Mental Health EHR Software (${CURRENT_YEAR}) | Free & Low-Cost Options`,
  description: `Compare the cheapest EHR software for therapists and psychiatrists. Find free, under $50/mo, and budget-friendly mental health practice management options. Pricing verified ${CURRENT_YEAR}.`,
  alternates: {
    canonical: `${siteConfig.url}/tools/cheapest-ehr/`,
  },
  openGraph: {
    title: `Cheapest Mental Health EHR Software (${CURRENT_YEAR}) | Free & Low-Cost Options`,
    description: `Compare the cheapest EHR software for therapists and psychiatrists. Find free, under $50/mo, and budget-friendly mental health practice management options.`,
    url: `${siteConfig.url}/tools/cheapest-ehr/`,
    type: "website",
  },
  keywords: [
    "cheapest ehr software",
    "free ehr for therapists",
    "low cost mental health ehr",
    "affordable practice management",
    "budget ehr psychiatry",
    "free therapy software",
    `cheapest ehr ${CURRENT_YEAR}`,
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get EHR tools sorted by price ascending
 */
async function getEHRToolsByPrice(): Promise<ClinicianToolV4[]> {
  const allTools = await ClinicianToolService.loadClinicianTools();

  // Filter to EHR/practice management tools
  const ehrTools = allTools.filter(
    (t) => t.primary_category === "ehr-practice-management"
  );

  // Sort by price (free first, then by starting_price_cents)
  return ehrTools.sort((a, b) => {
    // Free tools first
    const aFree = a.pricing?.free_tier || a.pricing?.model === "free";
    const bFree = b.pricing?.free_tier || b.pricing?.model === "free";

    if (aFree && !bFree) return -1;
    if (!aFree && bFree) return 1;

    // Then by starting price
    const aPrice = a.pricing?.starting_price_cents ?? Infinity;
    const bPrice = b.pricing?.starting_price_cents ?? Infinity;

    return aPrice - bPrice;
  });
}

/**
 * Format price for display
 */
function formatPrice(tool: ClinicianToolV4): string {
  const pricing = tool.pricing;
  if (!pricing) return "Contact for pricing";

  if (pricing.model === "free" || (pricing.starting_price_cents === 0 && pricing.free_tier)) {
    return "Free";
  }

  if (pricing.free_tier) {
    return "Free tier available";
  }

  if (pricing.starting_price_display) {
    return pricing.starting_price_display;
  }

  if (pricing.starting_price_cents) {
    const monthly = pricing.starting_price_cents / 100;
    return `$${monthly.toFixed(0)}/mo`;
  }

  if (pricing.quote_required) {
    return "Contact for quote";
  }

  return "Contact for pricing";
}

/**
 * Get monthly price in dollars (for comparison)
 */
function getMonthlyPrice(tool: ClinicianToolV4): number | null {
  const pricing = tool.pricing;
  if (!pricing) return null;

  if (pricing.model === "free" || pricing.free_tier) return 0;

  if (pricing.starting_price_cents) {
    return pricing.starting_price_cents / 100;
  }

  return null;
}

/**
 * Categorize tools by price tier
 */
function categorizePriceTiers(tools: ClinicianToolV4[]) {
  const free: ClinicianToolV4[] = [];
  const budget: ClinicianToolV4[] = []; // Under $50/mo
  const midRange: ClinicianToolV4[] = []; // $50-100/mo
  const premium: ClinicianToolV4[] = []; // $100+/mo
  const unknown: ClinicianToolV4[] = [];

  for (const tool of tools) {
    const price = getMonthlyPrice(tool);

    if (price === 0 || tool.pricing?.model === "free" || tool.pricing?.free_tier) {
      free.push(tool);
    } else if (price !== null && price < 50) {
      budget.push(tool);
    } else if (price !== null && price >= 50 && price < 100) {
      midRange.push(tool);
    } else if (price !== null && price >= 100) {
      premium.push(tool);
    } else {
      unknown.push(tool);
    }
  }

  return { free, budget, midRange, premium, unknown };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function CheapestEHRPage() {
  const sortedTools = await getEHRToolsByPrice();
  const { free, budget, midRange, premium } = categorizePriceTiers(sortedTools);

  // Get top tools with pricing for comparison table
  const toolsWithPricing = sortedTools
    .filter((t) => t.pricing?.starting_price_cents !== undefined || t.pricing?.free_tier || t.pricing?.model === "free")
    .slice(0, 15);

  // ============================================================================
  // STRUCTURED DATA
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
          name: "For Clinicians",
          item: `${siteConfig.url}/tools/for-clinicians/`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Cheapest EHR",
          item: `${siteConfig.url}/tools/cheapest-ehr/`,
        },
      ],
    },
    // ItemList with prices for rich results
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Cheapest Mental Health EHR Software (${CURRENT_YEAR})`,
      description: "Compare the most affordable EHR options for mental health practices, sorted by price from free to premium.",
      numberOfItems: toolsWithPricing.length,
      itemListElement: toolsWithPricing.map((tool, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "Product",
          name: tool.name,
          description: tool.short_description || tool.one_liner,
          url: `${siteConfig.url}/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`,
          offers: {
            "@type": "Offer",
            price: tool.pricing?.starting_price_cents
              ? (tool.pricing.starting_price_cents / 100).toFixed(2)
              : "0",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: tool.pricing?.starting_price_cents
                ? (tool.pricing.starting_price_cents / 100).toFixed(2)
                : "0",
              priceCurrency: "USD",
              unitText: "MONTH",
              billingDuration: "P1M",
            },
            availability: "https://schema.org/InStock",
          },
        },
      })),
    },
    // FAQPage for rich snippets
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the cheapest EHR software for therapists?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `As of ${CURRENT_YEAR}, there are ${free.length} free EHR options for therapists, including free tiers from popular platforms. Budget options under $50/month include ${budget.slice(0, 3).map((t) => t.name).join(", ")}. Free EHRs typically have limitations like client caps or limited features.`,
          },
        },
        {
          "@type": "Question",
          name: "Is there free EHR software for mental health practices?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Yes, ${free.length} EHR platforms offer free tiers or are completely free for mental health practices. However, free options often have limitations such as: limited number of active clients (typically 30-50), basic features only, no insurance billing, and limited telehealth capabilities.`,
          },
        },
        {
          "@type": "Question",
          name: "What do you give up with cheap EHR software?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lower-cost EHR software typically lacks: advanced insurance billing and claims scrubbing, comprehensive e-prescribing (especially EPCS for controlled substances), robust telehealth integration, advanced reporting and analytics, multi-provider support, and dedicated customer support. Consider your practice needs carefully before choosing the cheapest option.",
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
          <div className="absolute inset-0 bg-gradient-to-br from-positive/[0.03] via-transparent to-treatment/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/for-clinicians/" className="text-label-secondary hover:text-treatment">
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Cheapest EHR</span>
            </nav>

            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-positive/20 bg-positive/10">
                <TrendingDown className="h-7 w-7 text-positive" />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl"
                  data-speakable="true"
                >
                  Cheapest Mental Health EHR Software ({CURRENT_YEAR})
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {sortedTools.length} EHRs compared by price
                </p>
              </div>
            </div>

            {/* Direct Answer Block */}
            <div
              className="direct-answer mt-4 rounded-xl border border-positive/20 bg-positive/5 p-5"
              data-speakable="true"
            >
              <p className="text-lg text-label-primary leading-relaxed">
                Compare the most affordable EHR and practice management software for therapists,
                psychiatrists, and mental health clinicians. We&apos;ve sorted {sortedTools.length} options
                by price, from completely free to premium, so you can find the right fit for your budget.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-positive">{free.length}</div>
                <div className="text-xs text-label-tertiary">Free Options</div>
              </div>
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-treatment">{budget.length}</div>
                <div className="text-xs text-label-tertiary">Under $50/mo</div>
              </div>
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-accent">{midRange.length}</div>
                <div className="text-xs text-label-tertiary">$50-100/mo</div>
              </div>
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-label-secondary">{premium.length}</div>
                <div className="text-xs text-label-tertiary">$100+/mo</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Comparison Table */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2 flex items-center gap-2">
              <Scale className="h-5 w-5 text-treatment" />
              EHR Pricing Comparison
            </h2>
            <p className="text-sm text-label-secondary mb-6">
              Sorted by price from lowest to highest. Prices verified as of September {CURRENT_YEAR}.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-separator">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-label-primary">
                      EHR Platform
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
                  {toolsWithPricing.map((tool, idx) => {
                    const price = getMonthlyPrice(tool);
                    const isFree = price === 0 || tool.pricing?.model === "free" || tool.pricing?.free_tier;

                    return (
                      <tr
                        key={tool.slug}
                        className={`border-b border-separator ${idx % 2 === 0 ? "bg-canvas" : "bg-surface"}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-label-primary">
                              {tool.name}
                            </div>
                            {isFree && (
                              <span className="rounded-full bg-positive/10 px-2 py-0.5 text-[10px] font-medium text-positive">
                                FREE
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-semibold ${isFree ? "text-positive" : "text-treatment"}`}>
                            {formatPrice(tool)}
                          </span>
                        </td>
                        <td className="py-4 px-4 hidden sm:table-cell">
                          {tool.pricing?.free_trial_days ? (
                            <span className="text-positive text-sm">
                              {tool.pricing.free_trial_days} days
                            </span>
                          ) : tool.pricing?.free_tier ? (
                            <span className="text-positive text-sm">Free tier</span>
                          ) : (
                            <span className="text-label-tertiary text-sm">-</span>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Free EHRs Section */}
        {free.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center gap-2 mb-6">
                <Gift className="h-5 w-5 text-positive" />
                <h2 className="text-xl font-semibold text-label-primary">
                  Free EHR Software
                </h2>
                <span className="rounded-full bg-positive/10 px-2 py-0.5 text-xs font-medium text-positive">
                  {free.length} options
                </span>
              </div>
              <p className="text-sm text-label-secondary mb-6">
                Completely free or with generous free tiers. Ideal for new practices or budget-conscious solo clinicians.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {free.slice(0, 6).map((tool) => (
                  <ClinicianToolCard key={tool.slug} tool={tool} showCategory />
                ))}
              </div>

              {free.length > 6 && (
                <div className="mt-6 text-center">
                  <Link
                    href="/tools/free/ehr-practice-management/"
                    className="inline-flex items-center gap-2 text-sm text-treatment hover:underline"
                  >
                    View all {free.length} free EHR options
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Budget Options Section */}
        {budget.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center gap-2 mb-6">
                <Wallet className="h-5 w-5 text-treatment" />
                <h2 className="text-xl font-semibold text-label-primary">
                  Budget EHRs Under $50/month
                </h2>
                <span className="rounded-full bg-treatment/10 px-2 py-0.5 text-xs font-medium text-treatment">
                  {budget.length} options
                </span>
              </div>
              <p className="text-sm text-label-secondary mb-6">
                Affordable options with essential features for solo practitioners and small practices.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {budget.slice(0, 6).map((tool) => (
                  <ClinicianToolCard key={tool.slug} tool={tool} showCategory />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Mid-Range Options Section */}
        {midRange.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold text-label-primary">
                  Mid-Range EHRs ($50-100/month)
                </h2>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  {midRange.length} options
                </span>
              </div>
              <p className="text-sm text-label-secondary mb-6">
                Balance of features and affordability. Popular choice for established solo and small group practices.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {midRange.slice(0, 6).map((tool) => (
                  <ClinicianToolCard key={tool.slug} tool={tool} showCategory />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Practice Architect CTA */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <ContextualArchitectCTA
              context={{
                source: "category",
                categorySlug: "ehr-practice-management",
                utmSource: "cheapest-ehr",
              }}
              variant="banner"
            />
          </div>
        </section>

        {/* What You Give Up Section */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              What You Give Up at Lower Price Points
            </h2>
            <p className="text-sm text-label-secondary mb-6">
              Understanding the trade-offs helps you make the right choice for your practice
            </p>

            <div className="space-y-4">
              {/* Free Tier Limitations */}
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <h3 className="font-semibold text-label-primary mb-3 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-positive" />
                  Free EHR Limitations
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Client/patient caps (often 30-50 active)",
                    "No insurance billing or claims",
                    "Limited or no telehealth",
                    "Basic reporting only",
                    "No e-prescribing",
                    "Limited customer support",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <X className="h-4 w-4 text-negative shrink-0 mt-0.5" />
                      <span className="text-sm text-label-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget Tier Limitations */}
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <h3 className="font-semibold text-label-primary mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-treatment" />
                  Budget EHR Limitations (Under $50/mo)
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Basic insurance billing (no scrubbing)",
                    "Limited e-prescribing options",
                    "No EPCS (controlled substances)",
                    "Basic telehealth features",
                    "Limited integrations",
                    "Email-only support",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <X className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <span className="text-sm text-label-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What You Get with Mid-Range */}
              <div className="rounded-xl border border-treatment/20 bg-treatment/5 p-5">
                <h3 className="font-semibold text-label-primary mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-treatment" />
                  What Mid-Range EHRs ($50-100/mo) Typically Include
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Full insurance billing with claims",
                    "Integrated telehealth",
                    "E-prescribing (basic)",
                    "Client portal",
                    "Progress notes templates",
                    "Phone + chat support",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-positive shrink-0 mt-0.5" />
                      <span className="text-sm text-label-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Notes */}
        <section className="border-b border-separator bg-canvas px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6 flex items-center gap-2">
              <Info className="h-5 w-5 text-accent" />
              Pricing Notes & Hidden Costs
            </h2>

            <div className="space-y-3">
              {[
                "Most EHRs charge per-provider, so costs multiply with team size",
                "Payment processing fees (2.5-3.5%) are usually separate from subscription",
                "E-prescribing add-ons, especially EPCS, can add $20-50/month",
                "Annual billing typically saves 10-20% vs monthly",
                "Migration and setup fees may apply when switching EHRs",
                "Some 'free' EHRs monetize your data or show ads",
              ].map((note, idx) => (
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

        {/* Related Links */}
        <section className="bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-sm font-medium text-label-tertiary uppercase tracking-wider mb-4">
              Related Comparisons
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tools/for-clinicians/ehr-practice-management/"
                className="flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
              >
                All Mental Health EHRs
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tools/free/ehr-practice-management/"
                className="flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm text-label-secondary hover:border-positive/30 hover:text-positive transition-colors"
              >
                <Gift className="h-3.5 w-3.5" />
                Free EHR Software
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tools/pricing/mental-health-ehr/"
                className="flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
              >
                <DollarSign className="h-3.5 w-3.5" />
                Full EHR Pricing Comparison
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tools/best/solo-therapists/"
                className="flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
              >
                Best for Solo Therapists
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600; // Revalidate every hour

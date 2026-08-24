/**
 * Integrations Hub Page
 *
 * Central hub for all integration/compatibility content.
 * High-value SEO target with low competition.
 *
 * Routes to:
 * - /tools/integrations/[product] - All integrations for a product
 * - /tools/works-with/[product]/[partner] - Specific compatibility page
 */

import { Metadata } from "next";
import Link from "next/link";
import { Cable, ArrowRight, Search, Layers, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { IntegrationArchitectCTA } from "@/components/architect/ContextualArchitectCTA";

export const metadata: Metadata = {
  title: "Mental Health Software Integrations | Compatibility Guide | HeyPsych",
  description: "Check which mental health practice tools work together. Explore EHR integrations, AI scribe compatibility, billing connections, and more. Find products that fit your existing stack.",
  keywords: [
    "mental health software integrations",
    "EHR integrations",
    "SimplePractice integrations",
    "TherapyNotes integrations",
    "practice software compatibility",
    "AI scribe EHR integration",
  ],
  alternates: {
    canonical: `${siteConfig.url}/tools/integrations`,
  },
  openGraph: {
    title: "Mental Health Software Integrations | HeyPsych",
    description: "Check which mental health practice tools work together.",
    url: `${siteConfig.url}/tools/integrations`,
    type: "website",
  },
};

// Top products with integration data
const TOP_INTEGRATION_PRODUCTS = [
  { slug: "simplepractice", name: "SimplePractice", category: "EHR", integrationCount: 15 },
  { slug: "therapynotes", name: "TherapyNotes", category: "EHR", integrationCount: 12 },
  { slug: "jane", name: "Jane App", category: "EHR", integrationCount: 18 },
  { slug: "valant", name: "Valant", category: "EHR", integrationCount: 10 },
  { slug: "freed", name: "Freed", category: "AI Scribe", integrationCount: 20 },
  { slug: "nabla", name: "Nabla", category: "AI Scribe", integrationCount: 15 },
  { slug: "suki-ai", name: "Suki AI", category: "AI Scribe", integrationCount: 25 },
];

// Popular integration pairs
const POPULAR_PAIRS = [
  { productA: "simplepractice", productB: "freed", nameA: "SimplePractice", nameB: "Freed" },
  { productA: "therapynotes", productB: "freed", nameA: "TherapyNotes", nameB: "Freed" },
  { productA: "jane", productB: "freed", nameA: "Jane App", nameB: "Freed" },
  { productA: "simplepractice", productB: "nabla", nameA: "SimplePractice", nameB: "Nabla" },
  { productA: "valant", productB: "suki-ai", nameA: "Valant", nameB: "Suki AI" },
  { productA: "therapynotes", productB: "nabla", nameA: "TherapyNotes", nameB: "Nabla" },
];

// Integration categories
const INTEGRATION_CATEGORIES = [
  {
    name: "EHR Integrations",
    description: "Connect your electronic health record to other practice tools",
    icon: Layers,
    href: "/tools/integrations?category=ehr",
    products: ["simplepractice", "therapynotes", "jane", "valant"],
  },
  {
    name: "AI Scribe Compatibility",
    description: "Which AI documentation tools work with your EHR",
    icon: Cable,
    href: "/tools/integrations?category=ai-scribe",
    products: ["freed", "nabla", "suki-ai"],
  },
  {
    name: "Billing Connections",
    description: "Connect billing and RCM tools to your practice stack",
    icon: CheckCircle2,
    href: "/tools/integrations?category=billing",
    products: ["kareo-billing", "availity-essentials", "waystar-eligibility"],
  },
];

export default async function IntegrationsHubPage() {
  // Load actual product data for display
  const tools = await ClinicianToolService.loadClinicianTools();

  // Build product lookup
  const productLookup = new Map(tools.map(t => [t.slug, t]));

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Mental Health Software Integrations",
    description: "Check which mental health practice tools work together.",
    url: `${siteConfig.url}/tools/integrations`,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
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
              <Link href="/tools/for-clinicians/" className="text-label-secondary hover:text-treatment">
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Integrations</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-treatment/10 text-treatment border-treatment/20">
                <Cable className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  Software Integrations
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  Check which tools work together
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                Not all mental health software plays well together. Before you buy, check which
                tools integrate with your existing stack. Find native integrations, API connections,
                and third-party bridges.
              </p>
            </div>
          </div>
        </section>

        {/* Search/Quick Check */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-xl border border-separator bg-surface p-6">
              <h2 className="text-lg font-semibold text-label-primary flex items-center gap-2">
                <Search className="h-5 w-5 text-treatment" />
                Quick Compatibility Check
              </h2>
              <p className="mt-1 text-sm text-label-secondary">
                Select two products to see if they integrate
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
                <select
                  className="w-full sm:w-auto flex-1 rounded-lg border border-separator bg-canvas px-4 py-2.5 text-label-primary"
                  defaultValue=""
                >
                  <option value="" disabled>Select first product...</option>
                  {TOP_INTEGRATION_PRODUCTS.map(p => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </select>

                <span className="text-label-tertiary font-medium">with</span>

                <select
                  className="w-full sm:w-auto flex-1 rounded-lg border border-separator bg-canvas px-4 py-2.5 text-label-primary"
                  defaultValue=""
                >
                  <option value="" disabled>Select second product...</option>
                  {TOP_INTEGRATION_PRODUCTS.map(p => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </select>

                <button className="w-full sm:w-auto rounded-lg bg-treatment px-6 py-2.5 text-sm font-medium text-white hover:bg-treatment-600 transition-colors">
                  Check
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Integration Pairs */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary">
              Popular Integration Checks
            </h2>
            <p className="mt-1 text-sm text-label-secondary">
              Common product combinations therapists ask about
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {POPULAR_PAIRS.map((pair, idx) => (
                <Link
                  key={idx}
                  href={`/tools/works-with/${pair.productA}/${pair.productB}`}
                  className="group flex items-center justify-between rounded-xl border border-separator bg-canvas p-4 transition-all hover:border-treatment/30 hover:shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-lg bg-treatment/10 border border-treatment/20 flex items-center justify-center text-xs font-medium text-treatment">
                        {pair.nameA.charAt(0)}
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                        {pair.nameB.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-label-primary text-sm">
                        {pair.nameA} + {pair.nameB}
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

        {/* Browse by Product */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary">
              Browse Integrations by Product
            </h2>
            <p className="mt-1 text-sm text-label-secondary">
              See all integrations for a specific product
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TOP_INTEGRATION_PRODUCTS.map((product) => {
                const toolData = productLookup.get(product.slug);
                return (
                  <Link
                    key={product.slug}
                    href={`/tools/integrations/${product.slug}`}
                    className="group rounded-xl border border-separator bg-surface p-4 transition-all hover:border-treatment/30 hover:shadow-soft"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-label-primary">
                          {toolData?.name || product.name}
                        </p>
                        <p className="text-xs text-label-tertiary mt-0.5">
                          {product.category}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-treatment/10">
                        <Cable className="h-4 w-4 text-treatment" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-label-secondary">
                        {product.integrationCount}+ integrations
                      </span>
                      <ArrowRight className="h-4 w-4 text-label-quaternary group-hover:text-treatment transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Integration Categories */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary">
              Browse by Category
            </h2>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {INTEGRATION_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.name}
                    className="rounded-xl border border-separator bg-canvas p-5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-treatment/10 mb-3">
                      <Icon className="h-5 w-5 text-treatment" />
                    </div>
                    <h3 className="font-semibold text-label-primary">{category.name}</h3>
                    <p className="mt-1 text-sm text-label-secondary">{category.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {category.products.map((slug) => {
                        const tool = productLookup.get(slug);
                        return (
                          <Link
                            key={slug}
                            href={`/tools/integrations/${slug}`}
                            className="text-xs px-2 py-1 rounded-md bg-surface border border-separator text-label-secondary hover:text-treatment hover:border-treatment/30 transition-colors"
                          >
                            {tool?.name || slug}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Architect CTA */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <IntegrationArchitectCTA productSlugs={[]} />
          </div>
        </section>

        {/* Integration Status Legend */}
        <section className="bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-lg font-semibold text-label-primary">
              Understanding Integration Status
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-label-primary">Verified Integration</p>
                  <p className="text-sm text-label-secondary">
                    Confirmed to work together with official support
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-label-primary">Unverified</p>
                  <p className="text-sm text-label-secondary">
                    Reported to work but not officially confirmed
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-label-primary">No Integration</p>
                  <p className="text-sm text-label-secondary">
                    These products do not currently integrate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600; // 1 hour

/**
 * Pricing Index Page
 *
 * Lists all available pricing comparison pages.
 *
 * URL: /tools/pricing
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  DollarSign,
  ArrowRight,
  FileText,
  Stethoscope,
  Heart,
  Bot,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Mental Health Software Pricing Comparisons (2026) | HeyPsych",
  description: "Compare pricing for mental health EHRs, AI scribes, and practice management software. See monthly costs, tiers, and what's included.",
  alternates: {
    canonical: `${siteConfig.url}/tools/pricing/`,
  },
  openGraph: {
    title: "Mental Health Software Pricing Comparisons | HeyPsych",
    description: "Compare pricing for mental health EHRs, AI scribes, and practice management software.",
    url: `${siteConfig.url}/tools/pricing/`,
    type: "website",
  },
};

const PRICING_PAGES = [
  {
    slug: "mental-health-ehr",
    name: "Mental Health EHR Pricing",
    description: "Compare pricing across SimplePractice, TherapyNotes, Jane, Valant, and more. Monthly costs, per-provider fees, and hidden costs.",
    icon: FileText,
    color: "treatment",
    products: ["SimplePractice", "TherapyNotes", "Jane App", "Valant"],
  },
  {
    slug: "therapy-ehr",
    name: "Therapy EHR Pricing",
    description: "Pricing specifically for therapists and counselors. All-in-one platforms with scheduling, notes, and billing.",
    icon: Heart,
    color: "treatment",
    products: ["SimplePractice", "TherapyNotes", "Jane App", "Practice Better"],
  },
  {
    slug: "psychiatry-ehr",
    name: "Psychiatry EHR Pricing",
    description: "EHR pricing with e-prescribing and EPCS. Includes add-on costs for controlled substance prescribing.",
    icon: Stethoscope,
    color: "treatment",
    products: ["Valant", "SimplePractice", "DrChrono", "Opus"],
  },
  {
    slug: "ai-scribe",
    name: "AI Scribe Pricing",
    description: "Compare per-session vs monthly unlimited pricing models. Find the most cost-effective option for your volume.",
    icon: Bot,
    color: "accent",
    products: ["Freed", "Mentalyc", "Upheal", "Autonotes"],
  },
];

export default function PricingIndexPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Mental Health Software Pricing Comparisons",
    "description": "Compare pricing for mental health EHRs, AI scribes, and practice management software.",
    "url": `${siteConfig.url}/tools/pricing/`,
    "hasPart": PRICING_PAGES.map((page) => ({
      "@type": "WebPage",
      "name": page.name,
      "description": page.description,
      "url": `${siteConfig.url}/tools/pricing/${page.slug}/`,
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
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Pricing</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-treatment/10 text-treatment border-treatment/20">
                <DollarSign className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                Mental Health Software Pricing
              </h1>
            </div>

            <p className="mt-4 text-lg text-label-secondary max-w-3xl">
              Compare pricing across the software categories mental health clinicians use most. See monthly costs, what's included at each tier, and hidden fees to watch for.
            </p>

            <p className="mt-3 text-sm text-label-tertiary">
              All pricing verified September 2026. Prices change frequently—confirm with vendors before purchasing.
            </p>
          </div>
        </section>

        {/* Pricing Category Cards */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-2">
              {PRICING_PAGES.map((page) => {
                const Icon = page.icon;
                const colorClasses = page.color === "treatment"
                  ? "bg-treatment/10 text-treatment border-treatment/20"
                  : "bg-accent/10 text-accent border-accent/20";

                return (
                  <Link
                    key={page.slug}
                    href={`/tools/pricing/${page.slug}/`}
                    className="group rounded-xl border border-separator bg-surface p-6 hover:border-treatment/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${colorClasses}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-label-primary group-hover:text-treatment transition-colors">
                          {page.name}
                        </h2>
                        <p className="mt-1 text-sm text-label-secondary line-clamp-2">
                          {page.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {page.products.slice(0, 3).map((product) => (
                              <span
                                key={product}
                                className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-label-tertiary"
                              >
                                {product}
                              </span>
                            ))}
                            {page.products.length > 3 && (
                              <span className="text-xs text-label-quaternary">
                                +{page.products.length - 3}
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-sm font-medium text-treatment">
                            Compare
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quick Tips */}
        <section className="border-t border-separator bg-surface px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Smart Pricing Tips
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-separator bg-canvas p-4">
                <h3 className="font-medium text-label-primary mb-2">Watch for Hidden Fees</h3>
                <p className="text-sm text-label-secondary">
                  Payment processing (2.5-3.5%), e-prescribing add-ons ($20-50/mo), and per-claim billing fees can significantly increase your monthly cost.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-4">
                <h3 className="font-medium text-label-primary mb-2">Annual vs Monthly</h3>
                <p className="text-sm text-label-secondary">
                  Most vendors offer 10-20% discounts for annual billing. But start monthly until you're sure the tool fits your workflow.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-4">
                <h3 className="font-medium text-label-primary mb-2">Group Practice Math</h3>
                <p className="text-sm text-label-secondary">
                  Per-provider pricing adds up fast. A $50/provider EHR costs $500/month for a 10-person group. Get volume discounts in writing.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-4">
                <h3 className="font-medium text-label-primary mb-2">AI Scribe ROI</h3>
                <p className="text-sm text-label-secondary">
                  If you bill $150/hour and save 5 hours/week on documentation, that's $3,000/month saved for a $79/month tool. The math usually works.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-semibold text-label-primary">
              Need help choosing?
            </h2>
            <p className="mt-2 text-label-secondary">
              Practice Architect gives you personalized recommendations based on your practice type, budget, and workflow.
            </p>
            <Link
              href="/architect/"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-treatment px-6 py-3 text-sm font-medium text-white hover:bg-treatment/90 transition-colors"
            >
              Try Practice Architect
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600;

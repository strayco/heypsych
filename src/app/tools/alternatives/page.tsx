/**
 * Alternatives Hub Page
 *
 * Landing page for users exploring alternatives to popular mental health software.
 * Links to individual alternatives pages for high-intent buyer journeys.
 *
 * URL: /tools/alternatives
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  RefreshCw,
  Sparkles,
  FileText,
  Stethoscope,
  Users,
  Video,
  Bot,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";

export const metadata: Metadata = {
  title: "Mental Health Software Alternatives (2026) | HeyPsych",
  description: "Explore alternatives to popular mental health software. Compare SimplePractice, TherapyNotes, Freed, and more. Find the right replacement for your practice.",
  alternates: {
    canonical: `${siteConfig.url}/tools/alternatives`,
  },
  openGraph: {
    title: "Mental Health Software Alternatives | HeyPsych",
    description: "Explore alternatives to popular mental health software. Find the right replacement for your practice.",
    url: `${siteConfig.url}/tools/alternatives`,
    type: "website",
  },
  keywords: [
    "mental health software alternatives",
    "therapy EHR alternatives",
    "SimplePractice alternatives",
    "TherapyNotes alternatives",
    "EHR replacement",
    "practice management alternatives",
  ],
};

// Top products that people commonly look for alternatives to
const FEATURED_ALTERNATIVES = [
  {
    slug: "simplepractice",
    name: "SimplePractice",
    description: "The most popular therapy EHR - see what else is out there",
    category: "EHR & Practice Management",
    icon: FileText,
  },
  {
    slug: "therapynotes",
    name: "TherapyNotes",
    description: "Therapist-focused EHR - explore comparable options",
    category: "EHR & Practice Management",
    icon: FileText,
  },
  {
    slug: "jane-app",
    name: "Jane App",
    description: "All-in-one practice management - find alternatives",
    category: "EHR & Practice Management",
    icon: FileText,
  },
  {
    slug: "freed",
    name: "Freed",
    description: "AI medical scribe - compare with other AI documentation tools",
    category: "AI Scribe",
    icon: Bot,
  },
  {
    slug: "mentalyc",
    name: "Mentalyc",
    description: "Mental health AI scribe - see similar options",
    category: "AI Scribe",
    icon: Bot,
  },
  {
    slug: "valant",
    name: "Valant",
    description: "Behavioral health EHR - compare psychiatry-focused options",
    category: "EHR & Practice Management",
    icon: Stethoscope,
  },
  {
    slug: "headway",
    name: "Headway",
    description: "Insurance credentialing platform - explore alternatives",
    category: "Provider Networks",
    icon: Users,
  },
  {
    slug: "doxy-me",
    name: "Doxy.me",
    description: "Free telehealth platform - find other video options",
    category: "Telehealth",
    icon: Video,
  },
];

export default async function AlternativesHubPage() {
  // Get tool data for pricing display
  const allTools = await ClinicianToolService.loadClinicianTools();
  const toolMap = new Map(allTools.map(t => [t.slug, t]));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Mental Health Software Alternatives",
    description: "Explore alternatives to popular mental health software. Find the right replacement for your practice.",
    url: `${siteConfig.url}/tools/alternatives`,
    hasPart: FEATURED_ALTERNATIVES.map((item) => ({
      "@type": "WebPage",
      name: `${item.name} Alternatives`,
      description: item.description,
      url: `${siteConfig.url}/tools/alternatives/${item.slug}`,
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
                  Software Alternatives
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  Find the right replacement for your mental health practice
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                Looking to switch from your current software? Explore alternatives with detailed comparisons,
                pricing breakdowns, and specific recommendations for different practice types.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Alternatives */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2">
              Popular Alternatives
            </h2>
            <p className="text-sm text-label-secondary mb-6">
              The most searched alternatives for mental health software
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_ALTERNATIVES.map((item) => {
                const tool = toolMap.get(item.slug);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.slug}
                    href={`/tools/alternatives/${item.slug}`}
                    className="group rounded-xl border border-separator bg-surface p-5 transition-all hover:border-treatment/30 hover:shadow-soft"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-treatment/10 text-treatment">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs text-label-tertiary">{item.category}</span>
                    </div>

                    <h3 className="font-semibold text-label-primary group-hover:text-treatment transition-colors">
                      {item.name} Alternatives
                    </h3>

                    <p className="mt-2 text-sm text-label-secondary line-clamp-2">
                      {item.description}
                    </p>

                    {tool?.pricing?.starting_price_display && (
                      <p className="mt-3 text-xs text-label-tertiary">
                        {item.name} starts at {tool.pricing.starting_price_display}
                      </p>
                    )}

                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-treatment">
                      View alternatives
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Browse by Category */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Browse Alternatives by Category
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-treatment" />
                  <h3 className="font-semibold text-label-primary">EHR & Practice Management</h3>
                </div>
                <div className="space-y-2">
                  <Link href="/tools/alternatives/simplepractice" className="block text-sm text-label-secondary hover:text-treatment">
                    SimplePractice Alternatives →
                  </Link>
                  <Link href="/tools/alternatives/therapynotes" className="block text-sm text-label-secondary hover:text-treatment">
                    TherapyNotes Alternatives →
                  </Link>
                  <Link href="/tools/alternatives/jane-app" className="block text-sm text-label-secondary hover:text-treatment">
                    Jane App Alternatives →
                  </Link>
                  <Link href="/tools/alternatives/valant" className="block text-sm text-label-secondary hover:text-treatment">
                    Valant Alternatives →
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Bot className="h-5 w-5 text-treatment" />
                  <h3 className="font-semibold text-label-primary">AI Scribes</h3>
                </div>
                <div className="space-y-2">
                  <Link href="/tools/alternatives/freed" className="block text-sm text-label-secondary hover:text-treatment">
                    Freed Alternatives →
                  </Link>
                  <Link href="/tools/alternatives/mentalyc" className="block text-sm text-label-secondary hover:text-treatment">
                    Mentalyc Alternatives →
                  </Link>
                  <Link href="/tools/alternatives/upheal" className="block text-sm text-label-secondary hover:text-treatment">
                    Upheal Alternatives →
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-5 w-5 text-treatment" />
                  <h3 className="font-semibold text-label-primary">Provider Networks</h3>
                </div>
                <div className="space-y-2">
                  <Link href="/tools/alternatives/headway" className="block text-sm text-label-secondary hover:text-treatment">
                    Headway Alternatives →
                  </Link>
                  <Link href="/tools/alternatives/alma-provider-platform" className="block text-sm text-label-secondary hover:text-treatment">
                    Alma Alternatives →
                  </Link>
                  <Link href="/tools/alternatives/grow-therapy" className="block text-sm text-label-secondary hover:text-treatment">
                    Grow Therapy Alternatives →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Switch */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Common Reasons to Switch Software
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-4 rounded-xl border border-separator bg-surface p-5">
                <Sparkles className="h-6 w-6 text-treatment shrink-0" />
                <div>
                  <h3 className="font-semibold text-label-primary">Missing Features</h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    Your current tool doesn't support features you need like AI notes, e-prescribing, or telehealth.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-separator bg-surface p-5">
                <RefreshCw className="h-6 w-6 text-treatment shrink-0" />
                <div>
                  <h3 className="font-semibold text-label-primary">Better Integration</h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    You need software that works better with your existing workflow and tools.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-separator bg-surface p-5">
                <FileText className="h-6 w-6 text-treatment shrink-0" />
                <div>
                  <h3 className="font-semibold text-label-primary">Price Optimization</h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    Find better value or more predictable pricing as your practice grows.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-separator bg-surface p-5">
                <Users className="h-6 w-6 text-treatment shrink-0" />
                <div>
                  <h3 className="font-semibold text-label-primary">Practice Growth</h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    Your practice has outgrown your current tool and needs enterprise features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-6">
            <Link
              href="/tools/compare"
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              Compare tools head-to-head
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/tools/pricing"
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              Pricing comparisons
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/tools/for-practices"
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              Tools by practice type
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/architect"
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              Build your ideal stack
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600;

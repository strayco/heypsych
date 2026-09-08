/**
 * Software Stacks Index Page
 *
 * Lists all available practice type software stacks.
 *
 * URL: /tools/stacks
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Heart,
  Stethoscope,
  Pill,
  Users,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Software Stacks for Mental Health Practices (2026) | HeyPsych",
  description: "Complete software stack guides for therapy, psychiatry, PMHNP, and group practices. See which tools you need at each stage of your practice journey.",
  alternates: {
    canonical: `${siteConfig.url}/tools/stacks/`,
  },
  openGraph: {
    title: "Software Stacks for Mental Health Practices | HeyPsych",
    description: "Complete software stack guides for therapy, psychiatry, PMHNP, and group practices.",
    url: `${siteConfig.url}/tools/stacks/`,
    type: "website",
  },
};

const STACKS = [
  {
    slug: "therapy-practice",
    name: "Therapy Private Practice",
    description: "Complete stack for solo and small therapy practices: EHR, telehealth, AI scribe, billing, and growth tools.",
    icon: Heart,
    color: "treatment",
    budget: "$50–200/month",
  },
  {
    slug: "psychiatry-practice",
    name: "Psychiatry Private Practice",
    description: "Specialized stack with EPCS, e-prescribing, medication tracking, and efficient documentation for med management.",
    icon: Stethoscope,
    color: "treatment",
    budget: "$100–300/month",
  },
  {
    slug: "pmhnp-practice",
    name: "PMHNP Private Practice",
    description: "Hybrid stack supporting both prescribing and therapy workflows—EPCS-capable EHR with therapy documentation.",
    icon: Pill,
    color: "treatment",
    budget: "$80–250/month",
  },
  {
    slug: "group-practice",
    name: "Mental Health Group Practice",
    description: "Scalable stack for 2-50+ providers: multi-provider EHR, centralized billing, team AI scribes, and practice analytics.",
    icon: Users,
    color: "accent",
    budget: "$500–3,000+/month",
  },
];

export default function StacksIndexPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Software Stacks for Mental Health Practices",
    "description": "Complete software stack guides for therapy, psychiatry, PMHNP, and group practices.",
    "url": `${siteConfig.url}/tools/stacks/`,
    "hasPart": STACKS.map((stack) => ({
      "@type": "HowTo",
      "name": `Software Stack for ${stack.name}`,
      "description": stack.description,
      "url": `${siteConfig.url}/tools/stacks/${stack.slug}/`,
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
              <span className="text-label-primary font-medium">Stacks</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-treatment/10 text-treatment border-treatment/20">
                <Layers className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                Software Stacks for Mental Health Practices
              </h1>
            </div>

            <p className="mt-4 text-lg text-label-secondary max-w-3xl">
              Complete guides to building your practice technology stack. Each stack shows you which tools you need at each stage of your practice journey—from launch to scale.
            </p>
          </div>
        </section>

        {/* Stack Cards */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-2">
              {STACKS.map((stack) => {
                const Icon = stack.icon;
                const colorClasses = stack.color === "treatment"
                  ? "bg-treatment/10 text-treatment border-treatment/20"
                  : "bg-accent/10 text-accent border-accent/20";

                return (
                  <Link
                    key={stack.slug}
                    href={`/tools/stacks/${stack.slug}/`}
                    className="group rounded-xl border border-separator bg-surface p-6 hover:border-treatment/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${colorClasses}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-label-primary group-hover:text-treatment transition-colors">
                          {stack.name}
                        </h2>
                        <p className="mt-1 text-sm text-label-secondary line-clamp-2">
                          {stack.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-label-tertiary">
                            {stack.budget}
                          </span>
                          <span className="flex items-center gap-1 text-sm font-medium text-treatment">
                            View stack
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

        {/* CTA */}
        <section className="border-t border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-semibold text-label-primary">
              Not sure which stack fits your practice?
            </h2>
            <p className="mt-2 text-label-secondary">
              Use Practice Architect for personalized recommendations based on your specific situation.
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

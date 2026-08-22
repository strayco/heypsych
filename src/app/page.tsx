import type { Metadata } from "next";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { IntentGrid } from "@/components/navigation/IntentGrid";

// SEO-optimized metadata - Navigation V1 positioning
export const metadata: Metadata = {
  title: "HeyPsych - Understand Mental Health, Explore Options, Find Care",
  description:
    "Navigate your mental health journey. Understand conditions, compare treatments, find tools, and connect with care. Free, evidence-based information to help you take the next step.",
  openGraph: {
    title: "HeyPsych - Understand Mental Health, Explore Options, Find Care",
    description:
      "Navigate your mental health journey. Understand conditions, compare treatments, and find the right care for you.",
    type: "website",
    url: "https://heypsych.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "HeyPsych - Mental Health Navigation",
    description:
      "Understand mental health. Explore your options. Find your next step.",
  },
};

// Organization schema for Google Search rich results
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://heypsych.com/#organization",
  name: "HeyPsych",
  url: "https://heypsych.com",
  logo: {
    "@type": "ImageObject",
    url: "https://heypsych.com/images/logo.png",
    width: 220,
    height: 64,
  },
  description:
    "Mental health navigation platform helping people understand conditions, compare treatments, and find appropriate care.",
  sameAs: ["https://twitter.com/heypsych", "https://linkedin.com/company/heypsych"],
};

// WebSite schema with navigation focus
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://heypsych.com/#website",
  name: "HeyPsych",
  url: "https://heypsych.com",
  description:
    "Navigate your mental health journey. Understand conditions, explore treatments, find tools, and connect with care.",
  publisher: {
    "@id": "https://heypsych.com/#organization",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://heypsych.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

/**
 * Homepage - Navigation V1
 *
 * HeyPsych's core product is mental-health navigation powered by structured
 * clinical knowledge.
 *
 * Core promise:
 *   Understand your mental health.
 *   Explore your options.
 *   Find your next step.
 *
 * This homepage provides intent-based navigation to help users find
 * their path through understanding conditions, comparing treatments,
 * finding tools, and connecting with care.
 */
export default function HomePage() {
  return (
    <>
      {/* JSON-LD Schemas for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Homepage Sections - Navigation V1 */}
      <div className="min-h-screen bg-canvas">
        {/* Hero Section */}
        <section className="px-4 pb-12 pt-12 sm:px-6 md:pt-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Primary Heading */}
            <h1 className="text-3xl font-bold tracking-tight text-label-primary sm:text-4xl md:text-5xl">
              What can we help you figure out?
            </h1>

            {/* Supporting Copy */}
            <p className="mx-auto mt-4 max-w-2xl text-lg text-label-secondary sm:mt-6 sm:text-xl">
              Understand your mental health. Explore your options. Find your next step.
            </p>

            {/* Search Bar */}
            <div className="mx-auto mt-8 max-w-xl">
              <Link
                href="/search"
                className="
                  group flex w-full items-center gap-3 rounded-full
                  border border-separator bg-surface px-5 py-3.5
                  text-label-tertiary shadow-subtle
                  transition-all duration-200
                  hover:border-accent hover:shadow-soft
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                "
              >
                <Search className="h-5 w-5 text-label-tertiary group-hover:text-accent" />
                <span className="flex-1 text-left">Search conditions, treatments, tools...</span>
                <kbd className="hidden rounded-md bg-fill-quaternary px-2 py-1 text-xs font-medium text-label-tertiary sm:inline-block">
                  /
                </kbd>
              </Link>
            </div>

            {/* Trust Cues */}
            <p className="mt-4 text-sm text-label-tertiary">
              Evidence-based information reviewed by mental health professionals
            </p>
          </div>
        </section>

        {/* Intent Grid Section */}
        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <IntentGrid />
          </div>
        </section>

        {/* Quick Navigation Section */}
        <section className="border-t border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-xl font-semibold text-label-primary">
              Explore by category
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  href: "/conditions",
                  label: "Conditions",
                  description: "Understand symptoms and diagnoses",
                },
                {
                  href: "/treatments/compare",
                  label: "Compare Treatments",
                  description: "Compare therapy and medication",
                },
                {
                  href: "/tools",
                  label: "Tools",
                  description: "Discover apps and resources",
                },
                {
                  href: "/psychiatrists",
                  label: "Find Care",
                  description: "Search for providers near you",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="
                    group flex items-center justify-between rounded-xl
                    border border-separator bg-surface p-4
                    transition-all duration-150
                    hover:border-accent/30 hover:shadow-subtle
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                  "
                >
                  <div>
                    <p className="font-medium text-label-primary group-hover:text-accent">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-sm text-label-tertiary">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-label-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 text-center sm:grid-cols-3">
              <div>
                <p className="text-3xl font-bold text-accent tabular-nums">130+</p>
                <p className="mt-1 text-sm text-label-secondary">Mental health conditions covered</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent tabular-nums">650+</p>
                <p className="mt-1 text-sm text-label-secondary">Treatment options explained</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent tabular-nums">100+</p>
                <p className="mt-1 text-sm text-label-secondary">Digital tools reviewed</p>
              </div>
            </div>
          </div>
        </section>

        {/* Medical Disclaimer Footer */}
        <section className="border-t border-separator bg-surface-grouped px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm text-label-secondary">
              HeyPsych provides educational information about mental health conditions and
              treatments. This content is not a substitute for professional medical advice,
              diagnosis, or treatment. Always seek the advice of a qualified healthcare
              provider with questions about a medical condition.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

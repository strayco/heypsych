import type { Metadata } from "next";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { IntentGrid } from "@/components/navigation/IntentGrid";
import { AudienceGateway } from "@/components/home/AudienceGateway";

// SEO-optimized metadata - Mission FIX 3 dual-audience positioning
export const metadata: Metadata = {
  title: "HeyPsych - Mental Health for Everyone Involved",
  description:
    "Mental health resources for patients, families, and clinicians. Understand conditions, compare treatments, find care, or discover EHR and practice tools. Evidence-based information to help you take the next step.",
  openGraph: {
    title: "HeyPsych - Mental Health for Everyone Involved",
    description:
      "Mental health resources for patients and clinicians. Understand conditions, find care, or discover practice tools.",
    type: "website",
    url: "https://heypsych.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "HeyPsych - Mental Health for Everyone Involved",
    description:
      "Resources for patients seeking care and clinicians running practices.",
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
    "Mental health for everyone involved. Resources for patients seeking understanding and care, and clinicians running mental health practices.",
  sameAs: ["https://twitter.com/heypsych", "https://linkedin.com/company/heypsych"],
};

// WebSite schema with dual-audience focus
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://heypsych.com/#website",
  name: "HeyPsych",
  url: "https://heypsych.com",
  description:
    "Mental health for everyone involved. Patients can understand conditions and find care. Clinicians can discover EHR and practice management tools.",
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
 * Homepage - Dual-audience positioning (Mission FIX 3)
 *
 * HeyPsych serves two audiences with equal prominence:
 * - Patients & families seeking mental health understanding and care
 * - Clinicians seeking EHR and practice management tools
 *
 * The AudienceGateway replaces the traditional hero, with H1:
 * "Mental health, for everyone involved."
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

      {/* Homepage Sections */}
      <div className="min-h-screen bg-canvas">
        {/* AudienceGateway is the new hero - contains H1 */}
        <AudienceGateway />

        {/* Search Bar - below audience gateway */}
        <section className="px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl">
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
            <p className="mt-3 text-center text-sm text-label-tertiary">
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

import type { Metadata } from "next";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { AudienceGateway } from "@/components/home/AudienceGateway";

// SEO-optimized metadata - Decision platform positioning
export const metadata: Metadata = {
  title: "HeyPsych - Make Better Mental Health Decisions",
  description:
    "Make better mental health decisions. For patients: find the right care, apps, and treatments. For clinicians: build the right practice stack with transparent pricing.",
  openGraph: {
    title: "HeyPsych - Make Better Mental Health Decisions",
    description:
      "Make better mental health decisions. Find the right care, compare treatments, or build your practice stack with transparent pricing.",
    type: "website",
    url: "https://heypsych.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "HeyPsych - Make Better Mental Health Decisions",
    description:
      "Make better mental health decisions. For patients and clinicians.",
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
    "A mental health decision-support platform. Helps patients find the right care, apps, and treatments. Helps clinicians build the right practice stack with transparent pricing.",
  sameAs: ["https://twitter.com/heypsych", "https://linkedin.com/company/heypsych"],
};

// WebSite schema - Decision platform
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://heypsych.com/#website",
  name: "HeyPsych",
  url: "https://heypsych.com",
  description:
    "A mental health decision-support platform. Patients find the right care, apps, and treatments. Clinicians build the right practice stack with transparent pricing.",
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
 * Homepage - Decision platform positioning
 *
 * HeyPsych is a mental health decision-support platform serving:
 * - Patients making decisions about care, apps, treatments, and providers
 * - Clinicians making decisions about EHR, billing, and practice stack
 *
 * Filter: "Does this help someone make a decision?"
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
        {/* AudienceGateway - contains H1 and primary navigation */}
        <AudienceGateway />

        {/* Search Bar */}
        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg">
            <Link
              href="/search"
              className="group flex w-full items-center gap-3 rounded-full border border-separator bg-surface px-5 py-3 text-label-tertiary transition-all hover:border-accent/50 hover:shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Search className="h-5 w-5 text-label-quaternary group-hover:text-accent" />
              <span className="flex-1 text-left text-[15px]">Search conditions, treatments, tools...</span>
              <kbd className="hidden rounded bg-fill-quaternary px-2 py-1 text-xs font-medium text-label-tertiary sm:inline-block">
                /
              </kbd>
            </Link>
          </div>
        </section>

        {/* Quick Links */}
        <section className="border-t border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-px overflow-hidden rounded-xl border border-separator bg-separator sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: "/conditions", label: "Conditions", desc: "Symptoms & diagnoses" },
                { href: "/treatments/compare", label: "Treatments", desc: "Therapy & medication" },
                { href: "/tools", label: "Tools", desc: "Apps & resources" },
                { href: "/psychiatrists", label: "Find Care", desc: "Providers near you" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between bg-surface p-4 transition-colors hover:bg-fill-quaternary focus:outline-none focus-visible:bg-accent-tint"
                >
                  <div>
                    <p className="font-medium text-label-primary group-hover:text-accent">{item.label}</p>
                    <p className="text-sm text-label-tertiary">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-label-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-center gap-12 text-center sm:gap-16">
              <div>
                <p className="text-2xl font-semibold tabular-nums text-label-primary">130+</p>
                <p className="text-sm text-label-tertiary">Conditions</p>
              </div>
              <div className="h-8 w-px bg-separator" />
              <div>
                <p className="text-2xl font-semibold tabular-nums text-label-primary">650+</p>
                <p className="text-sm text-label-tertiary">Treatments</p>
              </div>
              <div className="h-8 w-px bg-separator" />
              <div>
                <p className="text-2xl font-semibold tabular-nums text-label-primary">100+</p>
                <p className="text-sm text-label-tertiary">Tools</p>
              </div>
            </div>
          </div>
        </section>

        {/* Medical Disclaimer */}
        <section className="border-t border-separator bg-surface-grouped px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm leading-relaxed text-label-tertiary">
              HeyPsych provides decision-support information about mental health. This is not a substitute
              for professional medical advice. Always consult a qualified healthcare provider.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

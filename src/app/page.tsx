import type { Metadata } from "next";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
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
              HeyPsych provides educational information about mental health. This is not a substitute
              for professional medical advice. Always consult a qualified healthcare provider.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

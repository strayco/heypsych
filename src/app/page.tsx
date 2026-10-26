import type { Metadata } from "next";
import { HomeHero } from "@/components/home/HomeHero";
import { DiscoveryNavigation } from "@/components/home/DiscoveryNavigation";
import { TrustEditorial } from "@/components/home/TrustEditorial";
import { TaxonomyHero } from "@/components/home/TaxonomyHero";
import { featureFlags } from "@/lib/config/feature-flags";

// SEO-optimized metadata - Decision platform positioning
export const metadata: Metadata = {
  title: { absolute: "HeyPsych | Make Better Mental Health Decisions" },
  description:
    "Make better mental health decisions. For patients: find the right care, apps, and treatments. For clinicians: build the right practice stack with transparent pricing.",
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "HeyPsych | Make Better Mental Health Decisions",
    description:
      "Make better mental health decisions. Find the right care, compare treatments, or build your practice stack with transparent pricing.",
    type: "website",
    url: "https://heypsych.com",
  },
  twitter: {
    images: ["/images/og/heypsych.png"],
    card: "summary_large_image",
    title: "HeyPsych | Make Better Mental Health Decisions",
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
    width: 512,
    height: 512,
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
 * Homepage — "Two worlds. One HeyPsych."
 *
 * The first viewport asks a single question and offers two illustrated
 * destinations: the patient and family support journey (/find-support) and
 * Practice Architect (/architect). Secondary discovery and the trust
 * explanation follow; the global footer carries legal and crisis information.
 *
 * Content counts are intentionally not shown here. Volume is not a reason to
 * trust the product, and hard-coded counts go stale.
 *
 * Rollback: with NAVIGATION_INVERSION=false the taxonomy-first hero returns
 * in place of the worlds.
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

      <div className="bg-canvas">
        {featureFlags.navigationInversion ? <HomeHero /> : <TaxonomyHero />}
        <DiscoveryNavigation />
        <TrustEditorial />
      </div>
    </>
  );
}

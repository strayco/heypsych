import type { Metadata } from "next";
import { Hero } from "@/components/homepage/Hero";
import { NavigationGrid } from "@/components/homepage/NavigationGrid";
import { TrendingTopics } from "@/components/homepage/TrendingTopics";
import { PsychTrail } from "@/components/homepage/PsychTrail";
import { ToolkitStrip } from "@/components/homepage/ToolkitStrip";

// SEO-optimized metadata for homepage
export const metadata: Metadata = {
  title: "HeyPsych - Mental Health Treatments, Medications & Therapy Guide",
  description:
    "Compare 500+ mental health treatments, medications, and therapies for depression, anxiety, ADHD, and more. Evidence-based, clinically reviewed information to guide your care.",
  openGraph: {
    title: "HeyPsych - Mental Health Treatments, Medications & Therapy Guide",
    description:
      "Compare 500+ mental health treatments, medications, and therapies for depression, anxiety, ADHD, and more. Evidence-based, clinically reviewed information.",
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
  description: "Evidence-based mental health treatment information and resources",
  sameAs: ["https://twitter.com/heypsych", "https://linkedin.com/company/heypsych"],
};

// WebSite schema for sitelinks search box
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://heypsych.com/#website",
  name: "HeyPsych",
  url: "https://heypsych.com",
  publisher: {
    "@id": "https://heypsych.com/#organization",
  },
};

/**
 * Homepage - FINAL APPROVED REDESIGN
 *
 * Implementation follows MASTER IMPLEMENTATION SPEC exactly.
 * No deviations permitted.
 *
 * Section Order (TOP → BOTTOM):
 * 1. Hero (Search + "Take me anywhere")
 * 2. Core Navigation Grid (2×2)
 * 3. Trending Topics (Discovery Tiles)
 * 4. Psych Trail (Coming Soon)
 * 5. Toolkit Strip (Optional)
 *
 * All sections use existing design system:
 * - Color tokens from Tailwind config
 * - Typography scale (existing)
 * - Spacing tokens (existing)
 * - Existing Card and Button components
 *
 * Design Aesthetic: "Apple-level clean" with:
 * - Increased whitespace (~20% more padding)
 * - Visual differentiation through background tones & spacing
 * - No new colors, shapes, or UI patterns
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

      {/* Homepage Sections - EXACT ORDER REQUIRED */}
      <div className="min-h-screen">
        {/* SECTION 1 - Hero (Search + "Take me anywhere") */}
        <Hero />

        {/* SECTION 2 - Core Navigation Grid (2×2) */}
        <NavigationGrid />

        {/* SECTION 3 - Trending Topics (Discovery Tiles) */}
        <TrendingTopics />

        {/* SECTION 4 - Psych Trail (Coming Soon) */}
        <PsychTrail />

        {/* SECTION 5 - Toolkit Strip (Optional but Preferred) */}
        <ToolkitStrip />
      </div>
    </>
  );
}

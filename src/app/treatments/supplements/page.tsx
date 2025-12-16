import { Metadata } from "next";
import { getSupplementsServer } from "@/lib/data/server-queries";
import { TreatmentsClient } from "@/components/pages/treatments-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Supplements hub page
 * Includes complete SEO metadata
 */

// Force dynamic rendering - this is an index page, not SEO-critical
// Prevents build-time database queries that can timeout
export const dynamic = 'force-dynamic';

// Generate SEO metadata for supplements hub page
export const metadata: Metadata = {
  title: "Mental Health Supplements | Omega-3, Vitamin D, SAMe & Evidence-Based Options | HeyPsych",
  description:
    "Evidence-based nutritional supplements for mental health including omega-3 fatty acids, vitamin D, SAMe, magnesium, and other supplements that may support well-being.",
  keywords:
    "mental health supplements, omega-3, fish oil, vitamin D, SAMe, magnesium, L-theanine, St John's wort, nutritional psychiatry, supplements for depression, supplements for anxiety",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/supplements`,
  },
  openGraph: {
    title: "Mental Health Supplements | HeyPsych",
    description:
      "Evidence-based supplements: omega-3, vitamin D, SAMe, magnesium, and other options for mental health.",
    url: `${SITE_CONFIG.url}/treatments/supplements`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Mental Health Supplements | HeyPsych",
    description: "Explore evidence-based supplements: omega-3, vitamin D, SAMe, and more.",
  },
};

export default async function SupplementsPage() {
  const treatments = await getSupplementsServer();

  return (
    <TreatmentsClient
      treatments={treatments}
      title="Supplements"
      description="Evidence-based nutritional supplements that may support mental health and well-being."
      showDisclaimer={true}
    />
  );
}

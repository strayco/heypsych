import { Metadata } from "next";
import { getAlternativeServer } from "@/lib/data/server-queries";
import { TreatmentsClient } from "@/components/pages/treatments-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Alternative treatments hub page
 * Includes complete SEO metadata
 */

// Generate SEO metadata for alternative treatments hub page
export const metadata: Metadata = {
  title: "Alternative Mental Health Treatments | Light Therapy, Acupuncture & More",
  description:
    "Evidence-based alternative treatments for mental health including bright light therapy, acupuncture, mindfulness practices, yoga, and other complementary approaches.",
  keywords:
    "alternative mental health treatment, light therapy, acupuncture, mindfulness, yoga therapy, complementary medicine, holistic mental health, meditation",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/alternative`,
  },
  openGraph: {
    title: "Alternative Mental Health Treatments",
    description:
      "Evidence-based alternative treatments: light therapy, acupuncture, mindfulness, and complementary approaches.",
    url: `${SITE_CONFIG.url}/treatments/alternative`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Alternative Mental Health Treatments",
    description: "Explore alternative treatments: light therapy, acupuncture, mindfulness, and more.",
  },
};

export default async function AlternativeTreatmentsPage() {
  const treatments = await getAlternativeServer();

  return (
    <TreatmentsClient
      treatments={treatments}
      title="Alternative Treatments"
      description="Evidence-based alternative treatments like bright light therapy, acupuncture, and mindfulness practices."
      showDisclaimer={true}
    />
  );
}

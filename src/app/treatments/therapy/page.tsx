import { Metadata } from "next";
import { getTherapiesServer } from "@/lib/data/server-queries";
import { TreatmentsClient } from "@/components/pages/treatments-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Therapy/psychotherapy treatments hub page
 * Includes complete SEO metadata
 */

// Generate SEO metadata for therapy hub page
export const metadata: Metadata = {
  title: "Psychotherapy Types | CBT, DBT, EMDR, Psychodynamic & More | HeyPsych",
  description:
    "Explore evidence-based psychotherapy approaches including CBT, DBT, EMDR, ACT, psychodynamic therapy, and other modalities for mental health treatment.",
  keywords:
    "psychotherapy, therapy types, CBT, cognitive behavioral therapy, DBT, dialectical behavior therapy, EMDR, ACT, psychodynamic therapy, talk therapy",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/therapy`,
  },
  openGraph: {
    title: "Psychotherapy Types | HeyPsych",
    description:
      "Evidence-based psychotherapy approaches: CBT, DBT, EMDR, ACT, and other modalities.",
    url: `${SITE_CONFIG.url}/treatments/therapy`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Psychotherapy Types | HeyPsych",
    description: "Explore psychotherapy approaches: CBT, DBT, EMDR, ACT, and more.",
  },
};

export default async function TherapyPage() {
  const treatments = await getTherapiesServer();

  return (
    <TreatmentsClient
      treatments={treatments}
      title="Therapy"
      description="Psychotherapy approaches including CBT, DBT, EMDR, and other evidence-based modalities for mental health."
      showDisclaimer={true}
    />
  );
}

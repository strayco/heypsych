import { Metadata } from "next";
import { getInvestigationalServer } from "@/lib/data/server-queries";
import { TreatmentsClient } from "@/components/pages/treatments-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Investigational treatments hub page
 * Includes complete SEO metadata
 */

// Generate SEO metadata for investigational treatments hub page
export const metadata: Metadata = {
  title:
    "Investigational Mental Health Treatments | Psilocybin, MDMA & Clinical Trials | HeyPsych",
  description:
    "Breakthrough investigational treatments in clinical trials including psilocybin therapy, MDMA-assisted therapy, ketamine, and other novel approaches for mental health.",
  keywords:
    "investigational treatments, clinical trials, psilocybin therapy, MDMA therapy, ketamine treatment, psychedelic therapy, breakthrough therapy, experimental mental health treatment",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/investigational`,
  },
  openGraph: {
    title: "Investigational Mental Health Treatments | HeyPsych",
    description:
      "Breakthrough investigational treatments: psilocybin, MDMA, ketamine, and other novel therapies in clinical trials.",
    url: `${SITE_CONFIG.url}/treatments/investigational`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Investigational Mental Health Treatments | HeyPsych",
    description:
      "Explore breakthrough therapies in clinical trials: psilocybin, MDMA, ketamine, and more.",
  },
};

export default async function InvestigationalTreatmentsPage() {
  const treatments = await getInvestigationalServer();

  return (
    <TreatmentsClient
      treatments={treatments}
      title="Investigational Treatments"
      description="Clinical trial treatments including psilocybin, MDMA, and other breakthrough therapies currently under research."
      showDisclaimer={true}
    />
  );
}

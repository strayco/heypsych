import { Metadata } from "next";
import { getInterventionalServer } from "@/lib/data/server-queries";
import { TreatmentsClient } from "@/components/pages/treatments-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Interventional treatments hub page
 * Includes complete SEO metadata
 */

// Generate SEO metadata for interventional treatments hub page
export const metadata: Metadata = {
  title: "Interventional Mental Health Treatments | TMS, ECT, DBS & Brain Stimulation | HeyPsych",
  description:
    "Brain stimulation and interventional treatments for treatment-resistant mental health conditions including TMS, ECT, deep brain stimulation, and VNS therapy.",
  keywords:
    "brain stimulation, TMS, transcranial magnetic stimulation, ECT, electroconvulsive therapy, deep brain stimulation, DBS, VNS, vagus nerve stimulation, treatment-resistant depression",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/interventional`,
  },
  openGraph: {
    title: "Interventional Mental Health Treatments | HeyPsych",
    description:
      "Brain stimulation treatments: TMS, ECT, deep brain stimulation, and VNS for treatment-resistant conditions.",
    url: `${SITE_CONFIG.url}/treatments/interventional`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Interventional Mental Health Treatments | HeyPsych",
    description: "Explore brain stimulation treatments: TMS, ECT, DBS, and VNS therapy.",
  },
};

export default async function InterventionalTreatmentsPage() {
  const treatments = await getInterventionalServer();

  return (
    <TreatmentsClient
      treatments={treatments}
      title="Interventional Treatments"
      description="Brain stimulation treatments like TMS, ECT, and deep brain stimulation for treatment-resistant conditions."
      showDisclaimer={true}
    />
  );
}

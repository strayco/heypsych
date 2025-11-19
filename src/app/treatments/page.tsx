import { Metadata } from "next";
import { getAllTreatmentsServer } from "@/lib/data/server-queries";
import { TreatmentsOverviewClient } from "@/components/pages/treatments-overview-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches all treatments on the server for instant page load
 * Includes complete SEO metadata for treatments hub page
 */

// Generate SEO metadata for treatments hub page
export const metadata: Metadata = {
  title: "Mental Health Treatments | Medications, Therapy & Evidence-Based Options | HeyPsych",
  description:
    "Explore evidence-based mental health treatments including medications, psychotherapy, interventional treatments, and alternative approaches. Find the right treatment option.",
  keywords:
    "mental health treatment, psychiatric medication, psychotherapy, therapy types, antidepressants, mood stabilizers, CBT, DBT, EMDR, TMS, ketamine therapy",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments`,
  },
  openGraph: {
    title: "Mental Health Treatments | HeyPsych",
    description:
      "Evidence-based mental health treatments: medications, psychotherapy, interventional options, and alternative approaches.",
    url: `${SITE_CONFIG.url}/treatments`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Mental Health Treatments | HeyPsych",
    description:
      "Explore evidence-based mental health treatments: medications, therapy, and interventional options.",
  },
};

export default async function TreatmentsPage() {
  const allTreatments = await getAllTreatmentsServer();

  return <TreatmentsOverviewClient allTreatments={allTreatments} />;
}

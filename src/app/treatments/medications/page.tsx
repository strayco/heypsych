import { Metadata } from "next";
import { getMedicationsServer } from "@/lib/data/server-queries";
import { MedicationsClient } from "@/components/pages/medications-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for medications hub page
 */

// Force dynamic rendering - this is an index page, not SEO-critical
// Prevents build-time database queries that can timeout
export const dynamic = 'force-dynamic';

// Generate SEO metadata for medications hub page
export const metadata: Metadata = {
  title: "Psychiatric Medications A-Z | Antidepressants, Mood Stabilizers & More | HeyPsych",
  description:
    "Complete guide to psychiatric medications including antidepressants, antipsychotics, mood stabilizers, anxiolytics, and stimulants. Learn about uses, side effects, and dosing.",
  keywords:
    "psychiatric medications, antidepressants, SSRI, SNRI, antipsychotics, mood stabilizers, benzodiazepines, stimulants, ADHD medication, anxiety medication",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/medications`,
  },
  openGraph: {
    title: "Psychiatric Medications A-Z | HeyPsych",
    description:
      "Complete guide to psychiatric medications: antidepressants, antipsychotics, mood stabilizers, and more.",
    url: `${SITE_CONFIG.url}/treatments/medications`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Psychiatric Medications A-Z | HeyPsych",
    description:
      "Evidence-based information on psychiatric medications: uses, side effects, and dosing.",
  },
};

export default async function MedicationsPage() {
  const medications = await getMedicationsServer();
  return <MedicationsClient medications={medications} />;
}

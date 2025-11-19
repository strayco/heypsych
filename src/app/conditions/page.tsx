import { Metadata } from "next";
import { getConditionsServer } from "@/lib/data/server-queries";
import { ConditionsOverviewClient } from "@/components/pages/conditions-overview-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches conditions on the server for instant page load
 * Includes complete SEO metadata for conditions hub page
 */

// Generate SEO metadata for conditions hub page
export const metadata: Metadata = {
  title: "Mental Health Conditions A-Z | Evidence-Based Information | HeyPsych",
  description:
    "Comprehensive, evidence-based information on mental health conditions including symptoms, diagnosis, treatment options, and support resources. Browse conditions A-Z.",
  keywords:
    "mental health conditions, psychiatric disorders, mental illness, depression, anxiety, ADHD, bipolar disorder, PTSD, schizophrenia, mental health diagnosis",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions`,
  },
  openGraph: {
    title: "Mental Health Conditions A-Z | HeyPsych",
    description:
      "Comprehensive, evidence-based information on mental health conditions including symptoms, diagnosis, treatment, and support.",
    url: `${SITE_CONFIG.url}/conditions`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Mental Health Conditions A-Z | HeyPsych",
    description:
      "Evidence-based information on mental health conditions: symptoms, diagnosis, treatment, and support.",
  },
};

export default async function ConditionsPage() {
  const conditions = await getConditionsServer();

  return <ConditionsOverviewClient conditions={conditions} />;
}

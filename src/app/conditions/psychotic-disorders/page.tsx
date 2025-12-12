import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for psychotic disorders hub page
 */

export const metadata: Metadata = {
  title: "Psychotic Disorders | Schizophrenia, Schizoaffective | HeyPsych",
  description:
    "Comprehensive guide to psychotic disorders including schizophrenia, schizoaffective disorder, delusional disorder, and evidence-based treatments.",
  keywords:
    "schizophrenia, psychosis, schizoaffective disorder, delusional disorder, psychotic disorders, antipsychotics, psychosis treatment",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/psychotic-disorders`,
  },
  openGraph: {
    title: "Psychotic Disorders | HeyPsych",
    description:
      "Comprehensive guide to psychotic disorders: symptoms, causes, and evidence-based treatments.",
    url: `${SITE_CONFIG.url}/conditions/psychotic-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Psychotic Disorders | HeyPsych",
    description:
      "Evidence-based information on psychotic disorders, symptoms, and treatment options.",
  },
};

const categoryConfig = {
  title: "Psychotic Disorders",
  emoji: "👁️",
  description: "Schizophrenia, schizoaffective disorder, delusional disorder, and psychotic conditions",
  gradient: "from-indigo-500 to-violet-500",
  iconColor: "text-indigo-600",
  bgColor: "bg-indigo-50",
};

export default async function PsychoticDisordersPage() {
  const conditions = await getConditionsByCategoryServer("psychotic-disorders");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

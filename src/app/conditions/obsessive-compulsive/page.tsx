import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for OCD and related disorders hub page
 */

export const metadata: Metadata = {
  title: "Obsessive-Compulsive Disorders | OCD, Body Dysmorphia | HeyPsych",
  description:
    "Comprehensive guide to obsessive-compulsive disorders including OCD, body dysmorphic disorder, hoarding, and evidence-based treatments like ERP therapy.",
  keywords:
    "OCD, obsessive compulsive disorder, body dysmorphic disorder, hoarding, trichotillomania, ERP therapy, OCD treatment",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/obsessive-compulsive`,
  },
  openGraph: {
    title: "Obsessive-Compulsive Disorders | HeyPsych",
    description:
      "Comprehensive guide to OCD and related disorders: symptoms, causes, and evidence-based treatments.",
    url: `${SITE_CONFIG.url}/conditions/obsessive-compulsive`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Obsessive-Compulsive Disorders | HeyPsych",
    description:
      "Evidence-based information on OCD, symptoms, and treatment options.",
  },
};

const categoryConfig = {
  title: "Obsessive & Compulsive",
  emoji: "🔄",
  description: "OCD, body dysmorphic disorder, hoarding, and repetitive behavior conditions",
  gradient: "from-teal-500 to-emerald-500",
  iconColor: "text-teal-600",
  bgColor: "bg-teal-50",
};

export default async function ObsessiveCompulsivePage() {
  const conditions = await getConditionsByCategoryServer("obsessive-compulsive");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for trauma disorders hub page
 */

export const metadata: Metadata = {
  title: "Trauma & Stress Disorders | PTSD, Acute Stress | HeyPsych",
  description:
    "Comprehensive guide to trauma and stress-related disorders including PTSD, acute stress disorder, adjustment disorders, and evidence-based treatments.",
  keywords:
    "PTSD, post-traumatic stress disorder, trauma, acute stress disorder, adjustment disorder, trauma treatment, trauma therapy",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/trauma-stress`,
  },
  openGraph: {
    title: "Trauma & Stress Disorders | HeyPsych",
    description:
      "Comprehensive guide to trauma disorders: symptoms, causes, and evidence-based treatments.",
    url: `${SITE_CONFIG.url}/conditions/trauma-stress`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Trauma & Stress Disorders | HeyPsych",
    description:
      "Evidence-based information on trauma disorders, symptoms, and treatment options.",
  },
};

const categoryConfig = {
  title: "Trauma & Stress",
  emoji: "💔",
  description: "PTSD, acute stress disorder, adjustment disorders, and trauma-related conditions",
  gradient: "from-red-500 to-rose-500",
  iconColor: "text-red-600",
  bgColor: "bg-red-50",
};

export default async function TraumaStressPage() {
  const conditions = await getConditionsByCategoryServer("trauma-stress");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

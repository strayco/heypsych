import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for dementia and memory disorders hub page
 */

export const metadata: Metadata = {
  title: "Dementia & Memory Disorders | Alzheimer's, Cognitive Decline | HeyPsych",
  description:
    "Comprehensive guide to dementia and memory disorders including Alzheimer's disease, vascular dementia, and evidence-based cognitive support treatments.",
  keywords:
    "dementia, Alzheimer's disease, memory loss, cognitive decline, memory disorders, dementia treatment, cognitive impairment",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/dementia-memory`,
  },
  openGraph: {
    title: "Dementia & Memory Disorders | HeyPsych",
    description:
      "Comprehensive guide to dementia and memory disorders: symptoms, causes, and care options.",
    url: `${SITE_CONFIG.url}/conditions/dementia-memory`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Dementia & Memory Disorders | HeyPsych",
    description:
      "Evidence-based information on dementia, memory loss, and care options.",
  },
};

const categoryConfig = {
  title: "Dementia & Memory",
  emoji: "🧠",
  description: "Alzheimer's disease, dementia, memory loss, and cognitive decline conditions",
  gradient: "from-violet-500 to-purple-500",
  iconColor: "text-violet-600",
  bgColor: "bg-violet-50",
};

export default async function DementiaMemoryPage() {
  const conditions = await getConditionsByCategoryServer("dementia-memory");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

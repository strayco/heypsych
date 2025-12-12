import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for mood disorders hub page
 */

export const metadata: Metadata = {
  title: "Mood & Depression Disorders | Bipolar, Major Depression | HeyPsych",
  description:
    "Comprehensive guide to mood disorders including major depressive disorder, bipolar disorder, seasonal depression, and evidence-based treatment options.",
  keywords:
    "depression, major depressive disorder, bipolar disorder, mood disorders, seasonal depression, dysthymia, depression treatment, mood stabilizers",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/mood-depression`,
  },
  openGraph: {
    title: "Mood & Depression Disorders | HeyPsych",
    description:
      "Comprehensive guide to mood disorders: symptoms, causes, and evidence-based treatments.",
    url: `${SITE_CONFIG.url}/conditions/mood-depression`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Mood & Depression Disorders | HeyPsych",
    description:
      "Evidence-based information on mood disorders, symptoms, and treatment options.",
  },
};

const categoryConfig = {
  title: "Mood & Depression",
  emoji: "💙",
  description: "Major depression, bipolar disorder, seasonal depression, and mood-related conditions",
  gradient: "from-blue-500 to-cyan-500",
  iconColor: "text-blue-600",
  bgColor: "bg-blue-50",
};

export default async function MoodDepressionPage() {
  const conditions = await getConditionsByCategoryServer("mood-depression");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

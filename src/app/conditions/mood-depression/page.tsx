import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";
import { getCategoryBySlug } from "@/lib/config/condition-categories";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for mood-depression hub page
 */

const fullCategoryConfig = getCategoryBySlug("mood-depression")!;
const { icon, ...categoryConfig } = fullCategoryConfig;

export const metadata: Metadata = {
  title: `${categoryConfig.displayTitle} | HeyPsych`,
  description: categoryConfig.description,
  keywords: categoryConfig.keywords.join(", "),
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/mood-depression`,
  },
  openGraph: {
    title: `${categoryConfig.displayTitle} | HeyPsych`,
    description: categoryConfig.description,
    url: `${SITE_CONFIG.url}/conditions/mood-depression`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${categoryConfig.displayTitle} | HeyPsych`,
    description: categoryConfig.description,
  },
};

export default async function MoodDepressionPage() {
  const conditions = await getConditionsByCategoryServer("mood-depression");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

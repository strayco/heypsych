import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";
import { getCategoryBySlug } from "@/lib/config/condition-categories";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for attention-learning hub page
 */

const fullCategoryConfig = getCategoryBySlug("attention-learning")!;
const { icon, ...categoryConfig } = fullCategoryConfig;

export const metadata: Metadata = {
  title: `${categoryConfig.displayTitle}`,
  description: categoryConfig.description,
  keywords: categoryConfig.keywords.join(", "),
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/attention-learning`,
  },
  openGraph: {
    title: `${categoryConfig.displayTitle}`,
    description: categoryConfig.description,
    url: `${SITE_CONFIG.url}/conditions/attention-learning`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${categoryConfig.displayTitle}`,
    description: categoryConfig.description,
  },
};

export default async function AttentionLearningPage() {
  const conditions = await getConditionsByCategoryServer("attention-learning");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

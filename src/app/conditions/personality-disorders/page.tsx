import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";
import { getCategoryBySlug } from "@/lib/config/condition-categories";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for personality-disorders hub page
 */

const fullCategoryConfig = getCategoryBySlug("personality-disorders")!;
const { icon, ...categoryConfig } = fullCategoryConfig;

export const metadata: Metadata = {
  title: `${categoryConfig.displayTitle}`,
  description: categoryConfig.description,
  keywords: categoryConfig.keywords.join(", "),
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/personality-disorders`,
  },
  openGraph: {
    title: `${categoryConfig.displayTitle}`,
    description: categoryConfig.description,
    url: `${SITE_CONFIG.url}/conditions/personality-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${categoryConfig.displayTitle}`,
    description: categoryConfig.description,
  },
};

export default async function PersonalityDisordersPage() {
  const conditions = await getConditionsByCategoryServer("personality-disorders");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

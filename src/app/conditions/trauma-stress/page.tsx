import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";
import { getCategoryBySlug } from "@/lib/config/condition-categories";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for trauma-stress hub page
 */

const fullCategoryConfig = getCategoryBySlug("trauma-stress")!;
const { icon, ...categoryConfig } = fullCategoryConfig;

export const metadata: Metadata = {
  title: `${categoryConfig.displayTitle} | HeyPsych`,
  description: categoryConfig.description,
  keywords: categoryConfig.keywords.join(", "),
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/trauma-stress`,
  },
  openGraph: {
    title: `${categoryConfig.displayTitle} | HeyPsych`,
    description: categoryConfig.description,
    url: `${SITE_CONFIG.url}/conditions/trauma-stress`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${categoryConfig.displayTitle} | HeyPsych`,
    description: categoryConfig.description,
  },
};

export default async function TraumaStressPage() {
  const conditions = await getConditionsByCategoryServer("trauma-stress");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

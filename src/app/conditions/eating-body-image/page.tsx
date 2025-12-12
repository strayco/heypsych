import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for eating disorders hub page
 */

export const metadata: Metadata = {
  title: "Eating & Body Image Disorders | Anorexia, Bulimia, Binge Eating | HeyPsych",
  description:
    "Comprehensive guide to eating disorders including anorexia nervosa, bulimia nervosa, binge eating disorder, and evidence-based recovery treatments.",
  keywords:
    "eating disorders, anorexia nervosa, bulimia, binge eating disorder, body image, eating disorder treatment, eating disorder recovery",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/eating-body-image`,
  },
  openGraph: {
    title: "Eating & Body Image Disorders | HeyPsych",
    description:
      "Comprehensive guide to eating disorders: symptoms, causes, and evidence-based recovery.",
    url: `${SITE_CONFIG.url}/conditions/eating-body-image`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Eating & Body Image Disorders | HeyPsych",
    description:
      "Evidence-based information on eating disorders, symptoms, and recovery options.",
  },
};

const categoryConfig = {
  title: "Eating & Body Image",
  emoji: "🍽️",
  description: "Anorexia, bulimia, binge eating disorder, and body image-related conditions",
  gradient: "from-pink-500 to-fuchsia-500",
  iconColor: "text-pink-600",
  bgColor: "bg-pink-50",
};

export default async function EatingBodyImagePage() {
  const conditions = await getConditionsByCategoryServer("eating-body-image");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

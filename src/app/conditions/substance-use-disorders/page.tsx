import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for substance use disorders hub page
 */

export const metadata: Metadata = {
  title: "Substance Use Disorders | Addiction, Alcohol, Drug Abuse | HeyPsych",
  description:
    "Comprehensive guide to substance use disorders including alcohol addiction, drug abuse, gambling addiction, and evidence-based recovery treatments.",
  keywords:
    "addiction, substance abuse, alcohol use disorder, drug addiction, recovery, rehabilitation, addiction treatment, opioid addiction",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/substance-use-disorders`,
  },
  openGraph: {
    title: "Substance Use Disorders | HeyPsych",
    description:
      "Comprehensive guide to addiction and substance use: symptoms, causes, and recovery options.",
    url: `${SITE_CONFIG.url}/conditions/substance-use-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Substance Use Disorders | HeyPsych",
    description:
      "Evidence-based information on addiction, substance abuse, and recovery options.",
  },
};

const categoryConfig = {
  title: "Substance Use Disorders",
  emoji: "🚫",
  description: "Alcohol, drug addiction, gambling addiction, and substance-related conditions",
  gradient: "from-amber-500 to-orange-500",
  iconColor: "text-amber-600",
  bgColor: "bg-amber-50",
};

export default async function SubstanceUseDisordersPage() {
  const conditions = await getConditionsByCategoryServer("substance-use-disorders");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

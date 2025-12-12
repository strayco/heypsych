import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for behavioral disorders hub page
 */

export const metadata: Metadata = {
  title: "Behavioral Disorders | Conduct Disorder, ODD | HeyPsych",
  description:
    "Comprehensive guide to behavioral disorders including conduct disorder, oppositional defiant disorder, and evidence-based behavioral interventions.",
  keywords:
    "behavioral disorders, conduct disorder, ODD, oppositional defiant disorder, disruptive behavior, behavioral therapy, child behavior",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/behavioral-disorders`,
  },
  openGraph: {
    title: "Behavioral Disorders | HeyPsych",
    description:
      "Comprehensive guide to behavioral disorders: symptoms, causes, and evidence-based interventions.",
    url: `${SITE_CONFIG.url}/conditions/behavioral-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Behavioral Disorders | HeyPsych",
    description:
      "Evidence-based information on behavioral disorders, symptoms, and interventions.",
  },
};

const categoryConfig = {
  title: "Behavioral Disorders",
  emoji: "⚡",
  description: "Conduct disorder, oppositional defiant disorder, and disruptive behavior conditions",
  gradient: "from-orange-500 to-red-500",
  iconColor: "text-orange-600",
  bgColor: "bg-orange-50",
};

export default async function BehavioralDisordersPage() {
  const conditions = await getConditionsByCategoryServer("behavioral-disorders");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

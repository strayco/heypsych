import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for personality disorders hub page
 */

export const metadata: Metadata = {
  title: "Personality Disorders | Borderline, Narcissistic, Antisocial | HeyPsych",
  description:
    "Comprehensive guide to personality disorders including borderline, narcissistic, antisocial, and other personality-related conditions with evidence-based treatments.",
  keywords:
    "personality disorders, borderline personality disorder, BPD, narcissistic personality disorder, antisocial personality, personality disorder treatment",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/personality-disorders`,
  },
  openGraph: {
    title: "Personality Disorders | HeyPsych",
    description:
      "Comprehensive guide to personality disorders: symptoms, causes, and evidence-based treatments.",
    url: `${SITE_CONFIG.url}/conditions/personality-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Personality Disorders | HeyPsych",
    description:
      "Evidence-based information on personality disorders, symptoms, and treatment options.",
  },
};

const categoryConfig = {
  title: "Personality Disorders",
  emoji: "🧩",
  description: "Borderline, narcissistic, antisocial, and other personality-related conditions",
  gradient: "from-slate-500 to-gray-500",
  iconColor: "text-slate-600",
  bgColor: "bg-slate-50",
};

export default async function PersonalityDisordersPage() {
  const conditions = await getConditionsByCategoryServer("personality-disorders");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

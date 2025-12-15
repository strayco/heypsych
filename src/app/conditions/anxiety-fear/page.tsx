import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for anxiety conditions hub page
 */

export const metadata: Metadata = {
  title: "Anxiety & Fear Disorders | Panic, Social Anxiety, Phobias | HeyPsych",
  description:
    "Comprehensive guide to anxiety and fear-related disorders including generalized anxiety, panic disorder, social anxiety, phobias, and evidence-based treatments.",
  keywords:
    "anxiety disorders, panic disorder, social anxiety, phobias, GAD, generalized anxiety disorder, anxiety treatment, anxiety symptoms",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/anxiety-fear`,
  },
  openGraph: {
    title: "Anxiety & Fear Disorders | HeyPsych",
    description:
      "Comprehensive guide to anxiety disorders: symptoms, causes, and evidence-based treatments.",
    url: `${SITE_CONFIG.url}/conditions/anxiety-fear`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Anxiety & Fear Disorders | HeyPsych",
    description:
      "Evidence-based information on anxiety disorders, symptoms, and treatment options.",
  },
};

const categoryConfig = {
  title: "Anxiety & Fear",
  emoji: "😰",
  description: "Generalized anxiety, panic disorder, social anxiety, phobias, and fear-based conditions",
  gradient: "from-yellow-500 to-orange-500",
  iconColor: "text-yellow-600",
  bgColor: "bg-yellow-50",
};

export default async function AnxietyFearPage() {
  const conditions = await getConditionsByCategoryServer("anxiety-fear");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

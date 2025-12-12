import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for ADHD and learning disorders hub page
 */

export const metadata: Metadata = {
  title: "ADHD & Learning Disorders | Attention, Focus, Dyslexia | HeyPsych",
  description:
    "Comprehensive guide to ADHD, learning disorders, focus issues, and cognitive development conditions with evidence-based treatment and support options.",
  keywords:
    "ADHD, attention deficit hyperactivity disorder, learning disorders, dyslexia, focus, concentration, ADHD treatment, learning disability",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/attention-learning`,
  },
  openGraph: {
    title: "ADHD & Learning Disorders | HeyPsych",
    description:
      "Comprehensive guide to ADHD and learning disorders: symptoms, diagnosis, and treatment options.",
    url: `${SITE_CONFIG.url}/conditions/attention-learning`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "ADHD & Learning Disorders | HeyPsych",
    description:
      "Evidence-based information on ADHD, learning disorders, and treatment options.",
  },
};

const categoryConfig = {
  title: "Attention & Learning",
  emoji: "🎯",
  description: "ADHD, learning disorders, focus issues, and cognitive development conditions",
  gradient: "from-purple-500 to-pink-500",
  iconColor: "text-purple-600",
  bgColor: "bg-purple-50",
};

export default async function AttentionLearningPage() {
  const conditions = await getConditionsByCategoryServer("attention-learning");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

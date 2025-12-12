import { Metadata } from "next";
import { getConditionsByCategoryServer } from "@/lib/data/server-queries";
import { ConditionsCategoryClient } from "@/components/pages/conditions-category-client";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches data on server for instant page load
 * Includes complete SEO metadata for autism and developmental disorders hub page
 */

export const metadata: Metadata = {
  title: "Autism & Developmental Disorders | ASD, Communication | HeyPsych",
  description:
    "Comprehensive guide to autism spectrum disorders, developmental delays, and communication disorders with evidence-based support and therapy options.",
  keywords:
    "autism, ASD, autism spectrum disorder, developmental disorders, communication disorders, autism therapy, developmental delay",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/autism-development`,
  },
  openGraph: {
    title: "Autism & Developmental Disorders | HeyPsych",
    description:
      "Comprehensive guide to autism and developmental disorders: symptoms, support, and therapy options.",
    url: `${SITE_CONFIG.url}/conditions/autism-development`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Autism & Developmental Disorders | HeyPsych",
    description:
      "Evidence-based information on autism, developmental disorders, and support options.",
  },
};

const categoryConfig = {
  title: "Autism & Development",
  emoji: "🧩",
  description: "Autism spectrum disorders, developmental delays, and communication disorders",
  gradient: "from-emerald-500 to-green-500",
  iconColor: "text-emerald-600",
  bgColor: "bg-emerald-50",
};

export default async function AutismDevelopmentPage() {
  const conditions = await getConditionsByCategoryServer("autism-development");
  return <ConditionsCategoryClient conditions={conditions} category={categoryConfig} />;
}

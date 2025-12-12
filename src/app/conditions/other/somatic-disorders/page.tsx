import { Metadata } from "next";
import { getOtherConditionsSubcategoryServer } from "@/lib/data/server-queries";
import { OtherSubcategoryClient } from "@/components/pages/other-subcategory-client";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Somatic Symptom Disorders | Health Anxiety | HeyPsych",
  description:
    "Comprehensive guide to somatic symptom disorders including illness anxiety disorder and conversion disorder with evidence-based treatments.",
  keywords:
    "somatic symptom disorder, health anxiety, illness anxiety, hypochondria, conversion disorder, psychosomatic",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/other/somatic-disorders`,
  },
  openGraph: {
    title: "Somatic Symptom Disorders | HeyPsych",
    description: "Comprehensive guide to somatic disorders: symptoms, causes, and treatment options.",
    url: `${SITE_CONFIG.url}/conditions/other/somatic-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

const config = {
  title: "Somatic Disorders",
  description: "Somatic symptom disorders and illness-related conditions affecting physical health perceptions.",
  icon: "stethoscope",
  iconColor: "text-green-600",
  bgColor: "from-green-50",
  gradient: "from-green-900 via-emerald-900 to-green-900",
};

export default async function SomaticDisordersPage() {
  const conditions = await getOtherConditionsSubcategoryServer("somatic-disorders");
  return <OtherSubcategoryClient conditions={conditions} config={config} />;
}

import { Metadata } from "next";
import { getOtherConditionsSubcategoryServer } from "@/lib/data/server-queries";
import { OtherSubcategoryClient } from "@/components/pages/other-subcategory-client";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Paraphilic Disorders | Clinical Information | HeyPsych",
  description:
    "Clinical information about paraphilic disorders with evidence-based treatment approaches and professional resources.",
  keywords:
    "paraphilic disorders, paraphilia, behavioral therapy, clinical treatment",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/other/paraphilic-disorders`,
  },
  openGraph: {
    title: "Paraphilic Disorders | HeyPsych",
    description: "Clinical guide to paraphilic disorders and treatment options.",
    url: `${SITE_CONFIG.url}/conditions/other/paraphilic-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

const config = {
  title: "Paraphilic Disorders",
  description: "Clinical information about paraphilic disorders and evidence-based treatment approaches.",
  icon: "eye",
  iconColor: "text-red-600",
  bgColor: "from-red-50",
  gradient: "from-red-900 via-rose-900 to-red-900",
};

export default async function ParaphilicDisordersPage() {
  const conditions = await getOtherConditionsSubcategoryServer("paraphilic-disorders");
  return <OtherSubcategoryClient conditions={conditions} config={config} />;
}

import { Metadata } from "next";
import { getOtherConditionsSubcategoryServer } from "@/lib/data/server-queries";
import { OtherSubcategoryClient } from "@/components/pages/other-subcategory-client";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Dissociative Disorders | DID, Dissociative Amnesia",
  description:
    "Comprehensive guide to dissociative disorders including dissociative identity disorder, amnesia, and depersonalization with evidence-based treatments.",
  keywords:
    "dissociative disorders, DID, dissociative identity disorder, dissociative amnesia, depersonalization, derealization",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/other/dissociative-disorders`,
  },
  openGraph: {
    title: "Dissociative Disorders",
    description: "Comprehensive guide to dissociative disorders: symptoms, causes, and treatment options.",
    url: `${SITE_CONFIG.url}/conditions/other/dissociative-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

const config = {
  title: "Dissociative Disorders",
  description: "Dissociative identity disorder, amnesia, depersonalization, and related conditions.",
  icon: "waves",
  iconColor: "text-cyan-600",
  bgColor: "from-cyan-50",
  gradient: "from-cyan-900 via-teal-900 to-cyan-900",
};

export default async function DissociativeDisordersPage() {
  const conditions = await getOtherConditionsSubcategoryServer("dissociative-disorders");
  return <OtherSubcategoryClient conditions={conditions} config={config} />;
}

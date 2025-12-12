import { Metadata } from "next";
import { getOtherConditionsSubcategoryServer } from "@/lib/data/server-queries";
import { OtherSubcategoryClient } from "@/components/pages/other-subcategory-client";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Sexual Health Disorders | Sexual Dysfunction | HeyPsych",
  description:
    "Comprehensive guide to sexual health disorders and dysfunctions with evidence-based treatment options and supportive resources.",
  keywords:
    "sexual dysfunction, sexual health, sexual disorders, intimacy issues, sexual therapy",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/other/sexual-disorders`,
  },
  openGraph: {
    title: "Sexual Health Disorders | HeyPsych",
    description: "Comprehensive guide to sexual health conditions and treatment options.",
    url: `${SITE_CONFIG.url}/conditions/other/sexual-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

const config = {
  title: "Sexual Health Disorders",
  description: "Sexual dysfunctions and sexual health-related conditions affecting intimacy and relationships.",
  icon: "heart",
  iconColor: "text-rose-600",
  bgColor: "from-rose-50",
  gradient: "from-rose-900 via-pink-900 to-rose-900",
};

export default async function SexualDisordersPage() {
  const conditions = await getOtherConditionsSubcategoryServer("sexual-disorders");
  return <OtherSubcategoryClient conditions={conditions} config={config} />;
}

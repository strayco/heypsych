import { Metadata } from "next";
import { getOtherConditionsSubcategoryServer } from "@/lib/data/server-queries";
import { OtherSubcategoryClient } from "@/components/pages/other-subcategory-client";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Gender Identity Conditions | Gender Dysphoria",
  description:
    "Comprehensive guide to gender identity conditions including gender dysphoria with supportive and affirming care information.",
  keywords:
    "gender dysphoria, gender identity, transgender health, gender-affirming care, gender therapy",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/other/gender-disorders`,
  },
  openGraph: {
    title: "Gender Identity Conditions",
    description: "Comprehensive guide to gender identity conditions and supportive care options.",
    url: `${SITE_CONFIG.url}/conditions/other/gender-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

const config = {
  title: "Gender Identity",
  description: "Gender dysphoria and gender identity-related conditions with affirming care information.",
  icon: "user",
  iconColor: "text-purple-600",
  bgColor: "from-purple-50",
  gradient: "from-purple-900 via-violet-900 to-purple-900",
};

export default async function GenderDisordersPage() {
  const conditions = await getOtherConditionsSubcategoryServer("gender-disorders");
  return <OtherSubcategoryClient conditions={conditions} config={config} />;
}

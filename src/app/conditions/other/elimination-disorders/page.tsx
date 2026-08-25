import { Metadata } from "next";
import { getOtherConditionsSubcategoryServer } from "@/lib/data/server-queries";
import { OtherSubcategoryClient } from "@/components/pages/other-subcategory-client";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Elimination Disorders | Enuresis, Encopresis",
  description:
    "Comprehensive guide to elimination disorders including enuresis (bedwetting) and encopresis with evidence-based treatments for children and adults.",
  keywords:
    "elimination disorders, enuresis, bedwetting, encopresis, bladder control, bowel control",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/other/elimination-disorders`,
  },
  openGraph: {
    title: "Elimination Disorders",
    description: "Comprehensive guide to elimination disorders: symptoms, causes, and treatment options.",
    url: `${SITE_CONFIG.url}/conditions/other/elimination-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

const config = {
  title: "Elimination Disorders",
  description: "Enuresis, encopresis, and elimination-related conditions affecting children and adults.",
  icon: "droplet",
  iconColor: "text-amber-600",
  bgColor: "from-amber-50",
  gradient: "from-amber-900 via-orange-900 to-amber-900",
};

export default async function EliminationDisordersPage() {
  const conditions = await getOtherConditionsSubcategoryServer("elimination-disorders");
  return <OtherSubcategoryClient conditions={conditions} config={config} />;
}

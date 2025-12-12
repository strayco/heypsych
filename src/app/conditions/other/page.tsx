import { Metadata } from "next";
import { OtherConditionsClient } from "@/components/pages/other-conditions-client";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Other Mental Health Conditions | Sleep, Sexual, Dissociative | HeyPsych",
  description:
    "Browse specialized mental health conditions including sleep disorders, sexual health, dissociative disorders, somatic conditions, and more.",
  keywords:
    "sleep disorders, sexual health, dissociative disorders, somatic disorders, elimination disorders, mental health conditions",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/other`,
  },
  openGraph: {
    title: "Other Mental Health Conditions | HeyPsych",
    description: "Specialized mental health conditions: sleep, sexual health, dissociative, and more.",
    url: `${SITE_CONFIG.url}/conditions/other`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

export default function OtherConditionsPage() {
  return <OtherConditionsClient />;
}

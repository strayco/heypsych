import { Metadata } from "next";
import { ResourcesOverviewClient } from "@/components/pages/resources-overview-client";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Mental Health Resources | Assessments, Tools & Support | HeyPsych",
  description:
    "Access mental health resources including validated assessments, digital tools, support communities, and educational guides. Free evidence-based resources.",
  keywords:
    "mental health resources, mental health assessments, support groups, mental health apps, therapy resources, wellness guides",
  alternates: {
    canonical: `${SITE_CONFIG.url}/resources`,
  },
  openGraph: {
    title: "Mental Health Resources | HeyPsych",
    description: "Free mental health assessments, tools, support communities, and educational resources.",
    url: `${SITE_CONFIG.url}/resources`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

export default function ResourcesPage() {
  return <ResourcesOverviewClient />;
}

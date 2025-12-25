import { Metadata } from "next";
import { getResourcesServer } from "@/lib/data/server-queries";
import { ResourcesOverviewClient } from "@/components/pages/resources-overview-client";
import { ResourcesAlphabeticalDirectory } from "@/components/resources/ResourcesAlphabeticalDirectory";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches resources on the server for instant page load
 * Includes complete SEO metadata for resources hub page
 */

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

export default async function ResourcesPage() {
  const resources = await getResourcesServer();

  return (
    <>
      <ResourcesOverviewClient resources={resources} />
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ResourcesAlphabeticalDirectory resources={resources} />
      </div>
    </>
  );
}

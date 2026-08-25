import { Metadata } from "next";
import { getResourcesServer } from "@/lib/data/server-queries";
import { ResourcesOverviewClient } from "@/components/pages/resources-overview-client";
import { ResourcesAlphabeticalDirectory } from "@/components/resources/ResourcesAlphabeticalDirectory";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches resources on the server for instant page load
 * Includes complete SEO metadata for resources hub page
 */

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  return {
    title: page > 1
      ? `Mental Health Resources (Page ${page}) | Assessments, Tools & Support`
      : "Mental Health Resources | Assessments, Tools & Support ",
    description:
      "Access mental health resources including validated assessments, digital tools, support communities, and educational guides. Free evidence-based resources.",
    keywords:
      "mental health resources, mental health assessments, support groups, mental health apps, therapy resources, wellness guides",
    alternates: {
      canonical: page === 1
        ? `${SITE_CONFIG.url}/resources`
        : `${SITE_CONFIG.url}/resources?page=${page}`,
    },
    openGraph: {
      title: page > 1
        ? `Mental Health Resources (Page ${page})`
        : "Mental Health Resources ",
      description: "Free mental health assessments, tools, support communities, and educational resources.",
      url: page === 1
        ? `${SITE_CONFIG.url}/resources`
        : `${SITE_CONFIG.url}/resources?page=${page}`,
      type: "website",
      siteName: SITE_CONFIG.name,
    },
  };
}

export default async function ResourcesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const resources = await getResourcesServer();

  return (
    <>
      <ResourcesOverviewClient resources={resources} />
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ResourcesAlphabeticalDirectory resources={resources} page={page} />
      </div>
    </>
  );
}

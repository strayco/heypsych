import { Metadata } from "next";
import { getResourcesByCategoryServer } from "@/lib/data/server-queries";
import { ArticlesBlogsHub } from "@/components/blocks/articles-blogs-hub";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Knowledge Hub | Mental Health Articles & Guides | HeyPsych",
  description:
    "Expert articles, research summaries, and practical guides on mental health topics. Evidence-based information from mental health professionals.",
  keywords:
    "mental health articles, psychology guides, mental health research, therapy guides, wellness articles",
  alternates: {
    canonical: `${SITE_CONFIG.url}/resources/knowledge-hub`,
  },
  openGraph: {
    title: "Knowledge Hub | HeyPsych",
    description: "Expert mental health articles, research summaries, and practical guides.",
    url: `${SITE_CONFIG.url}/resources/knowledge-hub`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

export default async function KnowledgeHubPage() {
  const allResources = await getResourcesByCategoryServer("knowledge-hub");
  
  // Filter out taxonomy slugs
  const blockedSlugs = new Set(["audiences", "authors", "formats", "topics"]);
  const resources = allResources.filter((r) => !blockedSlugs.has(r.slug));

  return <ArticlesBlogsHub resources={resources} showBackButton />;
}

import { Metadata } from "next";
import { getResourcesByCategoryServer } from "@/lib/data/server-queries";
import { ArticlesBlogsHub } from "@/components/blocks/articles-blogs-hub";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Articles & Guides | Mental Health Resources | HeyPsych",
  description:
    "Comprehensive collection of mental health articles and guides covering treatments, conditions, and wellness strategies.",
  keywords:
    "mental health articles, psychology guides, therapy guides, mental wellness, self-help guides",
  alternates: {
    canonical: `${SITE_CONFIG.url}/resources/articles-guides`,
  },
  openGraph: {
    title: "Articles & Guides | HeyPsych",
    description: "Comprehensive mental health articles and practical guides.",
    url: `${SITE_CONFIG.url}/resources/articles-guides`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

export default async function ArticlesGuidesPage() {
  // Fetch both knowledge-hub and articles-guides categories during transition
  const [knowledgeHub, articlesGuides] = await Promise.all([
    getResourcesByCategoryServer("knowledge-hub"),
    getResourcesByCategoryServer("articles-guides"),
  ]);
  
  // Combine and deduplicate by slug
  const seen = new Set<string>();
  const resources = [...knowledgeHub, ...articlesGuides].filter((r) => {
    if (seen.has(r.slug)) return false;
    seen.add(r.slug);
    return true;
  });

  return <ArticlesBlogsHub resources={resources} />;
}

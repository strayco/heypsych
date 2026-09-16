import { Metadata } from "next";
import { getResourcesByCategoryServer } from "@/lib/data/server-queries";
import { ArticlesBlogsHub } from "@/components/blocks/articles-blogs-hub";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Articles & Guides | Mental Health Resources",
  description:
    "Comprehensive collection of mental health articles and guides covering treatments, conditions, and wellness strategies.",
  keywords:
    "mental health articles, psychology guides, therapy guides, mental wellness, self-help guides",
  alternates: {
    canonical: `${SITE_CONFIG.url}/resources/articles-guides`,
  },
  openGraph: {
    title: "Articles & Guides",
    description: "Comprehensive mental health articles and practical guides.",
    url: `${SITE_CONFIG.url}/resources/articles-guides`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

export default async function ArticlesGuidesPage() {
  const resources = await getResourcesByCategoryServer("articles-guides");

  return <ArticlesBlogsHub resources={resources} />;
}

import { notFound } from "next/navigation";
import { ResourceDetailClient } from "@/components/resources/ResourceDetailClient";

interface KnowledgeHubArticlePageProps {
  params: Promise<{ segments?: string[] }>;
}

export default async function KnowledgeHubArticlePage({ params }: KnowledgeHubArticlePageProps) {
  const resolved = await params;
  const segments = resolved.segments;

  if (!segments || segments.length === 0) {
    notFound();
  }

  const slug = segments[segments.length - 1];

  if (!slug) {
    notFound();
  }

  return <ResourceDetailClient slug={slug} />;
}

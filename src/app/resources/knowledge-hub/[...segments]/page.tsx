import { notFound } from "next/navigation";
import { ResourceDetailClient } from "@/components/resources/ResourceDetailClient";
import { supabaseOptional } from "@/lib/config/database";
import { normalizeResource } from "@/lib/data/resource-normalizer";

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

  // Get database client - may be null during build without credentials
  const db = supabaseOptional();
  if (!db) {
    notFound();
  }

  // Fetch resource data server-side to prevent client-side navigation issues
  const { data, error } = await db
    .from("entities")
    .select("content, slug, status, metadata")
    .eq("type", "resource")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) {
    notFound();
  }

  // Normalize the resource properly
  // data.content contains the full JSON file content
  // data.metadata contains extracted metadata
  // We need to merge them and normalize to ensure body array exists
  const resource = normalizeResource(data.content);

  if (!resource) {
    notFound();
  }

  return <ResourceDetailClient slug={slug} entity={resource} />;
}

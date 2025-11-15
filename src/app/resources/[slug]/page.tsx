import { ResourceDetailClient } from "@/components/resources/ResourceDetailClient";

interface ResourceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const { slug } = await params;
  return <ResourceDetailClient slug={slug} />;
}

"use client";

import { useMemo } from "react";
import { useResources } from "@/lib/hooks/use-entities";
import { ArticlesBlogsHub } from "@/components/blocks/articles-blogs-hub";
import { logger } from "@/lib/utils/logger";

export default function KnowledgeHubPage() {
  const { data: allResources, isLoading, error } = useResources();

  // Filter for knowledge-hub category
  const resources = useMemo(() => {
    if (!allResources) return [];

    const blockedSlugs = new Set(["audiences", "authors", "formats", "topics"]);

    const deduped = new Map<string, any>();

    allResources.forEach((r: any) => {
      const category = r?.metadata?.category || r?.data?.metadata?.category;
      const slug = r?.slug || r?.data?.slug;

      if (!slug || blockedSlugs.has(slug)) {
        return;
      }

      if (category === "knowledge-hub" && !deduped.has(slug)) {
        deduped.set(slug, r);
      }
    });

    return Array.from(deduped.values());
  }, [allResources]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          <h1 className="text-2xl font-bold text-neutral-900">Loading Knowledge Hub...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    logger.error("Error loading knowledge-hub", error);
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error Loading Resources</h1>
          <p className="text-neutral-800">{error.message}</p>
        </div>
      </div>
    );
  }

  // Show debug info if no resources loaded
  if (!isLoading && resources.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="max-w-2xl rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-yellow-600">No Knowledge Hub Articles Found</h1>
          <div className="space-y-2 text-sm">
            <p><strong>Total resources loaded:</strong> {allResources?.length || 0}</p>
            <p><strong>Knowledge Hub articles:</strong> {resources.length}</p>
            <p className="mt-4 text-neutral-800">Check browser console for detailed logs.</p>
          </div>
        </div>
      </div>
    );
  }

  return <ArticlesBlogsHub resources={resources} showBackButton />;
}

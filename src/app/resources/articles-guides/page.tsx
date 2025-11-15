"use client";

import { useMemo } from "react";
import { useResources } from "@/lib/hooks/use-entities";
import { ArticlesBlogsHub } from "@/components/blocks/articles-blogs-hub";
import { logger } from "@/lib/utils/logger";

export default function ArticlesGuidesPage() {
  const { data: allResources, isLoading, error } = useResources();

  // Filter for knowledge-hub category (migrated from articles-guides)
  const resources = useMemo(() => {
    if (!allResources) return [];

    const filtered = allResources.filter((r: any) => {
      const category = r?.metadata?.category || r?.data?.metadata?.category;
      return category === "knowledge-hub" || category === "articles-guides"; // Support both during transition
    });

    // Debug log pillars
    const pillarCount: Record<string, number> = {};
    filtered.forEach((r: any) => {
      const pillar = r?.pillar || r?.data?.pillar || 'unknown';
      pillarCount[pillar] = (pillarCount[pillar] || 0) + 1;
    });

    logger.debug(`✅ Loaded ${filtered.length} Knowledge Hub articles:`, pillarCount);

    return filtered;
  }, [allResources]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          <h1 className="text-2xl font-bold text-neutral-900">Loading articles...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    logger.error("Error loading articles-guides", error);
  }

  return <ArticlesBlogsHub resources={resources} />;
}

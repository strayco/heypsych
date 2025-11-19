"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useResources } from "@/lib/hooks/use-entities";
import { ArticlesBlogsHub } from "@/components/blocks/articles-blogs-hub";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Card className="mx-4 w-full max-w-md">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Unable to load articles</h1>
            <p className="text-sm text-neutral-700">
              Please refresh the page or return to the resources hub.
            </p>
            <Link href="/resources">
              <Button className="mt-2">Back to Resources</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ArticlesBlogsHub resources={resources} />;
}

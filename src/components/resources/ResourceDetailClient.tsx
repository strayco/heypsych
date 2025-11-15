"use client";

import React from "react";
import { motion } from "framer-motion";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardCheck,
  Users,
  FileText,
  AlertTriangle,
  BookOpen,
  Smartphone,
  Info,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedContent } from "@/components/ui/parsed-content";
import { useResource } from "@/lib/hooks/use-resource";
import { getRenderer } from "@/components/resource-renderers";

type CategoryKey =
  | "assessments-screeners"
  | "support-community"
  | "articles-blogs"
  | "crisis-helplines"
  | "education-guides"
  | "digital-tools"
  | "knowledge-hub";

const CategoryIcon: Record<CategoryKey, React.ElementType> = {
  "assessments-screeners": ClipboardCheck,
  "support-community": Users,
  "articles-blogs": FileText,
  "crisis-helplines": AlertTriangle,
  "education-guides": BookOpen,
  "digital-tools": Smartphone,
  "knowledge-hub": BookOpen,
};

function ResourceHeader({ resource }: { resource: any }) {
  const categoryKey = resource.metadata?.category as CategoryKey | undefined;
  const Icon = categoryKey && CategoryIcon[categoryKey] ? CategoryIcon[categoryKey] : Info;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <CardTitle className="text-2xl">{String(resource.name ?? "")}</CardTitle>
                  {resource.validated && (
                    <Badge
                      variant="outline"
                      className="border-green-300 bg-green-50 text-green-700"
                    >
                      ✓ Validated
                    </Badge>
                  )}
                  {resource.free && (
                    <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
                      Free
                    </Badge>
                  )}
                </div>
                {resource.description && (
                  <div className="mb-3 text-neutral-900">
                    <ParsedContent content={String(resource.description)} />
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-neutral-800">
                  {resource.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{String(resource.duration)}</span>
                    </div>
                  )}
                  {resource.age_range && (
                    <div>
                      <span className="font-medium">Age:</span> {resource.age_range}
                    </div>
                  )}
                  {resource.administration && (
                    <div>
                      <span className="font-medium">Type:</span> {resource.administration}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              {categoryKey && <Badge className="mb-2">{categoryKey.replace("-", " ")}</Badge>}
            </div>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
}

interface ResourceDetailClientProps {
  slug: string;
}

export function ResourceDetailClient({ slug }: ResourceDetailClientProps) {
  const { data: resource, isLoading } = useResource(slug);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <div className="text-neutral-900">Loading resource…</div>
        </div>
      </div>
    );
  }

  if (!resource) notFound();

  const categoryKey = resource.metadata?.category;
  const Renderer = getRenderer(categoryKey);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Button>
        </motion.div>

        <ResourceHeader resource={resource} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <Renderer resource={resource} />
        </motion.div>
      </div>
    </div>
  );
}

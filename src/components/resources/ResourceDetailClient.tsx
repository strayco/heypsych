"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
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
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedContent } from "@/components/ui/parsed-content";
import { useResource } from "@/lib/hooks/use-resource";
import { getRenderer } from "@/components/resource-renderers";
import {
  AuthorByline,
  MedicalDisclaimer,
  ContentTimestamps,
} from "@/components/eat";

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

type CrossLink = {
  slug: string;
  type: 'condition' | 'treatment' | 'resource';
  display: string;
};

function CrossLinksSection({ crosslinks }: { crosslinks: CrossLink[] }) {
  if (!crosslinks || crosslinks.length === 0) return null;

  const conditions = crosslinks.filter(c => c.type === 'condition');
  const treatments = crosslinks.filter(c => c.type === 'treatment');
  const resources = crosslinks.filter(c => c.type === 'resource');

  return (
    <Card className="border-emerald-100 bg-emerald-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-emerald-900">Related Topics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {conditions.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-emerald-700">Conditions</div>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <Link
                  key={c.slug}
                  href={`/conditions/${c.slug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-200"
                >
                  {c.display}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        )}
        {treatments.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-emerald-700">Treatments</div>
            <div className="flex flex-wrap gap-2">
              {treatments.map((t) => (
                <Link
                  key={t.slug}
                  href={`/treatments/${t.slug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-tint px-3 py-1 text-sm font-medium text-accent-700 transition-colors hover:bg-accent-tint-hover"
                >
                  {t.display}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        )}
        {resources.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-emerald-700">Resources</div>
            <div className="flex flex-wrap gap-2">
              {resources.map((r) => (
                <Link
                  key={r.slug}
                  href={`/resources/${r.slug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 transition-colors hover:bg-purple-200"
                >
                  {r.display}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
                      className="border-positive-border bg-positive-tint text-positive-700"
                    >
                      ✓ Validated
                    </Badge>
                  )}
                  {resource.free && (
                    <Badge variant="outline" className="border-accent-border bg-accent-tint text-accent-700">
                      Free
                    </Badge>
                  )}
                </div>
                {resource.description && (
                  <div className="mb-3 text-label-primary">
                    <ParsedContent content={String(resource.description)} />
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-label-secondary">
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
  slug?: string;
  entity?: any;
}

export function ResourceDetailClient({ slug, entity }: ResourceDetailClientProps) {
  // If entity is provided, use it directly (server-side enhanced)
  // Otherwise, fetch via hook (backward compatibility)
  // Pass empty string when entity exists to disable the query
  const { data: fetchedResource, isLoading } = useResource(entity ? "" : (slug || ""));
  const resource = entity || fetchedResource;

  if (!entity && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <div className="text-label-primary">Loading resource…</div>
        </div>
      </div>
    );
  }

  if (!resource) notFound();

  // Build crosslinks from related slugs if not already present
  const buildCrosslinksFromSlugs = (res: any): Array<{ slug: string; type: 'condition' | 'treatment' | 'resource'; display: string }> => {
    if (res.crosslinks && res.crosslinks.length > 0) {
      return res.crosslinks;
    }

    const crosslinks: Array<{ slug: string; type: 'condition' | 'treatment' | 'resource'; display: string }> = [];
    const slugToDisplay = (slug: string) => slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const conditionSlugs = res.relatedConditionSlugs || res.data?.relatedConditionSlugs;
    const treatmentSlugs = res.relatedTreatmentSlugs || res.data?.relatedTreatmentSlugs;
    const resourceSlugs = res.relatedResourceSlugs || res.data?.relatedResourceSlugs;

    if (Array.isArray(conditionSlugs)) {
      for (const slug of conditionSlugs) {
        if (typeof slug === 'string' && slug.trim()) {
          crosslinks.push({ slug, type: 'condition', display: slugToDisplay(slug) });
        }
      }
    }

    if (Array.isArray(treatmentSlugs)) {
      for (const slug of treatmentSlugs) {
        if (typeof slug === 'string' && slug.trim()) {
          crosslinks.push({ slug, type: 'treatment', display: slugToDisplay(slug) });
        }
      }
    }

    if (Array.isArray(resourceSlugs)) {
      for (const slug of resourceSlugs) {
        if (typeof slug === 'string' && slug.trim()) {
          crosslinks.push({ slug, type: 'resource', display: slugToDisplay(slug) });
        }
      }
    }

    return crosslinks;
  };

  // Normalize entity structure for renderer
  // Resource is already normalized by server or hook
  const normalizedResource = {
    // Flatten server-side entity.data so renderers can read body/sections at the top level
    ...(resource?.data || {}),
    ...resource,
    // Map Knowledge Hub article metadata fields
    author: resource.author || resource.metadata?.author,
    reading_time: resource.reading_time || resource.metadata?.read_time,
    tags: resource.tags || resource.metadata?.topics,
    // Pass pre-validated tags from server (no client-side validation needed)
    validated_tags: resource.validated_tags || [],
    // Cross-links for related entities (build from slugs if not present)
    crosslinks: buildCrosslinksFromSlugs(resource),
    // Conditions for assessments
    conditions: resource.conditions || [],
  };

  const categoryKey = normalizedResource.metadata?.category || resource.category;
  const Renderer = getRenderer(categoryKey);

  // Determine if resource needs medical disclaimer (assessments, articles, guides)
  const needsMedicalDisclaimer = [
    'assessments-screeners',
    'articles-blogs',
    'education-guides',
    'knowledge-hub'
  ].includes(categoryKey);

  // Extract editorial metadata
  const metadata = resource?.metadata || {};
  const editorial = resource?.editorial || {};
  const author = editorial.author || metadata.author;
  const medicalReviewer = editorial.medicalReviewer || metadata.medical_reviewer;
  const timestamps = {
    published_date: editorial.dates?.published || metadata.published_date || resource.created_at,
    last_updated: editorial.dates?.lastUpdated || metadata.last_updated || resource.updated_at,
    last_reviewed: editorial.dates?.lastMedicallyReviewed || metadata.medical_review?.review_date || resource.updated_at,
  };

  return (
    <div className="min-h-screen bg-fill-quaternary">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </motion.div>

        <ResourceHeader resource={normalizedResource} />

        {/* Author & Review Information - ALWAYS SHOW for E-A-T compliance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <AuthorByline
            author={author}
            medicalReviewer={medicalReviewer}
            publishedDate={timestamps.published_date}
            lastUpdated={timestamps.last_updated}
            lastReviewed={timestamps.last_reviewed}
          />
        </motion.div>

        {/* Cross-links to related conditions/treatments */}
        {normalizedResource.crosslinks && normalizedResource.crosslinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <CrossLinksSection crosslinks={normalizedResource.crosslinks} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <Renderer resource={normalizedResource} />
        </motion.div>

        {/* Medical Disclaimer for medical resource types */}
        {needsMedicalDisclaimer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <MedicalDisclaimer
              config={{
                entity_type: categoryKey === 'assessments-screeners' ? 'assessment' : 'resource',
                prominent: false,
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

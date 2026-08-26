// SERVER COMPONENT - Condition Page with Static Generation + SEO
// Enables instant page loads for all conditions with complete schema.org metadata
//
// Features:
// - Static generation controlled by static-generation-policy
// - ISR with 24-hour revalidation for on-demand pages
// - Complete SEO metadata via MetadataFactory
// - Full schema.org stack via SchemaFactory (5 schemas per page)
// - Server-side data fetching (no client waterfalls)
//
// BUILD STRATEGY:
// - Production builds use on-demand ISR to avoid Supabase dependency
// - Sitemap completeness is independent of build-time generation
// - SEO indexability is determined by the central index-decision-service
// @see src/lib/build/static-generation-policy.ts

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MetadataFactory } from "@/lib/seo/metadata-factory";
import { SchemaFactory, safeJsonLd } from "@/lib/seo/schema-factory";
import { enhanceEntityContent } from "@/lib/linking/content-enhancer";
import ConditionClientWrapper from "./client-wrapper";
import { getEntityType } from "@/lib/utils/entity-type";
import { featureFlags } from "@/lib/config/feature-flags";
import {
  getNextStepsForEntity,
  createProviderQuestionsNextStep,
} from "@/domains/navigation/service";
import type { NextStep } from "@/domains/navigation/types";
import { getStaticParamsForRoute } from "@/lib/build/static-generation-policy";
import { getAllConditionSlugs } from "@/lib/conditions/condition-loader";
import {
  getEntityBySlug,
  isEntityFound,
  isEntityUnavailable,
} from "@/lib/data/entity-cache";

// Generate static params based on the centralized static generation policy
// In production builds with SSG_MODE=none (default), returns empty array
// This removes Supabase from the build critical path while preserving full SEO
// All pages are still rendered on-demand via ISR with complete HTML/metadata
export async function generateStaticParams() {
  return getStaticParamsForRoute("conditions", getAllConditionSlugs);
}

// Generate complete SEO metadata using MetadataFactory
// Includes: title, description, keywords, canonical, OpenGraph, Twitter Card
// Uses request-scoped cache to share entity data with page component
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getEntityBySlug(slug);

  // Handle database unavailability - return safe defaults without caching as 404
  if (isEntityUnavailable(result)) {
    console.error("[ConditionPage] Database unavailable for metadata:", slug);
    return {
      title: "Condition Information",
      description: "Learn about mental health conditions with evidence-based information.",
    };
  }

  // Entity not found - return appropriate defaults
  if (!isEntityFound(result)) {
    return {
      title: "Condition Information",
      description: "Learn about mental health conditions with evidence-based information.",
    };
  }

  const entity = result.entity;

  // Validate that this is actually a condition type
  const entityType = getEntityType(entity);
  if (entityType !== "condition") {
    return {
      title: "Not Found",
      description: "The requested page was not found.",
    };
  }

  // Use MetadataFactory to generate complete SEO metadata
  return await MetadataFactory.generate(entity);
}

// Server Component - Fetches data on server (or from request-scoped cache)
// Generates complete schema.org stack for SEO + inline links
// Entity is deduplicated with generateMetadata via React cache()
export default async function ConditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getEntityBySlug(slug);

  // Handle database unavailability - throw to trigger error boundary
  // This prevents caching a temporary failure as a permanent 404
  if (isEntityUnavailable(result)) {
    console.error("[ConditionPage] Database unavailable:", slug);
    throw new Error("Database temporarily unavailable");
  }

  // Entity not found - proper 404
  if (!isEntityFound(result)) {
    notFound();
  }

  const entity = result.entity;

  // Validate that this is actually a condition, not a treatment/resource/provider
  // Treatments should be at /treatments/[slug], resources at /resources/[slug]
  const entityType = getEntityType(entity);
  if (entityType !== "condition") {
    notFound();
  }

  // Content enhancement for automatic inline crosslinking
  // Detects entity names in content and injects {link:} syntax
  const enhancedEntity = await enhanceEntityContent(entity);

  // Generate complete schema.org stack (5 schemas):
  // 1. MedicalCondition (primary entity)
  // 2. MedicalWebPage (universal)
  // 3. BreadcrumbList (navigation)
  // 4. Person schemas (author + medical reviewer, if present)
  // 5. FAQPage (auto-generated or explicit)
  const schemas = SchemaFactory.generateAll(entity);

  // Fetch contextual next steps for Navigation V1
  // Currently enabled for OCD vertical slice when feature flags permit
  let nextSteps: NextStep[] = [];
  if (featureFlags.contextualNextSteps && featureFlags.ocdJourneyEnabled) {
    // For OCD vertical slice, fetch curated next steps
    if (slug === "obsessive-compulsive-disorder") {
      nextSteps = await getNextStepsForEntity("condition", slug, "patient");

      // Add provider questions as a next step if no assessment is available
      const hasAssessment = nextSteps.some((step) => step.kind === "assessment");
      if (!hasAssessment) {
        nextSteps.push(createProviderQuestionsNextStep(slug, entity.name || "OCD"));
      }
    }
  }

  return (
    <>
      {/* Inject schema.org JSON-LD into page head */}
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
        />
      ))}

      {/* Pass enhanced entity data to client component for interactivity */}
      {/* Entity names are automatically linked inline via {link:} syntax */}
      <ConditionClientWrapper entity={enhancedEntity} nextSteps={nextSteps} />
    </>
  );
}

// Revalidate every 24 hours (ISR)
// Pages are static but refresh daily for updated content
export const revalidate = 86400;

// Generate static pages at build time
// Allow dynamic slugs not in generateStaticParams
export const dynamicParams = true;

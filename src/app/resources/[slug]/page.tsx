// SERVER COMPONENT - Resource Page with Static Generation + SEO
// Enables instant page loads for all resources with complete schema.org metadata
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
import { SchemaFactory } from "@/lib/seo/schema-factory";
import { ResourceDetailClient } from "@/components/resources/ResourceDetailClient";
import { getStaticParamsForRoute } from "@/lib/build/static-generation-policy";
import { getAllResourceSlugs } from "@/lib/resources/resource-loader";
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
  return getStaticParamsForRoute("resources", getAllResourceSlugs);
}

// Generate complete SEO metadata using MetadataFactory
// Includes: title, description, keywords, canonical, OpenGraph, Twitter Card
// Automatically handles different resource categories
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
    console.error("[ResourcePage] Database unavailable for metadata:", slug);
    return {
      title: "Resource",
      description: "Mental health resources and tools.",
    };
  }

  // Entity not found - return appropriate defaults
  if (!isEntityFound(result)) {
    return {
      title: "Resource",
      description: "Mental health resources and tools.",
    };
  }

  const entity = result.entity;

  // Use MetadataFactory to generate complete SEO metadata
  // Routes to appropriate generator based on resource category
  return await MetadataFactory.generate(entity);
}

// Server Component - Fetches data on server (or from request-scoped cache)
// Generates complete schema.org stack for SEO + inline links
// Entity is deduplicated with generateMetadata via React cache()
export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getEntityBySlug(slug);

  // Handle database unavailability - throw to trigger error boundary
  // This prevents caching a temporary failure as a permanent 404
  if (isEntityUnavailable(result)) {
    console.error("[ResourcePage] Database unavailable:", slug);
    throw new Error("Database temporarily unavailable");
  }

  // Entity not found - proper 404
  if (!isEntityFound(result)) {
    notFound();
  }

  const entity = result.entity;

  // Content enhancement disabled for performance
  // Links are pre-generated in JSON files and synced to database
  // const enhancedEntity = await enhanceEntityContent(entity);
  const enhancedEntity = entity;

  // Generate complete schema.org stack (5 schemas):
  // 1. Primary schema (varies by category: MedicalRiskEstimator, SoftwareApplication, Article)
  // 2. MedicalWebPage (universal)
  // 3. BreadcrumbList (navigation)
  // 4. Person schemas (author + medical reviewer, if present)
  // 5. FAQPage (auto-generated or explicit)
  const schemas = SchemaFactory.generateAll(entity);

  return (
    <>
      {/* Inject schema.org JSON-LD into page head */}
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Pass enhanced entity to client component for rendering */}
      {/* Entity names are automatically linked inline via {link:} syntax */}
      <ResourceDetailClient entity={enhancedEntity} />
    </>
  );
}

// Revalidate every 24 hours (ISR)
// Pages are static but refresh daily for updated content
export const revalidate = 86400;

// Generate static pages at build time
// Allow dynamic slugs not in generateStaticParams
export const dynamicParams = true;

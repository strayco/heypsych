// SERVER COMPONENT - Resource Page with Static Generation + SEO
// Enables instant page loads for all resources with complete schema.org metadata
//
// Features:
// - Static generation via generateStaticParams()
// - ISR with 24-hour revalidation
// - Complete SEO metadata via MetadataFactory
// - Full schema.org stack via SchemaFactory (5 schemas per page)
// - Server-side data fetching (no client waterfalls)

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { EntityService } from "@/lib/data/entity-service";
import { supabase } from "@/lib/config/database";
import { MetadataFactory } from "@/lib/seo/metadata-factory";
import { SchemaFactory } from "@/lib/seo/schema-factory";
import { ResourceDetailClient } from "@/components/resources/ResourceDetailClient";

// Generate static params for all resources
// This pre-renders resource pages at build time
export async function generateStaticParams() {
  try {
    const { data: resources } = await supabase
      .from("entities")
      .select("slug")
      .eq("type", "resource")
      .eq("status", "active")
      .order("title")
      .limit(200);

    console.log(`📦 Generating ${resources?.length || 0} static resource pages`);

    return resources?.map((r) => ({ slug: r.slug })) || [];
  } catch (error) {
    console.error("Failed to generate static params for resources:", error);
    return [];
  }
}

// Generate complete SEO metadata using MetadataFactory
// Includes: title, description, keywords, canonical, OpenGraph, Twitter Card
// Automatically handles different resource categories
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const entity = await EntityService.getBySlug(slug);

    // Use MetadataFactory to generate complete SEO metadata
    // Routes to appropriate generator based on resource category
    return await MetadataFactory.generate(entity);
  } catch (error) {
    console.error("Failed to generate metadata for resource:", error);
    return {
      title: "Resource | HeyPsych",
      description: "Mental health resources and tools.",
    };
  }
}

// Server Component - Fetches data on server (or from cache)
// Generates complete schema.org stack for SEO
export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await EntityService.getBySlug(slug);

  if (!entity) {
    notFound();
  }

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

      {/* Pass slug to existing client component for backward compatibility */}
      {/* TODO: Refactor ResourceDetailClient to accept entity prop to avoid double fetch */}
      <ResourceDetailClient slug={slug} />
    </>
  );
}

// Revalidate every 24 hours (ISR)
// Pages are static but refresh daily for updated content
export const revalidate = 86400;

// Generate static pages at build time
// Allow dynamic slugs not in generateStaticParams
export const dynamicParams = true;

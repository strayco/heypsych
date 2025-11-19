// SERVER COMPONENT - Assessment Page with Static Generation + SEO
// Enables instant page loads for all assessments with complete schema.org metadata
//
// Features:
// - Static generation via generateStaticParams()
// - ISR with 24-hour revalidation
// - Complete SEO metadata via MetadataFactory
// - Full schema.org stack via SchemaFactory (5 schemas per page)
// - Server-side data fetching (no client waterfalls)
// - MedicalRiskEstimator schema for assessment tools

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { EntityService } from "@/lib/data/entity-service";
import { supabase } from "@/lib/config/database";
import { MetadataFactory } from "@/lib/seo/metadata-factory";
import { SchemaFactory } from "@/lib/seo/schema-factory";
import { getPageLinks } from "@/lib/linking/link-service";
import AssessmentDetailClient from "./client-wrapper";

// Generate static params for all assessments
// This pre-renders assessment pages at build time
export async function generateStaticParams() {
  try {
    const { data: assessments } = await supabase
      .from("entities")
      .select("slug")
      .eq("type", "resource")
      .eq("status", "active")
      .or("metadata->>category.eq.assessments-screeners,data->>category.eq.assessments-screeners")
      .order("title")
      .limit(100);

    console.log(`📦 Generating ${assessments?.length || 0} static assessment pages`);

    return assessments?.map((a) => ({ slug: a.slug })) || [];
  } catch (error) {
    console.error("Failed to generate static params for assessments:", error);
    return [];
  }
}

// Generate complete SEO metadata using MetadataFactory
// Includes: title, description, keywords, canonical, OpenGraph, Twitter Card
// Optimized for assessment screening tools (e.g., "GAD-7: Free Online Anxiety Tool")
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const entity = await EntityService.getBySlug(slug);

    // Use MetadataFactory to generate complete SEO metadata
    // ResourceMetadataGenerator handles assessment-specific formatting
    return await MetadataFactory.generate(entity);
  } catch (error) {
    console.error("Failed to generate metadata for assessment:", error);
    return {
      title: "Assessment Tool | HeyPsych",
      description: "Free online mental health assessment and screening tool.",
    };
  }
}

// Server Component - Fetches data on server (or from cache)
// Generates complete schema.org stack for SEO
export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = await EntityService.getBySlug(slug);

  if (!entity) {
    notFound();
  }

  // Generate complete schema.org stack (5 schemas):
  // 1. MedicalRiskEstimator (primary - assessment/screening tool)
  // 2. MedicalWebPage (universal)
  // 3. BreadcrumbList (navigation)
  // 4. Person schemas (author + medical reviewer, if present)
  // 5. FAQPage (auto-generated or explicit)
  const schemas = SchemaFactory.generateAll(entity);

  // Generate internal links for this assessment
  // Includes: related conditions, related treatments, other assessments
  const allEntities = await EntityService.getAll();
  const pageLinks = await getPageLinks(entity, allEntities);

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

      {/* Pass entity to client component for interactivity */}
      {/* Client component handles scoring, form state, and results display */}
      <AssessmentDetailClient entity={entity} pageLinks={pageLinks} />
    </>
  );
}

// Revalidate every 24 hours (ISR)
// Pages are static but refresh daily for updated content
export const revalidate = 86400;

// Generate static pages at build time
// Allow dynamic slugs not in generateStaticParams
export const dynamicParams = true;

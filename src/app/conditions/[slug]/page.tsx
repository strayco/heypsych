// SERVER COMPONENT - Condition Page with Static Generation + SEO
// Enables instant page loads for all conditions with complete schema.org metadata
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
import { getPageLinks } from "@/lib/linking/link-service";
import ConditionClientWrapper from "./client-wrapper";

// Generate static params for all conditions
// This pre-renders condition pages at build time
export async function generateStaticParams() {
  try {
    const { data: conditions } = await supabase
      .from("entities")
      .select("slug")
      .eq("type", "condition")
      .eq("status", "active")
      .order("title")
      .limit(200);

    console.log(`📦 Generating ${conditions?.length || 0} static condition pages`);

    return conditions?.map((c) => ({ slug: c.slug })) || [];
  } catch (error) {
    console.error("Failed to generate static params for conditions:", error);
    return [];
  }
}

// Generate complete SEO metadata using MetadataFactory
// Includes: title, description, keywords, canonical, OpenGraph, Twitter Card
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const entity = await EntityService.getBySlug(slug);

    // Use MetadataFactory to generate complete SEO metadata
    return await MetadataFactory.generate(entity);
  } catch (error) {
    console.error("Failed to generate metadata for condition:", error);
    return {
      title: "Condition Information | HeyPsych",
      description: "Learn about mental health conditions with evidence-based information.",
    };
  }
}

// Server Component - Fetches data on server (or from cache)
// Generates complete schema.org stack for SEO + internal links
export default async function ConditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await EntityService.getBySlug(slug);

  if (!entity) {
    notFound();
  }

  // Generate complete schema.org stack (5 schemas):
  // 1. MedicalCondition (primary entity)
  // 2. MedicalWebPage (universal)
  // 3. BreadcrumbList (navigation)
  // 4. Person schemas (author + medical reviewer, if present)
  // 5. FAQPage (auto-generated or explicit)
  const schemas = SchemaFactory.generateAll(entity);

  // Generate internal links (extract + allocate to slots)
  // Fetch all entities for link matching (cached in production)
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

      {/* Pass data + links to client component for interactivity */}
      {/* Data and links already fetched server-side, no client-side waterfall */}
      <ConditionClientWrapper entity={entity} pageLinks={pageLinks} />
    </>
  );
}

// Revalidate every 24 hours (ISR)
// Pages are static but refresh daily for updated content
export const revalidate = 86400;

// Generate static pages at build time
// Allow dynamic slugs not in generateStaticParams
export const dynamicParams = true;

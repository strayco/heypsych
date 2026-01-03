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
import { enhanceEntityContent } from "@/lib/linking/content-enhancer";
import ConditionClientWrapper from "./client-wrapper";
import { getEntityType } from "@/lib/utils/entity-type";

// Generate static params for ALL conditions
// Pre-renders all condition pages at build time for instant page loads
export async function generateStaticParams() {
  try {
    // Pre-render ALL condition pages at build time (~133 pages)
    // This ensures instant page loads from search results
    const { data: conditions } = await supabase
      .from("entities")
      .select("slug")
      .eq("type", "condition")
      .eq("status", "active")
      .order("title");
      // No limit - pre-render ALL for instant loads

    console.log(`📦 Generating ${conditions?.length || 0} static condition pages at build time`);

    return conditions?.map((c) => ({ slug: c.slug })) || [];
  } catch (error) {
    console.error("Failed to generate static params for conditions:", error);
    return []; // Graceful fallback - all pages will be on-demand
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

    if (!entity) {
      return {
        title: "Condition Information | HeyPsych",
        description: "Learn about mental health conditions with evidence-based information.",
      };
    }

    // Validate that this is actually a condition type
    const entityType = getEntityType(entity);
    if (entityType !== 'condition') {
      return {
        title: "Not Found | HeyPsych",
        description: "The requested page was not found.",
      };
    }

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
// Generates complete schema.org stack for SEO + inline links
export default async function ConditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await EntityService.getBySlug(slug);

  if (!entity) {
    notFound();
  }

  // Validate that this is actually a condition, not a treatment/resource/provider
  // Treatments should be at /treatments/[slug], resources at /resources/[slug]
  const entityType = getEntityType(entity);
  if (entityType !== 'condition') {
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

      {/* Pass enhanced entity data to client component for interactivity */}
      {/* Entity names are automatically linked inline via {link:} syntax */}
      <ConditionClientWrapper entity={enhancedEntity} />
    </>
  );
}

// Revalidate every 24 hours (ISR)
// Pages are static but refresh daily for updated content
export const revalidate = 86400;

// Generate static pages at build time
// Allow dynamic slugs not in generateStaticParams
export const dynamicParams = true;

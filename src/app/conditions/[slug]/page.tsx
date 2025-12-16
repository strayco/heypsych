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

// Generate static params for top conditions only
// Pre-renders a small number of critical pages at build time
// All other pages will be generated on-demand via dynamicParams=true + ISR
export async function generateStaticParams() {
  // Skip static generation during local builds to prevent Supabase connection timeouts
  // In production (Vercel), set ENABLE_BUILD_TIME_SSG=true to pre-render critical pages
  // All pages will still be generated on-demand with ISR (revalidate: 86400s)
  if (process.env.ENABLE_BUILD_TIME_SSG !== "true") {
    console.log("⚡ Skipping build-time static generation (ENABLE_BUILD_TIME_SSG not set)");
    console.log("⚡ All pages will be generated on-demand with ISR (revalidate: 86400s)");
    return [];
  }

  try {
    // Only pre-render the top 5 most important conditions at build time
    // All others will be generated on-demand with ISR (revalidate: 86400s)
    // This prevents build timeouts while maintaining SEO benefits
    const { data: conditions } = await supabase
      .from("entities")
      .select("slug")
      .eq("type", "condition")
      .eq("status", "active")
      .order("title")
      .limit(5); // Reduced from 200 to 5 to prevent build timeouts

    console.log(`📦 Generating ${conditions?.length || 0} static condition pages at build time`);
    console.log(`⚡ Other pages will be generated on-demand with ISR (revalidate: 86400s)`);

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

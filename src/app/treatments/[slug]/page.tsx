// SERVER COMPONENT - Treatment Page with Static Generation + SEO
// Enables instant page loads for all treatments with complete schema.org metadata
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
import TreatmentClientWrapper from "./client-wrapper";

// Generate static params for all treatments
// This pre-renders treatment pages at build time
export async function generateStaticParams() {
  try {
    const { data: treatments } = await supabase
      .from("entities")
      .select("slug")
      .in("type", [
        "medication",
        "therapy",
        "treatment",
        "interventional",
        "alternative",
        "supplement",
        "investigational",
      ])
      .eq("status", "active")
      .order("title")
      .limit(200);

    console.log(`📦 Generating ${treatments?.length || 0} static treatment pages`);

    return treatments?.map((t) => ({ slug: t.slug })) || [];
  } catch (error) {
    console.error("Failed to generate static params for treatments:", error);
    return [];
  }
}

// Generate complete SEO metadata using MetadataFactory
// Includes: title, description, keywords, canonical, OpenGraph, Twitter Card
// Automatically handles medication vs therapy vs treatment variants
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const entity = await EntityService.getBySlug(slug);

    // Use MetadataFactory to generate complete SEO metadata
    // Routes to appropriate generator (medication, therapy, or treatment)
    return await MetadataFactory.generate(entity);
  } catch (error) {
    console.error("Failed to generate metadata for treatment:", error);
    return {
      title: "Treatment Information | HeyPsych",
      description: "Learn about mental health treatments with evidence-based information.",
    };
  }
}

// Server Component - Fetches data on server (or from cache)
// Generates complete schema.org stack for SEO
export default async function TreatmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await EntityService.getBySlug(slug);

  if (!entity) {
    notFound();
  }

  // Generate complete schema.org stack (5 schemas):
  // 1. Primary schema (Drug, MedicalTherapy, or generic treatment)
  // 2. MedicalWebPage (universal)
  // 3. BreadcrumbList (navigation)
  // 4. Person schemas (author + medical reviewer, if present)
  // 5. FAQPage (auto-generated or explicit)
  const schemas = SchemaFactory.generateAll(entity);

  // Generate internal links for this treatment
  // Includes: conditions treated, related treatments, drug class links, alternatives
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

      {/* Pass data to client component for interactivity */}
      {/* Data is already fetched, no client-side waterfall */}
      <TreatmentClientWrapper entity={entity} pageLinks={pageLinks} />
    </>
  );
}

// Revalidate every 24 hours (ISR)
// Pages are static but refresh daily for updated content
export const revalidate = 86400;

// Generate static pages at build time
// Allow dynamic slugs not in generateStaticParams
export const dynamicParams = true;

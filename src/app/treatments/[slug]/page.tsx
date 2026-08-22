// SERVER COMPONENT - Treatment Page with Static Generation + SEO
// Enables instant page loads for all treatments with complete schema.org metadata
//
// Features:
// - Static generation via generateStaticParams()
// - ISR with 24-hour revalidation
// - Complete SEO metadata via MetadataFactory
// - Full schema.org stack via SchemaFactory (5 schemas per page)
// - Server-side data fetching (no client waterfalls)
//
// CANONICAL LOADING:
// - Uses treatment-loader.ts for all JSON access
// - Supports both V2 and V3 treatment formats
// - Handles slug resolution, aliases, and priority (-v2 > plain)

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MetadataFactory } from "@/lib/seo/metadata-factory";
import { SchemaFactory } from "@/lib/seo/schema-factory";
import { enhanceEntityContent } from "@/lib/linking/content-enhancer";
import TreatmentClientWrapper from "./client-wrapper";
import { getEntityType, isTreatmentType } from "@/lib/utils/entity-type";

// Canonical treatment loader - single source of truth
import { loadTreatment, getAllTreatmentSlugs } from "@/lib/comparison/treatment-loader";
import { treatmentV3ToEntity } from "@/lib/comparison/treatment-entity-adapter";

// Generate static params for ALL treatments
// Pre-renders all treatment pages at build time for instant page loads
export async function generateStaticParams() {
  try {
    // Use canonical loader to get all treatment slugs
    const slugs = getAllTreatmentSlugs();
    console.log(`📦 Generating ${slugs.length} static treatment pages at build time`);
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error("Failed to generate static params for treatments:", error);
    return []; // Graceful fallback - all pages will be on-demand
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

    // Use canonical loader - handles slug resolution, aliases, and format detection
    const treatment = await loadTreatment(slug);

    if (!treatment) {
      return {
        title: "Treatment Information | HeyPsych",
        description: "Learn about mental health treatments with evidence-based information.",
      };
    }

    // Convert to Entity format for MetadataFactory compatibility
    const entity = treatmentV3ToEntity(treatment);

    // Validate that this is actually a treatment type
    const entityType = getEntityType(entity);
    if (!isTreatmentType(entityType)) {
      return {
        title: "Not Found | HeyPsych",
        description: "The requested page was not found.",
      };
    }

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
// Generates complete schema.org stack for SEO + inline links
export default async function TreatmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Use canonical loader - handles slug resolution, aliases, V2/V3 detection
  const treatment = await loadTreatment(slug);

  if (!treatment) {
    notFound();
  }

  // Convert to Entity format for component compatibility
  const entity = treatmentV3ToEntity(treatment);

  // Validate that this is actually a treatment, not a resource/condition/provider
  // Resources should be at /resources/[slug], not /treatments/[slug]
  const entityType = getEntityType(entity);
  if (!isTreatmentType(entityType)) {
    notFound();
  }

  // Content enhancement for automatic inline crosslinking
  // Detects entity names in content and injects {link:} syntax
  const enhancedEntity = await enhanceEntityContent(entity);

  // Generate complete schema.org stack (5 schemas):
  // 1. Primary schema (Drug, MedicalTherapy, or generic treatment)
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
      <TreatmentClientWrapper entity={enhancedEntity} />
    </>
  );
}

// Revalidate every 24 hours (ISR)
// Pages are static but refresh daily for updated content
export const revalidate = 86400;

// Generate static pages at build time
// Allow dynamic slugs not in generateStaticParams
export const dynamicParams = true;

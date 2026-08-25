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
  // Use canonical loader to get all treatment slugs
  const slugs = getAllTreatmentSlugs();

  // With `dynamicParams = false`, this list IS the set of URLs that exist.
  // An empty list would therefore 404 every treatment page on the site, so a
  // failure to enumerate must break the build rather than ship a silent outage.
  if (slugs.length === 0) {
    throw new Error(
      "[Treatments] generateStaticParams enumerated 0 treatments. " +
        "Refusing to build, because dynamicParams=false would make every " +
        "treatment URL return 404. Check that data/treatments/ is present."
    );
  }

  console.log(`📦 Generating ${slugs.length} static treatment pages at build time`);
  return slugs.map((slug) => ({ slug }));
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
        title: "Treatment Information",
        description: "Learn about mental health treatments with evidence-based information.",
      };
    }

    // Convert to Entity format for MetadataFactory compatibility
    const entity = treatmentV3ToEntity(treatment);

    // Validate that this is actually a treatment type
    const entityType = getEntityType(entity);
    if (!isTreatmentType(entityType)) {
      return {
        title: "Not Found",
        description: "The requested page was not found.",
      };
    }

    // Use MetadataFactory to generate complete SEO metadata
    // Routes to appropriate generator (medication, therapy, or treatment)
    return await MetadataFactory.generate(entity);
  } catch (error) {
    console.error("Failed to generate metadata for treatment:", error);
    return {
      title: "Treatment Information",
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

// Treatment pages render only from local JSON, so generateStaticParams above
// enumerates every treatment that can exist. Refusing dynamic params makes an
// unknown slug 404 at the routing layer, before rendering begins.
//
// This matters because `loading.tsx` gives the segment a streamed shell: the
// response status is committed as 200 before the page body runs, so a
// `notFound()` inside the page could no longer change it. Unknown treatment
// URLs answered HTTP 200 with an empty skeleton, which Google classifies as a
// soft 404. Known alternate spellings are redirected earlier, in middleware.
export const dynamicParams = false;

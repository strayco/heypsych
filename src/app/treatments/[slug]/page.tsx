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
import { enhanceEntityContent } from "@/lib/linking/content-enhancer";
import TreatmentClientWrapper from "./client-wrapper";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

// Generate static params for top treatments only
// Pre-renders a small number of critical pages at build time
// All other pages will be generated on-demand via dynamicParams=true + ISR
export async function generateStaticParams() {
  try {
    // Only pre-render the top 5 most important treatments at build time
    // All others will be generated on-demand with ISR (revalidate: 86400s)
    // This prevents build timeouts while maintaining SEO benefits
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
      .limit(5); // Reduced from 200 to 5 to prevent build timeouts

    console.log(`📦 Generating ${treatments?.length || 0} static treatment pages at build time`);
    console.log(`⚡ Other pages will be generated on-demand with ISR (revalidate: 86400s)`);

    return treatments?.map((t) => ({ slug: t.slug })) || [];
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

    // Try loading v2 JSON first for all medications, then fallback to legacy/database
    let entity: any;
    const v2Result = await loadTreatmentFromJSON(`${slug}-v2`);
    if (v2Result) {
      entity = jsonToEntity(v2Result.data, v2Result.category, slug);
      console.log(`✅ [V2-METADATA] Loaded ${slug} from v2 JSON: data/treatments/${v2Result.category}/${slug}-v2.json`);
    } else {
      // Fallback to legacy JSON, then database
      const legacyResult = await loadTreatmentFromJSON(slug);
      entity = legacyResult ? jsonToEntity(legacyResult.data, legacyResult.category, slug) : await EntityService.getBySlug(slug);
      if (legacyResult) {
        console.log(`⚠️ [V2-METADATA] No v2 found for ${slug}, using legacy JSON`);
      } else {
        console.log(`⚠️ [V2-METADATA] No JSON found for ${slug}, using database`);
      }
    }
    
    if (!entity) {
      return {
        title: "Treatment Information | HeyPsych",
        description: "Learn about mental health treatments with evidence-based information.",
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

// Helper function to load treatment from JSON file (bypasses database)
async function loadTreatmentFromJSON(slug: string): Promise<any | null> {
  try {
    // Try to find the JSON file in any category
    const categories = ["medications", "therapy", "interventional", "alternative", "supplement", "investigational"];
    
    for (const category of categories) {
      // Try exact match first
      let filePath = join(process.cwd(), "data", "treatments", category, `${slug}.json`);
      if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath, "utf-8");
        const treatmentData = JSON.parse(fileContent);
        return { data: treatmentData, category };
      }
      
      // Try case-insensitive match (e.g., alprazolam-Xanax.json)
      const categoryPath = join(process.cwd(), "data", "treatments", category);
      if (existsSync(categoryPath)) {
        const files = readdirSync(categoryPath);

        // Try .json files first
        const matchingFile = files.find((f: string) => f.toLowerCase() === `${slug}.json`.toLowerCase());
        if (matchingFile) {
          filePath = join(categoryPath, matchingFile);
          const fileContent = readFileSync(filePath, "utf-8");
          const treatmentData = JSON.parse(fileContent);
          return { data: treatmentData, category };
        }

        // Fallback to .legacy.json files
        const legacyFile = files.find((f: string) => f.toLowerCase() === `${slug}.legacy.json`.toLowerCase());
        if (legacyFile) {
          filePath = join(categoryPath, legacyFile);
          const fileContent = readFileSync(filePath, "utf-8");
          const treatmentData = JSON.parse(fileContent);
          return { data: treatmentData, category };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading treatment from JSON for ${slug}:`, error);
    return null;
  }
}

// Helper to transform JSON data to Entity format
function jsonToEntity(treatmentData: any, category: string, slug: string): any {
  return {
    id: `json-${slug}`,
    name: treatmentData.name,
    title: treatmentData.name,
    slug: treatmentData.slug || slug,
    description: treatmentData.summary || treatmentData.description,
    content: treatmentData,
    data: treatmentData,
    metadata: {
      category: treatmentData.category || category,
      source: "json-file",
      file_category: category,
      discovered_at: new Date().toISOString(),
      ...treatmentData.metadata,
    },
    status: "active",
    schema: {
      schema_name: category,
      display_name: category.charAt(0).toUpperCase() + category.slice(1),
      entity_type: category === "medications" ? "medication" : "treatment",
    },
  };
}

// Server Component - Fetches data on server (or from cache)
// Generates complete schema.org stack for SEO + inline links
export default async function TreatmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Try loading v2 JSON first for all treatments, then fallback to legacy/database
  let entity: any;
  const v2Result = await loadTreatmentFromJSON(`${slug}-v2`);
  if (v2Result) {
    entity = jsonToEntity(v2Result.data, v2Result.category, slug);
    console.log(`✅ [V2] Loaded ${slug} from v2 JSON: data/treatments/${v2Result.category}/${slug}-v2.json`);
  } else {
    // Fallback to legacy JSON, then database
    const legacyResult = await loadTreatmentFromJSON(slug);
    if (legacyResult) {
      entity = jsonToEntity(legacyResult.data, legacyResult.category, slug);
      console.log(`⚠️ [V2] No v2 found for ${slug}, using legacy JSON from ${legacyResult.category}/${slug}.legacy.json`);
    } else {
      console.log(`⚠️ [V2] No JSON found for ${slug}, falling back to database`);
      entity = await EntityService.getBySlug(slug);
    }
  }

  if (!entity) {
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

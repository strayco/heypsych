// SERVER COMPONENT - Treatment Page with Static Generation
// Enables instant page loads for top 100 treatments
//
// Features:
// - Static generation via generateStaticParams()
// - ISR with 24-hour revalidation
// - SEO metadata generation
// - Server-side data fetching (no client waterfalls)

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { EntityService } from "@/lib/data/entity-service";
import { supabase } from "@/lib/config/database";
import TreatmentClientWrapper from "./client-wrapper";

// Generate static params for top 100 treatments
// This pre-renders these pages at build time
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
      ])
      .eq("status", "active")
      .order("name")
      .limit(100);

    console.log(`📦 Generating ${treatments?.length || 0} static treatment pages`);

    return treatments?.map((t) => ({ slug: t.slug })) || [];
  } catch (error) {
    console.error("Failed to generate static params:", error);
    return [];
  }
}

// Generate metadata for SEO
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
        title: "Treatment Not Found",
      };
    }

    const description =
      entity.description ||
      `Learn about ${entity.name} treatment, including how it works, side effects, and effectiveness.`;

    return {
      title: `${entity.name} - HeyPsych Treatment Guide`,
      description,
      openGraph: {
        title: `${entity.name} - HeyPsych Treatment Guide`,
        description,
        type: "article",
      },
    };
  } catch (error) {
    return {
      title: "Treatment Guide",
    };
  }
}

// Server Component - Fetches data on server (or from cache)
export default async function TreatmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await EntityService.getBySlug(slug);

  if (!entity) {
    notFound();
  }

  // Pass data to client component for interactivity
  // Data is already fetched, no client-side waterfall
  return <TreatmentClientWrapper entity={entity} />;
}

// Revalidate every 24 hours (ISR)
// Pages are static but refresh daily for updated content
export const revalidate = 86400;

// Generate static pages at build time
export const dynamicParams = true; // Allow dynamic slugs not in generateStaticParams

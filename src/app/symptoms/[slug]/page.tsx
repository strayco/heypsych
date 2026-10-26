/**
 * Symptom Detail Page
 *
 * Server-rendered, SEO-first, with full structured data. The page itself is
 * SymptomExperience (art bible §13): opening, a private "I've noticed this"
 * list, what it can look like, where it can come from, what it often comes
 * with, a screener, and when to get help.
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSymptomBySlug,
  getIndexableSymptoms,
  findSymptomBySlugOrAlias,
} from "@/domains/symptoms";
import { buildSymptomExperience } from "@/domains/symptoms/experience/model";
import { SymptomExperience } from "@/components/symptoms/experience/SymptomExperience";
import { generateSymptomMetadata } from "@/lib/seo/metadata-generators/symptom";
import { buildSymptomSchemas } from "@/lib/seo/schema-builders/symptom";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate static params for all indexable symptoms
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const symptoms = getIndexableSymptoms();
  return symptoms.map((s) => ({ slug: s.slug }));
}

/**
 * Generate metadata for this symptom page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const symptom = getSymptomBySlug(slug);

  if (!symptom) {
    return {
      title: "Symptom Not Found",
      robots: { index: false, follow: false },
    };
  }

  return generateSymptomMetadata(symptom);
}

/**
 * Symptom Detail Page Component
 */
export default async function SymptomDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Check for alias redirect
  const resolved = findSymptomBySlugOrAlias(slug);
  if (resolved && resolved.slug !== slug) {
    const { redirect } = await import("next/navigation");
    redirect(`/symptoms/${resolved.slug}`);
  }

  const symptom = getSymptomBySlug(slug);
  if (!symptom) {
    notFound();
  }

  const schemas = buildSymptomSchemas(symptom);

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div className="bg-canvas min-h-screen">
        <SymptomExperience symptom={buildSymptomExperience(symptom)} />
      </div>
    </>
  );
}

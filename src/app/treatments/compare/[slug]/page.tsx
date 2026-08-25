// SERVER COMPONENT - Comparison Page with Static Generation + SEO
// Enables instant page loads for treatment comparisons (e.g., "Lexapro vs Zoloft")
//
// Features:
// - Static generation via generateStaticParams()
// - ISR with 24-hour revalidation
// - Comparison-specific schema.org (ItemPage with Table)
// - FAQ schema for rich snippets
// - Apple-level visual design matching site aesthetic

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/seo/config";
import { ComparisonClientWrapper } from "./client-wrapper";

// Types for comparison JSON
interface ComparisonEntity {
  slug: string;
  name: string;
  generic_name?: string;
  drug_class?: string;
}

interface ComparisonRow {
  feature: string;
  entity_a: string;
  entity_b: string;
}

interface ComparisonSection {
  type: string;
  heading: string;
  content?: string;
  items?: string[];
  subsections?: {
    heading: string;
    content?: string;
    items?: string[];
  }[];
  recommendations?: {
    choose: string;
    when: string;
  }[];
}

interface ComparisonFAQ {
  q: string;
  a: string;
}

export interface ComparisonData {
  slug: string;
  type: string;
  name: string;
  title: string;
  description: string;
  metadata: {
    category: string;
    comparison_type: string;
    drug_class?: string;
  };
  entities: {
    entity_a: ComparisonEntity;
    entity_b: ComparisonEntity;
  };
  summary: {
    bottom_line: string;
    winner_for?: Record<string, string>;
  };
  comparison_table: {
    headers: string[];
    rows: ComparisonRow[];
  };
  sections: ComparisonSection[];
  faqs: ComparisonFAQ[];
  related_comparisons?: string[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  editorial: {
    medicalReviewerIds: string[];
    reviewBoard: string;
    lastReviewed: string;
    lastUpdated: string;
  };
}

// Get comparison data from JSON file
function getComparisonData(slug: string): ComparisonData | null {
  const filePath = join(process.cwd(), "data/treatments/compare", `${slug}.json`);
  
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content) as ComparisonData;
  } catch (error) {
    console.error(`Failed to read comparison file: ${slug}`, error);
    return null;
  }
}

// Get all comparison slugs for static generation
function getAllComparisonSlugs(): string[] {
  const comparePath = join(process.cwd(), "data/treatments/compare");
  
  if (!existsSync(comparePath)) {
    return [];
  }
  
  try {
    const files = readdirSync(comparePath);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch (error) {
    console.error("Failed to read comparison directory", error);
    return [];
  }
}

// Generate static params for all comparisons
export async function generateStaticParams() {
  const slugs = getAllComparisonSlugs();
  console.log(`📦 Generating ${slugs.length} static comparison pages at build time`);
  return slugs.map((slug) => ({ slug }));
}

// Generate SEO metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getComparisonData(slug);
  
  if (!data) {
    return {
      title: "Treatment Comparison",
      description: "Compare mental health treatments side by side.",
    };
  }
  
  return {
    title: data.seo.title,
    description: data.seo.description,
    keywords: data.seo.keywords.join(", "),
    alternates: {
      canonical: `${SITE_CONFIG.url}/treatments/compare/${slug}`,
    },
    openGraph: {
      title: data.seo.title,
      description: data.seo.description,
      url: `${SITE_CONFIG.url}/treatments/compare/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: data.seo.title,
      description: data.seo.description,
    },
  };
}

// Generate schema.org structured data
function generateSchemas(data: ComparisonData): Record<string, unknown>[] {
  const pageUrl = `${SITE_CONFIG.url}/treatments/compare/${data.slug}`;
  
  // ItemPage schema with comparison table
  const itemPageSchema = {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    "@id": `${pageUrl}#page`,
    name: data.title,
    description: data.description,
    url: pageUrl,
    mainEntity: {
      "@type": "Table",
      about: `Comparison of ${data.entities.entity_a.name} vs ${data.entities.entity_b.name}`,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".bottom-line", ".comparison-table", "h1"],
    },
  };
  
  // MedicalWebPage schema
  const medicalWebPageSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": `${pageUrl}#webpage`,
    name: data.title,
    url: pageUrl,
    description: data.description,
    inLanguage: "en-US",
    lastReviewed: data.editorial.lastReviewed,
    dateModified: data.editorial.lastUpdated,
    specialty: "Psychiatry",
    audience: {
      "@type": "MedicalAudience",
      audienceType: "Patient",
    },
  };
  
  // FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: data.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
  
  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_CONFIG.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Treatments",
        item: `${SITE_CONFIG.url}/treatments`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Compare",
        item: `${SITE_CONFIG.url}/treatments/compare`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: data.name,
        item: pageUrl,
      },
    ],
  };
  
  return [itemPageSchema, medicalWebPageSchema, faqSchema, breadcrumbSchema];
}

// Main page component
export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getComparisonData(slug);
  
  if (!data) {
    notFound();
  }
  
  const schemas = generateSchemas(data);
  
  return (
    <>
      {/* Schema.org JSON-LD */}
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      
      <ComparisonClientWrapper data={data} />
    </>
  );
}

// Revalidate every 24 hours
export const revalidate = 86400;

// Allow dynamic slugs not in generateStaticParams
export const dynamicParams = true;

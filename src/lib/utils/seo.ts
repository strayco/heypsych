// src/lib/utils/seo.ts
import type { Metadata } from "next";

interface ResourceSEO {
  title?: string;
  description?: string;
  keywords?: string[];
}

interface Resource {
  name: string;
  description?: string;
  slug: string;
  metadata?: {
    category?: string;
  };
  seo?: ResourceSEO;
  [key: string]: any;
}

const SITE_NAME = "HeyPsych";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://heypsych.com";

/**
 * Generate metadata for a resource detail page
 */
export function generateResourceMetadata(resource: Resource): Metadata {
  const category = resource.metadata?.category || "resources";
  const categoryName = category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" & ");

  const title = resource.seo?.title || `${resource.name} | ${categoryName} | ${SITE_NAME}`;
  const description =
    resource.seo?.description ||
    resource.description ||
    `Learn about ${resource.name} on ${SITE_NAME}`;
  const keywords = resource.seo?.keywords || [];

  const url = `${SITE_URL}/resources/${resource.slug}`;

  return {
    title,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Generate structured data (schema.org) for resources
 */
export function generateResourceStructuredData(resource: Resource) {
  const category = resource.metadata?.category || "resource";

  // Base structured data
  const baseData = {
    "@context": "https://schema.org",
    "@type": getSchemaType(category),
    name: resource.name,
    description: resource.description,
    url: `${SITE_URL}/resources/${resource.slug}`,
  };

  // Add category-specific fields
  switch (category) {
    case "assessments-screeners":
      return {
        ...baseData,
        "@type": "MedicalRiskEstimator",
        estimatesRiskOf: resource.conditions?.[0] || "Mental health condition",
        includedRiskFactor: resource.tags || [],
      };

    case "crisis-helplines":
      return {
        ...baseData,
        "@type": "EmergencyService",
        telephone: resource.phone,
        areaServed: resource.coverage_area,
        availableLanguage: resource.languages || ["English"],
        hoursAvailable: resource.hours,
      };

    case "knowledge-hub":
      return {
        ...baseData,
        "@type": "Article",
        headline: resource.name,
        author: resource.authors?.[0] || resource.author
          ? {
              "@type": "Person",
              name: resource.authors?.[0] || resource.author,
            }
          : undefined,
        datePublished: resource.publishedAt,
        dateModified: resource.updatedAt || resource.publishedAt,
      };

    case "education-guides":
      return {
        ...baseData,
        "@type": "HowTo",
        step:
          resource.learning_objectives?.map((obj: string, i: number) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: obj,
          })) || [],
      };

    case "digital-tools":
      return {
        ...baseData,
        "@type": "SoftwareApplication",
        applicationCategory: "HealthApplication",
        operatingSystem: resource.platforms?.join(", "),
        aggregateRating: resource.app_rating
          ? {
              "@type": "AggregateRating",
              ratingValue: resource.app_rating,
              reviewCount: resource.total_reviews,
            }
          : undefined,
      };

    case "support-community":
      return {
        ...baseData,
        "@type": "Organization",
        contactPoint:
          resource.phone || resource.website
            ? {
                "@type": "ContactPoint",
                telephone: resource.phone,
                url: resource.website,
              }
            : undefined,
      };

    default:
      return baseData;
  }
}

/**
 * Map resource category to schema.org type
 */
function getSchemaType(category: string): string {
  const typeMap: Record<string, string> = {
    "assessments-screeners": "MedicalRiskEstimator",
    "crisis-helplines": "EmergencyService",
    "knowledge-hub": "Article",
    "education-guides": "HowTo",
    "digital-tools": "SoftwareApplication",
    "support-community": "Organization",
  };

  return typeMap[category] || "WebPage";
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(resource: Resource) {
  const category = resource.metadata?.category || "resources";
  const categoryName = category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" & ");

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Resources",
        item: `${SITE_URL}/resources`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `${SITE_URL}/resources/${category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: resource.name,
        item: `${SITE_URL}/resources/${resource.slug}`,
      },
    ],
  };
}

/**
 * Generate FAQ structured data for assessment resources
 */
export function generateAssessmentFAQStructuredData(resource: Resource) {
  if (resource.metadata?.category !== "assessments-screeners") {
    return null;
  }

  const questions = resource.questions || resource.items || [];
  if (questions.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.slice(0, 5).map((q: any) => ({
      "@type": "Question",
      name: q.text || q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: `This is part of the ${resource.name} assessment. Please complete the full assessment for interpretation.`,
      },
    })),
  };
}

/**
 * Combine all structured data for a resource
 */
export function getAllStructuredData(resource: Resource): Array<Record<string, any>> {
  const data: Array<Record<string, any>> = [
    generateResourceStructuredData(resource),
    generateBreadcrumbStructuredData(resource),
  ];

  const faqData = generateAssessmentFAQStructuredData(resource);
  if (faqData) {
    data.push(faqData);
  }

  return data;
}

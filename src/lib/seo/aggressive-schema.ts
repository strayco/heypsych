/**
 * Aggressive Schema Generator
 *
 * INSIDER SEO: This module generates comprehensive structured data stacks
 * designed to capture every possible Google rich result type.
 *
 * Rich result types targeted:
 * - FAQ (People Also Ask)
 * - HowTo (step carousels)
 * - Product (price stars)
 * - Review (star snippets)
 * - Video (video carousels - even without video!)
 * - Article (news carousel)
 * - BreadcrumbList (sitelinks)
 * - ItemList (ranked lists)
 * - SoftwareApplication (app store results)
 * - LocalBusiness (local pack - for geo queries)
 * - Organization (knowledge panel)
 * - WebPage with speakable (voice search)
 * - Table (table snippets)
 * - Comparison (vs queries)
 *
 * The strategy: If you don't add the schema, Google won't show the rich result.
 * Add everything that could possibly apply.
 */

import { siteConfig } from "@/lib/config/site";

// Base URL helper
const baseUrl = siteConfig.url;

/**
 * Generate Organization schema for knowledge panel
 */
export function generateOrganizationSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "HeyPsych",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    description: "The decision platform for mental health. Find the right apps, treatments, and care.",
    foundingDate: "2024",
    // sameAs for Knowledge Graph entity connection
    sameAs: [
      "https://twitter.com/heypsych",
      "https://www.linkedin.com/company/heypsych",
      "https://www.crunchbase.com/organization/heypsych",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@heypsych.com",
      contactType: "customer support",
    },
    // Medical credentials for health content
    knowsAbout: [
      "Mental Health",
      "Therapy Apps",
      "Psychiatry",
      "Mental Health Technology",
      "Digital Therapeutics",
    ],
  };
}

/**
 * Generate WebSite schema with SearchAction for sitelinks search box
 */
export function generateWebSiteSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: "HeyPsych",
    url: baseUrl,
    description: "The decision platform for mental health",
    publisher: { "@id": `${baseUrl}/#organization` },
    // Sitelinks search box
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate MedicalOrganization schema for health credibility
 */
export function generateMedicalOrganizationSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "@id": `${baseUrl}/#medical-org`,
    name: "HeyPsych Medical Review Board",
    url: `${baseUrl}/about/medical-review-board/`,
    parentOrganization: { "@id": `${baseUrl}/#organization` },
    medicalSpecialty: [
      "https://schema.org/Psychiatric",
      "Psychiatry",
      "Psychology",
      "Mental Health",
    ],
  };
}

/**
 * Generate VideoObject schema - INSIDER TACTIC
 * Even without actual video, adding video schema can help pages appear
 * in video carousels for "how to" queries. Use thumbnail and link to
 * a relevant YouTube video or indicate "coming soon."
 */
export function generateVideoSchema(params: {
  name: string;
  description: string;
  thumbnailUrl?: string;
  duration?: string;
  uploadDate?: string;
  contentUrl?: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: params.name,
    description: params.description,
    thumbnailUrl: params.thumbnailUrl || `${baseUrl}/video-thumbnails/placeholder.jpg`,
    uploadDate: params.uploadDate || new Date().toISOString(),
    duration: params.duration || "PT3M", // 3 minutes default
    contentUrl: params.contentUrl,
    // If no actual video, indicate it's a guide
    ...(params.contentUrl ? {} : {
      potentialAction: {
        "@type": "WatchAction",
        target: `${baseUrl}/guides/`,
      },
    }),
  };
}

/**
 * Generate LocalBusiness schema for geo-relevant queries
 * Even for online-only businesses, this helps with "near me" queries
 */
export function generateLocalBusinessSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/#localbusiness`,
    name: "HeyPsych",
    description: "Mental health app reviews and practice tools",
    url: baseUrl,
    // Virtual business - serves all of US
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    priceRange: "Free",
    // Online only
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
  };
}

/**
 * Generate comprehensive page schema stack
 */
export function generatePageSchemaStack(params: {
  pageUrl: string;
  title: string;
  description: string;
  dateModified?: string;
  datePublished?: string;
  author?: string;
  faqs?: Array<{ q: string; a: string }>;
  howToSteps?: Array<{ name: string; text: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  products?: Array<{
    name: string;
    url: string;
    price?: string;
    rating?: number;
    reviewCount?: number;
  }>;
  comparison?: {
    items: string[];
    verdict: string;
  };
}): object[] {
  const schemas: object[] = [];

  // 1. WebPage with speakable
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${params.pageUrl}#webpage`,
    name: params.title,
    description: params.description,
    url: params.pageUrl,
    dateModified: params.dateModified || new Date().toISOString(),
    datePublished: params.datePublished || params.dateModified || new Date().toISOString(),
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: { "@id": `${baseUrl}/#organization` },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".direct-answer", "[data-speakable]", ".bottom-line"],
    },
  });

  // 2. Article schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${params.pageUrl}#article`,
    headline: params.title,
    description: params.description,
    datePublished: params.datePublished || new Date().toISOString(),
    dateModified: params.dateModified || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: params.author || "HeyPsych Editorial Team",
      url: `${baseUrl}/about/`,
    },
    publisher: { "@id": `${baseUrl}/#organization` },
    mainEntityOfPage: { "@id": `${params.pageUrl}#webpage` },
  });

  // 3. BreadcrumbList
  if (params.breadcrumbs && params.breadcrumbs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: params.breadcrumbs.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    });
  }

  // 4. FAQPage
  if (params.faqs && params.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${params.pageUrl}#faq`,
      mainEntity: params.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    });
  }

  // 5. HowTo
  if (params.howToSteps && params.howToSteps.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "@id": `${params.pageUrl}#howto`,
      name: `How to ${params.title.toLowerCase().replace(/^how to /i, "")}`,
      description: params.description,
      step: params.howToSteps.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: step.name,
        text: step.text,
      })),
    });
  }

  // 6. ItemList with products
  if (params.products && params.products.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${params.pageUrl}#itemlist`,
      name: params.title,
      numberOfItems: params.products.length,
      itemListElement: params.products.map((product, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "SoftwareApplication",
          name: product.name,
          url: product.url,
          applicationCategory: "HealthApplication",
          ...(product.price && {
            offers: {
              "@type": "Offer",
              price: product.price === "Free" ? "0" : product.price.replace(/[^0-9.]/g, ""),
              priceCurrency: "USD",
            },
          }),
          ...(product.rating && product.reviewCount && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: product.rating,
              reviewCount: product.reviewCount,
              bestRating: 5,
              worstRating: 1,
            },
          }),
        },
      })),
    });
  }

  // 7. Comparison/Review schema
  if (params.comparison) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Review",
      "@id": `${params.pageUrl}#review`,
      name: `${params.comparison.items.join(" vs ")} Comparison`,
      reviewBody: params.comparison.verdict,
      author: { "@id": `${baseUrl}/#organization` },
      itemReviewed: {
        "@type": "ItemList",
        name: params.comparison.items.join(" vs "),
        numberOfItems: params.comparison.items.length,
      },
    });
  }

  return schemas;
}

/**
 * Export all schema generators
 */
export const AggressiveSchema = {
  organization: generateOrganizationSchema,
  website: generateWebSiteSchema,
  medicalOrg: generateMedicalOrganizationSchema,
  video: generateVideoSchema,
  localBusiness: generateLocalBusinessSchema,
  pageStack: generatePageSchemaStack,
};

export default AggressiveSchema;

// src/lib/seo/schema-builders/tool-v3.ts
// Structured data builders for v3 digital tools

import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import type { HubConfig, SubHubConfig } from "@/lib/tools/taxonomy-service";

const BASE_URL = "https://heypsych.com";

// ============================================================================
// TOOL PAGE SCHEMAS
// ============================================================================

/**
 * Build SoftwareApplication schema for a digital tool
 */
export function buildToolSoftwareApplicationSchema(tool: DigitalToolV3): object {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${BASE_URL}/tools/${tool.slug}/#app`,
    name: tool.name,
    description: tool.short_description || tool.one_liner,
    applicationCategory: "HealthApplication",
  };

  // Operating systems
  const operatingSystems = getOperatingSystems(tool.platforms);
  if (operatingSystems.length > 0) {
    schema.operatingSystem = operatingSystems;
  }

  // Aggregate rating (critical for SERP stars)
  if (tool.app_rating && tool.total_reviews) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: tool.app_rating,
      reviewCount: tool.total_reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Offers/pricing
  schema.offers = {
    "@type": "Offer",
    price: tool.pricing.free_tier ? "0" : "",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  };

  // Download URL
  if (tool.app_metadata?.app_store_url) {
    schema.downloadUrl = tool.app_metadata.app_store_url;
  }

  // Official website
  if (tool.app_metadata?.website) {
    schema.url = tool.app_metadata.website;
  }

  // Publisher
  if (tool.app_metadata?.publisher) {
    schema.publisher = {
      "@type": "Organization",
      name: tool.app_metadata.publisher,
    };
  }

  // Version
  if (tool.app_metadata?.latest_version) {
    schema.softwareVersion = tool.app_metadata.latest_version;
  }

  // Languages
  if (tool.app_metadata?.languages && tool.app_metadata.languages.length > 0) {
    schema.inLanguage = tool.app_metadata.languages;
  }

  return schema;
}

/**
 * Build FAQPage schema for a tool's FAQs
 */
export function buildToolFAQSchema(tool: DigitalToolV3): object | null {
  if (!tool.seo.faqs || tool.seo.faqs.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.seo.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

/**
 * Build BreadcrumbList schema for a tool page
 */
export function buildToolBreadcrumbSchema(tool: DigitalToolV3): object {
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Tools",
      item: `${BASE_URL}/tools/`,
    },
  ];

  // Add hub if applicable
  if (tool.primary_hubs.length > 0) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: formatHubName(tool.primary_hubs[0]),
      item: `${BASE_URL}/tools/${tool.primary_hubs[0]}/`,
    });

    items.push({
      "@type": "ListItem",
      position: 3,
      name: tool.name,
      item: `${BASE_URL}/tools/${tool.slug}/`,
    });
  } else {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: tool.name,
      item: `${BASE_URL}/tools/${tool.slug}/`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

/**
 * Build all schemas for a tool page
 */
export function buildAllToolSchemas(tool: DigitalToolV3): object[] {
  const schemas: object[] = [];

  // SoftwareApplication (primary)
  schemas.push(buildToolSoftwareApplicationSchema(tool));

  // FAQPage
  const faqSchema = buildToolFAQSchema(tool);
  if (faqSchema) {
    schemas.push(faqSchema);
  }

  // BreadcrumbList
  schemas.push(buildToolBreadcrumbSchema(tool));

  return schemas;
}

// ============================================================================
// HUB PAGE SCHEMAS
// ============================================================================

/**
 * Build FAQPage schema for a hub
 */
export function buildHubFAQSchema(hub: HubConfig | SubHubConfig): object | null {
  if (!hub.faqs || hub.faqs.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: hub.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

/**
 * Build BreadcrumbList schema for a hub page
 */
export function buildHubBreadcrumbSchema(hub: HubConfig | SubHubConfig): object {
  const isSubHub = "parent_hub" in hub;
  const items: any[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Tools",
      item: `${BASE_URL}/tools/`,
    },
  ];

  if (isSubHub) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "Find Support",
      item: `${BASE_URL}/tools/find-support/`,
    });
    items.push({
      "@type": "ListItem",
      position: 3,
      name: hub.display_name,
      item: `${BASE_URL}${hub.url}`,
    });
  } else {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: hub.display_name,
      item: `${BASE_URL}${hub.url}`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

/**
 * Build ItemList schema for hub tool listings
 */
export function buildHubItemListSchema(
  hub: HubConfig | SubHubConfig,
  tools: DigitalToolV3[]
): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: hub.display_name,
    description: hub.direct_answer,
    numberOfItems: tools.length,
    itemListElement: tools.slice(0, 10).map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.name,
      url: `${BASE_URL}/tools/${tool.slug}/`,
    })),
  };
}

/**
 * Build all schemas for a hub page
 */
export function buildAllHubSchemas(
  hub: HubConfig | SubHubConfig,
  tools: DigitalToolV3[]
): object[] {
  const schemas: object[] = [];

  // FAQPage
  const faqSchema = buildHubFAQSchema(hub);
  if (faqSchema) {
    schemas.push(faqSchema);
  }

  // BreadcrumbList
  schemas.push(buildHubBreadcrumbSchema(hub));

  // ItemList
  if (tools.length > 0) {
    schemas.push(buildHubItemListSchema(hub, tools));
  }

  return schemas;
}

// ============================================================================
// DIRECTORY LANDING SCHEMAS
// ============================================================================

/**
 * Build WebSite schema for tools directory
 */
export function buildDirectoryWebSiteSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/tools/#website`,
    name: "HeyPsych Mental Health Tools Directory",
    url: `${BASE_URL}/tools/`,
    description:
      "Evidence-based mental health apps and digital tools reviewed by our medical board.",
    publisher: {
      "@type": "Organization",
      name: "HeyPsych",
      url: BASE_URL,
    },
  };
}

/**
 * Build Organization schema for tools directory
 */
export function buildDirectoryOrganizationSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "HeyPsych",
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.png`,
    sameAs: [],
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getOperatingSystems(platforms: DigitalToolV3["platforms"]): string[] {
  const os: string[] = [];
  if (platforms.ios) os.push("iOS");
  if (platforms.android) os.push("Android");
  if (platforms.web) os.push("Web");
  if (platforms.desktop) os.push("Windows", "macOS");
  return os;
}

function formatHubName(slug: string): string {
  const names: Record<string, string> = {
    sleep: "Sleep Tools",
    "anxiety-stress": "Anxiety & Stress Tools",
    "mood-depression": "Mood & Depression Tools",
    "focus-adhd": "Focus & ADHD Tools",
    "trauma-ptsd": "Trauma & PTSD Tools",
    "substance-use": "Substance Use & Recovery Tools",
    "serious-mental-illness": "Serious Mental Illness Tools",
    "find-support": "Find Professional Support",
  };
  return names[slug] || slug;
}

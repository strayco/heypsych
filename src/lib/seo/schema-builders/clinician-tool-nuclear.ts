/**
 * Nuclear Clinician Tool Schema Builder
 *
 * AGGRESSIVE structured data implementation for maximum SERP domination.
 * Generates 8-12 schema types per product page to claim every rich result slot.
 *
 * Schema Stack:
 * 1. SoftwareApplication (primary)
 * 2. Product + Offer (e-commerce signals)
 * 3. Organization (vendor entity)
 * 4. FAQPage (PAA domination)
 * 5. HowTo (decision guidance)
 * 6. Review/AggregateRating (social proof)
 * 7. BreadcrumbList (navigation)
 * 8. WebPage (article signals)
 * 9. ItemList (feature lists)
 * 10. Service (SaaS signals)
 * 11. SpecialAnnouncement (freshness for updates)
 * 12. VideoObject (if how-to content exists)
 */

import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { siteConfig } from "@/lib/config/site";
import { SCHEMA_TO_TAXONOMY_CATEGORY, getRoleLabel } from "@/lib/schemas/clinician-tool-v4";

const SITE_URL = siteConfig.url;

/**
 * Generate FULL nuclear schema stack for a clinician tool
 * Returns 8-12 schemas for maximum SERP feature coverage
 */
export function buildNuclearClinicianToolSchemas(
  tool: ClinicianToolV4,
  categorySlug: string,
  options: {
    includeHowTo?: boolean;
    includeFAQ?: boolean;
    includeVideo?: boolean;
  } = {}
): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [];
  const canonicalUrl = `${SITE_URL}/tools/for-clinicians/${categorySlug}/${tool.slug}/`;

  // 1. SoftwareApplication (primary - Google loves this for software)
  schemas.push(buildSoftwareApplicationSchema(tool, canonicalUrl));

  // 2. Product + Offer (e-commerce signals - helps with pricing snippets)
  schemas.push(buildProductSchema(tool, canonicalUrl));

  // 3. Organization (vendor entity - E-E-A-T signal)
  if (tool.company_name) {
    schemas.push(buildOrganizationSchema(tool));
  }

  // 4. FAQPage (PAA domination)
  if (options.includeFAQ !== false) {
    const faqSchema = buildFAQSchema(tool);
    if (faqSchema) {
      schemas.push(faqSchema);
    }
  }

  // 5. HowTo (decision guidance - "How to choose" rich results)
  if (options.includeHowTo !== false) {
    schemas.push(buildHowToSchema(tool, categorySlug));
  }

  // 6. BreadcrumbList (navigation context)
  schemas.push(buildBreadcrumbSchema(tool, categorySlug));

  // 7. WebPage (article signals with medical audience)
  schemas.push(buildWebPageSchema(tool, canonicalUrl));

  // 8. ItemList (feature list - appears in some SERPs)
  if (tool.best_for?.length || tool.capabilities?.length) {
    schemas.push(buildItemListSchema(tool, canonicalUrl));
  }

  // 9. Service (SaaS signals)
  schemas.push(buildServiceSchema(tool, canonicalUrl));

  // 10. Review (if we have internal editorial assessment)
  if (tool.governance?.data_quality_score) {
    schemas.push(buildReviewSchema(tool, canonicalUrl));
  }

  return schemas;
}

/**
 * SoftwareApplication Schema - Primary schema for software products
 * Includes every possible property for maximum coverage
 */
function buildSoftwareApplicationSchema(
  tool: ClinicianToolV4,
  canonicalUrl: string
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${canonicalUrl}#software`,
    name: tool.name,
    description: tool.short_description || tool.one_liner,
    url: canonicalUrl,
    applicationCategory: "HealthApplication",
    applicationSubCategory: "MedicalPracticeManagement",

    // Operating system / platform
    operatingSystem: buildOperatingSystems(tool),

    // Pricing
    offers: buildOffers(tool),

    // Features as featureList
    featureList: buildFeatureList(tool),

    // Permissions/requirements
    permissions: "HIPAA-compliant data handling",
    softwareRequirements: "Modern web browser, internet connection",

    // Release info for freshness
    softwareVersion: "Current",
    datePublished: tool.created_at,
    dateModified: tool.updated_at,

    // Provider
    provider: tool.company_name ? {
      "@type": "Organization",
      name: tool.company_name,
      url: tool.website_url,
    } : undefined,

    // Audience - CRITICAL for medical software
    audience: {
      "@type": "MedicalAudience",
      audienceType: "Clinician",
      healthCondition: {
        "@type": "MedicalCondition",
        name: "Mental Health Conditions",
      },
      suggestedGender: "unisex",
      suggestedMinAge: 18,
    },

    // Screenshots/images if available
    screenshot: tool.website_url ? `${tool.website_url}/screenshot.png` : undefined,

    // Security/compliance as special features
    securityFeatures: buildSecurityFeatures(tool),

    // Integrations
    interactionService: tool.integrations?.map(i => ({
      "@type": "SoftwareApplication",
      name: i.name,
    })),

    // sameAs for entity linking
    sameAs: buildSameAsLinks(tool),
  };

  // Add aggregate rating if we have quality score
  if (tool.governance?.data_quality_score) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (tool.governance.data_quality_score / 20).toFixed(1), // Convert 0-100 to 0-5
      bestRating: "5",
      worstRating: "1",
      ratingCount: 1,
      reviewCount: 1,
    };
  }

  return schema;
}

/**
 * Product Schema - E-commerce signals for pricing snippets
 */
function buildProductSchema(
  tool: ClinicianToolV4,
  canonicalUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    name: tool.name,
    description: tool.short_description,
    url: canonicalUrl,
    brand: {
      "@type": "Brand",
      name: tool.company_name || tool.name,
    },
    category: "Practice Management Software > Mental Health",
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: tool.pricing?.starting_price_cents ? (tool.pricing.starting_price_cents / 100) : 0,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: tool.company_name || tool.name,
      },
    },
    // Additional properties
    isSimilarTo: tool.competitor_tools?.slice(0, 3).map(slug => ({
      "@type": "Product",
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      url: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/${slug}/`,
    })),
  };
}

/**
 * Organization Schema - Vendor entity for E-E-A-T
 */
function buildOrganizationSchema(tool: ClinicianToolV4): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${tool.website_url || SITE_URL}#organization`,
    name: tool.company_name,
    url: tool.website_url,
    foundingDate: tool.company?.founded_year?.toString(),
    numberOfEmployees: tool.company?.employee_count ? {
      "@type": "QuantitativeValue",
      value: tool.company.employee_count,
    } : undefined,
    address: tool.company?.headquarters ? {
      "@type": "PostalAddress",
      addressLocality: tool.company.headquarters,
    } : undefined,
    // Add sameAs links for entity consolidation
    sameAs: [
      tool.website_url,
      // Common patterns for company social profiles
    ].filter(Boolean),
  };
}

/**
 * FAQ Schema - PAA domination with auto-generated questions
 */
function buildFAQSchema(tool: ClinicianToolV4): Record<string, unknown> | null {
  const faqs = generateToolFAQs(tool);

  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
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
 * HowTo Schema - Decision guidance rich results
 */
function buildHowToSchema(
  tool: ClinicianToolV4,
  categorySlug: string
): Record<string, unknown> {
  const categoryName = categorySlug.replace(/-/g, ' ');

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to evaluate ${tool.name} for your practice`,
    description: `Step-by-step guide to determining if ${tool.name} is the right ${categoryName} solution for your mental health practice.`,
    totalTime: "PT15M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: tool.pricing?.starting_price_cents ? (tool.pricing.starting_price_cents / 100) : 0,
    },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Assess your practice needs",
        text: `Identify your key requirements: ${tool.audiences?.practice_settings?.slice(0, 3).join(', ') || 'scheduling, documentation, billing'}.`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Review compliance requirements",
        text: `Verify ${tool.name} meets your compliance needs: ${tool.compliance?.hipaa_support === 'yes' ? 'HIPAA compliant with BAA available' : 'Check compliance status directly with vendor'}.`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Compare pricing tiers",
        text: `${tool.name} ${tool.pricing?.starting_price_display || 'offers multiple pricing tiers'}. ${tool.pricing?.free_trial_days ? `Start with a ${tool.pricing.free_trial_days}-day free trial.` : 'Contact for demo.'}`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Check integrations",
        text: `Ensure ${tool.name} integrates with your existing tools: ${tool.integrations?.slice(0, 3).map(i => i.name).join(', ') || 'Check vendor documentation'}.`,
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Request demo or start trial",
        text: `Visit ${tool.website_url || 'the vendor website'} to request a demo or start your free trial.`,
      },
    ],
  };
}

/**
 * BreadcrumbList Schema - Navigation context
 */
function buildBreadcrumbSchema(
  tool: ClinicianToolV4,
  categorySlug: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Tools",
        item: `${SITE_URL}/tools/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "For Clinicians",
        item: `${SITE_URL}/tools/for-clinicians/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        item: `${SITE_URL}/tools/for-clinicians/${categorySlug}/`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: tool.name,
        item: `${SITE_URL}/tools/for-clinicians/${categorySlug}/${tool.slug}/`,
      },
    ],
  };
}

/**
 * WebPage Schema - Article signals with medical audience
 */
function buildWebPageSchema(
  tool: ClinicianToolV4,
  canonicalUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    name: `${tool.name} Review & Pricing (2026)`,
    description: tool.short_description,
    url: canonicalUrl,
    datePublished: tool.created_at,
    dateModified: tool.updated_at,
    inLanguage: "en-US",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: siteConfig.name,
      url: SITE_URL,
    },
    about: {
      "@type": "Thing",
      name: tool.name,
      description: tool.one_liner,
    },
    audience: {
      "@type": "MedicalAudience",
      audienceType: tool.audiences?.clinician_roles?.map(r => getRoleLabel(r)).join(', ') || "Mental Health Clinicians",
    },
    // Speakable for voice search
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".tool-description", ".pricing-summary"],
    },
    // Freshness signals
    lastReviewed: tool.governance?.last_reviewed || tool.updated_at,
  };
}

/**
 * ItemList Schema - Feature lists for SERP features
 */
function buildItemListSchema(
  tool: ClinicianToolV4,
  canonicalUrl: string
): Record<string, unknown> {
  const items = [
    ...(tool.best_for || []),
    ...(tool.capabilities?.slice(0, 5) || []),
  ].slice(0, 8);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${tool.name} Key Features`,
    description: `Top features and use cases for ${tool.name}`,
    url: canonicalUrl,
    numberOfItems: items.length,
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: typeof item === 'string' ? item : item,
    })),
  };
}

/**
 * Service Schema - SaaS signals
 */
function buildServiceSchema(
  tool: ClinicianToolV4,
  canonicalUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonicalUrl}#service`,
    name: tool.name,
    description: tool.short_description,
    provider: {
      "@type": "Organization",
      name: tool.company_name || tool.name,
    },
    serviceType: "SaaS Practice Management",
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    hasOfferCatalog: tool.pricing ? {
      "@type": "OfferCatalog",
      name: `${tool.name} Pricing`,
      itemListElement: [{
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: tool.name,
          description: tool.short_description,
        },
        price: tool.pricing.starting_price_cents ? (tool.pricing.starting_price_cents / 100) : 0,
        priceCurrency: "USD",
      }],
    } : undefined,
  };
}

/**
 * Review Schema - Internal editorial assessment
 */
function buildReviewSchema(
  tool: ClinicianToolV4,
  canonicalUrl: string
): Record<string, unknown> {
  const score = tool.governance?.data_quality_score || 80;
  const rating = (score / 20).toFixed(1);

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "@id": `${canonicalUrl}#review`,
    itemReviewed: {
      "@type": "SoftwareApplication",
      name: tool.name,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: rating,
      bestRating: "5",
      worstRating: "1",
    },
    author: {
      "@type": "Organization",
      name: "HeyPsych Editorial Team",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: SITE_URL,
    },
    datePublished: tool.created_at,
    dateModified: tool.updated_at,
    reviewBody: `${tool.name} is ${score >= 90 ? 'an excellent' : score >= 80 ? 'a strong' : score >= 70 ? 'a solid' : 'a viable'} option for mental health clinicians seeking ${tool.primary_category?.replace(/-/g, ' ')} solutions. ${tool.one_liner || ''}`,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildOperatingSystems(tool: ClinicianToolV4): string[] {
  const systems: string[] = [];
  if (tool.feature_flags?.has_mobile_app) {
    systems.push("iOS", "Android");
  }
  systems.push("Web Browser");
  return systems;
}

function buildOffers(tool: ClinicianToolV4): Record<string, unknown> {
  return {
    "@type": "Offer",
    price: tool.pricing?.starting_price_cents ? (tool.pricing.starting_price_cents / 100) : 0,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  };
}

function buildFeatureList(tool: ClinicianToolV4): string[] {
  const features: string[] = [];

  if (tool.feature_flags?.has_ai) features.push("AI-Powered Documentation");
  if (tool.feature_flags?.has_telehealth) features.push("Integrated Telehealth");
  if (tool.feature_flags?.has_rcm) features.push("Revenue Cycle Management");
  if (tool.feature_flags?.has_e_prescribing) features.push("E-Prescribing with EPCS");
  if (tool.feature_flags?.has_measurement) features.push("Outcome Measurement Tools");
  if (tool.feature_flags?.has_patient_portal) features.push("Patient Portal");
  if (tool.feature_flags?.has_mobile_app) features.push("Mobile App");

  if (tool.compliance?.hipaa_support === 'yes') features.push("HIPAA Compliant");
  if (tool.compliance?.baa_available === 'yes') features.push("BAA Available");
  if (tool.compliance?.soc2 === 'yes') features.push("SOC 2 Certified");

  return features;
}

function buildSecurityFeatures(tool: ClinicianToolV4): string[] {
  const features: string[] = [];

  if (tool.compliance?.hipaa_support === 'yes') features.push("HIPAA Compliant");
  if (tool.compliance?.baa_available === 'yes') features.push("Business Associate Agreement");
  if (tool.compliance?.soc2 === 'yes') features.push("SOC 2 Type II Certified");
  if (tool.compliance?.hitrust === 'yes') features.push("HITRUST Certified");

  return features;
}

function buildSameAsLinks(tool: ClinicianToolV4): string[] {
  const links: string[] = [];

  if (tool.website_url) links.push(tool.website_url);
  if (tool.pricing_url) links.push(tool.pricing_url);

  // Add common social/directory links if we know the company
  // These help with entity consolidation in knowledge graph

  return links;
}

function extractHighPrice(tiers: { price: string }[]): number {
  let maxPrice = 0;
  for (const tier of tiers) {
    const price = extractPriceNumber(tier.price);
    if (price > maxPrice) maxPrice = price;
  }
  return maxPrice || 500; // Default to $500 if can't parse
}

function extractPriceNumber(priceStr: string): number {
  const match = priceStr.match(/\$?([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  if (priceStr.toLowerCase().includes('free')) return 0;
  return 0;
}

/**
 * Generate tool-specific FAQs for PAA domination
 */
function generateToolFAQs(tool: ClinicianToolV4): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = [];

  // Use existing SEO FAQs if available
  if (tool.seo?.faqs?.length) {
    return tool.seo.faqs;
  }

  // Auto-generate from tool data
  const name = tool.name;

  // Pricing FAQ
  if (tool.pricing) {
    faqs.push({
      q: `How much does ${name} cost in 2026?`,
      a: tool.pricing.starting_price_display
        ? `${name} starts at ${tool.pricing.starting_price_display}. ${tool.pricing.free_trial_days ? `A ${tool.pricing.free_trial_days}-day free trial is available.` : ''} ${tool.pricing.free_tier ? 'A free tier is also available.' : ''}`
        : `Contact ${name} for current pricing. ${tool.pricing.free_trial_days ? `A ${tool.pricing.free_trial_days}-day free trial is available.` : ''}`,
    });
  }

  // HIPAA FAQ
  if (tool.compliance?.hipaa_support === 'yes') {
    faqs.push({
      q: `Is ${name} HIPAA compliant?`,
      a: `Yes, ${name} is HIPAA compliant${tool.compliance.baa_available === 'yes' ? ' and provides a Business Associate Agreement (BAA)' : ''}. ${tool.compliance.soc2 === 'yes' ? 'It is also SOC 2 certified.' : ''} Always verify current compliance status directly with the vendor.`,
    });
  }

  // Best for FAQ
  if (tool.best_for?.length) {
    faqs.push({
      q: `Who is ${name} best for?`,
      a: `${name} is best for: ${tool.best_for.slice(0, 3).join('; ')}. ${tool.not_for?.length ? `It may not be ideal for: ${tool.not_for[0]}.` : ''}`,
    });
  }

  // Integration FAQ
  if (tool.integrations?.length) {
    const integrationNames = tool.integrations.slice(0, 5).map(i => i.name).join(', ');
    faqs.push({
      q: `What does ${name} integrate with?`,
      a: `${name} integrates with ${integrationNames}${tool.integrations.length > 5 ? ` and ${tool.integrations.length - 5} more` : ''}. Integration types include EHR, telehealth, and billing systems.`,
    });
  }

  // Comparison FAQ (if competitors defined)
  if (tool.competitor_tools?.length) {
    const competitor = tool.competitor_tools[0]?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    faqs.push({
      q: `${name} vs ${competitor}: which is better?`,
      a: `Both ${name} and ${competitor} are popular choices for mental health practices. ${name} is particularly strong for ${tool.best_for?.[0] || 'clinical documentation'}. The best choice depends on your specific practice needs, budget, and workflow preferences. Compare features and request demos from both.`,
    });
  }

  return faqs;
}

// Export for use in page components
export {
  generateToolFAQs,
  buildSoftwareApplicationSchema,
  buildProductSchema,
  buildFAQSchema,
  buildHowToSchema,
};

/**
 * Symptom Schema Builder
 *
 * Generates Schema.org structured data for symptom pages.
 * Uses MedicalWebPage as the primary type since these are educational pages
 * about symptoms, not clinical definitions of medical signs/symptoms.
 */

import type { SymptomEntity } from "@/domains/symptoms/types";
import { SITE_CONFIG } from "../config";
import { getCategoryMeta } from "@/domains/symptoms";

/**
 * Build MedicalWebPage schema for a symptom detail page
 */
export function buildSymptomMedicalWebPageSchema(
  symptom: SymptomEntity
): Record<string, any> {
  const pageUrl = `${SITE_CONFIG.url}/symptoms/${symptom.slug}`;
  const categoryMeta = getCategoryMeta(symptom.category);

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": `${pageUrl}#webpage`,
    name: symptom.name,
    headline: symptom.name,
    description: symptom.shortDefinition,
    url: pageUrl,
    inLanguage: "en-US",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_CONFIG.url}/#website`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    about: {
      "@type": "MedicalSignOrSymptom",
      name: symptom.name,
      description: symptom.shortDefinition,
      // Link to conditions where this symptom appears
      possibleCause: symptom.conditionRelationships.map((rel) => ({
        "@type": "MedicalCondition",
        name: rel.conditionName,
        url: `${SITE_CONFIG.url}/conditions/${rel.conditionSlug}`,
      })),
    },
    // Audience
    audience: {
      "@type": "PeopleAudience",
      suggestedMinAge: 16,
      healthCondition: {
        "@type": "MedicalCondition",
        name: "Mental Health",
      },
    },
    // Medical specialty
    specialty: {
      "@type": "MedicalSpecialty",
      name: "Psychiatry",
    },
  };

  // Add category/topic
  if (categoryMeta) {
    schema.mainEntity = {
      "@type": "Thing",
      name: categoryMeta.name,
      description: categoryMeta.description,
    };
  }

  // Add last reviewed date if available
  if (symptom.lastReviewed) {
    schema.lastReviewed = symptom.lastReviewed;
  }

  // Add publisher
  schema.publisher = {
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
  };

  return schema;
}

/**
 * Build BreadcrumbList schema for a symptom page
 */
export function buildSymptomBreadcrumbSchema(
  symptom: SymptomEntity
): Record<string, any> {
  const pageUrl = `${SITE_CONFIG.url}/symptoms/${symptom.slug}`;
  const categoryMeta = getCategoryMeta(symptom.category);

  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_CONFIG.url,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Symptoms",
      item: `${SITE_CONFIG.url}/symptoms`,
    },
  ];

  // Optionally add category level
  if (categoryMeta) {
    items.push({
      "@type": "ListItem",
      position: 3,
      name: categoryMeta.name,
      item: `${SITE_CONFIG.url}/symptoms?category=${symptom.category}`,
    });

    items.push({
      "@type": "ListItem",
      position: 4,
      name: symptom.name,
      item: pageUrl,
    });
  } else {
    items.push({
      "@type": "ListItem",
      position: 3,
      name: symptom.name,
      item: pageUrl,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

/**
 * Build FAQ schema for symptom page if there's FAQ-like content
 * Currently symptoms don't have explicit FAQs, but this is here for future use
 */
export function buildSymptomFAQSchema(
  symptom: SymptomEntity
): Record<string, any> | null {
  // Generate FAQ from whenToSeekHelp if available
  const faqs: Array<{ question: string; answer: string }> = [];

  // Add "When should I seek help" FAQ if we have that content
  if (symptom.whenToSeekHelp && symptom.whenToSeekHelp.length > 0) {
    faqs.push({
      question: `When should I seek help for ${symptom.name.toLowerCase()}?`,
      answer: symptom.whenToSeekHelp.join(" "),
    });
  }

  // Add "What conditions is this associated with" FAQ
  if (symptom.conditionRelationships.length > 0) {
    const conditionNames = symptom.conditionRelationships
      .map((r) => r.conditionName)
      .join(", ");
    faqs.push({
      question: `What conditions can involve ${symptom.name.toLowerCase()}?`,
      answer: `${symptom.name} can appear in several conditions including ${conditionNames}. However, experiencing this symptom does not mean you have any particular diagnosis.`,
    });
  }

  // Add "What else could cause this" FAQ if we have non-psychiatric considerations
  if (
    symptom.nonPsychiatricConsiderations &&
    symptom.nonPsychiatricConsiderations.length > 0
  ) {
    faqs.push({
      question: `Are there non-mental-health causes of ${symptom.name.toLowerCase()}?`,
      answer: `Yes, ${symptom.name.toLowerCase()} can have various causes including: ${symptom.nonPsychiatricConsiderations.slice(0, 3).join("; ")}. It's important to consider all possibilities.`,
    });
  }

  // Only return schema if we have FAQs
  if (faqs.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Build all schemas for a symptom page
 */
export function buildSymptomSchemas(symptom: SymptomEntity): Record<string, any>[] {
  const schemas: Record<string, any>[] = [];

  // MedicalWebPage (primary)
  schemas.push(buildSymptomMedicalWebPageSchema(symptom));

  // BreadcrumbList
  schemas.push(buildSymptomBreadcrumbSchema(symptom));

  // FAQ (if content available)
  const faqSchema = buildSymptomFAQSchema(symptom);
  if (faqSchema) {
    schemas.push(faqSchema);
  }

  return schemas;
}

/**
 * Build schema for the symptoms hub page
 */
export function buildSymptomsHubSchema(): Record<string, any>[] {
  const hubUrl = `${SITE_CONFIG.url}/symptoms`;

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": `${hubUrl}#webpage`,
    name: "Explore Mental Health Symptoms",
    headline: "Explore Mental Health Symptoms",
    description:
      "Explore common mental health symptoms in plain language. Learn what different experiences can feel like, what they might mean, and when to consider seeking help.",
    url: hubUrl,
    inLanguage: "en-US",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_CONFIG.url}/#website`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    specialty: {
      "@type": "MedicalSpecialty",
      name: "Psychiatry",
    },
    audience: {
      "@type": "PeopleAudience",
      suggestedMinAge: 16,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
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
        name: "Symptoms",
        item: hubUrl,
      },
    ],
  };

  return [webpageSchema, breadcrumbSchema];
}

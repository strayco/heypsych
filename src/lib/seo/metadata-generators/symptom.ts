/**
 * SymptomMetadataGenerator
 *
 * Generates SEO metadata for symptom exploration pages.
 *
 * Title Formula: "{Symptom Name}: What It Feels Like & Possible Explanations | HeyPsych"
 * Description Formula: "Learn about {symptom} and what it can mean..."
 */

import type { Metadata } from "next";
import type { SymptomEntity } from "@/domains/symptoms/types";
import { SITE_CONFIG, METADATA_LIMITS } from "../config";
import { BRAND_TITLE_SUFFIX, renderedTitleLength } from "../title";
import { getCategoryMeta } from "@/domains/symptoms";

/**
 * Generate metadata for a symptom detail page
 */
export function generateSymptomMetadata(symptom: SymptomEntity): Metadata {
  const title = generateTitle(symptom);
  const description = generateDescription(symptom);
  const canonical = `${SITE_CONFIG.url}/symptoms/${symptom.slug}`;
  const keywords = extractSymptomKeywords(symptom);
  const categoryMeta = getCategoryMeta(symptom.category);

  return {
    title,
    description,
    keywords: keywords.join(", "),
    alternates: { canonical },
    robots: symptom.indexable && symptom.reviewed
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-snippet": -1,
            "max-image-preview": "large" as const,
            "max-video-preview": -1,
          },
        }
      : {
          index: false,
          follow: true,
        },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: `${SITE_CONFIG.url}${SITE_CONFIG.defaultOGImage}`,
          width: 1200,
          height: 630,
          alt: `${symptom.name} - ${SITE_CONFIG.name}`,
        },
      ],
      ...(categoryMeta && {
        "article:section": categoryMeta.name,
      }),
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_CONFIG.twitter,
      title,
      description,
    },
  };
}

/**
 * Generate title for symptom page
 */
function generateTitle(symptom: SymptomEntity): string {
  const name = symptom.name;

  // Titles omit the brand; the root layout template appends " | HeyPsych", so
  // length is measured against the final rendered form.
  const fullTitle = `${name}: What It Feels Like & Possible Explanations`;

  if (renderedTitleLength(fullTitle) <= 60) {
    return fullTitle;
  }

  // Shorter version
  const shortTitle = `${name}: Causes & What to Know`;
  if (renderedTitleLength(shortTitle) <= 60) {
    return shortTitle;
  }

  // Minimal version
  return truncate(name, 60 - BRAND_TITLE_SUFFIX.length);
}

/**
 * Generate description for symptom page
 */
function generateDescription(symptom: SymptomEntity): string {
  const name = symptom.name.toLowerCase();

  // Get count of related conditions
  const conditionCount = symptom.conditionRelationships.length;
  const conditionPhrase =
    conditionCount === 1
      ? "one condition"
      : conditionCount === 2
        ? "two conditions"
        : `${conditionCount} conditions`;

  // Build description
  let description = `Learn about ${name}: what it can feel like, illustrative examples, and the ${conditionPhrase} where it may appear. `;
  description += `Understand possible explanations and when to consider seeking help.`;

  return ensureDescriptionLength(description);
}

/**
 * Extract keywords for symptom page
 */
function extractSymptomKeywords(symptom: SymptomEntity): string[] {
  const keywords = new Set<string>();

  // Add symptom name and variations
  keywords.add(symptom.name);
  keywords.add(`${symptom.name.toLowerCase()} symptoms`);
  keywords.add(`what causes ${symptom.name.toLowerCase()}`);

  // Add aliases (limited)
  symptom.aliases.slice(0, 3).forEach((alias) => {
    if (alias.length < 40) {
      keywords.add(alias);
    }
  });

  // Add related conditions
  symptom.conditionRelationships.slice(0, 3).forEach((rel) => {
    keywords.add(rel.conditionName);
  });

  // Add category
  const categoryMeta = getCategoryMeta(symptom.category);
  if (categoryMeta) {
    keywords.add(categoryMeta.name);
  }

  // General mental health terms
  keywords.add("mental health");
  keywords.add("mental health symptoms");

  return Array.from(keywords)
    .slice(0, METADATA_LIMITS.keywords.max)
    .filter((kw) => kw.length >= 3);
}

/**
 * Generate metadata for the symptoms hub page
 */
export function generateSymptomsHubMetadata(): Metadata {
  const title = "Explore Mental Health Symptoms | HeyPsych";
  const description =
    "Explore common mental health symptoms in plain language. Learn what different experiences can feel like, what they might mean, and when to consider seeking help.";
  const canonical = `${SITE_CONFIG.url}/symptoms`;

  return {
    title,
    description,
    keywords:
      "mental health symptoms, anxiety symptoms, depression symptoms, common mental health experiences, mental health education",
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large" as const,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: `${SITE_CONFIG.url}${SITE_CONFIG.defaultOGImage}`,
          width: 1200,
          height: 630,
          alt: `Explore Mental Health Symptoms - ${SITE_CONFIG.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_CONFIG.twitter,
      title,
      description,
    },
  };
}

// Utility functions
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

function ensureDescriptionLength(description: string): string {
  const { min, max, ideal } = METADATA_LIMITS.description;

  if (description.length < min) {
    return description;
  }

  if (description.length <= ideal) {
    return description;
  }

  if (description.length > max) {
    return truncate(description, ideal);
  }

  return description;
}

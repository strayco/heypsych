/**
 * Digital Tool Schema Builder
 *
 * Generates comprehensive SoftwareApplication schema for digital mental health tools.
 *
 * PHASE 1.2: Complete SoftwareApplication Schema
 *
 * Includes:
 * - Basic app information (name, description, category)
 * - Aggregate ratings (for SERP stars)
 * - Pricing/offers
 * - Platform/OS information
 * - Features and requirements
 * - Medical audience (target conditions)
 * - Download URLs
 *
 * Usage:
 * ```typescript
 * const schema = buildDigitalToolSchema(entity);
 * ```
 */

import type { Entity } from '@/lib/types/database';
import { SITE_CONFIG } from '../config';

/**
 * Build SoftwareApplication schema for digital mental health tools
 *
 * @param entity - Entity object representing the digital tool
 * @returns Schema.org SoftwareApplication object
 */
export function buildDigitalToolSchema(entity: Entity): Record<string, any> {
  const data = entity.data || {};

  // Base schema with required fields
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_CONFIG.url}/resources/${entity.slug}#app`,
    name: entity.name,
    description: entity.description || data.description || data.summary,
    applicationCategory: 'HealthApplication',
  };

  // Application subcategory (more specific category)
  if (data.category) {
    schema.applicationSubCategory = formatCategory(data.category);
  }

  // Operating systems (platforms)
  if (data.platforms && Array.isArray(data.platforms) && data.platforms.length > 0) {
    schema.operatingSystem = data.platforms;
  }

  // CRITICAL FOR SERP: Aggregate rating (shows stars in Google)
  if (data.app_rating && data.total_reviews) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.app_rating,
      reviewCount: data.total_reviews,
      bestRating: 5,
      worstRating: 1
    };
  }

  // Pricing information (offers)
  if (data.subscription_model || data.free !== undefined) {
    const price = data.free ? '0' : extractPriceFromText(data.subscription_model);
    schema.offers = {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    };

    // Add price specification if not free
    if (!data.free && data.subscription_model) {
      schema.offers.priceSpecification = {
        '@type': 'UnitPriceSpecification',
        price: price,
        priceCurrency: 'USD'
      };
    }
  }

  // Download URLs
  if (data.app_store_url) {
    schema.downloadUrl = data.app_store_url;
  }

  // Official website
  if (data.website) {
    schema.url = data.website;
  }

  // System requirements
  if (data.system_requirements) {
    schema.requirements = data.system_requirements;
  }

  // Software version
  if (data.metadata?.latest_version) {
    schema.softwareVersion = data.metadata.latest_version;
  }

  // Feature list
  const features = extractFeatures(data);
  if (features.length > 0) {
    schema.featureList = features;
  }

  // Offline access capability
  if (data.offline_access !== undefined) {
    if (data.offline_access) {
      schema.availableOnDevice = 'Desktop, Mobile';
      if (!schema.featureList) {
        schema.featureList = [];
      }
      schema.featureList.push('Offline access available');
    }
  }

  // Privacy certification (E-A-T signal)
  if (data.privacy_certified) {
    schema.license = 'Privacy Certified (Third-Party Audited)';
  }

  // HIPAA compliance (if applicable)
  if (data.metadata?.hipaa_compliant) {
    if (!schema.license) {
      schema.license = 'HIPAA Compliant';
    } else {
      schema.license += ', HIPAA Compliant';
    }
  }

  // Target conditions (medical indication) - CRITICAL FOR MEDICAL SEO
  if (data.conditions && Array.isArray(data.conditions) && data.conditions.length > 0) {
    schema.medicalAudience = {
      '@type': 'MedicalAudience',
      audienceType: 'Patient',
      healthCondition: data.conditions.map((condition: string) => ({
        '@type': 'MedicalCondition',
        name: cleanConditionName(condition)
      }))
    };
  } else if (data.clinical_metadata?.linked_conditions) {
    // Use linked_conditions if available (V2 format)
    schema.medicalAudience = {
      '@type': 'MedicalAudience',
      audienceType: 'Patient',
      healthCondition: data.clinical_metadata.linked_conditions.map((lc: any) => ({
        '@type': 'MedicalCondition',
        name: cleanConditionName(lc.slug || lc.name)
      }))
    };
  }

  // Content rating / age appropriateness
  if (data.metadata?.content_rating) {
    schema.contentRating = data.metadata.content_rating;
  }

  // Publisher
  if (data.metadata?.publisher) {
    schema.publisher = {
      '@type': 'Organization',
      name: data.metadata.publisher
    };
  }

  // Release date
  if (data.metadata?.release_date) {
    schema.datePublished = data.metadata.release_date;
  }

  // Last updated
  if (data.metadata?.last_updated) {
    schema.dateModified = data.metadata.last_updated;
  }

  // Application size
  if (data.metadata?.app_size) {
    schema.fileSize = data.metadata.app_size;
  }

  // Supported languages
  if (data.metadata?.languages && Array.isArray(data.metadata.languages)) {
    schema.inLanguage = data.metadata.languages;
  }

  return schema;
}

/**
 * Extract price from subscription model text
 * Examples: "$14.99/month" -> "14.99", "Free trial + $69.99/year" -> "69.99"
 */
function extractPriceFromText(subscriptionModel: string | undefined): string {
  if (!subscriptionModel) return '0';

  // Match price patterns like $14.99, $69.99, etc.
  const matches = subscriptionModel.match(/\$(\d+(?:\.\d{2})?)/g);
  if (!matches || matches.length === 0) return '0';

  // If multiple prices, take the lowest (often the monthly price)
  const prices = matches.map(m => parseFloat(m.replace('$', '')));
  return Math.min(...prices).toFixed(2);
}

/**
 * Format category for display
 * Examples: "mood-tracking" -> "Mood Tracking", "cbt" -> "CBT"
 */
function formatCategory(category: string): string {
  if (!category) return 'Mental Health';

  // Special cases
  const specialCases: Record<string, string> = {
    'cbt': 'CBT',
    'dbt': 'DBT',
    'emdr': 'EMDR',
    'mbsr': 'MBSR'
  };

  const lower = category.toLowerCase();
  if (specialCases[lower]) return specialCases[lower];

  // Convert hyphenated to title case
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract features from various data sources
 */
function extractFeatures(data: any): string[] {
  const features: string[] = [];

  // From explicit features field
  if (data.features && Array.isArray(data.features)) {
    features.push(...data.features);
  }

  // From sections with type "features"
  if (data.sections && Array.isArray(data.sections)) {
    const featureSection = data.sections.find((s: any) => s.type === 'features');
    if (featureSection && featureSection.text) {
      // Extract bullet points from text
      const bullets = featureSection.text
        .split('\n')
        .filter((line: string) => line.trim().startsWith('•') || line.trim().startsWith('-'))
        .map((line: string) => line.replace(/^[•\-]\s*/, '').trim())
        .filter((line: string) => line.length > 0);

      features.push(...bullets);
    }
  }

  // Deduplicate
  return [...new Set(features)];
}

/**
 * Clean condition name for display
 * Examples: "generalized-anxiety-disorder" -> "Generalized Anxiety Disorder"
 */
function cleanConditionName(slug: string): string {
  if (!slug) return 'Mental Health Condition';

  return slug
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Validate schema completeness
 * Useful for debugging and quality assurance
 */
export function validateDigitalToolSchema(schema: Record<string, any>): {
  valid: boolean;
  warnings: string[];
  score: number;
} {
  const warnings: string[] = [];
  let score = 100;

  // Critical fields
  if (!schema.name) {
    warnings.push('Missing name');
    score -= 20;
  }
  if (!schema.description) {
    warnings.push('Missing description');
    score -= 15;
  }
  if (!schema.aggregateRating) {
    warnings.push('Missing aggregateRating (no SERP stars)');
    score -= 15;
  }
  if (!schema.offers) {
    warnings.push('Missing offers (no pricing info)');
    score -= 10;
  }
  if (!schema.medicalAudience) {
    warnings.push('Missing medicalAudience (no target conditions)');
    score -= 10;
  }
  if (!schema.operatingSystem) {
    warnings.push('Missing operatingSystem (no platform info)');
    score -= 10;
  }
  if (!schema.downloadUrl && !schema.url) {
    warnings.push('Missing downloadUrl and url (no links)');
    score -= 10;
  }
  if (!schema.featureList || schema.featureList.length === 0) {
    warnings.push('Missing featureList (no features listed)');
    score -= 5;
  }
  if (!schema.requirements) {
    warnings.push('Missing requirements (no system requirements)');
    score -= 5;
  }

  return {
    valid: score >= 70, // 70+ is considered valid
    warnings,
    score
  };
}

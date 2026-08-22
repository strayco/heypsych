/**
 * Sitemap Configuration
 *
 * Priority and changefreq rules for sitemap generation.
 * Follows Google's sitemap best practices and SEO strategy.
 */

import type { EntityType } from "@/lib/types/database";

/**
 * Sitemap priority (0.0 - 1.0)
 * Higher = more important relative to other pages on site
 */
export type SitemapPriority = number;

/**
 * Changefreq values
 */
export type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

/**
 * Sitemap entry configuration
 */
export interface SitemapEntryConfig {
  priority: SitemapPriority;
  changefreq: ChangeFreq;
}

/**
 * Priority and changefreq by entity type
 */
export const ENTITY_SITEMAP_CONFIG: Record<EntityType, SitemapEntryConfig> = {
  condition: {
    priority: 0.9,
    changefreq: 'weekly',
  },
  medication: {
    priority: 0.8,
    changefreq: 'monthly',
  },
  therapy: {
    priority: 0.8,
    changefreq: 'monthly',
  },
  treatment: {
    priority: 0.8,
    changefreq: 'monthly',
  },
  resource: {
    priority: 0.7,
    changefreq: 'monthly',
  },
  interventional: {
    priority: 0.7,
    changefreq: 'monthly',
  },
  alternative: {
    priority: 0.7,
    changefreq: 'monthly',
  },
  supplement: {
    priority: 0.7,
    changefreq: 'monthly',
  },
  investigational: {
    priority: 0.6,
    changefreq: 'monthly',
  },
  provider: {
    priority: 0.7,
    changefreq: 'weekly',
  },
};

/**
 * Hub page configurations
 */
export const HUB_SITEMAP_CONFIG: Record<string, SitemapEntryConfig> = {
  // Main hubs
  '/conditions': {
    priority: 1.0,
    changefreq: 'weekly',
  },
  '/treatments': {
    priority: 1.0,
    changefreq: 'weekly',
  },
  '/treatments/medications': {
    priority: 0.9,
    changefreq: 'weekly',
  },
  '/treatments/therapy': {
    priority: 0.9,
    changefreq: 'weekly',
  },
  '/treatments/interventional': {
    priority: 0.8,
    changefreq: 'monthly',
  },
  '/treatments/alternative': {
    priority: 0.8,
    changefreq: 'monthly',
  },
  '/treatments/supplements': {
    priority: 0.8,
    changefreq: 'monthly',
  },
  '/treatments/investigational': {
    priority: 0.7,
    changefreq: 'monthly',
  },
  '/resources': {
    priority: 0.9,
    changefreq: 'weekly',
  },
  '/resources/assessments-screeners': {
    priority: 0.8,
    changefreq: 'weekly',
  },
  '/resources/articles-guides': {
    priority: 0.7,
    changefreq: 'weekly',
  },
  '/resources/support-community': {
    priority: 0.8,
    changefreq: 'weekly',
  },
  '/resources/support-community/immediate-crisis': {
    priority: 0.9,
    changefreq: 'weekly',
  },
  '/resources/support-community/organizations-communities': {
    priority: 0.8,
    changefreq: 'weekly',
  },
  '/psychiatrists': {
    priority: 0.9,
    changefreq: 'daily',
  },
  '/search': {
    priority: 0.6,
    changefreq: 'daily',
  },
  '/treatments/compare': {
    priority: 0.8,
    changefreq: 'weekly',
  },
};

/**
 * Static page configurations
 */
export const STATIC_SITEMAP_CONFIG: Record<string, SitemapEntryConfig> = {
  '/': {
    priority: 1.0,
    changefreq: 'daily',
  },
  '/about': {
    priority: 0.5,
    changefreq: 'monthly',
  },
  '/privacy': {
    priority: 0.3,
    changefreq: 'yearly',
  },
  '/terms': {
    priority: 0.3,
    changefreq: 'yearly',
  },
};

/**
 * Sitemap limits per file (Google recommends max 50,000 URLs per sitemap)
 */
export const SITEMAP_LIMITS = {
  maxUrls: 50000,
  maxFileSize: 50 * 1024 * 1024, // 50MB (Google's limit)
};

/**
 * Sitemap files to generate
 */
export const SITEMAP_FILES = [
  'sitemap-conditions.xml',
  'sitemap-treatments.xml',
  'sitemap-assessments.xml',
  'sitemap-resources.xml',
  'sitemap-hubs.xml',
  'sitemap-static.xml',
] as const;

/**
 * Get sitemap config for entity type
 */
export function getSitemapConfigForEntity(entityType: EntityType): SitemapEntryConfig {
  return ENTITY_SITEMAP_CONFIG[entityType] || {
    priority: 0.5,
    changefreq: 'monthly',
  };
}

/**
 * Get sitemap config for path
 */
export function getSitemapConfigForPath(path: string): SitemapEntryConfig {
  // Check hub pages
  if (HUB_SITEMAP_CONFIG[path]) {
    return HUB_SITEMAP_CONFIG[path];
  }

  // Check static pages
  if (STATIC_SITEMAP_CONFIG[path]) {
    return STATIC_SITEMAP_CONFIG[path];
  }

  // Default
  return {
    priority: 0.5,
    changefreq: 'monthly',
  };
}

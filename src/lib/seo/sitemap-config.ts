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
  // NOTE: /search is excluded from sitemap - it has noindex (see search/layout.tsx)
  '/treatments/compare': {
    priority: 0.8,
    changefreq: 'weekly',
  },
  // ============================================================================
  // TOOLS HUBS - Clinician & Patient
  // ============================================================================
  '/tools': {
    priority: 1.0,
    changefreq: 'daily',
  },
  '/tools/for-clinicians': {
    priority: 1.0,
    changefreq: 'daily',
  },
  '/tools/for-patients': {
    priority: 0.9,
    changefreq: 'weekly',
  },
  // ============================================================================
  // PROGRAMMATIC SEO ROUTES - High-Value Long-Tail
  // ============================================================================
  // Best for Specialty pages (25+ variations)
  '/tools/best-for': {
    priority: 0.9,
    changefreq: 'weekly',
  },
  // Free software category pages
  '/tools/free': {
    priority: 0.9,
    changefreq: 'weekly',
  },
  // Year-based ranking pages (auto-refresh for freshness)
  '/tools/best': {
    priority: 0.95,
    changefreq: 'daily',
  },
  // Comparison pages - high commercial intent
  '/tools/compare': {
    priority: 0.9,
    changefreq: 'weekly',
  },
  // Alternative pages - competitor interception
  '/tools/alternatives': {
    priority: 0.9,
    changefreq: 'weekly',
  },
  // Practice type recommendation pages
  '/tools/for-practices': {
    priority: 0.85,
    changefreq: 'weekly',
  },
  // Pricing pages - high commercial intent
  '/tools/pricing': {
    priority: 0.85,
    changefreq: 'weekly',
  },
};

/**
 * Programmatic page pattern configurations
 * Used for dynamic route generation
 */
export const PROGRAMMATIC_SITEMAP_CONFIG: Record<string, SitemapEntryConfig> = {
  // /tools/best-for/[specialty] - 25+ pages
  'tools/best-for/*': {
    priority: 0.85,
    changefreq: 'weekly',
  },
  // /tools/free/[category] - 8+ pages
  'tools/free/*': {
    priority: 0.8,
    changefreq: 'weekly',
  },
  // /tools/best/[slug] - 30+ year-based pages
  'tools/best/*': {
    priority: 0.9,
    changefreq: 'daily',
  },
  // /tools/compare/[slug] - 80+ comparison pages
  'tools/compare/*': {
    priority: 0.85,
    changefreq: 'weekly',
  },
  // /tools/alternatives/[slug] - competitor pages
  'tools/alternatives/*': {
    priority: 0.8,
    changefreq: 'weekly',
  },
  // /tools/for-practices/[type] - practice size pages
  'tools/for-practices/*': {
    priority: 0.75,
    changefreq: 'weekly',
  },
  // /tools/for-clinicians/[category] - category hubs
  'tools/for-clinicians/*': {
    priority: 0.9,
    changefreq: 'daily',
  },
  // /tools/for-clinicians/[category]/[slug] - product detail pages
  'tools/for-clinicians/*/*': {
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
  // Clinician tools sitemaps (split for large volume)
  'sitemap-tools-clinician.xml',
  'sitemap-tools-patient.xml',
  'sitemap-tools-programmatic.xml', // Free, Best, Compare, Alternatives pages
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

  // Check programmatic patterns
  for (const [pattern, config] of Object.entries(PROGRAMMATIC_SITEMAP_CONFIG)) {
    const regex = new RegExp(`^/${pattern.replace(/\*/g, '[^/]+')}/?$`);
    if (regex.test(path)) {
      return config;
    }
  }

  // Default
  return {
    priority: 0.5,
    changefreq: 'monthly',
  };
}

/**
 * Get sitemap config for a programmatic route pattern
 */
export function getSitemapConfigForPattern(pattern: string): SitemapEntryConfig {
  return PROGRAMMATIC_SITEMAP_CONFIG[pattern] || {
    priority: 0.5,
    changefreq: 'monthly',
  };
}

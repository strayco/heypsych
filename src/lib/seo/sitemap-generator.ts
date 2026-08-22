/**
 * Sitemap Generator
 *
 * Generates XML sitemaps for all entity types and static pages.
 * Follows Google's sitemap protocol: https://www.sitemaps.org/protocol.html
 */

import type { Entity } from "@/lib/types/database";
import { SITE_CONFIG } from "./config";
import {
  getSitemapConfigForEntity,
  getSitemapConfigForPath,
  type ChangeFreq,
  type SitemapPriority,
} from "./sitemap-config";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: SitemapPriority;
}

export interface SitemapOptions {
  baseUrl?: string;
  includeLastmod?: boolean;
  includeChangefreq?: boolean;
  includePriority?: boolean;
}

const DEFAULT_OPTIONS: Required<SitemapOptions> = {
  baseUrl: SITE_CONFIG.url.trim().replace(/\/+$/, ''), // Trim whitespace and trailing slashes
  includeLastmod: true,
  includeChangefreq: true,
  includePriority: true,
};

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date for sitemap (W3C Datetime format)
 */
function formatSitemapDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Generate sitemap XML from URLs
 */
export function generateSitemapXml(urls: SitemapUrl[], options?: SitemapOptions): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const urlEntries = urls
    .map((url) => {
      let entry = `  <url>\n    <loc>${escapeXml(url.loc)}</loc>`;

      if (opts.includeLastmod && url.lastmod) {
        entry += `\n    <lastmod>${formatSitemapDate(url.lastmod)}</lastmod>`;
      }

      if (opts.includeChangefreq && url.changefreq) {
        entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
      }

      if (opts.includePriority && url.priority !== undefined) {
        entry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
      }

      entry += '\n  </url>';
      return entry;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Generate sitemap index XML
 */
export function generateSitemapIndexXml(
  sitemaps: { loc: string; lastmod?: string }[],
  options?: SitemapOptions
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const sitemapEntries = sitemaps
    .map((sitemap) => {
      let entry = `  <sitemap>\n    <loc>${escapeXml(sitemap.loc)}</loc>`;

      if (opts.includeLastmod && sitemap.lastmod) {
        entry += `\n    <lastmod>${formatSitemapDate(sitemap.lastmod)}</lastmod>`;
      }

      entry += '\n  </sitemap>';
      return entry;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}

/**
 * Generate sitemap URLs for entities
 */
export function generateEntitySitemapUrls(
  entities: Entity[],
  pathPrefix: string,
  options?: SitemapOptions
): SitemapUrl[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return entities.map((entity) => {
    const config = getSitemapConfigForEntity(entity.type || 'treatment');
    const url: SitemapUrl = {
      loc: `${opts.baseUrl}${pathPrefix}/${entity.slug}`,
    };

    if (opts.includeLastmod) {
      // Use last_updated if available, otherwise updated_at, otherwise created_at
      const lastmod =
        (entity as any).metadata?.last_updated ||
        (entity as any).updated_at ||
        (entity as any).created_at;

      if (lastmod) {
        url.lastmod = lastmod;
      }
    }

    if (opts.includeChangefreq) {
      url.changefreq = config.changefreq;
    }

    if (opts.includePriority) {
      url.priority = config.priority;
    }

    return url;
  });
}

/**
 * Generate sitemap URLs for static paths
 *
 * SITEMAP FRESHNESS POLICY:
 * Static/hub pages do NOT get lastModified timestamps. Fabricating "today"
 * destroys trust signals. Google recommends omitting lastmod unless it
 * reflects actual content changes.
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#lastmod
 */
export function generateStaticSitemapUrls(
  paths: string[],
  options?: SitemapOptions
): SitemapUrl[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return paths.map((path) => {
    const config = getSitemapConfigForPath(path);
    const url: SitemapUrl = {
      loc: `${opts.baseUrl}${path}`,
    };

    if (opts.includeChangefreq) {
      url.changefreq = config.changefreq;
    }

    if (opts.includePriority) {
      url.priority = config.priority;
    }

    // REMOVED: Fake lastmod using new Date().toISOString()
    // Static pages don't have a meaningful lastmod - omit entirely

    return url;
  });
}

/**
 * Validate sitemap XML size
 */
export function validateSitemapSize(xml: string): {
  valid: boolean;
  size: number;
  urlCount: number;
  errors: string[];
} {
  const size = Buffer.byteLength(xml, 'utf8');
  const urlCount = (xml.match(/<url>/g) || []).length;
  const errors: string[] = [];

  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_URLS = 50000;

  if (size > MAX_SIZE) {
    errors.push(`Sitemap size ${size} bytes exceeds maximum ${MAX_SIZE} bytes`);
  }

  if (urlCount > MAX_URLS) {
    errors.push(`Sitemap contains ${urlCount} URLs, exceeds maximum ${MAX_URLS} URLs`);
  }

  return {
    valid: errors.length === 0,
    size,
    urlCount,
    errors,
  };
}

/**
 * Sitemap Generator Class
 */
export class SitemapGenerator {
  private options: Required<SitemapOptions>;

  constructor(options?: SitemapOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    // Sanitize baseUrl to remove whitespace and trailing slashes
    if (this.options.baseUrl) {
      this.options.baseUrl = this.options.baseUrl.trim().replace(/\/+$/, '');
    }
  }

  /**
   * Generate conditions sitemap
   */
  async generateConditionsSitemap(conditions: Entity[]): Promise<string> {
    const urls = generateEntitySitemapUrls(conditions, '/conditions', this.options);
    return generateSitemapXml(urls, this.options);
  }

  /**
   * Generate treatments sitemap
   */
  async generateTreatmentsSitemap(treatments: Entity[]): Promise<string> {
    const urls = generateEntitySitemapUrls(treatments, '/treatments', this.options);
    return generateSitemapXml(urls, this.options);
  }

  /**
   * Generate assessments sitemap
   */
  async generateAssessmentsSitemap(assessments: Entity[]): Promise<string> {
    const urls = generateEntitySitemapUrls(
      assessments,
      '/resources/assessments-screeners',
      this.options
    );
    return generateSitemapXml(urls, this.options);
  }

  /**
   * Generate resources sitemap (excluding assessments)
   */
  async generateResourcesSitemap(resources: Entity[]): Promise<string> {
    const urls = generateEntitySitemapUrls(resources, '/resources', this.options);
    return generateSitemapXml(urls, this.options);
  }

  /**
   * Generate hubs sitemap
   */
  async generateHubsSitemap(): Promise<string> {
    const hubPaths = [
      '/conditions',
      '/treatments',
      '/treatments/medications',
      '/treatments/therapy',
      '/treatments/interventional',
      '/treatments/alternative',
      '/treatments/supplements',
      '/treatments/investigational',
      '/treatments/compare',
      '/resources',
      '/resources/assessments-screeners',
      '/resources/articles-guides',
      '/resources/support-community',
      '/resources/support-community/immediate-crisis',
      '/resources/support-community/organizations-communities',
      '/psychiatrists',
      '/search',
    ];

    const urls = generateStaticSitemapUrls(hubPaths, this.options);
    return generateSitemapXml(urls, this.options);
  }

  /**
   * Generate static pages sitemap
   */
  async generateStaticSitemap(): Promise<string> {
    const staticPaths = ['/', '/about', '/privacy', '/terms'];

    const urls = generateStaticSitemapUrls(staticPaths, this.options);
    return generateSitemapXml(urls, this.options);
  }

  /**
   * Generate symptoms sitemap
   * Only includes indexable symptoms that pass quality gate
   */
  async generateSymptomsSitemap(): Promise<string> {
    // Import dynamically to avoid server-only module issues
    const { getIndexableSymptoms } = await import('@/domains/symptoms');
    const symptoms = getIndexableSymptoms();

    const urls: SitemapUrl[] = symptoms.map((symptom) => {
      const url: SitemapUrl = {
        loc: `${this.options.baseUrl}/symptoms/${symptom.slug}`,
        changefreq: 'monthly',
        priority: 0.7,
      };

      if (symptom.lastReviewed) {
        url.lastmod = symptom.lastReviewed;
      }

      return url;
    });

    // Add the hub page
    urls.unshift({
      loc: `${this.options.baseUrl}/symptoms`,
      changefreq: 'weekly',
      priority: 0.8,
    });

    return generateSitemapXml(urls, this.options);
  }

  /**
   * Generate sitemap index
   *
   * SITEMAP FRESHNESS POLICY:
   * Sub-sitemap lastmod is intentionally OMITTED. Adding fake "now" timestamps
   * to the index destroys trust signals. Google will discover actual changes
   * by crawling the individual sitemaps.
   *
   * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#lastmod
   */
  async generateSitemapIndex(): Promise<string> {
    const sitemaps = [
      { loc: `${this.options.baseUrl}/sitemap-conditions.xml` },
      { loc: `${this.options.baseUrl}/sitemap-treatments.xml` },
      { loc: `${this.options.baseUrl}/sitemap-symptoms.xml` }, // Symptom exploration pages
      { loc: `${this.options.baseUrl}/sitemap-assessments.xml` },
      { loc: `${this.options.baseUrl}/sitemap-resources.xml` },
      { loc: `${this.options.baseUrl}/sitemap-hubs.xml` },
      { loc: `${this.options.baseUrl}/sitemap-static.xml` },
      { loc: `${this.options.baseUrl}/sitemap-news.xml` },
      { loc: `${this.options.baseUrl}/sitemap-guide.xml` }, // Programmatic SEO pages
      { loc: `${this.options.baseUrl}/sitemap-tools.xml` }, // Tools directory pages
    ];

    // REMOVED: Fake lastmod using new Date().toISOString()
    // Sub-sitemaps don't need lastmod in the index - omit entirely

    return generateSitemapIndexXml(sitemaps, this.options);
  }
}

// Singleton instance
let instance: SitemapGenerator | null = null;

export function getSitemapGenerator(options?: SitemapOptions): SitemapGenerator {
  if (!instance) {
    instance = new SitemapGenerator(options);
  }
  return instance;
}

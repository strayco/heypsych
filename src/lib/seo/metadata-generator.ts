/**
 * MetadataGenerator Base Class
 *
 * Abstract base for all metadata generators. Provides common utilities
 * and enforces consistent metadata generation patterns.
 */

import type { Metadata } from 'next';
import type { Entity } from '@/lib/types/database';
import { SITE_CONFIG, METADATA_LIMITS } from './config';

/**
 * Abstract base class for metadata generation
 */
export abstract class MetadataGenerator {
  /**
   * Generate complete metadata for an entity
   */
  abstract generate(entity: Entity): Promise<Metadata>;

  /**
   * Get the canonical URL path for an entity
   */
  protected abstract getPath(entity: Entity): string;

  /**
   * Truncate text to specified length, adding ellipsis if needed
   */
  protected truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Generate canonical URL for entity
   */
  protected generateCanonical(entity: Entity): string {
    return `${SITE_CONFIG.url}${this.getPath(entity)}`;
  }

  /**
   * Generate robots meta tag based on entity indexability
   *
   * This method determines whether a page should be indexed by search engines.
   * Uses explicit flags and entity status primarily to avoid accidentally
   * noindexing legitimate pages.
   *
   * Noindex if:
   * 1. Explicit noindex flag set (entity.seo?.noindex === true)
   * 2. Entity status is not "active"
   * 3. Content contains explicit placeholder keywords
   * 4. Content is extremely thin (< 100 words - very conservative threshold)
   *
   * @param entity The entity to check for indexability
   * @returns Robots metadata object
   */
  protected generateRobots(entity: Entity): Metadata['robots'] {
    // 1. Check for explicit noindex flag (highest priority)
    if (entity.seo?.noindex === true) {
      return {
        index: false,
        follow: true, // Still follow links even if page isn't indexed
      };
    }

    // 2. Check entity status - only index active entities
    if (entity.status !== 'active') {
      return {
        index: false,
        follow: false, // Don't follow links on inactive pages
      };
    }

    // 3. Check for explicit placeholder content keywords
    // Only flag very obvious placeholder patterns to avoid false positives
    const placeholderKeywords = [
      'coming soon',
      'will be displayed here',
      'reviews coming soon',
      'patient reviews and ratings will be displayed',
    ];

    const content = [
      entity.description || '',
      entity.data?.summary || '',
      JSON.stringify(entity.data?.sections || []),
    ].filter(Boolean).join(' ').toLowerCase();

    const hasExplicitPlaceholder = placeholderKeywords.some(keyword =>
      content.includes(keyword.toLowerCase())
    );

    if (hasExplicitPlaceholder) {
      return {
        index: false,
        follow: true,
      };
    }

    // 4. Check for extremely thin content (very conservative: < 100 words)
    // This threshold is intentionally low to avoid false positives
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 100) {
      return {
        index: false,
        follow: true,
      };
    }

    // Default: fully indexable
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    };
  }

  /**
   * Clean link syntax from text (removes {link:type:slug} patterns)
   */
  protected cleanLinkSyntax(text: string): string {
    return text.replace(/\{link:[^:]+:([^}]+)\}/g, '$1')
               .replace(/\{link:([^}]+)\}/g, '$1');
  }

  /**
   * Generate metadata from SEO overrides if they exist
   */
  protected generateFromOverrides(entity: Entity): Metadata {
    const canonical = this.generateCanonical(entity);

    return {
      title: entity.seo?.title || entity.name,
      description: entity.seo?.description,
      keywords: entity.seo?.keywords?.join(', '),
      alternates: { canonical },
      openGraph: {
        title: entity.seo?.title || entity.name,
        description: entity.seo?.description,
        url: canonical,
        type: 'article',
        siteName: SITE_CONFIG.name
      },
      twitter: {
        card: 'summary_large_image',
        title: entity.seo?.title || entity.name,
        description: entity.seo?.description
      }
    };
  }

  /**
   * Format entity name for display (capitalize, clean)
   */
  protected formatName(name: string): string {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract keywords from various entity fields
   */
  protected extractKeywords(entity: Entity, additionalKeywords: string[] = []): string[] {
    const keywords = new Set<string>();

    // Entity name
    keywords.add(entity.name);

    // Tags
    entity.tags?.forEach(tag => keywords.add(tag));

    // Additional keywords passed in
    additionalKeywords.forEach(kw => keywords.add(kw));

    // SEO overrides
    entity.seo?.keywords?.forEach(kw => keywords.add(kw));

    // Limit to max keywords
    return Array.from(keywords)
      .slice(0, METADATA_LIMITS.keywords.max)
      .filter(kw => kw.length >= 3); // Min 3 chars
  }

  /**
   * Ensure description meets length requirements
   */
  protected ensureDescriptionLength(description: string): string {
    const { min, max, ideal } = METADATA_LIMITS.description;

    // If too short, return as-is (better than truncating)
    if (description.length < min) {
      return description;
    }

    // If within ideal range, return as-is
    if (description.length <= ideal) {
      return description;
    }

    // If too long, truncate to ideal length
    if (description.length > max) {
      return this.truncate(description, ideal);
    }

    return description;
  }

  /**
   * Ensure title meets length requirements
   */
  protected ensureTitleLength(title: string): string {
    const { max, ideal } = METADATA_LIMITS.title;

    if (title.length <= ideal) {
      return title;
    }

    if (title.length > max) {
      return this.truncate(title, ideal);
    }

    return title;
  }

  /**
   * Generate OpenGraph metadata
   */
  protected generateOpenGraph(
    title: string,
    description: string | undefined,
    url: string,
    type: 'article' | 'website' = 'article'
  ): Metadata['openGraph'] {
    return {
      title,
      description,
      url,
      type,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: `${SITE_CONFIG.url}${SITE_CONFIG.defaultOGImage}`,
          width: 1200,
          height: 630,
          alt: `${title} - ${SITE_CONFIG.name}`
        }
      ]
    };
  }

  /**
   * Generate Twitter card metadata
   */
  protected generateTwitterCard(
    title: string,
    description: string | undefined
  ): Metadata['twitter'] {
    return {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitter,
      title,
      description
    };
  }
}

/**
 * Default/fallback metadata generator
 */
export class DefaultMetadataGenerator extends MetadataGenerator {
  async generate(entity: Entity): Promise<Metadata> {
    if (entity.seo?.title || entity.seo?.description) {
      return this.generateFromOverrides(entity);
    }

    const title = this.ensureTitleLength(`${entity.name} | ${SITE_CONFIG.name}`);
    const description = this.ensureDescriptionLength(
      entity.description || `Learn about ${entity.name} on ${SITE_CONFIG.name}.`
    );
    const canonical = this.generateCanonical(entity);
    const keywords = this.extractKeywords(entity);

    return {
      title,
      description,
      keywords: keywords.join(', '),
      alternates: { canonical },
      openGraph: this.generateOpenGraph(title, description, canonical),
      twitter: this.generateTwitterCard(title, description)
    };
  }

  protected getPath(entity: Entity): string {
    // Fallback path logic
    if (entity.type === 'condition') return `/conditions/${entity.slug}`;
    if (entity.type === 'medication') return `/treatments/${entity.slug}`;
    if (entity.type === 'therapy') return `/treatments/${entity.slug}`;
    if (entity.type === 'resource') return `/resources/${entity.slug}`;
    if (entity.type === 'provider') return `/psychiatrists/${entity.slug}`;

    return `/${entity.slug}`;
  }
}

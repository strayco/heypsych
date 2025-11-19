/**
 * SEO Metrics Engine
 *
 * Tracks and reports on SEO health metrics across the entire site.
 * Designed for CI/CD integration and observability.
 */

import type { Entity } from "@/lib/types/database";
import { EntityService } from "@/lib/data/entity-service";
import { MetadataFactory } from "./metadata-factory";
import { SchemaFactory } from "./schema-factory";
import { getPageLinks } from "@/lib/linking/link-service";
import { getClusterBuilder } from "@/lib/clustering";

/**
 * Metadata coverage metrics
 */
export interface MetadataCoverage {
  total_pages: number;
  with_title: number;
  with_description: number;
  with_og_image: number;
  with_twitter_card: number;
  with_canonical: number;
  with_keywords: number;
  coverage_percentage: {
    title: number;
    description: number;
    og_image: number;
    twitter_card: number;
    canonical: number;
    keywords: number;
  };
}

/**
 * Schema coverage metrics
 */
export interface SchemaCoverage {
  total_pages: number;
  with_schema: number;
  avg_schemas_per_page: number;
  schema_types: Record<string, number>;
  coverage_percentage: number;
}

/**
 * Internal link coverage metrics
 */
export interface LinkCoverage {
  total_pages: number;
  total_internal_links: number;
  avg_links_per_page: number;
  pages_with_min_links: number; // Pages meeting minimum threshold
  orphan_pages: number; // Pages with 0 inbound links
  link_distribution: {
    min: number;
    max: number;
    median: number;
  };
}

/**
 * E-A-T coverage metrics
 */
export interface EATCoverage {
  total_pages: number;
  with_author: number;
  with_medical_reviewer: number;
  with_review_date: number;
  with_published_date: number;
  with_updated_date: number;
  coverage_percentage: {
    author: number;
    medical_reviewer: number;
    review_date: number;
    published_date: number;
    updated_date: number;
  };
}

/**
 * Cluster metrics
 */
export interface ClusterMetrics {
  total_clusters: number;
  total_entities: number;
  clustered_entities: number;
  orphan_entities: number;
  coverage_percentage: number;
  avg_cluster_size: number;
  avg_cluster_strength: number;
  clusters_by_category: Record<string, number>;
}

/**
 * Broken link report
 */
export interface BrokenLinkReport {
  total_links_checked: number;
  broken_links: {
    source_page: string;
    target_slug: string;
    link_type: string;
  }[];
  broken_count: number;
}

/**
 * Complete SEO metrics report
 */
export interface SEOMetricsReport {
  generated_at: string;
  metadata: MetadataCoverage;
  schema: SchemaCoverage;
  links: LinkCoverage;
  eat: EATCoverage;
  clusters: ClusterMetrics;
  broken_links: BrokenLinkReport;
  summary: {
    total_pages: number;
    health_score: number; // 0-100
    issues_count: number;
    warnings_count: number;
  };
  issues: string[];
  warnings: string[];
}

/**
 * Metrics thresholds for validation
 */
export const METRICS_THRESHOLDS = {
  metadata: {
    title_coverage_min: 100,
    description_coverage_min: 95,
    og_image_coverage_min: 90,
  },
  schema: {
    coverage_min: 100,
    avg_schemas_min: 2,
  },
  links: {
    min_links_per_page: 10,
    min_pages_with_threshold: 90, // % of pages with min links
    max_orphans: 0,
  },
  eat: {
    author_coverage_min: 50,
    medical_reviewer_coverage_min: 30,
  },
  clusters: {
    coverage_min: 70,
  },
};

/**
 * SEO Metrics Engine
 */
export class SEOMetricsEngine {
  /**
   * Generate complete metrics report
   */
  async generateReport(): Promise<SEOMetricsReport> {
    console.log('🔍 Generating SEO metrics report...');

    const entities = await EntityService.getAll();
    const activeEntities = entities.filter((e) => e.status === 'active');

    console.log(`📊 Analyzing ${activeEntities.length} active entities...`);

    // Run all metrics in parallel
    const [metadata, schema, links, eat, clusters, brokenLinks] = await Promise.all([
      this.analyzeMetadata(activeEntities),
      this.analyzeSchema(activeEntities),
      this.analyzeLinks(activeEntities),
      this.analyzeEAT(activeEntities),
      this.analyzeClusters(activeEntities),
      this.analyzeBrokenLinks(activeEntities),
    ]);

    // Collect issues and warnings
    const issues: string[] = [];
    const warnings: string[] = [];

    // Metadata issues
    if (metadata.coverage_percentage.title < METRICS_THRESHOLDS.metadata.title_coverage_min) {
      issues.push(
        `Title coverage ${metadata.coverage_percentage.title.toFixed(1)}% below threshold ${METRICS_THRESHOLDS.metadata.title_coverage_min}%`
      );
    }

    if (metadata.coverage_percentage.description < METRICS_THRESHOLDS.metadata.description_coverage_min) {
      warnings.push(
        `Description coverage ${metadata.coverage_percentage.description.toFixed(1)}% below threshold ${METRICS_THRESHOLDS.metadata.description_coverage_min}%`
      );
    }

    // Schema issues
    if (schema.coverage_percentage < METRICS_THRESHOLDS.schema.coverage_min) {
      issues.push(
        `Schema coverage ${schema.coverage_percentage.toFixed(1)}% below threshold ${METRICS_THRESHOLDS.schema.coverage_min}%`
      );
    }

    // Link issues
    if (links.orphan_pages > METRICS_THRESHOLDS.links.max_orphans) {
      issues.push(`Found ${links.orphan_pages} orphan pages (max allowed: ${METRICS_THRESHOLDS.links.max_orphans})`);
    }

    if (links.avg_links_per_page < METRICS_THRESHOLDS.links.min_links_per_page) {
      warnings.push(
        `Average links per page ${links.avg_links_per_page.toFixed(1)} below threshold ${METRICS_THRESHOLDS.links.min_links_per_page}`
      );
    }

    // Broken links
    if (brokenLinks.broken_count > 0) {
      issues.push(`Found ${brokenLinks.broken_count} broken internal links`);
    }

    // Calculate health score (0-100)
    const healthScore = this.calculateHealthScore({
      metadata,
      schema,
      links,
      eat,
      clusters,
      brokenLinks,
    });

    return {
      generated_at: new Date().toISOString(),
      metadata,
      schema,
      links,
      eat,
      clusters,
      broken_links: brokenLinks,
      summary: {
        total_pages: activeEntities.length,
        health_score: healthScore,
        issues_count: issues.length,
        warnings_count: warnings.length,
      },
      issues,
      warnings,
    };
  }

  /**
   * Analyze metadata coverage
   */
  private async analyzeMetadata(entities: Entity[]): Promise<MetadataCoverage> {
    let withTitle = 0;
    let withDescription = 0;
    let withOgImage = 0;
    let withTwitterCard = 0;
    let withCanonical = 0;
    let withKeywords = 0;

    for (const entity of entities) {
      const metadata = await MetadataFactory.generate(entity);

      if (metadata.title) withTitle++;
      if (metadata.description) withDescription++;
      if (metadata.openGraph?.images) withOgImage++;
      if (metadata.twitter?.card) withTwitterCard++;
      if (metadata.alternates?.canonical) withCanonical++;
      if (metadata.keywords) withKeywords++;
    }

    const total = entities.length;

    return {
      total_pages: total,
      with_title: withTitle,
      with_description: withDescription,
      with_og_image: withOgImage,
      with_twitter_card: withTwitterCard,
      with_canonical: withCanonical,
      with_keywords: withKeywords,
      coverage_percentage: {
        title: (withTitle / total) * 100,
        description: (withDescription / total) * 100,
        og_image: (withOgImage / total) * 100,
        twitter_card: (withTwitterCard / total) * 100,
        canonical: (withCanonical / total) * 100,
        keywords: (withKeywords / total) * 100,
      },
    };
  }

  /**
   * Analyze schema coverage
   */
  private async analyzeSchema(entities: Entity[]): Promise<SchemaCoverage> {
    let withSchema = 0;
    let totalSchemas = 0;
    const schemaTypes: Record<string, number> = {};

    for (const entity of entities) {
      const schemas = SchemaFactory.generateAll(entity);

      if (schemas.length > 0) {
        withSchema++;
        totalSchemas += schemas.length;

        schemas.forEach((schema: any) => {
          const type = schema['@type'] || 'Unknown';
          schemaTypes[type] = (schemaTypes[type] || 0) + 1;
        });
      }
    }

    const total = entities.length;

    return {
      total_pages: total,
      with_schema: withSchema,
      avg_schemas_per_page: totalSchemas / total,
      schema_types: schemaTypes,
      coverage_percentage: (withSchema / total) * 100,
    };
  }

  /**
   * Analyze link coverage
   */
  private async analyzeLinks(entities: Entity[]): Promise<LinkCoverage> {
    const linkCounts: number[] = [];
    const inboundCounts = new Map<string, number>();

    // Initialize inbound counts
    entities.forEach((e) => inboundCounts.set(e.id, 0));

    // Calculate outbound links and track inbound
    for (const entity of entities) {
      const pageLinks = await getPageLinks(entity, entities);
      const totalLinks = pageLinks.allLinks.length;

      linkCounts.push(totalLinks);

      // Track inbound links
      pageLinks.allLinks.forEach((link) => {
        if (link.targetId) {
          const current = inboundCounts.get(link.targetId) || 0;
          inboundCounts.set(link.targetId, current + 1);
        }
      });
    }

    const total = entities.length;
    const totalLinks = linkCounts.reduce((sum, count) => sum + count, 0);
    const avgLinks = totalLinks / total;

    // Pages with minimum links
    const pagesWithMinLinks = linkCounts.filter(
      (count) => count >= METRICS_THRESHOLDS.links.min_links_per_page
    ).length;

    // Orphan pages (0 inbound links)
    const orphans = Array.from(inboundCounts.values()).filter((count) => count === 0).length;

    // Distribution
    const sortedCounts = [...linkCounts].sort((a, b) => a - b);
    const median = sortedCounts[Math.floor(sortedCounts.length / 2)];

    return {
      total_pages: total,
      total_internal_links: totalLinks,
      avg_links_per_page: avgLinks,
      pages_with_min_links: pagesWithMinLinks,
      orphan_pages: orphans,
      link_distribution: {
        min: Math.min(...linkCounts),
        max: Math.max(...linkCounts),
        median,
      },
    };
  }

  /**
   * Analyze E-A-T coverage
   */
  private async analyzeEAT(entities: Entity[]): Promise<EATCoverage> {
    let withAuthor = 0;
    let withMedicalReviewer = 0;
    let withReviewDate = 0;
    let withPublishedDate = 0;
    let withUpdatedDate = 0;

    for (const entity of entities) {
      const metadata = (entity as any).metadata || {};

      if (metadata.author) withAuthor++;
      if (metadata.medical_reviewer) withMedicalReviewer++;
      if (metadata.medical_review?.review_date) withReviewDate++;
      if (metadata.published_date) withPublishedDate++;
      if (metadata.last_updated) withUpdatedDate++;
    }

    const total = entities.length;

    return {
      total_pages: total,
      with_author: withAuthor,
      with_medical_reviewer: withMedicalReviewer,
      with_review_date: withReviewDate,
      with_published_date: withPublishedDate,
      with_updated_date: withUpdatedDate,
      coverage_percentage: {
        author: (withAuthor / total) * 100,
        medical_reviewer: (withMedicalReviewer / total) * 100,
        review_date: (withReviewDate / total) * 100,
        published_date: (withPublishedDate / total) * 100,
        updated_date: (withUpdatedDate / total) * 100,
      },
    };
  }

  /**
   * Analyze cluster coverage
   */
  private async analyzeClusters(entities: Entity[]): Promise<ClusterMetrics> {
    const clusterBuilder = getClusterBuilder();
    const analysis = await clusterBuilder.analyze(entities);

    const avgSize =
      analysis.clusters.reduce((sum, c) => sum + c.metadata.entity_count, 0) /
      (analysis.clusters.length || 1);

    const avgStrength =
      analysis.clusters.reduce((sum, c) => sum + c.strength, 0) / (analysis.clusters.length || 1);

    const clustersByCategory: Record<string, number> = {};
    analysis.clusters.forEach((c) => {
      clustersByCategory[c.category] = (clustersByCategory[c.category] || 0) + 1;
    });

    const clusteredCount = entities.length - analysis.orphans.length;

    return {
      total_clusters: analysis.clusters.length,
      total_entities: entities.length,
      clustered_entities: clusteredCount,
      orphan_entities: analysis.orphans.length,
      coverage_percentage: (clusteredCount / entities.length) * 100,
      avg_cluster_size: avgSize,
      avg_cluster_strength: avgStrength,
      clusters_by_category: clustersByCategory,
    };
  }

  /**
   * Analyze broken links
   */
  private async analyzeBrokenLinks(entities: Entity[]): Promise<BrokenLinkReport> {
    const broken: BrokenLinkReport['broken_links'] = [];
    const entitySlugs = new Set(entities.map((e) => e.slug));
    let totalLinksChecked = 0;

    for (const entity of entities) {
      const pageLinks = await getPageLinks(entity, entities);

      for (const link of pageLinks.allLinks) {
        totalLinksChecked++;

        // Check if target exists
        if (!entitySlugs.has(link.targetSlug)) {
          broken.push({
            source_page: entity.slug,
            target_slug: link.targetSlug,
            link_type: link.linkType,
          });
        }
      }
    }

    return {
      total_links_checked: totalLinksChecked,
      broken_links: broken,
      broken_count: broken.length,
    };
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(metrics: {
    metadata: MetadataCoverage;
    schema: SchemaCoverage;
    links: LinkCoverage;
    eat: EATCoverage;
    clusters: ClusterMetrics;
    brokenLinks: BrokenLinkReport;
  }): number {
    let score = 0;

    // Metadata (25 points)
    score += (metrics.metadata.coverage_percentage.title / 100) * 10;
    score += (metrics.metadata.coverage_percentage.description / 100) * 10;
    score += (metrics.metadata.coverage_percentage.og_image / 100) * 5;

    // Schema (20 points)
    score += (metrics.schema.coverage_percentage / 100) * 20;

    // Links (30 points)
    const linkScore =
      metrics.links.orphan_pages === 0
        ? 15
        : Math.max(0, 15 - metrics.links.orphan_pages * 2);
    score += linkScore;

    const avgLinkScore =
      (Math.min(metrics.links.avg_links_per_page, 50) / 50) * 15;
    score += avgLinkScore;

    // E-A-T (15 points)
    score += (metrics.eat.coverage_percentage.author / 100) * 7;
    score += (metrics.eat.coverage_percentage.medical_reviewer / 100) * 8;

    // Clusters (10 points)
    score += (metrics.clusters.coverage_percentage / 100) * 10;

    // Broken links penalty
    if (metrics.brokenLinks.broken_count > 0) {
      score -= Math.min(10, metrics.brokenLinks.broken_count);
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }
}

// Singleton instance
let instance: SEOMetricsEngine | null = null;

export function getSEOMetricsEngine(): SEOMetricsEngine {
  if (!instance) {
    instance = new SEOMetricsEngine();
  }
  return instance;
}

/**
 * SEO Metrics Collector
 * 
 * Collects and aggregates SEO health metrics across all entities.
 * Used for observability, guardrails, and CI validation.
 */

import type { Entity, EntityType } from '@/lib/types/database';
import { hasAuthor, hasMedicalReviewer, hasEditorialDates } from '@/lib/types/editorial';
import { MetadataFactory } from './metadata-factory';
import { SchemaFactory } from './schema-factory';
import { getEntityType } from '@/lib/utils/entity-type';

/**
 * Metrics for a single page/entity
 */
export interface PageMetrics {
  slug: string;
  entityType: EntityType;
  
  // Metadata metrics
  hasTitle: boolean;
  hasTitleCorrectLength: boolean;
  hasDescription: boolean;
  hasDescriptionCorrectLength: boolean;
  hasCanonical: boolean;
  hasOpenGraph: boolean;
  
  // Schema metrics
  schemaCount: number;
  schemaTypes: string[];
  hasPrimarySchema: boolean;
  hasMedicalWebPage: boolean;
  hasBreadcrumb: boolean;
  hasPersonSchema: boolean;
  hasOrganizationSchema: boolean;
  hasFAQSchema: boolean;
  
  // E-A-T metrics
  hasAuthor: boolean;
  hasMedicalReviewer: boolean;
  hasReviewDate: boolean;
  hasPublishedDate: boolean;
  daysSinceLastReview: number | null;
  
  // Linking metrics
  internalLinkCount: number;
  
  // Overall health
  healthScore: number;
  issues: string[];
}

/**
 * Aggregate metrics across all pages
 */
export interface AggregateMetrics {
  totalPages: number;
  timestamp: string;
  
  // Coverage percentages
  metadataCoverage: {
    withTitle: number;
    withDescription: number;
    withCanonical: number;
    withOpenGraph: number;
  };
  
  schemaCoverage: {
    withPrimarySchema: number;
    withMedicalWebPage: number;
    withBreadcrumb: number;
    withPersonSchema: number;
    withOrganizationSchema: number;
    withFAQ: number;
    averageSchemaCount: number;
  };
  
  eatCoverage: {
    withAuthor: number;
    withMedicalReviewer: number;
    withReviewDate: number;
    averageDaysSinceReview: number;
    pagesNeedingReview: number; // >365 days old
  };
  
  linkingMetrics: {
    averageLinksPerPage: number;
    byEntityType: Record<EntityType, number>;
  };
  
  // Health
  averageHealthScore: number;
  healthByType: Record<EntityType, number>;
  criticalIssues: string[];
  
  // Breakdown by type
  byEntityType: Record<EntityType, {
    count: number;
    healthScore: number;
    metadataCoverage: number;
    eatCoverage: number;
  }>;
}

/**
 * SEO Metrics Collector
 */
export class SEOMetricsCollector {
  /**
   * Collect metrics for a single entity
   */
  static async collectPageMetrics(entity: Entity): Promise<PageMetrics> {
    const issues: string[] = [];
    const entityType = getEntityType(entity);
    
    // Collect metadata metrics
    const metadata = await MetadataFactory.generate(entity);
    const title = typeof metadata.title === 'string' ? metadata.title : '';
    const description = metadata.description || '';
    
    const hasTitle = title.length > 0;
    const hasTitleCorrectLength = title.length >= 30 && title.length <= 60;
    const hasDescription = description.length > 0;
    const hasDescriptionCorrectLength = description.length >= 70 && description.length <= 160;
    const hasCanonical = !!metadata.alternates?.canonical;
    const hasOpenGraph = !!metadata.openGraph?.title && !!metadata.openGraph?.description;
    
    if (!hasTitle) issues.push('Missing title');
    if (!hasTitleCorrectLength && hasTitle) issues.push('Title length outside 30-60 chars');
    if (!hasDescription) issues.push('Missing description');
    if (!hasDescriptionCorrectLength && hasDescription) issues.push('Description length outside 70-160 chars');
    if (!hasCanonical) issues.push('Missing canonical URL');
    if (!hasOpenGraph) issues.push('Missing OpenGraph tags');
    
    // Collect schema metrics
    const schemas = SchemaFactory.generateAll(entity);
    const schemaTypes = schemas.map(s => s['@type']).filter(Boolean);
    
    const hasPrimarySchema = schemaTypes.some(t => 
      ['MedicalCondition', 'Drug', 'MedicalTherapy', 'Article', 'MedicalRiskEstimator'].includes(t)
    );
    const hasMedicalWebPage = schemaTypes.includes('MedicalWebPage');
    const hasBreadcrumb = schemaTypes.includes('BreadcrumbList');
    const hasPersonSchema = schemaTypes.includes('Person');
    const hasOrganizationSchema = schemaTypes.some(t => 
      ['Organization', 'MedicalOrganization'].includes(t)
    );
    const hasFAQSchema = schemaTypes.includes('FAQPage');
    
    if (!hasPrimarySchema) issues.push('Missing primary schema');
    if (!hasMedicalWebPage) issues.push('Missing MedicalWebPage schema');
    if (!hasPersonSchema) issues.push('Missing Person schema');
    if (!hasOrganizationSchema) issues.push('Missing Organization schema');
    
    // Collect E-A-T metrics
    const entityHasAuthor = hasAuthor(entity);
    const entityHasMedicalReviewer = hasMedicalReviewer(entity);
    const entityHasReviewDate = hasEditorialDates(entity);
    const hasPublishedDate = !!entity.created_at;
    
    if (!entityHasMedicalReviewer && !entity.editorial?.medicalReviewerIds?.length) {
      issues.push('No medical reviewer attribution');
    }
    
    // Calculate days since last review
    let daysSinceLastReview: number | null = null;
    if (entity.editorial?.dates?.lastMedicallyReviewed) {
      const lastReview = new Date(entity.editorial.dates.lastMedicallyReviewed);
      daysSinceLastReview = Math.floor((Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastReview > 365) {
        issues.push(`Content needs review (${daysSinceLastReview} days old)`);
      }
    } else if (entity.editorial?.lastReviewed) {
      const lastReview = new Date(entity.editorial.lastReviewed);
      daysSinceLastReview = Math.floor((Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // Count internal links (rough estimate from data structure)
    let internalLinkCount = 0;
    const dataString = JSON.stringify(entity.data || {});
    const linkMatches = dataString.match(/\{link:[^}]+\}/g);
    if (linkMatches) {
      internalLinkCount = linkMatches.length;
    }
    
    // Calculate health score (0-100)
    let healthScore = 100;
    
    // Metadata penalties
    if (!hasTitle) healthScore -= 20;
    else if (!hasTitleCorrectLength) healthScore -= 5;
    if (!hasDescription) healthScore -= 15;
    else if (!hasDescriptionCorrectLength) healthScore -= 5;
    if (!hasCanonical) healthScore -= 5;
    if (!hasOpenGraph) healthScore -= 5;
    
    // Schema penalties
    if (!hasPrimarySchema) healthScore -= 10;
    if (!hasMedicalWebPage) healthScore -= 5;
    if (!hasPersonSchema && !hasOrganizationSchema) healthScore -= 10;
    
    // E-A-T penalties
    if (!entityHasMedicalReviewer && !entity.editorial?.medicalReviewerIds?.length) healthScore -= 15;
    if (daysSinceLastReview && daysSinceLastReview > 365) healthScore -= 10;
    
    // Linking penalties
    if (internalLinkCount < 5) healthScore -= 5;
    
    healthScore = Math.max(0, healthScore);
    
    return {
      slug: entity.slug,
      entityType,
      
      hasTitle,
      hasTitleCorrectLength,
      hasDescription,
      hasDescriptionCorrectLength,
      hasCanonical,
      hasOpenGraph,
      
      schemaCount: schemas.length,
      schemaTypes,
      hasPrimarySchema,
      hasMedicalWebPage,
      hasBreadcrumb,
      hasPersonSchema,
      hasOrganizationSchema,
      hasFAQSchema,
      
      hasAuthor: entityHasAuthor,
      hasMedicalReviewer: entityHasMedicalReviewer,
      hasReviewDate: entityHasReviewDate,
      hasPublishedDate,
      daysSinceLastReview,
      
      internalLinkCount,
      
      healthScore,
      issues,
    };
  }
  
  /**
   * Collect aggregate metrics across all entities
   */
  static async collectAggregateMetrics(entities: Entity[]): Promise<AggregateMetrics> {
    const pageMetrics: PageMetrics[] = [];
    
    // Collect metrics for all entities
    for (const entity of entities) {
      try {
        const metrics = await this.collectPageMetrics(entity);
        pageMetrics.push(metrics);
      } catch (error) {
        console.error(`Error collecting metrics for ${entity.slug}:`, error);
      }
    }
    
    const totalPages = pageMetrics.length;
    
    if (totalPages === 0) {
      return this.getEmptyMetrics();
    }
    
    // Calculate coverage percentages
    const metadataCoverage = {
      withTitle: (pageMetrics.filter(p => p.hasTitle).length / totalPages) * 100,
      withDescription: (pageMetrics.filter(p => p.hasDescription).length / totalPages) * 100,
      withCanonical: (pageMetrics.filter(p => p.hasCanonical).length / totalPages) * 100,
      withOpenGraph: (pageMetrics.filter(p => p.hasOpenGraph).length / totalPages) * 100,
    };
    
    const schemaCoverage = {
      withPrimarySchema: (pageMetrics.filter(p => p.hasPrimarySchema).length / totalPages) * 100,
      withMedicalWebPage: (pageMetrics.filter(p => p.hasMedicalWebPage).length / totalPages) * 100,
      withBreadcrumb: (pageMetrics.filter(p => p.hasBreadcrumb).length / totalPages) * 100,
      withPersonSchema: (pageMetrics.filter(p => p.hasPersonSchema).length / totalPages) * 100,
      withOrganizationSchema: (pageMetrics.filter(p => p.hasOrganizationSchema).length / totalPages) * 100,
      withFAQ: (pageMetrics.filter(p => p.hasFAQSchema).length / totalPages) * 100,
      averageSchemaCount: pageMetrics.reduce((sum, p) => sum + p.schemaCount, 0) / totalPages,
    };
    
    const validReviewDays = pageMetrics
      .filter(p => p.daysSinceLastReview !== null)
      .map(p => p.daysSinceLastReview as number);
    
    const eatCoverage = {
      withAuthor: (pageMetrics.filter(p => p.hasAuthor).length / totalPages) * 100,
      withMedicalReviewer: (pageMetrics.filter(p => p.hasMedicalReviewer).length / totalPages) * 100,
      withReviewDate: (pageMetrics.filter(p => p.hasReviewDate).length / totalPages) * 100,
      averageDaysSinceReview: validReviewDays.length > 0 
        ? validReviewDays.reduce((sum, d) => sum + d, 0) / validReviewDays.length 
        : 0,
      pagesNeedingReview: pageMetrics.filter(p => 
        p.daysSinceLastReview !== null && p.daysSinceLastReview > 365
      ).length,
    };
    
    // Calculate linking metrics by type
    const linkingByType: Record<string, number[]> = {};
    for (const p of pageMetrics) {
      if (!linkingByType[p.entityType]) {
        linkingByType[p.entityType] = [];
      }
      linkingByType[p.entityType].push(p.internalLinkCount);
    }
    
    const linkingMetrics = {
      averageLinksPerPage: pageMetrics.reduce((sum, p) => sum + p.internalLinkCount, 0) / totalPages,
      byEntityType: Object.fromEntries(
        Object.entries(linkingByType).map(([type, counts]) => [
          type,
          counts.reduce((sum, c) => sum + c, 0) / counts.length
        ])
      ) as Record<EntityType, number>,
    };
    
    // Calculate health by type
    const healthByType: Record<string, number[]> = {};
    for (const p of pageMetrics) {
      if (!healthByType[p.entityType]) {
        healthByType[p.entityType] = [];
      }
      healthByType[p.entityType].push(p.healthScore);
    }
    
    // Breakdown by entity type
    const byEntityType: Record<string, any> = {};
    for (const [type, scores] of Object.entries(healthByType)) {
      const typeMetrics = pageMetrics.filter(p => p.entityType === type);
      byEntityType[type] = {
        count: typeMetrics.length,
        healthScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        metadataCoverage: (typeMetrics.filter(p => p.hasTitle && p.hasDescription).length / typeMetrics.length) * 100,
        eatCoverage: (typeMetrics.filter(p => p.hasMedicalReviewer || p.hasReviewDate).length / typeMetrics.length) * 100,
      };
    }
    
    // Collect critical issues
    const issueCounts: Record<string, number> = {};
    for (const p of pageMetrics) {
      for (const issue of p.issues) {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      }
    }
    
    const criticalIssues = Object.entries(issueCounts)
      .filter(([, count]) => count > totalPages * 0.1) // Issues affecting >10% of pages
      .sort((a, b) => b[1] - a[1])
      .map(([issue, count]) => `${issue} (${count} pages, ${((count / totalPages) * 100).toFixed(1)}%)`);
    
    return {
      totalPages,
      timestamp: new Date().toISOString(),
      
      metadataCoverage,
      schemaCoverage,
      eatCoverage,
      linkingMetrics,
      
      averageHealthScore: pageMetrics.reduce((sum, p) => sum + p.healthScore, 0) / totalPages,
      healthByType: Object.fromEntries(
        Object.entries(healthByType).map(([type, scores]) => [
          type,
          scores.reduce((sum, s) => sum + s, 0) / scores.length
        ])
      ) as Record<EntityType, number>,
      criticalIssues,
      
      byEntityType: byEntityType as Record<EntityType, any>,
    };
  }
  
  /**
   * Get empty metrics structure
   */
  private static getEmptyMetrics(): AggregateMetrics {
    return {
      totalPages: 0,
      timestamp: new Date().toISOString(),
      metadataCoverage: {
        withTitle: 0,
        withDescription: 0,
        withCanonical: 0,
        withOpenGraph: 0,
      },
      schemaCoverage: {
        withPrimarySchema: 0,
        withMedicalWebPage: 0,
        withBreadcrumb: 0,
        withPersonSchema: 0,
        withOrganizationSchema: 0,
        withFAQ: 0,
        averageSchemaCount: 0,
      },
      eatCoverage: {
        withAuthor: 0,
        withMedicalReviewer: 0,
        withReviewDate: 0,
        averageDaysSinceReview: 0,
        pagesNeedingReview: 0,
      },
      linkingMetrics: {
        averageLinksPerPage: 0,
        byEntityType: {} as Record<EntityType, number>,
      },
      averageHealthScore: 0,
      healthByType: {} as Record<EntityType, number>,
      criticalIssues: [],
      byEntityType: {} as Record<EntityType, any>,
    };
  }
  
  /**
   * Format metrics for console output
   */
  static formatMetricsReport(metrics: AggregateMetrics): string {
    const lines: string[] = [
      '═══════════════════════════════════════════════════════════════',
      '                    SEO HEALTH REPORT',
      '═══════════════════════════════════════════════════════════════',
      '',
      `📊 Total Pages Analyzed: ${metrics.totalPages}`,
      `⏰ Generated: ${new Date(metrics.timestamp).toLocaleString()}`,
      '',
      '📝 METADATA COVERAGE',
      '───────────────────────────────────────────────────────────────',
      `  ✅ With Title:       ${metrics.metadataCoverage.withTitle.toFixed(1)}%`,
      `  ✅ With Description: ${metrics.metadataCoverage.withDescription.toFixed(1)}%`,
      `  ✅ With Canonical:   ${metrics.metadataCoverage.withCanonical.toFixed(1)}%`,
      `  ✅ With OpenGraph:   ${metrics.metadataCoverage.withOpenGraph.toFixed(1)}%`,
      '',
      '🏗️  SCHEMA.ORG COVERAGE',
      '───────────────────────────────────────────────────────────────',
      `  ✅ Primary Schema:    ${metrics.schemaCoverage.withPrimarySchema.toFixed(1)}%`,
      `  ✅ MedicalWebPage:    ${metrics.schemaCoverage.withMedicalWebPage.toFixed(1)}%`,
      `  ✅ BreadcrumbList:    ${metrics.schemaCoverage.withBreadcrumb.toFixed(1)}%`,
      `  ✅ Person:            ${metrics.schemaCoverage.withPersonSchema.toFixed(1)}%`,
      `  ✅ Organization:      ${metrics.schemaCoverage.withOrganizationSchema.toFixed(1)}%`,
      `  ✅ FAQPage:           ${metrics.schemaCoverage.withFAQ.toFixed(1)}%`,
      `  📈 Avg Schemas/Page:  ${metrics.schemaCoverage.averageSchemaCount.toFixed(1)}`,
      '',
      '🏆 E-A-T COMPLIANCE',
      '───────────────────────────────────────────────────────────────',
      `  ✅ With Author:       ${metrics.eatCoverage.withAuthor.toFixed(1)}%`,
      `  ✅ With Reviewer:     ${metrics.eatCoverage.withMedicalReviewer.toFixed(1)}%`,
      `  ✅ With Review Date:  ${metrics.eatCoverage.withReviewDate.toFixed(1)}%`,
      `  📅 Avg Days Since Review: ${metrics.eatCoverage.averageDaysSinceReview.toFixed(0)} days`,
      `  ⚠️  Needs Review:     ${metrics.eatCoverage.pagesNeedingReview} pages`,
      '',
      '🔗 INTERNAL LINKING',
      '───────────────────────────────────────────────────────────────',
      `  📈 Avg Links/Page:    ${metrics.linkingMetrics.averageLinksPerPage.toFixed(1)}`,
      '',
      '💯 HEALTH SCORES',
      '───────────────────────────────────────────────────────────────',
      `  Overall:              ${metrics.averageHealthScore.toFixed(1)}/100`,
    ];
    
    // Add health by type
    for (const [type, score] of Object.entries(metrics.healthByType)) {
      lines.push(`  ${type.padEnd(20)} ${score.toFixed(1)}/100`);
    }
    
    // Add critical issues
    if (metrics.criticalIssues.length > 0) {
      lines.push('');
      lines.push('⚠️  CRITICAL ISSUES');
      lines.push('───────────────────────────────────────────────────────────────');
      for (const issue of metrics.criticalIssues) {
        lines.push(`  ❌ ${issue}`);
      }
    }
    
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    
    return lines.join('\n');
  }
}

export default SEOMetricsCollector;

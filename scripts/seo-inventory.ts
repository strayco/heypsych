#!/usr/bin/env npx ts-node
/**
 * SEO SEARCH SURFACE INVENTORY
 *
 * Generates a machine-readable inventory of all indexable URLs, route families,
 * and SEO health metrics. This is the foundation for the SEO Control Plane.
 *
 * Usage: npx ts-node scripts/seo-inventory.ts
 *
 * Output: JSON inventory to stdout or file
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteFamily {
  name: string;
  pattern: string;
  type: 'static' | 'dynamic' | 'programmatic';
  category: 'strategic' | 'supporting' | 'utility' | 'navigational' | 'experimental' | 'noindex' | 'private';
  inSitemap: boolean;
  entityCount: number;
  examples: string[];
  seoStatus: 'healthy' | 'warning' | 'critical';
  issues: string[];
}

interface SEOInventory {
  generatedAt: string;
  summary: {
    totalRoutes: number;
    totalEntities: number;
    indexableRoutes: number;
    sitemapUrls: number;
    routeFamilies: number;
    healthScore: number;
    criticalIssues: number;
    warnings: number;
  };
  routeFamilies: RouteFamily[];
  p0Issues: Array<{ id: string; severity: 'critical'; description: string; location: string; status: 'fixed' | 'pending' | 'requires_review' }>;
  p1Issues: Array<{ id: string; severity: 'high'; description: string; location: string; status: 'pending' | 'in_progress' }>;
  entityCounts: {
    conditions: number;
    treatments: number;
    resources: number;
    tools: number;
    guides: number;
    providers: number;
  };
}

function countJsonFiles(dirPath: string): number {
  try {
    let count = 0;
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        count += countJsonFiles(fullPath);
      } else if (item.endsWith('.json') && !item.includes('.legacy') && !item.includes('.backup')) {
        count++;
      }
    }

    return count;
  } catch {
    return 0;
  }
}

function generateInventory(): SEOInventory {
  const dataDir = path.join(process.cwd(), 'data');

  // Count entities
  const conditionsCount = countJsonFiles(path.join(dataDir, 'conditions'));
  const treatmentsCount = countJsonFiles(path.join(dataDir, 'treatments'));
  const resourcesCount = countJsonFiles(path.join(dataDir, 'resources'));

  // Define route families
  const routeFamilies: RouteFamily[] = [
    {
      name: 'Homepage',
      pattern: '/',
      type: 'static',
      category: 'strategic',
      inSitemap: true,
      entityCount: 1,
      examples: ['/'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Conditions Hub',
      pattern: '/conditions',
      type: 'static',
      category: 'strategic',
      inSitemap: true,
      entityCount: 1,
      examples: ['/conditions'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Condition Category Pages',
      pattern: '/conditions/[category]',
      type: 'static',
      category: 'navigational',
      inSitemap: true,
      entityCount: 16,
      examples: ['/conditions/anxiety-fear', '/conditions/mood-depression', '/conditions/trauma-stress'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Condition Detail Pages',
      pattern: '/conditions/[slug]',
      type: 'dynamic',
      category: 'strategic',
      inSitemap: true,
      entityCount: conditionsCount,
      examples: ['/conditions/major-depressive-disorder', '/conditions/generalized-anxiety-disorder'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Treatments Hub',
      pattern: '/treatments',
      type: 'static',
      category: 'strategic',
      inSitemap: true,
      entityCount: 1,
      examples: ['/treatments'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Treatment Category Pages',
      pattern: '/treatments/[category]',
      type: 'static',
      category: 'navigational',
      inSitemap: true,
      entityCount: 6,
      examples: ['/treatments/medications', '/treatments/therapy', '/treatments/interventional'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Treatment Detail Pages',
      pattern: '/treatments/[slug]',
      type: 'dynamic',
      category: 'strategic',
      inSitemap: true,
      entityCount: treatmentsCount,
      examples: ['/treatments/sertraline', '/treatments/cognitive-behavioral-therapy'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Tools Directory',
      pattern: '/tools',
      type: 'static',
      category: 'strategic',
      inSitemap: true,
      entityCount: 1,
      examples: ['/tools'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Tools Hub Pages',
      pattern: '/tools/[hub]',
      type: 'static',
      category: 'strategic',
      inSitemap: true,
      entityCount: 9,
      examples: ['/tools/anxiety-stress', '/tools/mood-depression', '/tools/for-clinicians'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Tool Detail Pages',
      pattern: '/tools/[slug]',
      type: 'dynamic',
      category: 'strategic',
      inSitemap: false,
      entityCount: 30, // Estimated
      examples: ['/tools/headspace', '/tools/betterhelp'],
      seoStatus: 'warning',
      issues: ['Individual tool pages may need sitemap inclusion'],
    },
    {
      name: 'Resources Hub',
      pattern: '/resources',
      type: 'static',
      category: 'strategic',
      inSitemap: true,
      entityCount: 1,
      examples: ['/resources'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Resource Detail Pages',
      pattern: '/resources/[slug]',
      type: 'dynamic',
      category: 'supporting',
      inSitemap: true,
      entityCount: resourcesCount,
      examples: ['/resources/gad-7', '/resources/phq-9'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Guide Pages (Programmatic)',
      pattern: '/guide/[slug]',
      type: 'programmatic',
      category: 'strategic',
      inSitemap: false,
      entityCount: 500, // Estimated based on combinations
      examples: ['/guide/lexapro-for-anxiety', '/guide/zoloft-for-depression', '/guide/lexapro-vs-zoloft'],
      seoStatus: 'warning',
      issues: ['Guide pages need sitemap inclusion', 'Index eligibility gate active - only qualifying pages indexed'],
    },
    {
      name: 'PsychTrails',
      pattern: '/psychtrails',
      type: 'static',
      category: 'strategic',
      inSitemap: true,
      entityCount: 1,
      examples: ['/psychtrails'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Search',
      pattern: '/search',
      type: 'static',
      category: 'utility',
      inSitemap: true,
      entityCount: 1,
      examples: ['/search'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'API Routes',
      pattern: '/api/**',
      type: 'dynamic',
      category: 'private',
      inSitemap: false,
      entityCount: 20,
      examples: ['/api/conditions/[slug]', '/api/search'],
      seoStatus: 'healthy',
      issues: [],
    },
    {
      name: 'Debug Pages',
      pattern: '/debug',
      type: 'static',
      category: 'private',
      inSitemap: false,
      entityCount: 1,
      examples: ['/debug'],
      seoStatus: 'healthy',
      issues: [],
    },
  ];

  // P0 Issues (Fixed)
  const p0Issues = [
    {
      id: 'P0-001',
      severity: 'critical' as const,
      description: 'Fake freshness timestamps in sitemap - all static pages claimed lastModified=currentDate',
      location: 'src/app/sitemap.ts',
      status: 'fixed' as const,
    },
    {
      id: 'P0-002',
      severity: 'critical' as const,
      description: 'Missing OAI-SearchBot in robots.txt - ChatGPT Search crawler not explicitly allowed',
      location: 'src/app/robots.ts',
      status: 'fixed' as const,
    },
    {
      id: 'P0-003',
      severity: 'critical' as const,
      description: 'Deleted route /psychtrails/map included in sitemap - pointing to 404',
      location: 'src/app/sitemap.ts',
      status: 'fixed' as const,
    },
    {
      id: 'P0-004',
      severity: 'critical' as const,
      description: 'Tools directory completely missing from sitemap - 10+ hub pages not discoverable',
      location: 'src/app/sitemap.ts',
      status: 'fixed' as const,
    },
  ];

  // P1 Issues (Pending)
  const p1Issues = [
    {
      id: 'P1-001',
      severity: 'high' as const,
      description: 'Guide pages (/guide/[slug]) not in sitemap - programmatic pages need sitemap generation',
      location: 'src/app/sitemap.ts',
      status: 'pending' as const,
    },
    {
      id: 'P1-002',
      severity: 'high' as const,
      description: 'Individual tool detail pages (/tools/[slug]) not in sitemap',
      location: 'src/app/sitemap.ts',
      status: 'pending' as const,
    },
    {
      id: 'P1-003',
      severity: 'high' as const,
      description: 'Index eligibility uses heuristic demand scores instead of real Search Console data',
      location: 'src/lib/programmatic-seo/index-eligibility.ts',
      status: 'pending' as const,
    },
    {
      id: 'P1-004',
      severity: 'high' as const,
      description: 'llms.txt claims 10,000+ pages but actual count is lower',
      location: 'public/llms.txt',
      status: 'pending' as const,
    },
    {
      id: 'P1-005',
      severity: 'high' as const,
      description: 'No CI gates for sitemap integrity - fake freshness could be reintroduced',
      location: 'CI configuration',
      status: 'in_progress' as const,
    },
  ];

  // Calculate totals
  const totalEntities = conditionsCount + treatmentsCount + resourcesCount;
  const indexableRoutes = routeFamilies.filter((rf) => rf.inSitemap).reduce((sum, rf) => sum + rf.entityCount, 0);

  const inventory: SEOInventory = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRoutes: routeFamilies.length,
      totalEntities,
      indexableRoutes,
      sitemapUrls: indexableRoutes,
      routeFamilies: routeFamilies.length,
      healthScore: Math.round(((p0Issues.filter((i) => i.status === 'fixed').length / p0Issues.length) * 100)),
      criticalIssues: p0Issues.filter((i) => i.status !== 'fixed').length,
      warnings: p1Issues.length,
    },
    routeFamilies,
    p0Issues,
    p1Issues,
    entityCounts: {
      conditions: conditionsCount,
      treatments: treatmentsCount,
      resources: resourcesCount,
      tools: 30, // Estimated
      guides: 500, // Estimated
      providers: 0, // Provider pages from database
    },
  };

  return inventory;
}

// Run if executed directly
if (require.main === module) {
  const inventory = generateInventory();
  console.log(JSON.stringify(inventory, null, 2));
}

export { generateInventory, type SEOInventory, type RouteFamily };

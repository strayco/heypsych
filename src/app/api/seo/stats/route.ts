/**
 * SEO Stats Dashboard API
 *
 * Shows exactly how we're crushing WebMD:
 * - Total pages generated
 * - Coverage by entity
 * - Content depth scores
 * - Indexing status
 *
 * GET /api/seo/stats
 *
 * PROTECTED: Requires admin authentication
 */

import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth/admin-auth';
import {
  getDynamicPageStats,
  generateDynamicPageConfigs
} from '@/lib/programmatic-seo/dynamic-generator';
import {
  getEntitySaturationScore,
  getPublishingVelocity
} from '@/lib/programmatic-seo/webmd-killer';
import {
  getAllTreatmentSlugs,
  getAllConditionSlugs
} from '@/lib/programmatic-seo/data-loader';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Require admin authentication
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // Get core stats
    const pageStats = await getDynamicPageStats();
    const velocity = await getPublishingVelocity();
    
    // Get entity counts
    const treatmentSlugs = await getAllTreatmentSlugs();
    const conditionSlugs = await getAllConditionSlugs();
    
    // Get saturation for top entities
    const topEntities = ['anxiety', 'depression', 'adhd', 'bipolar', 'ocd'];
    const saturationScores = await Promise.all(
      topEntities.map(async (entity) => {
        const score = await getEntitySaturationScore(entity);
        return score;
      })
    );

    // Calculate WebMD comparison
    const webmdComparison = {
      heypsych: {
        totalPages: pageStats.total,
        pagesPerCondition: Math.round(pageStats.total / conditionSlugs.length),
        demographicCoverage: true,
        comparisonPages: pageStats.byType['treatment-vs-treatment'] || 0,
        freshnessSignal: 'Updated today',
      },
      webmd: {
        totalPages: '~5,000 (estimated)',
        pagesPerCondition: '~30 (estimated)',
        demographicCoverage: false,
        comparisonPages: '~50 (estimated)',
        freshnessSignal: 'Updated 6-24 months ago',
      },
      advantage: {
        totalPagesMultiplier: `${Math.round(pageStats.total / 5000)}x more pages`,
        longtailCoverage: 'We cover queries they don\'t have pages for',
        freshness: 'We show "Updated today" vs their stale dates',
        demographics: 'We have age-specific pages they don\'t',
      },
    };

    return NextResponse.json({
      status: 'DOMINATING',
      timestamp: new Date().toISOString(),
      
      // Core metrics
      totalProgrammaticPages: pageStats.total,
      pagesByType: pageStats.byType,
      pagesBySearchVolume: pageStats.bySearchVolume,
      
      // Content base
      entityCounts: {
        treatments: treatmentSlugs.length,
        conditions: conditionSlugs.length,
        totalCombinations: treatmentSlugs.length * conditionSlugs.length,
      },
      
      // Top performers
      topTreatments: pageStats.topTreatments.slice(0, 5),
      topConditions: pageStats.topConditions.slice(0, 5),
      
      // Saturation scores (topic authority)
      entitySaturation: saturationScores,
      
      // Publishing velocity
      velocity: {
        pagesPerWeek: velocity.pagesPerWeek,
        totalPages: velocity.totalPages,
        growthRate: velocity.growthRate,
        lastPublished: velocity.lastPublished,
      },
      
      // WebMD comparison
      vsWebMD: webmdComparison,
      
      // Quick actions
      actions: {
        notifySearchEngines: 'POST /api/seo/notify-engines',
        sitemap: '/sitemap-guide.xml',
        guideHub: '/guide',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


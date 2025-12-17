/**
 * Assessments Sitemap Route
 *
 * Serves sitemap for all assessment/screening tool pages.
 * https://yourdomain.com/sitemap-assessments.xml
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/config/database';
import type { Entity } from '@/lib/types/database';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    // Fetch all assessment resources
    const { data: assessments } = await supabase
      .from('entities')
      .select('*')
      .eq('type', 'resource')
      .eq('status', 'active')
      .or('metadata->>category.eq.assessments-screeners,data->>category.eq.assessments-screeners')
      .order('title');

    // Return empty sitemap if no assessments found (better than 404 for GSC)
    const generator = getSitemapGenerator();
    const xml = await generator.generateAssessmentsSitemap((assessments || []) as unknown as Entity[]);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Failed to generate assessments sitemap:', error);
    return new NextResponse('Failed to generate assessments sitemap', {
      status: 500,
    });
  }
}

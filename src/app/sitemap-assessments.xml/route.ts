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
    const { data: assessments, error } = await supabase
      .from('entities')
      .select('*')
      .eq('type', 'resource')
      .eq('status', 'active')
      .order('title');

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Filter for assessments category
    const filteredAssessments = assessments?.filter(a =>
      a.metadata?.category === 'assessments-screeners' ||
      a.data?.category === 'assessments-screeners'
    ) || [];

    const generator = getSitemapGenerator();
    const xml = await generator.generateAssessmentsSitemap(filteredAssessments as unknown as Entity[]);

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

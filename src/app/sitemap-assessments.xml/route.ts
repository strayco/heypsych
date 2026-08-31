/**
 * Assessments Sitemap Route
 *
 * Serves sitemap for all assessment/screening tool pages.
 * https://yourdomain.com/sitemap-assessments.xml
 */

import { NextResponse } from 'next/server';
import { supabaseOptional } from '@/lib/config/database';
import type { Entity } from '@/lib/types/database';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    const db = supabaseOptional();
    if (!db) {
      return new NextResponse('Database unavailable', { status: 503 });
    }

    // Fetch all assessment resources
    const { data: assessments, error } = await db
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
    const filteredAssessments = assessments?.filter(a => {
      const metadataCategory = (a.metadata as any)?.category;
      return metadataCategory === 'assessments-screeners';
    }) || [];

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

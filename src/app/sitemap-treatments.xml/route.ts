/**
 * Treatments Sitemap Route
 *
 * Serves sitemap for all treatment pages (medications, therapies, etc.).
 * https://yourdomain.com/sitemap-treatments.xml
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/config/database';
import type { Entity } from '@/lib/types/database';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    // Fetch all treatment-related entities
    const { data: treatments } = await supabase
      .from('entities')
      .select('*')
      .in('type', [
        'medication',
        'therapy',
        'treatment',
        'interventional',
        'alternative',
        'supplement',
        'investigational',
      ])
      .eq('status', 'active')
      .order('title');

    if (!treatments) {
      return new NextResponse('No treatments found', { status: 404 });
    }

    const generator = getSitemapGenerator();
    const xml = await generator.generateTreatmentsSitemap(treatments as Entity[]);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Failed to generate treatments sitemap:', error);
    return new NextResponse('Failed to generate treatments sitemap', {
      status: 500,
    });
  }
}

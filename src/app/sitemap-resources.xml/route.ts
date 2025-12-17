/**
 * Resources Sitemap Route
 *
 * Serves sitemap for all resource pages (excluding assessments).
 * https://yourdomain.com/sitemap-resources.xml
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/config/database';
import type { Entity } from '@/lib/types/database';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    // Fetch all resource entities (excluding assessments)
    const { data: resources, error } = await supabase
      .from('entities')
      .select('*')
      .eq('type', 'resource')
      .eq('status', 'active')
      .order('title');

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Filter out assessments
    const filteredResources = resources?.filter(r => {
      const metadataCategory = (r.metadata as any)?.category;
      const dataCategory = (r.data as any)?.category;
      return metadataCategory !== 'assessments-screeners' && dataCategory !== 'assessments-screeners';
    }) || [];

    const generator = getSitemapGenerator();
    const xml = await generator.generateResourcesSitemap(filteredResources as unknown as Entity[]);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Failed to generate resources sitemap:', error);
    return new NextResponse('Failed to generate resources sitemap', {
      status: 500,
    });
  }
}

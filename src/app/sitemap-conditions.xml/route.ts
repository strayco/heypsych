/**
 * Conditions Sitemap Route
 *
 * Serves sitemap for all condition pages.
 * https://yourdomain.com/sitemap-conditions.xml
 */

import { NextResponse } from 'next/server';
import { EntityService } from '@/lib/data/entity-service';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    const conditions = await EntityService.getByType('condition');
    const activeConditions = conditions.filter((c) => c.status === 'active');

    const generator = getSitemapGenerator();
    const xml = await generator.generateConditionsSitemap(activeConditions);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Failed to generate conditions sitemap:', error);
    return new NextResponse('Failed to generate conditions sitemap', {
      status: 500,
    });
  }
}

/**
 * Hubs Sitemap Route
 *
 * Serves sitemap for all hub/category pages.
 * https://yourdomain.com/sitemap-hubs.xml
 */

import { NextResponse } from 'next/server';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate hourly

export async function GET() {
  try {
    const generator = getSitemapGenerator();
    const xml = await generator.generateHubsSitemap();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Failed to generate hubs sitemap:', error);
    return new NextResponse('Failed to generate hubs sitemap', {
      status: 500,
    });
  }
}

/**
 * Sitemap Index Route
 *
 * Serves the main sitemap index pointing to all sub-sitemaps.
 * https://yourdomain.com/sitemap-index.xml
 */

import { NextResponse } from 'next/server';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    const generator = getSitemapGenerator();
    const xml = await generator.generateSitemapIndex();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Failed to generate sitemap index:', error);
    return new NextResponse('Failed to generate sitemap index', {
      status: 500,
    });
  }
}

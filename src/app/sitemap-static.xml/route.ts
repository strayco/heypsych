/**
 * Static Pages Sitemap Route
 *
 * Serves sitemap for static pages (home, about, etc.).
 * https://yourdomain.com/sitemap-static.xml
 */

import { NextResponse } from 'next/server';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    const generator = getSitemapGenerator();
    const xml = await generator.generateStaticSitemap();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Failed to generate static sitemap:', error);
    return new NextResponse('Failed to generate static sitemap', {
      status: 500,
    });
  }
}

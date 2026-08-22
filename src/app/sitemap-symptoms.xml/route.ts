/**
 * Symptoms Sitemap Route
 *
 * Serves sitemap for all indexable symptom pages.
 * Only includes symptoms that pass the quality gate.
 * https://yourdomain.com/sitemap-symptoms.xml
 */

import { NextResponse } from 'next/server';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    const generator = getSitemapGenerator();
    const xml = await generator.generateSymptomsSitemap();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Failed to generate symptoms sitemap:', error);
    return new NextResponse('Failed to generate symptoms sitemap', {
      status: 500,
    });
  }
}

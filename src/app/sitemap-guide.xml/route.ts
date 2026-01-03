/**
 * Sitemap for Programmatic SEO Pages
 * 
 * Dynamically generates sitemap for thousands of long-tail guide pages.
 * This crawls your JSON files and generates URLs for all valid combinations.
 */

import { NextResponse } from 'next/server';
import { generateDynamicPageConfigs } from '@/lib/programmatic-seo/dynamic-generator';
import { SITE_CONFIG } from '@/lib/seo/config';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    const baseUrl = SITE_CONFIG.url.trim().replace(/\/+$/, '');
    const configs = await generateDynamicPageConfigs();
    const now = new Date().toISOString();

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${configs.map(config => `  <url>
    <loc>${baseUrl}/guide/${config.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${getChangeFreq(config.searchVolume)}</changefreq>
    <priority>${getPriority(config.priority, config.searchVolume)}</priority>
  </url>`).join('\n')}
</urlset>`;

    console.log(`[Sitemap] Generated sitemap with ${configs.length} guide pages`);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('[Sitemap] Error generating guide sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}

function getChangeFreq(searchVolume: string): string {
  switch (searchVolume) {
    case 'high':
      return 'weekly';
    case 'medium':
      return 'weekly';
    case 'low':
      return 'monthly';
    default:
      return 'weekly';
  }
}

function getPriority(priority: number, searchVolume: string): string {
  // Priority 1 = highest value pages
  // Search volume also affects priority
  
  if (priority === 1 && searchVolume === 'high') return '0.9';
  if (priority === 1) return '0.8';
  if (priority === 2 && searchVolume === 'high') return '0.8';
  if (priority === 2) return '0.7';
  if (priority === 3) return '0.6';
  return '0.5';
}

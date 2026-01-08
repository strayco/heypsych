/**
 * Sitemap for Programmatic SEO Pages
 *
 * Dynamically generates sitemap for thousands of long-tail guide pages.
 * ONLY includes indexable pages - noindex pages are excluded to avoid crawl budget waste.
 */

import { NextResponse } from 'next/server';
import { generateDynamicPageConfigs } from '@/lib/programmatic-seo/dynamic-generator';
import { generatePageContent } from '@/lib/programmatic-seo/content-engine';
import { checkIndexEligibility } from '@/lib/programmatic-seo/index-eligibility';
import { SITE_CONFIG } from '@/lib/seo/config';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    const baseUrl = SITE_CONFIG.url.trim().replace(/\/+$/, '');
    const allConfigs = await generateDynamicPageConfigs();

    // Filter to only indexable pages
    console.log(`[Sitemap] Filtering ${allConfigs.length} pages for index eligibility...`);
    const indexableConfigs = [];

    for (const config of allConfigs) {
      const content = await generatePageContent(config);
      if (!content) continue;

      const eligibility = checkIndexEligibility(config, content);
      if (eligibility.isIndexable) {
        indexableConfigs.push(config);
      }
    }

    console.log(`[Sitemap] ${indexableConfigs.length} of ${allConfigs.length} pages are indexable`);
    const configs = indexableConfigs;
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

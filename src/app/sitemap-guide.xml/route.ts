/**
 * Sitemap for Programmatic SEO Pages
 *
 * Lists the indexable /guide/* pages. Noindex pages are excluded to avoid crawl
 * budget waste; the decision comes from the Central Indexation Firewall
 * (src/lib/seo/index-decision-service.ts) via getGuideSitemapEntries().
 *
 * Built once at build time. Guide pages are generated from data/ files, which
 * only change with a deploy, and computing the list compares ~4,000 generated
 * pages with each other. Run per request it took about a minute on a cold
 * instance and longer on a warm one, and timed out at 300 seconds in
 * production (2026-11-12). See src/lib/programmatic-seo/guide-sitemap.ts.
 *
 * SITEMAP FRESHNESS POLICY: no lastmod. Guide pages are programmatic and have
 * no real update date; a generated date would tell crawlers every page changed.
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#lastmod
 *
 * There is no try/catch on purpose: a failure fails the build, so the previous
 * deployment keeps serving its sitemap instead of a static error page.
 */

import { NextResponse } from 'next/server';
import { getGuideSitemapEntries, renderGuideSitemapXml } from '@/lib/programmatic-seo/guide-sitemap';
import { SITE_CONFIG } from '@/lib/seo/config';

export const dynamic = 'force-static';

export async function GET() {
  const entries = await getGuideSitemapEntries();
  const xml = renderGuideSitemapXml(SITE_CONFIG.url, entries);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

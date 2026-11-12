/**
 * Entries for /sitemap-guide.xml.
 *
 * Every guide page is derived from the treatment and condition files in data/,
 * so the list only changes when those files change, which means a deploy.
 * The route therefore builds it once at build time (force-static) rather than
 * per request.
 *
 * Each candidate page is compared with the pages before it in
 * generateDynamicPageConfigs() order. That comparison set is local to this call:
 * it used to be the similarity engine's process-wide store, which on a warm
 * serverless instance already held every page from earlier runs. A second run
 * then compared each page with all ~4,000 others instead of the ones before it,
 * took about twice as long (the cause of the 300-second timeouts on
 * 2026-11-12), and listed a different set of URLs.
 */

import { generateDynamicPageConfigs, parseDynamicSlug } from './dynamic-generator';
import type { DynamicPageConfig } from './dynamic-generator';
import { generatePageContent } from './content-engine';
import { createFingerprint, checkSiblingUniqueness } from './similarity-engine';
import type { ContentFingerprint } from './similarity-engine';
import { makeGuideIndexDecision } from '@/lib/seo/index-decision-service';

export interface GuideSitemapEntry {
  slug: string;
  changefreq: string;
  priority: string;
}

export async function getGuideSitemapEntries(): Promise<GuideSitemapEntry[]> {
  const allConfigs = await generateDynamicPageConfigs();
  const compared = new Map<string, ContentFingerprint>();
  const entries: GuideSitemapEntry[] = [];

  for (const config of allConfigs) {
    // Only list URLs that resolve to a page: the page parses its slug back
    // with parseDynamicSlug, and anything it cannot parse is a 404.
    if (!/^[a-z0-9-]+$/.test(config.slug) || !(await parseDynamicSlug(config.slug))) continue;
    const content = await generatePageContent(config);
    if (!content) continue;

    const fingerprint = createFingerprint(config, content);
    compared.set(config.slug, fingerprint);
    const uniqueness = checkSiblingUniqueness(fingerprint, compared.values());

    // Central Indexation Firewall (src/lib/seo/index-decision-service.ts).
    const decision = makeGuideIndexDecision(config.slug, {
      pageType: config.pageType,
      wordCount: content.wordCount,
      uniquenessScore: uniqueness.isUnique ? 1 - uniqueness.highestSimilarity : uniqueness.highestSimilarity,
      safetyScore: content.disclaimerLevel === 'critical' ? 0.9 : 0.8,
      hasDemographicContent: !!config.demographic,
    });

    if (decision.sitemapEligible) {
      entries.push({
        slug: config.slug,
        changefreq: getChangeFreq(config.searchVolume),
        priority: getPriority(config.priority, config.searchVolume),
      });
    }
  }

  return entries;
}

export function renderGuideSitemapXml(baseUrl: string, entries: GuideSitemapEntry[]): string {
  const base = baseUrl.trim().replace(/\/+$/, '');
  // No lastmod: guide pages are programmatic and have no real update date, and
  // a request-time date would tell crawlers every page changed.
  // @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#lastmod
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>${base}/guide/${e.slug}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

function getChangeFreq(searchVolume: DynamicPageConfig['searchVolume']): string {
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

function getPriority(priority: number, searchVolume: DynamicPageConfig['searchVolume']): string {
  // Priority 1 = highest value pages; search volume also affects priority.
  if (priority === 1 && searchVolume === 'high') return '0.9';
  if (priority === 1) return '0.8';
  if (priority === 2 && searchVolume === 'high') return '0.8';
  if (priority === 2) return '0.7';
  if (priority === 3) return '0.6';
  return '0.5';
}

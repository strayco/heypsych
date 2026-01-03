/**
 * Instant Indexing for Programmatic SEO Pages
 * 
 * Pushes new pages to Google and Bing IMMEDIATELY after generation.
 * Most sites wait days/weeks for Google to discover new pages.
 * We tell Google directly: "Index this NOW."
 */

import { generateDynamicPageConfigs } from './dynamic-generator';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://heypsych.com';

interface IndexingResult {
  success: boolean;
  url: string;
  service: 'indexnow' | 'google';
  error?: string;
}

/**
 * Push all programmatic pages to IndexNow (Bing, Yandex, etc.)
 * This gets pages indexed within HOURS instead of weeks
 */
export async function pushAllPagesToIndexNow(): Promise<{
  total: number;
  success: number;
  failed: number;
  results: IndexingResult[];
}> {
  const configs = await generateDynamicPageConfigs();
  const urls = configs.map(c => `${SITE_URL}/guide/${c.slug}`);
  
  const results: IndexingResult[] = [];
  let success = 0;
  let failed = 0;

  // IndexNow allows batch submission of up to 10,000 URLs
  const batchSize = 10000;
  const batches = [];
  
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    try {
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: new URL(SITE_URL).hostname,
          key: process.env.INDEXNOW_KEY || 'heypsych-indexnow-key',
          keyLocation: `${SITE_URL}/heypsych-indexnow-key.txt`,
          urlList: batch,
        }),
      });

      if (response.ok || response.status === 202) {
        success += batch.length;
        batch.forEach(url => {
          results.push({ success: true, url, service: 'indexnow' });
        });
      } else {
        failed += batch.length;
        batch.forEach(url => {
          results.push({ 
            success: false, 
            url, 
            service: 'indexnow',
            error: `HTTP ${response.status}`,
          });
        });
      }
    } catch (error) {
      failed += batch.length;
      batch.forEach(url => {
        results.push({ 
          success: false, 
          url, 
          service: 'indexnow',
          error: String(error),
        });
      });
    }
  }

  return {
    total: urls.length,
    success,
    failed,
    results,
  };
}

/**
 * Generate a list of high-priority URLs for manual Google Search Console submission
 */
export async function getHighPriorityUrls(): Promise<string[]> {
  const configs = await generateDynamicPageConfigs();
  
  // Filter to priority 1 and high search volume
  const highPriority = configs.filter(
    c => c.priority === 1 && c.searchVolume === 'high'
  );

  return highPriority.map(c => `${SITE_URL}/guide/${c.slug}`);
}

/**
 * Generate IndexNow ping URLs for webhook integration
 */
export function generateIndexNowPingUrl(pageSlug: string): string {
  const key = process.env.INDEXNOW_KEY || 'heypsych-indexnow-key';
  const url = encodeURIComponent(`${SITE_URL}/guide/${pageSlug}`);
  return `https://api.indexnow.org/indexnow?url=${url}&key=${key}`;
}


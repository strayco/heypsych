/**
 * Search Engine Notification Webhook
 * 
 * Call this after deploying new content to immediately notify:
 * - Bing/Yandex via IndexNow
 * - Google via sitemap ping (legacy but still works)
 * 
 * Usage: POST /api/seo/notify-engines
 * Body: { "urls": ["/guide/lexapro-for-anxiety"] } or { "all": true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDynamicPageConfigs } from '@/lib/programmatic-seo/dynamic-generator';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://heypsych.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'heypsych-indexnow-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const results: Array<{ service: string; success: boolean; message: string }> = [];

    let urlsToSubmit: string[] = [];

    if (body.all) {
      // Submit all programmatic pages
      const configs = await generateDynamicPageConfigs();
      urlsToSubmit = configs.map(c => `${SITE_URL}/guide/${c.slug}`);
    } else if (body.urls && Array.isArray(body.urls)) {
      // Submit specific URLs
      urlsToSubmit = body.urls.map((u: string) => 
        u.startsWith('http') ? u : `${SITE_URL}${u}`
      );
    } else {
      return NextResponse.json({ error: 'Provide "urls" array or "all": true' }, { status: 400 });
    }

    // 1. Submit to IndexNow (Bing, Yandex, Seznam, Naver)
    try {
      const indexNowResponse = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: new URL(SITE_URL).hostname,
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: urlsToSubmit.slice(0, 10000), // Max 10k per request
        }),
      });

      results.push({
        service: 'IndexNow',
        success: indexNowResponse.ok || indexNowResponse.status === 202,
        message: `Submitted ${urlsToSubmit.length} URLs, status: ${indexNowResponse.status}`,
      });
    } catch (error) {
      results.push({
        service: 'IndexNow',
        success: false,
        message: String(error),
      });
    }

    // 2. Ping Google sitemap (legacy method, still helps)
    try {
      const googlePing = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(`${SITE_URL}/sitemap-index.xml`)}`
      );
      
      results.push({
        service: 'Google Sitemap Ping',
        success: googlePing.ok,
        message: `Status: ${googlePing.status}`,
      });
    } catch (error) {
      results.push({
        service: 'Google Sitemap Ping',
        success: false,
        message: String(error),
      });
    }

    // 3. Ping Bing sitemap
    try {
      const bingPing = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(`${SITE_URL}/sitemap-index.xml`)}`
      );
      
      results.push({
        service: 'Bing Sitemap Ping',
        success: bingPing.ok,
        message: `Status: ${bingPing.status}`,
      });
    } catch (error) {
      results.push({
        service: 'Bing Sitemap Ping',
        success: false,
        message: String(error),
      });
    }

    return NextResponse.json({
      submitted: urlsToSubmit.length,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// GET endpoint to check status
export async function GET() {
  const configs = await generateDynamicPageConfigs();
  
  return NextResponse.json({
    totalProgrammaticPages: configs.length,
    indexNowKeyConfigured: !!process.env.INDEXNOW_KEY,
    sitemapUrl: `${SITE_URL}/sitemap-guide.xml`,
    usage: 'POST with { "all": true } or { "urls": ["/guide/..."] }',
  });
}


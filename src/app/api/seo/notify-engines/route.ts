/**
 * Search Engine Notification Webhook
 *
 * Notifies search engines when content is published or updated.
 * - Bing/Yandex via IndexNow
 * - Google via sitemap ping
 *
 * SECURITY:
 * - Requires ADMIN_API_SECRET authentication in production
 * - Validates URLs are within site origin
 * - Rate limited via Upstash
 *
 * Usage:
 *   POST /api/seo/notify-engines
 *   Authorization: Bearer <ADMIN_API_SECRET>
 *   Body: { "urls": ["/guide/lexapro-for-anxiety"] } or { "all": true }
 */

import { NextRequest, NextResponse } from "next/server";
import { generateDynamicPageConfigs } from "@/lib/programmatic-seo/dynamic-generator";
import {
  withAdminAuth,
  filterValidSiteUrls,
  createSafeStatusResponse,
} from "@/lib/auth/admin-auth";
import { checkRateLimitStrict, apiRateLimit } from "@/lib/rate-limit";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://heypsych.com";

// IndexNow key must be configured in production - no fallback
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

async function handlePost(request: NextRequest): Promise<NextResponse> {
  // Apply strict rate limiting (fails closed in production)
  const rateLimitResult = await checkRateLimitStrict(request, apiRateLimit);
  if (rateLimitResult) return rateLimitResult;

  // In production, IndexNow key must be configured
  if (process.env.NODE_ENV === "production" && !INDEXNOW_KEY) {
    console.error("SECURITY: IndexNow key not configured");
    return NextResponse.json(
      { error: "Endpoint not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const results: Array<{
      service: string;
      success: boolean;
      message: string;
    }> = [];

    let urlsToSubmit: string[] = [];

    if (body.all === true) {
      // Submit all programmatic pages
      const configs = await generateDynamicPageConfigs();
      urlsToSubmit = configs.map((c) => `${SITE_URL}/guide/${c.slug}`);
    } else if (body.urls) {
      // Validate and filter URLs to site origin only
      const rawUrls = Array.isArray(body.urls) ? body.urls : [];
      const validPaths = filterValidSiteUrls(rawUrls);

      if (validPaths.length === 0) {
        return NextResponse.json(
          { error: "No valid URLs provided. URLs must be relative paths or match site origin." },
          { status: 400 }
        );
      }

      urlsToSubmit = validPaths.map((u) =>
        u.startsWith("http") ? u : `${SITE_URL}${u}`
      );
    } else {
      return NextResponse.json(
        { error: 'Provide "urls" array or "all": true' },
        { status: 400 }
      );
    }

    // Cap URLs per request
    if (urlsToSubmit.length > 10000) {
      urlsToSubmit = urlsToSubmit.slice(0, 10000);
    }

    // 1. Submit to IndexNow (Bing, Yandex, Seznam, Naver)
    if (INDEXNOW_KEY) {
      try {
        const indexNowResponse = await fetch(
          "https://api.indexnow.org/indexnow",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              host: new URL(SITE_URL).hostname,
              key: INDEXNOW_KEY,
              keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
              urlList: urlsToSubmit,
            }),
          }
        );

        results.push({
          service: "IndexNow",
          success: indexNowResponse.ok || indexNowResponse.status === 202,
          message: `Submitted ${urlsToSubmit.length} URLs, status: ${indexNowResponse.status}`,
        });
      } catch (error) {
        results.push({
          service: "IndexNow",
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // 2. Ping Google sitemap (legacy method)
    try {
      const googlePing = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(`${SITE_URL}/sitemap-index.xml`)}`
      );

      results.push({
        service: "Google Sitemap Ping",
        success: googlePing.ok,
        message: `Status: ${googlePing.status}`,
      });
    } catch (error) {
      results.push({
        service: "Google Sitemap Ping",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // 3. Ping Bing sitemap
    try {
      const bingPing = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(`${SITE_URL}/sitemap-index.xml`)}`
      );

      results.push({
        service: "Bing Sitemap Ping",
        success: bingPing.ok,
        message: `Status: ${bingPing.status}`,
      });
    } catch (error) {
      results.push({
        service: "Bing Sitemap Ping",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return NextResponse.json({
      submitted: urlsToSubmit.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withAdminAuth(
    request,
    {
      secretEnvVar: "ADMIN_API_SECRET",
      allowDevBypass: true,
      maxBodySize: 65536,
    },
    handlePost
  );
}

// GET endpoint for status check - does not expose secrets
export async function GET(): Promise<NextResponse> {
  const configs = await generateDynamicPageConfigs();

  return createSafeStatusResponse({
    totalProgrammaticPages: configs.length,
    indexNowConfigured: !!process.env.INDEXNOW_KEY,
    sitemapUrl: `${SITE_URL}/sitemap-guide.xml`,
    usage:
      'POST with Authorization: Bearer <secret> and body: { "all": true } or { "urls": ["/guide/..."] }',
  });
}

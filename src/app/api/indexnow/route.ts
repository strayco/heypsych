/**
 * IndexNow API Route
 *
 * Instantly notify Bing, Yandex, and other search engines when content is updated.
 *
 * SECURITY:
 * - Requires INDEXNOW_SECRET authentication via Authorization header
 * - Requires INDEXNOW_KEY to be configured in production
 * - Validates URLs are within site origin
 * - Fails closed if secrets not configured
 *
 * Usage:
 *   POST /api/indexnow
 *   Authorization: Bearer <INDEXNOW_SECRET>
 *   Body: { urls: ["/treatments/lexapro", "/conditions/depression"] }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  withAdminAuth,
  filterValidSiteUrls,
  createSafeStatusResponse,
} from "@/lib/auth/admin-auth";
import { checkRateLimitStrict, apiRateLimit } from "@/lib/rate-limit";

// IndexNow key must be configured in production - no fallback
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const SITE_HOST = "heypsych.com";
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];

interface IndexNowRequest {
  url?: string;
  urls?: string[];
}

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

function normalizeUrl(url: string): string {
  // If it's a relative URL, make it absolute
  if (url.startsWith("/")) {
    return `https://${SITE_HOST}${url}`;
  }
  // If it doesn't have protocol, add it
  if (!url.startsWith("http")) {
    return `https://${SITE_HOST}/${url}`;
  }
  return url;
}

async function handlePost(request: NextRequest): Promise<NextResponse> {
  // Apply strict rate limiting (fails closed in production)
  const rateLimitResult = await checkRateLimitStrict(request, apiRateLimit);
  if (rateLimitResult) return rateLimitResult;

  // In production, IndexNow key must be configured
  if (process.env.NODE_ENV === "production" && !INDEXNOW_KEY) {
    console.error("SECURITY: INDEXNOW_KEY not configured");
    return NextResponse.json(
      { error: "Endpoint not configured" },
      { status: 503 }
    );
  }

  try {
    const body: IndexNowRequest = await request.json();

    // Collect and validate URLs
    const rawUrls: string[] = [];
    if (body.url && typeof body.url === "string") {
      rawUrls.push(body.url);
    }
    if (body.urls && Array.isArray(body.urls)) {
      rawUrls.push(...body.urls);
    }

    // Filter to valid site URLs only
    const validUrls = filterValidSiteUrls(rawUrls);

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs provided. URLs must be relative paths or match site origin." },
        { status: 400 }
      );
    }

    // Normalize URLs to absolute form
    let urlList = validUrls.map(normalizeUrl);

    // IndexNow limit is 10,000 URLs per request
    if (urlList.length > 10000) {
      urlList = urlList.slice(0, 10000);
    }

    // Use the configured key in production, fallback for dev
    const keyToUse = INDEXNOW_KEY || "dev-key";

    const payload: IndexNowPayload = {
      host: SITE_HOST,
      key: keyToUse,
      keyLocation: `https://${SITE_HOST}/${keyToUse}.txt`,
      urlList,
    };

    // Submit to all IndexNow endpoints
    const results = await Promise.allSettled(
      INDEXNOW_ENDPOINTS.map((endpoint) =>
        fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
      )
    );

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok
    ).length;

    // Log without exposing the key
    console.log(
      `IndexNow: Submitted ${urlList.length} URLs to ${successCount}/${INDEXNOW_ENDPOINTS.length} endpoints`
    );

    return NextResponse.json({
      success: true,
      submitted: urlList.length,
      endpoints: successCount,
      urls: urlList.slice(0, 10), // Show first 10 for confirmation
    });
  } catch (error) {
    console.error("IndexNow error:", error);
    return NextResponse.json(
      { error: "Failed to submit to IndexNow" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withAdminAuth(
    request,
    {
      secretEnvVar: "INDEXNOW_SECRET",
      allowDevBypass: true,
      maxBodySize: 65536,
    },
    handlePost
  );
}

// GET endpoint for status check - does not expose key value
export async function GET(): Promise<NextResponse> {
  return createSafeStatusResponse({
    enabled: true,
    host: SITE_HOST,
    indexNowKeyConfigured: !!process.env.INDEXNOW_KEY,
    endpoints: INDEXNOW_ENDPOINTS,
    usage:
      'POST with Authorization: Bearer <secret> and body: { "urls": ["/path/..."] }',
  });
}

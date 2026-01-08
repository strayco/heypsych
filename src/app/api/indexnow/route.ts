/**
 * IndexNow API Route
 * 
 * Instantly notify Bing, Yandex, and other search engines when content is updated.
 * This gets pages indexed within minutes instead of waiting for crawlers.
 * 
 * Usage:
 * POST /api/indexnow
 * Body: { urls: ["/treatments/lexapro", "/conditions/depression"] }
 * 
 * Or for single URL:
 * Body: { url: "/treatments/lexapro" }
 */

import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "heypsych-indexnow-key";
const SITE_HOST = "heypsych.com";
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  // Yandex uses the same protocol
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

export async function POST(request: NextRequest) {
  try {
    // Verify API key for security (optional - you can add auth)
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.INDEXNOW_SECRET || "dev-secret"}`;
    
    if (process.env.NODE_ENV === "production" && authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: IndexNowRequest = await request.json();
    
    // Normalize URLs
    let urlList: string[] = [];
    
    if (body.url) {
      urlList.push(normalizeUrl(body.url));
    }
    
    if (body.urls && Array.isArray(body.urls)) {
      urlList.push(...body.urls.map(normalizeUrl));
    }
    
    if (urlList.length === 0) {
      return NextResponse.json(
        { error: "No URLs provided" },
        { status: 400 }
      );
    }
    
    // IndexNow limit is 10,000 URLs per request
    if (urlList.length > 10000) {
      urlList = urlList.slice(0, 10000);
    }
    
    const payload: IndexNowPayload = {
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
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
    
    console.log(`📤 IndexNow: Submitted ${urlList.length} URLs to ${successCount}/${INDEXNOW_ENDPOINTS.length} endpoints`);
    
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

// GET endpoint to check status
export async function GET() {
  return NextResponse.json({
    enabled: true,
    host: SITE_HOST,
    keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
    endpoints: INDEXNOW_ENDPOINTS,
  });
}



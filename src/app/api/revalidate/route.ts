/**
 * On-demand Revalidation Endpoint
 *
 * Triggers Next.js ISR revalidation for specific paths.
 *
 * SECURITY:
 * - Requires REVALIDATE_SECRET authentication via Authorization header
 * - Fails closed if secret not configured in production
 * - Validates paths are within site
 *
 * Usage:
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   Body: { "path": "/treatments/happify" } or { "clearAll": true }
 */

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  withAdminAuth,
  validateSiteUrl,
} from "@/lib/auth/admin-auth";
import { checkRateLimitStrict, apiRateLimit } from "@/lib/rate-limit";

async function handlePost(request: NextRequest): Promise<NextResponse> {
  // Apply strict rate limiting (fails closed in production)
  const rateLimitResult = await checkRateLimitStrict(request, apiRateLimit);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const path = body.path;
    const clearAll = body.clearAll === true;

    if (clearAll) {
      // Revalidate common resource paths
      const resourceSlugs = [
        "betterhelp",
        "calm",
        "cbt-i-coach",
        "deepscribe",
        "daylio",
        "happify",
        "headspace",
        "insight-timer",
        "mindshift-cbt",
        "moodfit",
        "ptsd-coach",
        "rootd",
        "talkspace",
        "woebot",
        "wysa",
      ];

      const paths = resourceSlugs.flatMap((slug) => [
        `/treatments/${slug}`,
        `/conditions/${slug}`,
        `/resources/${slug}`,
      ]);

      for (const p of paths) {
        revalidatePath(p);
      }

      return NextResponse.json({
        revalidated: true,
        count: paths.length,
        message: `Revalidated ${paths.length} paths`,
      });
    }

    if (!path) {
      return NextResponse.json(
        { error: "Missing path or clearAll parameter" },
        { status: 400 }
      );
    }

    // Validate path is within site
    if (typeof path !== "string" || !validateSiteUrl(path)) {
      return NextResponse.json(
        { error: "Invalid path. Must be a relative path starting with /" },
        { status: 400 }
      );
    }

    // Ensure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    revalidatePath(normalizedPath);

    return NextResponse.json({ revalidated: true, path: normalizedPath });
  } catch (error) {
    return NextResponse.json(
      { error: "Error revalidating", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withAdminAuth(
    request,
    {
      secretEnvVar: "REVALIDATE_SECRET",
      allowDevBypass: true,
      maxBodySize: 4096,
    },
    handlePost
  );
}

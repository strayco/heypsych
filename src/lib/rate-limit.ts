/**
 * Rate limiting utilities using Upstash Redis
 *
 * Configure in Vercel:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 *
 * Get free tier at: https://console.upstash.com/
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Only create Redis client if environment variables are set
let redis: Redis | null = null;
let isRateLimitEnabled = false;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  isRateLimitEnabled = true;
}

/**
 * Create rate limiters for different use cases
 * If Redis is not configured, rate limiting is disabled (development mode)
 */

// Newsletter: Very restrictive to prevent spam
export const newsletterRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 requests per hour per IP
      analytics: true,
      prefix: "ratelimit:newsletter",
    })
  : null;

// Provider search: Moderate to prevent database overload
export const searchRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
      analytics: true,
      prefix: "ratelimit:search",
    })
  : null;

// General API: Generous but prevents abuse
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
      analytics: true,
      prefix: "ratelimit:api",
    })
  : null;

// Admin login: Very strict to prevent brute force
export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 minutes
      analytics: true,
      prefix: "ratelimit:login",
    })
  : null;

// Demo requests: Restrictive to prevent email spam
export const demoRequestRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 per hour per IP
      analytics: true,
      prefix: "ratelimit:demo",
    })
  : null;

// Lead capture: Moderate restriction
export const leadCaptureRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 per hour per IP
      analytics: true,
      prefix: "ratelimit:leads",
    })
  : null;

/**
 * Get client IP from request headers
 */
export function getClientIp(req: NextRequest): string {
  // Try multiple headers as different proxies use different ones
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Fallback for unknown IP
  return "unknown";
}

/**
 * Apply rate limit to API route
 * Returns null if request is allowed, or NextResponse with 429 if rate limited
 *
 * IMPORTANT: For admin endpoints, use checkRateLimitStrict() which fails closed
 * in production when rate limiting is not configured.
 */
export async function checkRateLimit(
  req: NextRequest,
  limiter: Ratelimit | null
): Promise<NextResponse | null> {
  // If rate limiting is not enabled (no Redis configured), allow all requests
  if (!isRateLimitEnabled || !limiter) {
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️  Rate limiting disabled - configure Upstash Redis for production");
    }
    return null; // Allow request
  }

  const ip = getClientIp(req);

  try {
    const { success, limit, reset } = await limiter.limit(ip);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Too many requests",
          message: "You have exceeded the rate limit. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(reset).toISOString(),
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }
  } catch (error) {
    // Fail open: if rate limiter is unreachable (DNS, network, etc.), allow request
    // This prevents rate limiter outages from taking down the entire API
    console.error("[rate-limit] Redis connection failed, allowing request:",
      error instanceof Error ? error.message : error);
    return null;
  }

  // Request allowed
  return null;
}

/**
 * Apply rate limit with FAIL CLOSED behavior for admin endpoints
 *
 * In production:
 * - If rate limiting is not configured, returns 503 (Service Unavailable)
 * - Admin endpoints MUST have rate limiting to prevent abuse
 *
 * In development:
 * - Allows requests without rate limiting (for local testing)
 * - Logs a warning about missing configuration
 *
 * @returns null if allowed, NextResponse if blocked (429 or 503)
 */
export async function checkRateLimitStrict(
  req: NextRequest,
  limiter: Ratelimit | null
): Promise<NextResponse | null> {
  const isProduction = process.env.NODE_ENV === "production";

  // FAIL CLOSED: In production, rate limiting MUST be enabled
  if (!isRateLimitEnabled || !limiter) {
    if (isProduction) {
      console.error("SECURITY: Rate limiting not configured - blocking admin request");
      return NextResponse.json(
        { error: "Service not properly configured" },
        { status: 503 }
      );
    }
    // Development: allow but warn
    console.log("⚠️  Rate limiting disabled - configure Upstash Redis for production");
    return null;
  }

  // Apply standard rate limiting
  return checkRateLimit(req, limiter);
}

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitingEnabled(): boolean {
  return isRateLimitEnabled;
}

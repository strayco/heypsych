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
  const { success, limit, reset, remaining } = await limiter.limit(ip);

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

  // Request allowed
  return null;
}

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitingEnabled(): boolean {
  return isRateLimitEnabled;
}
